import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../lib/db";
import adminService from "../../services/admin.service";
import {
  adminAuthMiddleware,
  AdminAuthRequest,
} from "../../middleware/adminAuth";

const router = express.Router();

/**
 * POST /api/admin/auth/register
 * Register a new admin (admin only)
 */
router.post(
  "/register",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      // Only admins can create new admins
      if (req.admin?.role !== "admin") {
        return res.status(403).json({
          error: "Only admins can create new admin users",
        });
      }

      const { email, name, password, role } = req.body;

      if (!email || !name || !password) {
        return res.status(400).json({
          error: "Missing required fields: email, name, password",
        });
      }

      // Validate role
      const validRoles = ["admin", "editor", "viewer"];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({
          error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        });
      }

      const admin = await adminService.createAdmin({
        email,
        name,
        password,
        role: role || "editor",
      });

      // Log activity
      await adminService.logActivity(
        req.admin!.id,
        "create",
        "public_admin",
        admin.id,
        { email: admin.email, role: admin.role },
        req.ip,
        req.headers["user-agent"]
      );

      res.status(201).json({
        message: "Admin created successfully",
        admin,
      });
    } catch (error: any) {
      console.error("Admin registration error:", error);
      return res.status(400).json({
        error: error.message || "Failed to create admin",
      });
    }
  }
);

/**
 * POST /api/admin/auth/login
 * Admin login
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Authenticate admin
    const admin = await adminService.authenticateAdmin(email, password);

    // Generate JWT token
    if (!process.env.PUBLIC_ADMIN_JWT_SECRET) {
      throw new Error("PUBLIC_ADMIN_JWT_SECRET not configured");
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      process.env.PUBLIC_ADMIN_JWT_SECRET,
      {
        expiresIn: process.env.PUBLIC_ADMIN_JWT_EXPIRES_IN || "24h",
      }
    );

    // Create session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await prisma.public_admin_sessions.create({
      data: {
        adminId: admin.id,
        token,
        expiresAt,
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.headers["user-agent"] || undefined,
      },
    });

    // Log activity
    await adminService.logActivity(
      admin.id,
      "login",
      "auth",
      undefined,
      { email: admin.email },
      req.ip,
      req.headers["user-agent"]
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return res.status(401).json({
      error: error.message || "Invalid credentials",
    });
  }
});

/**
 * POST /api/admin/auth/logout
 * Admin logout
 */
router.post(
  "/logout",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (token) {
        // Delete session
        await prisma.public_admin_sessions.deleteMany({
          where: { token },
        });

        // Log activity
        if (req.admin) {
          await adminService.logActivity(
            req.admin.id,
            "logout",
            "auth",
            undefined,
            { email: req.admin.email },
            req.ip,
            req.headers["user-agent"]
          );
        }
      }

      res.json({
        message: "Logout successful",
      });
    } catch (error: any) {
      console.error("Admin logout error:", error);
      return res.status(500).json({
        error: "Failed to logout",
      });
    }
  }
);

/**
 * GET /api/admin/auth/me
 * Get current admin info
 */
router.get(
  "/me",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      if (!req.admin) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const admin = await adminService.getAdminById(req.admin.id);

      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      res.json({ admin });
    } catch (error: any) {
      console.error("Get admin error:", error);
      return res.status(500).json({
        error: "Failed to get admin info",
      });
    }
  }
);

/**
 * PUT /api/admin/auth/password
 * Change password
 */
router.put(
  "/password",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: "Current password and new password are required",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: "New password must be at least 8 characters",
        });
      }

      if (!req.admin) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get admin with password
      const admin = await prisma.public_admins.findUnique({
        where: { id: req.admin.id },
      });

      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      // Verify current password
      const isValid = await adminService.verifyPassword(
        currentPassword,
        admin.password
      );

      if (!isValid) {
        return res.status(401).json({
          error: "Current password is incorrect",
        });
      }

      // Update password
      await adminService.updateAdmin(req.admin.id, {
        password: newPassword,
      });

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "update",
        "auth",
        undefined,
        { action: "password_change" },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({
        message: "Password updated successfully",
      });
    } catch (error: any) {
      console.error("Change password error:", error);
      return res.status(500).json({
        error: "Failed to change password",
      });
    }
  }
);

export default router;
