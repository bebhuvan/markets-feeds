-- Markets Feeds D1 Database Schema
-- Optimized for RSS feed aggregation and fast querying

-- Articles table - main content storage
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  description TEXT,
  published_at INTEGER NOT NULL, -- Unix timestamp for efficient sorting
  fetched_at INTEGER NOT NULL,   -- When we fetched this article
  source_id TEXT NOT NULL,
  category TEXT NOT NULL,
  guid TEXT,
  author TEXT,
  word_count INTEGER DEFAULT 0,
  
  -- Indexing for performance
  FOREIGN KEY (source_id) REFERENCES sources(source_id)
);

-- Sources table - feed configuration
CREATE TABLE sources (
  source_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  active BOOLEAN DEFAULT 1,
  fetch_interval INTEGER DEFAULT 180, -- minutes
  last_fetched INTEGER,
  last_success INTEGER,
  error_count INTEGER DEFAULT 0,
  total_articles INTEGER DEFAULT 0
);

-- Category stats for quick access
CREATE TABLE category_stats (
  category TEXT PRIMARY KEY,
  article_count INTEGER DEFAULT 0,
  last_updated INTEGER NOT NULL
);

-- Search terms tracking for analytics
CREATE TABLE search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  results_count INTEGER,
  searched_at INTEGER NOT NULL,
  ip_hash TEXT -- Privacy-friendly analytics
);

-- Indexes for performance
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_source_id ON articles(source_id);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_fetched_at ON articles(fetched_at);
CREATE INDEX idx_sources_active ON sources(active);
CREATE INDEX idx_sources_last_fetched ON sources(last_fetched);

-- Full-text search index
CREATE VIRTUAL TABLE articles_fts USING fts5(
  title, 
  description,
  content=articles,
  content_rowid=rowid
);

-- Trigger to keep FTS in sync
CREATE TRIGGER articles_fts_insert AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, title, description) 
  VALUES (new.rowid, new.title, new.description);
END;

CREATE TRIGGER articles_fts_delete AFTER DELETE ON articles BEGIN
  DELETE FROM articles_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER articles_fts_update AFTER UPDATE ON articles BEGIN
  DELETE FROM articles_fts WHERE rowid = old.rowid;
  INSERT INTO articles_fts(rowid, title, description) 
  VALUES (new.rowid, new.title, new.description);
END;