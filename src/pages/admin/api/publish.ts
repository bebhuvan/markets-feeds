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
    const { title, content, author, tags, excerpt, media } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // In Cloudflare Workers environment, we can't write files or run git commands
    // Return the content that would be published for manual handling
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}-${title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)}.md`;

    // Create markdown content
    let mediaSection = '';
    if (media && media.type !== 'none' && media.url) {
      mediaSection = `media:
  type: "${media.type}"
  url: "${media.url}"
  title: "${media.title || ''}"
  description: "${media.description || ''}"
  image: "${media.image || ''}"`;
    }

    const markdown = `---
title: "${title}"
date: ${date}
author: "${author || 'Research Team'}"
tags: [${tags.map((tag: string) => `"${tag}"`).join(', ')}]${excerpt ? `
excerpt: "${excerpt}"` : ''}
${mediaSection}
---

${content}`;

    return new Response(JSON.stringify({ 
      success: true, 
      filename,
      content: markdown,
      message: 'Post content generated successfully. In production, this would trigger a GitHub Action to commit the file.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Publish error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to publish post',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};