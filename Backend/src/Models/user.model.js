import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      sparse: true,
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sentInvites: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    receivedInvites: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blockedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    favourites: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    mutedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    disappearingSettings: {
      type: Map,
      of: String,
      default: {},
    },
    sessions: [
      {
        refreshToken: { type: String, required: true },
        deviceInfo: { type: String, default: "Unknown Device" },
        ipAddress: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isInvisible: {
      type: Boolean,
      default: false,
    },
    notificationSettings: {
      messages: { type: String, default: "Off" },
      groups: { type: String, default: "Off" },
      status: { type: String, default: "Off" },
      showPreviews: { type: Boolean, default: true },
      playOutgoingSound: { type: Boolean, default: false },
      backgroundSync: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
