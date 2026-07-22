import { create } from "zustand";
import { axiosInstance } from "../utils/axios.js";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import { useCallStore } from "./useCallStore.js";
import { useChatStore } from "./useChatStore.js";
import { pushNotifications } from "../utils/pushNotifications.js";

const BASE_URL =
  import.meta.env.VITE_API_BACKEND_URL || "http://localhost:3000";

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

      Cookies.set("token", response.data.token, { expires: 2, secure: true });

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

      if (response.data.token) {
        Cookies.set("token", response.data.token, { expires: 2, secure: true });
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
      const token = Cookies.get("token");

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
      const token = Cookies.get("token");

      if (!token) {
        toast.error("You are not logged in.");
        return;
      }
      await axiosInstance.post("/auth/logout");
      toast.success("Logged out successfully!");
      get().disconnectSocket();
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error(
        error.response?.data?.message || "Error logging out. Please try again."
      );
    } finally {
      set({ authUser: null, isLoading: false });
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
