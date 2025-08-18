// Enhanced RSS Feed Fetcher with Full Content Extraction
// Supports full-text search, content analysis, and intelligent extraction

import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';

export class EnhancedContentFetcher {
  constructor(options = {}) {
    this.options = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      userAgent: 'Mozilla/5.0 (compatible; ResearchBot/1.0)',
      maxRedirects: 5,
      maxContentSize: 10 * 1024 * 1024, // 10MB
      enableContentFetching: true,
      contentFetchConcurrency: 3,
      contentFetchDelay: 1000, // Be respectful to servers
      maxContentLength: 50000, // Store up to 50k chars of content
      ...options
    };

    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      ignoreNameSpace: true,
      parseAttributeValue: true,
      trimValues: true
    });

    // Content extraction selectors (ordered by priority)
    this.contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      '.post-body',
      '.article-body',
      '.story-body',
      '.main-content',
      '#content',
      '.text',
      'main'
    ];

    // Selectors to remove (ads, navigation, etc.)
    this.removeSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.advertisement',
      '.ads',
      '.social-share',
      '.related-articles',
      '.comments',
      '.sidebar',
      '.menu',
      '.navigation',
      '[class*="ad-"]',
      '[id*="ad-"]'
    ];

    this.stats = {
      totalFetched: 0,
      contentFetched: 0,
      contentFailed: 0,
      successful: 0,
      failed: 0,
      errors: new Map()
    };
  }

  // Enhanced fetch with content extraction
  async fetchFeed(feedConfig) {
    const startTime = Date.now();
    
    try {
      this.validateFeedConfig(feedConfig);
      
      const response = await this.fetchWithRetry(feedConfig);
      const rawContent = await this.extractContent(response);
      let articles = await this.parseFeedContent(rawContent, feedConfig);
      
      // Fetch full content for articles if enabled
      if (this.options.enableContentFetching && feedConfig.contentFetchEnabled && articles.length > 0) {
        articles = await this.enrichArticlesWithContent(articles, feedConfig);
      }

      this.stats.successful++;
      
      return {
        source: feedConfig.name,
        url: feedConfig.url,
        fetchedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        articleCount: articles.length,
        articles: articles,
        metadata: this.extractFeedMetadata(articles, response)
      };
      
    } catch (error) {
      this.stats.failed++;
      this.recordError(feedConfig.url, error);
      
      return {
        source: feedConfig.name,
        url: feedConfig.url,
        error: this.formatError(error),
        fetchedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime
      };
    } finally {
      this.stats.totalFetched++;
    }
  }

  // Fetch multiple feeds concurrently
  async fetchMultipleFeeds(feedConfigs, concurrency = 5) {
    const batches = this.chunkArray(feedConfigs, concurrency);
    const allResults = [];

    for (const batch of batches) {
      const batchPromises = batch.map(config => this.fetchFeed(config));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          allResults.push(result.value);
        } else {
          allResults.push({
            error: this.formatError(result.reason),
            fetchedAt: new Date().toISOString()
          });
        }
      });

      // Respectful delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.sleep(this.options.contentFetchDelay);
      }
    }

    return allResults;
  }

  // Enrich articles with full content
  async enrichArticlesWithContent(articles, feedConfig) {
    const enrichedArticles = [];
    
    // Process articles in small batches to be respectful
    const batches = this.chunkArray(articles, this.options.contentFetchConcurrency);
    
    for (const batch of batches) {
      const batchPromises = batch.map(article => this.fetchArticleContent(article, feedConfig));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          enrichedArticles.push(result.value);
          this.stats.contentFetched++;
        } else {
          // Keep original article if content fetch fails
          enrichedArticles.push(batch[index]);
          this.stats.contentFailed++;
          console.warn(`Content fetch failed for: ${batch[index].link}`, result.reason);
        }
      });
      
      // Respectful delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.sleep(this.options.contentFetchDelay);
      }
    }
    
    return enrichedArticles;
  }

  // Fetch full content for a single article
  async fetchArticleContent(article, feedConfig) {
    if (!article.link) {
      return article; // Return as-is if no link
    }

    try {
      // Skip if we already have substantial content
      if (article.content && article.content.length > 1000) {
        return article;
      }

      const response = await this.fetchWithRetry({
        ...feedConfig,
        url: article.link,
        name: `${feedConfig.name} - Article`
      });

      const html = await response.text();
      const extractedContent = this.extractArticleContent(html, article.link);
      
      return {
        ...article,
        fullContent: extractedContent.content,
        contentText: extractedContent.text,
        contentLength: extractedContent.text.length,
        images: extractedContent.images,
        extractionMethod: extractedContent.method,
        contentFetched: true,
        contentFetchedAt: new Date().toISOString()
      };

    } catch (error) {
      console.warn(`Failed to fetch content for ${article.link}:`, error.message);
      return {
        ...article,
        contentFetched: false,
        contentError: error.message
      };
    }
  }

  // Extract article content from HTML
  extractArticleContent(html, url) {
    const $ = cheerio.load(html);
    let content = '';
    let method = 'fallback';
    
    // Remove unwanted elements
    this.removeSelectors.forEach(selector => {
      $(selector).remove();
    });

    // Try content selectors in order of priority
    for (const selector of this.contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 200) {
        content = element.html() || '';
        method = selector;
        break;
      }
    }

    // Fallback: extract from body
    if (!content) {
      content = $('body').html() || html;
      method = 'body';
    }

    // Clean up the content
    const cleanedContent = this.cleanArticleContent(content);
    const textContent = this.extractTextFromHTML(cleanedContent);
    
    // Extract images
    const images = this.extractImages($, url);

    // Limit content length
    const truncatedText = textContent.length > this.options.maxContentLength 
      ? textContent.substring(0, this.options.maxContentLength) + '...'
      : textContent;

    return {
      content: cleanedContent,
      text: truncatedText,
      images: images,
      method: method
    };
  }

  // Clean article content
  cleanArticleContent(html) {
    if (!html) return '';
    
    const $ = cheerio.load(html);
    
    // Remove more unwanted elements
    $('script, style, iframe, embed, object').remove();
    $('.advertisement, .ads, .social-share, .related-articles').remove();
    $('[class*="ad-"], [id*="ad-"]').remove();
    
    // Clean up attributes
    $('*').each(function() {
      const allowedAttrs = ['href', 'src', 'alt', 'title'];
      const attrs = Object.keys(this.attribs || {});
      attrs.forEach(attr => {
        if (!allowedAttrs.includes(attr)) {
          $(this).removeAttr(attr);
        }
      });
    });

    return $.html();
  }

  // Extract plain text from HTML
  extractTextFromHTML(html) {
    if (!html) return '';
    
    const $ = cheerio.load(html);
    return $.text()
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  // Extract images from article
  extractImages($, baseUrl) {
    const images = [];
    
    $('img').each((i, img) => {
      const src = $(img).attr('src');
      const alt = $(img).attr('alt') || '';
      
      if (src) {
        try {
          const absoluteUrl = new URL(src, baseUrl).href;
          images.push({
            url: absoluteUrl,
            alt: alt,
            caption: $(img).closest('figure').find('figcaption').text().trim()
          });
        } catch (e) {
          // Skip invalid URLs
        }
      }
    });
    
    return images.slice(0, 5); // Limit to 5 images
  }

  // Enhanced article normalization with search keywords
  normalizeArticle(article) {
    const normalized = {
      id: this.generateArticleId(article),
      title: this.cleanText(article.title) || 'Untitled',
      link: article.link || '',
      description: this.cleanHTML(article.description) || '',
      content: this.cleanHTML(article.content) || '',
      fullContent: article.fullContent || '',
      contentText: article.contentText || '',
      contentLength: article.contentLength || 0,
      images: article.images || [],
      author: this.cleanText(article.author) || '',
      publishedAt: article.pubDate || new Date().toISOString(),
      guid: article.guid || article.link || '',
      categories: Array.isArray(article.categories) ? article.categories : [],
      enclosure: article.enclosure,
      source: article.source,
      feedTitle: article.feedTitle,
      feedDescription: article.feedDescription,
      extractedAt: new Date().toISOString(),
      contentFetched: article.contentFetched || false,
      extractionMethod: article.extractionMethod || null
    };

    // Generate search keywords
    normalized.searchKeywords = this.generateSearchKeywords(normalized);
    normalized.readingTime = this.estimateReadingTime(normalized.contentText || normalized.description);

    return normalized;
  }

  // Generate search keywords for better discoverability
  generateSearchKeywords(article) {
    const text = [
      article.title,
      article.description,
      article.contentText,
      article.author,
      article.source,
      ...article.categories
    ].join(' ').toLowerCase();

    // Extract meaningful keywords (simple approach)
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  // Simple stop words list
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this',
      'that', 'these', 'those', 'a', 'an', 'as', 'from', 'up', 'out', 'if',
      'about', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'among', 'more', 'most', 'such', 'only', 'also'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }

  // Estimate reading time
  estimateReadingTime(text) {
    if (!text) return 0;
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Feed parsing methods
  async parseFeedContent(content, feedConfig) {
    const contentType = this.detectFeedType(content);
    
    switch (contentType) {
      case 'rss':
        return this.parseRSSFeed(content, feedConfig);
      case 'atom':
        return this.parseAtomFeed(content, feedConfig);
      case 'json':
        return this.parseJSONFeed(content, feedConfig);
      default:
        throw new Error(`Unsupported feed format: ${contentType}`);
    }
  }

  parseRSSFeed(content, feedConfig) {
    const parsed = this.xmlParser.parse(content);
    const channel = parsed.rss?.channel || parsed.channel;
    
    if (!channel) throw new Error('Invalid RSS feed structure');

    const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean);
    
    return items.map(item => this.normalizeArticle({
      title: this.extractText(item.title),
      link: this.extractText(item.link),
      description: this.extractText(item.description),
      content: this.extractText(item['content:encoded'] || item.content),
      author: this.extractText(item.author || item['dc:creator']),
      pubDate: this.parseDate(item.pubDate || item.date),
      guid: this.extractText(item.guid?.['#text'] || item.guid),
      categories: this.extractCategories(item.category),
      enclosure: item.enclosure ? {
        url: item.enclosure['@_url'],
        type: item.enclosure['@_type'],
        length: item.enclosure['@_length']
      } : null,
      source: feedConfig.name,
      feedTitle: this.extractText(channel.title),
      feedDescription: this.extractText(channel.description),
      feedLastBuildDate: this.parseDate(channel.lastBuildDate)
    }));
  }

  parseAtomFeed(content, feedConfig) {
    const parsed = this.xmlParser.parse(content);
    const feed = parsed.feed;
    
    if (!feed) throw new Error('Invalid Atom feed structure');

    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry].filter(Boolean);
    
    return entries.map(entry => this.normalizeArticle({
      title: this.extractText(entry.title),
      link: this.extractAtomLink(entry.link),
      description: this.extractText(entry.summary),
      content: this.extractText(entry.content?.['#text'] || entry.content),
      author: this.extractText(entry.author?.name),
      pubDate: this.parseDate(entry.published || entry.updated),
      guid: this.extractText(entry.id),
      categories: this.extractAtomCategories(entry.category),
      source: feedConfig.name,
      feedTitle: this.extractText(feed.title),
      feedDescription: this.extractText(feed.subtitle),
      feedLastBuildDate: this.parseDate(feed.updated)
    }));
  }

  parseJSONFeed(content, feedConfig) {
    const feed = JSON.parse(content);
    
    if (!feed.items) throw new Error('Invalid JSON feed structure');

    return feed.items.map(item => this.normalizeArticle({
      title: item.title,
      link: item.url || item.external_url,
      description: item.summary,
      content: item.content_html || item.content_text,
      author: item.author?.name || item.author,
      pubDate: this.parseDate(item.date_published),
      guid: item.id,
      categories: item.tags || [],
      source: feedConfig.name,
      feedTitle: feed.title,
      feedDescription: feed.description,
      feedLastBuildDate: null
    }));
  }

  // Utility methods
  validateFeedConfig(config) {
    if (!config.url) throw new Error('Feed URL is required');
    if (!config.name) throw new Error('Feed name is required');
    
    try {
      new URL(config.url);
    } catch {
      throw new Error('Invalid feed URL');
    }
  }

  async fetchWithRetry(feedConfig, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
      
      const headers = {
        'User-Agent': this.options.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      };

      if (feedConfig.etag) headers['If-None-Match'] = feedConfig.etag;
      if (feedConfig.lastModified) headers['If-Modified-Since'] = feedConfig.lastModified;

      const response = await fetch(feedConfig.url, {
        method: 'GET',
        headers,
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      if (response.status === 304) {
        throw new Error('Feed not modified since last fetch');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;

    } catch (error) {
      if (attempt < this.options.maxRetries) {
        await this.sleep(this.options.retryDelay * attempt);
        return this.fetchWithRetry(feedConfig, attempt + 1);
      }
      throw error;
    }
  }

  async extractContent(response) {
    return await response.text();
  }

  detectFeedType(content) {
    const trimmed = content.trim();
    if (trimmed.startsWith('{')) return 'json';
    if (trimmed.includes('<rss') || trimmed.includes('</rss>')) return 'rss';
    if (trimmed.includes('<feed') || trimmed.includes('xmlns="http://www.w3.org/2005/Atom"')) return 'atom';
    return 'unknown';
  }

  extractText(value) {
    if (typeof value === 'string') return value;
    if (value?.['#text']) return value['#text'];
    return '';
  }

  extractAtomLink(links) {
    if (!links) return '';
    const linkArray = Array.isArray(links) ? links : [links];
    const htmlLink = linkArray.find(link => link['@_rel'] === 'alternate');
    return htmlLink?.['@_href'] || linkArray[0]?.['@_href'] || '';
  }

  extractCategories(categories) {
    if (!categories) return [];
    const catArray = Array.isArray(categories) ? categories : [categories];
    return catArray.map(cat => this.extractText(cat)).filter(Boolean);
  }

  extractAtomCategories(categories) {
    if (!categories) return [];
    const catArray = Array.isArray(categories) ? categories : [categories];
    return catArray.map(cat => cat['@_term']).filter(Boolean);
  }

  parseDate(dateString) {
    if (!dateString) return new Date().toISOString();
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  cleanHTML(html) {
    if (!html) return '';
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
  }

  generateArticleId(article) {
    const data = article.guid || article.link || article.title || '';
    return this.simpleHash(data + article.source);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  recordError(url, error) {
    const errorKey = `${error.constructor.name}:${error.message}`;
    const count = this.stats.errors.get(errorKey) || 0;
    this.stats.errors.set(errorKey, count + 1);
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  extractFeedMetadata(articles, response) {
    return {
      title: articles[0]?.feedTitle || '',
      description: articles[0]?.feedDescription || '',
      lastBuildDate: articles[0]?.feedLastBuildDate || null,
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
      articleCount: articles.length,
      contentFetchEnabled: this.options.enableContentFetching
    };
  }

  formatError(error) {
    return {
      message: error.message,
      type: error.constructor.name,
      code: error.code || 'UNKNOWN',
      timestamp: new Date().toISOString()
    };
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalFetched > 0 ? 
        (this.stats.successful / this.stats.totalFetched * 100).toFixed(2) + '%' : '0%',
      contentFetchRate: this.stats.totalFetched > 0 ?
        (this.stats.contentFetched / this.stats.totalFetched * 100).toFixed(2) + '%' : '0%',
      errors: Object.fromEntries(this.stats.errors)
    };
  }
}