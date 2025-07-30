export type Category = 'markets' | 'macro' | 'research' | 'policy' | 'technology' | 'non-money' | 'blogs' | 'filings';
export type Priority = 'breaking' | 'high' | 'normal' | 'low';

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  category: Category;
  enabled: boolean;
  refreshInterval?: number; // minutes
  lastFetch?: Date;
  errorCount?: number;
  customHeaders?: Record<string, string>;
}

export interface FeedItem {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  url: string;
  summary: string;
  fullContent?: string;
  publishedAt: Date;
  fetchedAt: Date;
  category: Category;
  tags: string[];
  priority: Priority;
  contentHash: string;
  imageUrl?: string;
  author?: string;
}

export interface ProcessingStats {
  lastRun: Date;
  itemsProcessed: number;
  newItems: number;
  duplicates: number;
  errors: number;
  duration: number; // milliseconds
}

export interface FilterState {
  category: Category | 'all';
  search: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  tags?: string[];
}

export interface AppConfig {
  maxItemAge: number; // days
  maxItemsPerSource: number;
  duplicateThreshold: number; // similarity percentage
  breakingNewsKeywords: string[];
  priorityKeywords: Record<Priority, string[]>;
}