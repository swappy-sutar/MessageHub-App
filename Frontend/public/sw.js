const CACHE_NAME = "messagehub-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/logo/messagehub-favicon.png",
  "/favicon.svg"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Cache-first for static, network-first fallback)
self.addEventListener("fetch", (e) => {
  // Skip WebSocket, API, Cloudinary, and non-GET requests from cache
  if (
    e.request.method !== "GET" ||
    e.request.url.includes("/api/") ||
    e.request.url.includes("socket.io") ||
    e.request.url.startsWith("chrome-extension:")
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh in background to update cache
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
