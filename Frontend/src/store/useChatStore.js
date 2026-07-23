import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../utils/axios";
import Cookies from "js-cookie";
import { useAuthStore } from "./useAuthStore";
import CryptoJS from "crypto-js";
import { ringtone } from "../utils/ringtone";
import { pushNotifications } from "../utils/pushNotifications";

const secretKey = import.meta.env.VITE_API_ENCRYPTION_KEY;

const LEGACY_KEYS = [
  secretKey,
  "messagehub_secret_encryption_key_2026",
  "secretKey",
];

const decryptMessageText = (ciphertext) => {
  if (!ciphertext) return "";
  if (typeof ciphertext !== "string") return ciphertext;
  if (!ciphertext.startsWith("U2FsdGVkX1")) {
    return ciphertext;
  }

  for (const key of LEGACY_KEYS) {
    if (!key) continue;
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedText) {
        return decryptedText;
      }
    } catch (error) {}
  }

  return ciphertext;
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUserLoading: false,
  isMessagesLoading: false,
  lastSeenSeqMap: {}, // { [conversationId]: number }

  syncDeltaMessages: async (conversationId) => {
    const lastSeq = get().lastSeenSeqMap[conversationId] || 0;
    const token = Cookies.get("token");
    try {
      const res = await axiosInstance.get(`/messages/sync?conversationId=${conversationId}&lastSequenceId=${lastSeq}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const newMsgs = (res.data.data || []).map((msg) => ({
        ...msg,
        text: decryptMessageText(msg.text),
      }));

      if (newMsgs.length > 0) {
        const maxSeq = Math.max(...newMsgs.map((m) => m.sequenceId || 0));
        set((state) => ({
          messages: [...state.messages, ...newMsgs],
          lastSeenSeqMap: { ...state.lastSeenSeqMap, [conversationId]: maxSeq },
        }));
      }
    } catch (error) {
      console.warn("Delta sync failed:", error);
    }
  },

  setSettingsOpen: (isOpen) =>
    set({ isSettingsOpen: isOpen, isSearchOpen: false, isContactInfoOpen: false }),

  toggleSettings: () =>
    set((state) => ({
      isSettingsOpen: !state.isSettingsOpen,
      isSearchOpen: false,
      isContactInfoOpen: false,
    })),

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
  setEditingMessage: (message) => set({ editingMessage: message }),

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
      get().getPinnedMessages(userId);

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
      editingMessage: null,
      searchResults: [],
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
        video: replyingTo.video || "",
        documentName: replyingTo.document?.name || "",
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

      let msgPreview = newMsg.text;
      if (!msgPreview) {
        if (newMsg.image) msgPreview = "📷 Photo";
        else if (newMsg.video) msgPreview = "🎥 Video";
        else if (newMsg.document) msgPreview = `📄 ${newMsg.document.name || "Document"}`;
      }

      const updatedUsers = users.map((u) =>
        String(u._id) === String(selectedUser._id)
          ? {
              ...u,
              lastMessageText: msgPreview,
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

  editMessage: async (messageId, newText) => {
    const token = Cookies.get("token");
    try {
      const res = await axiosInstance.put(
        `/messages/edit/${messageId}`,
        { text: newText },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId
            ? { ...m, text: newText, isEdited: true, editedAt: new Date() }
            : m
        ),
        editingMessage: null,
      }));

      toast.success("Message edited");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
      throw error;
    }
  },

  addReaction: async (messageId, emoji) => {
    const token = Cookies.get("token");
    try {
      const res = await axiosInstance.post(
        `/messages/reaction/${messageId}`,
        { emoji },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, reactions: res.data.data } : m
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add reaction");
    }
  },

  pinMessage: async (messageId) => {
    const token = Cookies.get("token");
    try {
      const res = await axiosInstance.post(
        `/messages/pin/${messageId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      const updatedMsg = res.data.data;
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId
            ? { ...m, pinnedAt: updatedMsg.pinnedAt, pinnedBy: updatedMsg.pinnedBy }
            : m
        ),
      }));

      const selectedUser = get().selectedUser;
      if (selectedUser) get().getPinnedMessages(selectedUser._id);

      toast.success(updatedMsg.pinnedAt ? "Message pinned 📌" : "Message unpinned");
    } catch (error) {
      toast.error("Failed to pin/unpin message");
    }
  },

  getPinnedMessages: async (userId) => {
    const token = Cookies.get("token");
    try {
      const res = await axiosInstance.get(`/messages/pinned/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const decrypted = (res.data.data || []).map((m) => ({
        ...m,
        text: decryptMessageText(m.text),
      }));

      set({ pinnedMessages: decrypted });
    } catch (error) {
      console.error("Error fetching pinned messages:", error);
    }
  },

  searchMessages: async (query) => {
    const selectedUser = get().selectedUser;
    if (!selectedUser || !query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }

    set({ isSearching: true });
    const token = Cookies.get("token");
    try {
      const res = await axiosInstance.get(`/messages/search/${selectedUser._id}?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const decrypted = (res.data.data || []).map((m) => ({
        ...m,
        text: decryptMessageText(m.text),
      }));

      set({ searchResults: decrypted, isSearching: false });
    } catch (error) {
      set({ isSearching: false });
      toast.error("Search failed");
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
              ? { ...m, text: "", image: "", video: "", document: null, deletedForEveryone: true }
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
    socket.off("messagesDelivered");
    socket.off("messageEdited");
    socket.off("reactionUpdated");
    socket.off("messagePinned");
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

      let msgPreview = decryptedMsg.text;
      if (!msgPreview) {
        if (decryptedMsg.image) msgPreview = "📷 Photo";
        else if (decryptedMsg.video) msgPreview = "🎥 Video";
        else if (decryptedMsg.document) msgPreview = `📄 ${decryptedMsg.document.name || "Document"}`;
      }

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

      ringtone.playIncomingMessageTone();

      const senderUser = get().users.find((u) => String(u._id) === senderId);
      const senderName = senderUser ? `${senderUser.firstName} ${senderUser.lastName}` : "Someone";
      const senderAvatar = senderUser?.profilePic || "/avatar.png";

      if (document.hidden || !document.hasFocus() || String(currentSelectedUser?._id) !== senderId) {
        pushNotifications.sendDesktopNotification({
          title: `💬 Message from ${senderName}`,
          body: msgPreview || "Sent an attachment",
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

        toast(`${senderName}: ${msgPreview}`, {
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
            status: "read",
          })),
        }));
      }
    });

    socket.on("messagesDelivered", ({ toUserId }) => {
      const currentSelectedUser = get().selectedUser;
      if (currentSelectedUser && String(currentSelectedUser._id) === String(toUserId)) {
        set((state) => ({
          messages: state.messages.map((m) => ({
            ...m,
            isDelivered: true,
            status: m.isRead ? "read" : "delivered",
          })),
        }));
      }
    });

    socket.on("messageEdited", ({ messageId, text }) => {
      const decrypted = decryptMessageText(text);
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, text: decrypted, isEdited: true } : m
        ),
      }));
    });

    socket.on("reactionUpdated", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, reactions } : m
        ),
      }));
    });

    socket.on("messagePinned", ({ messageId, pinnedAt, pinnedBy }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, pinnedAt, pinnedBy } : m
        ),
      }));
      const selectedUser = get().selectedUser;
      if (selectedUser) get().getPinnedMessages(selectedUser._id);
    });

    socket.on("messageDeletedForEveryone", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId
            ? { ...m, text: "", image: "", video: "", document: null, deletedForEveryone: true }
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
      socket.off("messagesDelivered");
      socket.off("messageEdited");
      socket.off("reactionUpdated");
      socket.off("messagePinned");
      socket.off("messageDeletedForEveryone");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    }
  },
}));
