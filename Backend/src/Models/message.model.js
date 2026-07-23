import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      index: true,
    },
    sequenceId: {
      type: Number,
      index: true,
    },
    clientMsgId: {
      type: String,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    text: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    video: {
      type: String,
      trim: true,
    },
    document: {
      url: { type: String, trim: true },
      name: { type: String, trim: true },
      size: { type: Number },
      mimeType: { type: String, trim: true },
    },
    encryptedPayload: {
      ciphertext: String,
      ephemeralPublicKey: String,
      oneTimePreKeyId: String,
      iv: String,
      mac: String,
      ratchetStep: Number,
    },
    status: {
      type: String,
      enum: ["pending", "sending", "sent", "delivered", "read", "failed"],
      default: "sent",
      index: true,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        emoji: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isForwarded: {
      type: Boolean,
      default: false,
    },
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replyTo: {
      messageId: { type: Schema.Types.ObjectId, ref: "Message" },
      text: { type: String },
      image: { type: String },
      video: { type: String },
      documentName: { type: String },
      senderName: { type: String },
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Compound Indexes for Ordering & Idempotency
messageSchema.index({ conversationId: 1, sequenceId: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);
