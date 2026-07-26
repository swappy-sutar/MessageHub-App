// production PWA service worker - Network-Only/Pass-Through Strategy
// This satisfies the PWA installability requirements while avoiding the classic
// Vite cache-invalidation bug (where old JS chunk references cause blank screens).

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Delete all old caches to resolve black screen asset mismatch
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// A simple pass-through fetch handler is sufficient for PWA installability
// and guarantees the browser always loads the latest compiled assets.
self.addEventListener("fetch", (e) => {
  // Let the browser handle the request normally from the network
  return;
});
