import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AdminService } from '../services/verification/admin.service';
import prisma from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { sendManualVerificationEmail, sendKYCRejectionEmail } from '../lib/email';

const router = express.Router();

// Use direct service instead of HTTP client
const adminService = new AdminService();

/**
 * Middleware to check if user is admin
 */
const adminOnly = (req: AuthRequest, res: Response, next: Function) => {
  if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * List all verification requests
 * GET /api/admin/verification/requests
 * Query params: status, page, limit, email
 */
router.get('/requests', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20', email } = req.query;

    // Use direct service instead of HTTP client
    const result = await adminService.listRequests(
      status as string,
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      email as string
    );

    res.json(result);
  } catch (error: any) {
    console.error('[AdminVerificationRoutes] List error:', error);
    res.status(500).json({ error: error.message || 'Failed to list verification requests' });
  }
});

/**
 * Get request details
 * GET /api/admin/verification/requests/:requestId
 */
router.get('/requests/:requestId', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const request = await adminService.getRequestDetails(requestId);
    res.json(request);
  } catch (error: any) {
    console.error('[AdminVerificationRoutes] Details error:', error);
    res.status(500).json({ error: error.message || 'Failed to get request details' });
  }
});

/**
 * Approve verification request (Manual KYC approval by admin)
 * POST /api/admin/verification/requests/:requestId/approve
 *
 * Handles both customer-level (owners, developers) and user-level (tenants) KYC
 */
router.post('/requests/:requestId/approve', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;
    const adminUserId = req.user?.id;

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID not found' });
    }

    console.log('[Admin KYC] Approving verification request:', requestId, 'by admin:', adminUserId);

    // Call verification microservice to approve
    const result = await adminService.approveRequest(requestId, adminUserId, notes);

    // Get details from verification request
    const verificationDetails = await adminService.getRequestDetails(requestId);
    const referenceId = verificationDetails.customerId; // This could be customerId or userId (for tenants)
    const customerType = verificationDetails.customerType;
    const isTenant = customerType === 'tenant';

    let recipientEmail: string | null = null;
    let recipientName: string | null = null;
    let companyName = 'Contrezz';

    if (isTenant) {
      // For tenants, update user-level KYC
      const user = await prisma.users.findUnique({
        where: { id: referenceId },
        include: { customers: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await prisma.users.update({
        where: { id: referenceId },
        data: {
          kycStatus: 'verified', // Use 'verified' for tenants
          kycCompletedAt: new Date(),
          kycFailureReason: null,
        },
      });

      recipientEmail = user.email;
      recipientName = user.name;
      companyName = user.customers?.company || 'Your Property';

      // Log activity
      if (user.customerId) {
        await prisma.activity_logs.create({
          data: {
            id: uuidv4(),
            customerId: user.customerId,
            userId: adminUserId,
            action: 'manual_kyc_approval',
            entity: 'user',
            entityId: referenceId,
            description: `Admin manually approved tenant KYC for ${user.name}. Notes: ${notes || 'N/A'}`,
            metadata: { notes, requestId, userType: 'tenant' },
          },
        });
      }

      console.log('[Admin KYC] Tenant KYC manually verified:', referenceId);
    } else {
      // For non-tenants, update customer-level KYC
      await prisma.customers.update({
        where: { id: referenceId },
        data: {
          kycStatus: 'manually_verified',
          kycCompletedAt: new Date(),
          kycVerifiedBy: adminUserId,
          kycFailureReason: null,
          status: 'trial', // Activate trial for customers
        },
      });

      const customer = await prisma.customers.findUnique({ where: { id: referenceId } });

      if (customer) {
        recipientEmail = customer.email;
        recipientName = customer.owner || customer.company;
        companyName = customer.company || 'Your Company';

        // Log activity
        await prisma.activity_logs.create({
          data: {
            id: uuidv4(),
            customerId: referenceId,
            userId: adminUserId,
            action: 'manual_kyc_approval',
            entity: 'customer',
            entityId: referenceId,
            description: `Admin manually approved customer KYC. Notes: ${notes || 'N/A'}`,
            metadata: { notes, requestId },
          },
        });
      }

      console.log('[Admin KYC] Customer manually verified and trial activated:', referenceId);
    }

    // Send verification approval email
    let emailSent = false;
    if (recipientEmail && recipientName) {
      const loginUrl = process.env.PRODUCTION_SIGNIN_URL || process.env.FRONTEND_URL || 'https://app.contrezz.com/signin';

      emailSent = await sendManualVerificationEmail({
        customerName: recipientName,
        customerEmail: recipientEmail,
        companyName: companyName,
        loginUrl: loginUrl,
        adminNotes: notes,
      });

      if (emailSent) {
        console.log('[Admin KYC] ✅ Verification approval email sent to:', recipientEmail);
      } else {
        console.warn('[Admin KYC] ⚠️ Failed to send verification approval email to:', recipientEmail);
      }
    }

    res.json({
      success: true,
      message: isTenant ? 'Tenant KYC manually approved' : 'Customer KYC manually approved and trial activated',
      emailSent,
      data: result,
    });
  } catch (error: any) {
    console.error('[AdminVerificationRoutes] Approve error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve verification' });
  }
});

/**
 * Reject verification request (Manual KYC rejection by admin)
 * POST /api/admin/verification/requests/:requestId/reject
 *
 * Handles both customer-level (owners, developers) and user-level (tenants) KYC
 */
router.post('/requests/:requestId/reject', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const adminUserId = req.user?.id;

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID not found' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    console.log('[Admin KYC] Rejecting verification request:', requestId, 'by admin:', adminUserId);

    // Call verification microservice to reject
    const result = await adminService.rejectRequest(requestId, adminUserId, reason);

    // Get details from verification request
    const verificationDetails = await adminService.getRequestDetails(requestId);
    const referenceId = verificationDetails.customerId; // This could be customerId or userId (for tenants)
    const customerType = verificationDetails.customerType;
    const isTenant = customerType === 'tenant';

    let recipientEmail: string | null = null;
    let recipientName: string | null = null;
    let companyName = 'Contrezz';

    if (isTenant) {
      // For tenants, update user-level KYC
      const user = await prisma.users.findUnique({
        where: { id: referenceId },
        include: { customers: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await prisma.users.update({
        where: { id: referenceId },
        data: {
          kycStatus: 'rejected',
          kycFailureReason: reason,
        },
      });

      recipientEmail = user.email;
      recipientName = user.name;
      companyName = user.customers?.company || 'Your Property';

      // Log activity
      if (user.customerId) {
        await prisma.activity_logs.create({
          data: {
            id: uuidv4(),
            customerId: user.customerId,
            userId: adminUserId,
            action: 'manual_kyc_rejection',
            entity: 'user',
            entityId: referenceId,
            description: `Admin rejected tenant KYC for ${user.name}. Reason: ${reason}`,
            metadata: { reason, requestId, userType: 'tenant' },
          },
        });
      }

      console.log('[Admin KYC] Tenant KYC rejected:', referenceId);
    } else {
      // For non-tenants, update customer-level KYC
      await prisma.customers.update({
        where: { id: referenceId },
        data: {
          kycStatus: 'rejected',
          kycFailureReason: reason,
          // Do NOT grant trial status
        },
      });

      const customer = await prisma.customers.findUnique({ where: { id: referenceId } });

      if (customer) {
        recipientEmail = customer.email;
        recipientName = customer.owner || customer.company;
        companyName = customer.company || 'Your Company';

        // Log activity
        await prisma.activity_logs.create({
          data: {
            id: uuidv4(),
            customerId: referenceId,
            userId: adminUserId,
            action: 'manual_kyc_rejection',
            entity: 'customer',
            entityId: referenceId,
            description: `Admin rejected customer KYC. Reason: ${reason}`,
            metadata: { reason, requestId },
          },
        });
      }

      console.log('[Admin KYC] Customer KYC rejected:', referenceId);
    }

    // Send rejection email
    let emailSent = false;
    if (recipientEmail && recipientName) {
      const retryUrl = process.env.PRODUCTION_SIGNIN_URL || process.env.FRONTEND_URL || 'https://app.contrezz.com/signin';

      emailSent = await sendKYCRejectionEmail({
        customerName: recipientName,
        customerEmail: recipientEmail,
        companyName: companyName,
        rejectionReason: reason,
        retryUrl: retryUrl,
      });

      if (emailSent) {
        console.log('[Admin KYC] ✅ Rejection email sent to:', recipientEmail);
      } else {
        console.warn('[Admin KYC] ⚠️ Failed to send rejection email to:', recipientEmail);
      }
    }

    res.json({
      success: true,
      emailSent,
      message: 'Customer KYC rejected',
      data: result,
    });
  } catch (error: any) {
    console.error('[AdminVerificationRoutes] Reject error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject verification' });
  }
});

/**
 * Get analytics
 * GET /api/admin/verification/analytics
 */
router.get('/analytics', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await adminService.getAnalytics();
    res.json(analytics);
  } catch (error: any) {
    console.error('[AdminVerificationRoutes] Analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to get analytics' });
  }
});

/**
 * Get provider logs
 * GET /api/admin/verification/provider-logs
 */
router.get('/provider-logs', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { provider, limit = '50' } = req.query;

    const logs = await adminService.getProviderLogs(
      provider as string,
      parseInt(limit as string, 10)
    );

    res.json(logs);
  } catch (error: any) {
    console.error('[AdminVerificationRoutes] Provider logs error:', error);
    res.status(500).json({ error: error.message || 'Failed to get provider logs' });
  }
});

/**
 * Get document download URL (pre-signed)
 * GET /api/admin/verification/documents/:documentId/download
 */
router.get('/documents/:documentId/download', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const { expiresIn = '3600' } = req.query;

    const result = await adminService.getDocumentDownloadUrl(
      documentId,
      parseInt(expiresIn as string, 10)
    );

    res.json(result);
  } catch (error: any) {
    console.error('[AdminVerificationRoutes] Document download error:', error);
    res.status(500).json({ error: error.message || 'Failed to get document download URL' });
  }
});

/**
 * Delete verification request (admin)
 * DELETE /api/admin/verification/requests/:requestId
 *
 * This endpoint deletes the verification request and resets the customer/user's
 * KYC status so they can submit a new verification.
 */
router.delete('/requests/:requestId', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const adminUserId = req.user?.id;

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID not found' });
    }

    console.log('[Admin KYC] Deleting verification request:', requestId, 'by admin:', adminUserId);

    // Get details before deletion for logging and to reset KYC status
    let verificationDetails: any;
    try {
      verificationDetails = await adminService.getRequestDetails(requestId);
    } catch (error) {
      console.warn('[Admin KYC] Could not get verification details before deletion:', error);
    }

    // Call verification microservice to delete
    const result = await adminService.deleteRequest(requestId);

    // Reset KYC status so the user can submit a new verification
    if (verificationDetails?.customerId) {
      const referenceId = verificationDetails.customerId;
      const customerType = verificationDetails.customerType;
      const isTenant = customerType === 'tenant';

      if (isTenant) {
        // For tenants, reset user-level KYC
        console.log('[Admin KYC] Resetting tenant KYC status for user:', referenceId);
        await prisma.users.update({
          where: { id: referenceId },
          data: {
            kycStatus: null,
            kycVerificationId: null,
            kycCompletedAt: null,
            kycFailureReason: null,
            kycLastAttemptAt: null,
            kycOwnerApprovalStatus: null,
            kycReviewedByOwnerId: null,
            kycOwnerReviewedAt: null,
            kycOwnerNotes: null,
            requiresKyc: true, // Still require KYC - user needs to submit new verification
          },
        });
        console.log('[Admin KYC] ✅ Tenant KYC status reset - can now submit new verification');
      } else {
        // For non-tenants (owners, developers), reset customer-level KYC
        console.log('[Admin KYC] Resetting customer KYC status for customer:', referenceId);
        await prisma.customers.update({
          where: { id: referenceId },
          data: {
            kycStatus: null,
            kycVerificationId: null,
            kycCompletedAt: null,
            kycFailureReason: null,
            kycLastAttemptAt: null,
            kycVerifiedBy: null,
            requiresKyc: true, // Still require KYC - customer needs to submit new verification
          },
        });
        console.log('[Admin KYC] ✅ Customer KYC status reset - can now submit new verification');
      }

      // Log the deletion activity
      try {
        await prisma.activity_logs.create({
          data: {
            id: uuidv4(),
            customerId: isTenant ? undefined : referenceId,
            userId: adminUserId,
            action: 'delete_verification_request',
            entity: 'verification_request',
            entityId: requestId,
            description: `Admin deleted verification request and reset KYC status`,
            metadata: {
              requestId,
              customerType: verificationDetails.customerType,
              customerEmail: verificationDetails.customerEmail,
              kycStatusReset: true,
            },
          },
        });
      } catch (logError) {
        console.warn('[Admin KYC] Failed to create activity log for deletion:', logError);
      }
    }

    console.log('[Admin KYC] Verification request deleted:', requestId);

    res.json({
      success: true,
      message: 'Verification request deleted and KYC status reset. User can now submit a new verification.',
      data: result,
    });
  } catch (error: any) {
    console.error('[AdminVerificationRoutes] Delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete verification request' });
  }
});

/**
 * Reset customer/user KYC status (admin)
 * POST /api/admin/verification/customers/:customerId/reset
 *
 * - For non-tenant (customer-level KYC): resets customer KYC fields
 * - For tenant (user-level KYC): if a tenant ID is provided via query (?userId=...), resets user KYC fields
 * - Attempts to delete existing verification request from verification service when present
 */
router.post('/customers/:customerId/reset', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.params;
    const { userId } = (req.query || {}) as { userId?: string };
    const adminUserId = req.user?.id;

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID not found' });
    }

    // If userId provided, reset tenant (user-level) KYC
    if (userId) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, kycVerificationId: true, customerId: true, role: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Best-effort delete from verification service
      if (user.kycVerificationId) {
        try {
          await adminService.deleteRequest(user.kycVerificationId);
          console.log('[Admin KYC] 🗑️ Deleted tenant verification request from verification service:', user.kycVerificationId);
        } catch (e: any) {
          console.warn('[Admin KYC] ⚠️ Could not delete tenant verification from service:', e?.message);
        }
      }

      await prisma.users.update({
        where: { id: user.id },
        data: {
          kycStatus: null,
          kycVerificationId: null,
          kycCompletedAt: null,
          kycFailureReason: null,
          kycLastAttemptAt: null,
          kycOwnerApprovalStatus: null,
          kycReviewedByOwnerId: null,
          kycOwnerReviewedAt: null,
          kycOwnerNotes: null,
          requiresKyc: true
        }
      });

      // Log activity (attach to customer if available)
      try {
        await prisma.activity_logs.create({
          data: {
            id: uuidv4(),
            customerId: user.customerId || undefined,
            userId: adminUserId,
            action: 'reset_kyc_status',
            entity: 'user',
            entityId: user.id,
            description: `Admin reset tenant KYC status`,
            metadata: { userId: user.id }
          }
        });
      } catch (logError) {
        console.warn('[Admin KYC] Failed to create activity log for tenant reset:', logError);
      }

      return res.json({ success: true, message: 'Tenant KYC reset successfully' });
    }

    // Otherwise, reset customer-level KYC
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { id: true, kycVerificationId: true }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Best-effort delete from verification service
    if (customer.kycVerificationId) {
      try {
        await adminService.deleteRequest(customer.kycVerificationId);
        console.log('[Admin KYC] 🗑️ Deleted customer verification request from verification service:', customer.kycVerificationId);
      } catch (e: any) {
        console.warn('[Admin KYC] ⚠️ Could not delete customer verification from service:', e?.message);
      }
    }

    await prisma.customers.update({
      where: { id: customer.id },
      data: {
        kycStatus: null,
        kycVerificationId: null,
        kycCompletedAt: null,
        kycFailureReason: null,
        kycLastAttemptAt: null,
        kycVerifiedBy: null,
        requiresKyc: true
      }
    });

    try {
      await prisma.activity_logs.create({
        data: {
          id: uuidv4(),
          customerId: customer.id,
          userId: adminUserId,
          action: 'reset_kyc_status',
          entity: 'customer',
          entityId: customer.id,
          description: `Admin reset customer KYC status`,
          metadata: { customerId: customer.id }
        }
      });
    } catch (logError) {
      console.warn('[Admin KYC] Failed to create activity log for customer reset:', logError);
    }

    return res.json({ success: true, message: 'Customer KYC reset successfully' });
  } catch (error: any) {
    console.error('[AdminVerificationRoutes] Reset KYC error:', error);
    return res.status(500).json({ error: error.message || 'Failed to reset KYC' });
  }
});

export default router;

