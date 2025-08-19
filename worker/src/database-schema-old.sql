-- Feed sources table
CREATE TABLE IF NOT EXISTS feed_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 1,
  content_fetch_enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_fetch TEXT,
  last_success TEXT,
  article_count INTEGER DEFAULT 0,
  content_fetch_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  etag TEXT,
  last_modified TEXT,
  fetch_frequency INTEGER DEFAULT 30
);

-- Articles table with full content support
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  description TEXT,
  content TEXT,
  full_content TEXT,
  content_text TEXT,
  content_length INTEGER DEFAULT 0,
  search_keywords TEXT,
  images TEXT,
  author TEXT,
  published_at TEXT NOT NULL,
  guid TEXT,
  categories TEXT,
  source TEXT NOT NULL,
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
  VALUES ('delete', old.id, old.title, old.description, old.content_text, old.author, old.source, old.categories, old.search_keywords);
END;

CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, description, content_text, author, source, categories, search_keywords)
  VALUES ('delete', old.id, old.title, old.description, old.content_text, old.author, old.source, old.categories, old.search_keywords);
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

-- Insert comprehensive feed sources from markets-feeds project
INSERT OR IGNORE INTO feed_sources (name, url, category, priority, content_fetch_enabled) VALUES

-- === MAJOR NEWS & MARKETS === (High Priority)
('Yahoo Finance', 'https://finance.yahoo.com/rss/topstories', 'Major News', 1, 1),
('Bloomberg Markets', 'https://feeds.bloomberg.com/markets/news.rss', 'Major News', 1, 1),
('WSJ Markets', 'https://feeds.content.dowjones.io/public/rss/RSSMarketsMain', 'Major News', 1, 1),
('Financial Times Markets', 'https://www.ft.com/markets?format=rss', 'Major News', 1, 1),
('Reuters Business', 'https://feeds.reuters.com/reuters/businessNews', 'Major News', 1, 1),
('CNBC Markets', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'Major News', 1, 1),
('CNBC Business', 'https://www.cnbc.com/id/10001147/device/rss/rss.html', 'Major News', 1, 1),
('MarketWatch', 'http://feeds.marketwatch.com/marketwatch/topstories', 'Major News', 1, 1),
('MarketWatch Real-time', 'https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines', 'Major News', 1, 1),
('Business Insider', 'https://feeds.businessinsider.com/custom/all', 'Major News', 2, 1),
('Fortune', 'https://fortune.com/feed/', 'Major News', 2, 1),
('Economist Business', 'https://www.economist.com/business/rss.xml', 'Major News', 2, 1),
('NYT Business', 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', 'Major News', 2, 1),
('BBC Business', 'http://feeds.bbci.co.uk/news/business/rss.xml', 'Major News', 2, 1),
('ZeroHedge', 'https://feeds.feedburner.com/zerohedge/feed', 'Major News', 2, 1),

-- === INDIAN MARKETS === (High Priority)
('Economic Times Markets', 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', 'Indian Markets', 1, 1),
('Hindu Business Line', 'https://www.thehindubusinessline.com/feeder/default.rss', 'Indian Markets', 2, 1),
('MoneyControl', 'https://www.moneycontrol.com/rss/business.xml', 'Indian Markets', 2, 1),
('NDTV Profit', 'https://prod-qt-images.s3.amazonaws.com/production/bloombergquint/feed.xml', 'Indian Markets', 2, 1),

-- === INTERNATIONAL MARKETS ===
('Nikkei Asia', 'https://asia.nikkei.com/rss/feed/nar', 'Major News', 2, 1),
('SCMP Business', 'https://www.scmp.com/rss/2/feed', 'Major News', 2, 1),

-- === ECONOMICS & MACRO === (Medium Priority)
('Bloomberg Economics', 'https://feeds.bloomberg.com/economics/news.rss', 'Economics', 1, 1),
('FT Economics', 'https://www.ft.com/economics?format=rss', 'Economics', 1, 1),
('CNBC Economy', 'https://www.cnbc.com/id/20910258/device/rss/rss.html', 'Economics', 1, 1),
('NYT Economy', 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml', 'Economics', 2, 1),
('Economist Finance', 'https://www.economist.com/finance-and-economics/rss.xml', 'Economics', 2, 1),
('ET CFO Economy', 'https://cfo.economictimes.indiatimes.com/rss/economy', 'Economics', 2, 1),
('IMF News', 'https://www.imf.org/en/News/RSS?Language=ENG', 'Economics', 3, 1),

-- === POLICY & REGULATION === (Medium Priority)
('Federal Reserve', 'https://www.federalreserve.gov/feeds/press_all.xml', 'Policy', 1, 1),
('ECB Press', 'https://www.ecb.europa.eu/rss/press.html', 'Policy', 1, 1),
('RBI Press', 'https://www.rbi.org.in/Scripts/Rss.aspx', 'Policy', 1, 1),
('SEC Press', 'https://www.sec.gov/news/pressreleases.rss', 'Policy', 1, 1),
('Bloomberg Politics', 'https://feeds.bloomberg.com/politics/news.rss', 'Policy', 2, 1),
('Foreign Affairs', 'https://www.foreignaffairs.com/rss.xml', 'Policy', 3, 1),
('ET CFO Policy', 'https://cfo.economictimes.indiatimes.com/rss/policy', 'Policy', 2, 1),

-- === EXPERT ANALYSIS & COMMENTARY ===
('Matt Levine', 'https://www.bloomberg.com/opinion/authors/ARbTQlRLRjE/matthew-s-levine.rss', 'Specialty Finance', 1, 1),
('The Big Picture', 'https://ritholtz.com/feed/', 'Specialty Finance', 1, 1),
('Marginal Revolution', 'https://marginalrevolution.com/feed', 'Specialty Finance', 1, 1),
('Project Syndicate', 'https://www.project-syndicate.org/rss', 'Specialty Finance', 2, 1),
('WSJ Opinion', 'https://feeds.content.dowjones.io/public/rss/RSSOpinion', 'Specialty Finance', 2, 1),

-- === SUBSTACK FEEDS === (Lower Priority - Rate Limited)
('Paul Krugman', 'https://paulkrugman.substack.com/feed', 'Specialty Finance', 3, 1),
('Noahpinion', 'https://www.noahpinion.blog/feed', 'Specialty Finance', 3, 1),

-- === TECHNOLOGY ===
('Stratechery', 'https://stratechery.com/feed/', 'Technology', 1, 1),
('FT Technology', 'https://www.ft.com/technology?format=rss', 'Technology', 2, 1),
('NYT Technology', 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', 'Technology', 2, 1),
('Techmeme', 'https://www.techmeme.com/feed.xml', 'Technology', 2, 0),
('The Verge', 'https://www.theverge.com/rss/index.xml', 'Technology', 2, 1),
('Wired', 'https://www.wired.com/feed/rss', 'Technology', 2, 1),

-- === ACADEMIC RESEARCH ===
('CFA Institute', 'https://blogs.cfainstitute.org/investor/feed/', 'Academic Research', 2, 1),
('Pew Research', 'https://www.pewresearch.org/feed/', 'Academic Research', 2, 1),

-- === COMMODITIES ===
('OilPrice.com', 'https://oilprice.com/rss/main', 'Commodities', 2, 1),

-- === REGULATORY FILINGS ===
('NSE Financial Results', 'https://nsearchives.nseindia.com/content/RSS/Financial_Results.xml', 'Filings', 3, 1),
('NSE Circulars', 'https://nsearchives.nseindia.com/content/RSS/Circulars.xml', 'Filings', 3, 1),
('SEBI News', 'https://www.sebi.gov.in/sebirss.xml', 'Filings', 2, 1),

-- === THOUGHTFUL INSIGHTS === (Low Priority - Substack Heavy)
('Astral Codex Ten', 'https://www.astralcodexten.com/feed', 'Insights', 3, 1),
('Not Boring', 'https://www.notboring.co/feed', 'Insights', 3, 1),
('Nate Silver', 'https://www.natesilver.net/feed', 'Insights', 3, 1),
('Experimental History', 'https://www.experimental-history.com/feed', 'Insights', 3, 1),
('Aeon Magazine', 'https://aeon.co/feed.rss', 'Insights', 3, 1),

-- === PODCASTS ===
('Chat with Traders', 'https://feeds.simplecast.com/wgl4xEgL', 'Podcasts', 4, 0),
('Capital Allocators', 'https://feeds.simplecast.com/6I0NuI9m', 'Podcasts', 4, 0),
('Invest Like the Best', 'https://feeds.simplecast.com/BqbsxVfO', 'Podcasts', 4, 0);