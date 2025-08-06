/**
 * Dedicated Substack Feed Fetcher
 * Runs once daily at 5 AM to fetch all Substack feeds with proper delays
 * Mimics consumer RSS reader behavior to avoid rate limiting
 */

import { feedFetcher, type FeedConfig } from '../lib/feed-fetcher';
import { dataLoader } from '../lib/data-loader';
import feedsConfig from '../../feeds.config.json';
import * as fs from 'fs/promises';
import * as path from 'path';

const SUBSTACK_DELAY_MS = 15000; // 15 seconds between Substack feeds
const FETCH_REPORT_PATH = path.join(process.cwd(), 'substack-fetch-report.json');

interface SubstackFetchReport {
  startTime: string;
  endTime: string;
  totalFeeds: number;
  successfulFeeds: number;
  failedFeeds: number;
  totalArticles: number;
  feedResults: Array<{
    sourceId: string;
    name: string;
    success: boolean;
    articlesFound: number;
    error?: string;
    responseTime: number;
  }>;
}

/**
 * Extract Substack feeds from configuration
 */
function getSubstackFeeds(): FeedConfig[] {
  return feedsConfig.feeds
    .filter(feed => 
      feed.url.includes('substack.com') || 
      feed.category === 'eclectic'
    )
    .filter(feed => feed.active)
    .map(feed => ({
      id: feed.id,
      name: feed.name,
      url: feed.url,
      sourceId: feed.sourceId,
      category: feed.category,
      fetchInterval: feed.fetchInterval,
      active: feed.active
    }));
}

/**
 * Fetch all Substack feeds with proper delays
 */
async function fetchSubstackFeeds() {
  const substackFeeds = getSubstackFeeds();
  console.log(`🚀 Starting Substack feed fetcher at ${new Date().toISOString()}`);
  console.log(`📚 Found ${substackFeeds.length} Substack/eclectic feeds to fetch`);
  
  const report: SubstackFetchReport = {
    startTime: new Date().toISOString(),
    endTime: '',
    totalFeeds: substackFeeds.length,
    successfulFeeds: 0,
    failedFeeds: 0,
    totalArticles: 0,
    feedResults: []
  };

  const allArticles = [];
  
  for (let i = 0; i < substackFeeds.length; i++) {
    const feed = substackFeeds[i];
    console.log(`\n📖 [${i + 1}/${substackFeeds.length}] Fetching: ${feed.name}`);
    
    try {
      // Add random jitter to delay (±2 seconds) to appear more human-like
      const jitter = Math.random() * 4000 - 2000;
      const delay = SUBSTACK_DELAY_MS + jitter;
      
      const result = await feedFetcher.fetchFeed(feed);
      
      if (result.success) {
        report.successfulFeeds++;
        report.totalArticles += result.items.length;
        allArticles.push(...result.items);
        
        console.log(`✅ Success: Retrieved ${result.items.length} articles in ${result.responseTime}ms`);
      } else {
        report.failedFeeds++;
        console.error(`❌ Failed: ${result.error}`);
      }
      
      report.feedResults.push({
        sourceId: feed.sourceId,
        name: feed.name,
        success: result.success,
        articlesFound: result.items.length,
        error: result.error,
        responseTime: result.responseTime
      });
      
      // Wait before next feed (except for the last one)
      if (i < substackFeeds.length - 1) {
        console.log(`⏳ Waiting ${Math.round(delay / 1000)} seconds before next feed...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      report.failedFeeds++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error fetching ${feed.name}: ${errorMsg}`);
      
      report.feedResults.push({
        sourceId: feed.sourceId,
        name: feed.name,
        success: false,
        articlesFound: 0,
        error: errorMsg,
        responseTime: 0
      });
    }
  }
  
  report.endTime = new Date().toISOString();
  
  // Save articles to data files
  if (allArticles.length > 0) {
    console.log(`\n💾 Saving ${allArticles.length} articles to data files...`);
    await saveArticlesToFiles(allArticles);
  }
  
  // Save fetch report
  await fs.writeFile(FETCH_REPORT_PATH, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUBSTACK FETCH SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total feeds processed: ${report.totalFeeds}`);
  console.log(`Successful: ${report.successfulFeeds}`);
  console.log(`Failed: ${report.failedFeeds}`);
  console.log(`Total articles collected: ${report.totalArticles}`);
  console.log(`Duration: ${calculateDuration(report.startTime, report.endTime)}`);
  console.log('='.repeat(60));
  
  return report;
}

/**
 * Save articles to content files
 */
async function saveArticlesToFiles(articles: any[]) {
  const contentDir = path.join(process.cwd(), 'content', 'links');
  
  // Ensure content directory exists
  await fs.mkdir(contentDir, { recursive: true });
  
  // Group articles by date
  const articlesByDate = articles.reduce((acc, article) => {
    const date = new Date(article.publishedAt).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(article);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Save each day's articles
  for (const [date, dayArticles] of Object.entries(articlesByDate)) {
    const filename = `substack-${date}.json`;
    const filepath = path.join(contentDir, filename);
    
    // Load existing articles if file exists
    let existingArticles = [];
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      existingArticles = JSON.parse(content);
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    // Merge new articles (avoid duplicates based on ID)
    const existingIds = new Set(existingArticles.map((a: any) => a.id));
    const newArticles = dayArticles.filter(a => !existingIds.has(a.id));
    const mergedArticles = [...existingArticles, ...newArticles];
    
    // Save merged articles
    await fs.writeFile(filepath, JSON.stringify(mergedArticles, null, 2));
    console.log(`📁 Saved ${newArticles.length} new articles to ${filename}`);
  }
}

/**
 * Calculate duration between two ISO timestamps
 */
function calculateDuration(start: string, end: string): string {
  const duration = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Main execution
 */
async function main() {
  try {
    await fetchSubstackFeeds();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error in Substack fetcher:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { fetchSubstackFeeds, getSubstackFeeds };