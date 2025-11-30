import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { verificationClient } from '../services/verification-client.service';
import prisma from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { sendManualVerificationEmail, sendKYCRejectionEmail } from '../lib/email';

const router = express.Router();

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

    const result = await verificationClient.listRequests(
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
    const request = await verificationClient.getRequestDetails(requestId);
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
    const result = await verificationClient.approveRequest(requestId, adminUserId, notes);

    // Get details from verification request
    const verificationDetails = await verificationClient.getRequestDetails(requestId);
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
    const result = await verificationClient.rejectRequest(requestId, adminUserId, reason);

    // Get details from verification request
    const verificationDetails = await verificationClient.getRequestDetails(requestId);
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
    const analytics = await verificationClient.getAnalytics();
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

    const logs = await verificationClient.getProviderLogs(
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

    const result = await verificationClient.getDocumentDownloadUrl(
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
 */
router.delete('/requests/:requestId', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const adminUserId = req.user?.id;

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID not found' });
    }

    console.log('[Admin KYC] Deleting verification request:', requestId, 'by admin:', adminUserId);

    // Get details before deletion for logging
    let verificationDetails;
    try {
      verificationDetails = await verificationClient.getRequestDetails(requestId);
    } catch (error) {
      console.warn('[Admin KYC] Could not get verification details before deletion:', error);
    }

    // Call verification microservice to delete
    const result = await verificationClient.deleteRequest(requestId);

    // Log the deletion activity
    if (verificationDetails?.customerId) {
      try {
        await prisma.activity_logs.create({
          data: {
            id: uuidv4(),
            customerId: verificationDetails.customerId,
            userId: adminUserId,
            action: 'delete_verification_request',
            entity: 'verification_request',
            entityId: requestId,
            description: `Admin deleted verification request`,
            metadata: {
              requestId,
              customerType: verificationDetails.customerType,
              customerEmail: (verificationDetails as any).customerEmail
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
      message: 'Verification request deleted successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('[AdminVerificationRoutes] Delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete verification request' });
  }
});

export default router;

