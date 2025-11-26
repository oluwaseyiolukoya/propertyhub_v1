/**
 * KYC Verification Middleware
 *
 * This middleware enforces KYC verification for customers before allowing dashboard access.
 * Following the cursor rules for backend verification and security.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to require KYC verification before accessing protected routes
 *
 * @param req - Express request with authenticated user
 * @param res - Express response
 * @param next - Express next function
 *
 * Allows access if:
 * - KYC is not required for the customer
 * - KYC status is 'verified' (auto-verified by Dojah)
 * - KYC status is 'manually_verified' (admin approved)
 *
 * Blocks access if:
 * - KYC status is 'pending' (not started)
 * - KYC status is 'in_progress' (documents uploaded, awaiting verification)
 * - KYC status is 'pending_review' (failed Dojah, awaiting admin review)
 * - KYC status is 'rejected' (admin rejected)
 */
export const requireKycVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    if (!customerId) {
      return res.status(403).json({
        error: 'Customer account required',
        kycRequired: false,
      });
    }

    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: {
        kycStatus: true,
        requiresKyc: true,
        kycFailureReason: true,
        kycVerificationId: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Allow access if KYC not required or already verified
    // Valid completed statuses: 'verified' (auto by Dojah) or 'manually_verified' (admin)
    if (
      !customer.requiresKyc ||
      customer.kycStatus === 'verified' ||
      customer.kycStatus === 'manually_verified'
    ) {
      return next();
    }

    // Block access if KYC pending, in progress, pending review, or rejected
    console.log(`[KYC Middleware] Blocking access for customer ${customerId}: KYC status = ${customer.kycStatus}`);

    return res.status(403).json({
      error: 'KYC verification required',
      kycRequired: true,
      kycStatus: customer.kycStatus,
      kycFailureReason: customer.kycFailureReason,
      kycVerificationId: customer.kycVerificationId,
      message: getKycStatusMessage(customer.kycStatus),
    });
  } catch (error) {
    console.error('[KYC Middleware] Error:', error);
    return res.status(500).json({ error: 'Failed to check KYC status' });
  }
};

/**
 * Helper function to get user-friendly message based on KYC status
 */
function getKycStatusMessage(kycStatus: string | null): string {
  switch (kycStatus) {
    case 'pending':
      return 'Please complete your identity verification to access the dashboard.';
    case 'in_progress':
      return 'Your identity verification is in progress. Please wait while we verify your documents.';
    case 'pending_review':
      return 'Your documents are under review by our admin team. You will be notified once the review is complete.';
    case 'rejected':
      return 'Your identity verification was rejected. Please contact support or retry with correct documents.';
    default:
      return 'Identity verification required to access the dashboard.';
  }
}

