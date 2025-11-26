import express, { Request, Response } from 'express';
import prisma from '../config/database';

const router = express.Router();

/**
 * Health check endpoint
 * Returns service status and dependencies
 * 
 * NOTE: Redis connection is lazy-loaded to prevent blocking HTTP server startup
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
    // Lazy-load Redis connection (don't import at top level)
    const { connection: redisConnection } = await import('../config/redis');
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

