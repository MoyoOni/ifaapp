/**
 * Service Worker for Ilé Àṣẹ
 * Provides offline support and caching for low-bandwidth scenarios
 */

const CACHE_NAME = 'ile-ase-v1';
const STATIC_CACHE = 'ile-ase-static-v1';
const API_CACHE = 'ile-ase-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (payment gateways, etc.)
  if (!url.origin.includes(self.location.origin) && !url.pathname.startsWith('/api')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache API responses (with TTL consideration)
          if (url.pathname.startsWith('/api')) {
            caches.open(API_CACHE).then((cache) => {
              // Only cache GET requests and specific endpoints
              const cacheableEndpoints = [
                '/api/users/',
                '/api/temples',
                '/api/babalawos',
                '/api/appointments',
              ];
              
              const shouldCache = cacheableEndpoints.some((endpoint) =>
                url.pathname.includes(endpoint)
              );

              if (shouldCache) {
                cache.put(request, responseToCache);
              }
            });
          } else {
            // Cache static assets
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // If network fails and no cache, return offline page
          if (request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
    })
  );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      })
    );
  }
});
