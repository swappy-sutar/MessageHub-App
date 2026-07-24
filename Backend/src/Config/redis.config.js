import Redis from "ioredis";

/**
 * Enterprise Redis Connection & Presence Management Infrastructure
 * Handles distributed socket mapping, multi-node pub/sub, presence tracking,
 * and rate limiting with seamless in-memory fallback when Redis is unavailable.
 */

const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let isRedisConnected = false;
let pubClient = null;
let subClient = null;
let redisClient = null;

// Standalone in-memory fallback store when Redis is offline
class MemoryStoreFallback {
  constructor() {
    this.userSockets = new Map(); // userId -> Set<socketId>
    this.onlineUsers = new Set(); // Set<userId>
    this.invisibleUsers = new Set(); // Set<userId>
    this.typingMap = new Map(); // key -> timeout
  }

  async addSocket(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
    if (!this.invisibleUsers.has(userId)) {
      this.onlineUsers.add(userId);
    }
  }

  async removeSocket(userId, socketId) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        this.onlineUsers.delete(userId);
      }
    }
  }

  async getSocketIds(userId) {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  async getOnlineUsers() {
    return Array.from(this.onlineUsers).filter((id) => !this.invisibleUsers.has(id));
  }

  async setInvisible(userId, isInvisible) {
    if (isInvisible) {
      this.invisibleUsers.add(userId);
      this.onlineUsers.delete(userId);
    } else {
      this.invisibleUsers.delete(userId);
      if (this.userSockets.has(userId)) {
        this.onlineUsers.add(userId);
      }
    }
  }

  async setTyping(fromId, toId, ttlSeconds = 5) {
    const key = `${fromId}_${toId}`;
    if (this.typingMap.has(key)) {
      clearTimeout(this.typingMap.get(key));
    }
    const timer = setTimeout(() => {
      this.typingMap.delete(key);
    }, ttlSeconds * 1000);
    this.typingMap.set(key, timer);
  }

  async removeTyping(fromId, toId) {
    const key = `${fromId}_${toId}`;
    if (this.typingMap.has(key)) {
      clearTimeout(this.typingMap.get(key));
      this.typingMap.delete(key);
    }
  }

  async clearUserTyping(userId) {
    for (const [key, timer] of this.typingMap.entries()) {
      if (key.startsWith(`${userId}_`)) {
        clearTimeout(timer);
        this.typingMap.delete(key);
      }
    }
  }
}

const memoryStore = new MemoryStoreFallback();

const redisOptions = {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      console.warn("⚠️ Redis connection failed. Operating in high-performance memory fallback mode.");
      return null; // Stop retrying after 3 attempts
    }
    return Math.min(times * 100, 2000);
  },
  lazyConnect: true,
};

if (REDIS_URL) {
  redisClient = new Redis(REDIS_URL, redisOptions);
  pubClient = new Redis(REDIS_URL, redisOptions);
  subClient = new Redis(REDIS_URL, redisOptions);
} else if (process.env.NODE_ENV === "production" || process.env.ENABLE_REDIS === "true") {
  const options = { ...redisOptions, host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD };
  redisClient = new Redis(options);
  pubClient = new Redis(options);
  subClient = new Redis(options);
}

export const connectRedis = async () => {
  if (!redisClient) {
    console.log("ℹ️ No Redis configuration detected. Using in-memory fallback adapter.");
    return false;
  }

  try {
    await Promise.all([redisClient.connect(), pubClient.connect(), subClient.connect()]);
    isRedisConnected = true;
    console.log("✅ Redis Pub/Sub & Presence Cluster Connected Successfully");
    return true;
  } catch (err) {
    console.warn("⚠️ Redis connection error:", err.message, "- Falling back to in-memory store.");
    isRedisConnected = false;
    return false;
  }
};

// Redis / Memory Presence Helper API
export const presenceStore = {
  async addSocketMapping(userId, socketId) {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.sadd(`user:sockets:${userId}`, socketId);
        const isInvisible = await redisClient.sismember("invisible:users", userId);
        if (!isInvisible) {
          await redisClient.sadd("online:users", userId);
        }
        return;
      } catch (e) {}
    }
    return memoryStore.addSocket(userId, socketId);
  },

  async removeSocketMapping(userId, socketId) {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.srem(`user:sockets:${userId}`, socketId);
        const count = await redisClient.scard(`user:sockets:${userId}`);
        if (count === 0) {
          await redisClient.srem("online:users", userId);
        }
        return;
      } catch (e) {}
    }
    return memoryStore.removeSocket(userId, socketId);
  },

  async getSocketIDs(userId) {
    if (isRedisConnected && redisClient) {
      try {
        const sockets = await redisClient.smembers(`user:sockets:${userId}`);
        return sockets || [];
      } catch (e) {}
    }
    return memoryStore.getSocketIds(userId);
  },

  async getOnlineUsers() {
    if (isRedisConnected && redisClient) {
      try {
        const allOnline = await redisClient.smembers("online:users");
        const invisible = await redisClient.smembers("invisible:users");
        const invisibleSet = new Set(invisible);
        return allOnline.filter((id) => !invisibleSet.has(id));
      } catch (e) {}
    }
    return memoryStore.getOnlineUsers();
  },

  async setInvisible(userId, isInvisible) {
    if (isRedisConnected && redisClient) {
      try {
        if (isInvisible) {
          await redisClient.sadd("invisible:users", userId);
          await redisClient.srem("online:users", userId);
        } else {
          await redisClient.srem("invisible:users", userId);
          const count = await redisClient.scard(`user:sockets:${userId}`);
          if (count > 0) {
            await redisClient.sadd("online:users", userId);
          }
        }
        return;
      } catch (e) {}
    }
    return memoryStore.setInvisible(userId, isInvisible);
  },

  async setTyping(fromId, toId, ttl = 5) {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.setex(`typing:${fromId}:${toId}`, ttl, "1");
        return;
      } catch (e) {}
    }
    return memoryStore.setTyping(fromId, toId, ttl);
  },

  async removeTyping(fromId, toId) {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.del(`typing:${fromId}:${toId}`);
        return;
      } catch (e) {}
    }
    return memoryStore.removeTyping(fromId, toId);
  },

  async clearUserTyping(userId) {
    if (isRedisConnected && redisClient) {
      try {
        const keys = await redisClient.keys(`typing:${userId}:*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
        return;
      } catch (e) {}
    }
    return memoryStore.clearUserTyping(userId);
  },
};

export { pubClient, subClient, redisClient, isRedisConnected };
