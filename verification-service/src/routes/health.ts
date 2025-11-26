import express, { Request, Response } from 'express';
import prisma from '../config/database';
import { connection as redisConnection } from '../config/redis';

const router = express.Router();

// Track if we've successfully connected to dependencies at least once
let hasConnectedToDb = false;
let hasConnectedToRedis = false;

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
  // Use Promise.allSettled to check both in parallel without blocking
  const checks = await Promise.allSettled([
    // Database check with timeout
    Promise.race([
      prisma.$queryRaw`SELECT 1`.then(() => {
        hasConnectedToDb = true;
        return 'ok';
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 1000)
      ),
    ]),
    // Redis check with timeout
    Promise.race([
      redisConnection.ping().then(() => {
        hasConnectedToRedis = true;
        return 'ok';
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis timeout')), 1000)
      ),
    ]),
  ]);

  // Process database check result
  if (checks[0].status === 'fulfilled') {
    health.dependencies.database = 'ok';
  } else {
    health.dependencies.database = hasConnectedToDb ? 'degraded' : 'error';
    if (!hasConnectedToDb) {
      health.status = 'degraded';
    }
  }

  // Process Redis check result
  if (checks[1].status === 'fulfilled') {
    health.dependencies.redis = 'ok';
  } else {
    health.dependencies.redis = hasConnectedToRedis ? 'degraded' : 'error';
    if (!hasConnectedToRedis) {
      health.status = 'degraded';
    }
  }

  // Return 200 even if degraded (app is still running)
  res.status(200).json(health);
});

export default router;

