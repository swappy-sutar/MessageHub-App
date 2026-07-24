import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../utils/axios";
import Cookies from "js-cookie";
import { useAuthStore } from "./useAuthStore";
import { SOCKET_EVENTS } from "../constants/events";
import { ringtone } from "../utils/ringtone";
import { pushNotifications } from "../utils/pushNotifications";

import CryptoJS from "crypto-js";

const secretKey = import.meta.env.VITE_API_ENCRYPTION_KEY;

const LEGACY_KEYS = [
  secretKey,
  "e420b6990215c371d0c267e077377ca31b2684e2bf8a0bfab83ad7a362607b3c",
  "a9d8f7e6c5b4a39281706f5e4d3c2b1a0987654321fedcba0987654321abcdef",
  "messagehub_secret_encryption_key_2026",
  "secretKey",
];

const decryptMessageText = (ciphertext) => {
  if (!ciphertext || typeof ciphertext !== "string") return ciphertext || "";
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
  // Normalized Message Store State
  messagesById: {}, // { [messageId]: MessageObject }
  messageIds: [],   // Array of message IDs in order
  messages: [],     // Derived array for components

  users: [],
  selectedUser: null,
  isUserLoading: false,
  isMessagesLoading: false,
  hasMoreMessages: true,
  lastSeenSeqMap: {},
  unreadCounts: {},
  typingUsers: {},
  searchResults: [],
  pinnedMessages: [],

  // Setters & UI drawer toggles
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
      isContactInfoOpen: !state.isSearchOpen ? false : state.state.isContactInfoOpen,
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
      const response = await axiosInstance.get("/messages/users");
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
      const response = await axiosInstance.get(`/messages/${userId}`);
      const rawMessages = response.data?.data || [];

      const byId = {};
      const ids = [];

      rawMessages.forEach((msg) => {
        const decryptedMsg = { ...msg, text: decryptMessageText(msg.text) };
        byId[msg._id] = decryptedMsg;
        ids.push(msg._id);
      });

      set({
        messagesById: byId,
        messageIds: ids,
        messages: Object.values(byId),
      });

      get().getPinnedMessages(userId);

      const socket = useAuthStore.getState().socket;
      if (socket && socket.connected) {
        socket.emit(SOCKET_EVENTS.MARK_MESSAGES_READ, { senderId: userId });
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
        socket.emit(SOCKET_EVENTS.MARK_MESSAGES_READ, { senderId: selectedUser._id });
      }
    }
  },

  sendMessage: async (formData) => {
    const { selectedUser, users, replyingTo } = get();

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
            "Content-Type": "multipart/form-data",
          },
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

      set((state) => {
        const nextById = { ...state.messagesById, [newMsg._id]: newMsg };
        const nextIds = [...state.messageIds, newMsg._id];
        return {
          messagesById: nextById,
          messageIds: nextIds,
          messages: Object.values(nextById),
          users: updatedUsers,
          replyingTo: null,
        };
      });

      ringtone.playSentMessageTone();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      throw error;
    }
  },

  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text: newText });

      set((state) => {
        const existing = state.messagesById[messageId];
        if (!existing) return state;
        const updated = { ...existing, text: newText, isEdited: true, editedAt: new Date() };
        const nextById = { ...state.messagesById, [messageId]: updated };
        return {
          messagesById: nextById,
          messages: Object.values(nextById),
          editingMessage: null,
        };
      });

      toast.success("Message edited");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
      throw error;
    }
  },

  addReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/reaction/${messageId}`, { emoji });
      set((state) => {
        const existing = state.messagesById[messageId];
        if (!existing) return state;
        const updated = { ...existing, reactions: res.data.data };
        const nextById = { ...state.messagesById, [messageId]: updated };
        return {
          messagesById: nextById,
          messages: Object.values(nextById),
        };
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add reaction");
    }
  },

  pinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.post(`/messages/pin/${messageId}`, {});
      const updatedMsg = res.data.data;

      set((state) => {
        const existing = state.messagesById[messageId];
        if (!existing) return state;
        const updated = { ...existing, pinnedAt: updatedMsg.pinnedAt, pinnedBy: updatedMsg.pinnedBy };
        const nextById = { ...state.messagesById, [messageId]: updated };
        return {
          messagesById: nextById,
          messages: Object.values(nextById),
        };
      });

      const selectedUser = get().selectedUser;
      if (selectedUser) get().getPinnedMessages(selectedUser._id);

      toast.success(updatedMsg.pinnedAt ? "Message pinned 📌" : "Message unpinned");
    } catch (error) {
      toast.error("Failed to pin/unpin message");
    }
  },

  getPinnedMessages: async (userId) => {
    try {
      const res = await axiosInstance.get(`/messages/pinned/${userId}`);
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
    try {
      const res = await axiosInstance.get(`/messages/search/${selectedUser._id}?q=${encodeURIComponent(query)}`);
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

  deleteMessage: async (messageId, deleteType) => {
    try {
      const res = await axiosInstance.delete(`/messages/delete/${messageId}`, {
        data: { deleteType },
      });

      if (deleteType === "everyone") {
        set((state) => {
          const existing = state.messagesById[messageId];
          if (!existing) return state;
          const updated = {
            ...existing,
            text: "",
            image: "",
            video: "",
            document: null,
            deletedForEveryone: true,
          };
          const nextById = { ...state.messagesById, [messageId]: updated };
          return {
            messagesById: nextById,
            messages: Object.values(nextById),
          };
        });
      } else {
        set((state) => {
          const nextById = { ...state.messagesById };
          delete nextById[messageId];
          const nextIds = state.messageIds.filter((id) => id !== messageId);
          return {
            messagesById: nextById,
            messageIds: nextIds,
            messages: Object.values(nextById),
          };
        });
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

    // Clean up previous event listeners before binding
    get().unsubscribeFromMessages();

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (newMessage) => {
      const authUserId = useAuthStore.getState().authUser?.data?._id || useAuthStore.getState().authUser?._id;
      const currentSelectedUser = get().selectedUser;

      const isMyOwnMessage = String(newMessage.senderId) === String(authUserId);
      const contactId = isMyOwnMessage ? String(newMessage.receiverId) : String(newMessage.senderId);

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
        String(u._id) === contactId
          ? {
              ...u,
              lastMessageText: msgPreview,
              lastMessageTime: msgTime,
            }
          : u
      );

      set({ users: updatedUsers });

      if (isMyOwnMessage) {
        ringtone.playSentMessageTone();
      } else {
        ringtone.playIncomingMessageTone();
      }

      const contactUser = get().users.find((u) => String(u._id) === contactId);
      const contactName = contactUser ? `${contactUser.firstName} ${contactUser.lastName}` : "Someone";

      if (!isMyOwnMessage && (document.hidden || !document.hasFocus() || String(currentSelectedUser?._id) !== contactId)) {
        pushNotifications.sendDesktopNotification({
          title: `💬 Message from ${contactName}`,
          body: msgPreview || "Sent an attachment",
          icon: contactUser?.profilePic || "/avatar.png",
          tag: `msg-${contactId}`,
          onClick: () => {
            if (contactUser) get().setSelectedUser(contactUser);
          },
        });
      }

      if (currentSelectedUser && String(currentSelectedUser._id) === contactId) {
        set((state) => {
          const nextById = { ...state.messagesById, [decryptedMsg._id]: decryptedMsg };
          const nextIds = state.messageIds.includes(decryptedMsg._id)
            ? state.messageIds
            : [...state.messageIds, decryptedMsg._id];
          return {
            messagesById: nextById,
            messageIds: nextIds,
            messages: Object.values(nextById),
          };
        });

        if (!isMyOwnMessage) {
          socket.emit(SOCKET_EVENTS.MARK_MESSAGES_READ, { senderId: contactId });
        }
      } else if (!isMyOwnMessage) {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [contactId]: (state.unreadCounts[contactId] || 0) + 1,
          },
        }));

        toast(`${contactName}: ${msgPreview}`, { duration: 4000, icon: "💬" });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGES_READ, ({ byUserId }) => {
      const currentSelectedUser = get().selectedUser;
      if (currentSelectedUser && String(currentSelectedUser._id) === String(byUserId)) {
        set((state) => {
          const nextById = {};
          Object.keys(state.messagesById).forEach((id) => {
            nextById[id] = { ...state.messagesById[id], isRead: true, isDelivered: true, status: "read" };
          });
          return {
            messagesById: nextById,
            messages: Object.values(nextById),
          };
        });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGES_DELIVERED, ({ toUserId }) => {
      const currentSelectedUser = get().selectedUser;
      if (currentSelectedUser && String(currentSelectedUser._id) === String(toUserId)) {
        set((state) => {
          const nextById = {};
          Object.keys(state.messagesById).forEach((id) => {
            const m = state.messagesById[id];
            nextById[id] = { ...m, isDelivered: true, status: m.isRead ? "read" : "delivered" };
          });
          return {
            messagesById: nextById,
            messages: Object.values(nextById),
          };
        });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, ({ messageId, text }) => {
      const decrypted = decryptMessageText(text);
      set((state) => {
        const existing = state.messagesById[messageId];
        if (!existing) return state;
        const updated = { ...existing, text: decrypted, isEdited: true };
        const nextById = { ...state.messagesById, [messageId]: updated };
        return {
          messagesById: nextById,
          messages: Object.values(nextById),
        };
      });
    });

    socket.on(SOCKET_EVENTS.REACTION_UPDATED, ({ messageId, reactions }) => {
      set((state) => {
        const existing = state.messagesById[messageId];
        if (!existing) return state;
        const updated = { ...existing, reactions };
        const nextById = { ...state.messagesById, [messageId]: updated };
        return {
          messagesById: nextById,
          messages: Object.values(nextById),
        };
      });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_PINNED, ({ messageId, pinnedAt, pinnedBy }) => {
      set((state) => {
        const existing = state.messagesById[messageId];
        if (!existing) return state;
        const updated = { ...existing, pinnedAt, pinnedBy };
        const nextById = { ...state.messagesById, [messageId]: updated };
        return {
          messagesById: nextById,
          messages: Object.values(nextById),
        };
      });

      const selectedUser = get().selectedUser;
      if (selectedUser) get().getPinnedMessages(selectedUser._id);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, ({ messageId }) => {
      set((state) => {
        const existing = state.messagesById[messageId];
        if (!existing) return state;
        const updated = {
          ...existing,
          text: "",
          image: "",
          video: "",
          document: null,
          deletedForEveryone: true,
        };
        const nextById = { ...state.messagesById, [messageId]: updated };
        return {
          messagesById: nextById,
          messages: Object.values(nextById),
        };
      });
    });

    socket.on(SOCKET_EVENTS.USER_TYPING, ({ from }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [String(from)]: true },
      }));
    });

    socket.on(SOCKET_EVENTS.USER_STOPPED_TYPING, ({ from }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [String(from)]: false },
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off(SOCKET_EVENTS.NEW_MESSAGE);
      socket.off(SOCKET_EVENTS.MESSAGES_READ);
      socket.off(SOCKET_EVENTS.MESSAGES_DELIVERED);
      socket.off(SOCKET_EVENTS.MESSAGE_EDITED);
      socket.off(SOCKET_EVENTS.REACTION_UPDATED);
      socket.off(SOCKET_EVENTS.MESSAGE_PINNED);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED);
      socket.off(SOCKET_EVENTS.USER_TYPING);
      socket.off(SOCKET_EVENTS.USER_STOPPED_TYPING);
    }
  },
}));
