import { User } from "../Models/user.model.js";

/**
 * Enterprise Repository Layer: User Domain
 * Decouples database queries from controllers & business logic.
 */
export class UserRepository {
  static async findById(userId, selectFields = "-password") {
    return User.findById(userId).select(selectFields).exec();
  }

  static async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() }).exec();
  }

  static async findByGoogleIdOrEmail(googleId, email) {
    return User.findOne({
      $or: [{ email: email.toLowerCase() }, { googleId }],
    }).exec();
  }

  static async findByInviteCode(inviteCode) {
    return User.findOne({ inviteCode }).exec();
  }

  static async findByIds(userIds, selectFields = "-password") {
    return User.find({ _id: { $in: userIds } })
      .select(selectFields)
      .lean()
      .exec();
  }

  static async createUser(userData) {
    return User.create(userData);
  }

  static async updateById(userId, updateData) {
    return User.findByIdAndUpdate(userId, updateData, { new: true })
      .select("-password")
      .exec();
  }

  static async addSession(userId, sessionData) {
    return User.findByIdAndUpdate(
      userId,
      { $push: { sessions: sessionData } },
      { new: true }
    ).exec();
  }

  static async removeSession(userId, refreshToken) {
    return User.findByIdAndUpdate(userId, {
      $pull: { sessions: { refreshToken } },
    }).exec();
  }

  static async clearAllSessions(userId) {
    return User.findByIdAndUpdate(userId, {
      $set: { sessions: [] },
    }).exec();
  }

  static async updateLastSeen(userId, date = new Date()) {
    return User.findByIdAndUpdate(userId, { lastSeen: date }).exec();
  }
}
