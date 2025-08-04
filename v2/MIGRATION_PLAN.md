# RSS Feeds Migration Plan: JSON → Cloudflare D1

## Overview
**Goal**: Migrate from JSON file storage to Cloudflare D1 database while maintaining 100% uptime and keeping current system as fallback.

**Strategy**: Parallel migration with gradual transition
**Timeline**: 4 weeks
**Risk**: Low (current system keeps running)

## Pre-Migration Setup

### 1. Install Dependencies
```bash
npm install wrangler@latest
npm install @cloudflare/workers-types
```

### 2. Create D1 Database
```bash
# Create database
wrangler d1 create markets-feeds

# Update wrangler.toml with database ID
[[d1_databases]]
binding = "DB"
database_name = "markets-feeds"
database_id = "your-database-id-here"
```

### 3. Initialize Schema
```bash
# Apply schema
wrangler d1 execute markets-feeds --file=./schema.sql

# Verify tables
wrangler d1 execute markets-feeds --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Phase 1: Immediate Optimizations (Week 1)
**Status**: Keep JSON system running, add safety measures

### Day 1-2: Data Retention
```bash
# Create cleanup script
touch src/scripts/cleanup-old-articles.ts

# Add to package.json
"cleanup": "tsx src/scripts/cleanup-old-articles.ts"

# Run weekly cleanup
0 0 * * 0 npm run cleanup
```

### Day 3-4: Feed Frequency Optimization
```typescript
// Update feeds.config.json intervals
// High frequency feeds: 120min → 240min  
// Medium frequency feeds: 180min → 360min
// Low frequency feeds: 360min → 720min
```

### Day 5-7: Monitoring Setup
```typescript
// Add performance monitoring
// Track memory usage, load times, article counts
// Set up alerts for growth rates
```

## Phase 2: D1 Infrastructure (Week 2)
**Status**: Build D1 layer alongside JSON system

### Day 8-10: D1 Data Layer
```typescript
// src/lib/db.ts - D1 abstraction layer
export class DatabaseService {
  constructor(private db: D1Database) {}
  
  async insertArticle(article: Article): Promise<void>
  async getArticles(options: QueryOptions): Promise<Article[]>
  async searchArticles(query: string): Promise<Article[]>
  async getStats(): Promise<Stats>
}
```

### Day 11-12: Migration Scripts
```typescript
// src/scripts/migrate-to-d1.ts
// Migrate existing JSON articles to D1
// Handle duplicates and data validation
```

### Day 13-14: Dual Write System
```typescript
// Modify feed fetcher to write to both systems
// JSON (primary) + D1 (secondary)
// Compare results for validation
```

## Phase 3: Gradual Transition (Week 3)
**Status**: Switch reads to D1, keep JSON as backup

### Day 15-17: Read Migration
```typescript
// Create feature flag system
const USE_D1_FOR_READS = process.env.USE_D1 === 'true';

// Update data-loader.ts
async loadData(): Promise<FeedItem[]> {
  if (USE_D1_FOR_READS) {
    try {
      return await this.loadFromD1();
    } catch (error) {
      console.error('D1 failed, falling back to JSON:', error);
      return await this.loadFromJSON();
    }
  }
  return await this.loadFromJSON();
}
```

### Day 18-19: Performance Testing
```bash
# Load testing with D1
# Compare performance metrics
# Monitor error rates
```

### Day 20-21: Production Switch
```bash
# Enable D1 reads in production
wrangler secret put USE_D1 --value="true"

# Monitor for 48 hours
# Keep JSON system active
```

## Phase 4: Full Migration (Week 4)
**Status**: D1 primary, JSON backup only

### Day 22-24: Write Migration
```typescript
// Switch to D1 primary writes
// Keep JSON as backup for critical data
// Remove dual-write complexity
```

### Day 25-26: Cleanup & Optimization
```bash
# Remove old JSON processing code
# Optimize D1 queries
# Set up automated backups
```

### Day 27-28: Monitoring & Documentation
```bash
# Set up D1 monitoring dashboards
# Document new architecture
# Create runbooks for operations
```

## Implementation Details

### 1. Current System Preservation
```typescript
// src/lib/data-loader-legacy.ts
// Keep entire current system intact
// Only modify entry points for gradual migration
```

### 2. Feature Flags
```typescript
// src/config/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_D1_READS: process.env.USE_D1_READS === 'true',
  USE_D1_WRITES: process.env.USE_D1_WRITES === 'true',
  ENABLE_JSON_FALLBACK: process.env.JSON_FALLBACK !== 'false',
};
```

### 3. Error Handling
```typescript
// Robust fallback system
class DataService {
  async getData(): Promise<Article[]> {
    if (FEATURE_FLAGS.USE_D1_READS) {
      try {
        return await this.d1Service.getArticles();
      } catch (error) {
        this.logError('D1 read failed', error);
        if (FEATURE_FLAGS.ENABLE_JSON_FALLBACK) {
          return await this.jsonService.getArticles();
        }
        throw error;
      }
    }
    return await this.jsonService.getArticles();
  }
}
```

### 4. Data Validation
```typescript
// Compare D1 vs JSON results during transition
async validateMigration(): Promise<ValidationReport> {
  const jsonData = await this.jsonService.getArticles();
  const d1Data = await this.d1Service.getArticles();
  
  return {
    totalArticles: { json: jsonData.length, d1: d1Data.length },
    missingInD1: jsonData.filter(j => !d1Data.find(d => d.id === j.id)),
    duplicatesInD1: this.findDuplicates(d1Data),
    performanceMetrics: { /* ... */ }
  };
}
```

## Rollback Plan

### Emergency Rollback (Immediate)
```bash
# Disable D1 reads
wrangler secret put USE_D1_READS --value="false"

# Current JSON system continues working
# Zero downtime rollback
```

### Planned Rollback (If needed)
```bash
# Gradually reduce D1 usage
# Increase JSON system reliability
# Export D1 data back to JSON if needed
```

## Success Metrics

### Performance Targets
- **Page load time**: <500ms (vs current 2-3s)
- **Search response**: <200ms (vs current 500ms+)
- **Memory usage**: <10MB per request (vs current 50-100MB)

### Reliability Targets  
- **Uptime**: 99.9% (same as current)
- **Error rate**: <0.1%
- **Fallback success**: 100% (JSON always works)

### Cost Targets
- **D1 usage**: <80% of free tier limits
- **Total cost**: $0 (stay within free tiers)

## Risk Mitigation

### Technical Risks
1. **D1 service issues**: JSON fallback always available
2. **Data corruption**: Validation and backups
3. **Performance regression**: Gradual rollout with monitoring

### Operational Risks  
1. **Deployment issues**: Blue-green deployment
2. **Monitoring gaps**: Comprehensive alerting
3. **Knowledge gaps**: Documentation and training

## Timeline Summary

| Week | Focus | Current System | D1 System | Risk Level |
|------|-------|----------------|-----------|------------|
| 1 | Optimization | ✅ Primary | ❌ None | 🟢 Low |
| 2 | Infrastructure | ✅ Primary | 🔧 Building | 🟢 Low |  
| 3 | Gradual Migration | ✅ Backup | 🧪 Testing | 🟡 Medium |
| 4 | Full Migration | 🔧 Backup | ✅ Primary | 🟡 Medium |

## Next Steps

1. **Review this plan** with team
2. **Set up D1 database** (5 minutes)
3. **Begin Phase 1 optimizations** (current system improvements)
4. **Schedule weekly checkpoints** for progress review

**Key Principle**: Current system keeps working throughout entire migration. Zero-risk approach with maximum upside.