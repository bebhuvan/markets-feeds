import type { APIRoute } from 'astro';

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

  // Add more categories as needed...
];

export const GET: APIRoute = () => {
  // Cache sources for 5 minutes (changes rarely)
  const headers = {
    'Cache-Control': 'public, max-age=300, s-maxage=300',
    'ETag': `"sources-${Date.now()}"`,
    'Last-Modified': new Date().toUTCString(),
    'Content-Type': 'application/json'
  };
  
  return new Response(JSON.stringify(mockSources), { headers });
};