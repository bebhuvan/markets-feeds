globalThis.process ??= {}; globalThis.process.env ??= {};
const CACHE_POLICY = {
  // Data loading - short TTL for financial data freshness
  DATA_LOADER: {
    name: "DataLoader",
    ttl: 5 * 60 * 1e3,
    // 5 minutes - financial data needs to be fresh
    maxSize: 1,
    description: "Main feed data cache"
  },
  // Search index - medium TTL, rebuilt when data changes
  SEARCH_INDEX: {
    name: "SearchIndex",
    ttl: 15 * 60 * 1e3,
    // 15 minutes - can be slightly stale for performance
    maxSize: 1,
    description: "Search engine index cache"
  },
  // Content enhancement - longer TTL as processing is expensive
  CONTENT_ENHANCEMENT: {
    name: "ContentEnhancement",
    ttl: 60 * 60 * 1e3,
    // 1 hour - content analysis doesn't change often
    maxSize: 5e3,
    // 5K articles max
    description: "Enhanced content processing cache"
  },
  // Page rendering - very short TTL for SSR pages
  PAGE_CACHE: {
    name: "PageCache",
    ttl: 2 * 60 * 1e3,
    // 2 minutes - pages need fresh data
    maxSize: 100,
    description: "Rendered page cache"
  },
  // Static assets - long TTL as they don't change often
  STATIC_ASSETS: {
    name: "StaticAssets",
    ttl: 24 * 60 * 60 * 1e3,
    // 24 hours - CSS, JS, images
    maxSize: 1e3,
    description: "Static file cache"
  }
};
class CacheMonitor {
  static instance;
  metrics = /* @__PURE__ */ new Map();
  static getInstance() {
    if (!this.instance) {
      this.instance = new CacheMonitor();
    }
    return this.instance;
  }
  recordHit(cacheName) {
    const metrics = this.metrics.get(cacheName) || { hits: 0, misses: 0, errors: 0, lastAccess: 0 };
    metrics.hits++;
    metrics.lastAccess = Date.now();
    this.metrics.set(cacheName, metrics);
  }
  recordMiss(cacheName) {
    const metrics = this.metrics.get(cacheName) || { hits: 0, misses: 0, errors: 0, lastAccess: 0 };
    metrics.misses++;
    metrics.lastAccess = Date.now();
    this.metrics.set(cacheName, metrics);
  }
  recordError(cacheName) {
    const metrics = this.metrics.get(cacheName) || { hits: 0, misses: 0, errors: 0, lastAccess: 0 };
    metrics.errors++;
    metrics.lastAccess = Date.now();
    this.metrics.set(cacheName, metrics);
  }
  recordCacheClear(cacheName) {
    this.metrics.set(cacheName, { hits: 0, misses: 0, errors: 0, lastAccess: Date.now() });
    console.log(`🗑️ Cache cleared: ${cacheName} at ${(/* @__PURE__ */ new Date()).toISOString()}`);
  }
  getMetrics() {
    const result = {};
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
  getHealthSummary() {
    const issues = [];
    const recommendations = [];
    let status = "healthy";
    for (const [cacheName, metrics] of this.metrics.entries()) {
      const total = metrics.hits + metrics.misses;
      const hitRate = total > 0 ? metrics.hits / total : 0;
      const errorRate = total > 0 ? metrics.errors / total : 0;
      if (hitRate < 0.3 && total > 100) {
        issues.push(`${cacheName} has low hit rate: ${(hitRate * 100).toFixed(1)}%`);
        recommendations.push(`Consider increasing TTL for ${cacheName} or improving cache strategy`);
        status = "warning";
      }
      if (errorRate > 0.05) {
        issues.push(`${cacheName} has high error rate: ${(errorRate * 100).toFixed(1)}%`);
        recommendations.push(`Investigate ${cacheName} cache errors and add better error handling`);
        status = "critical";
      }
      if (total === 0) {
        issues.push(`${cacheName} is not being used`);
        recommendations.push(`Verify ${cacheName} cache implementation`);
        if (status === "healthy") status = "warning";
      }
    }
    return { status, issues, recommendations };
  }
}
const cacheMonitor = CacheMonitor.getInstance();

export { CACHE_POLICY as C, cacheMonitor as c };
