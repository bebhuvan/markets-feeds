#!/usr/bin/env node

// Simple test script to debug feed fetching
console.log('🧪 Testing feed fetching system...\n');

// Test 1: Check if we can import the feed fetcher
try {
  console.log('1. Testing module imports...');
  const fs = require('fs');
  const path = require('path');
  
  // Check if required files exist
  const feedsConfigPath = path.join(__dirname, 'feeds.config.json');
  const scriptsDir = path.join(__dirname, 'src', 'scripts');
  const fetchScript = path.join(scriptsDir, 'fetch-all-feeds.ts');
  
  console.log(`   ✓ feeds.config.json exists: ${fs.existsSync(feedsConfigPath)}`);
  console.log(`   ✓ scripts directory exists: ${fs.existsSync(scriptsDir)}`);
  console.log(`   ✓ fetch script exists: ${fs.existsSync(fetchScript)}`);
  
  // Check package.json
  const packagePath = path.join(__dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`   ✓ fetch-feeds script: ${pkg.scripts['fetch-feeds'] || 'MISSING'}`);
  
} catch (error) {
  console.error('❌ Module import test failed:', error.message);
}

// Test 2: Check feeds config
try {
  console.log('\n2. Testing feeds configuration...');
  const fs = require('fs');
  const path = require('path');
  
  const configPath = path.join(__dirname, 'feeds.config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  console.log(`   ✓ Total feeds configured: ${config.feeds.length}`);
  console.log(`   ✓ Active feeds: ${config.feeds.filter(f => f.active).length}`);
  console.log(`   ✓ First feed: ${config.feeds[0]?.name || 'NONE'}`);
  
} catch (error) {
  console.error('❌ Config test failed:', error.message);
}

// Test 3: Simple HTTP test
try {
  console.log('\n3. Testing HTTP fetch capability...');
  
  // Simple fetch test
  fetch('https://httpbin.org/json')
    .then(response => response.json())
    .then(data => {
      console.log('   ✓ HTTP fetch works:', data.slideshow?.title || 'OK');
    })
    .catch(error => {
      console.error('   ❌ HTTP fetch failed:', error.message);
    });
    
} catch (error) {
  console.error('❌ HTTP test setup failed:', error.message);
}

console.log('\n🏁 Test complete. Check results above.\n');