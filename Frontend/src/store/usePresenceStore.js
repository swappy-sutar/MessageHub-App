import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

let heartbeatInterval = null;

export const usePresenceStore = create((set, get) => ({
  onlineUsers: [],
  lastSeenMap: {},
  isInvisible: false,

  setInvisible: (isInvisible) => {
    set({ isInvisible });
    const socket = useAuthStore.getState().socket;
    if (socket && socket.connected) {
      socket.emit("setInvisible", { isInvisible });
    }
  },

  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),

  setLastSeen: (userId, lastSeen) =>
    set((state) => ({
      lastSeenMap: { ...state.lastSeenMap, [userId]: lastSeen },
    })),

  initPresence: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("getOnlineUsers");
    socket.off("userLastSeen");

    socket.on("getOnlineUsers", (users) => {
      set({ onlineUsers: users });
    });

    socket.on("userLastSeen", ({ userId, lastSeen }) => {
      set((state) => ({
        lastSeenMap: { ...state.lastSeenMap, [userId]: lastSeen },
      }));
    });

    // Start 25s Heartbeat Loop
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
      const activeSocket = useAuthStore.getState().socket;
      if (activeSocket && activeSocket.connected) {
        activeSocket.emit("heartbeat");
      }
    }, 25000);
  },

  cleanupPresence: () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("getOnlineUsers");
      socket.off("userLastSeen");
    }
  },
}));
