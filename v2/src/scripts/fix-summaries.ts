/**
 * Fix Article Summaries Script
 * Reprocesses existing article summaries for consistency
 */

import { summaryProcessor } from '../lib/summary-processor';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Article {
  id: string;
  title: string;
  summary: string;
  fullContent?: string;
  [key: string]: any;
}

async function fixSummaries() {
  console.log('🔧 Starting summary consistency fix...');
  
  const contentDir = path.join(__dirname, '../../content/links');
  
  try {
    const files = await fs.readdir(contentDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('sample'));
    
    console.log(`📁 Found ${jsonFiles.length} content files to process`);
    
    let totalArticles = 0;
    let processedArticles = 0;
    let improvedArticles = 0;
    
    for (const filename of jsonFiles) {
      const filePath = path.join(contentDir, filename);
      console.log(`\n📄 Processing ${filename}...`);
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const articles: Article[] = JSON.parse(content);
        
        totalArticles += articles.length;
        
        // Process summaries in batches for consistency
        const batchSize = 50;
        for (let i = 0; i < articles.length; i += batchSize) {
          const batch = articles.slice(i, i + batchSize);
          
          const processedSummaries = summaryProcessor.processBatch(
            batch.map(article => ({
              title: article.title,
              summary: article.summary,
              fullContent: article.fullContent || article.summary
            }))
          );
          
          // Update articles with new summaries
          batch.forEach((article, index) => {
            const oldSummary = article.summary;
            const newSummary = processedSummaries[index];
            
            if (newSummary !== oldSummary) {
              article.summary = newSummary;
              improvedArticles++;
            }
            
            processedArticles++;
          });
        }
        
        // Write back the updated file
        await fs.writeFile(filePath, JSON.stringify(articles, null, 2));
        console.log(`✅ Updated ${articles.length} articles in ${filename}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error);
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY FIXING COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total articles processed: ${totalArticles}`);
    console.log(`Articles with improved summaries: ${improvedArticles}`);
    console.log(`Improvement rate: ${((improvedArticles / totalArticles) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error reading content directory:', error);
    process.exit(1);
  }
}

// Show some examples of improvements
async function showExamples() {
  console.log('\n📝 SUMMARY IMPROVEMENT EXAMPLES');
  console.log('='.repeat(60));
  
  // Test examples
  const testCases = [
    {
      title: 'Tesla Inks $16.5 Billion Deal For AI With Samsung',
      summary: '',
      fullContent: 'Tesla has reportedly signed a massive $16.5 billion deal with Samsung to develop advanced AI chips for their autonomous vehicle systems.'
    },
    {
      title: 'Analyst Says $100 Price Target Could Become \'Floor\'',
      summary: 'Short summary here',
      fullContent: 'Wall Street analyst John Smith believes the current $100 price target for XYZ Corp could become the new floor price as the company continues to exceed expectations with their quarterly earnings and market expansion.'
    },
    {
      title: 'JPMorgan says fintech middlemen like Plaid are \'major threat\'',
      summary: 'JPMorgan, the biggest U.S. bank by assets, is preparing to charge fintech middle',
      fullContent: 'JPMorgan, the biggest U.S. bank by assets, is preparing to charge fintech middlemen for accessing customer data as traditional banks face increasing pressure from technology companies disrupting the financial services industry.'
    }
  ];
  
  testCases.forEach((testCase, index) => {
    const processed = summaryProcessor.processSummary(
      testCase.summary,
      testCase.title,
      testCase.fullContent
    );
    
    console.log(`\n${index + 1}. ${testCase.title}`);
    console.log(`   Old: "${testCase.summary}" (${testCase.summary.length} chars)`);
    console.log(`   New: "${processed}" (${processed.length} chars)`);
  });
  
  console.log('='.repeat(60));
}

async function main() {
  console.log('🚀 Article Summary Consistency Fixer');
  console.log('This will standardize all article summaries for better readability\n');
  
  // Show examples first
  await showExamples();
  
  // Ask for confirmation
  console.log('\n⚠️  This will modify existing content files.');
  console.log('Make sure you have a backup or the files are in version control.');
  
  // For automated runs, skip confirmation
  const isAutomated = process.argv.includes('--auto');
  
  if (!isAutomated) {
    console.log('\nPress Ctrl+C to cancel, or Enter to continue...');
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve(void 0));
    });
  }
  
  await fixSummaries();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}