import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/db";

export interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
  };
}

/**
 * Middleware to authenticate public admin users
 */
export const adminAuthMiddleware = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify JWT_SECRET is configured
    if (!process.env.PUBLIC_ADMIN_JWT_SECRET) {
      console.error(
        "❌ CRITICAL: PUBLIC_ADMIN_JWT_SECRET environment variable is not set"
      );
      return res.status(500).json({
        error: "Server configuration error",
        details: "Authentication service is not properly configured",
      });
    }

    // Verify and decode token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.PUBLIC_ADMIN_JWT_SECRET);
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Token expired",
          code: "TOKEN_EXPIRED",
        });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          error: "Invalid token",
          code: "INVALID_TOKEN",
        });
      }
      throw error;
    }

    // Check if session exists and is valid
    const session = await prisma.public_admin_sessions.findUnique({
      where: { token },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(401).json({
        error: "Session not found",
        code: "SESSION_NOT_FOUND",
      });
    }

    // Check if session expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.public_admin_sessions.delete({
        where: { id: session.id },
      });

      return res.status(401).json({
        error: "Session expired",
        code: "SESSION_EXPIRED",
      });
    }

    // Check if admin is active
    if (!session.admin.isActive) {
      return res.status(401).json({
        error: "Admin account is deactivated",
        code: "ADMIN_DEACTIVATED",
      });
    }

    // Attach admin info to request
    req.admin = {
      id: session.admin.id,
      email: session.admin.email,
      role: session.admin.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error: any) {
    console.error("Admin auth middleware error:", error);
    return res.status(500).json({
      error: "Authentication error",
      details: error.message,
    });
  }
};

/**
 * Middleware to check if admin has required role
 */
export const requireRole = (
  ...allowedRoles: string[]
): ((req: AdminAuthRequest, res: Response, next: NextFunction) => void) => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({
        error: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
        required: allowedRoles,
        current: req.admin.role,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require admin role (full access)
 */
export const requireAdmin = requireRole("admin");

/**
 * Middleware to require editor or admin role
 */
export const requireEditor = requireRole("admin", "editor");
