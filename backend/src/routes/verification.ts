import express, { Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { verificationClient } from '../services/verification-client.service';
import prisma from '../lib/db';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  },
});

/**
 * Start verification process
 * POST /api/verification/start
 */
router.post('/start', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const userRole = req.user?.role;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID not found' });
    }

    // Determine customer type based on role
    let customerType = 'property_owner'; // default
    if (userRole === 'developer') {
      customerType = 'developer';
    } else if (userRole === 'property_manager') {
      customerType = 'property_manager';
    } else if (userRole === 'tenant') {
      customerType = 'tenant';
    }

    const result = await verificationClient.submitVerification(customerId, customerType);

    res.json({
      success: true,
      requestId: result.requestId,
      status: result.status,
    });
  } catch (error: any) {
    console.error('[VerificationRoutes] Start error:', error);
    res.status(500).json({ error: error.message || 'Failed to start verification' });
  }
});

/**
 * Upload verification document
 * POST /api/verification/upload
 */
router.post('/upload', authMiddleware, upload.single('document'), async (req: AuthRequest, res: Response) => {
  try {
    const { requestId, documentType, documentNumber, metadata } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required' });
    }

    if (!documentType) {
      return res.status(400).json({ error: 'documentType is required' });
    }

    // Parse metadata if it's a string
    let parsedMetadata = metadata;
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        parsedMetadata = {};
      }
    }

    const result = await verificationClient.uploadDocument(
      requestId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      documentType,
      documentNumber,
      parsedMetadata
    );

    res.json({
      success: true,
      documentId: result.documentId,
      status: result.status,
    });
  } catch (error: any) {
    console.error('[VerificationRoutes] Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload document' });
  }
});

/**
 * Get verification status
 * GET /api/verification/status
 */
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID not found' });
    }

    const verification = await verificationClient.getCustomerVerification(customerId);

    res.json(verification);
  } catch (error: any) {
    console.error('[VerificationRoutes] Status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get verification status' });
  }
});

/**
 * Get verification history
 * GET /api/verification/history/:requestId
 */
router.get('/history/:requestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const history = await verificationClient.getHistory(requestId);
    res.json(history);
  } catch (error: any) {
    console.error('[VerificationRoutes] History error:', error);
    res.status(500).json({ error: error.message || 'Failed to get verification history' });
  }
});

// ============================================
// KYC-Specific Endpoints
// ============================================

/**
 * Submit KYC verification request
 * POST /api/verification/kyc/submit
 */
router.post('/kyc/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const userRole = req.user?.role;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID not found' });
    }

    // Get customer email for search functionality
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { email: true },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Determine customer type based on role
    let customerType = 'property_owner'; // default
    if (userRole === 'developer') {
      customerType = 'developer';
    } else if (userRole === 'property_manager') {
      customerType = 'property_manager';
    } else if (userRole === 'tenant') {
      customerType = 'tenant';
    }

    console.log('[KYC] Submitting verification for customer:', customerId, 'email:', customer.email, 'type:', customerType);

    // Call verification microservice to create request
    const verificationRequest = await verificationClient.submitVerification(
      customerId,
      customerType,
      customer.email, // Pass customer email
      req.ip,
      req.headers['user-agent']
    );

    // Update customer KYC status
    await prisma.customers.update({
      where: { id: customerId },
      data: {
        kycStatus: 'in_progress',
        kycVerificationId: verificationRequest.requestId,
        kycLastAttemptAt: new Date(),
      },
    });

    console.log('[KYC] Verification request created:', verificationRequest.requestId);

    res.json({
      success: true,
      requestId: verificationRequest.requestId,
      status: verificationRequest.status,
    });
  } catch (error: any) {
    console.error('[KYC] Submit error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit KYC verification' });
  }
});

/**
 * Get KYC status
 * GET /api/verification/kyc/status
 */
router.get('/kyc/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID not found' });
    }

    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: {
        kycStatus: true,
        kycVerificationId: true,
        kycFailureReason: true,
        kycCompletedAt: true,
        requiresKyc: true,
        kycVerifiedBy: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // If verification in progress, fetch details from microservice
    let verificationDetails = null;
    if (customer.kycVerificationId) {
      try {
        verificationDetails = await verificationClient.getRequestStatus(customer.kycVerificationId);
      } catch (err) {
        console.error('[KYC Status] Failed to fetch verification details:', err);
      }
    }

    res.json({
      success: true,
      kycStatus: customer.kycStatus,
      kycFailureReason: customer.kycFailureReason,
      kycCompletedAt: customer.kycCompletedAt,
      requiresKyc: customer.requiresKyc,
      kycVerifiedBy: customer.kycVerifiedBy,
      verificationDetails,
    });
  } catch (error: any) {
    console.error('[KYC Status] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to get KYC status' });
  }
});

/**
 * Webhook handler for verification completion
 * POST /api/verification/kyc/webhook
 *
 * This endpoint is called by the verification microservice when verification completes
 */
router.post('/kyc/webhook', async (req: Request, res: Response) => {
  try {
    const { requestId, status, customerId, failureReason } = req.body;

    console.log('[KYC Webhook] Received:', { requestId, status, customerId });

    // TODO: Add webhook signature verification for security

    if (!requestId || !status || !customerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Update customer KYC status based on verification result
    const updateData: any = {
      kycStatus: status, // 'approved', 'pending_review'
    };

    if (status === 'approved') {
      // Auto-approved by Dojah - grant trial status
      updateData.kycCompletedAt = new Date();
      updateData.status = 'trial'; // Activate trial
      updateData.kycFailureReason = null;

      console.log('[KYC Webhook] Auto-approved by Dojah, activating trial for customer:', customerId);
    } else if (status === 'pending_review') {
      // Failed Dojah verification - needs admin review
      updateData.kycFailureReason = failureReason;
      // Do NOT change customer.status - keep as 'pending_kyc'

      console.log('[KYC Webhook] Failed Dojah verification, sending to admin review:', customerId);
    }

    await prisma.customers.update({
      where: { id: customerId },
      data: updateData,
    });

    // Send notification email to customer
    if (status === 'approved') {
      // TODO: Send "KYC Verified" email
      console.log('[KYC Webhook] TODO: Send KYC verified email to:', customer.email);
    }
    // If pending_review, do NOT send email yet - admin will decide

    res.json({ success: true });
  } catch (error: any) {
    console.error('[KYC Webhook] Error:', error);
    res.status(500).json({ error: error.message || 'Webhook processing failed' });
  }
});

export default router;

