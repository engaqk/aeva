const CACHE_NAME = "aeva-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icon.png",
  "/icon-192.png",
  "/icon-512.png",
];

// Install Event - cache core shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale-While-Revalidate caching pattern
self.addEventListener("fetch", (event) => {
  // Only handle standard local GET requests
  if (
    event.request.method !== "GET" || 
    !event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes("/api/") // Do not cache API routes
  ) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore background fetch errors (e.g. when offline)
          });
        
        return cachedResponse;
      }
      
      return fetch(event.request).then((networkResponse) => {
        if (
          !networkResponse || 
          networkResponse.status !== 200 || 
          networkResponse.type !== "basic"
        ) {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      });
    })
  );
});
