import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../utils/axios";
import Cookies from "js-cookie";

export const useGroupStore = create((set, get) => ({
  groups: [],
  activeGroup: null,
  isGroupLoading: false,

  getUserGroups: async () => {
    set({ isGroupLoading: true });
    try {
      const res = await axiosInstance.get("/groups/my-groups");
      set({ groups: res.data.data || [], isGroupLoading: false });
      return res.data.data;
    } catch (error) {
      set({ isGroupLoading: false });
      console.error("Error fetching user groups:", error);
    }
  },

  createGroup: async (groupData) => {
    set({ isGroupLoading: true });
    try {
      const token = Cookies.get("token");
      const res = await axiosInstance.post("/groups/create", groupData, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const newGroup = res.data.data.group;
      set((state) => ({
        groups: [newGroup, ...state.groups],
        isGroupLoading: false,
      }));

      toast.success(`Group "${newGroup.name}" created! 🎉`);
      return res.data.data;
    } catch (error) {
      set({ isGroupLoading: false });
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  getGroupDetails: async (groupId) => {
    set({ isGroupLoading: true });
    try {
      const token = Cookies.get("token");
      const res = await axiosInstance.get(`/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      set({ activeGroup: res.data.data.group, isGroupLoading: false });
      return res.data.data;
    } catch (error) {
      set({ isGroupLoading: false });
      console.error("Error fetching group details:", error);
    }
  },

  addMembers: async (groupId, memberIds) => {
    try {
      const token = Cookies.get("token");
      const res = await axiosInstance.post(
        `/groups/${groupId}/members`,
        { memberIds },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      toast.success("Members added to group");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add members");
      throw error;
    }
  },

  removeMember: async (groupId, memberId) => {
    try {
      const token = Cookies.get("token");
      const res = await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      toast.success("Member removed");
      return res.data;
    } catch (error) {
      toast.error("Failed to remove member");
      throw error;
    }
  },

  promoteAdmin: async (groupId, memberId) => {
    try {
      const token = Cookies.get("token");
      const res = await axiosInstance.post(
        `/groups/${groupId}/promote`,
        { memberId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      toast.success("Member promoted to admin 👑");
      return res.data;
    } catch (error) {
      toast.error("Failed to promote admin");
      throw error;
    }
  },
}));
