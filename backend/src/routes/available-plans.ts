import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

/**
 * GET /api/available-plans
 * Get available plans filtered by user's role/category
 * Property owners/managers see property_management plans
 * Developers see development plans
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user with customer info
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        customers: {
          select: {
            id: true,
            planCategory: true,
            planId: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine plan category based on user role
    let planCategory: string;

    if (user.role === 'developer' || user.role === 'property-developer') {
      planCategory = 'development';
    } else if (user.role === 'owner' || user.role === 'manager') {
      planCategory = 'property_management';
    } else {
      // Default to property_management for other roles
      planCategory = 'property_management';
    }

    // If customer has a plan category set, use that instead
    if (user.customers?.planCategory) {
      planCategory = user.customers.planCategory;
    }

    console.log('[Available Plans] User:', user.email, 'Role:', user.role, 'Category:', planCategory);

    // Fetch active plans for the user's category
    const plans = await prisma.plans.findMany({
      where: {
        category: planCategory,
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
        { monthlyPrice: 'asc' }
      ]
    });

    console.log('[Available Plans] Found', plans.length, 'plans for category:', planCategory);

    return res.json({
      plans,
      category: planCategory,
      currentPlanId: user.customers?.planId || null
    });
  } catch (error: any) {
    console.error('[Available Plans] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch available plans' });
  }
});

export default router;

