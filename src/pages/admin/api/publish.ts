export const prerender = false;

import type { APIRoute } from 'astro';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

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
    const { title, content, author, tags, excerpt, media } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate filename from title
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

    // Write file to discoveries directory
    const filePath = path.join(process.cwd(), 'src/content/discoveries', filename);
    await fs.writeFile(filePath, markdown, 'utf8');

    // Git operations
    try {
      // Add the file
      await execAsync(`git add "${filePath}"`);
      
      // Commit with descriptive message
      const commitMessage = `Add discovery post: ${title}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
      
      await execAsync(`git commit -m "${commitMessage}"`);
      
      // Push to remote
      await execAsync('git push origin main');

      return new Response(JSON.stringify({ 
        success: true, 
        filename,
        message: 'Post published successfully and committed to Git'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (gitError) {
      // If git operations fail, at least the file was created
      console.error('Git operations failed:', gitError);
      return new Response(JSON.stringify({ 
        success: true, 
        filename,
        message: 'Post created but git operations failed',
        warning: 'File saved locally but not committed to Git'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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