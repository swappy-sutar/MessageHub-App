import { User } from "../Models/user.model.js";

// Fetch all registered users for sidebar (excluding logged-in user)
const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    return res.status(200).json({
      success: true,
      users: filteredUsers,
    });
  } catch (error) {
    console.error("Error fetching users for sidebar:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users. Please try again.",
    });
  }
};

// Toggle Block / Unblock User
const toggleBlockUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: "Target user ID is required." });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isBlocked = currentUser.blockedUsers?.some(
      (id) => String(id) === String(targetUserId)
    );

    if (isBlocked) {
      // Unblock user
      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        (id) => String(id) !== String(targetUserId)
      );
    } else {
      // Block user
      if (!currentUser.blockedUsers) currentUser.blockedUsers = [];
      currentUser.blockedUsers.push(targetUserId);
    }

    await currentUser.save();

    return res.status(200).json({
      success: true,
      isBlocked: !isBlocked,
      message: !isBlocked ? "User blocked successfully" : "User unblocked successfully",
    });
  } catch (error) {
    console.error("Error in toggleBlockUser:", error);
    return res.status(500).json({ success: false, message: "Failed to update block status." });
  }
};

// Toggle Favourite Contact
const toggleFavouriteUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isFavourite = currentUser.favourites?.some(
      (id) => String(id) === String(targetUserId)
    );

    if (isFavourite) {
      currentUser.favourites = currentUser.favourites.filter(
        (id) => String(id) !== String(targetUserId)
      );
    } else {
      if (!currentUser.favourites) currentUser.favourites = [];
      currentUser.favourites.push(targetUserId);
    }

    await currentUser.save();

    return res.status(200).json({
      success: true,
      isFavourite: !isFavourite,
      message: !isFavourite ? "Added to favourites" : "Removed from favourites",
    });
  } catch (error) {
    console.error("Error in toggleFavouriteUser:", error);
    return res.status(500).json({ success: false, message: "Failed to update favourite status." });
  }
};

// Toggle Mute Notifications for Contact
const toggleMuteUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMuted = currentUser.mutedUsers?.some(
      (id) => String(id) === String(targetUserId)
    );

    if (isMuted) {
      currentUser.mutedUsers = currentUser.mutedUsers.filter(
        (id) => String(id) !== String(targetUserId)
      );
    } else {
      if (!currentUser.mutedUsers) currentUser.mutedUsers = [];
      currentUser.mutedUsers.push(targetUserId);
    }

    await currentUser.save();

    return res.status(200).json({
      success: true,
      isMuted: !isMuted,
      message: !isMuted ? "Notifications muted" : "Notifications unmuted",
    });
  } catch (error) {
    console.error("Error in toggleMuteUser:", error);
    return res.status(500).json({ success: false, message: "Failed to update mute status." });
  }
};

// Report User
const reportUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { reason, comment } = req.body;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    console.log(`[USER_REPORT] Reported user ${targetUserId} by ${req.user._id}. Reason: ${reason || "Spam/Abuse"}`);

    return res.status(200).json({
      success: true,
      message: `Report submitted for ${targetUser.firstName || "user"}. Our team will review this.`,
    });
  } catch (error) {
    console.error("Error in reportUser:", error);
    return res.status(500).json({ success: false, message: "Failed to submit report." });
  }
};

// Fetch User Privacy & Status for Target User
const getUserPrivacyStatus = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isBlockedByMe = currentUser.blockedUsers?.some(
      (id) => String(id) === String(targetUserId)
    );
    const amIBlockedByTarget = targetUser.blockedUsers?.some(
      (id) => String(id) === String(currentUserId)
    );

    const isBlocked = Boolean(isBlockedByMe || amIBlockedByTarget);

    const isFavourite = currentUser.favourites?.some(
      (id) => String(id) === String(targetUserId)
    );
    const isMuted = currentUser.mutedUsers?.some(
      (id) => String(id) === String(targetUserId)
    );
    const disappearingMode = currentUser.disappearingSettings?.get(String(targetUserId)) || "off";

    return res.status(200).json({
      success: true,
      data: {
        isBlocked,
        isBlockedByMe: Boolean(isBlockedByMe),
        amIBlockedByTarget: Boolean(amIBlockedByTarget),
        isFavourite: Boolean(isFavourite),
        isMuted: Boolean(isMuted),
        disappearingMode,
      },
    });
  } catch (error) {
    console.error("Error in getUserPrivacyStatus:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch privacy status." });
  }
};

export {
  getUsersForSidebar,
  toggleBlockUser,
  toggleFavouriteUser,
  toggleMuteUser,
  reportUser,
  getUserPrivacyStatus,
};
