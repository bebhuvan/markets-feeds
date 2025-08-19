import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ url }) => {
  const query = url.searchParams.get('q') || '';
  
  // No cache for suggestions - user-specific queries
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'application/json'
  };
  
  const suggestions = [
    { text: `${query} in markets`, type: 'search', meta: '15 articles' },
    { text: `${query} analysis`, type: 'search', meta: '8 articles' },
    { text: `${query} research`, type: 'search', meta: '5 articles' }
  ];
  
  return new Response(JSON.stringify({ suggestions }), { headers });
};