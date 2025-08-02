/**
 * RSS/Atom feed fetcher and parser for Markets Feeds v2
 * Fetches and parses RSS feeds, converts to FeedItem format
 */

import type { FeedItem } from '../types';

export interface FeedConfig {
  id: string;
  name: string;
  url: string;
  sourceId: string;
  category: string;
  fetchInterval: number;
  active: boolean;
}

export interface FeedFetchResult {
  success: boolean;
  sourceId: string;
  items: FeedItem[];
  error?: string;
  responseTime: number;
  lastFetched: string;
  itemCount: number;
}

export interface ParsedFeedMeta {
  title: string;
  description?: string;
  lastBuildDate?: string;
  language?: string;
  generator?: string;
}

export class FeedFetcher {
  private static instance: FeedFetcher;
  private fetchHistory: Map<string, FeedFetchResult> = new Map();
  
  static getInstance(): FeedFetcher {
    if (!this.instance) {
      this.instance = new FeedFetcher();
    }
    return this.instance;
  }

  /**
   * Fetch and parse a single RSS/Atom feed
   */
  async fetchFeed(config: FeedConfig): Promise<FeedFetchResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Fetching feed: ${config.name} (${config.url})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(config.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Markets-Feeds-Bot/2.0 (+https://markets-feeds.com)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const xmlText = await response.text();
      const items = await this.parseXmlToFeedItems(xmlText, config);
      
      const result: FeedFetchResult = {
        success: true,
        sourceId: config.sourceId,
        items,
        responseTime: Date.now() - startTime,
        lastFetched: new Date().toISOString(),
        itemCount: items.length
      };
      
      this.fetchHistory.set(config.sourceId, result);
      console.log(`✅ Fetched ${items.length} items from ${config.name} in ${result.responseTime}ms`);
      
      return result;
      
    } catch (error) {
      const result: FeedFetchResult = {
        success: false,
        sourceId: config.sourceId,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        lastFetched: new Date().toISOString(),
        itemCount: 0
      };
      
      this.fetchHistory.set(config.sourceId, result);
      console.error(`❌ Failed to fetch ${config.name}: ${result.error}`);
      
      return result;
    }
  }

  /**
   * Fetch multiple feeds concurrently
   */
  async fetchMultipleFeeds(configs: FeedConfig[]): Promise<FeedFetchResult[]> {
    const activeConfigs = configs.filter(c => c.active);
    console.log(`🚀 Fetching ${activeConfigs.length} active feeds...`);
    
    const promises = activeConfigs.map(config => this.fetchFeed(config));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          sourceId: activeConfigs[index].sourceId,
          items: [],
          error: result.reason?.message || 'Promise rejected',
          responseTime: 0,
          lastFetched: new Date().toISOString(),
          itemCount: 0
        };
      }
    });
  }

  /**
   * Parse XML (RSS/Atom) to FeedItem array
   */
  private async parseXmlToFeedItems(xmlText: string, config: FeedConfig): Promise<FeedItem[]> {
    const items: FeedItem[] = [];
    
    try {
      // Basic XML parsing (in a real implementation, you'd use a proper XML parser)
      // For Cloudflare compatibility, we'll use simple regex parsing
      
      const isAtom = xmlText.includes('<feed') && xmlText.includes('xmlns="http://www.w3.org/2005/Atom"');
      
      if (isAtom) {
        // Parse Atom feed
        const entryMatches = xmlText.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi);
        if (entryMatches) {
          for (const entryXml of entryMatches) {
            const item = this.parseAtomEntry(entryXml, config);
            if (item) items.push(item);
          }
        }
      } else {
        // Parse RSS feed
        const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi);
        if (itemMatches) {
          for (const itemXml of itemMatches) {
            const item = this.parseRssItem(itemXml, config);
            if (item) items.push(item);
          }
        }
      }
      
    } catch (error) {
      console.error('Error parsing XML:', error);
      throw new Error(`Failed to parse feed XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return items;
  }

  /**
   * Parse RSS <item> to FeedItem
   */
  private parseRssItem(itemXml: string, config: FeedConfig): FeedItem | null {
    try {
      const title = this.extractTextContent(itemXml, 'title');
      const link = this.extractTextContent(itemXml, 'link');
      const description = this.extractTextContent(itemXml, 'description') || 
                         this.extractTextContent(itemXml, 'content:encoded');
      const pubDate = this.extractTextContent(itemXml, 'pubDate');
      const guid = this.extractTextContent(itemXml, 'guid') || link;
      
      if (!title || !link) {
        return null; // Skip items without title or link
      }
      
      // Generate unique ID
      const contentHash = this.generateHash(title + link + description);
      const id = `${config.sourceId}-${contentHash}`;
      
      const item: FeedItem = {
        id,
        sourceId: config.sourceId,
        sourceName: config.name,
        title: this.cleanText(title),
        url: link.trim(),
        summary: this.cleanText(description?.slice(0, 300) || ''),
        fullContent: this.cleanText(description || ''),
        publishedAt: this.parseDate(pubDate) || new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        category: config.category,
        tags: [config.category],
        priority: 'normal',
        contentHash
      };
      
      return item;
      
    } catch (error) {
      console.error('Error parsing RSS item:', error);
      return null;
    }
  }

  /**
   * Parse Atom <entry> to FeedItem
   */
  private parseAtomEntry(entryXml: string, config: FeedConfig): FeedItem | null {
    try {
      const title = this.extractTextContent(entryXml, 'title');
      const linkMatch = entryXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
      const link = linkMatch?.[1];
      const summary = this.extractTextContent(entryXml, 'summary') || 
                     this.extractTextContent(entryXml, 'content');
      const updated = this.extractTextContent(entryXml, 'updated') ||
                     this.extractTextContent(entryXml, 'published');
      const id = this.extractTextContent(entryXml, 'id') || link;
      
      if (!title || !link) {
        return null;
      }
      
      const contentHash = this.generateHash(title + link + summary);
      const itemId = `${config.sourceId}-${contentHash}`;
      
      const item: FeedItem = {
        id: itemId,
        sourceId: config.sourceId,
        sourceName: config.name,
        title: this.cleanText(title),
        url: link.trim(),
        summary: this.cleanText(summary?.slice(0, 300) || ''),
        fullContent: this.cleanText(summary || ''),
        publishedAt: this.parseDate(updated) || new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        category: config.category,
        tags: [config.category],
        priority: 'normal',
        contentHash
      };
      
      return item;
      
    } catch (error) {
      console.error('Error parsing Atom entry:', error);
      return null;
    }
  }

  /**
   * Extract text content from XML element
   */
  private extractTextContent(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Clean text content (remove HTML, decode entities)
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Parse date string to ISO format
   */
  private parseDate(dateStr: string | null): string | null {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  }

  /**
   * Generate simple hash for content
   */
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get fetch history for a source
   */
  getFetchHistory(sourceId: string): FeedFetchResult | null {
    return this.fetchHistory.get(sourceId) || null;
  }

  /**
   * Get all fetch history
   */
  getAllFetchHistory(): Map<string, FeedFetchResult> {
    return new Map(this.fetchHistory);
  }

  /**
   * Clear fetch history
   */
  clearHistory(): void {
    this.fetchHistory.clear();
  }
}

// Export singleton instance
export const feedFetcher = FeedFetcher.getInstance();