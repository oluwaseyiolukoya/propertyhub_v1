import express, { Request, Response } from 'express';
import prisma from '../config/database';
import { connection as redisConnection } from '../config/redis';

const router = express.Router();

/**
 * Health check endpoint
 * Returns service status and dependencies
 */
router.get('/', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'verification-service',
    version: '1.0.0',
    dependencies: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Check database connection with timeout
    const dbPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), 3000)
    );
    await Promise.race([dbPromise, timeoutPromise]);
    health.dependencies.database = 'ok';
  } catch (error) {
    health.dependencies.database = 'error';
    health.status = 'degraded';
  }

  try {
    // Check Redis connection with timeout
    const pingPromise = redisConnection.ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis ping timeout')), 3000)
    );
    await Promise.race([pingPromise, timeoutPromise]);
    health.dependencies.redis = 'ok';
  } catch (error) {
    health.dependencies.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;

