/**
 * Main Feed Fetcher (excludes Substack feeds)
 * Fetches all non-Substack feeds for regular updates
 */

import { feedFetcher, type FeedConfig } from '../lib/feed-fetcher';
import feedsConfig from '../../feeds.config.json';
import * as fs from 'fs/promises';
import * as path from 'path';

const FETCH_REPORT_PATH = path.join(process.cwd(), 'main-fetch-report.json');

/**
 * Get all non-Substack feeds
 */
function getMainFeeds(): FeedConfig[] {
  return feedsConfig.feeds
    .filter(feed => 
      !feed.url.includes('substack.com') && 
      feed.category !== 'eclectic'
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
 * Fetch all main feeds (non-Substack)
 */
async function fetchMainFeeds() {
  const mainFeeds = getMainFeeds();
  console.log(`🚀 Starting main feed fetcher at ${new Date().toISOString()}`);
  console.log(`📰 Found ${mainFeeds.length} non-Substack feeds to fetch`);
  console.log(`ℹ️  Substack feeds are fetched separately once daily at 5 AM`);
  
  const startTime = Date.now();
  
  // Fetch all feeds using the optimized concurrent/sequential strategy
  const results = await feedFetcher.fetchMultipleFeeds(mainFeeds);
  
  // Process results
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const totalArticles = results.reduce((sum, r) => sum + r.itemCount, 0);
  
  // Collect all articles
  const allArticles = results.flatMap(r => r.items);
  
  // Save articles to content files
  if (allArticles.length > 0) {
    console.log(`\n💾 Saving ${allArticles.length} articles to data files...`);
    await saveArticlesToFiles(allArticles);
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    totalFeeds: mainFeeds.length,
    successfulFeeds: successCount,
    failedFeeds: failCount,
    totalArticles,
    feedResults: results.map(r => ({
      sourceId: r.sourceId,
      success: r.success,
      articlesFound: r.itemCount,
      error: r.error,
      responseTime: r.responseTime
    }))
  };
  
  // Save report
  await fs.writeFile(FETCH_REPORT_PATH, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MAIN FEED FETCH SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total feeds processed: ${mainFeeds.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total articles collected: ${totalArticles}`);
  console.log(`Duration: ${Math.round(report.duration / 1000)}s`);
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
    const filename = `articles-${date}.json`;
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
 * Main execution
 */
async function main() {
  try {
    await fetchMainFeeds();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error in main feed fetcher:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { fetchMainFeeds, getMainFeeds };