/**
 * Storage abstraction for Cloudflare KV/D1
 * Handles persistent storage of feeds and articles
 */

import type { FeedItem } from '../types';
import type { FeedConfig, FeedFetchResult } from './feed-fetcher';

export interface StorageAdapter {
  // Feed configuration
  getFeeds(): Promise<FeedConfig[]>;
  getFeed(id: string): Promise<FeedConfig | null>;
  saveFeed(feed: FeedConfig): Promise<void>;
  updateFeed(id: string, feed: Partial<FeedConfig>): Promise<void>;
  deleteFeed(id: string): Promise<void>;
  
  // Articles
  saveArticles(articles: FeedItem[]): Promise<void>;
  getArticles(limit?: number, offset?: number): Promise<FeedItem[]>;
  getArticlesByCategory(category: string, limit?: number): Promise<FeedItem[]>;
  getArticleCount(): Promise<number>;
  
  // Fetch history
  saveFetchResult(result: FeedFetchResult): Promise<void>;
  getLastFetchTime(feedId: string): Promise<Date | null>;
  getFetchHistory(limit?: number): Promise<FeedFetchResult[]>;
}

/**
 * In-memory storage (development only)
 */
export class InMemoryStorage implements StorageAdapter {
  private feeds: Map<string, FeedConfig> = new Map();
  private articles: FeedItem[] = [];
  private fetchHistory: FeedFetchResult[] = [];
  private lastFetchTimes: Map<string, Date> = new Map();
  
  async getFeeds(): Promise<FeedConfig[]> {
    return Array.from(this.feeds.values());
  }
  
  async getFeed(id: string): Promise<FeedConfig | null> {
    return this.feeds.get(id) || null;
  }
  
  async saveFeed(feed: FeedConfig): Promise<void> {
    this.feeds.set(feed.id, feed);
  }
  
  async updateFeed(id: string, updates: Partial<FeedConfig>): Promise<void> {
    const existing = this.feeds.get(id);
    if (existing) {
      this.feeds.set(id, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    }
  }
  
  async deleteFeed(id: string): Promise<void> {
    this.feeds.delete(id);
  }
  
  async saveArticles(articles: FeedItem[]): Promise<void> {
    // Add new articles, avoiding duplicates
    const existingIds = new Set(this.articles.map(a => a.id));
    const newArticles = articles.filter(a => !existingIds.has(a.id));
    this.articles.push(...newArticles);
    
    // Sort by date and limit total size
    this.articles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    // Keep only recent articles (e.g., last 10000)
    if (this.articles.length > 10000) {
      this.articles = this.articles.slice(0, 10000);
    }
  }
  
  async getArticles(limit = 50, offset = 0): Promise<FeedItem[]> {
    return this.articles.slice(offset, offset + limit);
  }
  
  async getArticlesByCategory(category: string, limit = 50): Promise<FeedItem[]> {
    return this.articles
      .filter(a => a.category === category)
      .slice(0, limit);
  }
  
  async getArticleCount(): Promise<number> {
    return this.articles.length;
  }
  
  async saveFetchResult(result: FeedFetchResult): Promise<void> {
    this.fetchHistory.push(result);
    this.lastFetchTimes.set(result.sourceId, new Date(result.lastFetched));
    
    // Keep only recent history
    if (this.fetchHistory.length > 1000) {
      this.fetchHistory = this.fetchHistory.slice(-1000);
    }
  }
  
  async getLastFetchTime(feedId: string): Promise<Date | null> {
    return this.lastFetchTimes.get(feedId) || null;
  }
  
  async getFetchHistory(limit = 100): Promise<FeedFetchResult[]> {
    return this.fetchHistory.slice(-limit);
  }
}

/**
 * Cloudflare KV storage adapter
 */
export class KVStorage implements StorageAdapter {
  constructor(private kv: KVNamespace) {}
  
  async getFeeds(): Promise<FeedConfig[]> {
    const list = await this.kv.list({ prefix: 'feed:' });
    const feeds: FeedConfig[] = [];
    
    for (const key of list.keys) {
      const feed = await this.kv.get(key.name, 'json') as FeedConfig;
      if (feed) feeds.push(feed);
    }
    
    return feeds;
  }
  
  async getFeed(id: string): Promise<FeedConfig | null> {
    return await this.kv.get(`feed:${id}`, 'json');
  }
  
  async saveFeed(feed: FeedConfig): Promise<void> {
    await this.kv.put(`feed:${feed.id}`, JSON.stringify(feed));
  }
  
  async updateFeed(id: string, updates: Partial<FeedConfig>): Promise<void> {
    const existing = await this.getFeed(id);
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      await this.saveFeed(updated);
    }
  }
  
  async deleteFeed(id: string): Promise<void> {
    await this.kv.delete(`feed:${id}`);
  }
  
  async saveArticles(articles: FeedItem[]): Promise<void> {
    // In KV, we might save articles in batches by date
    const byDate = new Map<string, FeedItem[]>();
    
    for (const article of articles) {
      const date = new Date(article.publishedAt).toISOString().split('T')[0];
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(article);
    }
    
    // Save each day's articles
    for (const [date, items] of byDate) {
      const existing = await this.kv.get(`articles:${date}`, 'json') as FeedItem[] || [];
      const merged = [...existing, ...items];
      
      // Remove duplicates
      const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
      
      await this.kv.put(`articles:${date}`, JSON.stringify(unique), {
        expirationTtl: 60 * 60 * 24 * 30 // 30 days
      });
    }
  }
  
  async getArticles(limit = 50, offset = 0): Promise<FeedItem[]> {
    // This is simplified - in production, implement proper pagination
    const articles: FeedItem[] = [];
    const dates = this.getRecentDates(30); // Last 30 days
    
    for (const date of dates) {
      const items = await this.kv.get(`articles:${date}`, 'json') as FeedItem[] || [];
      articles.push(...items);
      if (articles.length >= offset + limit) break;
    }
    
    return articles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(offset, offset + limit);
  }
  
  async getArticlesByCategory(category: string, limit = 50): Promise<FeedItem[]> {
    const articles = await this.getArticles(limit * 2); // Get more to filter
    return articles.filter(a => a.category === category).slice(0, limit);
  }
  
  async getArticleCount(): Promise<number> {
    // Approximate count - in production, maintain a counter
    const dates = this.getRecentDates(30);
    let count = 0;
    
    for (const date of dates) {
      const items = await this.kv.get(`articles:${date}`, 'json') as FeedItem[] || [];
      count += items.length;
    }
    
    return count;
  }
  
  async saveFetchResult(result: FeedFetchResult): Promise<void> {
    const history = await this.kv.get('fetch:history', 'json') as FeedFetchResult[] || [];
    history.push(result);
    
    // Keep last 1000 results
    const trimmed = history.slice(-1000);
    await this.kv.put('fetch:history', JSON.stringify(trimmed));
    
    // Update last fetch time
    await this.kv.put(`fetch:last:${result.sourceId}`, result.lastFetched);
  }
  
  async getLastFetchTime(feedId: string): Promise<Date | null> {
    const time = await this.kv.get(`fetch:last:${feedId}`);
    return time ? new Date(time) : null;
  }
  
  async getFetchHistory(limit = 100): Promise<FeedFetchResult[]> {
    const history = await this.kv.get('fetch:history', 'json') as FeedFetchResult[] || [];
    return history.slice(-limit);
  }
  
  private getRecentDates(days: number): string[] {
    const dates: string[] = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }
}

// Export storage instance (configure based on environment)
export const storage: StorageAdapter = new InMemoryStorage();