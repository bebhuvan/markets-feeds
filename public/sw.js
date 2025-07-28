// Service Worker for Markets Feeds PWA
const CACHE_NAME = 'markets-feeds-v2';
const STATIC_CACHE_NAME = 'markets-feeds-static-v2';
const DYNAMIC_CACHE_NAME = 'markets-feeds-dynamic-v2';

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

// Fetch event - network first for navigation, cache first for assets
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
  
  // Network-first strategy for HTML documents (navigation)
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Clone and cache the response
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
          return networkResponse;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then(cachedResponse => {
              return cachedResponse || caches.match('/');
            });
        })
    );
    return;
  }
  
  // Cache-first strategy for other assets
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();
            
            if (shouldCacheDynamically(request.url)) {
              caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
            }
            
            return networkResponse;
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background tasks here
      console.log('Service Worker: Performing background sync')
    );
  }
});

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