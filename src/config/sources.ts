import type { RSSSource } from '../types';

export const RSS_SOURCES: RSSSource[] = [
  // Major International Finance Sources
  {
    id: 'bloomberg-markets',
    name: 'Bloomberg Markets',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    category: 'markets',
    enabled: true
  },
  {
    id: 'bloomberg-economics',
    name: 'Bloomberg Economics',
    url: 'https://feeds.Bloomberg.com/economics/news.rss',
    category: 'macro',
    enabled: true
  },
  {
    id: 'reuters-business',
    name: 'Reuters Business',
    url: 'https://feeds.reuters.com/reuters/businessNews',
    category: 'markets',
    enabled: true
  },
  {
    id: 'ft-markets',
    name: 'Financial Times',
    url: 'https://www.ft.com/markets?format=rss',
    category: 'markets',
    enabled: true
  },
  {
    id: 'ft-economics',
    name: 'FT Economics',
    url: 'https://www.ft.com/global-economy?format=rss',
    category: 'macro',
    enabled: true
  },
  {
    id: 'wsj-markets',
    name: 'Wall Street Journal',
    url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
    category: 'markets',
    enabled: true
  },
  {
    id: 'wsj-economy',
    name: 'WSJ Economy',
    url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    category: 'macro',
    enabled: true
  },
  {
    id: 'economist-finance',
    name: 'The Economist',
    url: 'https://www.economist.com/finance-and-economics/rss.xml',
    category: 'macro',
    enabled: true
  },
  {
    id: 'economist-business',
    name: 'Economist Business',
    url: 'https://www.economist.com/business/rss.xml',
    category: 'markets',
    enabled: true
  },
  {
    id: 'cnbc-markets',
    name: 'CNBC Markets',
    url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html',
    category: 'markets',
    enabled: true
  },
  {
    id: 'cnbc-economy',
    name: 'CNBC Economy',
    url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html',
    category: 'macro',
    enabled: true
  },
  
  // Indian Finance Sources
  {
    id: 'et-markets',
    name: 'Economic Times Markets',
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    category: 'markets',
    enabled: true
  },
  {
    id: 'mint-markets',
    name: 'Mint Markets',
    url: 'https://www.livemint.com/rss/markets',
    category: 'markets',
    enabled: true
  },
  {
    id: 'moneycontrol-news',
    name: 'Moneycontrol',
    url: 'https://www.moneycontrol.com/rss/latestnews.xml',
    category: 'markets',
    enabled: true
  },
  
  // Central Banks & Policy
  {
    id: 'rbi-press',
    name: 'RBI Press Releases',
    url: 'https://rbi.org.in/scripts/Rss.aspx',
    category: 'policy',
    enabled: true
  },
  {
    id: 'fed-news',
    name: 'Federal Reserve',
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    category: 'policy',
    enabled: true
  },
  {
    id: 'ecb-press',
    name: 'European Central Bank',
    url: 'https://www.ecb.europa.eu/rss/press.html',
    category: 'policy',
    enabled: true
  },
  
  // Research
  {
    id: 'bis-papers',
    name: 'BIS Research',
    url: 'https://www.bis.org/doclist/bis_fsi_publs.rss',
    category: 'research',
    enabled: true
  },
  {
    id: 'imf-news',
    name: 'IMF News',
    url: 'https://www.imf.org/en/News/RSS',
    category: 'research',
    enabled: true
  },
  {
    id: 'world-bank',
    name: 'World Bank',
    url: 'https://blogs.worldbank.org/rss.xml',
    category: 'research',
    enabled: true
  },
  
  // Additional Quality Sources
  {
    id: 'seeking-alpha',
    name: 'Seeking Alpha',
    url: 'https://seekingalpha.com/feed.xml',
    category: 'markets',
    enabled: true
  },
  {
    id: 'marketwatch',
    name: 'MarketWatch',
    url: 'https://feeds.marketwatch.com/marketwatch/topstories',
    category: 'markets',
    enabled: true
  },
  {
    id: 'investing-com',
    name: 'Investing.com',
    url: 'https://www.investing.com/rss/news.rss',
    category: 'markets',
    enabled: true
  },
  
  // Academic & Think Tanks
  {
    id: 'brookings-econ',
    name: 'Brookings Economics',
    url: 'https://www.brookings.edu/feed/',
    category: 'research',
    enabled: true
  },
  {
    id: 'council-foreign-relations',
    name: 'Council on Foreign Relations',
    url: 'https://www.cfr.org/rss/feeds/economics',
    category: 'research',
    enabled: true
  },
  {
    id: 'nber',
    name: 'NBER',
    url: 'https://www.nber.org/rss/new.xml',
    category: 'research',
    enabled: true
  },
  
  // Crypto & Tech Finance
  {
    id: 'coindesk',
    name: 'CoinDesk',
    url: 'https://feeds.coindesk.com/coindesk',
    category: 'markets',
    enabled: true
  },
  {
    id: 'techcrunch-fintech',
    name: 'TechCrunch Fintech',
    url: 'https://techcrunch.com/category/fintech/feed/',
    category: 'markets',
    enabled: true
  },
  
  // Additional Premium Sources
  {
    id: 'barrons',
    name: "Barron's",
    url: 'https://feeds.a.dj.com/rss/RSSOpinion.xml',
    category: 'markets',
    enabled: true
  },
  {
    id: 'zerohedge',
    name: 'ZeroHedge',
    url: 'https://feeds.feedburner.com/zerohedge/feed',
    category: 'markets',
    enabled: true
  },
  {
    id: 'nasdaq',
    name: 'Nasdaq',
    url: 'https://www.nasdaq.com/feed/rssoutbound',
    category: 'markets',
    enabled: true
  },
  {
    id: 'yahoo-finance',
    name: 'Yahoo Finance',
    url: 'https://finance.yahoo.com/news/rssindex',
    category: 'markets',
    enabled: true
  },
  {
    id: 'morningstar',
    name: 'Morningstar',
    url: 'https://www.morningstar.com/rss',
    category: 'research',
    enabled: true
  },
  
  // International Business
  {
    id: 'business-insider',
    name: 'Business Insider',
    url: 'https://feeds.businessinsider.com/custom/all',
    category: 'markets',
    enabled: true
  },
  {
    id: 'forbes-investing',
    name: 'Forbes Investing',
    url: 'https://www.forbes.com/investing/feed/',
    category: 'markets',
    enabled: true
  },
  {
    id: 'fortune',
    name: 'Fortune',
    url: 'https://fortune.com/feed/',
    category: 'markets',
    enabled: true
  },
  
  // Emerging Markets & Asia
  {
    id: 'nikkei-asia',
    name: 'Nikkei Asia',
    url: 'https://asia.nikkei.com/rss/feed',
    category: 'markets',
    enabled: true
  },
  {
    id: 'scmp-business',
    name: 'SCMP Business',
    url: 'https://www.scmp.com/rss/91/feed',
    category: 'markets',
    enabled: true
  },
  {
    id: 'straits-times-business',
    name: 'Straits Times Business',
    url: 'https://www.straitstimes.com/business/rss.xml',
    category: 'markets',
    enabled: true
  },
  
  // Commodities & Energy
  {
    id: 'oil-price',
    name: 'OilPrice.com',
    url: 'https://oilprice.com/rss/main',
    category: 'markets',
    enabled: true
  },
  {
    id: 'mining-com',
    name: 'Mining.com',
    url: 'https://www.mining.com/feed/',
    category: 'markets',
    enabled: true
  },
  
  // Alternative Finance
  {
    id: 'alternative-investment-news',
    name: 'AI News',
    url: 'https://www.ai-news.com/feed/',
    category: 'research',
    enabled: true
  },
  {
    id: 'private-equity-wire',
    name: 'PE Wire',
    url: 'https://www.privateequitywire.co.uk/feed/',
    category: 'markets',
    enabled: true
  },
  
  // Indian Specialized
  {
    id: 'business-standard',
    name: 'Business Standard',
    url: 'https://www.business-standard.com/rss/markets-106.rss',
    category: 'markets',
    enabled: true
  },
  {
    id: 'financial-express',
    name: 'Financial Express',
    url: 'https://www.financialexpress.com/market/rss/',
    category: 'markets',
    enabled: true
  },
  {
    id: 'thehindubusinessline',
    name: 'Hindu BusinessLine',
    url: 'https://www.thehindubusinessline.com/markets/?service=rss',
    category: 'markets',
    enabled: true
  },
  
  // ESG & Sustainability
  {
    id: 'esg-today',
    name: 'ESG Today',
    url: 'https://www.esgtoday.com/feed/',
    category: 'research',
    enabled: true
  },
  {
    id: 'responsible-investor',
    name: 'Responsible Investor',
    url: 'https://www.responsible-investor.com/rss/all/feed/',
    category: 'research',
    enabled: true
  }
];

export const APP_CONFIG = {
  maxItemAge: 30, // days
  maxItemsPerSource: 50,
  duplicateThreshold: 0.85,
  breakingNewsKeywords: [
    'breaking', 'alert', 'flash', 'urgent', 'emergency',
    'crisis', 'crashes', 'plunges', 'soars', 'spikes'
  ],
  priorityKeywords: {
    breaking: ['breaking', 'alert', 'flash'],
    high: ['fed', 'ecb', 'rbi', 'rate', 'policy', 'gdp', 'inflation'],
    normal: [],
    low: ['opinion', 'analysis', 'outlook']
  }
};