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

  // Send native PC desktop notification for incoming messages
  sendDesktopNotification({ title, body, icon, tag, onClick }) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (this.permission !== "granted" && Notification.permission !== "granted") return;

    try {
      const notif = new Notification(title || "💬 New Message", {
        body: body || "You received a new message on MessageHub",
        icon: icon || "/avatar.png",
        badge: "/avatar.png",
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

  // Send native PC desktop notification for incoming WebRTC calls
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
