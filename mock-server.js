// Mock API server for local development
// This simulates the Cloudflare Worker endpoints

import express from 'express';
import cors from 'cors';

const app = express();

// CORS with cache-aware headers
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['ETag', 'Last-Modified', 'Cache-Control']
}));

app.use(express.json());

// Add global security and cache headers
app.use((req, res, next) => {
  // Security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });
  
  next();
});

// Mock data
const mockSources = [
  // === 1. MARKETS & TRADING === (Real-time market news, trading data)
  { name: 'Yahoo Finance', category: 'Markets & Trading', url: 'https://finance.yahoo.com/rss/topstories', articles_today: 25, articles_week: 180, total_articles: 2450, enabled: true },
  { name: 'Bloomberg Markets', category: 'Markets & Trading', url: 'https://feeds.bloomberg.com/markets/news.rss', articles_today: 22, articles_week: 165, total_articles: 3200, enabled: true },
  { name: 'WSJ Markets', category: 'Markets & Trading', url: 'https://feeds.content.dowjones.io/public/rss/RSSMarketsMain', articles_today: 18, articles_week: 140, total_articles: 2800, enabled: true },
  { name: 'Financial Times Markets', category: 'Markets & Trading', url: 'https://www.ft.com/markets?format=rss', articles_today: 16, articles_week: 120, total_articles: 2100, enabled: true },
  { name: 'CNBC Markets', category: 'Markets & Trading', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', articles_today: 24, articles_week: 170, total_articles: 2900, enabled: true },
  { name: 'MarketWatch', category: 'Markets & Trading', url: 'http://feeds.marketwatch.com/marketwatch/topstories', articles_today: 20, articles_week: 145, total_articles: 2600, enabled: true },
  { name: 'MarketWatch Real-time', category: 'Markets & Trading', url: 'https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines', articles_today: 35, articles_week: 250, total_articles: 4200, enabled: true },

  // === 2. BUSINESS NEWS === (Corporate news, business strategy, industry)
  { name: 'Reuters Business', category: 'Business News', url: 'https://feeds.reuters.com/reuters/businessNews', articles_today: 28, articles_week: 200, total_articles: 3800, enabled: true },
  { name: 'CNBC Business', category: 'Business News', url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', articles_today: 26, articles_week: 185, total_articles: 3100, enabled: true },
  { name: 'Business Insider', category: 'Business News', url: 'https://feeds.businessinsider.com/custom/all', articles_today: 15, articles_week: 110, total_articles: 1900, enabled: true },
  { name: 'Fortune', category: 'Business News', url: 'https://fortune.com/feed/', articles_today: 12, articles_week: 85, total_articles: 1600, enabled: true },
  { name: 'Economist Business', category: 'Business News', url: 'https://www.economist.com/business/rss.xml', articles_today: 8, articles_week: 55, total_articles: 1200, enabled: true },
  { name: 'NYT Business', category: 'Business News', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', articles_today: 14, articles_week: 100, total_articles: 1800, enabled: true },
  { name: 'BBC Business', category: 'Business News', url: 'http://feeds.bbci.co.uk/news/business/rss.xml', articles_today: 16, articles_week: 115, total_articles: 2000, enabled: true },

  // === 3. ECONOMIC RESEARCH === (Macro economics, monetary policy, central banking)
  { name: 'Bloomberg Economics', category: 'Economic Research', url: 'https://feeds.bloomberg.com/economics/news.rss', articles_today: 8, articles_week: 55, total_articles: 950, enabled: true },
  { name: 'FT Economics', category: 'Economic Research', url: 'https://www.ft.com/economics?format=rss', articles_today: 6, articles_week: 42, total_articles: 780, enabled: true },
  { name: 'CNBC Economy', category: 'Economic Research', url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html', articles_today: 10, articles_week: 70, total_articles: 1200, enabled: true },
  { name: 'NYT Economy', category: 'Economic Research', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml', articles_today: 5, articles_week: 35, total_articles: 620, enabled: true },
  { name: 'Economist Finance', category: 'Economic Research', url: 'https://www.economist.com/finance-and-economics/rss.xml', articles_today: 4, articles_week: 28, total_articles: 500, enabled: true },
  { name: 'Federal Reserve', category: 'Economic Research', url: 'https://www.federalreserve.gov/feeds/press_all.xml', articles_today: 3, articles_week: 21, total_articles: 420, enabled: true },
  { name: 'ECB Press', category: 'Economic Research', url: 'https://www.ecb.europa.eu/rss/press.html', articles_today: 2, articles_week: 14, total_articles: 300, enabled: true },
  { name: 'RBI Press', category: 'Economic Research', url: 'https://www.rbi.org.in/Scripts/Rss.aspx', articles_today: 4, articles_week: 28, total_articles: 550, enabled: true },
  { name: 'IMF News', category: 'Economic Research', url: 'https://www.imf.org/en/News/RSS?Language=ENG', articles_today: 2, articles_week: 14, total_articles: 280, enabled: true },
  { name: 'ET CFO Economy', category: 'Economic Research', url: 'https://cfo.economictimes.indiatimes.com/rss/economy', articles_today: 6, articles_week: 42, total_articles: 750, enabled: true },

  // === 4. INVESTMENT ANALYSIS === (Investment commentary, portfolio theory, market analysis)
  { name: 'Matt Levine', category: 'Investment Analysis', url: 'https://www.bloomberg.com/opinion/authors/ARbTQlRLRjE/matthew-s-levine.rss', articles_today: 1, articles_week: 5, total_articles: 180, enabled: true },
  { name: 'The Big Picture', category: 'Investment Analysis', url: 'https://ritholtz.com/feed/', articles_today: 3, articles_week: 21, total_articles: 450, enabled: true },
  { name: 'Marginal Revolution', category: 'Investment Analysis', url: 'https://marginalrevolution.com/feed', articles_today: 4, articles_week: 28, total_articles: 620, enabled: true },
  { name: 'WSJ Opinion', category: 'Investment Analysis', url: 'https://feeds.content.dowjones.io/public/rss/RSSOpinion', articles_today: 8, articles_week: 56, total_articles: 1100, enabled: true },
  { name: 'CFA Institute', category: 'Investment Analysis', url: 'https://blogs.cfainstitute.org/investor/feed/', articles_today: 2, articles_week: 12, total_articles: 320, enabled: true },

  // === 5. REGIONAL FOCUS ===
  // India
  { name: 'Economic Times Markets', category: 'Regional - India', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', articles_today: 32, articles_week: 225, total_articles: 4100, enabled: true },
  { name: 'Hindu Business Line', category: 'Regional - India', url: 'https://www.thehindubusinessline.com/feeder/default.rss', articles_today: 18, articles_week: 130, total_articles: 2400, enabled: true },
  { name: 'MoneyControl', category: 'Regional - India', url: 'https://www.moneycontrol.com/rss/business.xml', articles_today: 22, articles_week: 155, total_articles: 2800, enabled: true },
  { name: 'NDTV Profit', category: 'Regional - India', url: 'https://prod-qt-images.s3.amazonaws.com/production/bloombergquint/feed.xml', articles_today: 15, articles_week: 105, total_articles: 1900, enabled: true },
  // Asia
  { name: 'Nikkei Asia', category: 'Regional - Asia', url: 'https://asia.nikkei.com/rss/feed/nar', articles_today: 12, articles_week: 85, total_articles: 1500, enabled: true },
  { name: 'SCMP Business', category: 'Regional - Asia', url: 'https://www.scmp.com/rss/2/feed', articles_today: 10, articles_week: 70, total_articles: 1200, enabled: true },

  // === 6. TECHNOLOGY & INNOVATION ===
  { name: 'Stratechery', category: 'Technology', url: 'https://stratechery.com/feed/', articles_today: 1, articles_week: 4, total_articles: 220, enabled: true },
  { name: 'Techmeme', category: 'Technology', url: 'https://www.techmeme.com/feed.xml', articles_today: 25, articles_week: 175, total_articles: 2800, enabled: true },
  { name: 'FT Technology', category: 'Technology', url: 'https://www.ft.com/technology?format=rss', articles_today: 8, articles_week: 56, total_articles: 1000, enabled: true },
  { name: 'NYT Technology', category: 'Technology', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', articles_today: 12, articles_week: 85, total_articles: 1500, enabled: true },
  { name: 'The Verge', category: 'Technology', url: 'https://www.theverge.com/rss/index.xml', articles_today: 20, articles_week: 140, total_articles: 2400, enabled: true },
  { name: 'Wired', category: 'Technology', url: 'https://www.wired.com/feed/rss', articles_today: 10, articles_week: 70, total_articles: 1200, enabled: true },

  // === 7. POLICY & REGULATION ===
  { name: 'SEC Press', category: 'Policy & Regulation', url: 'https://www.sec.gov/news/pressreleases.rss', articles_today: 5, articles_week: 35, total_articles: 680, enabled: true },
  { name: 'SEBI News', category: 'Policy & Regulation', url: 'https://www.sebi.gov.in/sebirss.xml', articles_today: 4, articles_week: 28, total_articles: 520, enabled: true },
  { name: 'Bloomberg Politics', category: 'Policy & Regulation', url: 'https://feeds.bloomberg.com/politics/news.rss', articles_today: 12, articles_week: 85, total_articles: 1450, enabled: true },
  { name: 'Foreign Affairs', category: 'Policy & Regulation', url: 'https://www.foreignaffairs.com/rss.xml', articles_today: 3, articles_week: 21, total_articles: 380, enabled: true },
  { name: 'ET CFO Policy', category: 'Policy & Regulation', url: 'https://cfo.economictimes.indiatimes.com/rss/policy', articles_today: 4, articles_week: 28, total_articles: 520, enabled: true },

  // === 8. ACADEMIC & RESEARCH ===
  { name: 'Pew Research', category: 'Academic & Research', url: 'https://www.pewresearch.org/feed/', articles_today: 3, articles_week: 18, total_articles: 420, enabled: true },
  { name: 'Project Syndicate', category: 'Academic & Research', url: 'https://www.project-syndicate.org/rss', articles_today: 6, articles_week: 42, total_articles: 850, enabled: true },
  { name: 'Aeon Magazine', category: 'Academic & Research', url: 'https://aeon.co/feed.rss', articles_today: 2, articles_week: 12, total_articles: 280, enabled: true },

  // === 9. ALTERNATIVE PERSPECTIVES ===
  { name: 'ZeroHedge', category: 'Alternative Perspectives', url: 'https://feeds.feedburner.com/zerohedge/feed', articles_today: 30, articles_week: 210, total_articles: 3500, enabled: true },
  { name: 'Paul Krugman', category: 'Alternative Perspectives', url: 'https://paulkrugman.substack.com/feed', articles_today: 1, articles_week: 4, total_articles: 85, enabled: true },
  { name: 'Noahpinion', category: 'Alternative Perspectives', url: 'https://www.noahpinion.blog/feed', articles_today: 1, articles_week: 3, total_articles: 120, enabled: true },
  { name: 'Astral Codex Ten', category: 'Alternative Perspectives', url: 'https://www.astralcodexten.com/feed', articles_today: 1, articles_week: 3, total_articles: 95, enabled: true },
  { name: 'Not Boring', category: 'Alternative Perspectives', url: 'https://www.notboring.co/feed', articles_today: 1, articles_week: 2, total_articles: 75, enabled: true },
  { name: 'Nate Silver', category: 'Alternative Perspectives', url: 'https://www.natesilver.net/feed', articles_today: 1, articles_week: 4, total_articles: 110, enabled: true },
  { name: 'Experimental History', category: 'Alternative Perspectives', url: 'https://www.experimental-history.com/feed', articles_today: 1, articles_week: 2, total_articles: 65, enabled: true },

  // === 10. SPECIALIZED MARKETS ===
  { name: 'OilPrice.com', category: 'Specialized Markets', url: 'https://oilprice.com/rss/main', articles_today: 8, articles_week: 55, total_articles: 980, enabled: true },
  { name: 'NSE Financial Results', category: 'Specialized Markets', url: 'https://nsearchives.nseindia.com/content/RSS/Financial_Results.xml', articles_today: 5, articles_week: 25, total_articles: 450, enabled: true },
  { name: 'NSE Circulars', category: 'Specialized Markets', url: 'https://nsearchives.nseindia.com/content/RSS/Circulars.xml', articles_today: 3, articles_week: 18, total_articles: 320, enabled: true },

  // === 11. AUDIO CONTENT ===
  { name: 'Chat with Traders', category: 'Audio Content', url: 'https://feeds.simplecast.com/wgl4xEgL', articles_today: 1, articles_week: 3, total_articles: 150, enabled: true },
  { name: 'Capital Allocators', category: 'Audio Content', url: 'https://feeds.simplecast.com/6I0NuI9m', articles_today: 1, articles_week: 2, total_articles: 120, enabled: true },
  { name: 'Invest Like the Best', category: 'Audio Content', url: 'https://feeds.simplecast.com/BqbsxVfO', articles_today: 1, articles_week: 2, total_articles: 140, enabled: true }
];

const mockArticles = [
  {
    id: '1',
    article_id: 'article_1',
    title: 'Federal Reserve Signals Potential Rate Cuts Amid Inflation Concerns',
    link: 'https://example.com/article1',
    description: 'The Federal Reserve is considering adjustments to monetary policy as inflation shows signs of cooling, according to recent statements from policymakers...',
    source: 'Bloomberg Markets',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    readingTime: 5,
    contentFetched: true,
    author: 'John Smith'
  },
  {
    id: '2',
    article_id: 'article_2',
    title: 'AI Revolution in Financial Services: A Deep Dive into Machine Learning Applications',
    link: 'https://example.com/article2',
    description: 'How artificial intelligence is reshaping everything from credit decisions to algorithmic trading, and what it means for the future of finance...',
    source: 'The Diff',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    readingTime: 12,
    contentFetched: true,
    author: 'Sarah Johnson'
  },
  {
    id: '3',
    article_id: 'article_3',
    title: 'Indian Markets Rally on Policy Optimism and Infrastructure Spending',
    link: 'https://example.com/article3',
    description: 'Sensex and Nifty hit new highs as investors respond positively to recent government announcements on infrastructure spending and tax reforms...',
    source: 'Economic Times',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    readingTime: 4,
    contentFetched: false,
    author: 'Raj Patel'
  },
  {
    id: '4',
    article_id: 'article_4',
    title: 'Risk Parity Strategies Show Resilience in Volatile Markets',
    link: 'https://example.com/article4',
    description: 'New research demonstrates how risk parity portfolios have maintained consistent performance across different market regimes...',
    source: 'NBER Working Papers',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    readingTime: 15,
    contentFetched: true,
    author: 'Dr. Michael Chen'
  },
  {
    id: '5',
    article_id: 'article_5',
    title: 'Central Bank Digital Currencies: Progress and Challenges',
    link: 'https://example.com/article5',
    description: 'As more countries pilot digital currencies, questions remain about implementation timelines and potential impacts on traditional banking systems...',
    source: 'Financial Times',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    readingTime: 8,
    contentFetched: true,
    author: 'Emma Wilson'
  },
  {
    id: '6',
    article_id: 'article_6',
    title: 'The State of Alternative Investments in 2025',
    link: 'https://example.com/article6',
    description: 'Comprehensive analysis of private equity, real estate, and commodity markets reveals shifting patterns in institutional allocation strategies...',
    source: 'Harvard Business Review',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    readingTime: 20,
    contentFetched: true,
    author: 'Prof. David Brown'
  }
];

// API endpoints
app.get('/api/sources', (req, res) => {
  console.log('GET /api/sources');
  
  // Cache sources for 5 minutes (changes rarely)
  res.set({
    'Cache-Control': 'public, max-age=300, s-maxage=300',
    'ETag': `"sources-${Date.now()}"`,
    'Last-Modified': new Date().toUTCString()
  });
  
  res.json(mockSources);
});

app.get('/api/articles', (req, res) => {
  console.log('GET /api/articles', req.query);
  const { limit = 50, source, category } = req.query;
  
  // Short cache for articles (1 minute) - news needs to be fresh
  res.set({
    'Cache-Control': 'public, max-age=60, s-maxage=60',
    'ETag': `"articles-${Date.now()}"`,
    'Last-Modified': new Date().toUTCString()
  });
  
  let filtered = [...mockArticles];
  
  if (source) {
    filtered = filtered.filter(a => a.source === source);
  }
  
  if (category) {
    const sourcesInCategory = mockSources
      .filter(s => s.category === category)
      .map(s => s.name);
    filtered = filtered.filter(a => sourcesInCategory.includes(a.source));
  }
  
  res.json({
    articles: filtered.slice(0, parseInt(limit)),
    total: filtered.length,
    hasMore: filtered.length > parseInt(limit)
  });
});

app.get('/api/search', (req, res) => {
  console.log('GET /api/search', req.query);
  const { q } = req.query;
  
  // No cache for search - user-specific queries
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  if (!q) {
    return res.json({ query: '', results: [], total: 0 });
  }
  
  const results = mockArticles.filter(article => 
    article.title.toLowerCase().includes(q.toLowerCase()) ||
    article.description.toLowerCase().includes(q.toLowerCase())
  );
  
  res.json({
    query: q,
    results,
    total: results.length,
    searchTime: 15
  });
});

app.get('/api/suggestions', (req, res) => {
  console.log('GET /api/suggestions', req.query);
  const { q } = req.query;
  
  // No cache for suggestions - user-specific queries
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  const suggestions = [
    { text: `${q} in markets`, type: 'search', meta: '15 articles' },
    { text: `${q} analysis`, type: 'search', meta: '8 articles' },
    { text: `${q} research`, type: 'search', meta: '5 articles' }
  ];
  
  res.json({ suggestions });
});

app.get('/api/trending', (req, res) => {
  console.log('GET /api/trending');
  
  // Cache trending for 15 minutes (changes slowly)
  res.set({
    'Cache-Control': 'public, max-age=900, s-maxage=900',
    'ETag': `"trending-${Date.now()}"`,
    'Last-Modified': new Date().toUTCString()
  });
  
  res.json({
    trending: [
      { keyword: 'artificial intelligence', articleCount: 23, avgReadingTime: 8 },
      { keyword: 'inflation', articleCount: 18, avgReadingTime: 6 },
      { keyword: 'market volatility', articleCount: 15, avgReadingTime: 5 },
      { keyword: 'digital currency', articleCount: 12, avgReadingTime: 10 }
    ]
  });
});

app.post('/fetch-feeds', (req, res) => {
  console.log('POST /fetch-feeds');
  res.json({
    success: true,
    processed: 8,
    successful: 8,
    contentFetched: 6,
    timestamp: new Date().toISOString()
  });
});

const PORT = 8787;
app.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/sources');
  console.log('  GET  /api/articles');
  console.log('  GET  /api/search');
  console.log('  GET  /api/suggestions');
  console.log('  GET  /api/trending');
  console.log('  POST /fetch-feeds');
});