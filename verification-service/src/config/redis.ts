import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { config } from './env';

// Create Redis connection
const connection = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Handle Redis connection events
connection.on('connect', () => {
  console.log('✅ Redis connected');
});

connection.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

connection.on('close', () => {
  console.log('⚠️  Redis connection closed');
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

