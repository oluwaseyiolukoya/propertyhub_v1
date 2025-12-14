import express, { Request, Response } from "express";
import { careerService } from "../services/career.service";

const router = express.Router();

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

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Get public careers error:", error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: options,
    });
  } catch (error: any) {
    console.error("❌ Get filter options error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch filter options",
      message: error.message,
    });
  }
});

/**
 * GET /api/careers/stats
 * Get public career statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await careerService.getPublicStatistics();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("❌ Get career stats error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
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

    const posting = await careerService.getPostingById(id);

    if (!posting) {
      return res.status(404).json({
        success: false,
        error: "Career posting not found",
      });
    }

    return res.json({
      success: true,
      data: posting,
    });
  } catch (error: any) {
    console.error("❌ Get career posting error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch career posting",
      message: error.message,
    });
  }
});

export default router;
