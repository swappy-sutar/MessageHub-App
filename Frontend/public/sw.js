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

// Native Notification Click Handler with Action Button dispatchers
self.addEventListener("notificationclick", (e) => {
  const notification = e.notification;
  const action = e.action;

  notification.close();

  // Handle WhatsApp action buttons
  if (action === "reply") {
    e.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow("/");
      })
    );
  } else if (action === "mark_read") {
    e.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "MARK_READ", tag: notification.tag });
        });
      })
    );
  } else if (action === "mute") {
    e.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "MUTE_USER", tag: notification.tag });
        });
      })
    );
  } else {
    // Standard tap on notification body -> Open or Focus app window
    e.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow("/");
      })
    );
  }
});
