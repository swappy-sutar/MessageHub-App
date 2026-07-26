import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerStyle={{ top: 24 }}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "16px",
            background: "var(--fallback-b1,oklch(var(--b1)/1))",
            color: "var(--fallback-bc,oklch(var(--bc)/1))",
            border: "1px solid rgba(128, 128, 128, 0.2)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            fontSize: "13px",
            fontWeight: "600",
            padding: "10px 16px",
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);

// Register Service Worker for PWA Standalone Support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
      .catch((err) => console.error("PWA Service Worker registration failed:", err));
  });

  // Handle actions received from Service Worker notifications (e.g. Mark as Read)
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (!event.data) return;

    if (event.data.type === "MARK_READ") {
      const contactId = event.data.tag?.replace("msg-", "");
      if (contactId) {
        Promise.all([
          import("./store/useChatStore.js"),
          import("./store/useAuthStore.js")
        ]).then(([{ useChatStore }, { useAuthStore }]) => {
          const socket = useAuthStore.getState().socket;
          if (socket) {
            socket.emit("markMessagesRead", { senderId: contactId });
          }
          useChatStore.setState((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [contactId]: 0
            }
          }));
        }).catch((err) => console.error("Failed to load stores for SW action:", err));
      }
    }

    if (event.data.type === "REPLY_SENT") {
      const { receiverId, message } = event.data;
      import("./store/useChatStore.js").then(({ useChatStore }) => {
        const currentSelectedUser = useChatStore.getState().selectedUser;
        if (currentSelectedUser && String(currentSelectedUser._id) === String(receiverId)) {
          useChatStore.setState((state) => {
            const nextById = { ...state.messagesById, [message._id]: message };
            const nextIds = state.messageIds.includes(message._id)
              ? state.messageIds
              : [...state.messageIds, message._id];
            return {
              messagesById: nextById,
              messageIds: nextIds,
              messages: Object.values(nextById)
            };
          });
        }
      }).catch((err) => console.error("Failed to load store for SW REPLY_SENT:", err));
    }
  });
}



