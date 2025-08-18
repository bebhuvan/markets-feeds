-- Research Feed Aggregator Database Schema with Logical Categorization

-- Feed sources table
CREATE TABLE IF NOT EXISTS feed_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  url TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 2,
  content_fetch_enabled INTEGER DEFAULT 1,
  enabled INTEGER DEFAULT 1,
  last_fetched TEXT,
  last_success TEXT,
  fetch_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  description TEXT,
  content_text TEXT,
  published_at TEXT,
  author TEXT,
  source TEXT NOT NULL,
  categories TEXT,
  tags TEXT,
  guid TEXT,
  search_keywords TEXT,
  feed_title TEXT,
  reading_time INTEGER DEFAULT 0,
  content_fetched INTEGER DEFAULT 0,
  extraction_method TEXT,
  content_fetched_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source) REFERENCES feed_sources (name)
);

-- Full-text search virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
  title,
  description,
  content_text,
  author,
  source,
  categories,
  search_keywords,
  content='articles',
  content_rowid='id'
);

-- Triggers to keep FTS table in sync
CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, title, description, content_text, author, source, categories, search_keywords)
  VALUES (new.id, new.title, new.description, new.content_text, new.author, new.source, new.categories, new.search_keywords);
END;

CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, description, content_text, author, source, categories, search_keywords)
  VALUES('delete', old.id, old.title, old.description, old.content_text, old.author, old.source, old.categories, old.search_keywords);
END;

CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, description, content_text, author, source, categories, search_keywords)
  VALUES('delete', old.id, old.title, old.description, old.content_text, old.author, old.source, old.categories, old.search_keywords);
  INSERT INTO articles_fts(rowid, title, description, content_text, author, source, categories, search_keywords)
  VALUES (new.id, new.title, new.description, new.content_text, new.author, new.source, new.categories, new.search_keywords);
END;

-- Search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  search_time_ms INTEGER DEFAULT 0,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_source_published ON articles(source, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_content_fetched ON articles(content_fetched, content_fetched_at);
CREATE INDEX IF NOT EXISTS idx_feed_sources_category ON feed_sources(category);
CREATE INDEX IF NOT EXISTS idx_feed_sources_enabled ON feed_sources(enabled);

-- Insert comprehensive feed sources with logical categorization
INSERT OR IGNORE INTO feed_sources (name, url, category, priority, content_fetch_enabled) VALUES

-- === 1. MARKETS & TRADING === (Real-time market news, trading data)
('Yahoo Finance', 'https://finance.yahoo.com/rss/topstories', 'Markets & Trading', 1, 1),
('Bloomberg Markets', 'https://feeds.bloomberg.com/markets/news.rss', 'Markets & Trading', 1, 1),
('WSJ Markets', 'https://feeds.content.dowjones.io/public/rss/RSSMarketsMain', 'Markets & Trading', 1, 1),
('Financial Times Markets', 'https://www.ft.com/markets?format=rss', 'Markets & Trading', 1, 1),
('CNBC Markets', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'Markets & Trading', 1, 1),
('MarketWatch', 'http://feeds.marketwatch.com/marketwatch/topstories', 'Markets & Trading', 1, 1),
('MarketWatch Real-time', 'https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines', 'Markets & Trading', 1, 1),

-- === 2. BUSINESS NEWS === (Corporate news, business strategy, industry)
('Reuters Business', 'https://feeds.reuters.com/reuters/businessNews', 'Business News', 1, 1),
('CNBC Business', 'https://www.cnbc.com/id/10001147/device/rss/rss.html', 'Business News', 1, 1),
('Business Insider', 'https://feeds.businessinsider.com/custom/all', 'Business News', 2, 1),
('Fortune', 'https://fortune.com/feed/', 'Business News', 2, 1),
('Economist Business', 'https://www.economist.com/business/rss.xml', 'Business News', 2, 1),
('NYT Business', 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', 'Business News', 2, 1),
('BBC Business', 'http://feeds.bbci.co.uk/news/business/rss.xml', 'Business News', 2, 1),

-- === 3. ECONOMIC RESEARCH === (Macro economics, monetary policy, central banking)
('Bloomberg Economics', 'https://feeds.bloomberg.com/economics/news.rss', 'Economic Research', 1, 1),
('FT Economics', 'https://www.ft.com/economics?format=rss', 'Economic Research', 1, 1),
('CNBC Economy', 'https://www.cnbc.com/id/20910258/device/rss/rss.html', 'Economic Research', 1, 1),
('NYT Economy', 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml', 'Economic Research', 2, 1),
('Economist Finance', 'https://www.economist.com/finance-and-economics/rss.xml', 'Economic Research', 2, 1),
('Federal Reserve', 'https://www.federalreserve.gov/feeds/press_all.xml', 'Economic Research', 1, 1),
('ECB Press', 'https://www.ecb.europa.eu/rss/press.html', 'Economic Research', 1, 1),
('RBI Press', 'https://www.rbi.org.in/Scripts/Rss.aspx', 'Economic Research', 1, 1),
('IMF News', 'https://www.imf.org/en/News/RSS?Language=ENG', 'Economic Research', 2, 1),
('ET CFO Economy', 'https://cfo.economictimes.indiatimes.com/rss/economy', 'Economic Research', 2, 1),

-- === 4. INVESTMENT ANALYSIS === (Investment commentary, portfolio theory, market analysis)
('Matt Levine', 'https://www.bloomberg.com/opinion/authors/ARbTQlRLRjE/matthew-s-levine.rss', 'Investment Analysis', 1, 1),
('The Big Picture', 'https://ritholtz.com/feed/', 'Investment Analysis', 1, 1),
('Marginal Revolution', 'https://marginalrevolution.com/feed', 'Investment Analysis', 1, 1),
('WSJ Opinion', 'https://feeds.content.dowjones.io/public/rss/RSSOpinion', 'Investment Analysis', 2, 1),
('CFA Institute', 'https://blogs.cfainstitute.org/investor/feed/', 'Investment Analysis', 2, 1),

-- === 5. REGIONAL FOCUS === (Geography-specific financial news)
-- India
('Economic Times Markets', 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', 'Regional - India', 1, 1),
('Hindu Business Line', 'https://www.thehindubusinessline.com/feeder/default.rss', 'Regional - India', 1, 1),
('MoneyControl', 'https://www.moneycontrol.com/rss/business.xml', 'Regional - India', 2, 1),
('NDTV Profit', 'https://prod-qt-images.s3.amazonaws.com/production/bloombergquint/feed.xml', 'Regional - India', 2, 1),
-- Asia
('Nikkei Asia', 'https://asia.nikkei.com/rss/feed/nar', 'Regional - Asia', 2, 1),
('SCMP Business', 'https://www.scmp.com/rss/2/feed', 'Regional - Asia', 2, 1),

-- === 6. TECHNOLOGY & INNOVATION === (Tech industry, fintech, innovation)
('Stratechery', 'https://stratechery.com/feed/', 'Technology', 1, 1),
('Techmeme', 'https://www.techmeme.com/feed.xml', 'Technology', 1, 1),
('FT Technology', 'https://www.ft.com/technology?format=rss', 'Technology', 2, 1),
('NYT Technology', 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', 'Technology', 2, 1),
('The Verge', 'https://www.theverge.com/rss/index.xml', 'Technology', 2, 1),
('Wired', 'https://www.wired.com/feed/rss', 'Technology', 2, 1),

-- === 7. POLICY & REGULATION === (Financial regulation, compliance, government policy)
('SEC Press', 'https://www.sec.gov/news/pressreleases.rss', 'Policy & Regulation', 1, 1),
('SEBI News', 'https://www.sebi.gov.in/sebirss.xml', 'Policy & Regulation', 1, 1),
('Bloomberg Politics', 'https://feeds.bloomberg.com/politics/news.rss', 'Policy & Regulation', 2, 1),
('Foreign Affairs', 'https://www.foreignaffairs.com/rss.xml', 'Policy & Regulation', 3, 1),
('ET CFO Policy', 'https://cfo.economictimes.indiatimes.com/rss/policy', 'Policy & Regulation', 2, 1),

-- === 8. ACADEMIC & RESEARCH === (Think tanks, scholarly analysis)
('Pew Research', 'https://www.pewresearch.org/feed/', 'Academic & Research', 2, 1),
('Project Syndicate', 'https://www.project-syndicate.org/rss', 'Academic & Research', 2, 1),
('Aeon Magazine', 'https://aeon.co/feed.rss', 'Academic & Research', 2, 1),

-- === 9. ALTERNATIVE PERSPECTIVES === (Independent analysis, contrarian views)
('ZeroHedge', 'https://feeds.feedburner.com/zerohedge/feed', 'Alternative Perspectives', 2, 1),
('Paul Krugman', 'https://paulkrugman.substack.com/feed', 'Alternative Perspectives', 2, 1),
('Noahpinion', 'https://www.noahpinion.blog/feed', 'Alternative Perspectives', 2, 1),
('Astral Codex Ten', 'https://www.astralcodexten.com/feed', 'Alternative Perspectives', 3, 1),
('Not Boring', 'https://www.notboring.co/feed', 'Alternative Perspectives', 3, 1),
('Nate Silver', 'https://www.natesilver.net/feed', 'Alternative Perspectives', 3, 1),
('Experimental History', 'https://www.experimental-history.com/feed', 'Alternative Perspectives', 3, 1),

-- === 10. SPECIALIZED MARKETS === (Commodities, niche markets, regulatory filings)
('OilPrice.com', 'https://oilprice.com/rss/main', 'Specialized Markets', 2, 1),
('NSE Financial Results', 'https://nsearchives.nseindia.com/content/RSS/Financial_Results.xml', 'Specialized Markets', 3, 1),
('NSE Circulars', 'https://nsearchives.nseindia.com/content/RSS/Circulars.xml', 'Specialized Markets', 3, 1),

-- === 11. AUDIO CONTENT === (Podcasts and interviews)
('Chat with Traders', 'https://feeds.simplecast.com/wgl4xEgL', 'Audio Content', 3, 0),
('Capital Allocators', 'https://feeds.simplecast.com/6I0NuI9m', 'Audio Content', 3, 0),
('Invest Like the Best', 'https://feeds.simplecast.com/BqbsxVfO', 'Audio Content', 3, 0);