export const prerender = false;

import type { APIRoute } from 'astro';

// Mock sources data for Cloudflare Pages compatibility
const mockSources = [
  {
    id: 'bloomberg-markets',
    name: 'Bloomberg Markets',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    category: 'markets',
    enabled: true,
    lastFetch: new Date().toISOString(),
    status: 'active'
  },
  {
    id: 'reuters-business', 
    name: 'Reuters Business',
    url: 'https://feeds.reuters.com/reuters/businessNews',
    category: 'markets',
    enabled: true,
    lastFetch: new Date().toISOString(),
    status: 'error'
  },
  {
    id: 'ft-markets',
    name: 'Financial Times',
    url: 'https://www.ft.com/markets?format=rss',
    category: 'markets', 
    enabled: true,
    lastFetch: new Date().toISOString(),
    status: 'active'
  }
];

export const GET: APIRoute = async ({ request }) => {
  try {
    // Simple authentication check
    const url = new URL(request.url);
    const cookies = request.headers.get('cookie') || '';
    const hasAdminPass = cookies.includes('admin_pass=MF2025!SecureTeam#AdminAccess789') || 
                        url.searchParams.get('pass') === 'MF2025!SecureTeam#AdminAccess789';
    
    if (!hasAdminPass) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return mock data for now (in production, this would query actual sources)
    return new Response(JSON.stringify({
      sources: mockSources,
      stats: {
        totalSources: mockSources.length,
        activeSources: mockSources.filter(s => s.status === 'active').length,
        errorSources: mockSources.filter(s => s.status === 'error').length,
        lastUpdate: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({ 
    error: 'Method not implemented in production',
    message: 'Feed management is handled via configuration files'
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
};