/**
 * Feed scheduling and automation for Cloudflare Workers
 * Uses Cloudflare Cron Triggers for scheduled execution
 */

import { feedFetcher } from './feed-fetcher';
import type { FeedConfig } from './feed-fetcher';

export interface ScheduledFetchResult {
  timestamp: string;
  feedsProcessed: number;
  successCount: number;
  failureCount: number;
  totalNewItems: number;
  errors: Array<{ feedId: string; error: string }>;
}

export class FeedScheduler {
  private static instance: FeedScheduler;
  
  static getInstance(): FeedScheduler {
    if (!this.instance) {
      this.instance = new FeedScheduler();
    }
    return this.instance;
  }

  /**
   * Process all active feeds - designed to be called by Cloudflare Cron
   */
  async processAllFeeds(feeds: FeedConfig[]): Promise<ScheduledFetchResult> {
    const startTime = Date.now();
    const errors: Array<{ feedId: string; error: string }> = [];
    
    console.log(`🕐 Starting scheduled feed fetch at ${new Date().toISOString()}`);
    
    // Filter active feeds
    const activeFeeds = feeds.filter(f => f.active);
    
    // Fetch all feeds concurrently
    const results = await feedFetcher.fetchMultipleFeeds(activeFeeds);
    
    // Process results
    let successCount = 0;
    let failureCount = 0;
    let totalNewItems = 0;
    
    for (const result of results) {
      if (result.success) {
        successCount++;
        totalNewItems += result.itemCount;
      } else {
        failureCount++;
        errors.push({
          feedId: result.sourceId,
          error: result.error || 'Unknown error'
        });
      }
    }
    
    const fetchResult: ScheduledFetchResult = {
      timestamp: new Date().toISOString(),
      feedsProcessed: activeFeeds.length,
      successCount,
      failureCount,
      totalNewItems,
      errors
    };
    
    console.log(`✅ Feed fetch completed in ${Date.now() - startTime}ms`);
    console.log(`📊 Results: ${successCount} success, ${failureCount} failed, ${totalNewItems} new items`);
    
    return fetchResult;
  }

  /**
   * Get feeds that need updating based on their fetchInterval
   */
  getFeedsToUpdate(feeds: FeedConfig[], lastFetchTimes: Map<string, Date>): FeedConfig[] {
    const now = new Date();
    
    return feeds.filter(feed => {
      if (!feed.active) return false;
      
      const lastFetch = lastFetchTimes.get(feed.id);
      if (!lastFetch) return true; // Never fetched
      
      const minutesSinceLastFetch = (now.getTime() - lastFetch.getTime()) / (1000 * 60);
      return minutesSinceLastFetch >= feed.fetchInterval;
    });
  }

  /**
   * Generate fetch schedule report
   */
  generateScheduleReport(feeds: FeedConfig[]): {
    activeFeeds: number;
    inactiveFeeds: number;
    feedsByInterval: Record<number, number>;
    feedsByCategory: Record<string, number>;
  } {
    const activeFeeds = feeds.filter(f => f.active).length;
    const inactiveFeeds = feeds.filter(f => !f.active).length;
    
    const feedsByInterval: Record<number, number> = {};
    const feedsByCategory: Record<string, number> = {};
    
    for (const feed of feeds) {
      if (feed.active) {
        // Count by interval
        feedsByInterval[feed.fetchInterval] = (feedsByInterval[feed.fetchInterval] || 0) + 1;
        
        // Count by category
        feedsByCategory[feed.category] = (feedsByCategory[feed.category] || 0) + 1;
      }
    }
    
    return {
      activeFeeds,
      inactiveFeeds,
      feedsByInterval,
      feedsByCategory
    };
  }
}

// Export singleton instance
export const feedScheduler = FeedScheduler.getInstance();