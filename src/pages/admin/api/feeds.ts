export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
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

    const body = await request.json();
    const { action, feedData } = body;

    if (action === 'add') {
      return await addFeed(feedData);
    } else if (action === 'test') {
      return await testFeed(feedData);
    } else if (action === 'refresh') {
      return await refreshAllFeeds();
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Feed API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function addFeed(feedData: { name: string; url: string; category: string }) {
  try {
    const { name, url, category } = feedData;
    
    if (!name || !url || !category) {
      return new Response(JSON.stringify({ error: 'Name, URL, and category are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate feed ID
    const feedId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    // Create new feed entry code
    const newFeed = `  {
    id: '${feedId}',
    name: '${name}',
    url: '${url}',
    category: '${category}' as Category,
    enabled: true
  },`;

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Feed configuration generated. In production, this would be added to sources.ts via GitHub Action.`,
      feedId,
      code: newFeed
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Add feed error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate feed configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function testFeed(feedData: { url: string }) {
  try {
    const { url } = feedData;
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test RSS feed
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Markets-Feeds/1.0)'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ 
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const content = await response.text();
    
    // Basic RSS/XML validation
    if (!content.includes('<rss') && !content.includes('<feed') && !content.includes('<?xml')) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'URL does not appear to be a valid RSS/XML feed'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Feed is accessible and appears to be valid RSS/XML',
      contentLength: content.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test feed'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function refreshAllFeeds() {
  try {
    // In Cloudflare Workers, we can't run local scripts
    // This would trigger a GitHub Action in production
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Feed refresh request received. In production, this would trigger the RSS aggregation GitHub Action.',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Refresh feeds error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to process refresh request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}