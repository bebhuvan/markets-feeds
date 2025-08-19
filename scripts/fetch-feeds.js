#!/usr/bin/env node

import fetch from 'node-fetch';

const WORKER_URL = 'https://markets-feeds.r-bhuvanesh2007.workers.dev';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  try {
    console.log(`Attempting to fetch from ${url} (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
    
    const response = await fetch(url, {
      ...options,
      timeout: 120000, // 2 minute timeout
    });
    
    if (response.ok) {
      return response;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Attempt ${MAX_RETRIES - retries + 1} failed:`, error.message);
    
    if (retries > 0 && !error.message.includes('timeout')) {
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw error;
  }
}

async function checkWorkerHealth() {
  try {
    const response = await fetchWithRetry(`${WORKER_URL}/api/sources`);
    const sources = await response.json();
    console.log(`✅ Worker is healthy. Found ${sources.length} RSS sources configured.`);
    return true;
  } catch (error) {
    console.error('❌ Worker health check failed:', error.message);
    return false;
  }
}

async function triggerFeedFetch() {
  try {
    console.log('🚀 Triggering RSS feed fetch...');
    
    const response = await fetchWithRetry(`${WORKER_URL}/fetch-feeds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-Actions-Feed-Fetcher/1.0'
      }
    });
    
    const result = await response.text();
    console.log('📊 Feed fetch result:', result);
    
    return true;
  } catch (error) {
    // Timeout is expected due to processing all feeds
    if (error.message.includes('timeout') || error.message.includes('1102')) {
      console.log('⏱️ Feed fetch timed out (expected behavior - processing continues in background)');
      return true;
    }
    
    console.error('❌ Feed fetch failed:', error.message);
    return false;
  }
}

async function getArticleCount() {
  try {
    const response = await fetchWithRetry(`${WORKER_URL}/api/articles?limit=1`);
    const result = await response.json();
    console.log(`📈 Current article count: ${result.total || 0}`);
    return result.total || 0;
  } catch (error) {
    console.error('❌ Failed to get article count:', error.message);
    return -1;
  }
}

async function main() {
  console.log('🎯 GitHub Actions RSS Feed Fetcher Started');
  console.log(`🔗 Worker URL: ${WORKER_URL}`);
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log('─'.repeat(60));
  
  // Check worker health
  const isHealthy = await checkWorkerHealth();
  if (!isHealthy) {
    console.error('❌ Exiting due to worker health check failure');
    process.exit(1);
  }
  
  // Get initial article count
  const initialCount = await getArticleCount();
  
  // Trigger feed fetch
  const fetchSuccess = await triggerFeedFetch();
  if (!fetchSuccess) {
    console.error('❌ Feed fetch failed');
    process.exit(1);
  }
  
  // Wait a bit and check if articles were added
  console.log('⏳ Waiting 10 seconds to check for new articles...');
  await sleep(10000);
  
  const finalCount = await getArticleCount();
  const newArticles = finalCount - initialCount;
  
  console.log('─'.repeat(60));
  console.log(`📊 Feed fetch completed!`);
  console.log(`📈 Articles before: ${initialCount}`);
  console.log(`📈 Articles after: ${finalCount}`);
  console.log(`✨ New articles: ${newArticles >= 0 ? newArticles : 'Unknown'}`);
  console.log(`📅 Completed at: ${new Date().toISOString()}`);
  
  if (newArticles > 0) {
    console.log('🎉 Success! New articles were fetched.');
  } else if (initialCount >= 0) {
    console.log('ℹ️ No new articles this round (feeds may be up to date).');
  }
  
  console.log('✅ GitHub Actions RSS Feed Fetcher Completed');
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});