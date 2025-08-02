export interface FeedItem {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  url: string;
  summary?: string;
  fullContent?: string;
  publishedAt: string;
  fetchedAt?: string;
  category: string;
  tags: string[];
  priority?: 'high' | 'normal' | 'breaking';
  contentHash?: string;
}