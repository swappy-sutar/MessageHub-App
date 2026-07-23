import { Message } from "../Models/message.model.js";
import { User } from "../Models/user.model.js";
import { ImageUploadCloudinary, MediaUploadCloudinary } from "../Utils/uploadToCloudinary.js";
import {
  validateImageFile,
  validateVideoFile,
  validateDocumentFile,
  cleanupTempFile,
} from "../Utils/fileValidation.js";
import { getReceiverSocketID, emitToUser, io } from "../Config/socket.js";
import CryptoJS from "crypto-js";

const LEGACY_KEYS = [
  process.env.ENCRYPTION_KEY,
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

const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    if (!loggedInUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required to fetch contacts.",
      });
    }

    const currentUser = await User.findById(loggedInUserId).select("friends");
    const friendIds = currentUser?.friends || [];

    const messageUsers = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
      deletedFor: { $ne: loggedInUserId },
    }).select("senderId receiverId");

    const chatUserIds = new Set([
      ...friendIds.map((id) => id.toString()),
      ...messageUsers.map((m) =>
        m.senderId.toString() === loggedInUserId.toString()
          ? m.receiverId.toString()
          : m.senderId.toString()
      ),
    ]);

    const users = await User.find({
      _id: { $in: Array.from(chatUserIds) },
    }).select("-password");

    const usersWithLastMessage = await Promise.all(
      users.map(async (u) => {
        const userObj = u.toObject();

        const lastMsg = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: u._id },
            { senderId: u._id, receiverId: loggedInUserId },
          ],
          deletedFor: { $ne: loggedInUserId },
        }).sort({ createdAt: -1 });

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

        userObj.lastMessageText = lastMessageText;
        userObj.lastMessageTime = lastMessageTime;

        return userObj;
      })
    );

    return res.status(200).json({
      success: true,
      message: "Contacts fetched successfully",
      data: usersWithLastMessage,
    });
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to load contacts. Please try again.",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    // Mark all incoming messages from this user as read & delivered
    const now = new Date();
    await Message.updateMany(
      { senderId: userToChatId, receiverId: senderId, isRead: false },
      { $set: { isRead: true, isDelivered: true, readAt: now, deliveredAt: now, status: "read" } }
    );

    emitToUser(userToChatId, "messagesRead", { byUserId: senderId, readAt: now });

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: senderId },
      ],
      deletedFor: { $ne: senderId },
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages: "All messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Error in getMessages:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to load messages. Please try again.",
    });
  }
};

const sendMessages = async (req, res) => {
  let image = null;
  let video = null;
  let document = null;
  try {
    const text = req.body?.text;
    const isForwarded = req.body?.isForwarded === "true" || req.body?.isForwarded === true;

    let replyTo = null;
    if (req.body?.replyTo) {
      try {
        replyTo = typeof req.body.replyTo === "string" ? JSON.parse(req.body.replyTo) : req.body.replyTo;
      } catch (e) {
        replyTo = null;
      }
    }

    image = req.files?.image;
    video = req.files?.video;
    document = req.files?.document;

    if (!text && !image && !video && !document) {
      return res.status(400).json({
        success: false,
        message: "Please provide text or media content to send",
      });
    }

    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl = null;
    let videoUrl = null;
    let documentObj = null;

    if (image && Object.keys(image).length !== 0) {
      const validation = validateImageFile(image, { maxSizeMB: 10 });
      if (!validation.valid) {
        await cleanupTempFile(image);
        return res.status(400).json({ success: false, message: validation.message });
      }
      const uploadResponse = await ImageUploadCloudinary(
        image,
        process.env.CLOUDINARY_FOLDER_NAME,
        500,
        80
      );
      imageUrl = uploadResponse.secure_url;
    }

    if (video && Object.keys(video).length !== 0) {
      const validation = validateVideoFile(video, { maxSizeMB: 50 });
      if (!validation.valid) {
        await cleanupTempFile(video);
        return res.status(400).json({ success: false, message: validation.message });
      }
      const uploadResponse = await MediaUploadCloudinary(video, process.env.CLOUDINARY_FOLDER_NAME, "video");
      videoUrl = uploadResponse.secure_url;
    }

    if (document && Object.keys(document).length !== 0) {
      const validation = validateDocumentFile(document, { maxSizeMB: 25 });
      if (!validation.valid) {
        await cleanupTempFile(document);
        return res.status(400).json({ success: false, message: validation.message });
      }
      const uploadResponse = await MediaUploadCloudinary(document, process.env.CLOUDINARY_FOLDER_NAME, "auto");
      documentObj = {
        url: uploadResponse.secure_url,
        name: document.name || "document",
        size: document.size || 0,
        mimeType: document.mimetype || "application/octet-stream",
      };
    }

    let ciphertext = null;
    if (text) {
      const secretKey = process.env.ENCRYPTION_KEY;
      ciphertext = secretKey ? CryptoJS.AES.encrypt(text, secretKey).toString() : text;
    }

    const receiverSocketId = getReceiverSocketID(receiverId);
    const isDelivered = !!receiverSocketId;
    const now = new Date();

    const newMessage = await Message.create({
      senderId: senderId,
      receiverId: receiverId,
      text: ciphertext,
      image: imageUrl,
      video: videoUrl,
      document: documentObj,
      status: isDelivered ? "delivered" : "sent",
      isDelivered: isDelivered,
      deliveredAt: isDelivered ? now : null,
      isRead: false,
      isForwarded: isForwarded,
      replyTo: replyTo,
    });

    if (receiverSocketId) {
      emitToUser(receiverId, "newMessage", newMessage);
      emitToUser(senderId, "messageDelivered", { messageId: newMessage._id, deliveredAt: now });
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    if (image) await cleanupTempFile(image);
    if (video) await cleanupTempFile(video);
    if (document) await cleanupTempFile(document);
    console.error("Error in sendMessages:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again.",
    });
  }
};

const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages",
      });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit a deleted message",
      });
    }

    // Re-encrypt text
    const secretKey = process.env.ENCRYPTION_KEY;
    const ciphertext = secretKey ? CryptoJS.AES.encrypt(text, secretKey).toString() : text;

    message.text = ciphertext;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const payload = {
      messageId: message._id,
      text: ciphertext,
      isEdited: true,
      editedAt: message.editedAt,
    };

    emitToUser(message.receiverId, "messageEdited", payload);

    return res.status(200).json({
      success: true,
      message: "Message edited successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error in editMessage:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to edit message",
    });
  }
};

const addReaction = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Upsert user's reaction
    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        // Toggle off if same emoji clicked again
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
        message.reactions[existingIndex].createdAt = new Date();
      }
    } else {
      message.reactions.push({ userId, emoji, createdAt: new Date() });
    }

    await message.save();

    const payload = {
      messageId: message._id,
      reactions: message.reactions,
    };

    emitToUser(message.senderId, "reactionUpdated", payload);
    emitToUser(message.receiverId, "reactionUpdated", payload);

    return res.status(200).json({
      success: true,
      message: "Reaction updated",
      data: message.reactions,
    });
  } catch (error) {
    console.error("Error in addReaction:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to update reaction",
    });
  }
};

const removeReaction = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId.toString()
    );
    await message.save();

    const payload = {
      messageId: message._id,
      reactions: message.reactions,
    };

    emitToUser(message.senderId, "reactionUpdated", payload);
    emitToUser(message.receiverId, "reactionUpdated", payload);

    return res.status(200).json({
      success: true,
      message: "Reaction removed",
      data: message.reactions,
    });
  } catch (error) {
    console.error("Error in removeReaction:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove reaction",
    });
  }
};

const pinMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    message.pinnedAt = message.pinnedAt ? null : new Date();
    message.pinnedBy = message.pinnedAt ? userId : null;
    await message.save();

    const payload = {
      messageId: message._id,
      pinnedAt: message.pinnedAt,
      pinnedBy: message.pinnedBy,
    };

    emitToUser(message.senderId, "messagePinned", payload);
    emitToUser(message.receiverId, "messagePinned", payload);

    return res.status(200).json({
      success: true,
      message: message.pinnedAt ? "Message pinned" : "Message unpinned",
      data: message,
    });
  } catch (error) {
    console.error("Error in pinMessage:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle pin state",
    });
  }
};

const getPinnedMessages = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const userId = req.user._id;

    const pinnedMessages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      pinnedAt: { $ne: null },
      deletedFor: { $ne: userId },
      deletedForEveryone: false,
    }).sort({ pinnedAt: -1 });

    return res.status(200).json({
      success: true,
      data: pinnedMessages,
    });
  } catch (error) {
    console.error("Error in getPinnedMessages:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pinned messages",
    });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const { q } = req.query;
    const userId = req.user._id;

    if (!q || !q.trim()) {
      return res.status(200).json({ success: true, data: [] });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      deletedFor: { $ne: userId },
      deletedForEveryone: false,
      text: { $exists: true, $ne: "" },
    }).sort({ createdAt: -1 });

    // Decrypt and search in memory to support encrypted messages
    const queryLower = q.trim().toLowerCase();
    const matchingMessages = messages.filter((msg) => {
      const decrypted = decryptTextHelper(msg.text);
      return decrypted && decrypted.toLowerCase().includes(queryLower);
    });

    return res.status(200).json({
      success: true,
      data: matchingMessages,
    });
  } catch (error) {
    console.error("Error in searchMessages:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { deleteType } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (deleteType === "everyone") {
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only delete messages you sent for everyone",
        });
      }

      message.deletedForEveryone = true;
      message.text = "";
      message.image = "";
      message.video = "";
      message.document = null;
      await message.save();

      emitToUser(message.receiverId, "messageDeletedForEveryone", { messageId });

      return res.status(200).json({
        success: true,
        message: "Message deleted for everyone",
        data: message,
      });
    } else {
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { deletedFor: userId },
      });

      return res.status(200).json({
        success: true,
        message: "Message deleted for you",
        data: { _id: messageId },
      });
    }
  } catch (error) {
    console.error("Error in deleteMessage:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete message. Please try again.",
    });
  }
};

const syncMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, lastSequenceId } = req.query;

    if (!conversationId) {
      return res.status(400).json({ success: false, message: "conversationId is required" });
    }

    const minSeq = parseInt(lastSequenceId || "0", 10);

    const deltaMessages = await Message.find({
      conversationId,
      sequenceId: { $gt: minSeq },
      deletedFor: { $ne: userId },
    }).sort({ sequenceId: 1 });

    return res.status(200).json({
      success: true,
      data: deltaMessages,
    });
  } catch (error) {
    console.error("Error in syncMessages:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to sync messages" });
  }
};

export {
  getUsersForSidebar,
  getMessages,
  sendMessages,
  deleteMessage,
  editMessage,
  addReaction,
  removeReaction,
  pinMessage,
  getPinnedMessages,
  searchMessages,
  syncMessages,
};
