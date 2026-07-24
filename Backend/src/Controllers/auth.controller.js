import { User } from "../Models/user.model.js";
import { Group } from "../Models/group.model.js";
import { Message } from "../Models/message.model.js";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
  createSessionAndTokens,
  parseDeviceInfo,
} from "../Utils/utils.js";
import { cloudinaryConnect } from "../Config/cloudinary.config.js";
import { ImageUploadCloudinary } from "../Utils/uploadToCloudinary.js";
import { validateImageFile, cleanupTempFile } from "../Utils/fileValidation.js";

// Helper to decode Google JWT ID token payload
const parseGoogleCredential = (credential) => {
  try {
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('utf-8')
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Helper to generate unique invite code (e.g. MH-7X8K2M)
const generateUniqueInviteCode = async () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  let isUnique = false;

  while (!isUnique) {
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `MH-${randomPart}`;
    const existing = await User.findOne({ inviteCode: code });
    if (!existing) isUnique = true;
  }
  return code;
};

const signupUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const isAlreadyExist = await User.find({ email });
    if (isAlreadyExist.length) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const inviteCode = await generateUniqueInviteCode();

      const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        inviteCode,
      });

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        user,
      });
    }
  } catch (error) {
    console.error("Error in signupUser:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during registration. Please try again.",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Auto-generate invite code if missing for legacy users
    if (!user.inviteCode) {
      user.inviteCode = await generateUniqueInviteCode();
      await user.save();
    }

    const { accessToken, refreshToken } = await createSessionAndTokens(user, req, res);

    user.password = undefined;

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: user,
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error in loginUser:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login. Please try again.",
    });
  }
};

// Google OAuth Authentication Controller
const googleAuth = async (req, res) => {
  try {
    let { credential, googleId, email, firstName, lastName, profilePic } = req.body;

    // Decode Google ID Token if passed from Google GSI library
    if (credential) {
      const decodedPayload = parseGoogleCredential(credential);
      if (decodedPayload) {
        googleId = googleId || decodedPayload.sub;
        email = email || decodedPayload.email;
        firstName = firstName || decodedPayload.given_name;
        lastName = lastName || decodedPayload.family_name || "";
        profilePic = profilePic || decodedPayload.picture;
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google account email is required.",
      });
    }

    let user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { googleId }] });

    if (!user) {
      // Create new user for first-time Google login
      const randomPassword = await bcrypt.hash(Math.random().toString(36).substring(2), 10);
      const inviteCode = await generateUniqueInviteCode();

      user = await User.create({
        firstName: firstName || "Google",
        lastName: lastName || "User",
        email: email.toLowerCase(),
        password: randomPassword,
        googleId,
        profilePic: profilePic || "",
        inviteCode,
      });
    } else {
      // Update existing user's googleId / profilePic if missing
      let updated = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.profilePic && profilePic) {
        user.profilePic = profilePic;
        updated = true;
      }
      if (!user.inviteCode) {
        user.inviteCode = await generateUniqueInviteCode();
        updated = true;
      }
      if (updated) await user.save();
    }

    const { accessToken, refreshToken } = await createSessionAndTokens(user, req, res);

    user.password = undefined;

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      data: user,
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error in googleAuth:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Google authentication failed. Please try again.",
    });
  }
};

const updateProfile = async (req, res) => {
  let profilePic = null;
  try {
    profilePic = req.files?.profilePic;

    if (!profilePic) {
      return res.status(400).json({
        success: false,
        message: "Please provide a profile picture",
      });
    }

    // Validate MIME type and 5MB size limit
    const validation = validateImageFile(profilePic, { maxSizeMB: 5 });
    if (!validation.valid) {
      await cleanupTempFile(profilePic);
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      await cleanupTempFile(profilePic);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const uploadResponse = await ImageUploadCloudinary(
      profilePic,
      process.env.CLOUDINARY_FOLDER_NAME,
      300,
      80
    );

    if (!uploadResponse) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image. Please try again.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        profilePic: uploadResponse.secure_url,
      },
      {
        new: true,
      }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (profilePic) await cleanupTempFile(profilePic);
    console.error("Error in updateProfile:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile picture. Please try again.",
    });
  }
};

const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user && !user.inviteCode) {
      user.inviteCode = await generateUniqueInviteCode();
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "User is authenticated",
      data: user,
    });
  } catch (error) {
    console.error("Error in checkAuth:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Authentication check failed.",
    });
  }
};

// Refresh Access Token endpoint using valid Refresh Token
const refreshTokenController = async (req, res) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      req.header("x-refresh-token");

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        code: "REFRESH_TOKEN_MISSING",
        message: "Refresh token missing. Please log in again.",
      });
    }

    const refreshSecret =
      process.env.REFRESH_TOKEN_SECRET ||
      (process.env.JWT_SECRET_KEY + "_refresh") ||
      "messagehub_refresh_secret_key";

    let decoded;
    try {
      decoded = JWT.verify(refreshToken, refreshSecret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        code: "REFRESH_TOKEN_EXPIRED",
        message: "Refresh token expired or invalid. Please log in again.",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User account no longer exists.",
      });
    }

    // Verify session active in user.sessions array
    const sessionIndex = user.sessions?.findIndex(
      (s) => s.refreshToken === refreshToken
    );

    if (sessionIndex === -1 || sessionIndex === undefined) {
      return res.status(401).json({
        success: false,
        code: "SESSION_REVOKED",
        message: "Session has been logged out or revoked.",
      });
    }

    // Generate new Access Token
    const payload = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken({ id: user._id, email: user.email });

    // Rotate refresh token in session entry
    user.sessions[sessionIndex].refreshToken = newRefreshToken;
    user.sessions[sessionIndex].createdAt = new Date();
    await user.save();

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", newAccessToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Error in refreshTokenController:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh token. Please log in again.",
    });
  }
};

// Logout from Current Device
const logout = async (req, res) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      req.header("x-refresh-token");

    if (req.user?._id && refreshToken) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { sessions: { refreshToken } },
      });
    }

    return res
      .cookie("token", "", { maxAge: 0, httpOnly: false })
      .cookie("refreshToken", "", { maxAge: 0, httpOnly: true })
      .status(200)
      .json({
        success: true,
        message: "Logged out from this device successfully",
      });
  } catch (error) {
    console.error("Error in logout:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout.",
    });
  }
};

// Logout from ALL Active Devices
const logoutAll = async (req, res) => {
  try {
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        $set: { sessions: [] },
      });
    }

    return res
      .cookie("token", "", { maxAge: 0, httpOnly: false })
      .cookie("refreshToken", "", { maxAge: 0, httpOnly: true })
      .status(200)
      .json({
        success: true,
        message: "Logged out from all devices successfully",
      });
  } catch (error) {
    console.error("Error in logoutAll:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout all devices.",
    });
  }
};

// Get List of Active Device Sessions for User
const getActiveSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const currentRefreshToken = req.cookies?.refreshToken || req.header("x-refresh-token");

    const sessions = (user?.sessions || []).map((s) => ({
      id: s._id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      isCurrentSession: s.refreshToken === currentRefreshToken,
    }));

    return res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Error in getActiveSessions:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active sessions.",
    });
  }
};

const getAccountReport = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -sessions.refreshToken");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const groupsCount = await Group.countDocuments({ "members.user": req.user._id });
    const messagesCount = await Message.countDocuments({
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    });

    const report = {
      reportTitle: "MessageHub Account Information & Settings Report",
      generatedAt: new Date().toISOString(),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        inviteCode: user.inviteCode || "N/A",
        accountCreatedAt: user.createdAt,
        lastSeen: user.lastSeen,
      },
      stats: {
        friendsCount: user.friends ? user.friends.length : 0,
        groupsCount,
        totalMessagesSentOrReceived: messagesCount,
      },
      security: {
        e2eeStatus: "Signal Protocol E2EE Active",
        activeSessionsCount: user.sessions ? user.sessions.length : 1,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Account report generated successfully",
      data: report,
    });
  } catch (error) {
    console.error("Error generating account report:", error);
    return res.status(500).json({ success: false, message: "Failed to generate account report" });
  }
};

const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Remove user from friends lists
    await User.updateMany(
      { $or: [{ friends: userId }, { sentInvites: userId }, { receivedInvites: userId }] },
      { $pull: { friends: userId, sentInvites: userId, receivedInvites: userId } }
    );

    // 2. Remove user from groups
    await Group.updateMany(
      { "members.user": userId },
      { $pull: { members: { user: userId } } }
    );

    // 3. Delete user messages
    await Message.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    // 4. Delete user profile document
    await User.findByIdAndDelete(userId);

    // 5. Clear authentication cookies
    res.cookie("jwt", "", { maxAge: 0, httpOnly: true });
    res.cookie("refreshToken", "", { maxAge: 0, httpOnly: true });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({ success: false, message: "Failed to delete account" });
  }
};

export {
  signupUser,
  loginUser,
  googleAuth,
  updateProfile,
  checkAuth,
  refreshTokenController,
  logout,
  logoutAll,
  getActiveSessions,
  getAccountReport,
  deleteUserAccount,
};
