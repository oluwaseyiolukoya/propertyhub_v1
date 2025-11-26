import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { config } from './env';

// Upstash Redis connection configuration
// Reference: https://upstash.com/docs/redis/features/restapi
const redisOptions = {
  // BullMQ requires maxRetriesPerRequest: null
  maxRetriesPerRequest: null,
  
  // Enable ready check for Upstash
  enableReadyCheck: true,
  
  // TLS configuration for rediss:// protocol
  tls: config.redis.url.startsWith('rediss://') ? {
    rejectUnauthorized: false, // Upstash uses self-signed certs
  } : undefined,
  
  // Connection settings optimized for Upstash
  connectTimeout: 30000, // 30 seconds
  keepAlive: 30000, // Keep connection alive
  family: 4, // Use IPv4
  
  // Retry strategy with exponential backoff
  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error('❌ Redis: Max retries reached, stopping reconnection');
      return null;
    }
    const delay = Math.min(times * 1000, 5000);
    console.log(`⏳ Redis: Retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  
  // Reconnect on error
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
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

// Handle Redis connection events
connection.on('connect', () => {
  if (!isConnected) {
    console.log('✅ Redis: Connected successfully');
    isConnected = true;
  }
});

connection.on('ready', () => {
  console.log('✅ Redis: Ready to accept commands');
});

connection.on('error', (error) => {
  console.error('❌ Redis: Connection error:', error.message);
});

connection.on('close', () => {
  if (isConnected) {
    console.log('⚠️  Redis: Connection closed, will attempt to reconnect');
    isConnected = false;
  }
});

connection.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

// Create verification queue
export const verificationQueue = new Queue('verification', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
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
process.on('SIGTERM', async () => {
  await verificationQueue.close();
  await connection.quit();
});

process.on('SIGINT', async () => {
  await verificationQueue.close();
  await connection.quit();
});

