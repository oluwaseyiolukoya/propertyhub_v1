import prisma from '../config/database';
import { queueService } from './queue.service';
import { encrypt } from '../lib/encryption';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/env';
import crypto from 'crypto';

/**
 * Verification Service
 * Handles verification request creation, document upload, and status checking
 */
export class VerificationService {
  private s3Client: S3Client;

  constructor() {
    // Configure S3 client for DigitalOcean Spaces
    this.s3Client = new S3Client({
      region: config.spaces.region,
      endpoint: config.spaces.endpoint,
      credentials: {
        accessKeyId: config.spaces.accessKeyId,
        secretAccessKey: config.spaces.secretAccessKey,
      },
      forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
    });
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
      console.log(`[VerificationService] Creating request for customer ${customerId} (${customerEmail})`);

      // Check if customer already has a pending/in_progress request
      const existingRequest = await prisma.verification_requests.findFirst({
        where: {
          customerId,
          status: {
            in: ['pending', 'in_progress'],
          },
        },
      });

      if (existingRequest) {
        console.log(`[VerificationService] Customer already has pending request: ${existingRequest.id}`);
        return existingRequest;
      }

      // Create new request
      const request = await prisma.verification_requests.create({
        data: {
          customerId,
          customerEmail,
          customerType,
          status: 'pending',
          ipAddress,
          userAgent,
        },
      });

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId: request.id,
          action: 'request_created',
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
      console.error('[VerificationService] Failed to create request:', error);
      throw new Error('Failed to create verification request');
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
      console.log(`[VerificationService] Uploading document for request ${requestId}`);

      // Validate request exists and is in correct status
      const request = await prisma.verification_requests.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new Error('Verification request not found');
      }

      if (!['pending', 'in_progress'].includes(request.status)) {
        throw new Error(`Cannot upload documents for request with status: ${request.status}`);
      }

      // Validate document type
      const validTypes = ['nin', 'passport', 'drivers_license', 'voters_card', 'utility_bill', 'proof_of_address'];
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

      if (existingDoc) {
        throw new Error(`Document type ${documentType} already uploaded`);
      }

      // Upload file to S3
      const fileKey = `verification/${requestId}/${documentType}/${Date.now()}-${file.originalname}`;
      const uploadCommand = new PutObjectCommand({
        Bucket: config.spaces.bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256',
      });

      await this.s3Client.send(uploadCommand);

      // DigitalOcean Spaces URL format: https://bucket-name.region.digitaloceanspaces.com/file-key
      const fileUrl = `https://${config.spaces.bucket}.${config.spaces.region}.digitaloceanspaces.com/${fileKey}`;

      console.log(`[VerificationService] File uploaded to S3: ${fileKey}`);

      // Encrypt document number if provided
      const encryptedNumber = documentNumber ? encrypt(documentNumber) : null;

      // Create document record
      const document = await prisma.verification_documents.create({
        data: {
          requestId,
          documentType,
          documentNumber: encryptedNumber,
          fileUrl,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          status: 'pending',
          verificationData: metadata || {},
        },
      });

      // Update request status to in_progress
      await prisma.verification_requests.update({
        where: { id: requestId },
        data: { status: 'in_progress' },
      });

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId,
          action: 'document_uploaded',
          performedBy: request.customerId,
          details: {
            documentId: document.id,
            documentType,
            fileName: file.originalname,
          },
        },
      });

      // Add to verification queue
      const jobId = await queueService.addVerificationJob(document.id, 5);

      console.log(`[VerificationService] ✅ Document uploaded and queued: ${document.id} (Job: ${jobId})`);

      return document;
    } catch (error: any) {
      console.error('[VerificationService] Failed to upload document:', error);
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
        throw new Error('Verification request not found');
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
      console.error('[VerificationService] Failed to get status:', error);
      throw new Error('Failed to get verification status');
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
        orderBy: { submittedAt: 'desc' },
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
          status: 'not_started',
          message: 'No verification request found',
        };
      }

      return {
        verified: request.status === 'approved',
        status: request.status,
        requestId: request.id,
        submittedAt: request.submittedAt,
        completedAt: request.completedAt,
        documents: request.documents,
        rejectionReason: request.rejectionReason,
      };
    } catch (error) {
      console.error('[VerificationService] Failed to get customer verification:', error);
      throw new Error('Failed to get customer verification status');
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
        orderBy: { createdAt: 'desc' },
      });

      return history;
    } catch (error) {
      console.error('[VerificationService] Failed to get history:', error);
      throw new Error('Failed to get verification history');
    }
  }
}

// Export singleton instance
export const verificationService = new VerificationService();

