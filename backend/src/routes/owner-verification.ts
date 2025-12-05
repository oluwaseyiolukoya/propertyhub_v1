import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { sendTenantKycApprovedEmail, sendTenantKycRejectedEmail } from '../lib/email';
import { AdminService } from '../services/verification/admin.service';

const router = express.Router();

// Use direct service instead of HTTP client
const adminService = new AdminService();

/**
 * Middleware to check if user is a property owner or manager
 */
const ownerOrManagerOnly = async (req: AuthRequest, res: Response, next: Function) => {
  const role = req.user?.role?.toLowerCase();
  if (role !== 'owner' && role !== 'property_owner' && role !== 'manager' && role !== 'property_manager') {
    return res.status(403).json({ error: 'Property owner or manager access required' });
  }
  next();
};

/**
 * Get all tenant verifications for owner's properties
 * GET /api/owner/tenants/verifications
 * Query params: status, page, limit, search
 */
router.get('/tenants/verifications', authMiddleware, ownerOrManagerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const userId = req.user?.id;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID not found' });
    }

    const { status, page = '1', limit = '20', search } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = parseInt(limit as string, 10);

    // Build where clause for tenants
    // Only show tenants who have actually started KYC (not just pending/never started)
    const where: any = {
      customerId,
      role: 'tenant',
      requiresKyc: true,
      // Must have either started KYC (in_progress, verified, etc.) OR have a verification ID
      OR: [
        { kycStatus: { in: ['in_progress', 'verified', 'rejected', 'manually_verified', 'owner_approved'] } },
        { kycVerificationId: { not: null } },
        { kycOwnerApprovalStatus: { in: ['approved', 'rejected'] } }, // Previously reviewed
      ],
    };

    // Filter by KYC status
    if (status && status !== 'all') {
      // Remove the default OR when filtering by specific status
      delete where.OR;

      if (status === 'pending_review') {
        // Tenants who have submitted KYC but owner hasn't reviewed
        where.kycStatus = { in: ['in_progress'] };
        where.OR = [
          { kycOwnerApprovalStatus: null },
          { kycOwnerApprovalStatus: 'pending' },
        ];
      } else if (status === 'owner_approved') {
        where.kycOwnerApprovalStatus = 'approved';
      } else if (status === 'owner_rejected') {
        where.kycOwnerApprovalStatus = 'rejected';
      } else if (status === 'verified') {
        where.kycStatus = 'verified';
      } else {
        where.kycStatus = status;
      }
    }

    // Search by name or email
    if (search && (search as string).trim()) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get tenants with their lease and property info
    const [tenants, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          status: true,
          kycStatus: true,
          kycVerificationId: true,
          kycCompletedAt: true,
          kycFailureReason: true,
          kycLastAttemptAt: true,
          kycOwnerApprovalStatus: true,
          kycReviewedByOwnerId: true,
          kycOwnerReviewedAt: true,
          kycOwnerNotes: true,
          requiresKyc: true,
          createdAt: true,
          leases: {
            where: { status: 'active' },
            take: 1,
            orderBy: { startDate: 'desc' },
            include: {
              units: {
                select: {
                  id: true,
                  unitNumber: true,
                  properties: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.users.count({ where }),
    ]);

    // Map response with property info
    const tenantsWithProperty = tenants.map((tenant) => {
      const activeLease = tenant.leases[0];
      return {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        avatar: tenant.avatar,
        status: tenant.status,
        kycStatus: tenant.kycStatus,
        kycVerificationId: tenant.kycVerificationId,
        kycCompletedAt: tenant.kycCompletedAt,
        kycFailureReason: tenant.kycFailureReason,
        kycLastAttemptAt: tenant.kycLastAttemptAt,
        ownerApprovalStatus: tenant.kycOwnerApprovalStatus || 'pending',
        ownerReviewedAt: tenant.kycOwnerReviewedAt,
        ownerNotes: tenant.kycOwnerNotes,
        requiresKyc: tenant.requiresKyc,
        createdAt: tenant.createdAt,
        property: activeLease?.units?.properties || null,
        unit: activeLease?.units ? {
          id: activeLease.units.id,
          unitNumber: activeLease.units.unitNumber,
        } : null,
        leaseId: activeLease?.id || null,
      };
    });

    res.json({
      tenants: tenantsWithProperty,
      pagination: {
        page: parseInt(page as string, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error('[OwnerVerification] List error:', error);
    res.status(500).json({ error: error.message || 'Failed to list tenant verifications' });
  }
});

/**
 * Get verification analytics for owner
 * GET /api/owner/tenants/verifications/analytics
 */
router.get('/tenants/verifications/analytics', authMiddleware, ownerOrManagerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID not found' });
    }

    // Base where - only count tenants who have actually started KYC
    // (same logic as the list query)
    const baseWhere = {
      customerId,
      role: 'tenant',
      requiresKyc: true,
      // Must have either started KYC OR have a verification ID OR been reviewed
      OR: [
        { kycStatus: { in: ['in_progress', 'verified', 'rejected', 'manually_verified', 'owner_approved'] } },
        { kycVerificationId: { not: null } },
        { kycOwnerApprovalStatus: { in: ['approved', 'rejected'] } },
      ],
    };

    const [
      total,
      pendingReview,
      ownerApproved,
      ownerRejected,
      verified,
      kycInProgress,
    ] = await Promise.all([
      prisma.users.count({ where: baseWhere }),
      prisma.users.count({
        where: {
          customerId,
          role: 'tenant',
          requiresKyc: true,
          kycStatus: 'in_progress',
          OR: [
            { kycOwnerApprovalStatus: null },
            { kycOwnerApprovalStatus: 'pending' },
          ],
        },
      }),
      prisma.users.count({
        where: {
          customerId,
          role: 'tenant',
          requiresKyc: true,
          kycOwnerApprovalStatus: 'approved',
        },
      }),
      prisma.users.count({
        where: {
          customerId,
          role: 'tenant',
          requiresKyc: true,
          kycOwnerApprovalStatus: 'rejected',
        },
      }),
      prisma.users.count({
        where: {
          customerId,
          role: 'tenant',
          requiresKyc: true,
          kycStatus: 'verified',
        },
      }),
      prisma.users.count({
        where: {
          customerId,
          role: 'tenant',
          requiresKyc: true,
          kycStatus: 'in_progress',
        },
      }),
    ]);

    res.json({
      summary: {
        total,
        pendingReview,
        ownerApproved,
        ownerRejected,
        verified,
        kycInProgress,
        approvalRate: total > 0 ? Math.round((ownerApproved / total) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error('[OwnerVerification] Analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to get analytics' });
  }
});

/**
 * Get specific tenant verification details
 * GET /api/owner/tenants/verifications/:tenantId
 */
router.get('/tenants/verifications/:tenantId', authMiddleware, ownerOrManagerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const { tenantId } = req.params;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID not found' });
    }

    const tenant = await prisma.users.findFirst({
      where: {
        id: tenantId,
        customerId,
        role: 'tenant',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        kycStatus: true,
        kycVerificationId: true,
        kycCompletedAt: true,
        kycFailureReason: true,
        kycLastAttemptAt: true,
        kycOwnerApprovalStatus: true,
        kycReviewedByOwnerId: true,
        kycOwnerReviewedAt: true,
        kycOwnerNotes: true,
        requiresKyc: true,
        createdAt: true,
        leases: {
          orderBy: { startDate: 'desc' },
          include: {
            units: {
              include: {
                properties: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get reviewer info if available
    let reviewer = null;
    if (tenant.kycReviewedByOwnerId) {
      reviewer = await prisma.users.findUnique({
        where: { id: tenant.kycReviewedByOwnerId },
        select: { id: true, name: true, email: true },
      });
    }

    // Fetch documents from verification service if tenant has a verification request
    let documents: any[] = [];
    if (tenant.kycVerificationId) {
      try {
        const verificationDetails = await adminService.getRequestDetails(tenant.kycVerificationId);
        if (verificationDetails && verificationDetails.documents) {
          documents = verificationDetails.documents.map((doc: any) => ({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            status: doc.status,
            uploadedAt: doc.uploadedAt || doc.createdAt,
            confidence: doc.confidence,
          }));
        }
      } catch (docError: any) {
        console.warn('[OwnerVerification] Could not fetch documents:', docError.message || docError);
      }
    }

    res.json({
      tenant: {
        ...tenant,
        ownerApprovalStatus: tenant.kycOwnerApprovalStatus || 'pending',
        reviewer,
        documents,
      },
    });
  } catch (error: any) {
    console.error('[OwnerVerification] Details error:', error);
    res.status(500).json({ error: error.message || 'Failed to get tenant details' });
  }
});

/**
 * Get document download URL for tenant verification
 * GET /api/owner/tenants/verifications/:tenantId/documents/:documentId
 */
router.get('/tenants/verifications/:tenantId/documents/:documentId', authMiddleware, ownerOrManagerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const { tenantId, documentId } = req.params;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID not found' });
    }

    // Verify tenant belongs to this owner's customer
    const tenant = await prisma.users.findFirst({
      where: {
        id: tenantId,
        customerId,
        role: 'tenant',
      },
      select: {
        id: true,
        kycVerificationId: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!tenant.kycVerificationId) {
      return res.status(400).json({ error: 'Tenant has no verification request' });
    }

    // Get document URL from verification service
    try {
      const documentUrl = await adminService.getDocumentDownloadUrl(documentId);
      res.json({ url: documentUrl });
    } catch (docError: any) {
      console.error('[OwnerVerification] Document download error:', docError);
      res.status(404).json({ error: 'Document not found or access denied' });
    }
  } catch (error: any) {
    console.error('[OwnerVerification] Document download error:', error);
    res.status(500).json({ error: error.message || 'Failed to get document' });
  }
});

/**
 * Approve tenant KYC (Owner action)
 * POST /api/owner/tenants/verifications/:tenantId/approve
 */
router.post('/tenants/verifications/:tenantId/approve', authMiddleware, ownerOrManagerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const ownerId = req.user?.id;
    const { tenantId } = req.params;
    const { notes } = req.body;

    if (!customerId || !ownerId) {
      return res.status(400).json({ error: 'User information not found' });
    }

    // Verify tenant belongs to this owner's customer
    const tenant = await prisma.users.findFirst({
      where: {
        id: tenantId,
        customerId,
        role: 'tenant',
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (tenant.kycOwnerApprovalStatus === 'approved') {
      return res.status(400).json({ error: 'Tenant KYC already approved' });
    }

    // Get documents to calculate storage usage
    let totalDocumentSize = 0;
    if (tenant.kycVerificationId) {
      try {
        const verificationDetails = await adminService.getRequestDetails(tenant.kycVerificationId);
        if (verificationDetails?.documents) {
          totalDocumentSize = verificationDetails.documents.reduce(
            (sum: number, doc: any) => sum + (doc.fileSize || 0),
            0
          );
        }
      } catch (docError) {
        console.warn('[OwnerVerification] Could not fetch documents for storage calculation:', docError);
      }
    }

    // Update tenant with owner approval
    const updatedTenant = await prisma.users.update({
      where: { id: tenantId },
      data: {
        kycOwnerApprovalStatus: 'approved',
        kycReviewedByOwnerId: ownerId,
        kycOwnerReviewedAt: new Date(),
        kycOwnerNotes: notes || null,
        // Also update main KYC status to reflect owner approval
        kycStatus: 'owner_approved',
      },
    });

    // Update verification request and documents status in verification service
    if (tenant.kycVerificationId) {
      try {
        await adminService.approveRequest(tenant.kycVerificationId, ownerId);
        console.log(`[OwnerVerification] ✅ Verification request ${tenant.kycVerificationId} documents marked as verified`);
      } catch (verifyError: any) {
        console.warn('[OwnerVerification] Could not update verification service:', verifyError.message);
        // Continue even if verification service update fails - tenant is still approved locally
      }
    }

    // Update customer storage usage if documents exist
    if (totalDocumentSize > 0) {
      await prisma.customers.update({
        where: { id: customerId },
        data: {
          storage_used: {
            increment: BigInt(totalDocumentSize),
          },
          storage_last_calculated: new Date(),
        },
      });
      console.log(`[OwnerVerification] Added ${totalDocumentSize} bytes to customer ${customerId} storage`);
    }

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId,
        userId: ownerId,
        action: 'tenant_kyc_approved',
        entity: 'user',
        entityId: tenantId,
        description: `Owner approved tenant KYC for ${tenant.name}`,
        metadata: { notes, tenantEmail: tenant.email },
      },
    });

    // Send email notification to tenant
    let emailSent = false;
    try {
      const owner = await prisma.users.findUnique({
        where: { id: ownerId },
        select: { name: true },
      });
      const customer = await prisma.customers.findUnique({
        where: { id: customerId },
        select: { company: true },
      });

      emailSent = await sendTenantKycApprovedEmail({
        tenantName: tenant.name,
        tenantEmail: tenant.email,
        propertyName: customer?.company || 'Your Property',
        approvedBy: owner?.name || 'Property Management',
        notes: notes,
      });
    } catch (emailError) {
      console.error('[OwnerVerification] Failed to send approval email:', emailError);
    }

    console.log(`[OwnerVerification] ✅ Tenant ${tenantId} KYC approved by owner ${ownerId}`);

    res.json({
      success: true,
      message: 'Tenant KYC approved successfully',
      emailSent,
      tenant: updatedTenant,
    });
  } catch (error: any) {
    console.error('[OwnerVerification] Approve error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve tenant KYC' });
  }
});

/**
 * Reject tenant KYC (Owner action)
 * POST /api/owner/tenants/verifications/:tenantId/reject
 */
router.post('/tenants/verifications/:tenantId/reject', authMiddleware, ownerOrManagerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const ownerId = req.user?.id;
    const { tenantId } = req.params;
    const { reason } = req.body;

    if (!customerId || !ownerId) {
      return res.status(400).json({ error: 'User information not found' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Verify tenant belongs to this owner's customer
    const tenant = await prisma.users.findFirst({
      where: {
        id: tenantId,
        customerId,
        role: 'tenant',
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update tenant with owner rejection
    const updatedTenant = await prisma.users.update({
      where: { id: tenantId },
      data: {
        kycOwnerApprovalStatus: 'rejected',
        kycReviewedByOwnerId: ownerId,
        kycOwnerReviewedAt: new Date(),
        kycOwnerNotes: reason,
        kycStatus: 'rejected',
        kycFailureReason: reason,
      },
    });

    // Update verification request and documents status in verification service
    if (tenant.kycVerificationId) {
      try {
        await adminService.rejectRequest(tenant.kycVerificationId, ownerId, reason);
        console.log(`[OwnerVerification] ✅ Verification request ${tenant.kycVerificationId} documents marked as rejected`);
      } catch (verifyError: any) {
        console.warn('[OwnerVerification] Could not update verification service:', verifyError.message);
        // Continue even if verification service update fails - tenant is still rejected locally
      }
    }

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId,
        userId: ownerId,
        action: 'tenant_kyc_rejected',
        entity: 'user',
        entityId: tenantId,
        description: `Owner rejected tenant KYC for ${tenant.name}. Reason: ${reason}`,
        metadata: { reason, tenantEmail: tenant.email },
      },
    });

    // Send email notification to tenant
    let emailSent = false;
    try {
      const owner = await prisma.users.findUnique({
        where: { id: ownerId },
        select: { name: true },
      });
      const customer = await prisma.customers.findUnique({
        where: { id: customerId },
        select: { company: true },
      });

      emailSent = await sendTenantKycRejectedEmail({
        tenantName: tenant.name,
        tenantEmail: tenant.email,
        propertyName: customer?.company || 'Your Property',
        rejectedBy: owner?.name || 'Property Management',
        reason: reason,
      });
    } catch (emailError) {
      console.error('[OwnerVerification] Failed to send rejection email:', emailError);
    }

    console.log(`[OwnerVerification] ❌ Tenant ${tenantId} KYC rejected by owner ${ownerId}`);

    res.json({
      success: true,
      message: 'Tenant KYC rejected',
      emailSent,
      tenant: updatedTenant,
    });
  } catch (error: any) {
    console.error('[OwnerVerification] Reject error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject tenant KYC' });
  }
});

/**
 * Request tenant to re-submit KYC
 * POST /api/owner/tenants/verifications/:tenantId/request-resubmit
 */
router.post('/tenants/verifications/:tenantId/request-resubmit', authMiddleware, ownerOrManagerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const ownerId = req.user?.id;
    const { tenantId } = req.params;
    const { reason } = req.body;

    if (!customerId || !ownerId) {
      return res.status(400).json({ error: 'User information not found' });
    }

    // Verify tenant belongs to this owner's customer
    const tenant = await prisma.users.findFirst({
      where: {
        id: tenantId,
        customerId,
        role: 'tenant',
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Reset tenant KYC status to allow resubmission
    const updatedTenant = await prisma.users.update({
      where: { id: tenantId },
      data: {
        kycStatus: 'pending',
        kycOwnerApprovalStatus: 'pending',
        kycOwnerNotes: reason || 'Please resubmit your KYC documents',
        kycFailureReason: reason || 'Resubmission requested by property owner',
      },
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId,
        userId: ownerId,
        action: 'tenant_kyc_resubmit_requested',
        entity: 'user',
        entityId: tenantId,
        description: `Owner requested tenant ${tenant.name} to resubmit KYC`,
        metadata: { reason, tenantEmail: tenant.email },
      },
    });

    console.log(`[OwnerVerification] 🔄 Resubmission requested for tenant ${tenantId}`);

    res.json({
      success: true,
      message: 'Resubmission request sent to tenant',
      tenant: updatedTenant,
    });
  } catch (error: any) {
    console.error('[OwnerVerification] Resubmit request error:', error);
    res.status(500).json({ error: error.message || 'Failed to request resubmission' });
  }
});

/**
 * Delete tenant verification (reset KYC to allow new submission)
 * DELETE /api/owner/tenants/verifications/:tenantId
 */
router.delete('/tenants/verifications/:tenantId', authMiddleware, ownerOrManagerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body || {};
    const customerId = req.user?.customerId;
    const ownerId = req.user?.id;

    if (!customerId || !ownerId) {
      return res.status(400).json({ error: 'User information not found' });
    }

    // Verify tenant belongs to this owner's customer
    const tenant = await prisma.users.findFirst({
      where: {
        id: tenantId,
        customerId,
        role: 'tenant',
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // If tenant has a verification request in the verification service, try to delete it
    if (tenant.kycVerificationId) {
      try {
        await adminService.deleteRequest(tenant.kycVerificationId);
        console.log(`[OwnerVerification] 🗑️ Deleted verification request ${tenant.kycVerificationId} from verification service`);
      } catch (verifyError: any) {
        console.warn(`[OwnerVerification] ⚠️ Could not delete verification from service:`, verifyError.message);
        // Continue anyway - we'll reset the user's KYC status
      }
    }

    // Clear all KYC-related fields completely - tenant will need to start fresh
    const updatedTenant = await prisma.users.update({
      where: { id: tenantId },
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
        requiresKyc: true, // Still require KYC - tenant needs to submit new verification
      },
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId,
        userId: ownerId,
        action: 'tenant_verification_deleted',
        entity: 'user',
        entityId: tenantId,
        description: `Owner deleted verification for tenant ${tenant.name}`,
        metadata: { reason, tenantEmail: tenant.email },
      },
    });

    console.log(`[OwnerVerification] 🗑️ Verification deleted for tenant ${tenantId}`);

    res.json({
      success: true,
      message: 'Verification deleted. Tenant can now submit a new verification request.',
    });
  } catch (error: any) {
    console.error('[OwnerVerification] Delete verification error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete verification' });
  }
});

export default router;

