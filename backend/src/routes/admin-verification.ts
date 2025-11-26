import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { verificationClient } from '../services/verification-client.service';
import prisma from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

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

    // Get customer ID from verification request
    const verificationDetails = await verificationClient.getRequestDetails(requestId);
    const customerId = verificationDetails.customerId;

    // Update customer to manually verified and grant trial status
    await prisma.customers.update({
      where: { id: customerId },
      data: {
        kycStatus: 'manually_verified',
        kycCompletedAt: new Date(),
        kycVerifiedBy: adminUserId,
        kycFailureReason: null,
        status: 'trial', // Activate trial
      },
    });

    const customer = await prisma.customers.findUnique({ where: { id: customerId } });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: uuidv4(),
        customerId,
        userId: adminUserId,
        action: 'manual_kyc_approval',
        entity: 'customer',
        entityId: customerId,
        description: `Admin manually approved customer KYC. Notes: ${notes || 'N/A'}`,
        metadata: { notes, requestId },
      },
    });

    console.log('[Admin KYC] Customer manually verified and trial activated:', customerId);

    // TODO: Send manual verification email to customer
    console.log('[Admin KYC] TODO: Send manual verification email to:', customer?.email);

    res.json({
      success: true,
      message: 'Customer KYC manually approved and trial activated',
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

    // Get customer ID from verification request
    const verificationDetails = await verificationClient.getRequestDetails(requestId);
    const customerId = verificationDetails.customerId;

    // Update customer to rejected
    await prisma.customers.update({
      where: { id: customerId },
      data: {
        kycStatus: 'rejected',
        kycFailureReason: reason,
        // Do NOT grant trial status
      },
    });

    const customer = await prisma.customers.findUnique({ where: { id: customerId } });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: uuidv4(),
        customerId,
        userId: adminUserId,
        action: 'manual_kyc_rejection',
        entity: 'customer',
        entityId: customerId,
        description: `Admin rejected customer KYC. Reason: ${reason}`,
        metadata: { reason, requestId },
      },
    });

    console.log('[Admin KYC] Customer KYC rejected:', customerId);

    // TODO: Send rejection email to customer
    console.log('[Admin KYC] TODO: Send rejection email to:', customer?.email);

    res.json({
      success: true,
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

export default router;

