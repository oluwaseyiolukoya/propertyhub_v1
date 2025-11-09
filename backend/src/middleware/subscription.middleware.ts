import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/db';

/**
 * Middleware to check subscription status and control access
 */
export async function checkSubscriptionStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = (req as any).user;

    if (!user || !user.customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const customer = await prisma.customers.findUnique({
      where: { id: user.customerId },
      select: {
        id: true,
        status: true,
        gracePeriodEndsAt: true,
        suspendedAt: true,
        trialEndsAt: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Allow access for trial and active accounts
    if (['trial', 'active'].includes(customer.status)) {
      return next();
    }

    // Check grace period
    if (customer.status === 'trial' && customer.gracePeriodEndsAt) {
      const now = new Date();
      if (customer.gracePeriodEndsAt > now) {
        // Allow read-only access during grace period
        (req as any).readOnly = true;
        return next();
      }
    }

    // Suspended - only allow billing/reactivation endpoints
    if (customer.status === 'suspended') {
      const allowedPaths = [
        '/api/subscription',
        '/api/payment-methods',
        '/api/auth',
      ];

      if (allowedPaths.some((path) => req.path.startsWith(path))) {
        return next();
      }

      return res.status(403).json({
        error: 'Account suspended',
        message: 'Please add a payment method to reactivate your account',
        code: 'ACCOUNT_SUSPENDED',
        reactivationUrl: '/billing/reactivate',
      });
    }

    return res.status(403).json({
      error: 'Account inactive',
      code: 'ACCOUNT_INACTIVE',
    });
  } catch (error) {
    console.error('[Subscription Middleware] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to block write operations during read-only mode (grace period)
 */
export function blockWriteOperations(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const readOnly = (req as any).readOnly;

  if (readOnly && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      error: 'Read-only access',
      message: 'Your account is in grace period. Add a payment method to restore full access.',
      code: 'READ_ONLY_MODE',
    });
  }

  next();
}

