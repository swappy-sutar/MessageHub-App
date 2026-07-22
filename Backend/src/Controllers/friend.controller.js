import { User } from "../Models/user.model.js";
import { getReceiverSocketID, io } from "../Config/socket.js";

// Search users to invite (by email, name, or inviteCode)
const searchUsers = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user._id;

    if (!query) {
      return res.status(400).json({ success: false, message: "Search query required" });
    }

    const currentUser = await User.findById(userId);
    const existingFriendIds = currentUser.friends || [];

    const cleanQuery = query.trim();

    const users = await User.find({
      _id: { $ne: userId, $nin: existingFriendIds },
      $or: [
        { inviteCode: { $regex: `^${cleanQuery}$`, $options: "i" } },
        { email: { $regex: cleanQuery, $options: "i" } },
        { firstName: { $regex: cleanQuery, $options: "i" } },
        { lastName: { $regex: cleanQuery, $options: "i" } },
      ],
    }).select("-password");

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error in searchUsers:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to search users. Please try again." });
  }
};

// Invite User by Invite Code or User ID directly
const inviteByCode = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: "Invite code or User ID required" });
    }

    const rawCode = inviteCode.trim();
    const upperCode = rawCode.toUpperCase();
    const lowerCode = rawCode.toLowerCase();

    // Search target by inviteCode, _id, or email
    const target = await User.findOne({
      $or: [
        { inviteCode: upperCode },
        { inviteCode: rawCode },
        { email: lowerCode },
        ...(rawCode.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: rawCode }] : []),
      ],
    });

    if (!target) {
      return res.status(404).json({ success: false, message: "User not found with this code or email" });
    }

    if (senderId.toString() === target._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot invite yourself" });
    }

    const sender = await User.findById(senderId);

    if (sender.friends && sender.friends.includes(target._id)) {
      return res.status(400).json({ success: false, message: `${target.firstName} is already in your contacts!` });
    }

    if (sender.sentInvites && sender.sentInvites.includes(target._id)) {
      return res.status(400).json({ success: false, message: "Invite already sent to this user" });
    }

    await User.findByIdAndUpdate(senderId, { $addToSet: { sentInvites: target._id } });
    await User.findByIdAndUpdate(target._id, { $addToSet: { receivedInvites: senderId } });

    const receiverSocketId = getReceiverSocketID(target._id);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newFriendInvite", {
        from: {
          _id: sender._id,
          firstName: sender.firstName,
          lastName: sender.lastName,
          profilePic: sender.profilePic,
          email: sender.email,
          inviteCode: sender.inviteCode,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Friend invite sent to ${target.firstName} ${target.lastName}!`,
      targetUser: {
        _id: target._id,
        firstName: target.firstName,
        lastName: target.lastName,
        profilePic: target.profilePic,
        inviteCode: target.inviteCode,
      },
    });
  } catch (error) {
    console.error("Error in inviteByCode:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to send invite. Please try again." });
  }
};

// Send Friend Invite
const sendInvite = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: "Target user ID required" });
    }

    if (senderId.toString() === targetUserId.toString()) {
      return res.status(400).json({ success: false, message: "Cannot invite yourself" });
    }

    const sender = await User.findById(senderId);
    const target = await User.findById(targetUserId);

    if (!target) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (sender.friends && sender.friends.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: "User is already your friend" });
    }

    if (sender.sentInvites && sender.sentInvites.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: "Invite already sent to this user" });
    }

    await User.findByIdAndUpdate(senderId, { $addToSet: { sentInvites: targetUserId } });
    await User.findByIdAndUpdate(targetUserId, { $addToSet: { receivedInvites: senderId } });

    const receiverSocketId = getReceiverSocketID(targetUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newFriendInvite", {
        from: {
          _id: sender._id,
          firstName: sender.firstName,
          lastName: sender.lastName,
          profilePic: sender.profilePic,
          email: sender.email,
          inviteCode: sender.inviteCode,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Friend invite sent to ${target.firstName}!`,
    });
  } catch (error) {
    console.error("Error in sendInvite:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to send invite. Please try again." });
  }
};

// Accept Friend Invite
const acceptInvite = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const { senderUserId } = req.body;

    if (!senderUserId) {
      return res.status(400).json({ success: false, message: "Sender user ID required" });
    }

    await User.findByIdAndUpdate(receiverId, {
      $pull: { receivedInvites: senderUserId },
      $addToSet: { friends: senderUserId },
    });

    await User.findByIdAndUpdate(senderUserId, {
      $pull: { sentInvites: receiverId },
      $addToSet: { friends: receiverId },
    });

    const senderSocketId = getReceiverSocketID(senderUserId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("inviteAccepted", { acceptedBy: receiverId });
    }

    return res.status(200).json({
      success: true,
      message: "Friend invitation accepted!",
    });
  } catch (error) {
    console.error("Error in acceptInvite:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to accept invite. Please try again." });
  }
};

// Reject Friend Invite
const rejectInvite = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const { senderUserId } = req.body;

    await User.findByIdAndUpdate(receiverId, {
      $pull: { receivedInvites: senderUserId },
    });

    await User.findByIdAndUpdate(senderUserId, {
      $pull: { sentInvites: receiverId },
    });

    return res.status(200).json({
      success: true,
      message: "Invite declined",
    });
  } catch (error) {
    console.error("Error in rejectInvite:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to decline invite. Please try again." });
  }
};

// Get Pending Invites
const getInvites = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId)
      .populate("receivedInvites", "firstName lastName profilePic email inviteCode")
      .populate("sentInvites", "firstName lastName profilePic email inviteCode");

    return res.status(200).json({
      success: true,
      data: {
        receivedInvites: user.receivedInvites || [],
        sentInvites: user.sentInvites || [],
      },
    });
  } catch (error) {
    console.error("Error in getInvites:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to load invites." });
  }
};

export { searchUsers, inviteByCode, sendInvite, acceptInvite, rejectInvite, getInvites };
