import rateLimit from 'express-rate-limit';
import { AuthRequest } from '../types';
import { config } from '../config/env';

/**
 * Rate limiter for API endpoints
 * Limits requests per API key or IP address
 */
export const createRateLimiter = () => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
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
        message: `Rate limit exceeded. Maximum ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000} seconds.`,
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
      });
    },

    skip: (req) => {
      // Skip rate limiting for health check
      return req.path === '/health';
    },
  });
};

