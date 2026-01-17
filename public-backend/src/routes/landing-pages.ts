import express, { Request, Response } from "express";
import prisma from "../lib/db";

const router = express.Router();

/**
 * GET /api/landing-pages/debug/home
 * Debug endpoint to check home page status (only in development)
 */
if (process.env.NODE_ENV === 'development') {
  router.get(
    "/debug/home",
    async (req: Request, res: Response): Promise<Response | void> => {
      try {
        console.log('[Debug] Checking home page status...');

        const homePage = await prisma.landing_pages.findUnique({
          where: { slug: 'home' },
        });

        if (!homePage) {
          return res.json({
            found: false,
            message: 'Home page not found in database',
          });
        }

        return res.json({
          found: true,
          page: {
            id: homePage.id,
            slug: homePage.slug,
            title: homePage.title,
            published: homePage.published,
            publishedAt: homePage.publishedAt,
            hasContent: !!homePage.content,
            contentPreview: homePage.content && typeof homePage.content === 'object' ? {
              hasHero: !!(homePage.content as any).hero,
              heroHeadline: (homePage.content as any).hero?.headline,
              statsCount: (homePage.content as any).stats?.length || 0,
              featuresCount: (homePage.content as any).features?.length || 0,
            } : null,
            createdAt: homePage.createdAt,
            updatedAt: homePage.updatedAt,
          },
        });
      } catch (error: any) {
        console.error('[Debug] Error checking home page:', error);
        return res.status(500).json({
          error: 'Failed to check home page',
          details: error.message,
        });
      }
    }
  );
}

/**
 * GET /api/landing-pages/slug/:slug
 * Get published landing page by slug (public endpoint)
 */
router.get(
  "/slug/:slug",
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { slug } = req.params;
      console.log(`[Public Landing Pages] Fetching page with slug: ${slug}`);

      // Set cache control headers to prevent browser/CDN caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const page = await prisma.landing_pages.findUnique({
        where: { slug },
      });

      if (!page) {
        console.log(`[Public Landing Pages] Page with slug "${slug}" not found in database`);
        return res.status(404).json({ error: "Landing page not found" });
      }

      console.log(`[Public Landing Pages] Found page: ${page.id}, published: ${page.published}`);

      // Only return published pages for public access
      if (!page.published) {
        console.log(`[Public Landing Pages] Page "${slug}" exists but is not published`);
        return res.status(404).json({ error: "Landing page not found" });
      }

      console.log(`[Public Landing Pages] Returning published page content for "${slug}"`);
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
          published: page.published,
          updatedAt: page.updatedAt,
        },
      });
    } catch (error: any) {
      console.error("[Public Landing Pages] Get public landing page by slug error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch landing page",
      });
    }
  }
);

export default router;
