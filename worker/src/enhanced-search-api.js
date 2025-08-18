// Enhanced Search API for RSS Feed Aggregator
// Supports full-text search, filtering, and content analysis

export class EnhancedSearchAPI {
  constructor(db) {
    this.db = db;
  }

  // Main search method with full-text capabilities
  async search(query, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        limit = 50,
        offset = 0,
        source = null,
        category = null,
        since = null,
        until = null,
        contentOnly = false, // Only articles with full content
        minReadingTime = null,
        maxReadingTime = null,
        sortBy = 'relevance' // relevance, date, reading_time
      } = options;

      let searchResults;
      
      if (query && query.trim().length > 0) {
        // Full-text search
        searchResults = await this.performFullTextSearch(query, options);
      } else {
        // Browse without search
        searchResults = await this.browseArticles(options);
      }

      // Log search analytics
      await this.logSearch(query, searchResults.length, Date.now() - startTime);

      return {
        query: query || '',
        results: searchResults,
        total: searchResults.length,
        searchTime: Date.now() - startTime,
        hasMore: searchResults.length === limit
      };

    } catch (error) {
      console.error('Search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Full-text search implementation
  async performFullTextSearch(query, options) {
    const {
      limit = 50,
      offset = 0,
      source,
      category,
      since,
      until,
      contentOnly,
      minReadingTime,
      maxReadingTime,
      sortBy = 'relevance'
    } = options;

    // Sanitize search query for FTS5
    const sanitizedQuery = this.sanitizeSearchQuery(query);
    
    let sql = `
      SELECT 
        a.id,
        a.article_id,
        a.title,
        a.link,
        a.description,
        a.author,
        a.published_at,
        a.source,
        a.categories,
        a.reading_time,
        a.content_length,
        a.content_fetched,
        s.category as source_category,
        s.priority as source_priority,
        fts.rank,
        snippet(articles_fts, 2, '<mark>', '</mark>', '...', 64) as excerpt
      FROM articles a
      JOIN articles_fts fts ON a.id = fts.rowid
      JOIN feed_sources s ON a.source = s.name
      WHERE articles_fts MATCH ?
    `;

    const bindings = [sanitizedQuery];

    // Add filters
    if (source) {
      sql += ` AND a.source = ?`;
      bindings.push(source);
    }

    if (category) {
      sql += ` AND s.category = ?`;
      bindings.push(category);
    }

    if (since) {
      sql += ` AND a.published_at >= ?`;
      bindings.push(since);
    }

    if (until) {
      sql += ` AND a.published_at <= ?`;
      bindings.push(until);
    }

    if (contentOnly) {
      sql += ` AND a.content_fetched = 1`;
    }

    if (minReadingTime) {
      sql += ` AND a.reading_time >= ?`;
      bindings.push(minReadingTime);
    }

    if (maxReadingTime) {
      sql += ` AND a.reading_time <= ?`;
      bindings.push(maxReadingTime);
    }

    // Add sorting
    switch (sortBy) {
      case 'date':
        sql += ` ORDER BY a.published_at DESC`;
        break;
      case 'reading_time':
        sql += ` ORDER BY a.reading_time DESC`;
        break;
      case 'relevance':
      default:
        sql += ` ORDER BY fts.rank DESC, a.published_at DESC`;
        break;
    }

    sql += ` LIMIT ? OFFSET ?`;
    bindings.push(limit, offset);

    const { results } = await this.db.prepare(sql).bind(...bindings).all();
    
    return results.map(row => this.formatSearchResult(row));
  }

  // Browse articles without search
  async browseArticles(options) {
    const {
      limit = 50,
      offset = 0,
      source,
      category,
      since,
      until,
      contentOnly,
      minReadingTime,
      maxReadingTime,
      sortBy = 'date'
    } = options;

    let sql = `
      SELECT 
        a.id,
        a.article_id,
        a.title,
        a.link,
        a.description,
        a.author,
        a.published_at,
        a.source,
        a.categories,
        a.reading_time,
        a.content_length,
        a.content_fetched,
        s.category as source_category,
        s.priority as source_priority
      FROM articles a
      JOIN feed_sources s ON a.source = s.name
      WHERE 1=1
    `;

    const bindings = [];

    // Add filters (same as search)
    if (source) {
      sql += ` AND a.source = ?`;
      bindings.push(source);
    }

    if (category) {
      sql += ` AND s.category = ?`;
      bindings.push(category);
    }

    if (since) {
      sql += ` AND a.published_at >= ?`;
      bindings.push(since);
    }

    if (until) {
      sql += ` AND a.published_at <= ?`;
      bindings.push(until);
    }

    if (contentOnly) {
      sql += ` AND a.content_fetched = 1`;
    }

    if (minReadingTime) {
      sql += ` AND a.reading_time >= ?`;
      bindings.push(minReadingTime);
    }

    if (maxReadingTime) {
      sql += ` AND a.reading_time <= ?`;
      bindings.push(maxReadingTime);
    }

    // Add sorting
    switch (sortBy) {
      case 'reading_time':
        sql += ` ORDER BY a.reading_time DESC`;
        break;
      case 'source':
        sql += ` ORDER BY a.source ASC, a.published_at DESC`;
        break;
      case 'date':
      default:
        sql += ` ORDER BY a.published_at DESC`;
        break;
    }

    sql += ` LIMIT ? OFFSET ?`;
    bindings.push(limit, offset);

    const { results } = await this.db.prepare(sql).bind(...bindings).all();
    
    return results.map(row => this.formatSearchResult(row));
  }

  // Get article suggestions based on content similarity
  async getSuggestions(articleId, limit = 5) {
    try {
      // Get the source article
      const sourceArticle = await this.db.prepare(`
        SELECT title, description, content_text, source, categories
        FROM articles 
        WHERE article_id = ?
      `).bind(articleId).first();

      if (!sourceArticle) {
        return [];
      }

      // Extract keywords from the source article
      const keywords = this.extractKeywords(
        `${sourceArticle.title} ${sourceArticle.description} ${sourceArticle.content_text || ''}`
      );

      if (keywords.length === 0) {
        return [];
      }

      // Search for similar articles using extracted keywords
      const searchQuery = keywords.slice(0, 5).join(' OR '); // Top 5 keywords
      
      const { results } = await this.db.prepare(`
        SELECT 
          a.article_id,
          a.title,
          a.link,
          a.source,
          a.published_at,
          a.reading_time,
          fts.rank
        FROM articles a
        JOIN articles_fts fts ON a.id = fts.rowid
        WHERE articles_fts MATCH ?
          AND a.article_id != ?
          AND a.published_at >= date('now', '-30 days')
        ORDER BY fts.rank DESC
        LIMIT ?
      `).bind(searchQuery, articleId, limit).all();

      return results.map(row => ({
        id: row.article_id,
        title: row.title,
        link: row.link,
        source: row.source,
        publishedAt: row.published_at,
        readingTime: row.reading_time,
        relevanceScore: row.rank
      }));

    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  // Get trending topics based on recent search queries and article keywords
  async getTrendingTopics(limit = 10) {
    try {
      // Get trending keywords from recent articles
      const { results } = await this.db.prepare(`
        SELECT 
          json_extract(value, '$') as keyword,
          COUNT(*) as article_count,
          AVG(reading_time) as avg_reading_time
        FROM articles, json_each(search_keywords)
        WHERE published_at >= date('now', '-7 days')
          AND content_fetched = 1
        GROUP BY json_extract(value, '$')
        HAVING article_count >= 3
        ORDER BY article_count DESC, avg_reading_time DESC
        LIMIT ?
      `).bind(limit).all();

      return results.map(row => ({
        keyword: row.keyword,
        articleCount: row.article_count,
        avgReadingTime: Math.round(row.avg_reading_time || 0),
        trend: 'up' // Could be enhanced with historical comparison
      }));

    } catch (error) {
      console.error('Error getting trending topics:', error);
      return [];
    }
  }

  // Advanced content analysis
  async getContentAnalysis(options = {}) {
    const {
      since = "date('now', '-30 days')",
      category = null
    } = options;

    try {
      let sql = `
        SELECT 
          COUNT(*) as total_articles,
          COUNT(CASE WHEN content_fetched = 1 THEN 1 END) as articles_with_content,
          AVG(content_length) as avg_content_length,
          AVG(reading_time) as avg_reading_time,
          source,
          COUNT(DISTINCT source) as unique_sources
        FROM articles a
        JOIN feed_sources s ON a.source = s.name
        WHERE a.published_at >= ?
      `;

      const bindings = [since];

      if (category) {
        sql += ` AND s.category = ?`;
        bindings.push(category);
      }

      sql += ` GROUP BY source ORDER BY total_articles DESC`;

      const { results } = await this.db.prepare(sql).bind(...bindings).all();

      // Get overall stats
      const overallStats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_articles,
          COUNT(CASE WHEN content_fetched = 1 THEN 1 END) as articles_with_content,
          AVG(content_length) as avg_content_length,
          AVG(reading_time) as avg_reading_time,
          COUNT(DISTINCT source) as unique_sources
        FROM articles a
        JOIN feed_sources s ON a.source = s.name
        WHERE a.published_at >= ?
        ${category ? 'AND s.category = ?' : ''}
      `).bind(...bindings).first();

      return {
        overall: {
          totalArticles: overallStats.total_articles,
          articlesWithContent: overallStats.articles_with_content,
          contentFetchRate: (overallStats.articles_with_content / overallStats.total_articles * 100).toFixed(1) + '%',
          avgContentLength: Math.round(overallStats.avg_content_length || 0),
          avgReadingTime: Math.round(overallStats.avg_reading_time || 0),
          uniqueSources: overallStats.unique_sources
        },
        bySource: results.map(row => ({
          source: row.source,
          totalArticles: row.total_articles,
          articlesWithContent: row.articles_with_content,
          contentFetchRate: (row.articles_with_content / row.total_articles * 100).toFixed(1) + '%',
          avgContentLength: Math.round(row.avg_content_length || 0),
          avgReadingTime: Math.round(row.avg_reading_time || 0)
        }))
      };

    } catch (error) {
      console.error('Error getting content analysis:', error);
      throw error;
    }
  }

  // Get search suggestions as user types
  async getSearchSuggestions(partialQuery, limit = 8) {
    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }

    try {
      // Get suggestions from recent article titles and popular search terms
      const titleSuggestions = await this.db.prepare(`
        SELECT DISTINCT 
          title as suggestion,
          'article' as type,
          source,
          published_at
        FROM articles 
        WHERE title LIKE '%' || ? || '%'
          AND published_at >= date('now', '-30 days')
        ORDER BY published_at DESC
        LIMIT ?
      `).bind(partialQuery, Math.floor(limit / 2)).all();

      // Get suggestions from search analytics
      const searchSuggestions = await this.db.prepare(`
        SELECT DISTINCT
          query as suggestion,
          'search' as type,
          COUNT(*) as usage_count
        FROM search_analytics 
        WHERE query LIKE '%' || ? || '%'
          AND created_at >= date('now', '-7 days')
        GROUP BY query
        ORDER BY usage_count DESC
        LIMIT ?
      `).bind(partialQuery, Math.floor(limit / 2)).all();

      const allSuggestions = [
        ...titleSuggestions.map(row => ({
          text: row.suggestion,
          type: row.type,
          source: row.source,
          meta: `Article from ${row.source}`
        })),
        ...searchSuggestions.map(row => ({
          text: row.suggestion,
          type: row.type,
          meta: `${row.usage_count} searches`
        }))
      ];

      return allSuggestions.slice(0, limit);

    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Utility methods
  sanitizeSearchQuery(query) {
    // Escape special FTS5 characters and handle phrases
    return query
      .replace(/"/g, '""')  // Escape quotes
      .replace(/\*/g, '')   // Remove wildcards
      .replace(/\+/g, ' ')  // Replace + with space
      .replace(/\-/g, ' ')  // Replace - with space
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  extractKeywords(text) {
    if (!text) return [];
    
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return top words
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  isStopWord(word) {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this',
      'that', 'these', 'those', 'a', 'an', 'as', 'from', 'up', 'out', 'if'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }

  formatSearchResult(row) {
    return {
      id: row.article_id,
      title: row.title,
      link: row.link,
      description: row.description,
      excerpt: row.excerpt || row.description, // Use snippet if available
      author: row.author,
      publishedAt: row.published_at,
      source: row.source,
      sourceCategory: row.source_category,
      sourcePriority: row.source_priority,
      categories: JSON.parse(row.categories || '[]'),
      readingTime: row.reading_time,
      contentLength: row.content_length,
      contentFetched: row.content_fetched === 1,
      relevanceScore: row.rank || 0
    };
  }

  async logSearch(query, resultCount, searchTime) {
    try {
      await this.db.prepare(`
        INSERT INTO search_analytics (query, results_count, search_time_ms)
        VALUES (?, ?, ?)
      `).bind(query || '', resultCount, searchTime).run();
    } catch (error) {
      // Don't fail the search if logging fails
      console.warn('Failed to log search:', error);
    }
  }
}

// Enhanced Cloudflare Worker search endpoints
export async function handleSearch(request, env) {
  const url = new URL(request.url);
  const searchAPI = new EnhancedSearchAPI(env.DB);
  
  try {
    const query = url.searchParams.get('q') || '';
    const options = {
      limit: parseInt(url.searchParams.get('limit')) || 50,
      offset: parseInt(url.searchParams.get('offset')) || 0,
      source: url.searchParams.get('source'),
      category: url.searchParams.get('category'),
      since: url.searchParams.get('since'),
      until: url.searchParams.get('until'),
      contentOnly: url.searchParams.get('content_only') === 'true',
      minReadingTime: url.searchParams.get('min_reading_time') ? parseInt(url.searchParams.get('min_reading_time')) : null,
      maxReadingTime: url.searchParams.get('max_reading_time') ? parseInt(url.searchParams.get('max_reading_time')) : null,
      sortBy: url.searchParams.get('sort') || 'relevance'
    };

    const results = await searchAPI.search(query, options);
    
    return Response.json(results, {
      headers: {
        'Cache-Control': 's-maxage=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      query: url.searchParams.get('q') || ''
    }, { status: 500 });
  }
}

export async function handleSuggestions(request, env) {
  const url = new URL(request.url);
  const searchAPI = new EnhancedSearchAPI(env.DB);
  
  try {
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit')) || 8;
    
    const suggestions = await searchAPI.getSearchSuggestions(query, limit);
    
    return Response.json({ suggestions }, {
      headers: {
        'Cache-Control': 's-maxage=600', // Cache for 10 minutes
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function handleTrending(request, env) {
  const searchAPI = new EnhancedSearchAPI(env.DB);
  
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    
    const trending = await searchAPI.getTrendingTopics(limit);
    
    return Response.json({ trending }, {
      headers: {
        'Cache-Control': 's-maxage=1800', // Cache for 30 minutes
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function handleAnalytics(request, env) {
  const searchAPI = new EnhancedSearchAPI(env.DB);
  
  try {
    const url = new URL(request.url);
    const since = url.searchParams.get('since') || "date('now', '-30 days')";
    const category = url.searchParams.get('category');
    
    const analysis = await searchAPI.getContentAnalysis({ since, category });
    
    return Response.json(analysis, {
      headers: {
        'Cache-Control': 's-maxage=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}