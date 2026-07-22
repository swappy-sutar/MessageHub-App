import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../utils/axios";
import Cookies from "js-cookie";
import { useAuthStore } from "./useAuthStore";
import CryptoJS from "crypto-js";
import { ringtone } from "../utils/ringtone";
import { pushNotifications } from "../utils/pushNotifications";

const secretKey = import.meta.env.VITE_API_ENCRYPTION_KEY;

const decryptMessageText = (ciphertext) => {
  if (!ciphertext) return "";
  if (!secretKey) return ciphertext;

  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedText || ciphertext;
  } catch (error) {
    return ciphertext;
  }
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUserLoading: false,
  isMessagesLoading: false,
  unreadCounts: {},
  replyingTo: null,
  typingUsers: {}, // { [userIdString]: boolean }
  isContactInfoOpen: false,
  isSearchOpen: false,

  setSearchOpen: (isOpen) =>
    set({ isSearchOpen: isOpen, isContactInfoOpen: isOpen ? false : get().isContactInfoOpen }),

  toggleSearch: () =>
    set((state) => ({
      isSearchOpen: !state.isSearchOpen,
      isContactInfoOpen: !state.isSearchOpen ? false : state.isContactInfoOpen,
    })),

  setContactInfoOpen: (isOpen) =>
    set({ isContactInfoOpen: isOpen, isSearchOpen: isOpen ? false : get().isSearchOpen }),

  toggleContactInfo: () =>
    set((state) => ({
      isContactInfoOpen: !state.isContactInfoOpen,
      isSearchOpen: !state.isContactInfoOpen ? false : state.isSearchOpen,
    })),

  setReplyingTo: (message) => set({ replyingTo: message }),

  getUsers: async () => {
    set({ isUserLoading: true });
    try {
      const token = Cookies.get("token");
      const response = await axiosInstance.get("/messages/users", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ users: response.data.data, isUserLoading: false });
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      set({ isUserLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const token = Cookies.get("token");
      const response = await axiosInstance.get(`/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const encryptedMessages = response.data?.data || [];

      const decryptedMessages = encryptedMessages.map((msg) => ({
        ...msg,
        text: decryptMessageText(msg.text),
      }));

      set({ messages: decryptedMessages });

      const socket = useAuthStore.getState().socket;
      if (socket && socket.connected) {
        socket.emit("markMessagesRead", { senderId: userId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
      console.error("Error fetching messages:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  setSelectedUser: (selectedUser) => {
    set({
      selectedUser,
      replyingTo: null,
      isContactInfoOpen: false,
      isSearchOpen: false,
    });
    if (selectedUser?._id) {
      const uId = String(selectedUser._id);
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [uId]: 0,
        },
      }));

      const socket = useAuthStore.getState().socket;
      if (socket && socket.connected) {
        socket.emit("markMessagesRead", { senderId: selectedUser._id });
      }
    }
  },

  sendMessage: async (formData) => {
    const token = Cookies.get("token");
    const { selectedUser, messages, users, replyingTo } = get();

    if (replyingTo) {
      const authUser = useAuthStore.getState().authUser;
      const senderName = authUser?.data?.firstName || authUser?.firstName || "You";
      
      const replyPayload = {
        messageId: replyingTo._id,
        text: replyingTo.text || "",
        image: replyingTo.image || "",
        senderName: senderName,
      };

      formData.append("replyTo", JSON.stringify(replyPayload));
    }

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      const newMsg = res.data.data;
      newMsg.text = decryptMessageText(newMsg.text);

      const updatedUsers = users.map((u) =>
        String(u._id) === String(selectedUser._id)
          ? {
              ...u,
              lastMessageText: newMsg.text || "📷 Photo",
              lastMessageTime: newMsg.createdAt,
            }
          : u
      );

      set({
        messages: [...messages, newMsg],
        users: updatedUsers,
        replyingTo: null,
      });

      ringtone.playSentMessageTone();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      throw error;
    }
  },

  forwardMessage: async (messageToForward, targetUserId) => {
    const token = Cookies.get("token");
    const formData = new FormData();

    if (messageToForward.text) {
      formData.append("text", messageToForward.text);
    }
    if (messageToForward.image) {
      formData.append("image", messageToForward.image);
    }
    formData.append("isForwarded", "true");

    try {
      const res = await axiosInstance.post(
        `/messages/send/${targetUserId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      const newMsg = res.data.data;
      newMsg.text = decryptMessageText(newMsg.text);

      const selectedUser = get().selectedUser;
      if (selectedUser && String(selectedUser._id) === String(targetUserId)) {
        set({ messages: [...get().messages, newMsg] });
      }

      ringtone.playSentMessageTone();
      return newMsg;
    } catch (error) {
      console.error("Error forwarding message:", error);
      throw error;
    }
  },

  deleteMessage: async (messageId, deleteType) => {
    const token = Cookies.get("token");
    try {
      const res = await axiosInstance.delete(`/messages/delete/${messageId}`, {
        data: { deleteType },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (deleteType === "everyone") {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId
              ? { ...m, text: "", image: "", deletedForEveryone: true }
              : m
          ),
        }));
      } else {
        set((state) => ({
          messages: state.messages.filter((m) => m._id !== messageId),
        }));
      }

      return res.data;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messagesRead");
    socket.off("messageDeletedForEveryone");
    socket.off("userTyping");
    socket.off("userStoppedTyping");

    socket.on("newMessage", (newMessage) => {
      const currentSelectedUser = get().selectedUser;
      const senderId = String(newMessage.senderId);

      const decryptedMsg = {
        ...newMessage,
        text: decryptMessageText(newMessage.text),
      };

      const msgPreview = decryptedMsg.text || "📷 Photo";
      const msgTime = decryptedMsg.createdAt;

      const updatedUsers = get().users.map((u) =>
        String(u._id) === senderId
          ? {
              ...u,
              lastMessageText: msgPreview,
              lastMessageTime: msgTime,
            }
          : u
      );

      set({ users: updatedUsers });

      // Play audio chime
      ringtone.playIncomingMessageTone();

      const senderUser = get().users.find((u) => String(u._id) === senderId);
      const senderName = senderUser ? `${senderUser.firstName} ${senderUser.lastName}` : "Someone";
      const senderAvatar = senderUser?.profilePic || "/avatar.png";

      // Dispatch Native PC Desktop Push Notification if document is hidden or user is not focused on this chat
      if (document.hidden || !document.hasFocus() || String(currentSelectedUser?._id) !== senderId) {
        pushNotifications.sendDesktopNotification({
          title: `💬 Message from ${senderName}`,
          body: decryptedMsg.text || "Sent a photo attachment 📷",
          icon: senderAvatar,
          tag: `msg-${senderId}`,
          onClick: () => {
            if (senderUser) get().setSelectedUser(senderUser);
          },
        });
      }

      if (currentSelectedUser && String(currentSelectedUser._id) === senderId) {
        set({
          messages: [...get().messages, decryptedMsg],
        });

        socket.emit("markMessagesRead", { senderId: senderId });
      } else {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [senderId]: (state.unreadCounts[senderId] || 0) + 1,
          },
        }));

        toast(`💬 ${senderName}: ${decryptedMsg.text || "Sent an attachment"}`, {
          duration: 4000,
          icon: "💬",
        });
      }
    });

    socket.on("messagesRead", ({ byUserId }) => {
      const currentSelectedUser = get().selectedUser;
      if (currentSelectedUser && String(currentSelectedUser._id) === String(byUserId)) {
        set((state) => ({
          messages: state.messages.map((m) => ({
            ...m,
            isRead: true,
            isDelivered: true,
          })),
        }));
      }
    });

    socket.on("messageDeletedForEveryone", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId
            ? { ...m, text: "", image: "", deletedForEveryone: true }
            : m
        ),
      }));
    });

    socket.on("userTyping", ({ from }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [String(from)]: true },
      }));
    });

    socket.on("userStoppedTyping", ({ from }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [String(from)]: false },
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("messagesRead");
      socket.off("messageDeletedForEveryone");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    }
  },
}));
