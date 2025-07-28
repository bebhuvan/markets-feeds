// Service Worker for Markets Feeds PWA
const CACHE_VERSION = '2.1'; // Manual version for major changes
const STATIC_CACHE_NAME = `markets-feeds-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `markets-feeds-dynamic-v${CACHE_VERSION}`;

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  HTML: 5 * 60 * 1000,      // 5 minutes - frequent content updates
  CSS_JS: 24 * 60 * 60 * 1000,  // 24 hours - less frequent changes
  IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days - rarely change
  FEEDS: 2 * 60 * 1000,     // 2 minutes - very frequent updates
};

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/markets',
  '/macro',
  '/news',
  '/research',
  '/technology',
  '/aggregators',
  '/newsletters',
  '/non-money',
  '/policy',
  '/filings',
  '/search',
  '/archive',
  '/sources',
  '/manifest.json'
];

// Resources to cache on first access
const DYNAMIC_ASSETS = [
  '/src/styles/global.css',
  '/src/components/LinkCard.astro',
  '/src/components/Navigation.astro'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.log('Service Worker: Cache failed', err))
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Clearing old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages
        return self.clients.claim();
      })
  );
});

// Fetch event - intelligent caching with expiration
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

// Intelligent fetch handling with cache expiration
async function handleFetch(request) {
  const url = new URL(request.url);
  const isHTML = request.destination === 'document';
  const isAsset = request.destination === 'style' || request.destination === 'script' || request.destination === 'image';
  const isFeedData = url.pathname.includes('/content/links/');
  
  // Get cached response
  const cachedResponse = await caches.match(request);
  
  // Check if cached response is still fresh
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date') || 0);
    const now = new Date();
    const age = now.getTime() - cachedDate.getTime();
    
    let maxAge = CACHE_EXPIRATION.HTML; // default
    if (isAsset) maxAge = CACHE_EXPIRATION.CSS_JS;
    if (isFeedData) maxAge = CACHE_EXPIRATION.FEEDS;
    if (request.destination === 'image') maxAge = CACHE_EXPIRATION.IMAGES;
    
    // If cache is fresh, return it (except for critical HTML pages)
    if (age < maxAge && !isHTML) {
      return cachedResponse;
    }
  }
  
  // Try network first
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      // Clone response and add timestamp
      const responseToCache = networkResponse.clone();
      
      // Add cache timestamp header
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      // Cache the response
      const cacheName = isHTML || isFeedData ? STATIC_CACHE_NAME : DYNAMIC_CACHE_NAME;
      const cache = await caches.open(cacheName);
      await cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, return cached version if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For HTML requests, return the homepage as fallback
    if (isHTML) {
      const homeCache = await caches.match('/');
      if (homeCache) return homeCache;
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Clean up expired cache entries
      cleanupExpiredCache()
    );
  }
});

// Cleanup expired cache entries
async function cleanupExpiredCache() {
  console.log('Service Worker: Starting cache cleanup');
  
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    // Remove old cache versions
    if (cacheName.includes('markets-feeds') && !cacheName.includes(CACHE_VERSION)) {
      console.log('Service Worker: Deleting old cache version:', cacheName);
      await caches.delete(cacheName);
      continue;
    }
    
    // Clean expired entries from current caches
    if (cacheName === STATIC_CACHE_NAME || cacheName === DYNAMIC_CACHE_NAME) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const cachedDate = new Date(response.headers.get('sw-cached-date') || 0);
          const age = Date.now() - cachedDate.getTime();
          
          // Remove if older than 24 hours (safety cleanup)
          if (age > 24 * 60 * 60 * 1000) {
            console.log('Service Worker: Removing expired cache entry:', request.url);
            await cache.delete(request);
          }
        }
      }
    }
  }
  
  console.log('Service Worker: Cache cleanup completed');
}

// Periodic cache cleanup (every hour)
setInterval(() => {
  cleanupExpiredCache();
}, 60 * 60 * 1000);

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New financial news available',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'markets-feeds-notification',
      data: {
        url: data.url || '/'
      },
      actions: [
        {
          action: 'view',
          title: 'View Article'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Markets Feeds', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Helper function to determine if resource should be cached dynamically
function shouldCacheDynamically(url) {
  return DYNAMIC_ASSETS.some(asset => url.includes(asset)) ||
         url.includes('/src/content/links/') ||
         url.includes('.css') ||
         url.includes('.js');
}