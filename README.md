# Research Feed Aggregator

A modern RSS feed aggregator built with Astro and Cloudflare Workers, designed specifically for financial and economic research content.

## Features

- **Real-time RSS Feed Processing**: Automated fetching from 100+ high-quality sources
- **Smart Categorization**: Logical organization by content type (Markets, Economic Research, etc.)
- **Modern UI**: Clean, responsive design optimized for reading
- **Export Functionality**: OPML, JSON, and CSV export support
- **Production Caching**: Optimized cache policies for news content freshness
- **Search & Filter**: Advanced search with category filtering

## Architecture

### Frontend (Astro)
- Static site generation with dynamic API integration
- Responsive design with soft color palette
- Category navigation and search functionality
- Export capabilities for feed management

### Backend (Mock Server for Development)
- Express.js API server simulating Cloudflare Workers
- Comprehensive caching strategy
- Security headers and CORS configuration
- RESTful endpoints for all data operations

### Content Categories

1. **Markets & Trading** - Real-time market news and trading data
2. **Business News** - Corporate news and industry updates  
3. **Economic Research** - Macro economics and monetary policy
4. **Investment Analysis** - Commentary and portfolio theory
5. **Regional Focus** - Geographic market coverage
6. **Technology** - FinTech and innovation
7. **Policy & Regulation** - Financial regulation and policy
8. **Academic & Research** - Scholarly content
9. **Alternative Perspectives** - Diverse analytical viewpoints
10. **Specialized Markets** - Commodities and niche markets
11. **Audio Content** - Podcasts and audio resources

## Quick Start

### Development

```bash
# Install dependencies
cd frontend && npm install

# Start mock API server
cd .. && PORT=8787 node mock-server.js

# Start Astro development server
cd frontend && npm run dev
```

### Caching Strategy

- **Articles**: 1 minute cache (fresh news content)
- **Sources**: 5 minutes cache (rarely changes)
- **Search**: No cache (user-specific queries)
- **Static Assets**: 1 year cache (with versioning)
- **HTML Pages**: 5 minutes cache (dynamic content)

## Deployment

The system is designed for deployment on Cloudflare Workers + D1 Database with Cloudflare Pages for the frontend.

See `CACHING.md` for detailed production caching configuration.

## API Endpoints

- `GET /api/articles` - Retrieve articles with filtering
- `GET /api/sources` - Get all RSS sources  
- `GET /api/search` - Search articles
- `GET /api/suggestions` - Search suggestions
- `GET /api/trending` - Trending topics

## Contributing

This is a specialized financial news aggregator. All sources are curated for quality and relevance to financial/economic research.