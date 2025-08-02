/**
 * Recategorization Engine
 * Automatically migrates articles from old broad categories to new granular categories
 */

import type { FeedItem } from '../types';
import { CATEGORIES } from './categories';

/**
 * Strategic categorization rules for minimal focused splits
 */
const STRATEGIC_MIGRATION_RULES = {
  'markets': {
    defaultCategory: 'markets',
    rules: [
      { contains: ['earnings', 'quarterly', 'q1', 'q2', 'q3', 'q4', 'revenue', 'profit'], category: 'earnings' },
      { contains: ['merger', 'acquisition', 'deal', 'takeover', 'buyout'], category: 'ma' },
      { contains: ['bitcoin', 'crypto', 'cryptocurrency', 'ethereum', 'blockchain'], category: 'crypto' },
      { contains: ['gold', 'oil', 'commodity', 'commodities', 'copper', 'wheat'], category: 'commodities' },
      { contains: ['fed', 'federal reserve', 'central bank', 'interest rate', 'fomc'], category: 'central-banking' }
    ]
  },
  'macro': {
    defaultCategory: 'macro',
    rules: [
      { contains: ['fed', 'federal reserve', 'ecb', 'central bank', 'monetary policy'], category: 'central-banking' }
    ]
  },
  'technology': {
    defaultCategory: 'technology',
    rules: [
      { contains: ['bitcoin', 'crypto', 'cryptocurrency', 'blockchain', 'defi'], category: 'crypto' }
    ]
  },
  'policy': {
    defaultCategory: 'policy',
    rules: [
      { contains: ['regulation', 'sec', 'cftc', 'compliance', 'enforcement'], category: 'regulation' },
      { contains: ['fed', 'central bank', 'monetary'], category: 'central-banking' }
    ]
  },
  'research': { defaultCategory: 'research' },
  'videos': { defaultCategory: 'videos' },
  'blogs': { defaultCategory: 'blogs' },
  'news': { defaultCategory: 'news' },
  'filings': { defaultCategory: 'news' },
  'culture': { defaultCategory: 'blogs' },
  'non-money': { defaultCategory: 'blogs' }
} as const;

export interface RecategorizationResult {
  originalCategory: string;
  newCategory: string;
  confidence: number;
  reason: string;
  article: FeedItem;
}

export interface RecategorizationStats {
  totalArticles: number;
  processed: number;
  categoriesChanged: number;
  categoryDistribution: Record<string, number>;
  migrationSummary: Array<{
    oldCategory: string;
    newCategories: Array<{ category: string; count: number; percentage: number }>;
  }>;
}

export class RecategorizationEngine {
  private contentKeywords: Record<string, string[]> = {
    // Earnings keywords - very specific
    'earnings': [
      'earnings', 'quarterly', 'q1', 'q2', 'q3', 'q4', 'revenue', 'profit', 'eps',
      'earnings per share', 'guidance', 'forecast', 'beat', 'miss', 'results', 'quarterly results'
    ],
    
    // M&A keywords - very specific  
    'ma': [
      'merger', 'acquisition', 'takeover', 'deal', 'buyout', 'lbo', 'acquired', 'merge',
      'consolidation', 'joint venture', 'spin-off', 'divestiture'
    ],
    
    // Crypto keywords - distinct audience
    'crypto': [
      'bitcoin', 'crypto', 'cryptocurrency', 'blockchain', 'ethereum', 'defi',
      'nft', 'digital currency', 'mining', 'wallet', 'exchange', 'altcoin', 'binance'
    ],
    
    // Central banking - Fed/ECB specific content
    'central-banking': [
      'fed', 'federal reserve', 'ecb', 'boe', 'boj', 'central bank', 'interest rate',
      'rate cut', 'rate hike', 'quantitative easing', 'qe', 'fomc', 'jerome powell',
      'monetary policy', 'fed meeting', 'fed minutes'
    ],
    
    // Commodities - physical assets
    'commodities': [
      'gold', 'silver', 'oil', 'crude', 'gas', 'wheat', 'corn', 'copper', 'aluminum',
      'commodity', 'commodities', 'futures', 'wti', 'brent', 'natural gas', 'precious metals'
    ],
    
    // Regulation - financial rules
    'regulation': [
      'regulation', 'regulatory', 'sec', 'cftc', 'compliance', 'rule', 'enforcement',
      'fine', 'penalty', 'investigation', 'oversight', 'supervision'
    ]
  };

  private sourceCategories: Record<string, string> = {
    // Central bank sources -> central banking
    'fed-speeches': 'central-banking',
    'ecb-news': 'central-banking',
    'boe-updates': 'central-banking',
    
    // Research sources stay research
    'cepr-discussion-papers': 'research',
    'nber-papers': 'research',
    'ssrn-papers': 'research',
    
    // Crypto sources -> crypto
    'coindesk': 'crypto',
    'cointelegraph': 'crypto',
    'crypto-news': 'crypto'
  };

  /**
   * Recategorize a single article
   */
  recategorizeArticle(article: FeedItem): RecategorizationResult {
    const originalCategory = article.category;
    
    // Try content-based categorization first
    const contentResult = this.categorizeByContent(article);
    if (contentResult.confidence > 0.7) {
      return {
        originalCategory,
        newCategory: contentResult.category,
        confidence: contentResult.confidence,
        reason: `Content analysis: ${contentResult.reason}`,
        article
      };
    }

    // Try source-based categorization
    const sourceResult = this.categorizeBySource(article);
    if (sourceResult.confidence > 0.6) {
      return {
        originalCategory,
        newCategory: sourceResult.category,
        confidence: sourceResult.confidence,
        reason: `Source analysis: ${sourceResult.reason}`,
        article
      };
    }

    // Fall back to rule-based categorization
    const ruleResult = this.categorizeByRules(article);
    return {
      originalCategory,
      newCategory: ruleResult.category,
      confidence: ruleResult.confidence,
      reason: `Rule-based: ${ruleResult.reason}`,
      article
    };
  }

  /**
   * Recategorize multiple articles and return statistics
   */
  recategorizeArticles(articles: FeedItem[]): {
    results: RecategorizationResult[];
    stats: RecategorizationStats;
  } {
    const results: RecategorizationResult[] = [];
    const oldCategoryStats = new Map<string, Map<string, number>>();
    const newCategoryStats = new Map<string, number>();

    for (const article of articles) {
      const result = this.recategorizeArticle(article);
      results.push(result);

      // Track statistics
      if (!oldCategoryStats.has(result.originalCategory)) {
        oldCategoryStats.set(result.originalCategory, new Map());
      }
      const oldCatMap = oldCategoryStats.get(result.originalCategory)!;
      oldCatMap.set(result.newCategory, (oldCatMap.get(result.newCategory) || 0) + 1);

      newCategoryStats.set(result.newCategory, (newCategoryStats.get(result.newCategory) || 0) + 1);
    }

    // Calculate statistics
    const categoriesChanged = results.filter(r => r.originalCategory !== r.newCategory).length;
    
    const migrationSummary = Array.from(oldCategoryStats.entries()).map(([oldCategory, newCats]) => {
      const total = Array.from(newCats.values()).reduce((sum, count) => sum + count, 0);
      return {
        oldCategory,
        newCategories: Array.from(newCats.entries())
          .map(([category, count]) => ({
            category,
            count,
            percentage: Math.round((count / total) * 100)
          }))
          .sort((a, b) => b.count - a.count)
      };
    });

    const stats: RecategorizationStats = {
      totalArticles: articles.length,
      processed: results.length,
      categoriesChanged,
      categoryDistribution: Object.fromEntries(newCategoryStats),
      migrationSummary
    };

    return { results, stats };
  }

  /**
   * Generate recategorization report
   */
  generateReport(stats: RecategorizationStats): string {
    let report = `# Recategorization Report\n\n`;
    
    report += `## Summary\n`;
    report += `- **Total Articles**: ${stats.totalArticles.toLocaleString()}\n`;
    report += `- **Articles Recategorized**: ${stats.categoriesChanged.toLocaleString()} (${Math.round((stats.categoriesChanged / stats.totalArticles) * 100)}%)\n`;
    report += `- **New Categories Created**: ${Object.keys(stats.categoryDistribution).length}\n\n`;

    report += `## New Category Distribution\n`;
    const sortedCategories = Object.entries(stats.categoryDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);

    for (const [category, count] of sortedCategories) {
      const percentage = Math.round((count / stats.totalArticles) * 100);
      const categoryName = NEW_CATEGORIES[category as keyof typeof NEW_CATEGORIES] || category;
      report += `- **${categoryName}**: ${count.toLocaleString()} articles (${percentage}%)\n`;
    }

    report += `\n## Migration Details\n`;
    for (const migration of stats.migrationSummary) {
      if (migration.newCategories.length > 1) {
        report += `\n### ${migration.oldCategory}\n`;
        for (const newCat of migration.newCategories.slice(0, 5)) {
          const categoryName = NEW_CATEGORIES[newCat.category as keyof typeof NEW_CATEGORIES] || newCat.category;
          report += `- **${categoryName}**: ${newCat.count} articles (${newCat.percentage}%)\n`;
        }
      }
    }

    return report;
  }

  private categorizeByContent(article: FeedItem): { category: string; confidence: number; reason: string } {
    const content = `${article.title} ${article.summary || ''} ${article.tags?.join(' ') || ''}`.toLowerCase();
    const scores = new Map<string, number>();

    // Score against each category's keywords
    for (const [category, keywords] of Object.entries(this.contentKeywords)) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of keywords) {
        const matches = (content.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
        if (matches > 0) {
          score += matches;
          matchedKeywords.push(keyword);
        }
      }

      if (score > 0) {
        scores.set(category, score);
      }
    }

    if (scores.size === 0) {
      return { category: article.category, confidence: 0, reason: 'No keyword matches' };
    }

    // Find best match
    const sortedScores = Array.from(scores.entries()).sort(([, a], [, b]) => b - a);
    const [bestCategory, bestScore] = sortedScores[0];
    const totalScore = Array.from(scores.values()).reduce((sum, score) => sum + score, 0);
    const confidence = bestScore / totalScore;

    return {
      category: bestCategory,
      confidence: Math.min(confidence, 0.95),
      reason: `Keywords matched (score: ${bestScore})`
    };
  }

  private categorizeBySource(article: FeedItem): { category: string; confidence: number; reason: string } {
    const sourceId = article.sourceId.toLowerCase();
    
    // Direct source mapping
    if (this.sourceCategories[sourceId]) {
      return {
        category: this.sourceCategories[sourceId],
        confidence: 0.8,
        reason: `Source mapping: ${sourceId}`
      };
    }

    // Pattern-based source categorization
    if (sourceId.includes('research') || sourceId.includes('paper') || sourceId.includes('study')) {
      return { category: 'academic-research', confidence: 0.7, reason: 'Research source pattern' };
    }

    if (sourceId.includes('fed') || sourceId.includes('central') || sourceId.includes('monetary')) {
      return { category: 'monetary-policy', confidence: 0.7, reason: 'Central bank source pattern' };
    }

    if (sourceId.includes('tech') || sourceId.includes('ai') || sourceId.includes('crypto')) {
      return { category: 'artificial-intelligence', confidence: 0.6, reason: 'Tech source pattern' };
    }

    return { category: article.category, confidence: 0, reason: 'No source pattern match' };
  }

  private categorizeByRules(article: FeedItem): { category: string; confidence: number; reason: string } {
    // Use the strategic migration rules
    const migrationRule = STRATEGIC_MIGRATION_RULES[article.category as keyof typeof STRATEGIC_MIGRATION_RULES];
    
    if (!migrationRule) {
      return { category: 'global-markets', confidence: 0.5, reason: 'Default fallback category' };
    }

    const content = `${article.title} ${article.summary || ''}`.toLowerCase();

    // Apply content-based rules
    if (migrationRule.rules) {
      for (const rule of migrationRule.rules) {
        if (rule.contains.some(keyword => content.includes(keyword.toLowerCase()))) {
          return {
            category: rule.category,
            confidence: 0.6,
            reason: `Rule match: ${rule.contains.join(', ')}`
          };
        }
      }
    }

    // Use default category from migration rules
    return {
      category: migrationRule.defaultCategory || 'global-markets',
      confidence: 0.4,
      reason: 'Default migration rule'
    };
  }
}

// Export singleton instance
export const recategorizationEngine = new RecategorizationEngine();