/**
 * Type definitions for the Ideas/Discovery microblog feature
 */

export interface IdeaPost {
  id: string;
  author: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  title?: string;
  timestamp: string;
  createdAt: Date;
  type: 'text' | 'link' | 'video' | 'tweet' | 'image';
  frontmatter?: any;
  
  // Optional embeds based on type
  linkPreview?: LinkPreview;
  videoEmbed?: VideoEmbed;
  tweetEmbed?: TweetEmbed;
  imageAttachment?: ImageAttachment;
  
  tags: string[];
  reactions: {
    insights: number;
    comments: number;
    shares?: number;
  };
  
  // Metadata
  isEdited?: boolean;
  editedAt?: Date;
  isPrivate?: boolean;
  team?: string; // For team-specific posts
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  domain: string;
  image?: string;
  favicon?: string;
  
  // Metadata from link extraction
  publishedAt?: string;
  author?: string;
  readingTime?: number;
}

export interface VideoEmbed {
  title: string;
  thumbnail: string;
  duration?: string;
  platform: 'youtube' | 'vimeo' | 'twitter' | 'direct';
  videoId?: string;
  embedUrl?: string;
}

export interface TweetEmbed {
  author: string;
  handle: string;
  content: string;
  avatar?: string;
  tweetId?: string;
  createdAt?: string;
}

export interface ImageAttachment {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface IdeaReaction {
  id: string;
  postId: string;
  userId: string;
  type: 'insight' | 'comment' | 'share';
  createdAt: Date;
  
  // For comments
  content?: string;
  parentId?: string; // For threaded comments
}

export interface IdeaComment {
  id: string;
  postId: string;
  author: string;
  authorName: string;
  content: string;
  createdAt: Date;
  parentId?: string; // For replies
  reactions: {
    likes: number;
  };
}

/**
 * Input types for creating new posts
 */
export interface CreateIdeaPostInput {
  content: string;
  type: IdeaPost['type'];
  tags?: string[];
  linkUrl?: string; // For automatic link preview generation
  isPrivate?: boolean;
}

export interface UpdateIdeaPostInput {
  content?: string;
  tags?: string[];
  isPrivate?: boolean;
}

/**
 * API response types
 */
export interface IdeaFeedResponse {
  posts: IdeaPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    totalPosts: number;
    totalAuthors: number;
    popularTags: Array<{ tag: string; count: number }>;
  };
}

export interface IdeaPostResponse {
  post: IdeaPost;
  comments?: IdeaComment[];
  relatedPosts?: IdeaPost[];
}

/**
 * Search and filtering types
 */
export interface IdeaSearchFilters {
  author?: string;
  tags?: string[];
  type?: IdeaPost['type'];
  dateRange?: {
    start: Date;
    end: Date;
  };
  team?: string;
  hasLinks?: boolean;
  hasImages?: boolean;
  minReactions?: number;
}

export interface IdeaSearchParams {
  query?: string;
  filters?: IdeaSearchFilters;
  sortBy?: 'recent' | 'popular' | 'relevant';
  page?: number;
  limit?: number;
}

/**
 * Analytics types
 */
export interface IdeaAnalytics {
  period: 'day' | 'week' | 'month';
  totalPosts: number;
  totalReactions: number;
  topAuthors: Array<{ author: string; posts: number; reactions: number }>;
  topTags: Array<{ tag: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  engagementRate: number;
  avgReactionsPerPost: number;
}

/**
 * Configuration types
 */
export interface IdeaConfig {
  maxPostLength: number;
  maxTagsPerPost: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  enableLinkPreviews: boolean;
  enableVideoEmbeds: boolean;
  enableTweetEmbeds: boolean;
  moderationEnabled: boolean;
  requireApproval: boolean;
}