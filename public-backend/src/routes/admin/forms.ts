import express, { Request, Response } from "express";
import prisma from "../../lib/db";
import { adminAuthMiddleware } from "../../middleware/adminAuth";

const router = express.Router();

/**
 * GET /api/admin/forms/stats
 * Get statistics for all form types (admin only)
 */
router.get(
  "/stats",
  adminAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { dateFrom, dateTo } = req.query;

      // Build date filter
      const dateFilter: any = {};
      if (dateFrom) {
        dateFilter.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        dateFilter.lte = new Date(dateTo as string);
      }

      const whereClause =
        Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

      // Get stats by form type
      const formTypes = ["contact", "demo", "sales", "support"];

      const statsByType = await Promise.all(
        formTypes.map(async (formType) => {
          const where = { ...whereClause, formType };

          const [
            total,
            newCount,
            contacted,
            qualified,
            closed,
            byPriority,
            recent,
          ] = await Promise.all([
            prisma.contact_submissions.count({ where }),
            prisma.contact_submissions.count({
              where: { ...where, status: "new" },
            }),
            prisma.contact_submissions.count({
              where: { ...where, status: "contacted" },
            }),
            prisma.contact_submissions.count({
              where: { ...where, status: "qualified" },
            }),
            prisma.contact_submissions.count({
              where: { ...where, status: "closed" },
            }),
            prisma.contact_submissions.groupBy({
              by: ["priority"],
              where,
              _count: true,
            }),
            prisma.contact_submissions.findMany({
              where,
              orderBy: { createdAt: "desc" },
              take: 5,
              select: {
                id: true,
                name: true,
                email: true,
                formType: true,
                status: true,
                createdAt: true,
              },
            }),
          ]);

          return {
            formType,
            total,
            byStatus: {
              new: newCount,
              contacted,
              qualified,
              closed,
            },
            byPriority: byPriority.reduce((acc, item) => {
              acc[item.priority] = item._count;
              return acc;
            }, {} as Record<string, number>),
            recent,
          };
        })
      );

      // Get overall stats
      const overallWhere = whereClause;

      // Calculate date range for trends
      const startDate = dateFrom
        ? new Date(dateFrom as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateTo ? new Date(dateTo as string) : new Date();

      // Get overall stats
      const [
        totalSubmissions,
        totalNew,
        totalContacted,
        totalQualified,
        totalClosed,
      ] = await Promise.all([
        prisma.contact_submissions.count({ where: overallWhere }),
        prisma.contact_submissions.count({
          where: { ...overallWhere, status: "new" },
        }),
        prisma.contact_submissions.count({
          where: { ...overallWhere, status: "contacted" },
        }),
        prisma.contact_submissions.count({
          where: { ...overallWhere, status: "qualified" },
        }),
        prisma.contact_submissions.count({
          where: { ...overallWhere, status: "closed" },
        }),
      ]);

      // Get submissions grouped by day (separate query to avoid Promise.all complexity)
      const submissions = await prisma.contact_submissions.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
      });

      // Group by date
      const grouped = submissions.reduce((acc, sub) => {
        const date = sub.createdAt.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const submissionsByDay = Object.entries(grouped)
        .map(([date, count]) => ({
          date: new Date(date),
          count: count,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return res.json({
        success: true,
        data: {
          overall: {
            total: totalSubmissions,
            new: totalNew,
            contacted: totalContacted,
            qualified: totalQualified,
            closed: totalClosed,
          },
          byFormType: statsByType,
          trends: submissionsByDay.map((item) => ({
            date: item.date.toISOString().split("T")[0],
            count: item.count,
          })),
        },
      });
    } catch (error: any) {
      console.error("❌ Error fetching form stats:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch statistics",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Please try again",
      });
    }
  }
);

/**
 * GET /api/admin/forms/contact-us
 * Get all Contact Us submissions (admin only)
 */
router.get(
  "/contact-us",
  adminAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const {
        status,
        priority,
        search,
        page = "1",
        limit = "20",
        dateFrom,
        dateTo,
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {
        formType: "contact", // Contact Us forms are stored as "contact"
      };

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = priority;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: "insensitive" } },
          { email: { contains: search as string, mode: "insensitive" } },
          { company: { contains: search as string, mode: "insensitive" } },
          { subject: { contains: search as string, mode: "insensitive" } },
          { message: { contains: search as string, mode: "insensitive" } },
        ];
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo as string);
        }
      }

      // Get submissions with pagination
      const [submissions, total] = await Promise.all([
        prisma.contact_submissions.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.contact_submissions.count({ where }),
      ]);

      // Get stats
      const [newCount, contacted, qualified, closed] = await Promise.all([
        prisma.contact_submissions.count({
          where: { ...where, status: "new" },
        }),
        prisma.contact_submissions.count({
          where: { ...where, status: "contacted" },
        }),
        prisma.contact_submissions.count({
          where: { ...where, status: "qualified" },
        }),
        prisma.contact_submissions.count({
          where: { ...where, status: "closed" },
        }),
      ]);

      return res.json({
        success: true,
        data: {
          submissions,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
          stats: {
            total,
            new: newCount,
            contacted,
            qualified,
            closed,
          },
        },
      });
    } catch (error: any) {
      console.error("❌ Error fetching contact us submissions:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch submissions",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Please try again",
      });
    }
  }
);

/**
 * GET /api/admin/forms/contact-us/:id
 * Get a single Contact Us submission (admin only)
 */
router.get(
  "/contact-us/:id",
  adminAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const submission = await prisma.contact_submissions.findUnique({
        where: { id },
      });

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: "Submission not found",
        });
      }

      return res.json({
        success: true,
        data: submission,
      });
    } catch (error: any) {
      console.error("❌ Error fetching contact us submission:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch submission",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Please try again",
      });
    }
  }
);

/**
 * PATCH /api/admin/forms/contact-us/:id
 * Update a Contact Us submission (admin only)
 */
router.patch(
  "/contact-us/:id",
  adminAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, priority, adminNotes } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

      if (status === "contacted" && !updateData.contactedAt) {
        updateData.contactedAt = new Date();
      }
      if (status === "closed" && !updateData.closedAt) {
        updateData.closedAt = new Date();
      }

      const submission = await prisma.contact_submissions.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        data: submission,
        message: "Submission updated successfully",
      });
    } catch (error: any) {
      console.error("❌ Error updating contact us submission:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update submission",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Please try again",
      });
    }
  }
);

/**
 * DELETE /api/admin/forms/contact-us/:id
 * Delete a Contact Us submission (admin only)
 */
router.delete(
  "/contact-us/:id",
  adminAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.contact_submissions.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: "Submission deleted successfully",
      });
    } catch (error: any) {
      console.error("❌ Error deleting contact us submission:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete submission",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Please try again",
      });
    }
  }
);

/**
 * GET /api/admin/forms/schedule-demo
 * Get all Schedule Demo submissions (admin only)
 */
router.get(
  "/schedule-demo",
  adminAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const {
        status,
        priority,
        search,
        page = "1",
        limit = "20",
        dateFrom,
        dateTo,
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {
        formType: "demo", // Schedule demo forms are stored as "demo"
      };

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = priority;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: "insensitive" } },
          { email: { contains: search as string, mode: "insensitive" } },
          { company: { contains: search as string, mode: "insensitive" } },
          { message: { contains: search as string, mode: "insensitive" } },
        ];
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo as string);
        }
      }

      // Get submissions
      const [submissions, total] = await Promise.all([
        prisma.contact_submissions.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.contact_submissions.count({ where }),
      ]);

      // Get statistics
      const stats = {
        total: await prisma.contact_submissions.count({
          where: { formType: "demo" },
        }),
        new: await prisma.contact_submissions.count({
          where: { formType: "demo", status: "new" },
        }),
        contacted: await prisma.contact_submissions.count({
          where: { formType: "demo", status: "contacted" },
        }),
        qualified: await prisma.contact_submissions.count({
          where: { formType: "demo", status: "qualified" },
        }),
        closed: await prisma.contact_submissions.count({
          where: { formType: "demo", status: "closed" },
        }),
      };

      return res.json({
        success: true,
        data: submissions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        stats,
      });
    } catch (error: any) {
      console.error("❌ Error fetching schedule demo submissions:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch submissions",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Please try again",
      });
    }
  }
);

/**
 * GET /api/admin/forms/schedule-demo/:id
 * Get single submission by ID
 */
router.get(
  "/schedule-demo/:id",
  adminAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const submission = await prisma.contact_submissions.findUnique({
        where: { id },
      });

      if (!submission || submission.formType !== "demo") {
        return res.status(404).json({
          success: false,
          error: "Submission not found",
        });
      }

      return res.json({
        success: true,
        data: submission,
      });
    } catch (error: any) {
      console.error("❌ Error fetching submission:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch submission",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Please try again",
      });
    }
  }
);

/**
 * PATCH /api/admin/forms/schedule-demo/:id
 * Update submission status, priority, or notes
 */
router.patch(
  "/schedule-demo/:id",
  adminAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, priority, adminNotes } = req.body;

      const submission = await prisma.contact_submissions.findUnique({
        where: { id },
      });

      if (!submission || submission.formType !== "demo") {
        return res.status(404).json({
          success: false,
          error: "Submission not found",
        });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
      if (status === "contacted" && !submission.contactedAt) {
        updateData.contactedAt = new Date();
      }
      if (status === "closed" && !submission.closedAt) {
        updateData.closedAt = new Date();
      }

      const updated = await prisma.contact_submissions.update({
        where: { id },
        data: updateData,
      });

      return res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      console.error("❌ Error updating submission:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update submission",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Please try again",
      });
    }
  }
);

/**
 * DELETE /api/admin/forms/schedule-demo/:id
 * Delete submission (soft delete by setting status to closed)
 */
router.delete(
  "/schedule-demo/:id",
  adminAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const submission = await prisma.contact_submissions.findUnique({
        where: { id },
      });

      if (!submission || submission.formType !== "demo") {
        return res.status(404).json({
          success: false,
          error: "Submission not found",
        });
      }

      // Soft delete by setting status to closed
      await prisma.contact_submissions.update({
        where: { id },
        data: {
          status: "closed",
          closedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: "Submission deleted successfully",
      });
    } catch (error: any) {
      console.error("❌ Error deleting submission:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete submission",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Please try again",
      });
    }
  }
);

export default router;
