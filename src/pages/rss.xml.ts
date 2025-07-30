import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  // Load all content files
  const linkFiles = await import.meta.glob('../content/links/*.json');
  const allItems: any[] = [];

  // Process all link files
  for (const [path, linkFile] of Object.entries(linkFiles)) {
    const data = await linkFile() as any;
    const items = Array.isArray(data.default) ? data.default : [];
    allItems.push(...items);
  }

  // Sort by publishedAt date (newest first) and take top 50
  const sortedItems = allItems
    .filter(item => item.title && item.url && item.publishedAt)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 50);

  return rss({
    title: 'Markets Feeds',
    description: 'Curated financial markets, economics, and business news from top sources',
    site: context.site || 'https://markets-feeds.pages.dev',
    items: sortedItems.map(item => ({
      title: item.title,
      pubDate: new Date(item.publishedAt),
      description: item.summary || item.content || '',
      link: item.url,
      categories: [item.category],
      author: item.source || 'Markets Feeds',
    })),
    customData: `<language>en-us</language>`,
  });
}