import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { config } from "./env";

// Upstash Redis connection configuration
// Reference: https://upstash.com/docs/redis/features/restapi
const redisOptions = {
  // BullMQ requires maxRetriesPerRequest: null
  maxRetriesPerRequest: null,

  // Enable ready check for Upstash
  enableReadyCheck: true,

  // TLS configuration for rediss:// protocol
  tls: config.redis.url.startsWith("rediss://")
    ? {
        rejectUnauthorized: false, // Upstash uses self-signed certs
      }
    : undefined,

  // Connection settings optimized for Upstash
  connectTimeout: 30000, // 30 seconds
  keepAlive: 30000, // Keep connection alive
  family: 4, // Use IPv4

  // Retry strategy with exponential backoff
  // Keep retrying indefinitely with longer delays for Upstash
  retryStrategy: (times: number) => {
    // Cap at 30 seconds between retries
    const delay = Math.min(times * 2000, 30000);
    // Only log first retry attempt to reduce noise
    if (times === 1) {
      console.log(`⏳ Redis: Attempting to connect... (retry ${times})`);
    }
    return delay;
  },

  // Reconnect on error
  reconnectOnError: (err: Error) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      // Reconnect on READONLY errors
      return true;
    }
    return false;
  },
};

// Create Redis connection
const connection = new Redis(config.redis.url, redisOptions);

// Track connection state
let isConnected = false;
let hasLoggedFirstConnection = false;

// Handle Redis connection events
connection.on("connect", () => {
  isConnected = true;
});

connection.on("ready", () => {
  if (!hasLoggedFirstConnection) {
    console.log("✅ Redis: Connected and ready");
    hasLoggedFirstConnection = true;
  }
});

connection.on("error", (error) => {
  // Only log non-connection errors
  if (
    !error.message.includes("ECONNRESET") &&
    !error.message.includes("ECONNREFUSED")
  ) {
    console.error("❌ Redis: Error:", error.message);
  }
});

connection.on("close", () => {
  isConnected = false;
  // Don't log close events - they're normal for Upstash
});

connection.on("reconnecting", () => {
  // Don't log reconnecting - it's normal for Upstash
});

// Create verification queue
export const verificationQueue = new Queue("verification", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 3600, // 7 days
    },
  },
});

// Export connection for workers
export { connection };

// Graceful shutdown
process.on("SIGTERM", async () => {
  await verificationQueue.close();
  await connection.quit();
});

process.on("SIGINT", async () => {
  await verificationQueue.close();
  await connection.quit();
});
