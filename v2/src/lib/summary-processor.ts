/**
 * Summary Processor - Standardizes article summaries/descriptions
 * Ensures consistent length and quality of article excerpts
 */

interface SummaryOptions {
  minLength?: number;        // Minimum characters for a valid summary
  maxLength?: number;        // Maximum characters to display
  idealLength?: number;      // Target length for best readability
  fallbackToTitle?: boolean; // Use title if no summary available
  addEllipsis?: boolean;     // Add ... for truncated text
  preserveWords?: boolean;   // Don't cut in middle of words
}

const DEFAULT_OPTIONS: SummaryOptions = {
  minLength: 50,
  maxLength: 280,      // Similar to Twitter's old limit for good readability
  idealLength: 200,    // Sweet spot for scanning
  fallbackToTitle: false,
  addEllipsis: true,
  preserveWords: true
};

export class SummaryProcessor {
  private options: SummaryOptions;
  
  constructor(options: Partial<SummaryOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Process and standardize a summary
   */
  processSummary(
    summary: string | null | undefined,
    title: string,
    fullContent?: string | null
  ): string {
    // Try to get best available text
    let text = this.getBestText(summary, fullContent, title);
    
    // Clean the text
    text = this.cleanText(text);
    
    // If too short, try to expand from full content
    if (text.length < this.options.minLength! && fullContent) {
      text = this.extractFromContent(fullContent, title);
    }
    
    // If still too short and fallback enabled, use title
    if (text.length < this.options.minLength! && this.options.fallbackToTitle) {
      return this.generateFromTitle(title);
    }
    
    // If we have no meaningful text, return empty
    if (text.length < this.options.minLength!) {
      return '';
    }
    
    // Truncate if too long
    if (text.length > this.options.maxLength!) {
      text = this.truncateText(text, this.options.maxLength!);
    }
    
    // Ensure proper sentence structure
    text = this.ensureProperEnding(text);
    
    return text;
  }
  
  /**
   * Get the best available text from various sources
   */
  private getBestText(
    summary: string | null | undefined,
    fullContent: string | null | undefined,
    title: string
  ): string {
    // First try summary
    if (summary && summary.trim().length > 0) {
      return summary.trim();
    }
    
    // Then try full content
    if (fullContent && fullContent.trim().length > 0) {
      // Extract first meaningful paragraph
      return this.extractFirstParagraph(fullContent);
    }
    
    // Return empty if nothing available
    return '';
  }
  
  /**
   * Clean text by removing HTML, extra spaces, etc.
   */
  private cleanText(text: string): string {
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '...')
      // Remove URLs (they clutter summaries)
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remove email addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove leading/trailing spaces
      .trim();
  }
  
  /**
   * Extract first meaningful paragraph from content
   */
  private extractFirstParagraph(content: string): string {
    const cleaned = this.cleanText(content);
    
    // Split by common paragraph separators
    const paragraphs = cleaned.split(/[\n\r]+|\.{2,}|\s{3,}/);
    
    // Find first meaningful paragraph
    for (const para of paragraphs) {
      const trimmed = para.trim();
      // Skip if too short or looks like metadata
      if (trimmed.length < 30) continue;
      if (trimmed.match(/^(by |author:|date:|source:|copyright)/i)) continue;
      if (trimmed.match(/^\d+:\d+/)) continue; // Skip timestamps
      
      return trimmed;
    }
    
    // If no good paragraph found, return first N characters
    return cleaned.slice(0, this.options.maxLength);
  }
  
  /**
   * Extract summary from full content, avoiding title repetition
   */
  private extractFromContent(content: string, title: string): string {
    const cleaned = this.cleanText(content);
    
    // Remove title from beginning if it appears there
    const titleWords = title.toLowerCase().split(/\s+/).slice(0, 5);
    const contentStart = cleaned.toLowerCase();
    
    let startIndex = 0;
    if (titleWords.every(word => contentStart.includes(word))) {
      // Skip past title-like content at the beginning
      const firstSentenceEnd = cleaned.search(/[.!?]\s/);
      if (firstSentenceEnd > 0 && firstSentenceEnd < 100) {
        startIndex = firstSentenceEnd + 1;
      }
    }
    
    return cleaned.slice(startIndex).trim();
  }
  
  /**
   * Generate a summary from the title (last resort)
   */
  private generateFromTitle(title: string): string {
    // For very short titles, don't use as summary
    if (title.length < 30) {
      return '';
    }
    
    // If title is long enough and descriptive, use it
    if (title.length > 60) {
      return title;
    }
    
    return '';
  }
  
  /**
   * Truncate text intelligently
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    
    let truncated = text.slice(0, maxLength);
    
    if (this.options.preserveWords) {
      // Find last complete word
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.8) { // Don't truncate too much
        truncated = truncated.slice(0, lastSpace);
      }
    }
    
    // Remove incomplete sentence at the end
    const lastSentenceEnd = truncated.search(/[.!?](?=[^.!?]*$)/);
    if (lastSentenceEnd > maxLength * 0.7) {
      truncated = truncated.slice(0, lastSentenceEnd + 1);
    } else if (this.options.addEllipsis) {
      truncated += '...';
    }
    
    return truncated.trim();
  }
  
  /**
   * Ensure text ends properly
   */
  private ensureProperEnding(text: string): string {
    if (!text) return '';
    
    const lastChar = text[text.length - 1];
    
    // Already ends with punctuation
    if (['.', '!', '?', '…'].includes(lastChar)) {
      return text;
    }
    
    // Ends with ellipsis indicator
    if (text.endsWith('...')) {
      return text;
    }
    
    // Add ellipsis if truncated and enabled
    if (this.options.addEllipsis && text.length >= this.options.maxLength! - 10) {
      return text + '...';
    }
    
    // Otherwise add period if it looks like a complete sentence
    if (text.length > 50 && /[a-zA-Z0-9]$/.test(text)) {
      return text + '.';
    }
    
    return text;
  }
  
  /**
   * Batch process multiple summaries for consistency
   */
  processBatch(items: Array<{
    title: string;
    summary?: string | null;
    fullContent?: string | null;
  }>): string[] {
    // Calculate statistics to adjust parameters
    const lengths = items
      .map(item => (item.summary || item.fullContent || '').length)
      .filter(len => len > 0);
    
    if (lengths.length === 0) {
      return items.map(item => this.processSummary(item.summary, item.title, item.fullContent));
    }
    
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    
    // Adjust options based on content
    const batchOptions = { ...this.options };
    if (avgLength < 100) {
      // Short summaries - be more lenient
      batchOptions.minLength = 30;
      batchOptions.fallbackToTitle = true;
    } else if (avgLength > 500) {
      // Long summaries - be more aggressive with truncation
      batchOptions.maxLength = 250;
      batchOptions.idealLength = 180;
    }
    
    const processor = new SummaryProcessor(batchOptions);
    return items.map(item => processor.processSummary(item.summary, item.title, item.fullContent));
  }
}

// Export singleton instance with default options
export const summaryProcessor = new SummaryProcessor();

// Export custom processor for specific sources
export const createSummaryProcessor = (options: Partial<SummaryOptions>) => {
  return new SummaryProcessor(options);
};