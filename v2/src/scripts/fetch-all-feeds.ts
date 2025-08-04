/**
 * Script to fetch RSS feeds and update JSON files
 * Run this via GitHub Actions or locally
 * npm run fetch-feeds
 */

import { feedFetcher, type FeedConfig } from '../lib/feed-fetcher';
import type { FeedItem } from '../types';
import { promises as fs } from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'links');
const MAX_ITEMS_PER_FILE = 100;
const MAX_AGE_DAYS = 30; // Keep articles for 30 days

async function main() {
  console.log('🚀 Starting RSS feed fetch process...\n');

  try {
    // Load feed configurations
    const feeds = await loadFeedConfigs();
    console.log(`📋 Found ${feeds.length} feed configurations`);

    // Fetch all active feeds
    const activeFeeds = feeds.filter(f => f.active);
    console.log(`🔄 Fetching ${activeFeeds.length} active feeds...\n`);

    const results = await feedFetcher.fetchMultipleFeeds(activeFeeds);
    
    // Collect all new items
    const allNewItems: FeedItem[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const result of results) {
      if (result.success) {
        successCount++;
        allNewItems.push(...result.items);
        console.log(`✅ ${result.sourceId}: ${result.itemCount} items (${result.responseTime}ms)`);
      } else {
        failureCount++;
        console.log(`❌ ${result.sourceId}: ${result.error}`);
      }
    }

    console.log(`\n📊 Fetch Summary: ${successCount} success, ${failureCount} failed`);
    console.log(`📰 Total new items: ${allNewItems.length}`);

    // Load existing articles
    console.log('\n📂 Loading existing articles...');
    const existingArticles = await loadExistingArticles();
    console.log(`📚 Found ${existingArticles.length} existing articles`);

    // Merge and deduplicate
    const merged = mergeArticles(existingArticles, allNewItems);
    console.log(`🔀 After merge: ${merged.length} total articles`);

    // Remove old articles
    const filtered = filterOldArticles(merged, MAX_AGE_DAYS);
    console.log(`🗑️  After cleanup: ${filtered.length} articles (removed ${merged.length - filtered.length} old items)`);

    // Save to JSON files
    console.log('\n💾 Saving to JSON files...');
    await saveArticlesToFiles(filtered);

    // Generate summary report
    await generateReport(results, filtered.length);

    console.log('\n✅ Feed fetch completed successfully!');

  } catch (error) {
    console.error('❌ Error during feed fetch:', error);
    process.exit(1);
  }
}

async function loadFeedConfigs(): Promise<FeedConfig[]> {
  try {
    const configPath = path.join(process.cwd(), 'feeds.config.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    return config.feeds || [];
  } catch (error) {
    console.error('Error loading feed config:', error);
    // Fallback to sample feeds
    return [
      {
        id: "wsj_markets",
        name: "Wall Street Journal Markets",
        url: "https://feeds.wsj.com/public/resources/MWI_NEWS_MARKETS",
        sourceId: "wsj-markets",
        category: "markets",
        fetchInterval: 30,
        active: true
      }
    ];
  }
}

async function loadExistingArticles(): Promise<FeedItem[]> {
  const articles: FeedItem[] = [];
  
  try {
    const files = await fs.readdir(CONTENT_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('sample'));

    for (const file of jsonFiles) {
      const filePath = path.join(CONTENT_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const fileArticles = JSON.parse(content) as FeedItem[];
      
      if (Array.isArray(fileArticles)) {
        articles.push(...fileArticles);
      }
    }
  } catch (error) {
    console.warn('Warning: Could not load existing articles:', error);
  }

  return articles;
}

function mergeArticles(existing: FeedItem[], newItems: FeedItem[]): FeedItem[] {
  // Create a map of existing articles by ID for fast lookup
  const existingMap = new Map(existing.map(a => [a.id, a]));
  
  // Add new items that don't exist
  for (const item of newItems) {
    if (!existingMap.has(item.id)) {
      existingMap.set(item.id, item);
    }
  }

  // Convert back to array and sort by date
  return Array.from(existingMap.values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function filterOldArticles(articles: FeedItem[], maxAgeDays: number): FeedItem[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
  
  return articles.filter(article => {
    const articleDate = new Date(article.publishedAt);
    return articleDate > cutoffDate;
  });
}

async function saveArticlesToFiles(articles: FeedItem[]): Promise<void> {
  // Ensure content directory exists
  await fs.mkdir(CONTENT_DIR, { recursive: true });

  // Calculate number of files needed
  const numFiles = Math.ceil(articles.length / MAX_ITEMS_PER_FILE);
  
  // Delete existing JSON files (except sample)
  const existingFiles = await fs.readdir(CONTENT_DIR);
  for (const file of existingFiles) {
    if (file.endsWith('.json') && !file.includes('sample')) {
      await fs.unlink(path.join(CONTENT_DIR, file));
    }
  }

  // Save articles to numbered files
  for (let i = 0; i < numFiles; i++) {
    const start = i * MAX_ITEMS_PER_FILE;
    const end = Math.min(start + MAX_ITEMS_PER_FILE, articles.length);
    const chunk = articles.slice(start, end);
    
    const fileName = `articles-${String(i + 1).padStart(3, '0')}.json`;
    const filePath = path.join(CONTENT_DIR, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(chunk, null, 2), 'utf-8');
    console.log(`  📄 ${fileName}: ${chunk.length} articles`);
  }
}

async function generateReport(results: any[], totalArticles: number): Promise<void> {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFeeds: results.length,
      successfulFeeds: results.filter(r => r.success).length,
      failedFeeds: results.filter(r => !r.success).length,
      totalArticles: totalArticles,
      totalNewItems: results.reduce((sum, r) => sum + (r.itemCount || 0), 0)
    },
    feeds: results.map(r => ({
      sourceId: r.sourceId,
      success: r.success,
      itemCount: r.itemCount || 0,
      responseTime: r.responseTime,
      error: r.error || null
    }))
  };

  const reportPath = path.join(process.cwd(), 'fetch-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📊 Report saved to ${reportPath}`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}