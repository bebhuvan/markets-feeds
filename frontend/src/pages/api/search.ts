import type { APIRoute } from 'astro';

const mockArticles = [
  {
    id: '1',
    title: 'Federal Reserve Signals Potential Rate Cuts Amid Inflation Concerns',
    description: 'The Federal Reserve is considering adjustments to monetary policy as inflation shows signs of cooling, according to recent statements from policymakers...',
    source: 'Bloomberg Markets'
  },
  {
    id: '2',
    title: 'AI Revolution in Financial Services: A Deep Dive into Machine Learning Applications',
    description: 'How artificial intelligence is reshaping everything from credit decisions to algorithmic trading, and what it means for the future of finance...',
    source: 'The Diff'
  },
  {
    id: '3',
    title: 'Indian Markets Rally on Policy Optimism and Infrastructure Spending',
    description: 'Sensex and Nifty hit new highs as investors respond positively to recent government announcements on infrastructure spending and tax reforms...',
    source: 'Economic Times'
  }
];

export const GET: APIRoute = ({ url }) => {
  const query = url.searchParams.get('q') || '';
  
  // No cache for search - user-specific queries
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'application/json'
  };
  
  if (!query) {
    return new Response(JSON.stringify({ query: '', results: [], total: 0 }), { headers });
  }
  
  const results = mockArticles.filter(article => 
    article.title.toLowerCase().includes(query.toLowerCase()) ||
    article.description.toLowerCase().includes(query.toLowerCase())
  );
  
  const response = {
    query,
    results,
    total: results.length,
    searchTime: 15
  };
  
  return new Response(JSON.stringify(response), { headers });
};