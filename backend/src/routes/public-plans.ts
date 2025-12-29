import express, { Request, Response } from 'express';
import prisma from '../lib/db';

const router = express.Router();

/**
 * GET /api/public/plans
 * Get all active plans for public display (landing page)
 * No authentication required
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    console.log('[Public Plans] Fetching active plans for landing page');

    // Set cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Fetch all active plans
    let plans;
    try {
      plans = await prisma.plans.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          monthlyPrice: true,
          annualPrice: true,
          currency: true,
          propertyLimit: true,
          projectLimit: true,
          userLimit: true,
          storageLimit: true,
          features: true,
          isPopular: true,
          trialDurationDays: true
        }
      });
    } catch (dbError: any) {
      console.error('[Public Plans] Database error:', dbError);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    // Sort plans: first by category, then by monthlyPrice (handle nulls)
    const sortedPlans = (plans || []).sort((a, b) => {
      // First sort by category
      const categoryA = a.category || '';
      const categoryB = b.category || '';
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }
      // Then sort by monthlyPrice (nulls go to end)
      const priceA = a.monthlyPrice ?? Infinity;
      const priceB = b.monthlyPrice ?? Infinity;
      return priceA - priceB;
    });

    console.log('[Public Plans] Found', sortedPlans.length, 'active plans');
    if (sortedPlans.length > 0) {
      console.log('[Public Plans] Plan prices:', sortedPlans.map(p => ({
        id: p.id,
        name: p.name,
        monthlyPrice: p.monthlyPrice,
        annualPrice: p.annualPrice,
        category: p.category
      })));
    }

    return res.json({
      success: true,
      data: sortedPlans
    });
  } catch (error: any) {
    console.error('[Public Plans] Error:', error);
    if (error.stack) {
      console.error('[Public Plans] Error stack:', error.stack);
    }
    console.error('[Public Plans] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      name: error.name
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch plans',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

