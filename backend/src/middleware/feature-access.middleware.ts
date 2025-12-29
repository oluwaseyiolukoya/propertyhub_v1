/**
 * Feature Access Middleware
 * Checks if a customer's plan includes a specific feature
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    customerId?: string;
    role?: string;
  };
}

/**
 * Middleware to check if customer has access to a specific feature
 * @param featureName - Name of the feature to check (e.g., 'tax_calculator')
 */
export function requireFeature(featureName: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user || !user.customerId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get customer with plan
      const customer = await prisma.customers.findUnique({
        where: { id: user.customerId },
        include: {
          plans: {
            select: {
              id: true,
              name: true,
              features: true,
            },
          },
        },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if customer has a plan
      if (!customer.plans) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `This feature requires a subscription plan. Please upgrade to access ${featureName}.`,
          code: 'FEATURE_NOT_AVAILABLE',
          requiredFeature: featureName,
        });
      }

      // Parse features (can be array or object)
      let features: string[] = [];
      if (Array.isArray(customer.plans.features)) {
        features = customer.plans.features;
      } else if (typeof customer.plans.features === 'object' && customer.plans.features !== null) {
        // If it's an object, check if it has an array property
        const featuresObj = customer.plans.features as any;
        if (Array.isArray(featuresObj.features)) {
          features = featuresObj.features;
        } else if (Array.isArray(featuresObj.list)) {
          features = featuresObj.list;
        } else {
          // Try to extract feature names from object
          features = Object.keys(featuresObj).filter(
            (key) => featuresObj[key] === true || featuresObj[key] === 'enabled'
          );
        }
      } else if (typeof customer.plans.features === 'string') {
        try {
          const parsed = JSON.parse(customer.plans.features);
          if (Array.isArray(parsed)) {
            features = parsed;
          }
        } catch {
          // If parsing fails, treat as single feature string
          features = [customer.plans.features];
        }
      }

      // Check if feature is included
      // Normalize both feature name and available features for comparison
      // Handle variations: "Tax Calculator", "tax_calculator", "tax calculator"
      const normalizedFeatureName = featureName.toLowerCase().replace(/[_\s]/g, '');
      const hasFeature = features.some((f) => {
        const normalizedF = f.toLowerCase().replace(/[_\s]/g, '');
        return (
          normalizedF === normalizedFeatureName ||
          normalizedF.includes(normalizedFeatureName) ||
          normalizedFeatureName.includes(normalizedF)
        );
      });

      // Debug logging
      console.log('[Feature Access] Checking feature access:', {
        customerId: customer.id,
        planName: customer.plans.name,
        planId: customer.plans.id,
        requiredFeature: featureName,
        availableFeatures: features,
        hasFeature,
      });

      if (!hasFeature) {
        console.warn('[Feature Access] Feature not available:', {
          customerId: customer.id,
          planName: customer.plans.name,
          requiredFeature: featureName,
          availableFeatures: features,
        });
        return res.status(403).json({
          error: 'Feature not available',
          message: `This feature is not included in your current plan (${customer.plans.name}). Please upgrade to a plan that includes ${featureName}.`,
          code: 'FEATURE_NOT_AVAILABLE',
          requiredFeature: featureName,
          currentPlan: customer.plans.name,
          availableFeatures: features, // Include for debugging
        });
      }

      // Feature is available, continue
      next();
    } catch (error) {
      console.error('[Feature Access Middleware] Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Helper function to check if a customer has a feature (for use in services)
 */
export async function hasFeature(
  customerId: string,
  featureName: string
): Promise<boolean> {
  try {
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      include: {
        plans: {
          select: {
            features: true,
          },
        },
      },
    });

    if (!customer || !customer.plans) {
      return false;
    }

    // Parse features
    let features: string[] = [];
    if (Array.isArray(customer.plans.features)) {
      features = customer.plans.features;
    } else if (typeof customer.plans.features === 'object' && customer.plans.features !== null) {
      const featuresObj = customer.plans.features as any;
      if (Array.isArray(featuresObj.features)) {
        features = featuresObj.features;
      } else if (Array.isArray(featuresObj.list)) {
        features = featuresObj.list;
      } else {
        features = Object.keys(featuresObj).filter(
          (key) => featuresObj[key] === true || featuresObj[key] === 'enabled'
        );
      }
    }

    // Normalize both feature name and available features for comparison
    // Handle variations: "Tax Calculator", "tax_calculator", "tax calculator"
    const normalizedFeatureName = featureName.toLowerCase().replace(/[_\s]/g, '');
    return features.some((f) => {
      const normalizedF = f.toLowerCase().replace(/[_\s]/g, '');
      return (
        normalizedF === normalizedFeatureName ||
        normalizedF.includes(normalizedFeatureName) ||
        normalizedFeatureName.includes(normalizedF)
      );
    });
  } catch (error) {
    console.error('[hasFeature] Error:', error);
    return false;
  }
}

