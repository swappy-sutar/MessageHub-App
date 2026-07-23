import mongoose, { Schema } from "mongoose";

const groupSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    membersCount: {
      type: Number,
      default: 1,
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    settings: {
      onlyAdminsCanSend: { type: Boolean, default: false },
      onlyAdminsCanEditInfo: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

groupSchema.index({ ownerId: 1, createdAt: -1 });

export const Group = mongoose.model("Group", groupSchema);
