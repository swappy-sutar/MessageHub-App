import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
      default: "direct",
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    ],
    sequenceCounter: {
      type: Number,
      default: 0,
    },
    lastMessage: {
      messageId: { type: Schema.Types.ObjectId, ref: "Message" },
      senderId: { type: Schema.Types.ObjectId, ref: "User" },
      text: String,
      mediaType: String,
      sequenceId: Number,
      createdAt: Date,
    },
    pinnedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    mutedBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        mutedUntil: Date,
      },
    ],
  },
  { timestamps: true }
);

// Compound Indexes for fast retrieval
conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ type: 1, updatedAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
