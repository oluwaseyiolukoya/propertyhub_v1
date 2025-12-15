import express, { Response } from "express";
import prisma from "../../lib/db";
import {
  adminAuthMiddleware,
  requireEditor,
  AdminAuthRequest,
} from "../../middleware/adminAuth";
import adminService from "../../services/admin.service";
import { careerService } from "../../services/career.service";

const router = express.Router();

/**
 * GET /api/admin/careers
 * List all career postings (admin view - includes drafts)
 */
router.get(
  "/",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const {
        status,
        department,
        location,
        type,
        remote,
        experience,
        search,
        page,
        limit,
      } = req.query;

      const filters: any = {};
      if (status && status !== "all") filters.status = status as string;
      if (department && department !== "all")
        filters.department = department as string;
      if (location && location !== "all") filters.location = location as string;
      if (type && type !== "all") filters.type = type as string;
      if (remote && remote !== "all") filters.remote = remote as string;
      if (experience && experience !== "all")
        filters.experience = experience as string;
      if (search) filters.search = search as string;

      const pageNum = page ? parseInt(page as string) : 1;
      const limitNum = limit ? parseInt(limit as string) : 20;
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        deletedAt: null,
      };

      if (filters.status) where.status = filters.status;
      if (filters.department) where.department = filters.department;
      if (filters.location) where.location = filters.location;
      if (filters.type) where.type = filters.type;
      if (filters.remote) where.remote = filters.remote;
      if (filters.experience) where.experience = filters.experience;
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const [postings, total] = await Promise.all([
        prisma.career_postings.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.career_postings.count({ where }),
      ]);

      res.json({
        postings,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error("List careers error:", error);
      return res.status(500).json({
        error: "Failed to fetch career postings",
      });
    }
  }
);

/**
 * GET /api/admin/careers/stats
 * Get career statistics
 */
router.get(
  "/stats",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const stats = await careerService.getPublicStatistics();
      res.json(stats);
    } catch (error: any) {
      console.error("Get career stats error:", error);
      return res.status(500).json({
        error: "Failed to fetch statistics",
      });
    }
  }
);

/**
 * GET /api/admin/careers/:id
 * Get single career posting
 */
router.get(
  "/:id",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const posting = await prisma.career_postings.findUnique({
        where: { id },
      });

      if (!posting) {
        return res.status(404).json({ error: "Career posting not found" });
      }

      res.json({ posting });
    } catch (error: any) {
      console.error("Get career error:", error);
      return res.status(500).json({
        error: "Failed to fetch career posting",
      });
    }
  }
);

/**
 * POST /api/admin/careers
 * Create new career posting
 */
router.post(
  "/",
  adminAuthMiddleware,
  requireEditor,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const posting = await prisma.career_postings.create({
        data: {
          ...req.body,
          postedBy: req.admin?.id,
        },
      });

      // Log activity
      if (req.admin) {
        await adminService.logActivity(
          req.admin.id,
          "create",
          "career_posting",
          posting.id,
          { title: posting.title, department: posting.department },
          req.ip,
          req.headers["user-agent"]
        );
      }

      res.status(201).json({
        message: "Career posting created successfully",
        posting,
      });
    } catch (error: any) {
      console.error("Create career error:", error);
      return res.status(500).json({
        error: error.message || "Failed to create career posting",
      });
    }
  }
);

/**
 * PUT /api/admin/careers/:id
 * Update career posting
 */
router.put(
  "/:id",
  adminAuthMiddleware,
  requireEditor,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const existing = await prisma.career_postings.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: "Career posting not found" });
      }

      const posting = await prisma.career_postings.update({
        where: { id },
        data: req.body,
      });

      // Log activity
      if (req.admin) {
        await adminService.logActivity(
          req.admin.id,
          "update",
          "career_posting",
          id,
          { title: posting.title, status: posting.status },
          req.ip,
          req.headers["user-agent"]
        );
      }

      res.json({
        message: "Career posting updated successfully",
        posting,
      });
    } catch (error: any) {
      console.error("Update career error:", error);
      return res.status(500).json({
        error: error.message || "Failed to update career posting",
      });
    }
  }
);

/**
 * DELETE /api/admin/careers/:id
 * Delete career posting (soft delete)
 */
router.delete(
  "/:id",
  adminAuthMiddleware,
  requireEditor,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const posting = await prisma.career_postings.findUnique({
        where: { id },
      });

      if (!posting) {
        return res.status(404).json({ error: "Career posting not found" });
      }

      await prisma.career_postings.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Log activity
      if (req.admin) {
        await adminService.logActivity(
          req.admin.id,
          "delete",
          "career_posting",
          id,
          { title: posting.title },
          req.ip,
          req.headers["user-agent"]
        );
      }

      res.json({
        message: "Career posting deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete career error:", error);
      return res.status(500).json({
        error: "Failed to delete career posting",
      });
    }
  }
);

export default router;
