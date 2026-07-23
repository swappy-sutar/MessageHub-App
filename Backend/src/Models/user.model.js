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
    sessions: [
      {
        refreshToken: { type: String, required: true },
        deviceInfo: { type: String, default: "Unknown Device" },
        ipAddress: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
