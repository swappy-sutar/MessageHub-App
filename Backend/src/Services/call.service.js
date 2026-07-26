/**
 * call.service.js — Production Call Business Logic
 * Handles all call persistence, history, and analytics operations.
 */
import { Call } from "../Models/call.model.js";
import { randomUUID } from "crypto";

/**
 * Create a new call record when a call is initiated.
 */
export const createCallRecord = async ({ callId, callerId, receiverId, type }) => {
  const call = await Call.create({
    callId,
    callerId,
    receiverId,
    type: type === "video" ? "VIDEO" : "VOICE",
    status: "RINGING",
    startedAt: new Date(),
    participants: [
      { userId: callerId, joinedAt: new Date(), role: "caller" },
    ],
  });
  return call;
};

/**
 * Mark a call as accepted and record the answer timestamp.
 */
export const acceptCallRecord = async (callId, receiverId) => {
  return Call.findOneAndUpdate(
    { callId },
    {
      $set: { status: "ACCEPTED", answeredAt: new Date() },
      $push: { participants: { userId: receiverId, joinedAt: new Date(), role: "receiver" } },
    },
    { new: true }
  );
};

/**
 * Mark a call as rejected.
 */
export const rejectCallRecord = async (callId) => {
  return Call.findOneAndUpdate(
    { callId },
    { $set: { status: "REJECTED", endedAt: new Date() } },
    { new: true }
  );
};

/**
 * Mark a call as missed (auto-timeout, no answer).
 */
export const missCallRecord = async (callId) => {
  return Call.findOneAndUpdate(
    { callId, status: "RINGING" },
    { $set: { status: "MISSED", endedAt: new Date() } },
    { new: true }
  );
};

/**
 * Mark a call as ended and compute duration.
 */
export const endCallRecord = async (callId, endedByUserId) => {
  const call = await Call.findOne({ callId });
  if (!call) return null;

  const endedAt = new Date();
  const duration = call.answeredAt
    ? Math.floor((endedAt - call.answeredAt) / 1000)
    : 0;

  return Call.findOneAndUpdate(
    { callId },
    {
      $set: {
        status: "ENDED",
        endedAt,
        duration,
        endedBy: endedByUserId,
      },
    },
    { new: true }
  );
};

/**
 * Mark a call as failed (network error, ICE failure).
 */
export const failCallRecord = async (callId) => {
  return Call.findOneAndUpdate(
    { callId },
    { $set: { status: "FAILED", endedAt: new Date() } },
    { new: true }
  );
};

/**
 * Record an ICE restart for analytics.
 */
export const recordIceRestart = async (callId) => {
  return Call.findOneAndUpdate(
    { callId },
    { $set: { iceRestarted: true }, $inc: { reconnectAttempts: 1 } },
    { new: true }
  );
};

/**
 * Get paginated call history for a user.
 */
export const getCallHistory = async (userId, { page = 1, limit = 20, type = null } = {}) => {
  const query = {
    $or: [{ callerId: userId }, { receiverId: userId }],
    status: { $ne: "RINGING" },
  };

  if (type) query.type = type.toUpperCase();

  const [calls, total] = await Promise.all([
    Call.find(query)
      .populate("callerId", "firstName lastName profilePic")
      .populate("receiverId", "firstName lastName profilePic")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Call.countDocuments(query),
  ]);

  return { calls, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get missed call count for badge display.
 */
export const getMissedCallCount = async (userId) => {
  return Call.countDocuments({ receiverId: userId, status: "MISSED" });
};
