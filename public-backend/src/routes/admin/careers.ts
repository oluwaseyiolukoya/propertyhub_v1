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
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
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

      return res.json({
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
      console.error("List careers error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta,
      });
      return res.status(500).json({
        error: "Failed to fetch career postings",
        message: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
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
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const stats = await careerService.getPublicStatistics();
      return res.json(stats);
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
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
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
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
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

      return res.status(201).json({
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
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
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

      return res.json({
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
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
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

      return res.json({
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

/**
 * GET /api/admin/careers/:id/applications
 * Get all applications for a career posting (admin only)
 */
router.get(
  "/:id/applications",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;
      const { status, page, limit } = req.query;

      const pageNum = page ? parseInt(page as string) : 1;
      const limitNum = limit ? parseInt(limit as string) : 20;
      const skip = (pageNum - 1) * limitNum;

      const where: any = { postingId: id };
      if (status && status !== "all") {
        where.status = status as string;
      }

      const [applications, total] = await Promise.all([
        prisma.career_applications.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.career_applications.count({ where }),
      ]);

      return res.json({
        applications,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error("Get applications error:", error);
      return res.status(500).json({
        error: "Failed to fetch applications",
      });
    }
  }
);

/**
 * PATCH /api/admin/careers/applications/:id
 * Update application status (admin only)
 */
router.patch(
  "/applications/:id",
  adminAuthMiddleware,
  requireEditor,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (status && status !== "pending") {
        updateData.reviewedBy = req.admin?.id;
        updateData.reviewedAt = new Date();
      }

      const application = await prisma.career_applications.update({
        where: { id },
        data: updateData,
      });

      // Log activity
      if (req.admin) {
        await adminService.logActivity(
          req.admin.id,
          "update",
          "career_application",
          id,
          { status: application.status },
          req.ip,
          req.headers["user-agent"]
        );
      }

      return res.json({
        message: "Application updated successfully",
        application,
      });
    } catch (error: any) {
      console.error("Update application error:", error);
      return res.status(500).json({
        error: error.message || "Failed to update application",
      });
    }
  }
);

/**
 * GET /api/admin/careers/applications/:id/resume
 * Get signed URL for resume download (admin only)
 */
router.get(
  "/applications/:id/resume",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;

      const application = await prisma.career_applications.findUnique({
        where: { id },
        select: { resumeUrl: true },
      });

      if (!application || !application.resumeUrl) {
        return res.status(404).json({
          error: "Resume not found",
        });
      }

      // Generate signed URL for the resume
      const storageService = (await import("../../services/storage.service"))
        .default;
      const signedUrl = await storageService.getFileUrl(
        application.resumeUrl,
        3600
      ); // 1 hour expiry

      return res.json({
        url: signedUrl,
        expiresIn: 3600,
      });
    } catch (error: any) {
      console.error("Get resume URL error:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate resume URL",
      });
    }
  }
);

/**
 * GET /api/admin/careers/applications/:id/cover-letter
 * Get signed URL for cover letter download (admin only)
 */
router.get(
  "/applications/:id/cover-letter",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;

      const application = await prisma.career_applications.findUnique({
        where: { id },
        select: { coverLetterUrl: true },
      });

      if (!application || !application.coverLetterUrl) {
        return res.status(404).json({
          error: "Cover letter not found",
        });
      }

      // Generate signed URL for the cover letter
      const storageService = (await import("../../services/storage.service"))
        .default;
      const signedUrl = await storageService.getFileUrl(
        application.coverLetterUrl,
        3600
      ); // 1 hour expiry

      return res.json({
        url: signedUrl,
        expiresIn: 3600,
      });
    } catch (error: any) {
      console.error("Get cover letter URL error:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate cover letter URL",
      });
    }
  }
);

export default router;
