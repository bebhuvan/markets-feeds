/**
 * Content cache for enhanced search performance
 * Stores processed and enriched article content
 */

import type { FeedItem } from '../types';
import { CACHE_POLICY, cacheMonitor } from './cache-policy';

export interface EnhancedContent {
  originalContent: string;
  processedSummary: string;
  extractedEntities: {
    companies: string[];
    stockSymbols: string[];
    currencies: string[];
    amounts: string[];
    dates: string[];
    locations: string[];
  };
  keyPhrases: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  readingTime: number;
  lastProcessed: number;
}

export class ContentCache {
  private static instance: ContentCache;
  private cache: Map<string, EnhancedContent> = new Map();
  private readonly CACHE_TTL = CACHE_POLICY.CONTENT_ENHANCEMENT.ttl; // 1 hour
  private readonly MAX_SIZE = CACHE_POLICY.CONTENT_ENHANCEMENT.maxSize; // 5K items

  static getInstance(): ContentCache {
    if (!this.instance) {
      this.instance = new ContentCache();
    }
    return this.instance;
  }

  /**
   * Get enhanced content for an article
   */
  async getEnhancedContent(article: FeedItem): Promise<EnhancedContent> {
    const cacheKey = this.getCacheKey(article);
    const cached = this.cache.get(cacheKey);
    
    // Return cached if still valid
    if (cached && (Date.now() - cached.lastProcessed) < this.CACHE_TTL) {
      cacheMonitor.recordHit('ContentEnhancement');
      return cached;
    }

    cacheMonitor.recordMiss('ContentEnhancement');

    // Process and cache new content
    const enhanced = await this.processContent(article);
    this.cache.set(cacheKey, enhanced);
    
    // Clean up old entries periodically
    if (this.cache.size > this.MAX_SIZE) {
      this.cleanupCache();
    }

    return enhanced;
  }

  /**
   * Process article content and extract enhanced information
   */
  private async processContent(article: FeedItem): Promise<EnhancedContent> {
    const fullText = `${article.title} ${article.summary || ''} ${article.fullContent || ''}`;
    
    const enhanced: EnhancedContent = {
      originalContent: fullText,
      processedSummary: this.generateProcessedSummary(article),
      extractedEntities: this.extractEntities(fullText),
      keyPhrases: this.extractKeyPhrases(fullText),
      sentiment: this.analyzeSentiment(fullText),
      topics: this.extractTopics(fullText),
      readingTime: this.calculateReadingTime(fullText),
      lastProcessed: Date.now()
    };

    return enhanced;
  }

  /**
   * Generate enhanced summary with key financial information highlighted
   */
  private generateProcessedSummary(article: FeedItem): string {
    const summary = article.summary || '';
    const title = article.title || '';
    
    // If no summary, extract key sentences from full content
    if (!summary && article.fullContent) {
      const sentences = article.fullContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const keyMentions = ['revenue', 'profit', 'earnings', 'acquisition', 'merger', 'bitcoin', 'fed', 'rate'];
      
      const keyeSentences = sentences
        .filter(sentence => keyMentions.some(mention => sentence.toLowerCase().includes(mention)))
        .slice(0, 2);
      
      return keyeSentences.join('. ') + '.';
    }
    
    return summary;
  }

  /**
   * Extract financial entities from content
   */
  private extractEntities(content: string): EnhancedContent['extractedEntities'] {
    const entities = {
      companies: [] as string[],
      stockSymbols: [] as string[],
      currencies: [] as string[],
      amounts: [] as string[],
      dates: [] as string[],
      locations: [] as string[]
    };

    // Extract stock symbols
    const symbolMatches = content.match(/\b(?:\$|nasdaq:|nyse:)?[A-Z]{1,5}\b/g) || [];
    entities.stockSymbols = [...new Set(symbolMatches)];

    // Extract company names (basic pattern)
    const companyMatches = content.match(/\b[A-Z][a-z]+(?: [A-Z][a-z]+)*(?:\s+(?:Inc|Corp|Ltd|LLC|PLC)\.?)?/g) || [];
    entities.companies = [...new Set(companyMatches.slice(0, 10))]; // Limit to avoid noise

    // Extract currency amounts
    const amountMatches = content.match(/\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|trillion))?/gi) || [];
    entities.amounts = [...new Set(amountMatches.slice(0, 5))];

    // Extract currencies
    const currencyMatches = content.match(/\b(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|bitcoin|ethereum)\b/gi) || [];
    entities.currencies = [...new Set(currencyMatches)];

    // Extract dates (basic patterns)
    const dateMatches = content.match(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/gi) || [];
    entities.dates = [...new Set(dateMatches.slice(0, 3))];

    // Extract locations (basic pattern)
    const locationMatches = content.match(/\b(?:New York|London|Tokyo|Hong Kong|Singapore|Frankfurt|Paris|Sydney|Toronto|Zurich|Wall Street|Silicon Valley)\b/gi) || [];
    entities.locations = [...new Set(locationMatches)];

    return entities;
  }

  /**
   * Extract key phrases using simple frequency analysis
   */
  private extractKeyPhrases(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency = new Map<string, number>();
    for (const word of words) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }

    // Get top frequent meaningful words
    const stopWords = new Set(['that', 'this', 'with', 'from', 'they', 'were', 'been', 'have', 'their', 'said', 'would', 'there', 'could', 'what', 'when', 'more', 'time', 'very', 'after', 'first']);
    
    return Array.from(frequency.entries())
      .filter(([word, count]) => count > 1 && !stopWords.has(word))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Simple sentiment analysis based on financial keywords
   */
  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const text = content.toLowerCase();
    
    const positiveWords = ['growth', 'profit', 'gain', 'rise', 'increase', 'beat', 'strong', 'bullish', 'optimistic', 'success', 'recovery', 'boost', 'surge', 'rally'];
    const negativeWords = ['loss', 'decline', 'fall', 'drop', 'weak', 'bearish', 'pessimistic', 'crisis', 'crash', 'plunge', 'recession', 'risk', 'concern', 'volatile'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    for (const word of positiveWords) {
      positiveScore += (text.match(new RegExp(word, 'g')) || []).length;
    }
    
    for (const word of negativeWords) {
      negativeScore += (text.match(new RegExp(word, 'g')) || []).length;
    }
    
    if (positiveScore > negativeScore + 1) return 'positive';
    if (negativeScore > positiveScore + 1) return 'negative';
    return 'neutral';
  }

  /**
   * Extract topics using keyword clustering
   */
  private extractTopics(content: string): string[] {
    const text = content.toLowerCase();
    const topics: string[] = [];
    
    const topicKeywords = {
      'earnings': ['earnings', 'revenue', 'profit', 'quarterly', 'guidance'],
      'merger': ['merger', 'acquisition', 'deal', 'takeover', 'buyout'],
      'fed': ['federal reserve', 'fed', 'interest rate', 'monetary policy'],
      'crypto': ['bitcoin', 'cryptocurrency', 'blockchain', 'ethereum'],
      'market': ['market', 'trading', 'stock', 'shares', 'index'],
      'technology': ['tech', 'artificial intelligence', 'software', 'digital'],
      'commodities': ['oil', 'gold', 'commodity', 'futures', 'energy']
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const matches = keywords.some(keyword => text.includes(keyword));
      if (matches) {
        topics.push(topic);
      }
    }
    
    return topics;
  }

  /**
   * Calculate estimated reading time
   */
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Generate cache key for article
   */
  private getCacheKey(article: FeedItem): string {
    return `${article.url}-${article.contentHash || ''}`;
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, content] of this.cache.entries()) {
      if ((now - content.lastProcessed) > this.CACHE_TTL) {
        toDelete.push(key);
      }
    }
    
    for (const key of toDelete) {
      this.cache.delete(key);
    }
    
    // If still too many, remove oldest entries
    if (this.cache.size > 8000) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastProcessed - b.lastProcessed);
      
      const toRemove = entries.slice(0, this.cache.size - 8000);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need hit tracking for accurate rate
    };
  }
}

// Export singleton instance
export const contentCache = ContentCache.getInstance();