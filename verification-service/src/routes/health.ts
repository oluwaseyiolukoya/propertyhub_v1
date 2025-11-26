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
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    health.dependencies.database = 'ok';
  } catch (error) {
    health.dependencies.database = 'error';
    health.status = 'degraded';
  }

  try {
    // Check Redis connection
    await redisConnection.ping();
    health.dependencies.redis = 'ok';
  } catch (error) {
    health.dependencies.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;

