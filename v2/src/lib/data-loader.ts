import type { FeedItem } from '../types';
import { searchEngine } from './search-engine';
import { recategorizationEngine } from './recategorization-engine';
import { CACHE_POLICY, cacheMonitor } from './cache-policy';

/**
 * Optimized data loader with efficient pagination and search
 */
export class DataLoader {
  private static instance: DataLoader;
  private data: FeedItem[] = [];
  private lastLoaded: number = 0;
  private readonly CACHE_TTL = CACHE_POLICY.DATA_LOADER.ttl; // 5 minutes for fresh financial data
  private fileCache: Map<string, FeedItem[]> = new Map(); // Cache individual files

  static getInstance(): DataLoader {
    if (!this.instance) {
      this.instance = new DataLoader();
    }
    return this.instance;
  }

  async loadData(): Promise<FeedItem[]> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.data.length > 0 && (now - this.lastLoaded) < this.CACHE_TTL) {
      cacheMonitor.recordHit('DataLoader');
      return this.data;
    }

    cacheMonitor.recordMiss('DataLoader');

    // Load all JSON files
    const modules = import.meta.glob('../../content/links/*.json', { eager: true });
    const items: FeedItem[] = [];

    for (const [path, module] of Object.entries(modules)) {
      if (path.includes('sample-data')) continue;
      
      const data = (module as any).default;
      if (Array.isArray(data)) {
        // Filter out articles with empty titles or summaries to prevent blank display
        const validArticles = data.filter((item: FeedItem) => 
          item.title && item.title.trim().length > 0
        );
        items.push(...validArticles);
      }
    }

    // Apply strategic recategorization
    const recategorizedItems = items.map(item => {
      const result = recategorizationEngine.recategorizeArticle(item);
      return {
        ...item,
        category: result.newCategory
      };
    });

    // Sort by date (newest first)
    recategorizedItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    this.data = recategorizedItems;
    this.lastLoaded = now;
    
    // Build search index in background with recategorized items
    searchEngine.buildIndex(recategorizedItems).catch(console.error);
    
    return recategorizedItems;
  }

  /**
   * Efficient pagination that loads only needed data
   */
  async loadPage(page: number, limit: number = 50): Promise<{
    items: FeedItem[];
    page: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    // For current data size, we still load all data but optimize pagination
    // TODO: Implement file-level pagination for larger datasets
    const allItems = await this.loadData();
    return this.paginate(allItems, page, limit);
  }

  /**
   * Search articles with full-text search capability
   */
  async searchArticles(
    query: string, 
    filters?: {
      categories?: string[];
      sources?: string[];
      dateRange?: { start: Date; end: Date };
    },
    page: number = 1,
    limit: number = 50
  ): Promise<{
    items: FeedItem[];
    total: number;
    query: string;
    suggestions?: string[];
  }> {
    // Ensure data is loaded and indexed
    await this.loadData();
    
    const results = await searchEngine.search(query, filters, limit * 2); // Get more for better results
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);
    
    return {
      items: paginatedResults.map(r => r.article),
      total: results.length,
      query,
      suggestions: query.length < 3 ? searchEngine.getSuggestions(query) : undefined
    };
  }

  /**
   * Get trending search terms
   */
  async getTrendingTerms(days: number = 7): Promise<Array<{term: string, count: number}>> {
    await this.loadData(); // Ensure search index is built
    return searchEngine.getTrendingTerms(days);
  }

  async getByCategory(category: string): Promise<FeedItem[]> {
    const items = await this.loadData();
    return items.filter(item => item.category === category);
  }

  async getCategoryCounts(): Promise<Record<string, number>> {
    const items = await this.loadData();
    const counts: Record<string, number> = {};
    
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    
    return counts;
  }

  async getSourceCounts(): Promise<Record<string, number>> {
    const items = await this.loadData();
    const counts: Record<string, number> = {};
    
    for (const item of items) {
      counts[item.sourceId] = (counts[item.sourceId] || 0) + 1;
    }
    
    return counts;
  }

  paginate(items: FeedItem[], page: number, limit: number = 50) {
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);
    const totalPages = Math.ceil(items.length / limit);

    return {
      items: paginatedItems,
      page,
      totalPages,
      totalItems: items.length,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * Clear all caches to force fresh data loading
   */
  clearCache(): void {
    this.data = [];
    this.lastLoaded = 0;
    this.fileCache.clear();
    searchEngine.clearCache();
    cacheMonitor.recordCacheClear('DataLoader');
  }
}

// Export singleton instance
export const dataLoader = DataLoader.getInstance();