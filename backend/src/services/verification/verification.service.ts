import prisma from "../../lib/db";
import { queueService } from "./queue.service";
import { encrypt, decrypt } from "../../lib/encryption";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import https from "https";
import crypto from "crypto";
import { ProviderFactory } from "../../providers";
import { notificationService } from "./notification.service";

/**
 * Verification Service
 * Handles verification request creation, document upload, and status checking
 */
export class VerificationService {
  private s3Client: S3Client;
  private spacesBucket: string;
  private spacesRegion: string;

  constructor() {
    // Support both SPACES_BUCKET and DO_SPACES_BUCKET for compatibility
    this.spacesBucket =
      process.env.SPACES_BUCKET || process.env.DO_SPACES_BUCKET || "";
    this.spacesRegion =
      process.env.SPACES_REGION || process.env.DO_SPACES_REGION || "nyc3";

    // Log Spaces configuration for debugging
    console.log("[VerificationService] Spaces config:", {
      bucket: this.spacesBucket ? "✓ set" : "✗ MISSING",
      region: this.spacesRegion,
      endpoint: process.env.SPACES_ENDPOINT || "NOT SET - using default",
      hasAccessKey: process.env.SPACES_ACCESS_KEY_ID ? "✓ set" : "✗ MISSING",
      hasSecretKey: process.env.SPACES_SECRET_ACCESS_KEY
        ? "✓ set"
        : "✗ MISSING",
    });

    // Warn if critical env vars are missing
    const hasBucket = process.env.SPACES_BUCKET || process.env.DO_SPACES_BUCKET;
    const hasAccessKey =
      process.env.SPACES_ACCESS_KEY_ID || process.env.DO_SPACES_ACCESS_KEY_ID;
    const hasSecretKey =
      process.env.SPACES_SECRET_ACCESS_KEY ||
      process.env.DO_SPACES_SECRET_ACCESS_KEY;

    if (!hasBucket || !hasAccessKey || !hasSecretKey) {
      console.error(
        "[VerificationService] ⚠️ WARNING: Missing SPACES environment variables! Document uploads will fail."
      );
      console.error("[VerificationService] Missing:", {
        bucket: !hasBucket,
        accessKey: !hasAccessKey,
        secretKey: !hasSecretKey,
      });
    }

    // Configure S3 client for DigitalOcean Spaces
    // Support both SPACES_* and DO_SPACES_* environment variable naming
    const accessKeyId =
      process.env.SPACES_ACCESS_KEY_ID ||
      process.env.DO_SPACES_ACCESS_KEY_ID ||
      "";
    const secretAccessKey =
      process.env.SPACES_SECRET_ACCESS_KEY ||
      process.env.DO_SPACES_SECRET_ACCESS_KEY ||
      "";
    const endpoint =
      process.env.SPACES_ENDPOINT ||
      process.env.DO_SPACES_ENDPOINT ||
      `https://${this.spacesRegion}.digitaloceanspaces.com`;

    // Configure S3 client with SSL certificate handling
    // Handle "unable to get local issuer certificate" errors
    // Similar to storage.service.ts approach - use httpsAgent to handle SSL certificates
    const httpsAgent = new https.Agent({
      // In production, validate SSL certificates. In development/local, allow self-signed/incomplete certs
      // This fixes "unable to get local issuer certificate" errors
      rejectUnauthorized:
        process.env.NODE_ENV === "production" &&
        process.env.SKIP_SSL_VERIFICATION !== "true",
    });

    this.s3Client = new S3Client({
      region: this.spacesRegion,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
      requestHandler: {
        httpsAgent: httpsAgent,
      },
    });

    if (
      process.env.NODE_ENV !== "production" ||
      process.env.SKIP_SSL_VERIFICATION === "true"
    ) {
      console.warn(
        "[VerificationService] ⚠️ SSL certificate verification is relaxed (development/local mode)"
      );
    }
  }

  /**
   * Create new verification request
   * @param customerId - Customer ID from main database
   * @param customerType - Type of customer (property_owner, developer, etc.)
   * @param ipAddress - Request IP address
   * @param userAgent - Request user agent
   */
  async createRequest(
    customerId: string,
    customerType: string,
    customerEmail?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      console.log(
        `[VerificationService] Creating request for customer ${customerId} (${customerEmail})`
      );

      // Check if customer already has a pending/in_progress request
      const existingRequest = await prisma.verification_requests.findFirst({
        where: {
          customerId,
          status: {
            in: ["pending", "in_progress"],
          },
        },
      });

      if (existingRequest) {
        console.log(
          `[VerificationService] Customer already has pending request: ${existingRequest.id}`
        );
        return existingRequest;
      }

      // Create new request
      const request = await prisma.verification_requests.create({
        data: {
          customerId,
          customerEmail,
          customerType,
          status: "pending",
          ipAddress,
          userAgent,
        },
      });

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId: request.id,
          action: "request_created",
          performedBy: customerId,
          details: {
            customerType,
            ipAddress,
          },
        },
      });

      console.log(`[VerificationService] ✅ Request created: ${request.id}`);

      return request;
    } catch (error) {
      console.error("[VerificationService] Failed to create request:", error);
      throw new Error("Failed to create verification request");
    }
  }

  /**
   * Upload document for verification
   * @param requestId - Verification request ID
   * @param file - Uploaded file
   * @param documentType - Type of document
   * @param documentNumber - Document number (for NIN, passport, etc.)
   * @param metadata - Additional metadata
   */
  async uploadDocument(
    requestId: string,
    file: Express.Multer.File,
    documentType: string,
    documentNumber?: string,
    metadata?: any
  ) {
    try {
      console.log(
        `[VerificationService] Uploading document for request ${requestId}`
      );

      // Validate request exists and is in correct status
      const request = await prisma.verification_requests.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new Error("Verification request not found");
      }

      if (!["pending", "in_progress"].includes(request.status)) {
        throw new Error(
          `Cannot upload documents for request with status: ${request.status}`
        );
      }

      // Validate document type
      const validTypes = [
        "nin",
        "passport",
        "drivers_license",
        "voters_card",
        "utility_bill",
        "proof_of_address",
      ];
      if (!validTypes.includes(documentType)) {
        throw new Error(`Invalid document type: ${documentType}`);
      }

      // Check if document type already uploaded
      const existingDoc = await prisma.verification_documents.findFirst({
        where: {
          requestId,
          documentType,
        },
      });

      // Upload file to S3 (common for both new and update)
      const fileKey = `verification/${requestId}/${documentType}/${Date.now()}-${
        file.originalname
      }`;
      const bucket =
        process.env.SPACES_BUCKET ||
        process.env.DO_SPACES_BUCKET ||
        this.spacesBucket;

      if (!bucket) {
        throw new Error(
          "SPACES_BUCKET or DO_SPACES_BUCKET environment variable is not set"
        );
      }

      const uploadCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: "AES256",
      });

      await this.s3Client.send(uploadCommand);

      // DigitalOcean Spaces URL format: https://bucket-name.region.digitaloceanspaces.com/file-key
      const fileUrl = `https://${this.spacesBucket}.${this.spacesRegion}.digitaloceanspaces.com/${fileKey}`;

      console.log(`[VerificationService] File uploaded to S3: ${fileKey}`);

      // Encrypt document number if provided
      const encryptedNumber = documentNumber ? encrypt(documentNumber) : null;

      let document;

      if (existingDoc) {
        // If document exists, update it instead of throwing error
        // This allows users to re-upload documents if they made a mistake
        console.log(
          `[VerificationService] Document type ${documentType} already exists for request ${requestId}, updating existing document`
        );

        // Update existing document record
        document = await prisma.verification_documents.update({
          where: { id: existingDoc.id },
          data: {
            documentNumber: encryptedNumber,
            fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            status: "pending", // Reset status to pending for re-verification
            verificationData: metadata || {},
            updatedAt: new Date(),
          },
        });

        // Log history
        await prisma.verification_history.create({
          data: {
            requestId,
            action: "document_reuploaded",
            performedBy: request.customerId,
            details: {
              documentId: document.id,
              documentType,
              fileName: file.originalname,
              reason: "User re-uploaded document",
            },
          },
        });

        console.log(
          `[VerificationService] ✅ Document updated: ${document.id}`
        );
      } else {
        // Create new document record
        document = await prisma.verification_documents.create({
          data: {
            requestId,
            documentType,
            documentNumber: encryptedNumber,
            fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            status: "pending",
            verificationData: metadata || {},
          },
        });
      }

      // Update request status to in_progress
      await prisma.verification_requests.update({
        where: { id: requestId },
        data: { status: "in_progress" },
      });

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId,
          action: "document_uploaded",
          performedBy: request.customerId,
          details: {
            documentId: document.id,
            documentType,
            fileName: file.originalname,
          },
        },
      });

      // Try to add to verification queue (non-blocking - don't fail upload if Redis is down)
      try {
        const jobId = await Promise.race([
          queueService.addVerificationJob(document.id, 5),
          new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Queue timeout")), 5000)
          ),
        ]);
        console.log(
          `[VerificationService] ✅ Document uploaded and queued: ${document.id} (Job: ${jobId})`
        );
      } catch (queueError: any) {
        // Queue failed - process verification immediately
        console.warn(
          `[VerificationService] ⚠️ Document uploaded but queue failed: ${document.id} (${queueError.message})`
        );
        console.log(
          `[VerificationService] 🔄 Processing verification immediately (Redis unavailable)`
        );

        // Process verification immediately in the background (don't block the response)
        this.processVerificationImmediately(document.id).catch((error) => {
          console.error(
            `[VerificationService] ❌ Immediate verification failed for document ${document.id}:`,
            error
          );
        });
      }

      return document;
    } catch (error: any) {
      console.error("[VerificationService] Failed to upload document:", error);
      throw error;
    }
  }

  /**
   * Get verification request status
   * @param requestId - Verification request ID
   */
  async getStatus(requestId: string) {
    try {
      const request = await prisma.verification_requests.findUnique({
        where: { id: requestId },
        include: {
          documents: {
            select: {
              id: true,
              documentType: true,
              status: true,
              confidence: true,
              verifiedAt: true,
              failureReason: true,
              fileName: true,
            },
          },
        },
      });

      if (!request) {
        throw new Error("Verification request not found");
      }

      return {
        requestId: request.id,
        status: request.status,
        submittedAt: request.submittedAt,
        completedAt: request.completedAt,
        rejectionReason: request.rejectionReason,
        documents: request.documents,
      };
    } catch (error) {
      console.error("[VerificationService] Failed to get status:", error);
      throw new Error("Failed to get verification status");
    }
  }

  /**
   * Get customer's verification status
   * @param customerId - Customer ID
   */
  async getCustomerVerification(customerId: string) {
    try {
      const request = await prisma.verification_requests.findFirst({
        where: { customerId },
        orderBy: { submittedAt: "desc" },
        include: {
          documents: {
            select: {
              id: true,
              documentType: true,
              status: true,
              confidence: true,
              verifiedAt: true,
              failureReason: true,
              fileName: true,
            },
          },
        },
      });

      if (!request) {
        return {
          verified: false,
          status: "not_started",
          message: "No verification request found",
        };
      }

      return {
        verified: request.status === "approved",
        status: request.status,
        requestId: request.id,
        submittedAt: request.submittedAt,
        completedAt: request.completedAt,
        documents: request.documents,
        rejectionReason: request.rejectionReason,
      };
    } catch (error) {
      console.error(
        "[VerificationService] Failed to get customer verification:",
        error
      );
      throw new Error("Failed to get customer verification status");
    }
  }

  /**
   * Get verification history
   * @param requestId - Verification request ID
   */
  async getHistory(requestId: string) {
    try {
      const history = await prisma.verification_history.findMany({
        where: { requestId },
        orderBy: { createdAt: "desc" },
      });

      return history;
    } catch (error) {
      console.error("[VerificationService] Failed to get history:", error);
      throw new Error("Failed to get verification history");
    }
  }

  /**
   * Process verification immediately (synchronous processing when Redis is unavailable)
   * @param documentId - Document ID to verify
   */
  private async processVerificationImmediately(documentId: string): Promise<void> {
    try {
      console.log(
        `[VerificationService] 🔄 Processing verification immediately for document ${documentId}`
      );

      // Fetch document with request details
      const document = await prisma.verification_documents.findUnique({
        where: { id: documentId },
        include: {
          request: true,
        },
      });

      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      console.log(
        `[VerificationService] Document type: ${document.documentType}, Status: ${document.status}`
      );

      // Check if already processed (idempotency)
      if (document.status === "verified" || document.status === "failed") {
        console.log(
          `[VerificationService] ⚠️  Document already processed with status: ${document.status}`
        );
        return;
      }

      // Update status to in_progress
      await prisma.verification_documents.update({
        where: { id: documentId },
        data: { status: "in_progress" },
      });

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId: document.requestId,
          action: "verification_started",
          performedBy: "system",
          details: {
            documentId,
            documentType: document.documentType,
            provider: "dojah",
            mode: "immediate",
          },
        },
      });

      // Get verification provider
      const provider = ProviderFactory.getProvider("dojah");

      console.log(`[VerificationService] Using provider: ${provider.name}`);

      // Verify based on document type
      let result;

      switch (document.documentType) {
        case "nin": {
          // Decrypt document number
          const nin = decrypt(document.documentNumber!);

          // Extract metadata (firstName, lastName, dob should be in verificationData or request)
          const metadata = (document.verificationData as any) || {};
          const firstName = metadata.firstName || "";
          const lastName = metadata.lastName || "";
          const dob = metadata.dob || "";

          if (!firstName || !lastName || !dob) {
            throw new Error(
              "Missing required fields: firstName, lastName, or dob"
            );
          }

          result = await provider.verifyNIN(nin, firstName, lastName, dob);
          break;
        }

        case "passport": {
          const passportNumber = decrypt(document.documentNumber!);
          const metadata = (document.verificationData as any) || {};
          const firstName = metadata.firstName || "";
          const lastName = metadata.lastName || "";

          if (!firstName || !lastName) {
            throw new Error("Missing required fields: firstName or lastName");
          }

          result = await provider.verifyPassport(
            passportNumber,
            firstName,
            lastName
          );
          break;
        }

        case "drivers_license": {
          const licenseNumber = decrypt(document.documentNumber!);
          const metadata = (document.verificationData as any) || {};
          const firstName = metadata.firstName || "";
          const lastName = metadata.lastName || "";

          if (!firstName || !lastName) {
            throw new Error("Missing required fields: firstName or lastName");
          }

          result = await provider.verifyDriversLicense(
            licenseNumber,
            firstName,
            lastName
          );
          break;
        }

        case "voters_card": {
          const vin = decrypt(document.documentNumber!);
          const metadata = (document.verificationData as any) || {};
          const firstName = metadata.firstName || "";
          const lastName = metadata.lastName || "";

          if (!firstName || !lastName) {
            throw new Error("Missing required fields: firstName or lastName");
          }

          result = await provider.verifyVotersCard(vin, firstName, lastName);
          break;
        }

        case "utility_bill":
        case "proof_of_address": {
          // These require manual review
          result = await provider.verifyDocument(
            document.documentType,
            document.fileUrl,
            document.verificationData
          );

          // Notify admin for manual review
          await notificationService.notifyAdminManualReview(
            document.requestId,
            document.documentType
          );
          break;
        }

        default:
          throw new Error(
            `Unsupported document type: ${document.documentType}`
          );
      }

      console.log(`[VerificationService] Verification result:`, {
        success: result.success,
        status: result.status,
        confidence: result.confidence,
      });

      // Update document with results
      await prisma.verification_documents.update({
        where: { id: documentId },
        data: {
          status:
            result.status === "verified"
              ? "verified"
              : result.status === "pending"
              ? "pending"
              : "failed",
          provider: provider.name,
          providerReference: result.referenceId,
          verificationData: result.data,
          confidence: result.confidence,
          verifiedAt: result.status === "verified" ? new Date() : null,
          failureReason: result.error,
        },
      });

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId: document.requestId,
          action:
            result.status === "verified"
              ? "document_verified"
              : "document_failed",
          performedBy: "system",
          details: {
            documentId,
            documentType: document.documentType,
            provider: provider.name,
            confidence: result.confidence,
            status: result.status,
            mode: "immediate",
          },
        },
      });

      // Check if all documents in the request are processed
      const allDocuments = await prisma.verification_documents.findMany({
        where: { requestId: document.requestId },
      });

      const pendingDocuments = allDocuments.filter(
        (d) => d.status === "pending" || d.status === "in_progress"
      );
      const verifiedDocuments = allDocuments.filter(
        (d) => d.status === "verified"
      );
      const failedDocuments = allDocuments.filter(
        (d) => d.status === "failed"
      );

      console.log(
        `[VerificationService] Request status: ${verifiedDocuments.length} verified, ${failedDocuments.length} failed, ${pendingDocuments.length} pending`
      );

      // If all documents are processed
      if (pendingDocuments.length === 0) {
        const allVerified = allDocuments.every((d) => d.status === "verified");
        const newStatus = allVerified ? "approved" : "rejected";

        // Update request status
        await prisma.verification_requests.update({
          where: { id: document.requestId },
          data: {
            status: newStatus,
            completedAt: new Date(),
          },
        });

        // Log history
        await prisma.verification_history.create({
          data: {
            requestId: document.requestId,
            action: allVerified ? "request_approved" : "request_rejected",
            performedBy: "system",
            details: {
              totalDocuments: allDocuments.length,
              verifiedDocuments: verifiedDocuments.length,
              failedDocuments: failedDocuments.length,
              autoApproved: allVerified,
              mode: "immediate",
            },
          },
        });

        // Send notification to customer
        await notificationService.notifyVerificationComplete(
          document.request.customerId,
          newStatus,
          {
            requestId: document.requestId,
            totalDocuments: allDocuments.length,
            verifiedDocuments: verifiedDocuments.length,
          }
        );

        console.log(
          `[VerificationService] ✅ Request ${document.requestId} completed with status: ${newStatus}`
        );
      } else if (result.status === "failed") {
        // Notify customer about failed document
        await notificationService.notifyDocumentFailed(
          document.request.customerId,
          document.documentType,
          result.error || "Verification failed"
        );
      }

      console.log(
        `[VerificationService] ✅ Immediate verification completed for document ${documentId}`
      );
    } catch (error: any) {
      console.error(
        `[VerificationService] ❌ Immediate verification failed for document ${documentId}:`,
        error.message
      );

      // Update document status to failed
      try {
        await prisma.verification_documents.update({
          where: { id: documentId },
          data: {
            status: "failed",
            failureReason: error.message,
          },
        });

        // Log error in history
        await prisma.verification_history.create({
          data: {
            requestId:
              (
                await prisma.verification_documents.findUnique({
                  where: { id: documentId },
                  select: { requestId: true },
                })
              )?.requestId || "unknown",
            action: "verification_error",
            performedBy: "system",
            details: {
              documentId,
              error: error.message,
              stack: error.stack,
              mode: "immediate",
            },
          },
        });
      } catch (dbError) {
        console.error(
          "[VerificationService] Failed to update document status:",
          dbError
        );
      }

      // Re-throw to allow caller to handle if needed
      throw error;
    }
  }
}

// Export singleton instance
export const verificationService = new VerificationService();
