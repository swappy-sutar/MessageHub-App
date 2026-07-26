/**
 * Call.model.js — Production Call Record Schema
 * Stores full call lifecycle metadata per session.
 */
import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date },
        leftAt: { type: Date },
        role: { type: String, enum: ["caller", "receiver"], default: "receiver" },
      },
    ],
    type: {
      type: String,
      enum: ["VOICE", "VIDEO"],
      required: true,
    },
    status: {
      type: String,
      enum: ["RINGING", "MISSED", "ACCEPTED", "REJECTED", "ENDED", "FAILED", "BUSY"],
      default: "RINGING",
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    answeredAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    duration: { type: Number, default: 0 }, // seconds
    endedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Signaling metadata (not stored after call ends)
    iceRestarted: { type: Boolean, default: false },
    reconnectAttempts: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for call history queries
callSchema.index({ callerId: 1, createdAt: -1 });
callSchema.index({ receiverId: 1, createdAt: -1 });
callSchema.index({ status: 1, startedAt: -1 });

export const Call = mongoose.model("Call", callSchema);
