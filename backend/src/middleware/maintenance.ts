import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/db";
import { getMaintenanceStatus } from "../lib/maintenance";

const ADMIN_CACHE_TTL_MS = 30_000;
const adminCache = new Map<string, { isAdmin: boolean; expiresAt: number }>();

const isAdminRole = (role?: string) => {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return normalized.includes("admin");
};

const getTokenFromRequest = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  return authHeader.replace("Bearer ", "");
};

const isInternalAdminById = async (userId: string): Promise<boolean> => {
  const cached = adminCache.get(userId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.isAdmin;
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { customerId: true, role: true, isActive: true },
    });
    const isAdmin =
      !!user && user.isActive !== false && user.customerId === null;
    adminCache.set(userId, { isAdmin, expiresAt: now + ADMIN_CACHE_TTL_MS });
    return isAdmin;
  } catch {
    return false;
  }
};

const isAdminRequest = async (req: Request): Promise<boolean> => {
  const token = getTokenFromRequest(req);
  if (!token) return false;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as any;

    if (decoded?.id) {
      return isInternalAdminById(decoded.id);
    }

    return isAdminRole(decoded?.role);
  } catch {
    return false;
  }
};

const isInternalAdminLogin = async (email?: string): Promise<boolean> => {
  if (!email) return false;

  try {
    const user = await prisma.users.findUnique({
      where: { email },
      select: { customerId: true, role: true, isActive: true },
    });
    return (
      !!user && user.isActive !== false && user.customerId === null
    );
  } catch {
    return false;
  }
};

const isMaintenanceBypassPath = (req: Request) => {
  const path = req.path;
  if (path === "/health" || path === "/api/health") return true;
  if (path === "/api/public/branding") return true;
  if (path === "/api/public/maintenance") return true;
  if (path.startsWith("/webhook/")) return true;
  if (path.startsWith("/health/verification")) return true;
  return false;
};

export const maintenanceModeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const maintenance = await getMaintenanceStatus();
    if (!maintenance.enabled) {
      return next();
    }

    if (isMaintenanceBypassPath(req)) {
      return next();
    }

    const isLoginEndpoint =
      req.path === "/api/auth/login" && req.method === "POST";

    if (isLoginEndpoint && maintenance.blockLogins) {
      const email =
        typeof req.body?.email === "string" ? req.body.email : undefined;
      const allowLogin = await isInternalAdminLogin(email);
      if (!allowLogin) {
        return res.status(503).json({
          error: "Maintenance mode is active. Logins are temporarily disabled.",
          code: "MAINTENANCE_MODE",
          maintenance,
        });
      }
      return next();
    }

    if (!maintenance.apiLock) {
      return next();
    }

    const isAdmin = await isAdminRequest(req);
    if (isAdmin) {
      return next();
    }

    return res.status(503).json({
      error: "Maintenance mode is active. Access is temporarily unavailable.",
      code: "MAINTENANCE_MODE",
      maintenance,
    });
  } catch (error) {
    return next();
  }
};

