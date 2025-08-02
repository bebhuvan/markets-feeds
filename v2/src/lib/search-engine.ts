/**
 * In-memory search engine for financial articles
 * Optimized for current scale (2,806 articles)
 */

import type { FeedItem } from '../types';
import { contentCache } from './content-cache';

export interface SearchableArticle extends FeedItem {
  searchableContent: string;
  keyTerms: string[];
  wordCount: number;
}

export interface SearchResult {
  article: FeedItem;
  score: number;
  matchedTerms: string[];
  snippet: string;
  entities?: {
    companies: string[];
    stockSymbols: string[];
    amounts: string[];
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
  readingTime?: number;
}

export interface SearchFilters {
  categories?: string[];
  sources?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  priority?: string[];
}

export class SearchEngine {
  private articles: Map<string, SearchableArticle> = new Map();
  private termIndex: Map<string, Set<string>> = new Map(); // term -> articleIds
  private categoryIndex: Map<string, Set<string>> = new Map();
  private sourceIndex: Map<string, Set<string>> = new Map();
  private isIndexed = false;

  /**
   * Build search index from articles
   */
  async buildIndex(articles: FeedItem[]): Promise<void> {
    console.time('Search index build');
    
    // Clear existing indexes
    this.articles.clear();
    this.termIndex.clear();
    this.categoryIndex.clear();
    this.sourceIndex.clear();

    for (const article of articles) {
      const searchableArticle = this.prepareSearchableArticle(article);
      this.articles.set(article.url, searchableArticle);

      // Index by terms
      for (const term of searchableArticle.keyTerms) {
        if (!this.termIndex.has(term)) {
          this.termIndex.set(term, new Set());
        }
        this.termIndex.get(term)!.add(article.url);
      }

      // Index by category
      if (!this.categoryIndex.has(article.category)) {
        this.categoryIndex.set(article.category, new Set());
      }
      this.categoryIndex.get(article.category)!.add(article.url);

      // Index by source
      if (!this.sourceIndex.has(article.sourceId)) {
        this.sourceIndex.set(article.sourceId, new Set());
      }
      this.sourceIndex.get(article.sourceId)!.add(article.url);
    }

    this.isIndexed = true;
    console.timeEnd('Search index build');
    console.log(`Search index built: ${this.articles.size} articles, ${this.termIndex.size} terms`);
  }

  /**
   * Search articles with ranking and filtering
   */
  async search(
    query: string, 
    filters: SearchFilters = {}, 
    limit: number = 50
  ): Promise<SearchResult[]> {
    if (!this.isIndexed) {
      throw new Error('Search index not built yet');
    }

    if (!query.trim()) {
      return this.getFilteredArticles(filters, limit);
    }

    const searchTerms = this.tokenize(query);
    const candidateIds = this.findCandidateArticles(searchTerms);
    const filteredIds = this.applyFilters(candidateIds, filters);
    
    const results: SearchResult[] = [];

    for (const articleId of filteredIds) {
      const article = this.articles.get(articleId);
      if (!article) continue;

      const score = this.calculateRelevanceScore(article, searchTerms);
      if (score > 0) {
        const matchedTerms = this.getMatchedTerms(article, searchTerms);
        const snippet = this.generateSnippet(article, searchTerms);

        // Get enhanced content for richer search results (non-blocking)
        let enhancedData = {};
        try {
          const enhancedContent = await contentCache.getEnhancedContent(article);
          enhancedData = {
            entities: {
              companies: enhancedContent.extractedEntities.companies.slice(0, 3),
              stockSymbols: enhancedContent.extractedEntities.stockSymbols.slice(0, 5),
              amounts: enhancedContent.extractedEntities.amounts.slice(0, 3)
            },
            sentiment: enhancedContent.sentiment,
            topics: enhancedContent.topics,
            readingTime: enhancedContent.readingTime
          };
        } catch (error) {
          // Don't let content enhancement errors break search
          console.warn('Content enhancement failed for article:', article.url, error);
          cacheMonitor.recordError('ContentEnhancement');
        }

        results.push({
          article,
          score,
          matchedTerms,
          snippet,
          ...enhancedData
        });
      }
    }

    // Sort by relevance score (descending)
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Get search suggestions based on partial query
   */
  getSuggestions(partialQuery: string, limit: number = 5): string[] {
    const partial = partialQuery.toLowerCase().trim();
    if (partial.length < 2) return [];

    const suggestions = new Set<string>();
    
    for (const term of this.termIndex.keys()) {
      if (term.startsWith(partial) && suggestions.size < limit) {
        suggestions.add(term);
      }
    }

    return Array.from(suggestions);
  }

  /**
   * Get trending terms based on recent articles
   */
  getTrendingTerms(days: number = 7, limit: number = 10): Array<{term: string, count: number}> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const termCounts = new Map<string, number>();

    for (const article of this.articles.values()) {
      const publishDate = new Date(article.publishedAt);
      if (publishDate >= cutoffDate) {
        for (const term of article.keyTerms) {
          termCounts.set(term, (termCounts.get(term) || 0) + 1);
        }
      }
    }

    return Array.from(termCounts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private prepareSearchableArticle(article: FeedItem): SearchableArticle {
    // Enhanced content preparation with weighted importance
    const titleContent = article.title || '';
    const summaryContent = article.summary || '';
    const fullContent = article.fullContent || '';
    const tagsContent = article.tags?.join(' ') || '';
    
    // Weight title and summary more heavily for search relevance
    const weightedContent = [
      titleContent, titleContent, titleContent, // 3x weight for title
      summaryContent, summaryContent, // 2x weight for summary
      fullContent, // 1x weight for full content
      tagsContent, tagsContent // 2x weight for tags
    ].join(' ');
    
    const searchableContent = weightedContent.toLowerCase();
    const words = this.tokenize(searchableContent);
    
    // Enhanced stop words list for financial content
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should',
      'this', 'that', 'these', 'those', 'they', 'their', 'them', 'we', 'our', 'us', 'you', 'your',
      'said', 'says', 'can', 'may', 'might', 'must', 'shall', 'do', 'does', 'did', 'done',
      'also', 'just', 'only', 'now', 'then', 'there', 'here', 'where', 'when', 'why', 'how',
      'more', 'most', 'much', 'many', 'some', 'any', 'all', 'each', 'every', 'both', 'either',
      'about', 'over', 'under', 'above', 'below', 'up', 'down', 'out', 'off', 'into', 'onto'
    ]);
    
    // Extract meaningful terms with better filtering
    const keyTerms = words.filter(word => 
      word.length > 2 && 
      !stopWords.has(word) && 
      /^[a-zA-Z][a-zA-Z0-9]*$/.test(word) && // Allow alphanumeric after first letter
      !word.match(/^\d+$/) // Exclude pure numbers
    );

    // Extract financial entities and important terms
    const financialTerms = this.extractFinancialTerms(titleContent + ' ' + summaryContent + ' ' + fullContent);
    const enhancedKeyTerms = [...new Set([...keyTerms, ...financialTerms])];

    return {
      ...article,
      searchableContent,
      keyTerms: enhancedKeyTerms,
      wordCount: words.length
    };
  }

  /**
   * Extract financial-specific terms and entities
   */
  private extractFinancialTerms(content: string): string[] {
    const financialTerms: string[] = [];
    const text = content.toLowerCase();
    
    // Company patterns (starts with capital, ends with common suffixes)
    const companyPattern = /\b[A-Z][a-z]+(?: [A-Z][a-z]+)*(?:\s+(?:inc|corp|ltd|llc|plc|ag|sa)\.?)?/g;
    const companyMatches = content.match(companyPattern) || [];
    financialTerms.push(...companyMatches.map(c => c.toLowerCase()));
    
    // Stock symbols ($AAPL, NASDAQ:AAPL, etc.)
    const symbolPattern = /\b(?:\$|nasdaq:|nyse:|tsx:)?[A-Z]{1,5}\b/g;
    const symbolMatches = content.match(symbolPattern) || [];
    financialTerms.push(...symbolMatches.map(s => s.toLowerCase()));
    
    // Financial metrics and terms
    const financialKeywords = [
      'revenue', 'profit', 'earnings', 'ebitda', 'margin', 'growth', 'valuation',
      'market cap', 'dividend', 'yield', 'pe ratio', 'eps', 'guidance', 'forecast',
      'acquisition', 'merger', 'ipo', 'funding', 'investment', 'venture capital',
      'federal reserve', 'interest rate', 'inflation', 'gdp', 'unemployment',
      'bitcoin', 'ethereum', 'cryptocurrency', 'blockchain', 'defi'
    ];
    
    for (const keyword of financialKeywords) {
      if (text.includes(keyword)) {
        financialTerms.push(keyword.replace(/\s+/g, '_')); // Convert to searchable format
      }
    }
    
    return [...new Set(financialTerms)];
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private findCandidateArticles(searchTerms: string[]): Set<string> {
    if (searchTerms.length === 0) return new Set();

    let candidates: Set<string> | null = null;

    for (const term of searchTerms) {
      const termMatches = this.termIndex.get(term) || new Set();
      
      if (candidates === null) {
        candidates = new Set(termMatches);
      } else {
        // Intersection for AND behavior
        candidates = new Set([...candidates].filter(id => termMatches.has(id)));
      }
    }

    return candidates || new Set();
  }

  private applyFilters(candidateIds: Set<string>, filters: SearchFilters): Set<string> {
    let filtered = new Set(candidateIds);

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      const categoryMatches = new Set<string>();
      for (const category of filters.categories) {
        const matches = this.categoryIndex.get(category) || new Set();
        matches.forEach(id => categoryMatches.add(id));
      }
      filtered = new Set([...filtered].filter(id => categoryMatches.has(id)));
    }

    // Filter by sources
    if (filters.sources && filters.sources.length > 0) {
      const sourceMatches = new Set<string>();
      for (const source of filters.sources) {
        const matches = this.sourceIndex.get(source) || new Set();
        matches.forEach(id => sourceMatches.add(id));
      }
      filtered = new Set([...filtered].filter(id => sourceMatches.has(id)));
    }

    // Filter by date range
    if (filters.dateRange) {
      filtered = new Set([...filtered].filter(id => {
        const article = this.articles.get(id);
        if (!article) return false;
        const publishDate = new Date(article.publishedAt);
        return publishDate >= filters.dateRange!.start && publishDate <= filters.dateRange!.end;
      }));
    }

    return filtered;
  }

  private calculateRelevanceScore(article: SearchableArticle, searchTerms: string[]): number {
    let score = 0;
    const termFrequency = new Map<string, number>();
    
    // Calculate term frequency and position-based scoring
    for (const term of searchTerms) {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedTerm, 'gi');
      
      // Title matches (highest weight) - exact and partial
      const titleText = article.title.toLowerCase();
      const titleMatches = (titleText.match(regex) || []).length;
      const titleExactMatch = titleText.includes(term) ? 1 : 0;
      score += titleMatches * 5 + titleExactMatch * 3;

      // Summary matches (high weight)
      const summaryText = (article.summary || '').toLowerCase();
      const summaryMatches = (summaryText.match(regex) || []).length;
      const summaryExactMatch = summaryText.includes(term) ? 1 : 0;
      score += summaryMatches * 3 + summaryExactMatch * 2;

      // Full content matches (moderate weight)
      const fullContentText = (article.fullContent || '').toLowerCase();
      const contentMatches = (fullContentText.match(regex) || []).length;
      score += Math.min(contentMatches, 10); // Cap content matches to avoid spam

      // Tag matches (high weight for exact matches)
      const tagMatches = article.tags?.filter(tag => 
        tag.toLowerCase().includes(term) || term.includes(tag.toLowerCase())
      ).length || 0;
      score += tagMatches * 4;

      // Key terms matches (financial entities)
      const keyTermMatches = article.keyTerms.filter(keyTerm => 
        keyTerm.includes(term) || term.includes(keyTerm)
      ).length;
      score += keyTermMatches * 2;

      termFrequency.set(term, (termFrequency.get(term) || 0) + titleMatches + summaryMatches + contentMatches);
    }

    // Boost for multiple term matches (AND logic bonus)
    const matchedTerms = Array.from(termFrequency.keys()).filter(term => termFrequency.get(term)! > 0);
    if (matchedTerms.length > 1) {
      score *= 1 + (matchedTerms.length * 0.2); // 20% boost per additional term
    }

    // Phrase matching bonus (terms appearing close together)
    if (searchTerms.length > 1) {
      const fullText = `${article.title} ${article.summary || ''} ${article.fullContent || ''}`.toLowerCase();
      const phraseBonus = this.calculatePhraseBonus(fullText, searchTerms);
      score += phraseBonus;
    }

    // Time-based relevance boost
    const hoursOld = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (hoursOld < 24) score *= 1.4; // Recent articles
    else if (hoursOld < 168) score *= 1.2; // Within a week
    else if (hoursOld < 720) score *= 1.1; // Within a month

    // Priority boost
    if (article.priority === 'high' || article.priority === 'breaking') {
      score *= 1.3;
    }

    return score;
  }

  /**
   * Calculate bonus score for terms appearing close together (phrase matching)
   */
  private calculatePhraseBonus(text: string, searchTerms: string[]): number {
    let phraseBonus = 0;
    const words = text.split(/\s+/);
    
    // Look for terms within a proximity window
    const proximityWindow = 10; // Words
    
    for (let i = 0; i < words.length - 1; i++) {
      const windowEnd = Math.min(i + proximityWindow, words.length);
      const windowText = words.slice(i, windowEnd).join(' ');
      
      let termsInWindow = 0;
      for (const term of searchTerms) {
        if (windowText.includes(term)) {
          termsInWindow++;
        }
      }
      
      // Bonus increases exponentially with more terms in proximity
      if (termsInWindow > 1) {
        phraseBonus += Math.pow(termsInWindow, 2);
      }
    }
    
    return phraseBonus;
  }

  private getMatchedTerms(article: SearchableArticle, searchTerms: string[]): string[] {
    return searchTerms.filter(term => 
      article.searchableContent.includes(term) ||
      article.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }

  private generateSnippet(article: SearchableArticle, searchTerms: string[], maxLength: number = 150): string {
    const content = article.summary || article.title;
    
    // Find the first occurrence of any search term
    let snippetStart = 0;
    for (const term of searchTerms) {
      const index = content.toLowerCase().indexOf(term);
      if (index !== -1) {
        snippetStart = Math.max(0, index - 50);
        break;
      }
    }

    let snippet = content.slice(snippetStart, snippetStart + maxLength);
    
    // Trim to word boundaries
    if (snippetStart > 0) snippet = '...' + snippet;
    if (snippetStart + maxLength < content.length) snippet = snippet + '...';

    // Highlight search terms
    for (const term of searchTerms) {
      const regex = new RegExp(`(${term})`, 'gi');
      snippet = snippet.replace(regex, '<mark>$1</mark>');
    }

    return snippet;
  }

  private getFilteredArticles(filters: SearchFilters, limit: number): SearchResult[] {
    let candidateIds = new Set(this.articles.keys());
    candidateIds = this.applyFilters(candidateIds, filters);

    const results: SearchResult[] = [];
    for (const articleId of candidateIds) {
      const article = this.articles.get(articleId);
      if (article && results.length < limit) {
        results.push({
          article,
          score: 1,
          matchedTerms: [],
          snippet: article.summary || article.title.slice(0, 150) + '...'
        });
      }
    }

    // Sort by publication date (newest first)
    results.sort((a, b) => new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime());

    return results;
  }

  /**
   * Clear all search caches and indices
   */
  clearCache(): void {
    this.articles.clear();
    this.termIndex.clear();
    this.categoryIndex.clear();
    this.sourceIndex.clear();
    this.isIndexed = false;
  }
}

// Export singleton instance
export const searchEngine = new SearchEngine();