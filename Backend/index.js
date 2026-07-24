import dotenv from "dotenv";
dotenv.config();
import { server } from "./src/Config/socket.js";
import { connectDB } from "./src/Config/connect_db.config.js";
import { connectRedis } from "./src/Config/redis.config.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    server.listen(PORT, () => {
      console.log(`🚀 MessageHub Server running on http://localhost:${PORT}`);
    });

    // Graceful Process Termination Handlers
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Draining active connections...`);
      server.close(() => {
        console.log("👋 HTTP & Socket server closed cleanly.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
