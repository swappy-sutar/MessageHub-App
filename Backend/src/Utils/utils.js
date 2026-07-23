import JWT from "jsonwebtoken";

// Access Token: Short-lived token (1 day or 15 mins) for API authorization
const generateAccessToken = (payload) => {
  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET_KEY || "messagehub_secret_key";
  return JWT.sign(payload, secret, {
    expiresIn: "1d",
  });
};

// Refresh Token: Long-lived token (7 days) for session renewal across devices
const generateRefreshToken = (payload) => {
  const secret = process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET_KEY + "_refresh") || "messagehub_refresh_secret_key";
  return JWT.sign(payload, secret, {
    expiresIn: "7d",
  });
};

// Helper to extract clean Device Info from User-Agent header
const parseDeviceInfo = (req) => {
  const userAgent = req?.headers?.["user-agent"] || "";
  let device = "Desktop / Web Browser";

  if (/Android/i.test(userAgent)) {
    device = "Android Device";
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    device = "iOS Device (iPhone/iPad)";
  } else if (/Windows/i.test(userAgent)) {
    device = "Windows PC";
  } else if (/Macintosh|Mac OS X/i.test(userAgent)) {
    device = "Mac OS";
  } else if (/Linux/i.test(userAgent)) {
    device = "Linux Machine";
  }

  // Extract browser name
  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) {
    device += " (Chrome)";
  } else if (/Edg/i.test(userAgent)) {
    device += " (Edge)";
  } else if (/Firefox/i.test(userAgent)) {
    device += " (Firefox)";
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    device += " (Safari)";
  }

  return device;
};

// Helper to extract client IP address
const parseIpAddress = (req) => {
  if (!req) return "";
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    ""
  );
};

// Generate Access + Refresh Token and store device session in user record
const createSessionAndTokens = async (user, req, res) => {
  const payload = {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ id: user._id, email: user.email });

  const deviceInfo = parseDeviceInfo(req);
  const ipAddress = parseIpAddress(req);

  // Initialize sessions array if missing
  if (!user.sessions) {
    user.sessions = [];
  }

  // Cap total active sessions to 10 per user (remove oldest if full)
  if (user.sessions.length >= 10) {
    user.sessions.shift();
  }

  // Store active refresh token session
  user.sessions.push({
    refreshToken,
    deviceInfo,
    ipAddress,
    createdAt: new Date(),
  });

  await user.save();

  // Set HTTP-only cookies
  const isProduction = process.env.NODE_ENV === "production";
  if (res) {
    res.cookie("token", accessToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  return { accessToken, refreshToken };
};

// Legacy fallback helper for backward compatibility
const generateToken = (payload, res) => {
  return generateAccessToken(payload);
};

export {
  generateAccessToken,
  generateRefreshToken,
  createSessionAndTokens,
  generateToken,
  parseDeviceInfo,
};
