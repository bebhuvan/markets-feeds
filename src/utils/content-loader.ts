import type { FeedItem } from '../types';

export interface ContentLoaderOptions {
  category: string;
  maxFiles?: number;
  itemsPerPage?: number;
}

export interface LoadedContent {
  allLinks: FeedItem[];
  totalFiles: number;
  errorCount: number;
}

/**
 * Loads and filters content from JSON files with error handling
 * @param linkFiles - Array of imported JSON files from Astro.glob()
 * @param options - Configuration options for loading content
 * @returns Processed content with error tracking
 */
export function loadContent(linkFiles: any[], options: ContentLoaderOptions): LoadedContent {
  const { category, maxFiles = 10 } = options;
  let allLinks: FeedItem[] = [];
  let errorCount = 0;

  try {
    // Sort files by date from filename (URL-based sorting - reliable)
    const sortedFiles = linkFiles
      .filter(file => file.url && !file.url.includes('sample-data.json'))
      .sort((a, b) => {
        const dateA = a.url?.match(/(2025-\d{2}-\d{2})\.json$/)?.[1] || '2000-01-01';
        const dateB = b.url?.match(/(2025-\d{2}-\d{2})\.json$/)?.[1] || '2000-01-01';
        return dateB.localeCompare(dateA);
      });

    // Load the latest N files for better content coverage
    const recentFiles = sortedFiles.slice(0, maxFiles);

    for (const file of recentFiles) {
      try {
        if (Array.isArray(file.default)) {
          const categoryItems = file.default.filter((item: FeedItem) => 
            item && 
            item.category === category && 
            item.title && 
            item.url &&
            item.publishedAt
          );
          allLinks.push(...categoryItems);
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.url}:`, fileError);
        errorCount++;
      }
    }

    // Sort by published date (newest first)
    allLinks.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return {
      allLinks,
      totalFiles: recentFiles.length,
      errorCount
    };

  } catch (error) {
    console.error('Error in loadContent:', error);
    return {
      allLinks: [],
      totalFiles: 0,
      errorCount: 1
    };
  }
}

/**
 * Creates pagination data for content display
 */
export function createPagination(allLinks: FeedItem[], currentPage: number, itemsPerPage: number) {
  const totalPages = Math.ceil(allLinks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedLinks = allLinks.slice(startIndex, endIndex);

  return {
    displayedLinks,
    totalPages,
    showingStart: startIndex + 1,
    showingEnd: Math.min(endIndex, allLinks.length),
    hasPrevPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
    totalItems: allLinks.length
  };
}