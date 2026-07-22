import express from "express";
import fileUpload from "express-fileupload";
import { cloudinaryConnect } from "./Config/cloudinary.config.js";
import cors from "cors";
import { errorHandler } from "./Middlewares/error.middleware.js";

const app = express();

// CORS Options
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://chat-app-by-er-swappy.vercel.app",
    "https://realtime-chat-application-mern-phi.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
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

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Chat-App backend",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/friends", friendRoutes);

// Global Error Handler
app.use(errorHandler);

export { app };
