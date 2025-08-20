import { EnhancedContentFetcher } from './enhanced-content-fetcher.js';
import { 
  EnhancedSearchAPI, 
  handleSearch, 
  handleSuggestions, 
  handleTrending, 
  handleAnalytics 
} from './enhanced-search-api.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Enable CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Pragma, Expires'
        }
      });
    }
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Pragma, Expires'
    };
    
    try {
      let response;
      
      switch (url.pathname) {
        case '/fetch-feeds':
          response = await handleFeedFetch(request, env);
          break;
        case '/fetch-feeds-batch':
          response = await handleBatchFeedFetch(request, env);
          break;
        case '/api/search':
          response = await handleSearch(request, env);
          break;
        case '/api/suggestions':
          response = await handleSuggestions(request, env);
          break;
        case '/api/trending':
          response = await handleTrending(request, env);
          break;
        case '/api/analytics':
          response = await handleAnalytics(request, env);
          break;
        case '/api/articles':
          response = await handleGetArticles(request, env);
          break;
        case '/api/sources':
          response = await handleGetSources(request, env);
          break;
        default:
          response = new Response('Not Found', { status: 404 });
      }
      
      // Add CORS headers to all responses
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(scheduledFeedFetch(env));
  }
};

async function handleFeedFetch(request, env) {
  try {
    const results = await fetchAllFeeds(env);
    await storeFeedResults(results, env);
    
    const stats = {
      success: true,
      processed: results.length,
      successful: results.filter(r => !r.error).length,
      contentFetched: results.reduce((acc, r) => 
        acc + (r.articles?.filter(a => a.contentFetched).length || 0), 0),
      timestamp: new Date().toISOString()
    };
    
    return Response.json(stats);
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

async function fetchAllFeeds(env) {
  const feedConfigs = await getFeedConfigs(env);
  
  const fetcher = new EnhancedContentFetcher({
    timeout: 20000,
    maxRetries: 2,
    enableContentFetching: true,
    contentFetchConcurrency: 5,
    contentFetchDelay: 1000,
    maxContentLength: 30000
  });

  return await fetcher.fetchMultipleFeeds(feedConfigs, 8);
}

async function getFeedConfigs(env) {
  const { results } = await env.DB.prepare(`
    SELECT name, url, category, enabled, priority, content_fetch_enabled,
           etag, last_modified, last_fetch
    FROM feed_sources 
    WHERE enabled = 1
    ORDER BY priority ASC, name ASC
  `).all();

  return results.map(row => ({
    name: row.name,
    url: row.url,
    category: row.category,
    enabled: row.enabled === 1,
    priority: row.priority,
    contentFetchEnabled: row.content_fetch_enabled === 1,
    etag: row.etag,
    lastModified: row.last_modified
  }));
}

async function storeFeedResults(results, env) {
  for (const result of results) {
    if (result.error) {
      await logFeedError(env, result);
      continue;
    }

    // Update source metadata
    await updateSourceMetadata(env, result);

    // Store articles with enhanced data
    for (const article of result.articles || []) {
      await storeEnhancedArticle(env, article);
    }
  }
}

async function storeEnhancedArticle(env, article) {
  // Check if article already exists
  const existing = await env.DB.prepare(`
    SELECT id, content_fetched FROM articles WHERE article_id = ?
  `).bind(article.id).first();

  if (existing) {
    // Update existing article, but don't overwrite good content with bad
    const shouldUpdateContent = article.contentFetched && 
      (!existing.content_fetched || article.contentLength > 1000);

    if (shouldUpdateContent) {
      await env.DB.prepare(`
        UPDATE articles 
        SET 
          title = ?,
          description = ?,
          content = ?,
          full_content = ?,
          content_text = ?,
          content_length = ?,
          search_keywords = ?,
          images = ?,
          reading_time = ?,
          content_fetched = ?,
          extraction_method = ?,
          content_fetched_at = ?,
          updated_at = ?
        WHERE article_id = ?
      `).bind(
        article.title,
        article.description,
        article.content,
        article.fullContent || '',
        article.contentText || '',
        article.contentLength || 0,
        JSON.stringify(article.searchKeywords || []),
        JSON.stringify(article.images || []),
        article.readingTime || 0,
        article.contentFetched ? 1 : 0,
        article.extractionMethod || null,
        article.contentFetched ? new Date().toISOString() : null,
        new Date().toISOString(),
        article.id
      ).run();
    } else {
      // Just update basic metadata
      await env.DB.prepare(`
        UPDATE articles 
        SET 
          title = ?,
          description = ?,
          updated_at = ?
        WHERE article_id = ?
      `).bind(
        article.title,
        article.description,
        new Date().toISOString(),
        article.id
      ).run();
    }
  } else {
    // Insert new article with all enhanced data
    await env.DB.prepare(`
      INSERT INTO articles (
        article_id, title, link, description, content, full_content,
        content_text, content_length, search_keywords, images, author,
        published_at, guid, categories, source, feed_title, reading_time,
        content_fetched, extraction_method, content_fetched_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      article.id,
      article.title,
      article.link,
      article.description,
      article.content,
      article.fullContent || '',
      article.contentText || '',
      article.contentLength || 0,
      JSON.stringify(article.searchKeywords || []),
      JSON.stringify(article.images || []),
      article.author,
      article.publishedAt,
      article.guid,
      JSON.stringify(article.categories),
      article.source,
      article.feedTitle,
      article.readingTime || 0,
      article.contentFetched ? 1 : 0,
      article.extractionMethod || null,
      article.contentFetched ? new Date().toISOString() : null,
      article.extractedAt,
      article.extractedAt
    ).run();
  }
}

async function updateSourceMetadata(env, result) {
  await env.DB.prepare(`
    UPDATE feed_sources 
    SET 
      last_fetch = ?,
      last_success = ?,
      article_count = ?,
      content_fetch_count = ?,
      etag = ?,
      last_modified = ?,
      error_count = 0,
      last_error = NULL
    WHERE name = ?
  `).bind(
    result.fetchedAt,
    result.fetchedAt,
    result.articleCount,
    result.articles?.filter(a => a.contentFetched).length || 0,
    result.metadata?.etag,
    result.metadata?.lastModified,
    result.source
  ).run();
}

async function logFeedError(env, result) {
  await env.DB.prepare(`
    UPDATE feed_sources 
    SET 
      last_fetch = ?,
      error_count = error_count + 1,
      last_error = ?
    WHERE name = ?
  `).bind(
    result.fetchedAt,
    JSON.stringify(result.error),
    result.source
  ).run();
}

async function handleGetArticles(request, env) {
  const url = new URL(request.url);
  const searchAPI = new EnhancedSearchAPI(env.DB);
  
  try {
    const options = {
      limit: parseInt(url.searchParams.get('limit')) || 50,
      offset: parseInt(url.searchParams.get('offset')) || 0,
      source: url.searchParams.get('source'),
      category: url.searchParams.get('category'),
      since: url.searchParams.get('since'),
      contentOnly: url.searchParams.get('content_only') === 'true',
      sortBy: url.searchParams.get('sort') || 'date'
    };

    const results = await searchAPI.browseArticles(options);
    
    return Response.json({
      articles: results,
      total: results.length,
      hasMore: results.length === options.limit
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleGetSources(request, env) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT 
        s.*,
        COALESCE(stats.total_articles, 0) as total_articles,
        COALESCE(stats.articles_today, 0) as articles_today,
        COALESCE(stats.articles_week, 0) as articles_week
      FROM feed_sources s
      LEFT JOIN (
        SELECT 
          source,
          COUNT(*) as total_articles,
          COUNT(CASE WHEN date(published_at) = date('now') THEN 1 END) as articles_today,
          COUNT(CASE WHEN published_at >= date('now', '-7 days') THEN 1 END) as articles_week
        FROM articles 
        GROUP BY source
      ) stats ON s.name = stats.source
      ORDER BY s.priority ASC, s.name ASC
    `).all();

    return Response.json(results.map(row => ({
      ...row,
      enabled: row.enabled === 1,
      contentFetchEnabled: row.content_fetch_enabled === 1
    })), {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function scheduledFeedFetch(env) {
  console.log('Starting scheduled feed fetch');
  
  try {
    const results = await fetchAllFeeds(env);
    await storeFeedResults(results, env);
    
    const stats = {
      totalFeeds: results.length,
      successfulFeeds: results.filter(r => !r.error).length,
      totalArticles: results.reduce((acc, r) => acc + (r.articleCount || 0), 0),
      articlesWithContent: results.reduce((acc, r) => 
        acc + (r.articles?.filter(a => a.contentFetched).length || 0), 0)
    };
    
    console.log('Scheduled feed fetch completed:', stats);
    
    // Optional: Clean up old articles
    await cleanupOldArticles(env);
    
  } catch (error) {
    console.error('Scheduled fetch failed:', error);
  }
}

async function cleanupOldArticles(env) {
  try {
    // Keep articles from priority sources longer
    await env.DB.prepare(`
      DELETE FROM articles 
      WHERE published_at < date('now', '-90 days')
      AND source IN (
        SELECT name FROM feed_sources 
        WHERE priority > 2 AND enabled = 1
      )
    `).run();
    
    // Keep priority sources for 6 months
    await env.DB.prepare(`
      DELETE FROM articles 
      WHERE published_at < date('now', '-180 days')
      AND source IN (
        SELECT name FROM feed_sources 
        WHERE priority <= 2 AND enabled = 1
      )
    `).run();
    
    console.log('Article cleanup completed');
  } catch (error) {
    console.warn('Article cleanup failed:', error);
  }
}

async function handleBatchFeedFetch(request, env) {
  try {
    const url = new URL(request.url);
    const batchSize = parseInt(url.searchParams.get('batch_size')) || 5;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    
    // Get a batch of feeds to process
    const feedConfigs = await getFeedConfigsBatch(env, batchSize, offset);
    
    if (feedConfigs.length === 0) {
      return Response.json({
        success: true,
        processed: 0,
        message: 'No more feeds to process',
        hasMore: false
      });
    }
    
    const fetcher = new EnhancedContentFetcher({
      timeout: 10000,
      maxRetries: 0,
      enableContentFetching: false, // Disable to speed up processing
      contentFetchConcurrency: 1,
      contentFetchDelay: 0,
      maxContentLength: 10000
    });

    const results = await fetcher.fetchMultipleFeeds(feedConfigs, 1); // Single feed concurrency
    await storeFeedResults(results, env);
    
    // Check if there are more feeds to process
    const totalFeeds = await getTotalEnabledFeeds(env);
    const hasMore = (offset + batchSize) < totalFeeds;
    
    const stats = {
      success: true,
      processed: results.length,
      successful: results.filter(r => !r.error).length,
      contentFetched: results.reduce((acc, r) => 
        acc + (r.articles?.filter(a => a.contentFetched).length || 0), 0),
      hasMore,
      nextOffset: hasMore ? offset + batchSize : null,
      timestamp: new Date().toISOString()
    };
    
    return Response.json(stats);
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

async function getFeedConfigsBatch(env, limit = 5, offset = 0) {
  const { results } = await env.DB.prepare(`
    SELECT name, url, category, enabled, priority, content_fetch_enabled,
           etag, last_modified, last_fetch
    FROM feed_sources 
    WHERE enabled = 1
    ORDER BY priority ASC, name ASC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  return results.map(row => ({
    name: row.name,
    url: row.url,
    category: row.category,
    enabled: row.enabled === 1,
    priority: row.priority,
    contentFetchEnabled: row.content_fetch_enabled === 1,
    etag: row.etag,
    lastModified: row.last_modified
  }));
}

async function getTotalEnabledFeeds(env) {
  const result = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM feed_sources WHERE enabled = 1
  `).first();
  
  return result.count;
}