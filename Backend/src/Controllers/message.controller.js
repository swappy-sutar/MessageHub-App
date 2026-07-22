import { Message } from "../Models/message.model.js";
import { User } from "../Models/user.model.js";
import { ImageUploadCloudinary } from "../Utils/uploadToCloudinary.js";
import { validateImageFile, cleanupTempFile } from "../Utils/fileValidation.js";
import { getReceiverSocketID, io } from "../Config/socket.js";
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
    await Message.updateMany(
      { senderId: userToChatId, receiverId: senderId, isRead: false },
      { $set: { isRead: true, isDelivered: true } }
    );

    const otherUserSocketId = getReceiverSocketID(userToChatId);
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("messagesRead", { byUserId: senderId });
    }

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: senderId },
      ],
      deletedFor: { $ne: senderId },
    });

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

    if (!text && !image) {
      return res.status(400).json({
        success: false,
        message: "Please provide text or image to send",
      });
    }

    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image && Object.keys(image).length !== 0) {
      const validation = validateImageFile(image, { maxSizeMB: 10 });
      if (!validation.valid) {
        await cleanupTempFile(image);
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      const uploadResponse = await ImageUploadCloudinary(
        image,
        process.env.CLOUDINARY_FOLDER_NAME,
        500,
        80
      );
      imageUrl = uploadResponse.secure_url;
    }

    let ciphertext = null;
    if (text) {
      const secretKey = process.env.ENCRYPTION_KEY;
      ciphertext = secretKey
        ? CryptoJS.AES.encrypt(text, secretKey).toString()
        : text;
    }

    const receiverSocketId = getReceiverSocketID(receiverId);
    const isDelivered = !!receiverSocketId;

    const newMessage = await Message.create({
      senderId: senderId,
      receiverId: receiverId,
      text: ciphertext,
      image: imageUrl,
      isDelivered: isDelivered,
      isRead: false,
      isForwarded: isForwarded,
      replyTo: replyTo,
    });

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    if (image) await cleanupTempFile(image);
    console.error("Error in sendMessages:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again.",
    });
  }
};

// Delete Message Controller (Delete for Everyone or Delete for Me)
const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { deleteType } = req.body; // "everyone" or "me"
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
      await message.save();

      const receiverSocketId = getReceiverSocketID(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeletedForEveryone", { messageId });
      }

      return res.status(200).json({
        success: true,
        message: "Message deleted for everyone",
        data: message,
      });
    } else {
      // Delete for Me
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

export { getUsersForSidebar, getMessages, sendMessages, deleteMessage };
