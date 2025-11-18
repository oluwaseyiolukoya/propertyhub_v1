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
    const plans = await prisma.plans.findMany({
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
      },
      orderBy: [
        { category: 'asc' },
        { monthlyPrice: 'asc' }
      ]
    });

    console.log('[Public Plans] Found', plans.length, 'active plans');

    return res.json({
      success: true,
      data: plans
    });
  } catch (error: any) {
    console.error('[Public Plans] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch plans'
    });
  }
});

export default router;

