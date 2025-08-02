/**
 * Script to recategorize all feed articles using the new granular category system
 * Run with: npx tsx src/scripts/recategorize-feeds.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { recategorizationEngine } from '../lib/recategorization-engine';
import { CATEGORIES } from '../lib/categories';
import type { FeedItem } from '../types';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'links');
const BACKUP_DIR = path.join(process.cwd(), 'content', 'backup');
const REPORT_FILE = path.join(process.cwd(), 'recategorization-report.md');

async function main() {
  console.log('🚀 Starting feed recategorization process...\n');

  try {
    // Create backup directory
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    console.log('✅ Created backup directory');

    // Load all existing articles
    console.log('📖 Loading existing articles...');
    const { articles, files } = await loadAllArticles();
    console.log(`📊 Loaded ${articles.length} articles from ${files.length} files`);

    // Backup original files
    console.log('💾 Creating backup of original files...');
    await backupOriginalFiles(files);
    console.log('✅ Backup completed');

    // Run recategorization
    console.log('🔄 Running recategorization engine...');
    const { results, stats } = recategorizationEngine.recategorizeArticles(articles);
    console.log(`✅ Recategorization completed`);
    console.log(`   - ${stats.categoriesChanged} articles recategorized (${Math.round((stats.categoriesChanged / stats.totalArticles) * 100)}%)`);
    console.log(`   - ${Object.keys(stats.categoryDistribution).length} new categories created`);

    // Group articles by their new categories
    console.log('📁 Grouping articles by new categories...');
    const categorizedArticles = groupArticlesByCategory(results);

    // Write updated files
    console.log('💾 Writing updated files...');
    await writeUpdatedFiles(categorizedArticles, files);
    console.log('✅ Files updated successfully');

    // Generate and save report
    console.log('📋 Generating recategorization report...');
    const report = recategorizationEngine.generateReport(stats);
    await fs.writeFile(REPORT_FILE, report, 'utf-8');
    console.log(`✅ Report saved to ${REPORT_FILE}`);

    // Display summary
    displaySummary(stats);

  } catch (error) {
    console.error('❌ Error during recategorization:', error);
    process.exit(1);
  }
}

async function loadAllArticles(): Promise<{ articles: FeedItem[]; files: string[] }> {
  const files = await fs.readdir(CONTENT_DIR);
  const jsonFiles = files.filter(file => file.endsWith('.json') && !file.includes('sample'));
  
  const articles: FeedItem[] = [];
  
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(CONTENT_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const fileArticles = JSON.parse(content) as FeedItem[];
      
      if (Array.isArray(fileArticles)) {
        articles.push(...fileArticles);
      }
    } catch (error) {
      console.warn(`⚠️  Warning: Could not parse ${file}:`, error);
    }
  }

  return { articles, files: jsonFiles };
}

async function backupOriginalFiles(files: string[]): Promise<void> {
  for (const file of files) {
    const sourcePath = path.join(CONTENT_DIR, file);
    const backupPath = path.join(BACKUP_DIR, `${file}.backup`);
    await fs.copyFile(sourcePath, backupPath);
  }
}

function groupArticlesByCategory(results: Array<{ newCategory: string; article: FeedItem }>): Map<string, FeedItem[]> {
  const grouped = new Map<string, FeedItem[]>();

  for (const result of results) {
    // Update the article's category
    const updatedArticle = {
      ...result.article,
      category: result.newCategory
    };

    if (!grouped.has(result.newCategory)) {
      grouped.set(result.newCategory, []);
    }
    grouped.get(result.newCategory)!.push(updatedArticle);
  }

  return grouped;
}

async function writeUpdatedFiles(
  categorizedArticles: Map<string, FeedItem[]>,
  originalFiles: string[]
): Promise<void> {
  // Calculate articles per file to maintain similar file sizes
  const totalArticles = Array.from(categorizedArticles.values())
    .reduce((sum, articles) => sum + articles.length, 0);
  const articlesPerFile = Math.ceil(totalArticles / originalFiles.length);

  // Flatten all articles and sort by date
  const allArticles = Array.from(categorizedArticles.values())
    .flat()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Write articles back to files maintaining chronological distribution
  for (let i = 0; i < originalFiles.length; i++) {
    const startIndex = i * articlesPerFile;
    const endIndex = Math.min(startIndex + articlesPerFile, allArticles.length);
    const fileArticles = allArticles.slice(startIndex, endIndex);

    if (fileArticles.length > 0) {
      const filePath = path.join(CONTENT_DIR, originalFiles[i]);
      await fs.writeFile(filePath, JSON.stringify(fileArticles, null, 2), 'utf-8');
    }
  }
}

function displaySummary(stats: any): void {
  console.log('\n📊 RECATEGORIZATION SUMMARY');
  console.log('=' * 50);
  console.log(`Total Articles: ${stats.totalArticles.toLocaleString()}`);
  console.log(`Articles Recategorized: ${stats.categoriesChanged.toLocaleString()}`);
  console.log(`Success Rate: ${Math.round((stats.categoriesChanged / stats.totalArticles) * 100)}%`);
  
  console.log('\n🏷️  TOP NEW CATEGORIES:');
  const topCategories = Object.entries(stats.categoryDistribution)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10);

  for (const [category, count] of topCategories) {
    const categoryName = CATEGORIES[category as keyof typeof CATEGORIES] || category;
    const percentage = Math.round(((count as number) / stats.totalArticles) * 100);
    console.log(`   ${categoryName}: ${(count as number).toLocaleString()} (${percentage}%)`);
  }

  console.log('\n🔄 MAJOR MIGRATIONS:');
  for (const migration of stats.migrationSummary) {
    if (migration.newCategories.length > 1 && migration.newCategories[0].count > 50) {
      console.log(`   ${migration.oldCategory} →`);
      for (const newCat of migration.newCategories.slice(0, 3)) {
        const categoryName = CATEGORIES[newCat.category as keyof typeof CATEGORIES] || newCat.category;
        console.log(`      ${categoryName}: ${newCat.count} articles (${newCat.percentage}%)`);
      }
    }
  }

  console.log('\n✅ Recategorization completed successfully!');
  console.log(`📋 Detailed report available at: ${REPORT_FILE}`);
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}