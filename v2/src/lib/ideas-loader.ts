/**
 * Ideas content loader for PagesCMS-managed content
 */

import type { IdeaPost } from '../types/ideas';

export interface IdeaPostFile {
  frontmatter: any;
  content: string;
  file: string;
}

export class IdeasLoader {
  private static instance: IdeasLoader;
  private posts: IdeaPost[] = [];
  private lastLoaded: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): IdeasLoader {
    if (!this.instance) {
      this.instance = new IdeasLoader();
    }
    return this.instance;
  }

  async loadPosts(): Promise<IdeaPost[]> {
    const now = Date.now();
    
    // Return cached posts if still fresh
    if (this.posts.length > 0 && (now - this.lastLoaded) < this.CACHE_TTL) {
      return this.posts;
    }

    try {
      // Load all markdown files from content/ideas/
      const modules = import.meta.glob('../../content/ideas/*.md', { eager: true });
      const posts: IdeaPost[] = [];

      for (const [path, module] of Object.entries(modules)) {
        const postFile = module as IdeaPostFile;
        if (postFile.frontmatter) {
          const post = this.transformToIdeaPost(postFile, path);
          posts.push(post);
        }
      }

      // Sort by publication date (newest first)
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      this.posts = posts;
      this.lastLoaded = now;
      
      return posts;
    } catch (error) {
      console.error('Error loading ideas posts:', error);
      return [];
    }
  }

  async getPostBySlug(slug: string): Promise<IdeaPost | null> {
    const posts = await this.loadPosts();
    return posts.find(post => post.id === slug) || null;
  }

  async getFeaturedPosts(): Promise<IdeaPost[]> {
    const posts = await this.loadPosts();
    return posts.filter(post => post.frontmatter?.featured === true);
  }

  async getPostsByAuthor(author: string): Promise<IdeaPost[]> {
    const posts = await this.loadPosts();
    return posts.filter(post => post.author === author);
  }

  async getPostsByTag(tag: string): Promise<IdeaPost[]> {
    const posts = await this.loadPosts();
    return posts.filter(post => post.tags.includes(tag));
  }

  async getPostsByType(type: IdeaPost['type']): Promise<IdeaPost[]> {
    const posts = await this.loadPosts();
    return posts.filter(post => post.type === type);
  }

  async searchPosts(query: string): Promise<IdeaPost[]> {
    const posts = await this.loadPosts();
    const searchTerms = query.toLowerCase().split(' ');
    
    return posts.filter(post => {
      const searchableContent = `${post.title} ${post.content} ${post.tags.join(' ')}`.toLowerCase();
      return searchTerms.some(term => searchableContent.includes(term));
    });
  }

  async getPopularTags(limit: number = 10): Promise<Array<{tag: string, count: number}>> {
    const posts = await this.loadPosts();
    const tagCounts = new Map<string, number>();

    for (const post of posts) {
      for (const tag of post.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  paginate(posts: IdeaPost[], page: number, limit: number = 20) {
    const offset = (page - 1) * limit;
    const paginatedPosts = posts.slice(offset, offset + limit);
    const totalPages = Math.ceil(posts.length / limit);

    return {
      posts: paginatedPosts,
      page,
      totalPages,
      totalPosts: posts.length,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  private transformToIdeaPost(postFile: IdeaPostFile, filePath: string): IdeaPost {
    const fm = postFile.frontmatter;
    const fileName = filePath.split('/').pop()?.replace('.md', '') || '';
    
    // Create base post
    const post: IdeaPost = {
      id: fm.id || fileName,
      author: fm.author || 'research-team',
      authorName: fm.authorName || 'Research Team',
      authorAvatar: fm.authorAvatar,
      content: postFile.content || '',
      title: fm.title || '',
      timestamp: this.formatTimestamp(fm.publishedAt || fm.createdAt),
      createdAt: new Date(fm.publishedAt || fm.createdAt || Date.now()),
      type: fm.type || 'text',
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      reactions: {
        insights: fm.reactions?.insights || 0,
        comments: fm.reactions?.comments || 0,
        shares: fm.reactions?.shares || 0
      },
      isEdited: fm.isEdited || false,
      editedAt: fm.editedAt ? new Date(fm.editedAt) : undefined,
      isPrivate: fm.isPrivate || false,
      team: fm.team,
      frontmatter: fm
    };

    // Add type-specific data
    if (fm.type === 'link' && fm.linkUrl) {
      post.linkPreview = {
        url: fm.linkUrl,
        title: fm.linkTitle || '',
        description: fm.linkDescription || '',
        domain: fm.linkDomain || this.extractDomain(fm.linkUrl),
        image: fm.linkImage
      };
    }

    if (fm.type === 'video' && fm.videoTitle) {
      post.videoEmbed = {
        title: fm.videoTitle,
        thumbnail: fm.videoThumbnail || '',
        duration: fm.videoDuration,
        platform: fm.videoPlatform || 'youtube',
        videoId: this.extractVideoId(fm.videoUrl, fm.videoPlatform),
        embedUrl: fm.videoUrl
      };
    }

    if (fm.type === 'tweet' && fm.tweetAuthor) {
      post.tweetEmbed = {
        author: fm.tweetAuthor,
        handle: fm.tweetHandle || '',
        content: fm.tweetContent || '',
        avatar: fm.tweetAvatar,
        tweetId: fm.tweetId,
        createdAt: fm.publishedAt
      };
    }

    if (fm.type === 'image' && fm.imageUrl) {
      post.imageAttachment = {
        url: fm.imageUrl,
        alt: fm.imageAlt || '',
        caption: fm.imageCaption
      };
    }

    // Store original frontmatter for access to additional fields
    (post as any).frontmatter = fm;

    return post;
  }

  private formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '').toUpperCase();
    } catch {
      return 'EXTERNAL LINK';
    }
  }

  private extractVideoId(url: string, platform: string): string | undefined {
    if (!url) return undefined;

    if (platform === 'youtube') {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      return match?.[1];
    }

    if (platform === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match?.[1];
    }

    return undefined;
  }
}

// Export singleton instance
export const ideasLoader = IdeasLoader.getInstance();