import JWT from "jsonwebtoken";
import { User } from "../Models/user.model.js";

/**
 * Socket.io Authentication Middleware
 * Authenticates socket handshake via JWT token in handshake.auth or query parameters.
 * Rejects unauthenticated connections immediately.
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    const secret =
      process.env.ACCESS_TOKEN_SECRET ||
      process.env.JWT_SECRET_KEY ||
      "messagehub_secret_key";

    let decoded;
    try {
      decoded = JWT.verify(token, secret);
    } catch (err) {
      if (process.env.JWT_SECRET_KEY && secret !== process.env.JWT_SECRET_KEY) {
        decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
      } else {
        throw err;
      }
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    // Attach authenticated user identity securely to socket context
    socket.user = user;
    socket.userId = user._id.toString();
    next();
  } catch (error) {
    return next(new Error("Authentication error: Invalid or expired token"));
  }
};
