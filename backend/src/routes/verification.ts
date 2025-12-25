import express, { Request, Response } from "express";
import multer from "multer";
import { authenticateApiKey } from "../middleware/verification-auth";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import { VerificationService } from "../services/verification/verification.service";
import prisma from "../lib/db";

const verificationService = new VerificationService();

const router = express.Router();

// ========================================
// JWT-authenticated KYC routes (for frontend)
// ========================================

/**
 * Start verification process (alias for kyc/submit)
 * POST /api/verification/start
 * Uses JWT authentication
 */
router.post(
  "/start",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const customerId = user.customerId;
    const customerEmail = user.email;
    const customerType = user.role === "tenant" ? "tenant" : "property_owner";

    if (!customerId) {
      return res.status(400).json({ error: "Customer ID not found" });
    }

    console.log(
      `[Verification Start] Creating request for ${customerEmail} (${customerType})`
    );

    // Check if there's already an active request
    const existingRequest = await prisma.verification_requests.findFirst({
      where: {
        customerId,
        status: { in: ["pending", "in_progress"] },
      },
    });

    if (existingRequest) {
      console.log(
        `[Verification Start] Using existing request: ${existingRequest.id}`
      );
      return res.json({
        success: true,
        requestId: existingRequest.id,
        status: existingRequest.status,
        message: "Using existing verification request",
      });
    }

    // Create new verification request
    const request = await verificationService.createRequest(
      customerId,
      customerType,
      customerEmail,
      req.ip,
      req.get("user-agent")
    );

    // Update customer/user with verification request ID
    if (customerType === "tenant") {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          kycVerificationId: request.id,
          kycStatus: "in_progress",
          kycLastAttemptAt: new Date(),
        },
      });
    } else {
      await prisma.customers.update({
        where: { id: customerId },
        data: {
          kycVerificationId: request.id,
          kycStatus: "in_progress",
          kycLastAttemptAt: new Date(),
        },
      });
    }

    console.log(`[Verification Start] Created request: ${request.id}`);

    res.json({
      success: true,
      requestId: request.id,
      status: request.status,
    });
  })
);

/**
 * Get verification status for current user (alias)
 * GET /api/verification/status
 * Uses JWT authentication
 */
router.get(
  "/status",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const customerId = user.customerId;
    const isTenant = user.role === "tenant";

    // Get KYC status from user or customer
    if (isTenant) {
      const userData = await prisma.users.findUnique({
        where: { id: user.id },
        select: {
          kycStatus: true,
          kycVerificationId: true,
          kycCompletedAt: true,
          kycFailureReason: true,
          requiresKyc: true,
        },
      });

      return res.json({
        status: userData?.kycStatus || "pending",
        kycStatus: userData?.kycStatus || "pending",
        kycVerificationId: userData?.kycVerificationId,
        kycCompletedAt: userData?.kycCompletedAt,
        kycFailureReason: userData?.kycFailureReason,
        requiresKyc: userData?.requiresKyc ?? true,
      });
    }

    // For owners/developers
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: {
        kycStatus: true,
        kycVerificationId: true,
        kycCompletedAt: true,
        kycFailureReason: true,
        requiresKyc: true,
      },
    });

    res.json({
      status: customer?.kycStatus || "pending",
      kycStatus: customer?.kycStatus || "pending",
      kycVerificationId: customer?.kycVerificationId,
      kycCompletedAt: customer?.kycCompletedAt,
      kycFailureReason: customer?.kycFailureReason,
      requiresKyc: customer?.requiresKyc ?? true,
    });
  })
);

/**
 * Submit KYC verification request (for owners/developers)
 * POST /api/verification/kyc/submit
 * Uses JWT authentication
 */
router.post(
  "/kyc/submit",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const customerId = user.customerId;
    const customerEmail = user.email;
    const customerType = user.role === "tenant" ? "tenant" : "property_owner";

    if (!customerId) {
      return res.status(400).json({ error: "Customer ID not found" });
    }

    console.log(
      `[KYC Submit] Creating verification request for ${customerEmail} (${customerType})`
    );

    // Check if there's already an active request
    const existingRequest = await prisma.verification_requests.findFirst({
      where: {
        customerId,
        status: { in: ["pending", "in_progress"] },
      },
    });

    if (existingRequest) {
      console.log(`[KYC Submit] Using existing request: ${existingRequest.id}`);
      return res.json({
        success: true,
        requestId: existingRequest.id,
        status: existingRequest.status,
        message: "Using existing verification request",
      });
    }

    // Create new verification request
    const request = await verificationService.createRequest(
      customerId,
      customerType,
      customerEmail,
      req.ip,
      req.get("user-agent")
    );

    // Update customer/user with verification request ID
    if (customerType === "tenant") {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          kycVerificationId: request.id,
          kycStatus: "in_progress",
          kycLastAttemptAt: new Date(),
        },
      });
    } else {
      await prisma.customers.update({
        where: { id: customerId },
        data: {
          kycVerificationId: request.id,
          kycStatus: "in_progress",
          kycLastAttemptAt: new Date(),
        },
      });
    }

    console.log(`[KYC Submit] Created verification request: ${request.id}`);

    res.json({
      success: true,
      requestId: request.id,
      status: request.status,
    });
  })
);

/**
 * Upload KYC document
 * POST /api/verification/kyc/upload/:requestId
 * Uses JWT authentication
 */
router.post(
  "/kyc/upload/:requestId",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { requestId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Verify the request belongs to this user
    const verificationRequest = await prisma.verification_requests.findUnique({
      where: { id: requestId },
    });

    if (!verificationRequest) {
      return res.status(404).json({ error: "Verification request not found" });
    }

    if (
      verificationRequest.customerId !== user.customerId &&
      verificationRequest.customerId !== user.id
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to upload to this request" });
    }

    // Parse form data with multer inline
    const multerUpload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          "image/jpeg",
          "image/png",
          "image/jpg",
          "application/pdf",
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error("Invalid file type"));
        }
      },
    }).single("file");

    multerUpload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "File is required" });
      }

      const { documentType, documentNumber, metadata } = req.body;

      if (!documentType) {
        return res.status(400).json({ error: "documentType is required" });
      }

      let parsedMetadata = metadata;
      if (typeof metadata === "string") {
        try {
          parsedMetadata = JSON.parse(metadata);
        } catch {
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
    });
  })
);

/**
 * Upload verification document (alternative route without requestId in URL)
 * POST /api/verification/upload
 * Uses JWT authentication
 * Expects requestId in form body
 */
router.post(
  "/upload",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Parse form data with multer inline
    const multerUpload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          "image/jpeg",
          "image/png",
          "image/jpg",
          "application/pdf",
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error("Invalid file type"));
        }
      },
    }).single("document"); // Note: frontend uses 'document' field name

    multerUpload(req, res, async (err) => {
      try {
        if (err) {
          console.error("[KYC Upload] Multer error:", err);
          return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ error: "File is required" });
        }

        const { requestId, documentType, documentNumber, metadata } = req.body;

        if (!requestId) {
          return res.status(400).json({ error: "requestId is required" });
        }

        if (!documentType) {
          return res.status(400).json({ error: "documentType is required" });
        }

        // Verify the request exists and belongs to this user
        const verificationRequest =
          await prisma.verification_requests.findUnique({
            where: { id: requestId },
          });

        if (!verificationRequest) {
          return res
            .status(404)
            .json({ error: "Verification request not found" });
        }

        if (
          verificationRequest.customerId !== user.customerId &&
          verificationRequest.customerId !== user.id
        ) {
          return res
            .status(403)
            .json({ error: "Not authorized to upload to this request" });
        }

        let parsedMetadata = metadata;
        if (typeof metadata === "string") {
          try {
            parsedMetadata = JSON.parse(metadata);
          } catch {
            parsedMetadata = {};
          }
        }

        console.log(
          `[KYC Upload] Uploading ${documentType} for request ${requestId}`
        );

        const document = await verificationService.uploadDocument(
          requestId,
          req.file,
          documentType,
          documentNumber,
          parsedMetadata
        );

        // Update user's kycStatus to in_progress if they were in pending_documents
        if (user.role === "tenant") {
          const currentUser = await prisma.users.findUnique({
            where: { id: user.id },
            select: { kycStatus: true },
          });

          if (currentUser?.kycStatus === "pending_documents") {
            await prisma.users.update({
              where: { id: user.id },
              data: {
                kycStatus: "in_progress",
                kycLastAttemptAt: new Date(),
              },
            });
            console.log(
              `[KYC Upload] Updated user ${user.id} status from pending_documents to in_progress`
            );
          }
        }

        res.json({
          success: true,
          documentId: document.id,
          status: document.status,
        });
      } catch (error: any) {
        console.error("[KYC Upload] Error processing upload:", error);
        // Check if response has already been sent
        if (!res.headersSent) {
          return res.status(500).json({
            error: "Failed to upload document",
            message:
              process.env.NODE_ENV === "development"
                ? error.message
                : "An error occurred while uploading the document",
          });
        }
      }
    });
  })
);

/**
 * Get KYC status for current user
 * GET /api/verification/kyc/status
 * Uses JWT authentication
 */
router.get(
  "/kyc/status",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const customerId = user.customerId;
    const isTenant = user.role === "tenant";

    // Get KYC status from user or customer
    if (isTenant) {
      const userData = await prisma.users.findUnique({
        where: { id: user.id },
        select: {
          kycStatus: true,
          kycVerificationId: true,
          kycCompletedAt: true,
          kycFailureReason: true,
          requiresKyc: true,
        },
      });

      return res.json({
        kycStatus: userData?.kycStatus || "pending",
        kycVerificationId: userData?.kycVerificationId,
        kycCompletedAt: userData?.kycCompletedAt,
        kycFailureReason: userData?.kycFailureReason,
        requiresKyc: userData?.requiresKyc ?? true,
      });
    }

    // For owners/developers
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: {
        kycStatus: true,
        kycVerificationId: true,
        kycCompletedAt: true,
        kycFailureReason: true,
        requiresKyc: true,
      },
    });

    res.json({
      kycStatus: customer?.kycStatus || "pending",
      kycVerificationId: customer?.kycVerificationId,
      kycCompletedAt: customer?.kycCompletedAt,
      kycFailureReason: customer?.kycFailureReason,
      requiresKyc: customer?.requiresKyc ?? true,
    });
  })
);

// ========================================
// API Key authenticated routes (for internal services)
// ========================================

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."));
    }
  },
});

/**
 * Submit verification request
 * POST /api/verification/submit
 */
router.post(
  "/submit",
  authenticateApiKey,
  asyncHandler(async (req: Request, res: Response) => {
    const { customerId, customerType, customerEmail, ipAddress, userAgent } =
      req.body;

    if (!customerId || !customerType) {
      return res
        .status(400)
        .json({ error: "customerId and customerType are required" });
    }

    const request = await verificationService.createRequest(
      customerId,
      customerType,
      customerEmail,
      ipAddress || req.ip,
      userAgent || req.get("user-agent")
    );

    res.json({
      success: true,
      requestId: request.id,
      status: request.status,
    });
  })
);

/**
 * Upload document
 * POST /api/verification/upload/:requestId
 */
router.post(
  "/upload/:requestId",
  authenticateApiKey,
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { documentType, documentNumber, metadata } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    if (!documentType) {
      return res.status(400).json({ error: "documentType is required" });
    }

    // Parse metadata if it's a string
    let parsedMetadata = metadata;
    if (typeof metadata === "string") {
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
  })
);

/**
 * Get verification status
 * GET /api/verification/status/:requestId
 */
router.get(
  "/status/:requestId",
  authenticateApiKey,
  asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const status = await verificationService.getStatus(requestId);
    res.json(status);
  })
);

/**
 * Get customer verification status
 * GET /api/verification/customer/:customerId
 */
router.get(
  "/customer/:customerId",
  authenticateApiKey,
  asyncHandler(async (req: Request, res: Response) => {
    const { customerId } = req.params;
    const verification = await verificationService.getCustomerVerification(
      customerId
    );
    res.json(verification);
  })
);

/**
 * Get verification history
 * GET /api/verification/history/:requestId
 */
router.get(
  "/history/:requestId",
  authenticateApiKey,
  asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const history = await verificationService.getHistory(requestId);
    res.json({ history });
  })
);

export default router;
