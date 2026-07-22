import { Server } from "socket.io";
import http from "http";
import { app } from "../app.js";
import { Message } from "../Models/message.model.js";

const server = http.createServer(app);

const userSocketMap = {};

const getReceiverSocketID = (userId) => {
  if (!userId) return null;
  return userSocketMap[userId.toString()];
};

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://messagehub-i52c.onrender.com",
  "https://chat-app-by-er-swappy.vercel.app",
  "https://realtime-chat-application-mern-phi.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.auth?.userId;

  if (userId) {
    userSocketMap[userId.toString()] = socket.id;
  } else {
    console.warn("⚠ No userId found in handshake.auth!");
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // --- Real-time Message Status Events ---
  socket.on("markMessagesRead", async ({ senderId }) => {
    if (!userId || !senderId) return;

    try {
      await Message.updateMany(
        { senderId: senderId, receiverId: userId, isRead: false },
        { $set: { isRead: true, isDelivered: true } }
      );

      const senderSocketId = getReceiverSocketID(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", { byUserId: userId });
      }
    } catch (err) {
      console.error("Error marking messages read:", err.message);
    }
  });

  // --- Real-time Typing Indicator Events ---
  socket.on("typing", ({ to }) => {
    const receiverSocketId = getReceiverSocketID(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { from: userId });
    }
  });

  socket.on("stopTyping", ({ to }) => {
    const receiverSocketId = getReceiverSocketID(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", { from: userId });
    }
  });

  // --- WebRTC Signaling Handlers ---

  // 1. Call User (Offer)
  socket.on("callUser", ({ to, offer, callType, callerInfo }) => {
    const receiverSocketId = getReceiverSocketID(to);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", {
        from: userId,
        offer,
        callType,
        callerInfo,
      });
    } else {
      socket.emit("callRejected");
    }
  });

  // 2. Answer Call (Answer)
  socket.on("answerCall", ({ to, answer }) => {
    const callerSocketId = getReceiverSocketID(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callAccepted", { answer });
    }
  });

  // 3. Reject Call
  socket.on("rejectCall", ({ to }) => {
    const callerSocketId = getReceiverSocketID(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callRejected");
    }
  });

  // 4. End Call
  socket.on("endCall", ({ to }) => {
    const peerSocketId = getReceiverSocketID(to);
    if (peerSocketId) {
      io.to(peerSocketId).emit("callEnded");
    }
  });

  // 5. ICE Candidate Exchange
  socket.on("iceCandidate", ({ to, candidate }) => {
    const peerSocketId = getReceiverSocketID(to);
    if (peerSocketId) {
      io.to(peerSocketId).emit("iceCandidate", { candidate });
    }
  });

  socket.on("disconnect", () => {
    if (userId) delete userSocketMap[userId.toString()];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, server, getReceiverSocketID };
