# Caching Policy for Research Feed Aggregator

## Overview
This news aggregator implements a differentiated caching strategy to balance content freshness with performance.

## Cache Strategy

### 🔄 API Endpoints (Dynamic Content)

| Endpoint | Cache Duration | Reasoning |
|----------|---------------|-----------|
| `/api/articles` | **1 minute** | News content must be fresh |
| `/api/sources` | **5 minutes** | Source list changes rarely |
| `/api/trending` | **15 minutes** | Trending topics evolve slowly |
| `/api/search` | **No cache** | User-specific queries |
| `/api/suggestions` | **No cache** | User-specific suggestions |

### 📦 Static Assets

| Asset Type | Cache Duration | Notes |
|------------|---------------|--------|
| CSS/JS files | **1 year** | With versioning/fingerprinting |
| HTML pages | **5 minutes** | Contains dynamic content via API calls |
| Images | **1 year** | Rarely change |

## Implementation Details

### Cache Headers Used
- `Cache-Control`: Primary cache directive
- `ETag`: Entity tag for validation
- `Last-Modified`: Timestamp for conditional requests
- `Pragma`: Legacy cache control
- `Expires`: Fallback for older proxies

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## Production Deployment

### CDN Configuration
For production deployment with a CDN (Cloudflare, AWS CloudFront, etc.):

```
# Static assets - aggressive caching
/assets/* 
  Cache-Control: public, max-age=31536000, immutable

# API routes - short cache
/api/articles
  Cache-Control: public, max-age=60

/api/sources  
  Cache-Control: public, max-age=300

/api/search
  Cache-Control: no-cache, no-store, must-revalidate

# HTML pages - moderate cache
/
/*.html
  Cache-Control: public, max-age=300
```

### Environment Variables
Set these in production:
```env
NODE_ENV=production
CACHE_ENABLED=true
CDN_URL=https://your-cdn.example.com
```

## Monitoring
Monitor cache hit rates and adjust TTL values based on:
- News update frequency
- User behavior patterns
- Server load metrics
- Content freshness requirements

## News Content Freshness
Since this is a news aggregator:
- **Critical**: Articles should never be stale > 2 minutes
- **Important**: Source lists updated within 10 minutes
- **Acceptable**: Static UI elements cached for hours/days

## Browser Caching
Browsers will respect cache headers, but users can force refresh:
- `Ctrl+F5`: Bypasses all caches
- `F5`: Sends conditional requests with ETags
- Normal navigation: Uses cached content when valid

## Development vs Production
- **Development**: Shorter cache times for easier testing
- **Production**: Longer cache times for better performance
- **Staging**: Match production settings for realistic testing