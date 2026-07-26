// Native PC Desktop & Browser Push Notification Utility Manager for MessageHub

class PushNotificationManager {
  constructor() {
    this.permission = typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied";
  }

  // Request native OS desktop notification permission
  async requestPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("⚠ Desktop Notifications are not supported by this browser.");
      return "denied";
    }

    if (Notification.permission === "default") {
      try {
        const res = await Notification.requestPermission();
        this.permission = res;
        return res;
      } catch (err) {
        console.error("Error requesting notification permission:", err);
      }
    }
    this.permission = Notification.permission;
    return Notification.permission;
  }

  // Send native PC desktop/mobile notification for incoming messages
  async sendDesktopNotification({ title, body, icon, tag, onClick }) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (this.permission !== "granted" && Notification.permission !== "granted") return;

    // Helper to resolve absolute URLs for avatars so the OS notification shade can fetch them
    const resolveAbsoluteUrl = (path) => {
      if (!path) return window.location.origin + "/avatar.png";
      if (path.startsWith("http://") || path.startsWith("https://")) return path;
      return window.location.origin + (path.startsWith("/") ? path : "/" + path);
    };

    const absoluteIconUrl = resolveAbsoluteUrl(icon);
    const backendUrl = import.meta.env.VITE_API_BACKEND_URL || "http://localhost:3000";

    try {
      // Display notification via Service Worker (compulsory for mobile, best practice for desktop PWA)
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          const options = {
            body: body || "You received a new message on MessageHub",
            icon: absoluteIconUrl,
            badge: window.location.origin + "/favicon.ico",
            tag: tag || `msg-${Date.now()}`,
            renotify: true,
            vibrate: [200, 100, 200], // vibration feedback
            actions: [
              {
                action: "reply",
                title: "Reply",
                type: "text", // Native inline direct text reply!
                placeholder: "Type a message..."
              },
              { action: "mark_read", title: "Mark as read" }
            ],
            data: {
              onClickUrl: window.location.origin,
              backendUrl: backendUrl.replace(/\/$/, ""), // Strip trailing slash
              tag: tag
            }
          };

          await registration.showNotification(title || "MessageHub", options);
          return;
        }
      }

      // Legacy fallback for window context constructor
      const notif = new Notification(title || "MessageHub", {
        body: body || "You received a new message on MessageHub",
        icon: absoluteIconUrl,
        badge: absoluteIconUrl,
        tag: tag || `msg-${Date.now()}`,
        renotify: true,
      });

      notif.onclick = () => {
        try {
          window.focus();
        } catch (e) {}
        if (onClick) onClick();
        notif.close();
      };
    } catch (e) {
      console.warn("Desktop Notification dispatch error:", e);
    }
  }

  // Send native PC desktop/mobile notification for incoming WebRTC calls
  sendCallNotification({ callerName, callType, onClick }) {
    const isVideo = callType === "video";
    const title = isVideo ? `📹 Incoming Video Call` : `📞 Incoming Voice Call`;
    const body = `${callerName || "Someone"} is calling you on MessageHub...`;

    this.sendDesktopNotification({
      title,
      body,
      tag: `call-${Date.now()}`,
      onClick,
    });
  }
}

export const pushNotifications = new PushNotificationManager();
