import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Get the response from the request
  const response = await next();
  
  // Add cache headers for different types of content
  const url = context.url;
  const pathname = url.pathname;
  
  // For static assets (in dev mode, in production this would be handled by CDN/server)
  if (pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year
  }
  // For HTML pages containing dynamic content
  else if (pathname.endsWith('/') || pathname.endsWith('.html') || !pathname.includes('.')) {
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    response.headers.set('ETag', `"page-${Date.now()}"`);
  }
  
  return response;
};