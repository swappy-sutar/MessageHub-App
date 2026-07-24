import { MessageRepository } from "../Repositories/message.repository.js";
import { UserRepository } from "../Repositories/user.repository.js";
import { presenceStore } from "../Config/redis.config.js";
import { SOCKET_EVENTS } from "../Constants/events.constants.js";
import { emitToUser } from "../Config/socket.js";

import CryptoJS from "crypto-js";

const LEGACY_KEYS = [
  process.env.ENCRYPTION_KEY,
  "e420b6990215c371d0c267e077377ca31b2684e2bf8a0bfab83ad7a362607b3c",
  "a9d8f7e6c5b4a39281706f5e4d3c2b1a0987654321fedcba0987654321abcdef",
  "messagehub_secret_encryption_key_2026",
  "secretKey",
];

const decryptTextHelper = (ciphertext) => {
  if (!ciphertext) return "";
  if (typeof ciphertext !== "string") return ciphertext;
  if (!ciphertext.startsWith("U2FsdGVkX1")) return ciphertext;

  for (const key of LEGACY_KEYS) {
    if (!key) continue;
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const dec = bytes.toString(CryptoJS.enc.Utf8);
      if (dec) return dec;
    } catch (e) {}
  }
  return ciphertext;
};

/**
 * Enterprise Service Layer: Message Domain
 * Business logic for sending, editing, deleting, reacting to messages,
 * and pushing real-time status updates via Redis socket gateway.
 */
export class MessageService {
  static async getSidebarContacts(currentUserId) {
    const user = await UserRepository.findById(currentUserId, "friends");
    const friendIds = (user?.friends || []).map((id) => id.toString());

    const aggregated = await MessageRepository.getSidebarLastMessages(currentUserId, friendIds);
    const lastMsgMap = new Map();
    aggregated.forEach((item) => {
      if (item._id) lastMsgMap.set(item._id.toString(), item.lastMsg);
    });

    const users = await UserRepository.findByIds(friendIds);
    return users.map((u) => {
      const lastMsg = lastMsgMap.get(u._id.toString());
      let lastMessageText = "";
      let lastMessageTime = null;

      if (lastMsg) {
        if (lastMsg.deletedForEveryone) {
          lastMessageText = "🚫 This message was deleted";
        } else if (lastMsg.text) {
          lastMessageText = decryptTextHelper(lastMsg.text);
        } else if (lastMsg.image) {
          lastMessageText = "📷 Photo";
        } else if (lastMsg.video) {
          lastMessageText = "🎥 Video";
        } else if (lastMsg.document) {
          lastMessageText = `📄 ${lastMsg.document.name || "Document"}`;
        }
        lastMessageTime = lastMsg.createdAt;
      }

      return {
        ...u,
        lastMessageText,
        lastMessageTime,
      };
    });
  }

  static async sendMessage({ senderId, receiverId, text, imageUrl, videoUrl, documentObj, isForwarded, replyTo }) {
    const receiverSockets = await presenceStore.getSocketIDs(receiverId);
    const isDelivered = receiverSockets.length > 0;
    const now = new Date();

    const message = await MessageRepository.createMessage({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
      document: documentObj,
      status: isDelivered ? "delivered" : "sent",
      isDelivered,
      deliveredAt: isDelivered ? now : null,
      isRead: false,
      isForwarded: !!isForwarded,
      replyTo,
    });

    if (isDelivered) {
      emitToUser(receiverId, SOCKET_EVENTS.NEW_MESSAGE, message);
      emitToUser(senderId, SOCKET_EVENTS.MESSAGE_DELIVERED, {
        messageId: message._id,
        deliveredAt: now,
      });
    }

    return message;
  }
}
