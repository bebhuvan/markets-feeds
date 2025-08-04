// Export all feeds as OPML for RSS readers
import type { APIRoute } from 'astro';
import feedsConfig from '../../feeds.config.json';

export const GET: APIRoute = () => {
  const activeFeeds = feedsConfig.feeds.filter(f => f.active);
  
  // Group feeds by category for better organization
  const feedsByCategory = activeFeeds.reduce((acc, feed) => {
    const category = feed.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(feed);
    return acc;
  }, {} as Record<string, typeof activeFeeds>);

  const categoryLabels = {
    'markets': 'Markets & Trading',
    'macro': 'Economics & Policy', 
    'technology': 'Technology & Innovation',
    'research': 'Research & Analysis',
    'policy': 'Policy & Regulation',
    'filings': 'Corporate Filings & Announcements',
    'eclectic': 'Eclectic & Commentary',
    'videos': 'Video Content',
    'other': 'Other Sources'
  };

  const opmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>Markets Feeds - RSS Sources</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <dateModified>${new Date().toUTCString()}</dateModified>
    <ownerName>Markets Feeds</ownerName>
    <ownerEmail>feeds@markets-feeds.com</ownerEmail>
    <docs>Complete RSS feed collection for financial and intellectual content</docs>
  </head>
  <body>
${Object.entries(feedsByCategory).map(([category, feeds]) => `    <outline text="${categoryLabels[category] || category}" title="${categoryLabels[category] || category}">
${feeds.map(feed => `      <outline type="rss" text="${feed.name}" title="${feed.name}" xmlUrl="${feed.url}" htmlUrl="${feed.url.replace('/feed', '').replace('/rss', '')}" description="Updates every ${feed.fetchInterval} minutes" />`).join('\n')}
    </outline>`).join('\n')}
  </body>
</opml>`;

  return new Response(opmlContent, {
    headers: {
      'Content-Type': 'text/xml',
      'Content-Disposition': 'attachment; filename="markets-feeds-sources.opml"'
    }
  });
};