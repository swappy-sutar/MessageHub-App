import { Server } from "socket.io";
import http from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { app } from "../app.js";
import { Message } from "../Models/message.model.js";
import { User } from "../Models/user.model.js";
import { socketAuthMiddleware } from "../Middlewares/socketAuth.middleware.js";
import { pubClient, subClient, presenceStore, isRedisConnected } from "./redis.config.js";
import { SOCKET_EVENTS } from "../Constants/events.constants.js";

const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "https://messagee-hub.vercel.app",
  "https://messagehub-i52c.onrender.com",
  "https://chat-app-by-er-swappy.vercel.app",
  "https://realtime-chat-application-mern-phi.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Policy Error: Socket origin ${origin} not allowed`), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 10000,
  maxHttpBufferSize: 1e6, // 1MB limit
});

// Configure Socket.IO Redis Adapter for horizontal cluster scaling
if (pubClient && subClient && isRedisConnected) {
  try {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("⚡ Socket.IO Redis Pub/Sub Adapter Mounted Successfully");
  } catch (err) {
    console.warn("⚠️ Failed to attach Redis adapter:", err.message);
  }
}

// Enforce JWT Authentication Middleware for Socket Connection Handshake
io.use(socketAuthMiddleware);

const getReceiverSocketIDs = async (userId) => {
  if (!userId) return [];
  return presenceStore.getSocketIDs(userId.toString());
};

const getReceiverSocketID = async (userId) => {
  const sockets = await getReceiverSocketIDs(userId);
  return sockets.length > 0 ? sockets[0] : null;
};

const emitToUser = async (userId, event, payload) => {
  if (!userId) return;
  const socketIds = await getReceiverSocketIDs(userId);
  socketIds.forEach((socketId) => {
    io.to(socketId).emit(event, payload);
  });
};

const broadcastOnlineUsers = async () => {
  const onlineUserIds = await presenceStore.getOnlineUsers();
  io.emit(SOCKET_EVENTS.GET_ONLINE_USERS, onlineUserIds);
};

io.on("connection", async (socket) => {
  const userId = socket.userId;

  if (userId) {
    await presenceStore.addSocketMapping(userId, socket.id);
    socket.join(`user:${userId}`);

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

        const sendersToNotify = new Set(pendingMessages.map((m) => m.senderId.toString()));
        sendersToNotify.forEach((sId) => {
          emitToUser(sId, SOCKET_EVENTS.MESSAGES_DELIVERED, { toUserId: userId, deliveredAt: now });
        });
      }
    } catch (err) {
      console.error("Error flushing pending message queue:", err.message);
    }
  }

  await broadcastOnlineUsers();

  // --- Heartbeat Event ---
  socket.on(SOCKET_EVENTS.HEARTBEAT, () => {
    socket.emit(SOCKET_EVENTS.HEARTBEAT_ACK, { timestamp: Date.now() });
  });

  // --- Invisible Mode Toggle ---
  socket.on(SOCKET_EVENTS.SET_INVISIBLE, async ({ isInvisible }) => {
    if (!userId) return;
    await presenceStore.setInvisible(userId, !!isInvisible);
    try {
      await User.findByIdAndUpdate(userId, { isInvisible: !!isInvisible });
    } catch (e) {}
    await broadcastOnlineUsers();
  });

  // --- Real-Time Typing Handlers with Redis TTL Cleanup ---
  socket.on(SOCKET_EVENTS.TYPING, async ({ to }) => {
    if (!userId || !to) return;
    await presenceStore.setTyping(userId, to, 5);
    emitToUser(to, SOCKET_EVENTS.USER_TYPING, { from: userId });
  });

  socket.on(SOCKET_EVENTS.STOP_TYPING, async ({ to }) => {
    if (!userId || !to) return;
    await presenceStore.removeTyping(userId, to);
    emitToUser(to, SOCKET_EVENTS.USER_STOPPED_TYPING, { from: userId });
  });

  // --- Real-time Read Receipts ---
  socket.on(SOCKET_EVENTS.MARK_MESSAGES_READ, async ({ senderId }) => {
    if (!userId || !senderId) return;
    try {
      const now = new Date();
      await Message.updateMany(
        { senderId: senderId, receiverId: userId, isRead: false },
        { $set: { isRead: true, isDelivered: true, readAt: now, deliveredAt: now, status: "read" } }
      );
      emitToUser(senderId, SOCKET_EVENTS.MESSAGES_READ, { byUserId: userId, readAt: now });
    } catch (err) {
      console.error("Error marking messages read:", err.message);
    }
  });

  // --- WebRTC Signaling Handlers ---
  socket.on(SOCKET_EVENTS.CALL_USER, async ({ to, offer, callType, callerInfo }) => {
    const receiverSocketIds = await getReceiverSocketIDs(to);
    if (receiverSocketIds.length > 0) {
      emitToUser(to, SOCKET_EVENTS.INCOMING_CALL, {
        from: userId,
        offer,
        callType,
        callerInfo,
      });
    } else {
      socket.emit(SOCKET_EVENTS.CALL_REJECTED);
    }
  });

  socket.on(SOCKET_EVENTS.ANSWER_CALL, ({ to, answer }) => {
    emitToUser(to, SOCKET_EVENTS.CALL_ACCEPTED, { answer });
  });

  socket.on(SOCKET_EVENTS.REJECT_CALL, ({ to }) => {
    emitToUser(to, SOCKET_EVENTS.CALL_REJECTED);
  });

  socket.on(SOCKET_EVENTS.END_CALL, ({ to }) => {
    emitToUser(to, SOCKET_EVENTS.CALL_ENDED);
  });

  socket.on(SOCKET_EVENTS.ICE_CANDIDATE, ({ to, candidate }) => {
    emitToUser(to, SOCKET_EVENTS.ICE_CANDIDATE, { candidate });
  });

  // --- Disconnect Handler ---
  socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
    if (userId) {
      await presenceStore.clearUserTyping(userId);
      await presenceStore.removeSocketMapping(userId, socket.id);
      const remaining = await getReceiverSocketIDs(userId);

      if (remaining.length === 0) {
        const now = new Date();
        try {
          await User.findByIdAndUpdate(userId, { lastSeen: now });
        } catch (e) {}
        io.emit(SOCKET_EVENTS.USER_LAST_SEEN, { userId, lastSeen: now });
      }
    }
    await broadcastOnlineUsers();
  });
});

export { io, server, getReceiverSocketID, getReceiverSocketIDs, emitToUser };
