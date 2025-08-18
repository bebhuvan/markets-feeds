import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  // Cache trending for 15 minutes (changes slowly)
  const headers = {
    'Cache-Control': 'public, max-age=900, s-maxage=900',
    'ETag': `"trending-${Date.now()}"`,
    'Last-Modified': new Date().toUTCString(),
    'Content-Type': 'application/json'
  };
  
  const response = {
    trending: [
      { keyword: 'artificial intelligence', articleCount: 23, avgReadingTime: 8 },
      { keyword: 'inflation', articleCount: 18, avgReadingTime: 6 },
      { keyword: 'market volatility', articleCount: 15, avgReadingTime: 5 },
      { keyword: 'digital currency', articleCount: 12, avgReadingTime: 10 }
    ]
  };
  
  return new Response(JSON.stringify(response), { headers });
};