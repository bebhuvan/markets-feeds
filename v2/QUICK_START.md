# Quick Start: D1 Migration Setup

## Immediate Actions (5 minutes)

### 1. Set up D1 Database
```bash
# Install Wrangler if not already installed
npm install wrangler@latest

# Login to Cloudflare (if not already)
wrangler login

# Create the database
wrangler d1 create markets-feeds
```

**Expected output:**
```
✅ Successfully created DB 'markets-feeds' in region WEUR
database_id = "xxxx-xxxx-xxxx-xxxx"
```

### 2. Update wrangler.toml
```bash
# Copy the database_id from above and update wrangler.toml
# Uncomment and update the D1 section:

[[d1_databases]]
binding = "DB"  
database_name = "markets-feeds"
database_id = "paste-your-database-id-here"
```

### 3. Initialize Database Schema
```bash
# Apply the schema
wrangler d1 execute markets-feeds --file=./schema.sql

# Verify it worked
wrangler d1 execute markets-feeds --command="SELECT COUNT(*) as tables FROM sqlite_master WHERE type='table';"
```

**Expected output:**
```
┌────────┐
│ tables │
├────────┤
│      6 │
└────────┘
```

## Current System Status: ✅ SAFE TO CONTINUE
- Your JSON-based system continues running normally
- No changes to existing functionality
- Zero risk of data loss or downtime
- D1 database is ready for gradual migration

## What This Gives You

### Free Tier Capacity
- **100,000 reads/day** - Handles your site traffic easily
- **1,000 writes/day** - Covers your 157 feeds × 6 updates = 942 writes
- **5GB storage** - Years of article storage
- **Global edge distribution** - Faster than current system

### Performance Gains (Projected)
- **Load time**: 2-3s → 0.2-0.5s (10x faster)
- **Search**: 500ms → 100ms (5x faster)  
- **Memory usage**: 50MB → 5MB per request (10x less)

## Next Decision Points

### Option A: Start Migration Now
- Follow the full migration plan
- 4-week gradual transition
- Zero risk, maximum upside

### Option B: Optimize Current System First  
- Implement data retention (delete old articles)
- Reduce feed frequencies
- Keep JSON system but make it faster

### Option C: Hybrid Approach
- Use D1 for new articles (going forward)
- Keep existing JSON articles as-is
- Best of both worlds

## Monitoring Current System

Check these metrics to see when migration becomes critical:

```bash
# Current storage usage
du -sh content/links/

# Article count growth
find content/links/ -name "*.json" -exec jq '. | length' {} \; | paste -sd+ | bc

# Memory usage during build
astro build --verbose
```

## Emergency Contacts & Rollback

If anything goes wrong:
1. **Current system keeps working** - No changes made yet
2. **D1 is isolated** - Only a database, not affecting site
3. **Easy cleanup**: Just delete the D1 database if needed

```bash
# If you want to remove D1 (not recommended)
wrangler d1 delete markets-feeds
```

## Cost Monitoring

Set up billing alerts (optional but recommended):
```bash
# Check current D1 usage
wrangler d1 execute markets-feeds --command="SELECT COUNT(*) FROM articles;"

# Monitor via Cloudflare dashboard
# Navigate to Workers & Pages > D1 > markets-feeds
```

Your system is ready for zero-risk, high-gain migration whenever you're ready to proceed! 🚀