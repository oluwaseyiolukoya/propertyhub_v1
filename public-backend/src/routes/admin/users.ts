import express, { Response } from "express";
import prisma from "../../lib/db";
import adminService from "../../services/admin.service";
import {
  adminAuthMiddleware,
  AdminAuthRequest,
  requireAdmin,
} from "../../middleware/adminAuth";

const router = express.Router();

// All routes require authentication
router.use(adminAuthMiddleware);

/**
 * GET /api/admin/users
 * List all admin users (admin only)
 */
router.get(
  "/",
  requireAdmin,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { role, isActive, search } = req.query;

      const where: any = {};

      if (role) {
        where.role = role;
      }

      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }

      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: "insensitive" } },
          { name: { contains: search as string, mode: "insensitive" } },
        ];
      }

      const admins = await prisma.public_admins.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          pagePermissions: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              logs: true,
              sessions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({ admins });
    } catch (error: any) {
      console.error("List admins error:", error);
      return res.status(500).json({
        error: "Failed to list admins",
        details: error.message,
      });
    }
  }
);

/**
 * GET /api/admin/users/:id
 * Get single admin user details
 */
router.get(
  "/:id",
  requireAdmin,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;

      // Allow users to view their own profile
      if (id !== req.admin?.id && req.admin?.role !== "admin") {
        return res.status(403).json({
          error: "You can only view your own profile",
        });
      }

      const admin = await adminService.getAdminById(id);

      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      // Get activity stats
      const activityStats = await prisma.public_admin_activity_logs.groupBy({
        by: ["action"],
        where: { adminId: id },
        _count: true,
      });

      // Get recent activity
      const recentActivity = await prisma.public_admin_activity_logs.findMany({
        where: { adminId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          createdAt: true,
        },
      });

      return res.json({
        admin,
        stats: {
          activityCount: activityStats.reduce(
            (sum, stat) => sum + stat._count,
            0
          ),
          activityBreakdown: activityStats,
        },
        recentActivity,
      });
    } catch (error: any) {
      console.error("Get admin error:", error);
      return res.status(500).json({
        error: "Failed to get admin",
        details: error.message,
      });
    }
  }
);

/**
 * POST /api/admin/users
 * Create new admin user (admin only)
 */
router.post(
  "/",
  requireAdmin,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { email, name, password, role, pagePermissions } = req.body;

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

      // Validate pagePermissions if provided
      const validPages = [
        "dashboard",
        "landing-pages",
        "careers",
        "blog",
        "forms",
        "analytics",
        "users",
        "settings",
      ];
      if (pagePermissions) {
        if (!Array.isArray(pagePermissions)) {
          return res.status(400).json({
            error: "pagePermissions must be an array",
          });
        }
        const invalidPages = pagePermissions.filter(
          (page: string) => !validPages.includes(page)
        );
        if (invalidPages.length > 0) {
          return res.status(400).json({
            error: `Invalid page permissions: ${invalidPages.join(", ")}`,
            validPages,
          });
        }
      }

      const admin = await adminService.createAdmin({
        email,
        name,
        password,
        role: role || "editor",
      });

      // Update page permissions if provided
      if (pagePermissions) {
        await prisma.public_admins.update({
          where: { id: admin.id },
          data: { pagePermissions },
        });
        admin.pagePermissions = pagePermissions;
      }

      // Log activity
      await adminService.logActivity(
        req.admin!.id,
        "create",
        "public_admin",
        admin.id,
        { email: admin.email, role: admin.role, pagePermissions },
        req.ip,
        req.headers["user-agent"]
      );

      return res.status(201).json({
        message: "Admin created successfully",
        admin,
      });
    } catch (error: any) {
      console.error("Create admin error:", error);
      return res.status(400).json({
        error: error.message || "Failed to create admin",
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id
 * Update admin user (admin only, or user updating themselves)
 */
router.put(
  "/:id",
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;
      const { name, email, role, isActive, pagePermissions } = req.body;

      // Check permissions
      if (id !== req.admin?.id && req.admin?.role !== "admin") {
        return res.status(403).json({
          error: "You can only update your own profile",
        });
      }

      // Only admins can update role, isActive, and pagePermissions
      if (req.admin?.role !== "admin") {
        if (role !== undefined || isActive !== undefined || pagePermissions !== undefined) {
          return res.status(403).json({
            error: "Only admins can update role, status, or permissions",
          });
        }
      }

      // Validate role if provided
      if (role) {
        const validRoles = ["admin", "editor", "viewer"];
        if (!validRoles.includes(role)) {
          return res.status(400).json({
            error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
          });
        }
      }

      // Validate pagePermissions if provided
      if (pagePermissions !== undefined) {
        const validPages = [
          "dashboard",
          "landing-pages",
          "careers",
          "blog",
          "forms",
          "analytics",
          "users",
          "settings",
        ];
        if (!Array.isArray(pagePermissions)) {
          return res.status(400).json({
            error: "pagePermissions must be an array",
          });
        }
        const invalidPages = pagePermissions.filter(
          (page: string) => !validPages.includes(page)
        );
        if (invalidPages.length > 0) {
          return res.status(400).json({
            error: `Invalid page permissions: ${invalidPages.join(", ")}`,
            validPages,
          });
        }
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (pagePermissions !== undefined) updateData.pagePermissions = pagePermissions;

      const admin = await adminService.updateAdmin(id, updateData);

      // Log activity
      await adminService.logActivity(
        req.admin!.id,
        "update",
        "public_admin",
        id,
        { updatedFields: Object.keys(updateData) },
        req.ip,
        req.headers["user-agent"]
      );

      return res.json({
        message: "Admin updated successfully",
        admin,
      });
    } catch (error: any) {
      console.error("Update admin error:", error);
      return res.status(400).json({
        error: error.message || "Failed to update admin",
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id/password
 * Change admin password (admin only, or user changing their own password)
 */
router.put(
  "/:id/password",
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          error: "New password is required",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: "Password must be at least 8 characters",
        });
      }

      // Check permissions
      if (id !== req.admin?.id && req.admin?.role !== "admin") {
        return res.status(403).json({
          error: "You can only change your own password",
        });
      }

      await adminService.updateAdmin(id, { password: newPassword });

      // Log activity
      await adminService.logActivity(
        req.admin!.id,
        "update",
        "public_admin",
        id,
        { action: "password_change" },
        req.ip,
        req.headers["user-agent"]
      );

      return res.json({
        message: "Password updated successfully",
      });
    } catch (error: any) {
      console.error("Change password error:", error);
      return res.status(500).json({
        error: "Failed to change password",
        details: error.message,
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id/activate
 * Activate admin user (admin only)
 */
router.put(
  "/:id/activate",
  requireAdmin,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;

      const admin = await adminService.updateAdmin(id, { isActive: true });

      // Log activity
      await adminService.logActivity(
        req.admin!.id,
        "update",
        "public_admin",
        id,
        { action: "activate" },
        req.ip,
        req.headers["user-agent"]
      );

      return res.json({
        message: "Admin activated successfully",
        admin,
      });
    } catch (error: any) {
      console.error("Activate admin error:", error);
      return res.status(500).json({
        error: "Failed to activate admin",
        details: error.message,
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id/deactivate
 * Deactivate admin user (admin only)
 */
router.put(
  "/:id/deactivate",
  requireAdmin,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;

      // Prevent deactivating yourself
      if (id === req.admin?.id) {
        return res.status(400).json({
          error: "You cannot deactivate your own account",
        });
      }

      const admin = await adminService.updateAdmin(id, { isActive: false });

      // Revoke all sessions
      await prisma.public_admin_sessions.deleteMany({
        where: { adminId: id },
      });

      // Log activity
      await adminService.logActivity(
        req.admin!.id,
        "update",
        "public_admin",
        id,
        { action: "deactivate" },
        req.ip,
        req.headers["user-agent"]
      );

      return res.json({
        message: "Admin deactivated successfully",
        admin,
      });
    } catch (error: any) {
      console.error("Deactivate admin error:", error);
      return res.status(500).json({
        error: "Failed to deactivate admin",
        details: error.message,
      });
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Delete admin user (admin only)
 */
router.delete(
  "/:id",
  requireAdmin,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;

      // Prevent deleting yourself
      if (id === req.admin?.id) {
        return res.status(400).json({
          error: "You cannot delete your own account",
        });
      }

      // Check if admin exists
      const admin = await adminService.getAdminById(id);
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      // Delete all sessions first
      await prisma.public_admin_sessions.deleteMany({
        where: { adminId: id },
      });

      // Delete admin
      await prisma.public_admins.delete({
        where: { id },
      });

      // Log activity
      await adminService.logActivity(
        req.admin!.id,
        "delete",
        "public_admin",
        id,
        { email: admin.email },
        req.ip,
        req.headers["user-agent"]
      );

      return res.json({
        message: "Admin deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete admin error:", error);
      return res.status(500).json({
        error: "Failed to delete admin",
        details: error.message,
      });
    }
  }
);

/**
 * GET /api/admin/users/:id/permissions
 * Get admin page permissions
 */
router.get(
  "/:id/permissions",
  requireAdmin,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;

      const admin = await adminService.getAdminById(id);
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      const pagePermissions = (admin as any).pagePermissions || [];

      return res.json({
        adminId: id,
        pagePermissions,
        validPages: [
          "dashboard",
          "landing-pages",
          "careers",
          "blog",
          "forms",
          "analytics",
          "users",
          "settings",
        ],
      });
    } catch (error: any) {
      console.error("Get permissions error:", error);
      return res.status(500).json({
        error: "Failed to get permissions",
        details: error.message,
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id/permissions
 * Update admin page permissions (admin only)
 */
router.put(
  "/:id/permissions",
  requireAdmin,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;
      const { pagePermissions } = req.body;

      if (!Array.isArray(pagePermissions)) {
        return res.status(400).json({
          error: "pagePermissions must be an array",
        });
      }

      const validPages = [
        "dashboard",
        "landing-pages",
        "careers",
        "blog",
        "forms",
        "analytics",
        "users",
        "settings",
      ];

      const invalidPages = pagePermissions.filter(
        (page: string) => !validPages.includes(page)
      );

      if (invalidPages.length > 0) {
        return res.status(400).json({
          error: `Invalid page permissions: ${invalidPages.join(", ")}`,
          validPages,
        });
      }

      const admin = await adminService.updateAdmin(id, { pagePermissions });

      // Log activity
      await adminService.logActivity(
        req.admin!.id,
        "update",
        "public_admin",
        id,
        { action: "update_permissions", pagePermissions },
        req.ip,
        req.headers["user-agent"]
      );

      return res.json({
        message: "Permissions updated successfully",
        admin,
      });
    } catch (error: any) {
      console.error("Update permissions error:", error);
      return res.status(500).json({
        error: "Failed to update permissions",
        details: error.message,
      });
    }
  }
);

export default router;

