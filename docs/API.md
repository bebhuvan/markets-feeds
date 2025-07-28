# API Documentation

Markets Feeds provides programmatic access to aggregated financial content through various methods.

## 📋 Overview

While Markets Feeds is primarily a static site, it exposes content through:
- **Static JSON Files**: Direct access to aggregated content
- **RSS Feeds**: Standard RSS format for external consumption
- **Search API**: Client-side search functionality
- **Content Collections**: Structured content access

## 📊 Data Structure

### Article Schema

```typescript
interface FeedItem {
  id: string;              // Unique article identifier
  title: string;           // Article title
  url: string;             // Original article URL
  summary?: string;        // Article description/summary
  publishedAt: string;     // ISO 8601 timestamp
  sourceName: string;      // Human-readable source name
  sourceId: string;        // Unique source identifier
  category: string;        // Content category
  priority: 'normal' | 'breaking' | 'high';
  tags: string[];          // Content tags
  hash: string;            // SHA256 content hash
}
```

### Category Types

```typescript
type Category = 
  | 'markets'      // Market news and analysis
  | 'macro'        // Macroeconomic content
  | 'research'     // Academic and institutional research
  | 'technology'   // Financial technology news
  | 'news'         // General financial news
  | 'policy'       // Regulatory and policy updates
  | 'newsletters'  // Premium newsletter content
  | 'aggregators'  // Curated content collections
  | 'filings'      // Regulatory filings
  | 'non-money';   // General interest content
```

## 🔗 Access Methods

### 1. Static JSON Files

**Daily Content Files:**
```
GET /src/content/links/{YYYY-MM-DD}.json
```

**Example:**
```bash
curl https://markets-feeds.pages.dev/src/content/links/2024-01-15.json
```

**Response:**
```json
[
  {
    "id": "bloomberg-markets-20240115-123456",
    "title": "Markets Rally on Fed Comments",
    "url": "https://bloomberg.com/news/articles/...",
    "summary": "Stock markets surged following...",
    "publishedAt": "2024-01-15T12:34:56Z",
    "sourceName": "Bloomberg Markets",
    "sourceId": "bloomberg-markets",
    "category": "markets",
    "priority": "normal",
    "tags": ["stocks", "fed", "monetary-policy"],
    "hash": "abc123..."
  }
]
```

### 2. Aggregator State

**Current Processing State:**
```
GET /scripts/aggregator_state.json
```

**Response:**
```json
{
  "last_run": "2024-01-15T12:00:00Z",
  "total_sources": 100,
  "successful_sources": 98,
  "failed_sources": 2,
  "articles_processed": 1250,
  "articles_new": 45,
  "articles_duplicate": 1205,
  "processing_time": 120.5,
  "errors": [
    {
      "source_id": "failed-source",
      "error": "Connection timeout",
      "timestamp": "2024-01-15T12:05:00Z"
    }
  ]
}
```

### 3. Source Configuration

**All RSS Sources:**
```javascript
// Access via client-side JavaScript
const sources = await fetch('/src/config/sources.js')
  .then(r => r.text())
  .then(text => eval(text));
```

## 🔍 Search API

### Client-Side Search

The search functionality runs entirely client-side using JavaScript:

```javascript
// Search implementation
class ContentSearch {
  constructor(articles) {
    this.articles = articles;
    this.index = this.buildIndex(articles);
  }
  
  search(query, filters = {}) {
    const results = this.articles.filter(article => {
      // Text matching
      const textMatch = this.matchText(article, query);
      
      // Category filter
      const categoryMatch = !filters.category || 
        article.category === filters.category;
      
      // Source filter  
      const sourceMatch = !filters.source ||
        article.sourceId === filters.source;
        
      // Date filter
      const dateMatch = this.matchDateRange(article, filters.dateRange);
      
      return textMatch && categoryMatch && sourceMatch && dateMatch;
    });
    
    return this.rankResults(results, query);
  }
}
```

### Search Parameters

```typescript
interface SearchFilters {
  category?: Category;
  source?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  priority?: 'normal' | 'breaking' | 'high';
  tags?: string[];
}
```

## 📈 Content Statistics

### Analytics Endpoints

**Content Volume by Category:**
```javascript
const stats = articles.reduce((acc, article) => {
  acc[article.category] = (acc[article.category] || 0) + 1;
  return acc;
}, {});
```

**Source Performance:**
```javascript
const sourceStats = sources.map(source => ({
  id: source.id,
  name: source.name,
  category: source.category,
  articleCount: articles.filter(a => a.sourceId === source.id).length,
  lastUpdate: getLastUpdate(source.id),
  status: getSourceStatus(source.id)
}));
```

## 🔄 Real-time Updates

### Polling Strategy

```javascript
// Check for new content every 2 minutes
const pollForUpdates = async () => {
  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(`/src/content/links/${today}.json`);
  
  if (response.ok) {
    const newContent = await response.json();
    updateUI(newContent);
  }
};

setInterval(pollForUpdates, 120000); // 2 minutes
```

### Service Worker Updates

```javascript
// Service worker automatically refreshes content
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline updates
self.addEventListener('sync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});
```

## 🔧 Custom Integration

### RSS Feed Creation

Create custom RSS feeds from JSON data:

```javascript
const createRSSFeed = (articles, category) => {
  const filteredArticles = articles
    .filter(a => !category || a.category === category)
    .slice(0, 50); // Latest 50 articles
    
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Markets Feeds - ${category || 'All'}</title>
    <description>Curated financial news and analysis</description>
    <link>https://markets-feeds.pages.dev</link>
    ${filteredArticles.map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${article.url}</link>
      <description><![CDATA[${article.summary || ''}]]></description>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <source url="${article.url}">${article.sourceName}</source>
      <category>${article.category}</category>
    </item>
    `).join('')}
  </channel>
</rss>`;
  
  return rss;
};
```

### Webhook Integration

Set up webhooks for content updates:

```javascript
// Example webhook payload
{
  "event": "content_updated",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "articles_added": 15,
    "categories_updated": ["markets", "research"],
    "sources_updated": ["bloomberg-markets", "ft-markets"],
    "latest_articles": [
      // Array of new articles
    ]
  }
}
```

## 📊 Rate Limits & Usage

### Static Content Access
- **No rate limits** on static JSON files
- **CDN cached** for global performance
- **Gzip compressed** for bandwidth efficiency

### Client-Side Processing
- **Search**: No server load, all client-side
- **Filtering**: Processed in browser
- **Caching**: Service worker manages local cache

### Best Practices

```javascript
// Efficient content loading
const loadContent = async (date) => {
  // Check cache first
  const cached = await getCachedContent(date);
  if (cached && !isStale(cached)) {
    return cached;
  }
  
  // Fetch and cache
  const fresh = await fetch(`/src/content/links/${date}.json`);
  await cacheContent(date, fresh);
  return fresh;
};

// Batch requests for date ranges
const loadDateRange = async (startDate, endDate) => {
  const dates = getDateRange(startDate, endDate);
  const promises = dates.map(date => loadContent(date));
  return Promise.all(promises);
};
```

## 🔐 Security Considerations

### CORS Policy
```javascript
// All content accessible via CORS
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### Content Validation
- All RSS content sanitized before processing
- XSS protection via proper escaping
- No user-generated content accepted
- External links open in new tabs

### API Security
- Static content only (no server-side API)
- No authentication required
- No sensitive data exposed
- Rate limiting via CDN

## 📚 Examples

### Basic Article Retrieval

```javascript
// Fetch today's articles
const today = new Date().toISOString().split('T')[0];
const articles = await fetch(`/src/content/links/${today}.json`)
  .then(r => r.json());

console.log(`Found ${articles.length} articles for ${today}`);
```

### Category Filtering

```javascript
// Get only market-related articles
const marketArticles = articles.filter(a => a.category === 'markets');

// Get breaking news
const breakingNews = articles.filter(a => a.priority === 'breaking');
```

### Source Analysis

```javascript
// Analyze content by source
const sourceStats = articles.reduce((stats, article) => {
  const source = article.sourceName;
  stats[source] = (stats[source] || 0) + 1;
  return stats;
}, {});

// Sort by article count
const topSources = Object.entries(sourceStats)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10);
```

### Search Implementation

```javascript
// Simple text search
const searchArticles = (articles, query) => {
  const lowerQuery = query.toLowerCase();
  return articles.filter(article => 
    article.title.toLowerCase().includes(lowerQuery) ||
    article.summary?.toLowerCase().includes(lowerQuery) ||
    article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// Advanced filtering
const advancedSearch = (articles, options) => {
  return articles.filter(article => {
    const textMatch = !options.query || 
      searchArticles([article], options.query).length > 0;
    
    const categoryMatch = !options.category || 
      article.category === options.category;
    
    const dateMatch = !options.since || 
      new Date(article.publishedAt) >= new Date(options.since);
    
    return textMatch && categoryMatch && dateMatch;
  });
};
```

---

**Need Help?** Check the [main documentation](../README.md) or create an issue for API-related questions.