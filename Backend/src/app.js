import express from "express";
import fileUpload from "express-fileupload";
import { cloudinaryConnect } from "./Config/cloudinary.config.js";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./Middlewares/error.middleware.js";

const app = express();

// 1. Helmet Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disabled for flexible cross-origin media & WebSockets
  })
);

// 2. Rate Limiting Middleware
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 300, // Max 300 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP address, please try again after 15 minutes.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Max 20 auth attempts per 15 minutes to prevent brute-force attacks
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts from this IP, please try again after 15 minutes.",
  },
});

// Apply global rate limiting to all requests
app.use(globalLimiter);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://messagehub-i52c.onrender.com",
  "https://chat-app-by-er-swappy.vercel.app",
  "https://realtime-chat-application-mern-phi.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

// CORS Options
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./tmp",
  })
);

// Cloudinary config
cloudinaryConnect();

// Routes
import authRoutes from "./Routes/auth.routes.js";
import userRoutes from "./Routes/user.routes.js";
import messageRoutes from "./Routes/message.routes.js";
import friendRoutes from "./Routes/friend.routes.js";
import groupRoutes from "./Routes/group.routes.js";
import e2eeRoutes from "./Routes/e2ee.routes.js";

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the MessageHub backend API",
  });
});

// Apply strict rate limiting to auth routes
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/friends", friendRoutes);
app.use("/api/v1/groups", groupRoutes);
app.use("/api/v1/e2ee", e2eeRoutes);

// Global Error Handler
app.use(errorHandler);

export { app };
