import { User } from "../Models/user.model.js";

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

export { getUsersForSidebar };
