import type { APIRoute } from 'astro';
import { feedScheduler } from '../../../lib/feed-scheduler';
import { feedFetcher } from '../../../lib/feed-fetcher';

// This endpoint is designed to be called by Cloudflare Cron Triggers
// In wrangler.toml, add:
// [[triggers]]
// crons = ["*/30 * * * *"] # Every 30 minutes

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get auth token from headers (for security)
    const authToken = request.headers.get('X-CF-Cron-Auth');
    
    // In production, verify this is a legitimate cron request
    // For now, we'll allow all requests in development
    
    console.log('📅 Scheduled feed fetch triggered');
    
    // Get feed configurations (in production, from database)
    // For now, using sample feeds
    const feeds = [
      {
        id: "wsj_markets",
        name: "WSJ Markets",
        url: "https://feeds.wsj.com/public/resources/MWI_NEWS_MARKETS",
        sourceId: "wsj",
        category: "markets",
        fetchInterval: 30,
        active: true
      },
      {
        id: "bloomberg_economics",
        name: "Bloomberg Economics",
        url: "https://feeds.bloomberg.com/economics/news.rss",
        sourceId: "bloomberg",
        category: "macro",
        fetchInterval: 60,
        active: true
      }
    ];
    
    // Process all feeds
    const result = await feedScheduler.processAllFeeds(feeds);
    
    // TODO: Save fetched items to storage
    // TODO: Update last fetch times
    // TODO: Send notifications for errors
    
    return new Response(JSON.stringify({
      success: true,
      result,
      message: `Processed ${result.feedsProcessed} feeds, ${result.totalNewItems} new items`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Scheduled fetch error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};