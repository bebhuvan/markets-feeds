/**
 * Test script for strategic recategorization
 * Shows how the minimal approach would redistribute content
 */

import { recategorizationEngine } from '../lib/recategorization-engine';

// Mock sample articles from different categories
const sampleArticles = [
  {
    url: '1',
    title: 'Apple Reports Record Q3 Earnings, Revenue Beats Expectations',
    summary: 'Apple Inc. posted quarterly revenue of $94.8 billion, beating analyst estimates...',
    category: 'markets',
    sourceId: 'bloomberg',
    publishedAt: '2025-08-01',
    tags: ['Apple', 'Earnings', 'Technology'],
    fetchedAt: '2025-08-01'
  },
  {
    url: '2', 
    title: 'Microsoft Announces Acquisition of AI Startup for $2.1 Billion',
    summary: 'Microsoft Corporation announced today it will acquire AI startup...',
    category: 'markets',
    sourceId: 'wsj',
    publishedAt: '2025-08-01',
    tags: ['Microsoft', 'Acquisition', 'AI'],
    fetchedAt: '2025-08-01'
  },
  {
    url: '3',
    title: 'Bitcoin Surges Above $65,000 as Institutional Adoption Grows',
    summary: 'Bitcoin price reached a new high as major institutions...',
    category: 'technology',
    sourceId: 'coindesk',
    publishedAt: '2025-08-01',
    tags: ['Bitcoin', 'Cryptocurrency'],
    fetchedAt: '2025-08-01'
  },
  {
    url: '4',
    title: 'Fed Chair Powell Signals Potential Rate Cut in September',
    summary: 'Federal Reserve Chairman Jerome Powell indicated in his speech...',
    category: 'macro',
    sourceId: 'reuters',
    publishedAt: '2025-08-01',
    tags: ['Fed', 'Interest Rates'],
    fetchedAt: '2025-08-01'
  },
  {
    url: '5',
    title: 'Oil Prices Jump 3% on Supply Concerns',
    summary: 'Crude oil futures gained sharply amid supply disruption concerns...',
    category: 'markets',
    sourceId: 'bloomberg',
    publishedAt: '2025-08-01',
    tags: ['Oil', 'Commodities'],
    fetchedAt: '2025-08-01'
  }
];

function testStrategicRecategorization() {
  console.log('🧪 Testing Strategic Recategorization Approach\n');
  console.log('=' * 60);

  for (const article of sampleArticles) {
    const result = recategorizationEngine.recategorizeArticle(article);
    
    console.log(`\n📰 ${article.title.slice(0, 50)}...`);
    console.log(`   Original: ${result.originalCategory}`);
    console.log(`   New: ${result.newCategory}`);
    console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);
    console.log(`   Reason: ${result.reason}`);
    
    if (result.originalCategory !== result.newCategory) {
      console.log(`   ✅ CHANGED: ${result.originalCategory} → ${result.newCategory}`);
    } else {
      console.log(`   📌 UNCHANGED: Stays in ${result.originalCategory}`);
    }
  }

  console.log('\n📊 EXPECTED IMPACT:');
  console.log('   • Markets tab stays main destination');
  console.log('   • Earnings get their own focused tab');
  console.log('   • M&A deals separated for deal-focused readers');
  console.log('   • Crypto gets distinct section for crypto audience');
  console.log('   • Central Banking emerges for Fed/ECB content');
  console.log('   • Commodities separated for commodity traders');
  
  console.log('\n🎯 RESULT: Clean, strategic splits without over-categorization');
}

// Run test
testStrategicRecategorization();