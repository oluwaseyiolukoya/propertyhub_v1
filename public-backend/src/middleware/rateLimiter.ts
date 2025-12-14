import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    // Clean up old entries
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });

    // Initialize or get current data
    if (!store[ip] || store[ip].resetTime < now) {
      store[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    // Increment count
    store[ip].count++;

    // Check if limit exceeded
    if (store[ip].count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: "Too many requests",
        message: "Please try again later",
        retryAfter: Math.ceil((store[ip].resetTime - now) / 1000),
      });
    }

    next();
  };
};
