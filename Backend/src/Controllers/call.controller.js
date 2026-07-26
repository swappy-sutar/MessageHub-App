/**
 * call.controller.js — REST API for Call History
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
import { getCallHistory, getMissedCallCount } from "../Services/call.service.js";

/**
 * GET /api/calls/history
 * Returns paginated call history for the authenticated user.
 */
export const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, type } = req.query;

  const result = await getCallHistory(userId, {
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 50),
    type,
  });

  res.status(200).json({ success: true, data: result });
});

/**
 * GET /api/calls/missed-count
 * Returns the missed call badge count.
 */
export const getMissedCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const count = await getMissedCallCount(userId);
  res.status(200).json({ success: true, data: { count } });
});
