import mongoose from "mongoose";
import { Message } from "../Models/message.model.js";

/**
 * Enterprise Repository Layer: Message Domain
 * Handles Mongoose query optimization, compound index queries,
 * cursor-based pagination, and single-aggregation sidebar fetching.
 */
export class MessageRepository {
  static async findById(messageId) {
    return Message.findById(messageId).exec();
  }

  static async createMessage(messageData) {
    return Message.create(messageData);
  }

  /**
   * Cursor-based Message Pagination for Scalable Long Histories
   */
  static async getPaginatedMessages({ currentUserId, targetUserId, limit = 50, beforeTimestamp = null }) {
    const query = {
      $or: [
        { senderId: currentUserId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: currentUserId },
      ],
      deletedFor: { $ne: currentUserId },
    };

    if (beforeTimestamp) {
      query.createdAt = { $lt: new Date(beforeTimestamp) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    // Reverse to return chronological order
    return messages.reverse();
  }

  /**
   * Aggregated Single-Query Sidebar Contacts & Last Messages
   * Eliminates N+1 DB query anti-pattern
   */
  static async getSidebarLastMessages(currentUserId, targetUserIds) {
    const targetObjectIds = targetUserIds.map((id) => new mongoose.Types.ObjectId(id));
    const userObjectId = new mongoose.Types.ObjectId(currentUserId);

    return Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userObjectId, receiverId: { $in: targetObjectIds } },
            { senderId: { $in: targetObjectIds }, receiverId: userObjectId },
          ],
          deletedFor: { $ne: userObjectId },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$senderId", userObjectId] }, "$receiverId", "$senderId"],
          },
          lastMsg: { $first: "$$ROOT" },
        },
      },
    ]);
  }

  static async markMessagesAsRead(senderId, receiverId) {
    const now = new Date();
    await Message.updateMany(
      { senderId: senderId, receiverId: receiverId, isRead: false },
      { $set: { isRead: true, isDelivered: true, readAt: now, deliveredAt: now, status: "read" } }
    );
    return now;
  }

  static async updatePendingDelivered(receiverId) {
    const now = new Date();
    const pendingMessages = await Message.find({
      receiverId: receiverId,
      isDelivered: false,
    })
      .select("senderId")
      .lean();

    if (pendingMessages.length === 0) return { updatedCount: 0, sendersToNotify: [] };

    await Message.updateMany(
      { receiverId: receiverId, isDelivered: false },
      { $set: { isDelivered: true, deliveredAt: now, status: "delivered" } }
    );

    const sendersToNotify = Array.from(new Set(pendingMessages.map((m) => m.senderId.toString())));
    return { updatedCount: pendingMessages.length, sendersToNotify, deliveredAt: now };
  }

  static async deleteForEveryone(messageId) {
    return Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          deletedForEveryone: true,
          text: "",
          image: "",
          video: "",
          document: null,
        },
      },
      { new: true }
    );
  }

  static async deleteForUser(messageId, userId) {
    return Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { deletedFor: userId } },
      { new: true }
    );
  }
}
