import { Server } from "socket.io";
import http from "http";
import { app } from "../app.js";
import { Message } from "../Models/message.model.js";
import { User } from "../Models/user.model.js";

const server = http.createServer(app);

// Multi-device socket mapping: userId -> Set of socketIds
const userSocketsMap = new Map(); // Map<string, Set<string>>
const invisibleUsers = new Set(); // Set of userIds who enabled invisible mode
const typingTimeouts = new Map(); // Key: `${from}_${to}`, Value: NodeJS.Timeout

const getReceiverSocketIDs = (userId) => {
  if (!userId) return [];
  const sockets = userSocketsMap.get(userId.toString());
  return sockets ? Array.from(sockets) : [];
};

const getReceiverSocketID = (userId) => {
  const sockets = getReceiverSocketIDs(userId);
  return sockets.length > 0 ? sockets[0] : null;
};

const emitToUser = (userId, event, payload) => {
  if (!userId) return;
  const socketIds = getReceiverSocketIDs(userId);
  socketIds.forEach((socketId) => {
    io.to(socketId).emit(event, payload);
  });
};

const broadcastOnlineUsers = () => {
  const onlineUserIds = Array.from(userSocketsMap.keys()).filter(
    (uId) => !invisibleUsers.has(uId)
  );
  io.emit("getOnlineUsers", onlineUserIds);
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
  pingInterval: 25000,
  pingTimeout: 10000,
});

io.on("connection", async (socket) => {
  const userId = socket.handshake.auth?.userId?.toString();

  if (userId) {
    if (!userSocketsMap.has(userId)) {
      userSocketsMap.set(userId, new Set());
    }
    userSocketsMap.get(userId).add(socket.id);

    // Flush offline message queue
    try {
      const pendingMessages = await Message.find({
        receiverId: userId,
        isDelivered: false,
      }).sort({ createdAt: 1 });

      if (pendingMessages.length > 0) {
        const now = new Date();
        await Message.updateMany(
          { receiverId: userId, isDelivered: false },
          { $set: { isDelivered: true, deliveredAt: now, status: "delivered" } }
        );

        // Notify sender for each pending message
        const sendersToNotify = new Set(pendingMessages.map((m) => m.senderId.toString()));
        sendersToNotify.forEach((sId) => {
          emitToUser(sId, "messagesDelivered", { toUserId: userId, deliveredAt: now });
        });
      }
    } catch (err) {
      console.error("Error flushing pending messages queue:", err.message);
    }
  } else {
    console.warn("⚠ No userId found in handshake.auth!");
  }

  broadcastOnlineUsers();

  // --- Heartbeat Event ---
  socket.on("heartbeat", () => {
    socket.emit("heartbeatAck", { timestamp: Date.now() });
  });

  // --- Invisible Mode Toggle ---
  socket.on("setInvisible", async ({ isInvisible }) => {
    if (!userId) return;
    if (isInvisible) {
      invisibleUsers.add(userId);
    } else {
      invisibleUsers.delete(userId);
    }
    try {
      await User.findByIdAndUpdate(userId, { isInvisible: !!isInvisible });
    } catch (e) {}
    broadcastOnlineUsers();
  });

  // --- Real-time Message Status Events ---
  socket.on("markMessagesRead", async ({ senderId }) => {
    if (!userId || !senderId) return;

    try {
      const now = new Date();
      await Message.updateMany(
        { senderId: senderId, receiverId: userId, isRead: false },
        { $set: { isRead: true, isDelivered: true, readAt: now, deliveredAt: now, status: "read" } }
      );

      emitToUser(senderId, "messagesRead", { byUserId: userId, readAt: now });
    } catch (err) {
      console.error("Error marking messages read:", err.message);
    }
  });

  // --- Real-time Typing Indicator with 5s Auto Timeout ---
  socket.on("typing", ({ to }) => {
    if (!userId || !to) return;

    emitToUser(to, "userTyping", { from: userId });

    const key = `${userId}_${to}`;
    if (typingTimeouts.has(key)) {
      clearTimeout(typingTimeouts.get(key));
    }

    const timeout = setTimeout(() => {
      emitToUser(to, "userStoppedTyping", { from: userId });
      typingTimeouts.delete(key);
    }, 5000);

    typingTimeouts.set(key, timeout);
  });

  socket.on("stopTyping", ({ to }) => {
    if (!userId || !to) return;

    const key = `${userId}_${to}`;
    if (typingTimeouts.has(key)) {
      clearTimeout(typingTimeouts.get(key));
      typingTimeouts.delete(key);
    }

    emitToUser(to, "userStoppedTyping", { from: userId });
  });

  // --- WebRTC Signaling Handlers ---
  socket.on("callUser", ({ to, offer, callType, callerInfo }) => {
    const receiverSocketIds = getReceiverSocketIDs(to);
    if (receiverSocketIds.length > 0) {
      emitToUser(to, "incomingCall", {
        from: userId,
        offer,
        callType,
        callerInfo,
      });
    } else {
      socket.emit("callRejected");
    }
  });

  socket.on("answerCall", ({ to, answer }) => {
    emitToUser(to, "callAccepted", { answer });
  });

  socket.on("rejectCall", ({ to }) => {
    emitToUser(to, "callRejected");
  });

  socket.on("endCall", ({ to }) => {
    emitToUser(to, "callEnded");
  });

  socket.on("iceCandidate", ({ to, candidate }) => {
    emitToUser(to, "iceCandidate", { candidate });
  });

  // --- Disconnect Handler ---
  socket.on("disconnect", async () => {
    if (userId) {
      const userSockets = userSocketsMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketsMap.delete(userId);
          const now = new Date();
          try {
            await User.findByIdAndUpdate(userId, { lastSeen: now });
          } catch (e) {}
          io.emit("userLastSeen", { userId, lastSeen: now });
        }
      }
    }
    broadcastOnlineUsers();
  });
});

export { io, server, getReceiverSocketID, getReceiverSocketIDs, emitToUser };
