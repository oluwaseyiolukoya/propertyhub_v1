import rateLimit from 'express-rate-limit';
import { AuthRequest } from '../types/verification';

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

/**
 * Rate limiter for API endpoints
 * Limits requests per API key or IP address
 */
export const createRateLimiter = () => {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,

    // Use API key ID or IP as identifier
    keyGenerator: (req: AuthRequest) => {
      return req.apiKey?.id || req.ip || 'unknown';
    },

    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW_MS / 1000} seconds.`,
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      });
    },

    skip: (req) => {
      // Skip rate limiting for health check
      return req.path === '/health';
    },
  });
};
