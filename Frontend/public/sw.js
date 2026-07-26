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
    const replyText = e.reply;
    const receiverId = notification.tag?.replace("msg-", "");
    const backendUrl = notification.data?.backendUrl;

    if (replyText && receiverId && backendUrl) {
      e.waitUntil(
        Promise.resolve().then(async () => {
          let headers = { "Content-Type": "application/json" };
          try {
            // Retrieve token from PWA Cookie Store to authenticate background fetch
            if (self.cookieStore) {
              const tokenObj = await self.cookieStore.get("token");
              if (tokenObj && tokenObj.value) {
                headers["Authorization"] = `Bearer ${tokenObj.value}`;
              }
            }
          } catch (cookieErr) {
            console.warn("Failed to read token from SW cookieStore:", cookieErr);
          }

          const res = await fetch(`${backendUrl}/api/v1/messages/send/${receiverId}`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ text: replyText }),
          });

          const resData = await res.json();
          console.log("Direct reply sent in background:", resData);

          // Tell all open client pages to append this sent message to their chat threads
          const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
          clients.forEach((client) => {
            client.postMessage({
              type: "REPLY_SENT",
              receiverId: receiverId,
              message: resData.data || { _id: `temp-${Date.now()}`, senderId: "", receiverId, text: replyText, createdAt: new Date() }
            });
          });
        }).catch((err) => {
          console.error("Direct reply background send failed:", err);
        })
      );
    } else {
      // Fallback if no text typed (just open/focus window)
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
