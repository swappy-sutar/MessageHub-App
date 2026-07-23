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
        code: "TOKEN_MISSING",
        message: "Token is missing. Please login.",
      });
    }

    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET_KEY || "messagehub_secret_key";
    
    let decodeToken;
    try {
      decodeToken = JWT.verify(token, secret);
    } catch (err) {
      // Fallback try with primary JWT_SECRET_KEY for legacy tokens
      if (process.env.JWT_SECRET_KEY && secret !== process.env.JWT_SECRET_KEY) {
        try {
          decodeToken = JWT.verify(token, process.env.JWT_SECRET_KEY);
        } catch (fallbackErr) {
          throw err;
        }
      } else {
        throw err;
      }
    }

    const user = await User.findById(decodeToken.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "Unauthorized: User not found",
      });
    }

    req.user = user;
    req.currentToken = token;

    next();
  } catch (error) {
    const isExpired = error.name === "TokenExpiredError";
    return res.status(401).json({
      success: false,
      code: isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
      message: isExpired
        ? "Access token expired. Please refresh your session."
        : "Unauthorized: Invalid or expired token. Please log in again.",
    });
  }
};

export { auth, auth as isAuthenticated };
