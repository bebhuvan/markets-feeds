// Strategic minimal categories - focused splits for better UX
export const CATEGORIES = {
  // Core content types - strategic split
  'markets': 'Markets', // Main hub for stocks, trading, general market news
  'earnings': 'Earnings', // Distinct content type with dedicated audience
  'ma': 'M&A', // Mergers & acquisitions for deal-focused readers
  'crypto': 'Crypto', // Cryptocurrency for crypto audience
  
  // Major content areas
  'macro': 'Economics', // Economic data, policy, analysis
  'technology': 'Technology', // Tech industry news, innovation
  'research': 'Research', // Academic papers, analysis, studies
  
  // Strategic additions for specialized audiences
  'central-banking': 'Central Banking', // Fed, ECB, monetary policy
  'commodities': 'Commodities', // Oil, gold, agricultural products
  'regulation': 'Regulation', // Financial rules, compliance
  'filings': 'Filings', // Corporate announcements, NSE/BSE filings
  
  // Media types
  'videos': 'Videos',
  'blogs': 'Analysis', 
  'news': 'News',
  'podcasts': 'Podcasts',
  
  // Commentary and intellectual content
  'eclectic': 'Eclectic'
} as const;

// Source categories for sidebar
export const SOURCE_CATEGORIES = {
  'Indian Markets': ['et-markets', 'thehindubusinessline', 'moneycontrol-news', 'ndtv-profit'],
  'Indian Regulation': ['rbi-press', 'sebi-news', 'bse-notices'],
  'Global Financial': ['bloomberg', 'financial-times', 'reuters', 'economist'],
  'Research': ['nber', 'harvard-business', 'journal-economics', 'cfa-institute'],
  'Commentary': ['eclectic', 'blogs', 'analysis'],
  'Technology': ['techmeme', 'the-verge', 'wired'],
  'Other': ['podcasts', 'newsletters', 'aggregators']
};