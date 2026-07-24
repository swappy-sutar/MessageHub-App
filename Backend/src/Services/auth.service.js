import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import { UserRepository } from "../Repositories/user.repository.js";
import { parseDeviceInfo } from "../Utils/utils.js";

/**
 * Enterprise Service Layer: Auth Domain
 * Pure business logic for User Authentication, Token Rotation, and Session Management.
 */
export class AuthService {
  static generateAccessToken(user) {
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET_KEY || "messagehub_secret_key";
    return JWT.sign(
      { id: user._id, email: user.email, firstName: user.firstName },
      secret,
      { expiresIn: "15m" } // 15 Minute Access Token
    );
  }

  static generateRefreshToken(user) {
    const refreshSecret =
      process.env.REFRESH_TOKEN_SECRET ||
      (process.env.JWT_SECRET_KEY ? process.env.JWT_SECRET_KEY + "_refresh" : "messagehub_refresh_secret");
    return JWT.sign(
      { id: user._id, email: user.email },
      refreshSecret,
      { expiresIn: "7d" } // 7 Day Refresh Token
    );
  }

  static async createSessionAndSetCookies(user, req, res) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const deviceInfo = parseDeviceInfo(req.headers["user-agent"]);
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "";

    await UserRepository.addSession(user._id, {
      refreshToken,
      deviceInfo,
      ipAddress,
      createdAt: new Date(),
    });

    const isProduction = process.env.NODE_ENV === "production";

    // Set Access Token in secure cookie & header
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    // Set Refresh Token in HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/api/v1/auth/refresh-token",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken, refreshToken };
  }

  static async rotateRefreshToken(refreshToken, req, res) {
    const refreshSecret =
      process.env.REFRESH_TOKEN_SECRET ||
      (process.env.JWT_SECRET_KEY ? process.env.JWT_SECRET_KEY + "_refresh" : "messagehub_refresh_secret");

    let decoded;
    try {
      decoded = JWT.verify(refreshToken, refreshSecret);
    } catch (err) {
      throw { status: 401, code: "REFRESH_TOKEN_EXPIRED", message: "Refresh token expired or invalid" };
    }

    const user = await UserRepository.findById(decoded.id, "+sessions");
    if (!user) throw { status: 401, code: "USER_NOT_FOUND", message: "User account no longer exists" };

    const sessionIndex = user.sessions?.findIndex((s) => s.refreshToken === refreshToken);
    if (sessionIndex === -1 || sessionIndex === undefined) {
      throw { status: 401, code: "SESSION_REVOKED", message: "Session revoked or logged out" };
    }

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Refresh Token Rotation: Replace old refresh token with newly generated refresh token
    user.sessions[sessionIndex].refreshToken = newRefreshToken;
    user.sessions[sessionIndex].createdAt = new Date();
    await user.save();

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/api/v1/auth/refresh-token",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async signup({ firstName, lastName, email, password }) {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw { status: 400, message: "User already exists with this email" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const inviteCode = `MH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const user = await UserRepository.createUser({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      inviteCode,
    });

    return user;
  }

  static async login({ email, password }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw { status: 400, message: "Invalid email or password" };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw { status: 400, message: "Invalid email or password" };
    }

    return user;
  }
}
