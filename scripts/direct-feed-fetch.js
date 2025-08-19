#!/usr/bin/env node

import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

const WORKER_URL = 'https://markets-feeds.r-bhuvanesh2007.workers.dev';
const MAX_FEEDS_PER_RUN = 10; // Process in smaller batches

// RSS feed sources (subset for quick population)
const PRIORITY_FEEDS = [
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/topstories', category: 'Markets & Trading' },
  { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'Markets & Trading' },
  { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', category: 'Business News' },
  { name: 'CNBC Markets', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'Markets & Trading' },
  { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', category: 'Regional - India' },
  { name: 'MoneyControl', url: 'https://www.moneycontrol.com/rss/business.xml', category: 'Regional - India' },
  { name: 'Matt Levine', url: 'https://www.bloomberg.com/opinion/authors/ARbTQlRLRjE/matthew-s-levine.rss', category: 'Investment Analysis' },
  { name: 'Marginal Revolution', url: 'https://marginalrevolution.com/feed', category: 'Investment Analysis' },
  { name: 'Stratechery', url: 'https://stratechery.com/feed/', category: 'Technology' },
  { name: 'The Big Picture', url: 'https://ritholtz.com/feed/', category: 'Investment Analysis' }
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRSSFeed(feed) {
  try {
    console.log(`📡 Fetching ${feed.name}...`);
    
    const response = await fetch(feed.url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'GitHub-Actions-RSS-Bot/1.0 (+https://github.com/bebhuvan/markets-feeds)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xmlText = await response.text();
    const parsed = parser.parse(xmlText);
    
    const channel = parsed.rss?.channel || parsed.feed;
    if (!channel) {
      throw new Error('No RSS channel found');
    }
    
    const items = Array.isArray(channel.item) ? channel.item : (channel.item ? [channel.item] : []);
    const entries = Array.isArray(channel.entry) ? channel.entry : (channel.entry ? [channel.entry] : []);
    const articles = [...items, ...entries].slice(0, 5); // Limit to 5 articles per feed
    
    console.log(`✅ ${feed.name}: Found ${articles.length} articles`);
    return { feed, articles };
    
  } catch (error) {
    console.error(`❌ ${feed.name}: ${error.message}`);
    return { feed, articles: [], error: error.message };
  }
}

async function storeArticle(feed, article) {
  try {
    const articleData = {
      id: article.guid?.['@_isPermaLink'] === 'false' ? article.guid['#text'] : article.link || article.id || Math.random().toString(36),
      title: article.title || 'Untitled',
      link: article.link || article.id,
      description: article.description || article.summary || '',
      published_at: article.pubDate || article.updated || new Date().toISOString(),
      author: article.author || article['dc:creator'] || '',
      source: feed.name,
      category: feed.category
    };
    
    // For now, just log the article - in a real implementation, you'd send this to your worker
    console.log(`  📄 ${articleData.title.substring(0, 50)}...`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to store article: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🎯 Direct RSS Feed Fetcher Started');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔢 Processing ${Math.min(MAX_FEEDS_PER_RUN, PRIORITY_FEEDS.length)} priority feeds`);
  console.log('─'.repeat(60));
  
  const feedsToProcess = PRIORITY_FEEDS.slice(0, MAX_FEEDS_PER_RUN);
  let totalArticles = 0;
  let successfulFeeds = 0;
  
  for (const feed of feedsToProcess) {
    const result = await fetchRSSFeed(feed);
    
    if (result.articles.length > 0) {
      successfulFeeds++;
      
      for (const article of result.articles) {
        const stored = await storeArticle(feed, article);
        if (stored) {
          totalArticles++;
        }
        await sleep(100); // Small delay between articles
      }
    }
    
    await sleep(500); // Small delay between feeds
  }
  
  console.log('─'.repeat(60));
  console.log(`📊 Processing completed!`);
  console.log(`✅ Successful feeds: ${successfulFeeds}/${feedsToProcess.length}`);
  console.log(`📄 Total articles processed: ${totalArticles}`);
  console.log(`📅 Completed at: ${new Date().toISOString()}`);
  
  // Check worker health after processing
  try {
    const response = await fetch(`${WORKER_URL}/api/sources`);
    const sources = await response.json();
    console.log(`🔗 Worker is healthy. ${sources.length} sources configured.`);
  } catch (error) {
    console.error(`❌ Worker health check failed: ${error.message}`);
  }
  
  console.log('✅ Direct RSS Feed Fetcher Completed');
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});