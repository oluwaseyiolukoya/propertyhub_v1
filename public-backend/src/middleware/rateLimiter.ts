import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const loginStore: RateLimitStore = {}; // Separate store for login attempts

export const rateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    // Special handling for login endpoint - more lenient rate limiting
    const isLoginEndpoint = req.path === "/api/admin/auth/login" && req.method === "POST";
    if (isLoginEndpoint) {
      const loginWindowMs = 60 * 1000; // 1 minute
      const loginMaxRequests = 10; // 10 login attempts per minute

      // Clean up old login entries
      Object.keys(loginStore).forEach((key) => {
        if (loginStore[key].resetTime < now) {
          delete loginStore[key];
        }
      });

      // Initialize or get current login data
      if (!loginStore[ip] || loginStore[ip].resetTime < now) {
        loginStore[ip] = {
          count: 1,
          resetTime: now + loginWindowMs,
        };
        return next();
      }

      // Increment login count
      loginStore[ip].count++;

      // Check if login limit exceeded
      if (loginStore[ip].count > loginMaxRequests) {
        return res.status(429).json({
          success: false,
          error: "Too many login attempts",
          message: "Please wait a minute before trying again",
          retryAfter: Math.ceil((loginStore[ip].resetTime - now) / 1000),
        });
      }

      return next();
    }

    // Check if this is an admin route (more lenient limits for authenticated admins)
    const isAdminRoute = req.path.startsWith("/api/admin");

    // Use much higher limits for admin routes in development
    // React StrictMode doubles requests, so we need 10x the normal limit
    const effectiveMaxRequests =
      isAdminRoute && process.env.NODE_ENV === "development"
        ? maxRequests * 10 // 10x limit for admin routes in dev (2000 requests per minute)
        : maxRequests;

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
    if (store[ip].count > effectiveMaxRequests) {
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
