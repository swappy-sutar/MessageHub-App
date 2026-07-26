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

  // ─── WebRTC Signaling Handlers ────────────────────────────────────────
  //
  // Design principles:
  //  1. Backend is SIGNALING ONLY — no media ever touches the server.
  //  2. Every call creates a Call record for history & analytics.
  //  3. Busy detection happens server-side (active callSessions map).
  //  4. ICE candidates are relayed as-is; no validation burden on hot path.
  //  5. Timeout cleanup is owned by the caller socket.
  //
  // In-memory active call sessions: callId → { callerId, receiverId }
  // (Replaced by Redis in multi-node deployments — add presenceStore.setCall)
  const callSessions = io.callSessions || (io.callSessions = new Map());

  // ── callUser: Caller initiates a call ────────────────────────────────
  socket.on(SOCKET_EVENTS.CALL_USER, async ({ to, offer, callType, callerInfo, callId }) => {
    try {
      if (!to || !offer || !callId) return;

      // Block check
      const [receiverUser, senderUser] = await Promise.all([
        User.findById(to).select("blockedUsers").lean(),
        User.findById(userId).select("blockedUsers").lean(),
      ]);

      const isBlocked =
        receiverUser?.blockedUsers?.some((id) => String(id) === String(userId)) ||
        senderUser?.blockedUsers?.some((id) => String(id) === String(to));

      if (isBlocked) {
        socket.emit(SOCKET_EVENTS.CALL_REJECTED, { callId, reason: "blocked" });
        return;
      }

      // Busy check — receiver already in an active call
      const receiverBusy = [...callSessions.values()].some(
        (s) => s.callerId === String(to) || s.receiverId === String(to)
      );

      if (receiverBusy) {
        socket.emit(SOCKET_EVENTS.CALL_BUSY, { callId });
        return;
      }

      const receiverSocketIds = await getReceiverSocketIDs(to);
      if (receiverSocketIds.length === 0) {
        // User offline → immediate missed call
        socket.emit(SOCKET_EVENTS.CALL_REJECTED, { callId, reason: "offline" });
        try {
          const { createCallRecord, missCallRecord } = await import("../Services/call.service.js");
          const record = await createCallRecord({ callId, callerId: userId, receiverId: to, type: callType });
          await missCallRecord(record.callId);
        } catch (_) {}
        return;
      }

      // Register session
      callSessions.set(callId, {
        callId,
        callerId: String(userId),
        receiverId: String(to),
        type: callType,
        callerSocketId: socket.id,
      });

      console.log(`[Socket Server] CALL_USER initiated. Caller: ${userId}, Callee: ${to}, Call ID: ${callId}, Type: ${callType}`);

      // Persist call record asynchronously (fire and forget for hot path)
      import("../Services/call.service.js").then(({ createCallRecord }) =>
        createCallRecord({ callId, callerId: userId, receiverId: to, type: callType })
      ).catch(() => {});

      // Deliver to all receiver tabs/devices
      emitToUser(to, SOCKET_EVENTS.INCOMING_CALL, {
        from: userId,
        offer,
        callType,
        callerInfo,
        callId,
      });
    } catch (err) {
      console.error("[CALL_USER] error:", err.message);
      socket.emit(SOCKET_EVENTS.CALL_FAILED, { callId, reason: "server_error" });
    }
  });

  // ── answerCall: Callee accepts ────────────────────────────────────────
  socket.on(SOCKET_EVENTS.ANSWER_CALL, async ({ to, answer, callId }) => {
    console.log(`[Socket Server] ANSWER_CALL received from Callee: ${userId} for Caller: ${to}, Call ID: ${callId}`);
    try {
      emitToUser(to, SOCKET_EVENTS.CALL_ACCEPTED, { answer, callId });

      // Persist accept
      import("../Services/call.service.js").then(({ acceptCallRecord }) =>
        acceptCallRecord(callId, userId)
      ).catch(() => {});
    } catch (err) {
      console.error("[ANSWER_CALL] error:", err.message);
    }
  });

  // ── rejectCall: Callee rejects ────────────────────────────────────────
  socket.on(SOCKET_EVENTS.REJECT_CALL, async ({ to, callId }) => {
    console.log(`[Socket Server] REJECT_CALL from Callee: ${userId} for Caller: ${to}, Call ID: ${callId}`);
    callSessions.delete(callId);
    emitToUser(to, SOCKET_EVENTS.CALL_REJECTED, { callId, reason: "rejected" });

    import("../Services/call.service.js").then(({ rejectCallRecord }) =>
      rejectCallRecord(callId)
    ).catch(() => {});
  });

  // ── cancelCall: Caller cancels before answer ──────────────────────────
  socket.on(SOCKET_EVENTS.CANCEL_CALL, async ({ to, callId }) => {
    console.log(`[Socket Server] CANCEL_CALL from Caller: ${userId} for Callee: ${to}, Call ID: ${callId}`);
    callSessions.delete(callId);
    emitToUser(to, SOCKET_EVENTS.CALL_CANCELLED, { callId });

    import("../Services/call.service.js").then(({ missCallRecord }) =>
      missCallRecord(callId)
    ).catch(() => {});
  });

  // ── endCall: Either party ends the call ──────────────────────────────
  socket.on(SOCKET_EVENTS.END_CALL, async ({ to, callId }) => {
    callSessions.delete(callId);
    emitToUser(to, SOCKET_EVENTS.CALL_ENDED, { callId });

    import("../Services/call.service.js").then(({ endCallRecord }) =>
      endCallRecord(callId, userId)
    ).catch(() => {});
  });

  // ── ICE candidate relay ───────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.ICE_CANDIDATE, ({ to, candidate, callId }) => {
    if (!to || !candidate) return;
    emitToUser(to, SOCKET_EVENTS.ICE_CANDIDATE, { candidate, callId });
  });

  // ── ICE Restart: caller sends a new offer after connection failure ────
  socket.on(SOCKET_EVENTS.ICE_RESTART, async ({ to, offer, callId }) => {
    emitToUser(to, SOCKET_EVENTS.ICE_RESTART_OFFER, { offer, callId });

    import("../Services/call.service.js").then(({ recordIceRestart }) =>
      recordIceRestart(callId)
    ).catch(() => {});
  });

  // ── Media state relays (mute/video/screen) ────────────────────────────
  socket.on(SOCKET_EVENTS.MUTE, ({ to, callId }) => {
    emitToUser(to, SOCKET_EVENTS.MUTE, { callId, from: userId });
  });

  socket.on(SOCKET_EVENTS.UNMUTE, ({ to, callId }) => {
    emitToUser(to, SOCKET_EVENTS.UNMUTE, { callId, from: userId });
  });

  socket.on(SOCKET_EVENTS.VIDEO_OFF, ({ to, callId }) => {
    emitToUser(to, SOCKET_EVENTS.VIDEO_OFF, { callId, from: userId });
  });

  socket.on(SOCKET_EVENTS.VIDEO_ON, ({ to, callId }) => {
    emitToUser(to, SOCKET_EVENTS.VIDEO_ON, { callId, from: userId });
  });

  socket.on(SOCKET_EVENTS.SCREEN_SHARE_START, ({ to, callId }) => {
    emitToUser(to, SOCKET_EVENTS.SCREEN_SHARE_START, { callId, from: userId });
  });

  socket.on(SOCKET_EVENTS.SCREEN_SHARE_STOP, ({ to, callId }) => {
    emitToUser(to, SOCKET_EVENTS.SCREEN_SHARE_STOP, { callId, from: userId });
  });

  // ── Network quality relay ─────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.NETWORK_QUALITY, ({ to, callId, quality }) => {
    emitToUser(to, SOCKET_EVENTS.NETWORK_QUALITY, { callId, quality, from: userId });
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

        // ── Cleanup any active call where this user was a participant ──
        for (const [callId, session] of callSessions.entries()) {
          if (session.callerId === String(userId) || session.receiverId === String(userId)) {
            callSessions.delete(callId);
            const peerId = session.callerId === String(userId)
              ? session.receiverId
              : session.callerId;
            emitToUser(peerId, SOCKET_EVENTS.CALL_ENDED, {
              callId,
              reason: "peer_disconnected",
            });
            import("../Services/call.service.js").then(({ endCallRecord }) =>
              endCallRecord(callId, userId)
            ).catch(() => {});
          }
        }
      }
    }
    await broadcastOnlineUsers();
  });
});

export { io, server, getReceiverSocketID, getReceiverSocketIDs, emitToUser };
