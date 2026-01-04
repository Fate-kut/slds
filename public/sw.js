/**
 * Service Worker for SLDS Offline Learning Materials
 * Handles caching and offline access for learning materials
 */

const CACHE_NAME = 'slds-learning-materials-v1';
const STATIC_CACHE = 'slds-static-v1';

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/index.html',
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle learning materials requests
  if (url.pathname.includes('learning-materials') || url.pathname.includes('/storage/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', url.pathname);
          return cachedResponse;
        }
        
        return fetch(event.request).then((networkResponse) => {
          // Clone the response to cache it
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          console.log('[SW] Network failed, no cache available for:', url.pathname);
          return new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
    );
    return;
  }
  
  // For other requests, try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request))
  );
});

// Message handler for cache operations
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_MATERIAL') {
    const { url, id } = event.data;
    caches.open(CACHE_NAME).then((cache) => {
      fetch(url).then((response) => {
        if (response.ok) {
          cache.put(url, response.clone());
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'MATERIAL_CACHED',
                id,
                success: true
              });
            });
          });
        }
      }).catch((error) => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'MATERIAL_CACHED',
              id,
              success: false,
              error: error.message
            });
          });
        });
      });
    });
  }
  
  if (event.data.type === 'REMOVE_CACHED_MATERIAL') {
    const { url } = event.data;
    caches.open(CACHE_NAME).then((cache) => {
      cache.delete(url);
    });
  }
});
