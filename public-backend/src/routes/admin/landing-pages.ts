import express, { Response } from "express";
import prisma from "../../lib/db";
import {
  adminAuthMiddleware,
  requireEditor,
  AdminAuthRequest,
} from "../../middleware/adminAuth";
import adminService from "../../services/admin.service";

const router = express.Router();

/**
 * GET /api/admin/landing-pages
 * List all landing pages
 */
router.get(
  "/",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { published, search } = req.query;

      const where: any = {};

      if (published !== undefined) {
        where.published = published === "true";
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: "insensitive" } },
          { slug: { contains: search as string, mode: "insensitive" } },
        ];
      }

      const pages = await prisma.landing_pages.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });

      return res.json({ pages });
    } catch (error: any) {
      console.error("List landing pages error:", error);
      return res.status(500).json({
        error: "Failed to fetch landing pages",
      });
    }
  }
);

/**
 * GET /api/admin/landing-pages/:id
 * Get single landing page
 */
router.get(
  "/:id",
  adminAuthMiddleware,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const page = await prisma.landing_pages.findUnique({
        where: { id },
      });

      if (!page) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      return res.json({ page });
    } catch (error: any) {
      console.error("Get landing page error:", error);
      return res.status(500).json({
        error: "Failed to fetch landing page",
      });
    }
  }
);

/**
 * POST /api/admin/landing-pages
 * Create new landing page
 */
router.post(
  "/",
  adminAuthMiddleware,
  requireEditor,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const {
        slug,
        title,
        subtitle,
        content,
        seoTitle,
        seoDescription,
        seoKeywords,
        coverImage,
        order,
        metadata,
      } = req.body;

      if (!slug || !title || !content) {
        return res.status(400).json({
          error: "Missing required fields: slug, title, content",
        });
      }

      // Check if slug already exists
      const existing = await prisma.landing_pages.findUnique({
        where: { slug },
      });

      if (existing) {
        return res.status(400).json({
          error: "Landing page with this slug already exists",
        });
      }

      const page = await prisma.landing_pages.create({
        data: {
          slug,
          title,
          subtitle,
          content,
          seoTitle,
          seoDescription,
          seoKeywords: seoKeywords || [],
          coverImage,
          order: order || 0,
          metadata,
          published: false, // Default to draft
        },
      });

      // Log activity
      if (req.admin) {
        await adminService.logActivity(
          req.admin.id,
          "create",
          "landing_page",
          page.id,
          { slug: page.slug, title: page.title },
          req.ip,
          req.headers["user-agent"]
        );
      }

      return res.status(201).json({
        message: "Landing page created successfully",
        page,
      });
    } catch (error: any) {
      console.error("Create landing page error:", error);
      return res.status(500).json({
        error: error.message || "Failed to create landing page",
      });
    }
  }
);

/**
 * PUT /api/admin/landing-pages/:id
 * Update landing page
 */
router.put(
  "/:id",
  adminAuthMiddleware,
  requireEditor,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        slug,
        title,
        subtitle,
        content,
        seoTitle,
        seoDescription,
        seoKeywords,
        coverImage,
        order,
        metadata,
        published,
      } = req.body;

      // Check if page exists
      const existing = await prisma.landing_pages.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      // If slug is being changed, check if new slug is available
      if (slug && slug !== existing.slug) {
        const slugExists = await prisma.landing_pages.findUnique({
          where: { slug },
        });

        if (slugExists) {
          return res.status(400).json({
            error: "Landing page with this slug already exists",
          });
        }
      }

      const updateData: any = {};
      if (slug !== undefined) updateData.slug = slug;
      if (title !== undefined) updateData.title = title;
      if (subtitle !== undefined) updateData.subtitle = subtitle;
      if (content !== undefined) updateData.content = content;
      if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
      if (seoDescription !== undefined)
        updateData.seoDescription = seoDescription;
      if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords;
      if (coverImage !== undefined) updateData.coverImage = coverImage;
      if (order !== undefined) updateData.order = order;
      if (metadata !== undefined) updateData.metadata = metadata;

      // Handle publish/unpublish
      if (published !== undefined) {
        updateData.published = published;
        if (published && !existing.publishedAt) {
          updateData.publishedAt = new Date();
        } else if (!published) {
          updateData.publishedAt = null;
        }
      }

      const page = await prisma.landing_pages.update({
        where: { id },
        data: updateData,
      });

      // Log activity
      if (req.admin) {
        await adminService.logActivity(
          req.admin.id,
          "update",
          "landing_page",
          page.id,
          { slug: page.slug, title: page.title, published: page.published },
          req.ip,
          req.headers["user-agent"]
        );
      }

      return res.json({
        message: "Landing page updated successfully",
        page,
      });
    } catch (error: any) {
      console.error("Update landing page error:", error);
      res.status(500).json({
        error: error.message || "Failed to update landing page",
      });
    }
  }
);

/**
 * DELETE /api/admin/landing-pages/:id
 * Delete landing page
 */
router.delete(
  "/:id",
  adminAuthMiddleware,
  requireEditor,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const page = await prisma.landing_pages.findUnique({
        where: { id },
      });

      if (!page) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      await prisma.landing_pages.delete({
        where: { id },
      });

      // Log activity
      if (req.admin) {
        await adminService.logActivity(
          req.admin.id,
          "delete",
          "landing_page",
          id,
          { slug: page.slug, title: page.title },
          req.ip,
          req.headers["user-agent"]
        );
      }

      return res.json({
        message: "Landing page deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete landing page error:", error);
      return res.status(500).json({
        error: "Failed to delete landing page",
      });
    }
  }
);

/**
 * POST /api/admin/landing-pages/:id/publish
 * Publish landing page
 */
router.post(
  "/:id/publish",
  adminAuthMiddleware,
  requireEditor,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const page = await prisma.landing_pages.findUnique({
        where: { id },
      });

      if (!page) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      const updated = await prisma.landing_pages.update({
        where: { id },
        data: {
          published: true,
          publishedAt: new Date(),
        },
      });

      // Log activity
      if (req.admin) {
        await adminService.logActivity(
          req.admin.id,
          "publish",
          "landing_page",
          id,
          { slug: page.slug, title: page.title },
          req.ip,
          req.headers["user-agent"]
        );
      }

      return res.json({
        message: "Landing page published successfully",
        page: updated,
      });
    } catch (error: any) {
      console.error("Publish landing page error:", error);
      res.status(500).json({
        error: "Failed to publish landing page",
      });
    }
  }
);

/**
 * POST /api/admin/landing-pages/:id/unpublish
 * Unpublish landing page
 */
router.post(
  "/:id/unpublish",
  adminAuthMiddleware,
  requireEditor,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const page = await prisma.landing_pages.findUnique({
        where: { id },
      });

      if (!page) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      const updated = await prisma.landing_pages.update({
        where: { id },
        data: {
          published: false,
          publishedAt: null,
        },
      });

      // Log activity
      if (req.admin) {
        await adminService.logActivity(
          req.admin.id,
          "unpublish",
          "landing_page",
          id,
          { slug: page.slug, title: page.title },
          req.ip,
          req.headers["user-agent"]
        );
      }

      return res.json({
        message: "Landing page unpublished successfully",
        page: updated,
      });
    } catch (error: any) {
      console.error("Unpublish landing page error:", error);
      return res.status(500).json({
        error: "Failed to unpublish landing page",
      });
    }
  }
);

export default router;
