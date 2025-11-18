import express from 'express';
import { adminOnly } from '../middleware/auth';
import prisma from '../lib/db';
import { syncPricingPlansToDatabase, getPricingPlans } from '../services/pricing-sync.service';
import {
  getPlansWithStatus,
  restorePlanToCanonical,
  exportPlanToCode,
  getPlansComparison
} from '../services/pricing-management.service';

const router = express.Router();

/**
 * @route POST /api/pricing-sync/sync
 * @desc Sync pricing plans from code to database
 * @access Admin only
 */
router.post('/sync', adminOnly, async (req, res) => {
  try {
    console.log('📥 Received pricing sync request from admin');

    const result = await syncPricingPlansToDatabase();

    if (result.success) {
      res.json({
        success: true,
        message: `Successfully synced pricing plans: ${result.created} created, ${result.updated} updated`,
        data: {
          created: result.created,
          updated: result.updated,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Pricing sync completed with errors',
        errors: result.errors,
        data: {
          created: result.created,
          updated: result.updated,
        },
      });
    }
  } catch (error: any) {
    console.error('❌ Pricing sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync pricing plans',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/pricing-sync/plans
 * @desc Get all pricing plans from database with modification status
 * @access Admin only
 */
router.get('/plans', adminOnly, async (req, res) => {
  try {
    const plans = await getPlansWithStatus();

    res.json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    console.error('❌ Error fetching pricing plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing plans',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/pricing-sync/restore/:planId
 * @desc Restore a plan to its canonical version from code
 * @access Admin only
 */
router.post('/restore/:planId', adminOnly, async (req, res) => {
  try {
    const { planId } = req.params;
    console.log(`📥 Restoring plan ${planId} to canonical version`);

    const restoredPlan = await restorePlanToCanonical(planId);

    res.json({
      success: true,
      message: `Plan "${restoredPlan.name}" restored to landing page version`,
      data: restoredPlan,
    });
  } catch (error: any) {
    console.error('❌ Error restoring plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore plan',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/pricing-sync/export/:planId
 * @desc Export a plan as TypeScript code for pricing.ts
 * @access Admin only
 */
router.get('/export/:planId', adminOnly, async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await prisma.plans.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }

    const codeExport = exportPlanToCode(plan);

    res.json({
      success: true,
      data: {
        planId: plan.id,
        planName: plan.name,
        code: codeExport,
      },
    });
  } catch (error: any) {
    console.error('❌ Error exporting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export plan',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/pricing-sync/comparison
 * @desc Get comparison between database and code versions
 * @access Admin only
 */
router.get('/comparison', adminOnly, async (req, res) => {
  try {
    const comparison = await getPlansComparison();

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    console.error('❌ Error getting comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comparison',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/pricing-sync/verify
 * @desc Verify if database plans match code (detailed diagnostic)
 * @access Admin only
 */
router.get('/verify', adminOnly, async (req, res) => {
  try {
    console.log('📋 Starting pricing verification...');

    const dbPlans = await prisma.plans.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { monthlyPrice: 'asc' }]
    });

    console.log(`✅ Found ${dbPlans.length} plans in database`);

    const { PROPERTY_OWNER_PLANS, PROPERTY_DEVELOPER_PLANS } = await import('../services/pricing-sync.service');
    const allCanonicalPlans = [...PROPERTY_OWNER_PLANS, ...PROPERTY_DEVELOPER_PLANS];

    console.log(`✅ Found ${allCanonicalPlans.length} canonical plans in code`);

    const verification = {
      totalInCode: allCanonicalPlans.length,
      totalInDatabase: dbPlans.length,
      matches: [] as any[],
      mismatches: [] as any[],
      missingInDatabase: [] as any[],
      missingInCode: [] as any[],
    };

    // Check each canonical plan
    for (const canonicalPlan of allCanonicalPlans) {
      const dbPlan = dbPlans.find(p => p.id === canonicalPlan.id);

      if (!dbPlan) {
        verification.missingInDatabase.push({
          id: canonicalPlan.id,
          name: canonicalPlan.name,
          price: canonicalPlan.price,
        });
        continue;
      }

      const category = canonicalPlan.userType === 'property-owner'
        ? 'property_management'
        : 'development';

      const canonicalFeatures = canonicalPlan.features
        .filter(f => f.included)
        .map(f => f.text)
        .sort();

      const dbFeatures = Array.isArray(dbPlan.features)
        ? [...dbPlan.features].sort()
        : [];

      const matches = (
        dbPlan.monthlyPrice === canonicalPlan.price &&
        dbPlan.name === canonicalPlan.name &&
        dbPlan.description === canonicalPlan.description &&
        dbPlan.category === category &&
        JSON.stringify(canonicalFeatures) === JSON.stringify(dbFeatures)
      );

      if (matches) {
        verification.matches.push({
          id: canonicalPlan.id,
          name: canonicalPlan.name,
        });
      } else {
        verification.mismatches.push({
          id: canonicalPlan.id,
          name: canonicalPlan.name,
          differences: {
            price: {
              code: canonicalPlan.price,
              database: dbPlan.monthlyPrice,
              match: dbPlan.monthlyPrice === canonicalPlan.price,
            },
            name: {
              code: canonicalPlan.name,
              database: dbPlan.name,
              match: dbPlan.name === canonicalPlan.name,
            },
            description: {
              code: canonicalPlan.description,
              database: dbPlan.description,
              match: dbPlan.description === canonicalPlan.description,
            },
            category: {
              code: category,
              database: dbPlan.category,
              match: dbPlan.category === category,
            },
            features: {
              code: canonicalFeatures,
              database: dbFeatures,
              match: JSON.stringify(canonicalFeatures) === JSON.stringify(dbFeatures),
            },
          },
        });
      }
    }

    // Check for plans in database but not in code
    for (const dbPlan of dbPlans) {
      const canonicalPlan = allCanonicalPlans.find(p => p.id === dbPlan.id);
      if (!canonicalPlan) {
        verification.missingInCode.push({
          id: dbPlan.id,
          name: dbPlan.name,
          price: dbPlan.monthlyPrice,
          category: dbPlan.category,
        });
      }
    }

    const response = {
      success: true,
      data: verification,
      summary: {
        allMatch: verification.mismatches.length === 0 &&
                  verification.missingInDatabase.length === 0,
        needsSync: verification.mismatches.length > 0 ||
                  verification.missingInDatabase.length > 0,
      },
    };

    console.log('✅ Verification complete:', {
      matches: verification.matches.length,
      mismatches: verification.mismatches.length,
      missingInDB: verification.missingInDatabase.length,
      missingInCode: verification.missingInCode.length,
    });

    res.json(response);
  } catch (error: any) {
    console.error('❌ Error verifying plans:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to verify plans',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

export default router;

