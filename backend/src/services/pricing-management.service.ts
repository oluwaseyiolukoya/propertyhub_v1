import prisma from '../lib/db';
import {
  PROPERTY_OWNER_PLANS,
  PROPERTY_DEVELOPER_PLANS
} from './pricing-sync.service';

/**
 * Get the canonical pricing plan from code (source of truth)
 */
export function getCanonicalPlan(planId: string) {
  const allPlans = [...PROPERTY_OWNER_PLANS, ...PROPERTY_DEVELOPER_PLANS];
  return allPlans.find(p => p.id === planId);
}

/**
 * Check if a database plan matches the canonical version
 */
export function isPlanModified(dbPlan: any, canonicalPlan: any): boolean {
  if (!canonicalPlan) return true; // Plan doesn't exist in code

  // Compare key fields
  return (
    dbPlan.monthlyPrice !== canonicalPlan.price ||
    dbPlan.name !== canonicalPlan.name ||
    dbPlan.description !== canonicalPlan.description ||
    JSON.stringify(dbPlan.features) !== JSON.stringify(canonicalPlan.features.filter(f => f.included).map(f => f.text))
  );
}

/**
 * Get all plans with modification status
 */
export async function getPlansWithStatus() {
  try {
    const dbPlans = await prisma.plans.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { customers: true }
        }
      },
      orderBy: [
        { category: 'asc' },
        { monthlyPrice: 'asc' }
      ]
    });

    // Add modification status to each plan
    const plansWithStatus = dbPlans.map(dbPlan => {
      const canonicalPlan = getCanonicalPlan(dbPlan.id);
      const isModified = isPlanModified(dbPlan, canonicalPlan);

      return {
        ...dbPlan,
        isModified,
        hasCanonicalVersion: !!canonicalPlan,
        canonicalPlan: canonicalPlan ? {
          price: canonicalPlan.price,
          name: canonicalPlan.name,
          description: canonicalPlan.description,
          features: canonicalPlan.features.filter(f => f.included).map(f => f.text),
          limits: canonicalPlan.limits
        } : null
      };
    });

    return plansWithStatus;
  } catch (error) {
    console.error('Error fetching plans with status:', error);
    throw error;
  }
}

/**
 * Restore a plan to its canonical version
 */
export async function restorePlanToCanonical(planId: string) {
  try {
    const canonicalPlan = getCanonicalPlan(planId);

    if (!canonicalPlan) {
      throw new Error(`No canonical version found for plan: ${planId}`);
    }

    const category = canonicalPlan.userType === 'property-owner'
      ? 'property_management'
      : 'development';

    const annualPrice = canonicalPlan.price * 10;

    const features = canonicalPlan.features
      .filter(f => f.included)
      .map(f => f.text);

    const storageToMB = (storage: string): number => {
      if (storage === 'Unlimited') return 999999;
      const match = storage.match(/(\d+)(GB|MB)/);
      if (!match) return 1000;
      const value = parseInt(match[1]);
      const unit = match[2];
      return unit === 'GB' ? value * 1024 : value;
    };

    const updatedPlan = await prisma.plans.update({
      where: { id: planId },
      data: {
        name: canonicalPlan.name,
        description: canonicalPlan.description,
        category,
        monthlyPrice: canonicalPlan.price,
        annualPrice,
        currency: canonicalPlan.currency,
        propertyLimit: canonicalPlan.limits.properties || null,
        projectLimit: canonicalPlan.limits.projects || null,
        userLimit: canonicalPlan.limits.users > 0 ? canonicalPlan.limits.users : 999,
        storageLimit: storageToMB(canonicalPlan.limits.storage),
        features,
        isPopular: canonicalPlan.popular || false,
        updatedAt: new Date(),
      }
    });

    return updatedPlan;
  } catch (error) {
    console.error('Error restoring plan to canonical:', error);
    throw error;
  }
}

/**
 * Export plan configuration for code update
 * This generates TypeScript code that can be copied to pricing.ts
 */
export function exportPlanToCode(dbPlan: any): string {
  const userType = dbPlan.category === 'property_management'
    ? 'property-owner'
    : 'property-developer';

  const storageFromMB = (mb: number): string => {
    if (mb >= 999999) return 'Unlimited';
    if (mb >= 1024) return `${Math.floor(mb / 1024)}GB`;
    return `${mb}MB`;
  };

  const limits: any = {
    users: dbPlan.userLimit >= 999 ? -1 : dbPlan.userLimit,
    storage: storageFromMB(dbPlan.storageLimit),
  };

  if (dbPlan.category === 'property_management') {
    limits.properties = dbPlan.propertyLimit;
    limits.units = dbPlan.propertyLimit * 20; // Estimate
  } else {
    limits.projects = dbPlan.projectLimit;
  }

  const features = (dbPlan.features as string[]).map(text => ({
    text,
    included: true
  }));

  const planObject = {
    id: dbPlan.id,
    name: dbPlan.name,
    description: dbPlan.description,
    price: dbPlan.monthlyPrice,
    currency: dbPlan.currency,
    billingPeriod: 'month',
    userType,
    ...(dbPlan.isPopular && { popular: true }),
    limits,
    features,
    cta: {
      text: dbPlan.monthlyPrice > 50000 ? 'Contact Sales' : 'Start Free Trial',
      action: dbPlan.monthlyPrice > 50000 ? 'contact' : 'signup',
    }
  };

  return `  {\n${JSON.stringify(planObject, null, 4).slice(2, -2)}\n  },`;
}

/**
 * Get comparison between database and canonical versions
 */
export async function getPlansComparison() {
  try {
    const dbPlans = await prisma.plans.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { monthlyPrice: 'asc' }
      ]
    });

    const allCanonicalPlans = [...PROPERTY_OWNER_PLANS, ...PROPERTY_DEVELOPER_PLANS];

    const comparison = {
      inSync: [] as any[],
      modified: [] as any[],
      onlyInDatabase: [] as any[],
      onlyInCode: [] as any[],
    };

    // Check database plans
    for (const dbPlan of dbPlans) {
      const canonicalPlan = getCanonicalPlan(dbPlan.id);

      if (!canonicalPlan) {
        comparison.onlyInDatabase.push({
          id: dbPlan.id,
          name: dbPlan.name,
          category: dbPlan.category,
          monthlyPrice: dbPlan.monthlyPrice,
        });
      } else if (isPlanModified(dbPlan, canonicalPlan)) {
        comparison.modified.push({
          id: dbPlan.id,
          name: dbPlan.name,
          database: {
            price: dbPlan.monthlyPrice,
            name: dbPlan.name,
            features: dbPlan.features,
          },
          canonical: {
            price: canonicalPlan.price,
            name: canonicalPlan.name,
            features: canonicalPlan.features.filter(f => f.included).map(f => f.text),
          }
        });
      } else {
        comparison.inSync.push({
          id: dbPlan.id,
          name: dbPlan.name,
        });
      }
    }

    // Check for plans only in code
    for (const canonicalPlan of allCanonicalPlans) {
      const dbPlan = dbPlans.find(p => p.id === canonicalPlan.id);
      if (!dbPlan) {
        comparison.onlyInCode.push({
          id: canonicalPlan.id,
          name: canonicalPlan.name,
          price: canonicalPlan.price,
        });
      }
    }

    return comparison;
  } catch (error) {
    console.error('Error getting plans comparison:', error);
    throw error;
  }
}

