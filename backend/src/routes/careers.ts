import express, { Request, Response } from "express";
import { careerService } from "../services/career.service";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { z } from "zod";

const router = express.Router();

/**
 * Validation schemas
 */
const createPostingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  type: z.string().min(1, "Type is required"),
  remote: z.string().min(1, "Remote option is required"),
  experience: z.string().min(1, "Experience level is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z
    .array(z.string())
    .min(1, "At least one requirement is required"),
  salary: z.string().optional(),
  status: z.enum(["active", "draft", "closed", "archived"]).optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.any().optional(),
});

const updatePostingSchema = z.object({
  title: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  remote: z.string().min(1).optional(),
  experience: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  requirements: z.array(z.string()).optional(),
  salary: z.string().optional(),
  status: z.enum(["active", "draft", "closed", "archived"]).optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.any().optional(),
});

/**
 * PUBLIC ENDPOINTS
 */

/**
 * GET /api/careers
 * Get public career postings (active only)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const filters = {
      department: req.query.department as string,
      location: req.query.location as string,
      type: req.query.type as string,
      remote: req.query.remote as string,
      experience: req.query.experience as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await careerService.getPublicPostings(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Get public careers error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch career postings",
      message: error.message,
    });
  }
});

/**
 * GET /api/careers/filters
 * Get available filter options for public
 */
router.get("/filters", async (req: Request, res: Response) => {
  try {
    const options = await careerService.getFilterOptions();

    res.json({
      success: true,
      data: options,
    });
  } catch (error: any) {
    console.error("❌ Get filter options error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch filter options",
      message: error.message,
    });
  }
});

/**
 * GET /api/careers/:id
 * Get a single career posting (public)
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const posting = await careerService.getPostingById(id, true);

    if (!posting) {
      return res.status(404).json({
        success: false,
        error: "Career posting not found",
      });
    }

    res.json({
      success: true,
      data: posting,
    });
  } catch (error: any) {
    console.error("❌ Get career posting error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch career posting",
      message: error.message,
    });
  }
});

/**
 * ADMIN ENDPOINTS (require authentication)
 */

/**
 * GET /api/admin/careers
 * Get all career postings (admin view with all statuses)
 */
router.get(
  "/admin/careers",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if user is admin
      const role = (req.user?.role || "").toLowerCase();
      if (!["super_admin", "admin"].includes(role)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required.",
        });
      }

      const filters = {
        status: req.query.status as string,
        department: req.query.department as string,
        location: req.query.location as string,
        type: req.query.type as string,
        remote: req.query.remote as string,
        experience: req.query.experience as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const result = await careerService.getPostings(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("❌ Get careers (admin) error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch career postings",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/admin/careers/stats
 * Get career postings statistics
 */
router.get(
  "/admin/careers/stats",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if user is admin
      const role = (req.user?.role || "").toLowerCase();
      if (!["super_admin", "admin"].includes(role)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required.",
        });
      }

      const stats = await careerService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("❌ Get career stats error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch statistics",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/admin/careers/:id
 * Get a single career posting (admin view)
 */
router.get(
  "/admin/careers/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if user is admin
      const role = (req.user?.role || "").toLowerCase();
      if (!["super_admin", "admin"].includes(role)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required.",
        });
      }

      const { id } = req.params;

      const posting = await careerService.getPostingById(id, false);

      if (!posting) {
        return res.status(404).json({
          success: false,
          error: "Career posting not found",
        });
      }

      res.json({
        success: true,
        data: posting,
      });
    } catch (error: any) {
      console.error("❌ Get career posting (admin) error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch career posting",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/admin/careers
 * Create a new career posting
 */
router.post(
  "/admin/careers",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if user is admin
      const role = (req.user?.role || "").toLowerCase();
      if (!["super_admin", "admin"].includes(role)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required.",
        });
      }

      // Validate request body
      const validatedData = createPostingSchema.parse(req.body);

      // Convert expiresAt string to Date if provided
      const postingData = {
        ...validatedData,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : undefined,
      };

      const posting = await careerService.createPosting(
        postingData,
        req.user?.id
      );

      res.status(201).json({
        success: true,
        message: "Career posting created successfully",
        data: posting,
      });
    } catch (error: any) {
      console.error("❌ Create career posting error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          message: error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to create career posting",
        message: error.message,
      });
    }
  }
);

/**
 * PUT /api/admin/careers/:id
 * Update a career posting
 */
router.put(
  "/admin/careers/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if user is admin
      const role = (req.user?.role || "").toLowerCase();
      if (!["super_admin", "admin"].includes(role)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required.",
        });
      }

      const { id } = req.params;

      // Validate request body
      const validatedData = updatePostingSchema.parse(req.body);

      // Convert expiresAt string to Date if provided
      const updateData: any = { ...validatedData };
      if (validatedData.expiresAt) {
        updateData.expiresAt = new Date(validatedData.expiresAt);
      }

      const posting = await careerService.updatePosting(id, updateData);

      res.json({
        success: true,
        message: "Career posting updated successfully",
        data: posting,
      });
    } catch (error: any) {
      console.error("❌ Update career posting error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          message: error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
          details: error.errors,
        });
      }

      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Career posting not found",
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to update career posting",
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/admin/careers/:id
 * Delete a career posting (soft delete)
 */
router.delete(
  "/admin/careers/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if user is admin
      const role = (req.user?.role || "").toLowerCase();
      if (!["super_admin", "admin"].includes(role)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required.",
        });
      }

      const { id } = req.params;

      const posting = await careerService.deletePosting(id);

      res.json({
        success: true,
        message: "Career posting deleted successfully",
        data: posting,
      });
    } catch (error: any) {
      console.error("❌ Delete career posting error:", error);

      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Career posting not found",
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to delete career posting",
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/admin/careers/:id/permanent
 * Permanently delete a career posting
 */
router.delete(
  "/admin/careers/:id/permanent",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if user is admin
      const role = (req.user?.role || "").toLowerCase();
      if (!["super_admin", "admin"].includes(role)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required.",
        });
      }

      const { id } = req.params;

      const posting = await careerService.permanentDeletePosting(id);

      res.json({
        success: true,
        message: "Career posting permanently deleted",
        data: posting,
      });
    } catch (error: any) {
      console.error("❌ Permanent delete career posting error:", error);

      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Career posting not found",
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to permanently delete career posting",
        message: error.message,
      });
    }
  }
);

export default router;

