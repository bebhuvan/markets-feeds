/**
 * RSS/Atom feed fetcher and parser for Markets Feeds v2
 * Fetches and parses RSS feeds, converts to FeedItem format
 */

import type { FeedItem } from '../types';
import { summaryProcessor } from './summary-processor';

export interface FeedConfig {
  id: string;
  name: string;
  url: string;
  sourceId: string;
  category: string;
  fetchInterval: number;
  active: boolean;
}

export interface FeedFetchResult {
  success: boolean;
  sourceId: string;
  items: FeedItem[];
  error?: string;
  responseTime: number;
  lastFetched: string;
  itemCount: number;
}

export interface ParsedFeedMeta {
  title: string;
  description?: string;
  lastBuildDate?: string;
  language?: string;
  generator?: string;
}

export class FeedFetcher {
  private static instance: FeedFetcher;
  private fetchHistory: Map<string, FeedFetchResult> = new Map();
  
  static getInstance(): FeedFetcher {
    if (!this.instance) {
      this.instance = new FeedFetcher();
    }
    return this.instance;
  }

  /**
   * Fetch and parse a single RSS/Atom feed
   */
  async fetchFeed(config: FeedConfig): Promise<FeedFetchResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Fetching feed: ${config.name} (${config.url})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for NSE feeds
      
      // Special headers for different feed types to avoid blocking
      const isNSEFeed = config.sourceId.startsWith('nse-');
      const isYouTubeFeed = config.sourceId.includes('youtube');
      const isEclecticFeed = config.category === 'eclectic';
      const isSubstackFeed = config.url.includes('substack.com');
      const isReutersFeed = config.sourceId.includes('reuters');
      const isMoneyControlFeed = config.sourceId.includes('moneycontrol');
      const headers: Record<string, string> = {
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };
      
      if (isNSEFeed) {
        // Use more browser-like headers for NSE
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        headers['Accept-Language'] = 'en-US,en;q=0.9';
        headers['Connection'] = 'keep-alive';
        headers['Upgrade-Insecure-Requests'] = '1';
      } else if (isYouTubeFeed) {
        // Use browser-like headers for YouTube to avoid blocking
        headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        headers['Accept-Language'] = 'en-US,en;q=0.9';
        headers['Referer'] = 'https://www.youtube.com/';
        headers['DNT'] = '1';
      } else if (isEclecticFeed || isSubstackFeed) {
        // Use different strategies for Substack feeds to avoid 403 errors
        if (isSubstackFeed) {
          // Try browser-like headers first
          headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
          headers['Accept-Language'] = 'en-US,en;q=0.9';
          headers['Connection'] = 'keep-alive';
          headers['Sec-Fetch-Dest'] = 'document';
          headers['Sec-Fetch-Mode'] = 'navigate';
          headers['Sec-Fetch-Site'] = 'none';
          headers['Sec-Fetch-User'] = '?1';
          headers['Referer'] = 'https://substack.com/';
        } else {
          // Use RSS reader headers for other eclectic feeds
          headers['User-Agent'] = 'Feedly/1.0 (+http://www.feedly.com/fetcher.html; like FeedFetcher-Google)';
          headers['Accept-Language'] = 'en-US,en;q=0.8';
          headers['Connection'] = 'keep-alive';
        }
      } else if (isReutersFeed) {
        // Reuters needs specific headers to avoid blocking
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        headers['Accept-Language'] = 'en-US,en;q=0.9';
        headers['Connection'] = 'keep-alive';
        headers['Referer'] = 'https://www.reuters.com/';
      } else if (isMoneyControlFeed) {
        // MoneyControl needs browser headers and correct RSS URL
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        headers['Accept-Language'] = 'en-US,en;q=0.9';
        headers['Connection'] = 'keep-alive';
        headers['Referer'] = 'https://www.moneycontrol.com/';
      } else {
        headers['User-Agent'] = 'Markets-Feeds-Bot/2.0 (+https://markets-feeds.com)';
      }
      
      const response = await fetch(config.url, {
        signal: controller.signal,
        headers
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const xmlText = await response.text();
      const items = await this.parseXmlToFeedItems(xmlText, config);
      
      const result: FeedFetchResult = {
        success: true,
        sourceId: config.sourceId,
        items,
        responseTime: Date.now() - startTime,
        lastFetched: new Date().toISOString(),
        itemCount: items.length
      };
      
      this.fetchHistory.set(config.sourceId, result);
      console.log(`✅ Fetched ${items.length} items from ${config.name} in ${result.responseTime}ms`);
      
      return result;
      
    } catch (error) {
      const result: FeedFetchResult = {
        success: false,
        sourceId: config.sourceId,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        lastFetched: new Date().toISOString(),
        itemCount: 0
      };
      
      this.fetchHistory.set(config.sourceId, result);
      console.error(`❌ Failed to fetch ${config.name}: ${result.error}`);
      
      return result;
    }
  }

  /**
   * Fetch multiple feeds with rate limiting for NSE feeds
   */
  async fetchMultipleFeeds(configs: FeedConfig[]): Promise<FeedFetchResult[]> {
    const activeConfigs = configs.filter(c => c.active);
    console.log(`🚀 Fetching ${activeConfigs.length} active feeds...`);
    
    // Separate feeds by type for different handling
    const nseFeeds = activeConfigs.filter(c => c.sourceId.startsWith('nse-'));
    const youtubeFeeds = activeConfigs.filter(c => c.sourceId.includes('youtube'));
    const eclecticFeeds = activeConfigs.filter(c => c.category === 'eclectic');
    const otherFeeds = activeConfigs.filter(c => 
      !c.sourceId.startsWith('nse-') && 
      !c.sourceId.includes('youtube') && 
      c.category !== 'eclectic'
    );
    
    const results: FeedFetchResult[] = [];
    
    // Fetch regular feeds concurrently
    if (otherFeeds.length > 0) {
      console.log(`🔄 Fetching ${otherFeeds.length} regular feeds concurrently...`);
      const promises = otherFeeds.map(config => this.fetchFeed(config));
      const otherResults = await Promise.allSettled(promises);
      
      results.push(...otherResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            success: false,
            sourceId: otherFeeds[index].sourceId,
            items: [],
            error: result.reason?.message || 'Promise rejected',
            responseTime: 0,
            lastFetched: new Date().toISOString(),
            itemCount: 0
          };
        }
      }));
    }
    
    // Fetch YouTube feeds with delays (they rate limit aggressively)
    if (youtubeFeeds.length > 0) {
      console.log(`📺 Fetching ${youtubeFeeds.length} YouTube feeds with delays...`);
      for (const config of youtubeFeeds) {
        try {
          const result = await this.fetchFeed(config);
          results.push(result);
          
          // Add delay between YouTube requests (3 seconds)
          if (youtubeFeeds.indexOf(config) < youtubeFeeds.length - 1) {
            console.log('⏳ Waiting 3 seconds before next YouTube feed...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (error) {
          results.push({
            success: false,
            sourceId: config.sourceId,
            items: [],
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime: 0,
            lastFetched: new Date().toISOString(),
            itemCount: 0
          });
        }
      }
    }
    
    // Fetch eclectic feeds (Substack, blogs) with delays like personal RSS apps
    if (eclecticFeeds.length > 0) {
      console.log(`📚 Fetching ${eclecticFeeds.length} eclectic feeds with delays...`);
      for (const config of eclecticFeeds) {
        try {
          const result = await this.fetchFeed(config);
          results.push(result);
          
          // Add delay between eclectic requests (5 seconds - slower than personal RSS)
          if (eclecticFeeds.indexOf(config) < eclecticFeeds.length - 1) {
            console.log('⏳ Waiting 5 seconds before next eclectic feed...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } catch (error) {
          results.push({
            success: false,
            sourceId: config.sourceId,
            items: [],
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime: 0,
            lastFetched: new Date().toISOString(),
            itemCount: 0
          });
        }
      }
    }
    
    // Fetch NSE feeds sequentially with delays
    if (nseFeeds.length > 0) {
      console.log(`🐌 Fetching ${nseFeeds.length} NSE feeds with delays...`);
      for (const config of nseFeeds) {
        try {
          const result = await this.fetchFeed(config);
          results.push(result);
          
          // Add delay between NSE requests (15 seconds to avoid rate limits)
          if (nseFeeds.indexOf(config) < nseFeeds.length - 1) {
            console.log('⏳ Waiting 15 seconds before next NSE feed...');
            await new Promise(resolve => setTimeout(resolve, 15000));
          }
        } catch (error) {
          results.push({
            success: false,
            sourceId: config.sourceId,
            items: [],
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime: 0,
            lastFetched: new Date().toISOString(),
            itemCount: 0
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Parse XML (RSS/Atom) to FeedItem array
   */
  private async parseXmlToFeedItems(xmlText: string, config: FeedConfig): Promise<FeedItem[]> {
    const items: FeedItem[] = [];
    
    try {
      // Basic XML parsing (in a real implementation, you'd use a proper XML parser)
      // For Cloudflare compatibility, we'll use simple regex parsing
      
      const isAtom = xmlText.includes('<feed') && xmlText.includes('xmlns="http://www.w3.org/2005/Atom"');
      
      if (isAtom) {
        // Parse Atom feed
        const entryMatches = xmlText.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi);
        if (entryMatches) {
          for (const entryXml of entryMatches) {
            const item = this.parseAtomEntry(entryXml, config);
            if (item) items.push(item);
          }
        }
      } else {
        // Parse RSS feed
        const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi);
        if (itemMatches) {
          for (const itemXml of itemMatches) {
            const item = this.parseRssItem(itemXml, config);
            if (item) items.push(item);
          }
        }
      }
      
      // Post-process summaries for consistency across the entire feed
      if (items.length > 0) {
        const processedSummaries = summaryProcessor.processBatch(
          items.map(item => ({
            title: item.title,
            summary: item.summary,
            fullContent: item.fullContent
          }))
        );
        
        // Update items with processed summaries
        items.forEach((item, index) => {
          item.summary = processedSummaries[index];
        });
      }
      
    } catch (error) {
      console.error('Error parsing XML:', error);
      throw new Error(`Failed to parse feed XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return items;
  }

  /**
   * Parse RSS <item> to FeedItem
   */
  private parseRssItem(itemXml: string, config: FeedConfig): FeedItem | null {
    try {
      const title = this.extractTextContent(itemXml, 'title');
      const link = this.extractTextContent(itemXml, 'link');
      const description = this.extractTextContent(itemXml, 'description') || 
                         this.extractTextContent(itemXml, 'content:encoded');
      const pubDate = this.extractTextContent(itemXml, 'pubDate');
      const guid = this.extractTextContent(itemXml, 'guid') || link;
      
      if (!title || !link) {
        return null; // Skip items without title or link
      }
      
      // Clean and process text content
      const cleanTitle = this.cleanText(title);
      const cleanDescription = this.cleanText(description || '');
      
      // Generate standardized summary using the summary processor
      const processedSummary = summaryProcessor.processSummary(
        cleanDescription,
        cleanTitle,
        cleanDescription
      );
      
      // Generate unique ID
      const contentHash = this.generateHash(title + link + description);
      const id = `${config.sourceId}-${contentHash}`;
      
      const item: FeedItem = {
        id,
        sourceId: config.sourceId,
        sourceName: config.name,
        title: cleanTitle,
        url: link.trim(),
        summary: processedSummary,
        fullContent: cleanDescription,
        publishedAt: this.parseDate(pubDate) || new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        category: config.category,
        tags: [config.category],
        priority: 'normal',
        contentHash
      };
      
      return item;
      
    } catch (error) {
      console.error('Error parsing RSS item:', error);
      return null;
    }
  }

  /**
   * Parse Atom <entry> to FeedItem
   */
  private parseAtomEntry(entryXml: string, config: FeedConfig): FeedItem | null {
    try {
      const title = this.extractTextContent(entryXml, 'title');
      const linkMatch = entryXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
      const link = linkMatch?.[1];
      const summary = this.extractTextContent(entryXml, 'summary') || 
                     this.extractTextContent(entryXml, 'content');
      const updated = this.extractTextContent(entryXml, 'updated') ||
                     this.extractTextContent(entryXml, 'published');
      const id = this.extractTextContent(entryXml, 'id') || link;
      
      if (!title || !link) {
        return null;
      }
      
      // Clean and process text content
      const cleanTitle = this.cleanText(title);
      const cleanSummary = this.cleanText(summary || '');
      
      // Generate standardized summary using the summary processor
      const processedSummary = summaryProcessor.processSummary(
        cleanSummary,
        cleanTitle,
        cleanSummary
      );
      
      const contentHash = this.generateHash(title + link + summary);
      const itemId = `${config.sourceId}-${contentHash}`;
      
      const item: FeedItem = {
        id: itemId,
        sourceId: config.sourceId,
        sourceName: config.name,
        title: cleanTitle,
        url: link.trim(),
        summary: processedSummary,
        fullContent: cleanSummary,
        publishedAt: this.parseDate(updated) || new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        category: config.category,
        tags: [config.category],
        priority: 'normal',
        contentHash
      };
      
      return item;
      
    } catch (error) {
      console.error('Error parsing Atom entry:', error);
      return null;
    }
  }

  /**
   * Extract text content from XML element
   */
  private extractTextContent(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    if (!match) return null;
    
    let content = match[1].trim();
    
    // Handle CDATA sections
    if (content.startsWith('<![CDATA[') && content.endsWith(']]>')) {
      content = content.slice(9, -3).trim(); // Remove <![CDATA[ and ]]>
    }
    
    return content || null;
  }

  /**
   * Clean text content (remove HTML, decode entities)
   */
  private cleanText(text: string): string {
    return text
      // First decode HTML entities to proper characters
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      // Remove all HTML tags (including self-closing and malformed)
      .replace(/<[^>]*>/g, '') 
      // Remove any remaining HTML-like patterns that might be malformed
      .replace(/HREF="[^"]*"/gi, '')
      .replace(/TITLE="[^"]*"/gi, '')
      .replace(/TARGET="[^"]*"/gi, '')
      // Clean up any stray < or > characters
      .replace(/</g, '')
      .replace(/>/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Parse date string to ISO format
   */
  private parseDate(dateStr: string | null): string | null {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  }

  /**
   * Generate simple hash for content
   */
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get fetch history for a source
   */
  getFetchHistory(sourceId: string): FeedFetchResult | null {
    return this.fetchHistory.get(sourceId) || null;
  }

  /**
   * Get all fetch history
   */
  getAllFetchHistory(): Map<string, FeedFetchResult> {
    return new Map(this.fetchHistory);
  }

  /**
   * Clear fetch history
   */
  clearHistory(): void {
    this.fetchHistory.clear();
  }
}

// Export singleton instance
export const feedFetcher = FeedFetcher.getInstance();