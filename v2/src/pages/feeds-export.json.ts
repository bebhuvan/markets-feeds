// Export all feeds as JSON for download
import type { APIRoute } from 'astro';
import feedsConfig from '../../feeds.config.json';

export const GET: APIRoute = () => {
  const exportData = {
    meta: {
      title: "Markets Feeds - Source List",
      description: "Complete list of RSS feeds and sources",
      exportedAt: new Date().toISOString(),
      totalFeeds: feedsConfig.feeds.length,
      activeFeeds: feedsConfig.feeds.filter(f => f.active).length,
      version: "2.0.0"
    },
    feeds: feedsConfig.feeds.map(feed => ({
      name: feed.name,
      url: feed.url,
      sourceId: feed.sourceId,
      category: feed.category,
      active: feed.active,
      fetchInterval: feed.fetchInterval,
      ...(feed.note && { note: feed.note })
    }))
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="markets-feeds-sources.json"'
    }
  });
};