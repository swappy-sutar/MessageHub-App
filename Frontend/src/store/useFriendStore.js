import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../utils/axios";
import Cookies from "js-cookie";
import { useChatStore } from "./useChatStore";
import { useAuthStore } from "./useAuthStore";

export const useFriendStore = create((set, get) => ({
  receivedInvites: [],
  sentInvites: [],
  searchResults: [],
  isSearching: false,
  isInvitesLoading: false,

  // Fetch pending invites
  getInvites: async () => {
    set({ isInvitesLoading: true });
    try {
      const token = Cookies.get("token");
      const res = await axiosInstance.get("/friends/invites", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      set({
        receivedInvites: res.data?.data?.receivedInvites || [],
        sentInvites: res.data?.data?.sentInvites || [],
      });
    } catch (err) {
      console.error("Error fetching invites:", err);
    } finally {
      set({ isInvitesLoading: false });
    }
  },

  // Search users to invite
  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isSearching: true });
    try {
      const token = Cookies.get("token");
      const res = await axiosInstance.post(
        "/friends/search",
        { query },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      set({ searchResults: res.data?.data || [] });
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      set({ isSearching: false });
    }
  },

  // Send friend invite by Unique Invite Code or User ID
  sendInviteByCode: async (inviteCode) => {
    if (!inviteCode?.trim()) {
      return toast.error("Please enter a valid invite code or User ID");
    }
    try {
      const token = Cookies.get("token");
      const res = await axiosInstance.post(
        "/friends/invite-code",
        { inviteCode },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success(res.data.message || "Invite sent!");
      get().getInvites();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invite");
    }
  },

  // Send friend invitation by User ID
  sendInvite: async (targetUserId) => {
    try {
      const token = Cookies.get("token");
      const res = await axiosInstance.post(
        "/friends/invite",
        { targetUserId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success(res.data.message || "Invite sent!");
      get().getInvites();
      set((state) => ({
        searchResults: state.searchResults.filter((u) => u._id !== targetUserId),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invite");
    }
  },

  // Accept friend invitation
  acceptInvite: async (senderUserId) => {
    try {
      const token = Cookies.get("token");
      const res = await axiosInstance.post(
        "/friends/accept",
        { senderUserId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success("Invite accepted! Contact added.");
      get().getInvites();
      useChatStore.getState().getUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept invite");
    }
  },

  // Decline friend invitation
  rejectInvite: async (senderUserId) => {
    try {
      const token = Cookies.get("token");
      await axiosInstance.post(
        "/friends/reject",
        { senderUserId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast("Invite declined.");
      get().getInvites();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to decline invite");
    }
  },

  // Listen to real-time invite socket events
  initInviteListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newFriendInvite");
    socket.off("inviteAccepted");

    socket.on("newFriendInvite", ({ from }) => {
      toast(`🎉 ${from.firstName} sent you a friend invite!`, { duration: 4000 });
      get().getInvites();
    });

    socket.on("inviteAccepted", () => {
      toast.success("A friend accepted your invite!");
      useChatStore.getState().getUsers();
    });
  },
}));

export default useFriendStore;
