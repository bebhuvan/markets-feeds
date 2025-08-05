import type { APIRoute } from 'astro';
import { dataLoader } from '../../../lib/data-loader';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { cacheType = 'all' } = body;
    
    let clearedCaches = [];
    
    if (cacheType === 'all' || cacheType === 'feeds') {
      dataLoader.clearCache();
      clearedCaches.push('feeds');
    }
    
    // Force reload to verify cache clearing worked
    const metrics = {
      totalArticles: 0,
      lastUpdate: new Date().toISOString()
    };
    
    try {
      const allItems = await dataLoader.loadData();
      metrics.totalArticles = allItems.length;
      metrics.lastUpdate = allItems.length > 0 
        ? new Date(Math.max(...allItems.map(item => new Date(item.fetchedAt || item.publishedAt).getTime()))).toISOString()
        : new Date().toISOString();
    } catch (error) {
      console.error('Error reloading feeds after cache clear:', error);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `Cache cleared successfully: ${clearedCaches.join(', ')}`,
      data: {
        clearedCaches,
        metrics,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error clearing cache:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to clear cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};