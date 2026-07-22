import { User } from "../Models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../Utils/utils.js";
import { cloudinaryConnect } from "../Config/cloudinary.config.js";
import { ImageUploadCloudinary } from "../Utils/uploadToCloudinary.js";
import { validateImageFile, cleanupTempFile } from "../Utils/fileValidation.js";

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

    const payload = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    user.password = undefined;

    const token = generateToken(payload, res);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: user,
      token,
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
    const { googleId, email, firstName, lastName, profilePic } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google email is required.",
      });
    }

    let user = await User.findOne({ $or: [{ email }, { googleId }] });

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

    const payload = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    user.password = undefined;

    const token = generateToken(payload, res);

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      data: user,
      token,
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

const logout = (req, res) => {
  try {
    return res
      .cookie("token", "", { maxAge: 0, httpOnly: true })
      .status(200)
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (error) {
    console.error("Error in logout:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout.",
    });
  }
};

export { signupUser, loginUser, googleAuth, updateProfile, checkAuth, logout };
