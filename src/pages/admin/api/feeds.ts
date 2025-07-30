export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

    // Read current sources file
    const sourcesPath = path.join(process.cwd(), 'src/config/sources.ts');
    let sourcesContent = await fs.readFile(sourcesPath, 'utf8');

    // Create new feed entry
    const newFeed = `  {
    id: '${feedId}',
    name: '${name}',
    url: '${url}',
    category: '${category}' as Category,
    enabled: true
  },`;

    // Insert before the closing bracket
    const insertPoint = sourcesContent.lastIndexOf('];');
    sourcesContent = sourcesContent.slice(0, insertPoint) + newFeed + '\n' + sourcesContent.slice(insertPoint);

    // Write back to file
    await fs.writeFile(sourcesPath, sourcesContent, 'utf8');

    // Commit changes
    try {
      await execAsync(`git add "${sourcesPath}"`);
      await execAsync(`git commit -m "Add RSS feed: ${name}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"`);
      await execAsync('git push origin main');
    } catch (gitError) {
      console.error('Git operations failed:', gitError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Feed "${name}" added successfully`,
      feedId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Add feed error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to add feed',
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
    // Run the aggregation script
    const { stdout, stderr } = await execAsync('cd /home/bhuvanesh/markets-feeds && python3 scripts/aggregate_feeds_improved.py', {
      timeout: 300000 // 5 minutes timeout
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Feed refresh completed successfully',
      output: stdout,
      errors: stderr
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Refresh feeds error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to refresh feeds',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}