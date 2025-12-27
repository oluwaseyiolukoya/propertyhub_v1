import express, { Request, Response } from "express";
import prisma from "../lib/db";

const router = express.Router();

/**
 * GET /api/landing-pages/slug/:slug
 * Get published landing page by slug (public endpoint)
 */
router.get(
  "/slug/:slug",
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { slug } = req.params;

      const page = await prisma.landing_pages.findUnique({
        where: { slug },
      });

      if (!page) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      // Only return published pages for public access
      if (!page.published) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      return res.json({
        success: true,
        page: {
          id: page.id,
          slug: page.slug,
          title: page.title,
          subtitle: page.subtitle,
          content: page.content,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoKeywords: page.seoKeywords,
          coverImage: page.coverImage,
        },
      });
    } catch (error: any) {
      console.error("Get public landing page by slug error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch landing page",
      });
    }
  }
);

export default router;
