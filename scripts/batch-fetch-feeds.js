#!/usr/bin/env node

import fetch from 'node-fetch';

const WORKER_URL = 'https://markets-feeds.r-bhuvanesh2007.workers.dev';
const BATCH_SIZE = 3; // Process 3 feeds at a time for better performance

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function healthCheck() {
  try {
    console.log('🔍 Checking worker health...');
    const response = await fetch(`${WORKER_URL}/api/sources`, { timeout: 10000 });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const sources = await response.json();
    console.log(`✅ Worker healthy - ${sources.length} sources configured`);
    return sources.length;
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
    throw error;
  }
}

async function getArticleCount() {
  try {
    const response = await fetch(`${WORKER_URL}/api/articles?limit=1`, { timeout: 10000 });
    if (!response.ok) return 0;
    
    const data = await response.json();
    return data.total || 0;
  } catch (error) {
    console.log(`⚠️ Could not get article count: ${error.message}`);
    return 0;
  }
}

async function processBatch(offset) {
  try {
    console.log(`📡 Processing batch at offset ${offset}...`);
    
    const response = await fetch(
      `${WORKER_URL}/fetch-feeds-batch?batch_size=${BATCH_SIZE}&offset=${offset}`,
      { 
        timeout: 20000,
        headers: {
          'User-Agent': 'GitHub-Actions-RSS-Bot/1.0 (+https://github.com/bebhuvan/markets-feeds)'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Batch processing failed');
    }
    
    console.log(`✅ Batch ${offset} processed: ${result.successful}/${result.processed} feeds successful`);
    return result;
    
  } catch (error) {
    console.error(`❌ Batch ${offset} failed: ${error.message}`);
    return { success: false, hasMore: false, error: error.message };
  }
}

async function main() {
  console.log('🎯 GitHub Actions Batch RSS Fetcher');
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log('─'.repeat(60));
  
  try {
    // Step 1: Health check
    await healthCheck();
    
    // Step 2: Get initial article count
    const initialCount = await getArticleCount();
    console.log(`📊 Initial article count: ${initialCount}`);
    
    // Step 3: Process feeds in batches
    let offset = 0;
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let batchNumber = 1;
    
    while (true) {
      console.log(`\n🔄 Starting batch ${batchNumber} (offset ${offset})...`);
      
      const result = await processBatch(offset);
      
      if (!result.success && result.error) {
        console.error(`💥 Fatal error in batch ${batchNumber}: ${result.error}`);
        break;
      }
      
      if (result.success) {
        totalProcessed += result.processed || 0;
        totalSuccessful += result.successful || 0;
        
        console.log(`✅ Batch ${batchNumber} complete - ${result.successful}/${result.processed} successful`);
      }
      
      // Check if there are more batches to process
      if (!result.hasMore) {
        console.log('🏁 All batches processed');
        break;
      }
      
      offset = result.nextOffset || (offset + BATCH_SIZE);
      batchNumber++;
      
      // Add delay between batches to be gentle on the worker
      await sleep(1000);
      
      // Safety limit to prevent infinite loops
      if (batchNumber > 100) {
        console.log('⚠️ Reached batch limit (100), stopping');
        break;
      }
    }
    
    // Step 4: Final verification
    await sleep(3000); // Wait for data to settle
    const finalCount = await getArticleCount();
    const articlesAdded = Math.max(0, finalCount - initialCount);
    
    console.log('\n' + '─'.repeat(60));
    console.log('📊 FINAL RESULTS:');
    console.log(`✅ Total batches processed: ${batchNumber - 1}`);
    console.log(`✅ Total feeds processed: ${totalProcessed}`);
    console.log(`✅ Successful feeds: ${totalSuccessful}`);
    console.log(`📈 Articles before: ${initialCount}`);
    console.log(`📈 Articles after: ${finalCount}`);
    console.log(`📈 New articles added: ${articlesAdded}`);
    console.log(`📅 Completed at: ${new Date().toISOString()}`);
    
    if (articlesAdded > 0) {
      console.log('🎉 Feed fetching successful - new articles added!');
    } else if (totalSuccessful > 0) {
      console.log('✅ Feed fetching completed - feeds processed but no new articles');
    } else {
      console.log('⚠️ Feed fetching completed but no feeds were successful');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});