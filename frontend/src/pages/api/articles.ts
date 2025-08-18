import type { APIRoute } from 'astro';

const mockArticles = [
  {
    id: '1',
    article_id: 'article_1',
    title: 'Federal Reserve Signals Potential Rate Cuts Amid Inflation Concerns',
    link: 'https://example.com/article1',
    description: 'The Federal Reserve is considering adjustments to monetary policy as inflation shows signs of cooling, according to recent statements from policymakers...',
    source: 'Bloomberg Markets',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    readingTime: 5,
    contentFetched: true,
    author: 'John Smith'
  },
  {
    id: '2',
    article_id: 'article_2',
    title: 'AI Revolution in Financial Services: A Deep Dive into Machine Learning Applications',
    link: 'https://example.com/article2',
    description: 'How artificial intelligence is reshaping everything from credit decisions to algorithmic trading, and what it means for the future of finance...',
    source: 'The Diff',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    readingTime: 12,
    contentFetched: true,
    author: 'Sarah Johnson'
  },
  {
    id: '3',
    article_id: 'article_3',
    title: 'Indian Markets Rally on Policy Optimism and Infrastructure Spending',
    link: 'https://example.com/article3',
    description: 'Sensex and Nifty hit new highs as investors respond positively to recent government announcements on infrastructure spending and tax reforms...',
    source: 'Economic Times',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    readingTime: 4,
    contentFetched: false,
    author: 'Raj Patel'
  },
  {
    id: '4',
    article_id: 'article_4',
    title: 'Risk Parity Strategies Show Resilience in Volatile Markets',
    link: 'https://example.com/article4',
    description: 'New research demonstrates how risk parity portfolios have maintained consistent performance across different market regimes...',
    source: 'NBER Working Papers',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    readingTime: 15,
    contentFetched: true,
    author: 'Dr. Michael Chen'
  },
  {
    id: '5',
    article_id: 'article_5',
    title: 'Central Bank Digital Currencies: Progress and Challenges',
    link: 'https://example.com/article5',
    description: 'As more countries pilot digital currencies, questions remain about implementation timelines and potential impacts on traditional banking systems...',
    source: 'Financial Times',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    readingTime: 8,
    contentFetched: true,
    author: 'Emma Wilson'
  },
  {
    id: '6',
    article_id: 'article_6',
    title: 'The State of Alternative Investments in 2025',
    link: 'https://example.com/article6',
    description: 'Comprehensive analysis of private equity, real estate, and commodity markets reveals shifting patterns in institutional allocation strategies...',
    source: 'Harvard Business Review',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    readingTime: 20,
    contentFetched: true,
    author: 'Prof. David Brown'
  }
];

export const GET: APIRoute = ({ url }) => {
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const source = url.searchParams.get('source');
  const category = url.searchParams.get('category');
  
  // Short cache for articles (1 minute) - news needs to be fresh
  const headers = {
    'Cache-Control': 'public, max-age=60, s-maxage=60',
    'ETag': `"articles-${Date.now()}"`,
    'Last-Modified': new Date().toUTCString(),
    'Content-Type': 'application/json'
  };
  
  let filtered = [...mockArticles];
  
  if (source) {
    filtered = filtered.filter(a => a.source === source);
  }
  
  // For category filtering, we'd need to implement source-to-category mapping
  // This is simplified for now
  
  const response = {
    articles: filtered.slice(0, limit),
    total: filtered.length,
    hasMore: filtered.length > limit
  };
  
  return new Response(JSON.stringify(response), { headers });
};