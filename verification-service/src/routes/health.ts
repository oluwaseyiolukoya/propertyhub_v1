import express, { Request, Response } from 'express';
import prisma from '../config/database';
import { connection as redisConnection } from '../config/redis';

const router = express.Router();

/**
 * Health check endpoint
 * Returns service status and dependencies
 * 
 * IMPORTANT: This endpoint MUST respond quickly for DigitalOcean health checks.
 * We return 200 OK immediately, then check dependencies in background.
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

  // ALWAYS return 200 OK immediately for basic health check
  // This prevents DigitalOcean from marking the app as unhealthy
  if (req.query.quick === 'true') {
    return res.status(200).json({
      status: 'ok',
      timestamp: health.timestamp,
      uptime: health.uptime,
      service: health.service,
    });
  }

  // For detailed health check, check dependencies with timeout
  try {
    // Check database connection with timeout
    const dbPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), 2000)
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
      setTimeout(() => reject(new Error('Redis ping timeout')), 2000)
    );
    await Promise.race([pingPromise, timeoutPromise]);
    health.dependencies.redis = 'ok';
  } catch (error) {
    health.dependencies.redis = 'error';
    health.status = 'degraded';
  }

  // Return 200 even if degraded (app is still running)
  res.status(200).json(health);
});

export default router;

