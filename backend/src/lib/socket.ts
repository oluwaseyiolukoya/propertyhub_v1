import { Server, Socket } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import { Server as HttpServer } from "http";

let io: Server;
let redisClient: ReturnType<typeof createClient>;
let redisPublisher: ReturnType<typeof createClient>;
let redisSubscriber: ReturnType<typeof createClient>;

interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      customerId?: string;
      permissions?: string[];
    };
  };
}

/**
 * Initialize Socket.io server with Redis adapter for horizontal scaling
 */
export const initializeSocket = async (httpServer: HttpServer) => {
  try {
    // Create Redis clients for pub/sub
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    redisPublisher = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn(
              "⚠️ Redis reconnection failed after 3 attempts, falling back to single-server mode"
            );
            return new Error("Redis connection failed");
          }
          return Math.min(retries * 50, 1000);
        },
      },
    });
    redisSubscriber = redisPublisher.duplicate();

    // Connect Redis clients with timeout
    const connectPromise = Promise.all([
      redisPublisher.connect(),
      redisSubscriber.connect(),
    ]);

    // Set a timeout for Redis connection (5 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Redis connection timeout")), 5000);
    });

    await Promise.race([connectPromise, timeoutPromise]);
    console.log("✅ Redis clients connected for Socket.io");

    // Initialize Socket.io with Redis adapter
    io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Attach Redis adapter for horizontal scaling
    io.adapter(createAdapter(redisPublisher, redisSubscriber));

    console.log("✅ Socket.io Redis adapter attached");

    // Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.data.user = decoded;

        console.log(
          `✅ Socket authenticated: ${decoded.email} (${decoded.role})`
        );
        next();
      } catch (error) {
        console.error("❌ Socket authentication failed:", error);
        next(new Error("Authentication failed"));
      }
    });

    // Connection handler
    io.on("connection", (socket: AuthenticatedSocket) => {
      const user = socket.data.user;
      console.log(`🔌 User connected: ${user.email} (${user.role})`);

      // Join user-specific room
      socket.join(`user:${user.id}`);

      // Join customer-specific room (for owners, managers, tenants)
      if (user.customerId) {
        socket.join(`customer:${user.customerId}`);
        console.log(`  → Joined room: customer:${user.customerId}`);
      }

      // Join role-based rooms
      if (user.role === "super_admin" || user.role === "admin") {
        socket.join("admins");
        console.log(`  → Joined room: admins`);
      } else if (user.role === "owner") {
        socket.join("owners");
        console.log(`  → Joined room: owners`);
      } else if (user.role === "manager") {
        socket.join("managers");
        console.log(`  → Joined room: managers`);
      } else if (user.role === "tenant") {
        socket.join("tenants");
        console.log(`  → Joined room: tenants`);
      }

      // Send welcome message
      socket.emit("connected", {
        message: "Connected to real-time updates",
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      // Handle disconnect
      socket.on("disconnect", (reason) => {
        console.log(`🔌 User disconnected: ${user.email} (Reason: ${reason})`);
      });

      // Handle ping for connection health check
      socket.on("ping", () => {
        socket.emit("pong", { timestamp: Date.now() });
      });
    });

    console.log("✅ Socket.io server initialized");
    return io;
  } catch (error: any) {
    console.warn(
      "⚠️ Redis connection failed, initializing Socket.io without Redis adapter:",
      error?.message || error
    );
    // If Redis fails, initialize without Redis adapter (fallback)
    // Clean up any partial Redis connections
    try {
      if (redisPublisher) {
        try {
          await redisPublisher.quit();
        } catch {
          // Ignore quit errors
        }
      }
      if (redisSubscriber) {
        try {
          await redisSubscriber.quit();
        } catch {
          // Ignore quit errors
        }
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    console.warn(
      "⚠️  Socket.io initialized WITHOUT Redis adapter (single server mode)"
    );

    // Set up authentication middleware for fallback mode
    io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.data.user = decoded;

        console.log(
          `✅ Socket authenticated: ${decoded.email} (${decoded.role})`
        );
        next();
      } catch (error) {
        console.error("❌ Socket authentication failed:", error);
        next(new Error("Authentication failed"));
      }
    });

    // Connection handler for fallback mode
    io.on("connection", (socket: AuthenticatedSocket) => {
      const user = socket.data.user;
      console.log(`🔌 User connected: ${user.email} (${user.role})`);

      // Join user-specific room
      socket.join(`user:${user.id}`);

      // Join customer-specific room (for owners, managers, tenants)
      if (user.customerId) {
        socket.join(`customer:${user.customerId}`);
        console.log(`  → Joined room: customer:${user.customerId}`);
      }

      // Join role-based rooms
      if (user.role === "super_admin" || user.role === "admin") {
        socket.join("admins");
        console.log(`  → Joined room: admins`);
      } else if (user.role === "owner") {
        socket.join("owners");
        console.log(`  → Joined room: owners`);
      } else if (user.role === "manager") {
        socket.join("managers");
        console.log(`  → Joined room: managers`);
      } else if (user.role === "tenant") {
        socket.join("tenants");
        console.log(`  → Joined room: tenants`);
      }

      // Send welcome message
      socket.emit("connected", {
        message: "Connected to real-time updates",
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      // Handle disconnect
      socket.on("disconnect", (reason) => {
        console.log(`🔌 User disconnected: ${user.email} (Reason: ${reason})`);
      });

      // Handle ping for connection health check
      socket.on("ping", () => {
        socket.emit("pong", { timestamp: Date.now() });
      });
    });

    return io;
  }
};

/**
 * Get Socket.io server instance
 */
export const getIO = (): Server | null => {
  if (!io) {
    return null;
  }
  return io;
};

/**
 * Check if Socket.io is initialized
 */
export const isSocketInitialized = (): boolean => {
  return io !== null && io !== undefined;
};

/**
 * Emit event to specific room(s)
 */
export const emitToRoom = (
  room: string | string[],
  event: string,
  data: any
) => {
  try {
    const socketIO = getIO();
    if (!socketIO) {
      // Socket not initialized, silently skip emission
      return;
    }
    socketIO.to(room).emit(event, data);
    console.log(
      `📡 Emitted "${event}" to room(s):`,
      Array.isArray(room) ? room.join(", ") : room
    );
  } catch (error) {
    console.error("❌ Failed to emit event:", error);
  }
};

/**
 * Emit event to all connected clients
 */
export const emitToAll = (event: string, data: any) => {
  try {
    const socketIO = getIO();
    if (!socketIO) {
      // Socket not initialized, silently skip emission
      return;
    }
    socketIO.emit(event, data);
    console.log(`📡 Emitted "${event}" to all clients`);
  } catch (error) {
    console.error("❌ Failed to emit event:", error);
  }
};

/**
 * Emit event to specific user
 */
export const emitToUser = (userId: string, event: string, data: any) => {
  console.log(`📤 [emitToUser] Emitting "${event}" to user:${userId}`, data);
  emitToRoom(`user:${userId}`, event, data);
};

/**
 * Force user to re-authenticate (for role/permission changes)
 */
export const forceUserReauth = (userId: string, reason: string) => {
  emitToUser(userId, "force:reauth", {
    reason,
    timestamp: new Date().toISOString(),
  });
  console.log(`🔐 Forcing re-authentication for user ${userId}: ${reason}`);
};

/**
 * Emit event to all admins
 */
export const emitToAdmins = (event: string, data: any) => {
  emitToRoom("admins", event, data);
};

/**
 * Emit event to specific customer (all users of that customer)
 */
export const emitToCustomer = (
  customerId: string,
  event: string,
  data: any
) => {
  emitToRoom(`customer:${customerId}`, event, data);
};

/**
 * Emit event to all owners
 */
export const emitToOwners = (event: string, data: any) => {
  emitToRoom("owners", event, data);
};

/**
 * Emit event to all managers
 */
export const emitToManagers = (event: string, data: any) => {
  emitToRoom("managers", event, data);
};

/**
 * Emit event to all tenants
 */
export const emitToTenants = (event: string, data: any) => {
  emitToRoom("tenants", event, data);
};

/**
 * Get connected clients count
 */
export const getConnectedClientsCount = async (): Promise<number> => {
  try {
    const socketIO = getIO();
    if (!socketIO) {
      return 0;
    }
    const sockets = await socketIO.fetchSockets();
    return sockets.length;
  } catch (error) {
    console.error("❌ Failed to get connected clients:", error);
    return 0;
  }
};

/**
 * Get clients in a specific room
 */
export const getRoomClientsCount = async (room: string): Promise<number> => {
  try {
    const socketIO = getIO();
    if (!socketIO) {
      return 0;
    }
    const sockets = await socketIO.in(room).fetchSockets();
    return sockets.length;
  } catch (error) {
    console.error("❌ Failed to get room clients:", error);
    return 0;
  }
};

/**
 * Cleanup on server shutdown
 */
export const cleanupSocket = async () => {
  try {
    if (io) {
      await io.close();
      console.log("✅ Socket.io server closed");
    }
    if (redisPublisher) {
      await redisPublisher.quit();
      console.log("✅ Redis publisher closed");
    }
    if (redisSubscriber) {
      await redisSubscriber.quit();
      console.log("✅ Redis subscriber closed");
    }
  } catch (error) {
    console.error("❌ Error during socket cleanup:", error);
  }
};
