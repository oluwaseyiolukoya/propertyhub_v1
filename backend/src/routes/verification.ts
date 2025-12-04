import express, { Request, Response } from 'express';
import multer from 'multer';
import { authenticateApiKey } from '../middleware/verification-auth';
import { asyncHandler } from '../middleware/error';
import { VerificationService } from '../services/verification/verification.service';

const verificationService = new VerificationService();

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  },
});

/**
 * Submit verification request
 * POST /api/verification/submit
 */
router.post('/submit', authenticateApiKey, asyncHandler(async (req: Request, res: Response) => {
  const { customerId, customerType, customerEmail, ipAddress, userAgent } = req.body;

  if (!customerId || !customerType) {
    return res.status(400).json({ error: 'customerId and customerType are required' });
  }

  const request = await verificationService.createRequest(
    customerId,
    customerType,
    customerEmail,
    ipAddress || req.ip,
    userAgent || req.get('user-agent')
  );

  res.json({
    success: true,
    requestId: request.id,
    status: request.status,
  });
}));

/**
 * Upload document
 * POST /api/verification/upload/:requestId
 */
router.post('/upload/:requestId', authenticateApiKey, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { documentType, documentNumber, metadata } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'File is required' });
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

  const document = await verificationService.uploadDocument(
    requestId,
    req.file,
    documentType,
    documentNumber,
    parsedMetadata
  );

  res.json({
    success: true,
    documentId: document.id,
    status: document.status,
  });
}));

/**
 * Get verification status
 * GET /api/verification/status/:requestId
 */
router.get('/status/:requestId', authenticateApiKey, asyncHandler(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const status = await verificationService.getStatus(requestId);
  res.json(status);
}));

/**
 * Get customer verification status
 * GET /api/verification/customer/:customerId
 */
router.get('/customer/:customerId', authenticateApiKey, asyncHandler(async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const verification = await verificationService.getCustomerVerification(customerId);
  res.json(verification);
}));

/**
 * Get verification history
 * GET /api/verification/history/:requestId
 */
router.get('/history/:requestId', authenticateApiKey, asyncHandler(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const history = await verificationService.getHistory(requestId);
  res.json({ history });
}));

export default router;
