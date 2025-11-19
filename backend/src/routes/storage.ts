import express, { Request, Response } from "express";
import multer from "multer";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import storageService from "../services/storage.service";

const router = express.Router();

// Middleware to ensure user is a customer (has customerId)
// Note: Both property owners/managers AND developers have customerId
const customerOnly = async (req: AuthRequest, res: Response, next: express.NextFunction) => {
  if (!req.user?.customerId) {
    return res.status(403).json({
      success: false,
      error: "Access denied. Customer account required (property owner/manager or developer).",
      details: "You must be logged in as a customer with a valid customerId to access storage.",
    });
  }
  next();
};

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Add file type restrictions if needed
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: images, PDFs, Office documents.`));
    }
  },
});

/**
 * GET /api/storage/quota
 * Get storage quota for customer
 */
router.get(
  "/quota",
  authMiddleware,
  customerOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const customerId = req.user!.customerId!;

      const quota = await storageService.checkStorageQuota(customerId, 0);

      res.json({
        success: true,
        data: {
          used: quota.used,
          limit: quota.limit,
          available: quota.available,
          percentage: quota.percentage,
          usedFormatted: storageService.formatBytes(quota.used),
          limitFormatted: storageService.formatBytes(quota.limit),
          availableFormatted: storageService.formatBytes(quota.available),
        },
      });
    } catch (error: any) {
      console.error("Error fetching storage quota:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/storage/stats
 * Get detailed storage statistics
 */
router.get(
  "/stats",
  authMiddleware,
  customerOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const customerId = req.user!.customerId!;

      const stats = await storageService.getStorageStats(customerId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("Error fetching storage stats:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/storage/upload
 * Upload file
 */
router.post(
  "/upload",
  authMiddleware,
  customerOnly,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file provided",
        });
      }

      const { category, subcategory, entityId, metadata } = req.body;

      if (!category) {
        return res.status(400).json({
          success: false,
          error: "Category is required",
        });
      }

      const result = await storageService.uploadFile({
        customerId: req.user!.customerId!,
        category: category || "documents",
        subcategory,
        entityId,
        file: {
          originalName: req.file.originalname,
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        uploadedBy: req.user!.id,
        metadata: metadata ? JSON.parse(metadata) : undefined,
      });

      res.json({
        success: true,
        message: "File uploaded successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * DELETE /api/storage/file
 * Delete file
 */
router.delete(
  "/file",
  authMiddleware,
  customerOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: "File path is required",
        });
      }

      await storageService.deleteFile(req.user!.customerId!, filePath);

      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/storage/recalculate
 * Recalculate storage usage (for maintenance)
 */
router.post(
  "/recalculate",
  authMiddleware,
  customerOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const customerId = req.user!.customerId!;

      const totalSize = await storageService.recalculateStorageUsage(
        customerId
      );

      res.json({
        success: true,
        message: "Storage usage recalculated successfully",
        data: {
          totalSize,
          totalSizeFormatted: storageService.formatBytes(totalSize),
        },
      });
    } catch (error: any) {
      console.error("Error recalculating storage:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/storage/file-url
 * Get signed URL for file access
 */
router.get(
  "/file-url",
  authMiddleware,
  customerOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { filePath, expiresIn } = req.query;

      if (!filePath || typeof filePath !== "string") {
        return res.status(400).json({
          success: false,
          error: "File path is required",
        });
      }

      const expires = expiresIn ? parseInt(expiresIn as string) : 3600;
      const url = await storageService.getFileUrl(filePath, expires);

      res.json({
        success: true,
        data: {
          url,
          expiresIn: expires,
        },
      });
    } catch (error: any) {
      console.error("Error generating file URL:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/storage/upload-invoice-attachment
 * Upload invoice attachment with quota validation
 *
 * Body (multipart/form-data):
 * - file: File (required)
 * - invoiceId: string (optional, if invoice already exists)
 * - description: string (optional)
 */
router.post(
  "/upload-invoice-attachment",
  authMiddleware,
  customerOnly,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file provided",
        });
      }

      const { invoiceId, description } = req.body;
      const customerId = req.user!.customerId!;

      // 1. Check storage quota BEFORE upload
      const quota = await storageService.checkStorageQuota(
        customerId,
        req.file.size
      );

      if (!quota.canUpload) {
        return res.status(413).json({
          success: false,
          error: "Storage quota exceeded",
          quota: {
            used: quota.used,
            limit: quota.limit,
            available: quota.available,
            usedFormatted: storageService.formatBytes(quota.used),
            limitFormatted: storageService.formatBytes(quota.limit),
          },
        });
      }

      // 2. Upload file to Digital Ocean Spaces
      const uploadResult = await storageService.uploadFile({
        customerId,
        category: "invoices",
        subcategory: "attachments",
        entityId: invoiceId || "pending", // "pending" for draft invoices
        file: {
          originalName: req.file.originalname,
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        uploadedBy: req.user!.id,
        metadata: {
          description,
          uploadContext: "invoice_creation",
          uploadedAt: new Date().toISOString(),
        },
      });

      // 3. Save attachment record (if invoiceId exists)
      let attachmentRecord = null;
      if (invoiceId) {
        const prisma = (await import("../lib/db")).default;
        attachmentRecord = await prisma.invoice_attachments.create({
          data: {
            invoice_id: invoiceId,
            customer_id: customerId,
            file_path: uploadResult.filePath,
            file_name: req.file.originalname,
            file_size: BigInt(req.file.size),
            file_type: storageService.getFileType(req.file.mimetype),
            mime_type: req.file.mimetype,
            uploaded_by: req.user!.id,
            metadata: {
              description,
              originalUrl: uploadResult.fileUrl,
            },
          },
        });
      }

      // 4. Return success with updated quota
      const updatedQuota = await storageService.checkStorageQuota(
        customerId,
        0
      );

      res.json({
        success: true,
        message: "File uploaded successfully",
        data: {
          fileId: uploadResult.fileId,
          filePath: uploadResult.filePath,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileUrl: uploadResult.fileUrl,
          cdnUrl: uploadResult.cdnUrl,
          attachmentId: attachmentRecord?.id,
          quota: {
            used: updatedQuota.used,
            limit: updatedQuota.limit,
            available: updatedQuota.available,
            percentage: updatedQuota.percentage,
            usedFormatted: storageService.formatBytes(updatedQuota.used),
            limitFormatted: storageService.formatBytes(updatedQuota.limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Error uploading invoice attachment:", error);

      // Handle specific error types
      if (error.message.includes("quota exceeded")) {
        return res.status(413).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || "Failed to upload attachment",
      });
    }
  }
);

/**
 * DELETE /api/storage/delete-invoice-attachment
 * Delete invoice attachment and update quota
 *
 * Body:
 * - attachmentId: string (required)
 */
router.delete(
  "/delete-invoice-attachment",
  authMiddleware,
  customerOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { attachmentId } = req.body;

      if (!attachmentId) {
        return res.status(400).json({
          success: false,
          error: "Attachment ID is required",
        });
      }

      const customerId = req.user!.customerId!;
      const prisma = (await import("../lib/db")).default;

      // 1. Get attachment record
      const attachment = await prisma.invoice_attachments.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        return res.status(404).json({
          success: false,
          error: "Attachment not found",
        });
      }

      // 2. Verify ownership
      if (attachment.customer_id !== customerId) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only delete your own attachments.",
        });
      }

      // 3. Delete from Digital Ocean Spaces
      await storageService.deleteFile(customerId, attachment.file_path);

      // 4. Delete database record
      await prisma.invoice_attachments.delete({
        where: { id: attachmentId },
      });

      // 5. Return updated quota
      const updatedQuota = await storageService.checkStorageQuota(
        customerId,
        0
      );

      res.json({
        success: true,
        message: "Attachment deleted successfully",
        data: {
          quota: {
            used: updatedQuota.used,
            limit: updatedQuota.limit,
            available: updatedQuota.available,
            percentage: updatedQuota.percentage,
          },
        },
      });
    } catch (error: any) {
      console.error("Error deleting invoice attachment:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;

