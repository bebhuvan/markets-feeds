import type { APIRoute } from 'astro';
import { dataLoader } from '../../../lib/data-loader';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Clear the cache to force fresh data loading
    dataLoader.clearCache();
    
    // Reload all data
    const allItems = await dataLoader.loadData();
    const categoryCounts = await dataLoader.getCategoryCounts();
    const sourceCounts = await dataLoader.getSourceCounts();
    
    // Calculate metrics
    const last24Hours = allItems.filter(item => {
      const itemDate = new Date(item.publishedAt);
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return itemDate >= cutoff;
    }).length;

    const lastUpdate = allItems.length > 0 
      ? new Date(Math.max(...allItems.map(item => new Date(item.fetchedAt || item.publishedAt).getTime())))
      : new Date();

    return new Response(JSON.stringify({
      success: true,
      message: 'Feeds refreshed successfully',
      data: {
        totalArticles: allItems.length,
        last24Hours,
        activeFeeds: Object.keys(sourceCounts).length,
        lastUpdate: lastUpdate.toISOString(),
        categoryCounts,
        sourceCounts
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error refreshing feeds:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to refresh feeds',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};