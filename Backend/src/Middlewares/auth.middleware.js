import JWT from "jsonwebtoken";
import { User } from "../Models/user.model.js";

const auth = async (req, res, next) => {
  try {
    const token =
      req.header("Authorization")?.replace("Bearer ", "") ||
      (req.body && req.body.token) ||
      req.header("token") ||
      (req.cookies && req.cookies.token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing. Please login.",
      });
    }

    const decodeToken = JWT.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findById(decodeToken.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Error in authenticate user:", error.stack || error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token. Please log in again.",
    });
  }
};

export { auth, auth as isAuthenticated };
