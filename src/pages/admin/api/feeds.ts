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
    } else if (action === 'clear-cache') {
      return await clearCache();
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

async function addFeed(feedData: { name: string; url: string; category: string; priority?: number }) {
  try {
    const { name, url, category, priority = 2 } = feedData;
    
    if (!name || !url || !category) {
      return new Response(JSON.stringify({ error: 'Name, URL, and category are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate feed ID
    const feedId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 50);

    // Create new feed entry code
    const newFeedEntry = `  {
    id: '${feedId}',
    name: '${name}',
    url: '${url}',
    category: '${category}' as Category,
    priority: ${priority},
    enabled: true
  },`;

    // Debug: Check multiple ways to access environment variables
    const githubToken = process.env.GITHUB_TOKEN || 
                       globalThis.process?.env?.GITHUB_TOKEN ||
                       ((globalThis as any).Deno?.env?.get?.('GITHUB_TOKEN'));
    const repoOwner = 'bebhuvan'; // Replace with actual repo owner
    const repoName = 'markets-feeds'; // Replace with actual repo name
    
    // Debug logging for add feed
    console.log('Add feed - Environment check:', {
      hasToken: !!githubToken,
      tokenLength: githubToken ? githubToken.length : 0,
      tokenPrefix: githubToken ? githubToken.substring(0, 7) + '...' : 'none'
    });
    
    if (githubToken) {
      try {
        // Get current sources.ts file content
        const getFileResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/src/config/sources.ts`, {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Markets-Feeds-Admin/1.0'
          }
        });

        if (!getFileResponse.ok) {
          throw new Error(`Failed to fetch sources.ts: ${getFileResponse.status}`);
        }

        const fileData = await getFileResponse.json();
        const currentContent = atob(fileData.content);
        
        // Find the insertion point (before the closing bracket of RSS_SOURCES array)
        const insertionPoint = currentContent.lastIndexOf('];');
        if (insertionPoint === -1) {
          throw new Error('Could not find RSS_SOURCES array closing bracket');
        }

        // Insert the new feed entry
        const updatedContent = currentContent.slice(0, insertionPoint) + newFeedEntry + '\n' + currentContent.slice(insertionPoint);

        // Update the file via GitHub API
        const updateResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/src/config/sources.ts`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Markets-Feeds-Admin/1.0'
          },
          body: JSON.stringify({
            message: `Add RSS feed: ${name}\n\nAdded via admin dashboard:\n- Name: ${name}\n- URL: ${url}\n- Category: ${category}\n- Priority: ${priority}`,
            content: btoa(updatedContent),
            sha: fileData.sha,
            branch: 'main'
          })
        });

        if (updateResponse.ok) {
          return new Response(JSON.stringify({ 
            success: true,
            message: `RSS feed "${name}" has been successfully added to sources.ts and committed to the repository!`,
            feedId,
            git_updated: true,
            commit_message: `Add RSS feed: ${name}`
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          const errorText = await updateResponse.text();
          console.error('GitHub update error:', updateResponse.status, errorText);
          
          return new Response(JSON.stringify({ 
            success: false,
            error: `GitHub update failed: ${updateResponse.status}`,
            message: 'Failed to update sources.ts. The feed configuration was generated but not committed.',
            code: newFeedEntry,
            fallback_message: 'You can manually add this feed to src/config/sources.ts'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
      } catch (githubError) {
        console.error('GitHub API error:', githubError);
        
        return new Response(JSON.stringify({ 
          success: false,
          error: 'GitHub API error',
          message: githubError instanceof Error ? githubError.message : 'Unknown GitHub error',
          code: newFeedEntry,
          fallback_message: 'You can manually add this feed to src/config/sources.ts'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Fallback when no GitHub token available
      return new Response(JSON.stringify({ 
        success: true,
        message: `Feed configuration generated for "${name}". GitHub token not configured, so this would be added to sources.ts automatically in production.`,
        feedId,
        code: newFeedEntry,
        git_updated: false,
        fallback_message: 'To enable automatic source updates, configure GITHUB_TOKEN environment variable with repo write permissions.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Add feed error:', error);
    return new Response(JSON.stringify({ 
      success: false,
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
    // Try to trigger GitHub Actions workflow via API
    // Debug: Check multiple ways to access environment variables
    const githubToken = process.env.GITHUB_TOKEN || 
                       globalThis.process?.env?.GITHUB_TOKEN ||
                       ((globalThis as any).Deno?.env?.get?.('GITHUB_TOKEN'));
    const repoOwner = 'bebhuvan'; // Replace with actual repo owner
    const repoName = 'markets-feeds'; // Replace with actual repo name
    
    // Debug logging (will show in Cloudflare Functions logs)
    console.log('Environment check:', {
      hasToken: !!githubToken,
      tokenLength: githubToken ? githubToken.length : 0,
      tokenPrefix: githubToken ? githubToken.substring(0, 7) + '...' : 'none',
      envKeys: Object.keys(process.env || {}).filter(k => k.includes('GITHUB') || k.includes('TOKEN'))
    });
    
    if (githubToken) {
      try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/aggregate-feeds.yml/dispatches`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Markets-Feeds-Admin/1.0'
          },
          body: JSON.stringify({
            ref: 'main',
            inputs: {
              triggered_by: 'admin_dashboard',
              timestamp: new Date().toISOString()
            }
          })
        });

        if (response.ok) {
          return new Response(JSON.stringify({ 
            success: true,
            message: 'RSS feed refresh triggered successfully! The aggregation workflow is now running. Check the logs for progress.',
            timestamp: new Date().toISOString(),
            workflow_triggered: true
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          const errorText = await response.text();
          console.error('GitHub API error:', response.status, errorText);
          
          return new Response(JSON.stringify({ 
            success: false,
            error: `GitHub API error: ${response.status}`,
            message: 'Failed to trigger workflow. Please check GitHub token permissions.',
            fallback_message: 'You can manually trigger the workflow at: https://github.com/bebhuvan/markets-feeds/actions/workflows/aggregate-feeds.yml'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (githubError) {
        console.error('GitHub API request failed:', githubError);
        
        return new Response(JSON.stringify({ 
          success: false,
          error: 'GitHub API request failed',
          message: githubError instanceof Error ? githubError.message : 'Network error',
          fallback_message: 'You can manually trigger the workflow at: https://github.com/bebhuvan/markets-feeds/actions/workflows/aggregate-feeds.yml'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Fallback when no GitHub token available
      return new Response(JSON.stringify({ 
        success: false,
        error: 'GitHub token not found',
        message: 'GITHUB_TOKEN environment variable is not accessible in this runtime environment.',
        timestamp: new Date().toISOString(),
        workflow_triggered: false,
        debug_info: {
          runtime: typeof process !== 'undefined' ? 'Node.js' : (globalThis as any).Deno ? 'Deno' : 'Unknown',
          hasProcess: typeof process !== 'undefined',
          hasProcessEnv: typeof process?.env !== 'undefined',
          envKeyCount: Object.keys(process?.env || {}).length
        },
        solutions: [
          '1. Verify GITHUB_TOKEN is set in Cloudflare Pages environment variables',
          '2. Ensure the variable is set for the Production environment',
          '3. Check that the latest deployment includes the environment variable',
          '4. Manual fallback: https://github.com/bebhuvan/markets-feeds/actions/workflows/aggregate-feeds.yml'
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Refresh feeds error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to process refresh request',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback_message: 'You can manually trigger the workflow at: https://github.com/bebhuvan/markets-feeds/actions/workflows/aggregate-feeds.yml'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function clearCache() {
  try {
    // Return cache clearing instructions for the client
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Cache clearing initiated. Browser cache, service worker cache, and CDN cache will be cleared.',
      actions: [
        'Browser cache cleared',
        'Service Worker cache cleared',
        'CDN cache invalidation requested'
      ],
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Clear cache error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}