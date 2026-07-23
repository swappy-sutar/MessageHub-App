import { create } from "zustand";
import { axiosInstance } from "../utils/axios.js";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import { useCallStore } from "./useCallStore.js";
import { useChatStore } from "./useChatStore.js";
import { pushNotifications } from "../utils/pushNotifications.js";

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_BACKEND_URL;
  if (envUrl && envUrl.trim() && !envUrl.includes("undefined")) {
    return envUrl;
  }

  // Fallback to live Render backend when deployed on Vercel or custom domains
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://messagehub-i52c.onrender.com";
  }

  return "http://localhost:3000";
};

const BASE_URL = getBackendUrl();

const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isLoading: false,
  isCheckingAuth: true,
  isUpdateProfile: false,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const token = Cookies.get("token");

      const response = await axiosInstance.get("/auth/check-auth", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      set({ authUser: response.data });
      get().connectSocket();
      pushNotifications.requestPermission();
    } catch (error) {
      console.error("Error checking CheckAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const response = await axiosInstance.post("/auth/signup", data);
      set({ authUser: response.data });
      toast.success("Account created successfully!");
      get().connectSocket();
      pushNotifications.requestPermission();
    } catch (error) {
      console.error("Error signing up:", error);
      toast.error(
        error.response?.data?.message || "Error signing up. Please try again."
      );
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });

    const loadingToastId = toast.loading("Logging in...");

    try {
      const response = await axiosInstance.post("/auth/login", data);
      set({ authUser: response.data });

      if (response.data.token || response.data.accessToken) {
        Cookies.set("token", response.data.token || response.data.accessToken, { expires: 1, secure: true });
      }
      if (response.data.refreshToken) {
        Cookies.set("refreshToken", response.data.refreshToken, { expires: 7, secure: true });
      }

      toast.success("Logged in successfully!", { id: loadingToastId });

      get().connectSocket();
      pushNotifications.requestPermission();
    } catch (error) {
      console.error("Error logging in:", error);
      toast.error(
        error.response?.data?.message || "Error logging in. Please try again.",
        { id: loadingToastId }
      );
    } finally {
      set({ isLoggingIn: false });
    }
  },

  googleLogin: async (googleData) => {
    set({ isLoggingIn: true });
    const loadingToastId = toast.loading("Connecting Google OAuth...");

    try {
      const response = await axiosInstance.post("/auth/google", googleData);
      set({ authUser: response.data });

      if (response.data.token || response.data.accessToken) {
        Cookies.set("token", response.data.token || response.data.accessToken, { expires: 1, secure: true });
      }
      if (response.data.refreshToken) {
        Cookies.set("refreshToken", response.data.refreshToken, { expires: 7, secure: true });
      }

      toast.success("Signed in with Google!", { id: loadingToastId });
      get().connectSocket();
      pushNotifications.requestPermission();
    } catch (error) {
      console.error("Error with Google OAuth:", error);
      toast.error(
        error.response?.data?.message || "Google sign in failed. Please try again.",
        { id: loadingToastId }
      );
    } finally {
      set({ isLoggingIn: false });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdateProfile: true });

    const loadingToastId = toast.loading("Updating profile...");

    try {
      const token = Cookies.get("token") || Cookies.get("accessToken");

      if (!token) {
        toast.error("Authentication token not found.");
        return;
      }

      const response = await axiosInstance.put("/auth/update-profile", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      set({ authUser: response.data });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error.response?.data?.message ||
          "Error updating profile. Please try again."
      );
    } finally {
      set({ isUpdateProfile: false });
      toast.dismiss(loadingToastId);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await axiosInstance.post("/auth/logout");
      toast.success("Logged out from this device!");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      Cookies.remove("token");
      Cookies.remove("refreshToken");
      get().disconnectSocket();
      set({ authUser: null, isLoading: false });
    }
  },

  logoutAllDevices: async () => {
    set({ isLoading: true });
    try {
      await axiosInstance.post("/auth/logout-all");
      toast.success("Logged out from all devices!");
    } catch (error) {
      console.error("Error logging out all devices:", error);
      toast.error(error.response?.data?.message || "Failed to logout from all devices.");
    } finally {
      Cookies.remove("token");
      Cookies.remove("refreshToken");
      get().disconnectSocket();
      set({ authUser: null, isLoading: false });
    }
  },

  handleSessionExpired: () => {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    get().disconnectSocket();
    set({ authUser: null });
    toast.error("Session expired. Please log in again.", { id: "session-expired-toast" });
  },

  getActiveSessions: async () => {
    try {
      const response = await axiosInstance.get("/auth/sessions");
      return response.data?.sessions || [];
    } catch (error) {
      console.error("Error getting active sessions:", error);
      return [];
    }
  },

  connectSocket: () => {
    const { authUser, socket: existingSocket } = get();

    if (!authUser) return;
    if (existingSocket?.connected) return;

    const userId = authUser?.data?._id || authUser?._id;
    if (!userId) return;

    const targetUrl = BASE_URL.replace(/\/+$/, "");

    const socket = io(targetUrl, {
      withCredentials: true,
      auth: {
        userId: userId,
      },
    });

    socket.connect();

    socket.on("connect", () => {
      useCallStore.getState().initCallListeners();
      useChatStore.getState().subscribeToMessages();
    });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));

export { useAuthStore };
