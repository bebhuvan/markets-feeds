/**
 * Site-level caching policy for Markets Feeds v2
 * Ensures fast, reliable experience without stale data
 */

export interface CacheConfig {
  name: string;
  ttl: number;
  maxSize: number;
  description: string;
}

/**
 * Centralized cache configuration for the entire site
 */
export const CACHE_POLICY = {
  // Data loading - short TTL for financial data freshness
  DATA_LOADER: {
    name: 'DataLoader',
    ttl: 5 * 60 * 1000, // 5 minutes - financial data needs to be fresh
    maxSize: 1,
    description: 'Main feed data cache'
  } as CacheConfig,

  // Search index - medium TTL, rebuilt when data changes
  SEARCH_INDEX: {
    name: 'SearchIndex', 
    ttl: 15 * 60 * 1000, // 15 minutes - can be slightly stale for performance
    maxSize: 1,
    description: 'Search engine index cache'
  } as CacheConfig,

  // Content enhancement - longer TTL as processing is expensive
  CONTENT_ENHANCEMENT: {
    name: 'ContentEnhancement',
    ttl: 60 * 60 * 1000, // 1 hour - content analysis doesn't change often
    maxSize: 5000, // 5K articles max
    description: 'Enhanced content processing cache'
  } as CacheConfig,

  // Page rendering - very short TTL for SSR pages
  PAGE_CACHE: {
    name: 'PageCache',
    ttl: 2 * 60 * 1000, // 2 minutes - pages need fresh data
    maxSize: 100,
    description: 'Rendered page cache'
  } as CacheConfig,

  // Static assets - long TTL as they don't change often
  STATIC_ASSETS: {
    name: 'StaticAssets',
    ttl: 24 * 60 * 60 * 1000, // 24 hours - CSS, JS, images
    maxSize: 1000,
    description: 'Static file cache'
  } as CacheConfig
} as const;

/**
 * Cache invalidation strategies
 */
export const CACHE_INVALIDATION = {
  // Force refresh when new data arrives
  ON_NEW_DATA: ['DataLoader', 'SearchIndex', 'PageCache'],
  
  // Daily cleanup of old entries
  DAILY_CLEANUP: ['ContentEnhancement'],
  
  // Manual invalidation for admin actions
  MANUAL_REFRESH: ['DataLoader', 'SearchIndex', 'PageCache', 'ContentEnhancement']
} as const;

/**
 * Cache performance monitoring
 */
export class CacheMonitor {
  private static instance: CacheMonitor;
  private metrics: Map<string, {
    hits: number;
    misses: number;
    errors: number;
    lastAccess: number;
  }> = new Map();

  static getInstance(): CacheMonitor {
    if (!this.instance) {
      this.instance = new CacheMonitor();
    }
    return this.instance;
  }

  recordHit(cacheName: string): void {
    const metrics = this.metrics.get(cacheName) || { hits: 0, misses: 0, errors: 0, lastAccess: 0 };
    metrics.hits++;
    metrics.lastAccess = Date.now();
    this.metrics.set(cacheName, metrics);
  }

  recordMiss(cacheName: string): void {
    const metrics = this.metrics.get(cacheName) || { hits: 0, misses: 0, errors: 0, lastAccess: 0 };
    metrics.misses++;
    metrics.lastAccess = Date.now();
    this.metrics.set(cacheName, metrics);
  }

  recordError(cacheName: string): void {
    const metrics = this.metrics.get(cacheName) || { hits: 0, misses: 0, errors: 0, lastAccess: 0 };
    metrics.errors++;
    metrics.lastAccess = Date.now();
    this.metrics.set(cacheName, metrics);
  }

  recordCacheClear(cacheName: string): void {
    // Reset metrics for cleared cache
    this.metrics.set(cacheName, { hits: 0, misses: 0, errors: 0, lastAccess: Date.now() });
    console.log(`🗑️ Cache cleared: ${cacheName} at ${new Date().toISOString()}`);
  }

  getMetrics(): Record<string, { hitRate: number; errorRate: number; totalRequests: number }> {
    const result: Record<string, any> = {};
    
    for (const [cacheName, metrics] of this.metrics.entries()) {
      const total = metrics.hits + metrics.misses;
      result[cacheName] = {
        hitRate: total > 0 ? metrics.hits / total : 0,
        errorRate: total > 0 ? metrics.errors / total : 0,
        totalRequests: total
      };
    }
    
    return result;
  }

  /**
   * Get cache health summary
   */
  getHealthSummary(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    for (const [cacheName, metrics] of this.metrics.entries()) {
      const total = metrics.hits + metrics.misses;
      const hitRate = total > 0 ? metrics.hits / total : 0;
      const errorRate = total > 0 ? metrics.errors / total : 0;

      // Check hit rate
      if (hitRate < 0.3 && total > 100) {
        issues.push(`${cacheName} has low hit rate: ${(hitRate * 100).toFixed(1)}%`);
        recommendations.push(`Consider increasing TTL for ${cacheName} or improving cache strategy`);
        status = 'warning';
      }

      // Check error rate
      if (errorRate > 0.05) {
        issues.push(`${cacheName} has high error rate: ${(errorRate * 100).toFixed(1)}%`);
        recommendations.push(`Investigate ${cacheName} cache errors and add better error handling`);
        status = 'critical';
      }

      // Check if cache is being used
      if (total === 0) {
        issues.push(`${cacheName} is not being used`);
        recommendations.push(`Verify ${cacheName} cache implementation`);
        if (status === 'healthy') status = 'warning';
      }
    }

    return { status, issues, recommendations };
  }
}

/**
 * Base cache interface that all caches should implement
 */
export interface CacheInterface<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  size(): number;
  getStats(): { hits: number; misses: number; size: number };
}

/**
 * Cache utilities
 */
export class CacheUtils {
  /**
   * Generate consistent cache key
   */
  static generateKey(...parts: string[]): string {
    return parts.join(':').replace(/[^a-zA-Z0-9:_-]/g, '_');
  }

  /**
   * Check if TTL is expired
   */
  static isExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl;
  }

  /**
   * Get human readable cache age
   */
  static getCacheAge(timestamp: number): string {
    const ageMs = Date.now() - timestamp;
    const ageMinutes = Math.floor(ageMs / (60 * 1000));
    
    if (ageMinutes < 1) return 'less than 1 minute';
    if (ageMinutes < 60) return `${ageMinutes} minutes`;
    
    const ageHours = Math.floor(ageMinutes / 60);
    if (ageHours < 24) return `${ageHours} hours`;
    
    const ageDays = Math.floor(ageHours / 24);
    return `${ageDays} days`;
  }

  /**
   * Force cache refresh for specific cache type
   */
  static async invalidateCache(cacheName: string): Promise<void> {
    console.log(`🗑️ Invalidating cache: ${cacheName}`);
    
    // This would trigger cache refresh in actual implementation
    // For now, just log the action
    const timestamp = new Date().toISOString();
    console.log(`Cache ${cacheName} invalidated at ${timestamp}`);
  }
}

// Export singleton cache monitor
export const cacheMonitor = CacheMonitor.getInstance();