import prisma from '../../lib/db';
import { notificationService } from './notification.service';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Admin Service
 * Handles admin operations for verification management
 */
export class AdminService {
  private s3Client: S3Client;
  private spacesBucket: string;

  constructor() {
    this.spacesBucket = process.env.SPACES_BUCKET || '';

    // Configure S3 client for DigitalOcean Spaces
    this.s3Client = new S3Client({
      region: process.env.SPACES_REGION || 'fra1',
      endpoint: process.env.SPACES_ENDPOINT || 'https://fra1.digitaloceanspaces.com',
      credentials: {
        accessKeyId: process.env.SPACES_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: false,
    });
  }
  /**
   * List verification requests with pagination
   * @param status - Filter by status
   * @param page - Page number
   * @param limit - Items per page
   * @param email - Filter by customer email (searches main database)
   */
  async listRequests(status?: string, page: number = 1, limit: number = 20, email?: string, excludeTenants: boolean = true) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status && status !== 'all') {
        where.status = status;
      }

      // If email is provided, we need to search by customerEmail field
      if (email && email.trim()) {
        where.customerEmail = {
          contains: email.trim(),
          mode: 'insensitive', // Case-insensitive search
        };
      }

      // Exclude tenant KYC requests from admin view by default
      // Tenant KYC is handled by property owners, not system admins
      if (excludeTenants) {
        where.customerType = {
          not: 'tenant',
        };
      }

      const [requests, total] = await Promise.all([
        prisma.verification_requests.findMany({
          where,
          skip,
          take: limit,
          orderBy: { submittedAt: 'desc' },
          include: {
            documents: {
              select: {
                id: true,
                documentType: true,
                status: true,
                confidence: true,
                verifiedAt: true,
              },
            },
          },
        }),
        prisma.verification_requests.count({ where }),
      ]);

      return {
        requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[AdminService] Failed to list requests:', error);
      throw new Error('Failed to list verification requests');
    }
  }

  /**
   * Get detailed request information
   * @param requestId - Verification request ID
   */
  async getRequestDetails(requestId: string) {
    try {
      const request = await prisma.verification_requests.findUnique({
        where: { id: requestId },
        include: {
          documents: true,
          history: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!request) {
        throw new Error('Verification request not found');
      }

      return request;
    } catch (error) {
      console.error('[AdminService] Failed to get request details:', error);
      throw error;
    }
  }

  /**
   * Approve verification request
   * @param requestId - Verification request ID
   * @param adminUserId - Admin user ID
   */
  async approveRequest(requestId: string, adminUserId: string) {
    try {
      console.log(`[AdminService] Approving request ${requestId} by admin ${adminUserId}`);

      const request = await prisma.verification_requests.findUnique({
        where: { id: requestId },
        include: { documents: true },
      });

      if (!request) {
        throw new Error('Verification request not found');
      }

      if (request.status === 'approved') {
        throw new Error('Request already approved');
      }

      // Update request status and all documents to verified
      await prisma.$transaction([
        // Update request
        prisma.verification_requests.update({
          where: { id: requestId },
          data: {
            status: 'approved',
            reviewedBy: adminUserId,
            reviewedAt: new Date(),
            completedAt: new Date(),
          },
        }),
        // Update all documents to verified status
        prisma.verification_documents.updateMany({
          where: { requestId },
          data: {
            status: 'verified',
            verifiedAt: new Date(),
          },
        }),
      ]);

      console.log(`[AdminService] ✅ Updated ${request.documents.length} documents to verified status`);

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId,
          action: 'request_approved',
          performedBy: adminUserId,
          details: {
            approvedBy: adminUserId,
            totalDocuments: request.documents.length,
          },
        },
      });

      // Send notification to customer
      await notificationService.notifyVerificationComplete(
        request.customerId,
        'approved',
        {
          requestId,
          approvedBy: adminUserId,
        }
      );

      console.log(`[AdminService] ✅ Request ${requestId} approved`);

      return { success: true };
    } catch (error: any) {
      console.error('[AdminService] Failed to approve request:', error);
      throw error;
    }
  }

  /**
   * Reject verification request
   * @param requestId - Verification request ID
   * @param adminUserId - Admin user ID
   * @param reason - Rejection reason
   */
  async rejectRequest(requestId: string, adminUserId: string, reason: string) {
    try {
      console.log(`[AdminService] Rejecting request ${requestId} by admin ${adminUserId}`);

      const request = await prisma.verification_requests.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new Error('Verification request not found');
      }

      if (request.status === 'rejected') {
        throw new Error('Request already rejected');
      }

      // Update request status
      await prisma.verification_requests.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
          completedAt: new Date(),
          rejectionReason: reason,
        },
      });

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId,
          action: 'request_rejected',
          performedBy: adminUserId,
          details: {
            rejectedBy: adminUserId,
            reason,
          },
        },
      });

      // Send notification to customer
      await notificationService.notifyVerificationComplete(
        request.customerId,
        'rejected',
        {
          requestId,
          reason,
        }
      );

      console.log(`[AdminService] ✅ Request ${requestId} rejected`);

      return { success: true };
    } catch (error: any) {
      console.error('[AdminService] Failed to reject request:', error);
      throw error;
    }
  }

  /**
   * Generate pre-signed URL for document download
   * @param documentId - Document ID
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   */
  async getDocumentDownloadUrl(documentId: string, expiresIn: number = 3600) {
    try {
      console.log(`[AdminService] Generating download URL for document: ${documentId}`);

      // Get document details
      const document = await prisma.verification_documents.findUnique({
        where: { id: documentId },
        include: {
          request: true,
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Extract S3 key from fileUrl
      // Format: https://bucket.region.digitaloceanspaces.com/key
      const url = new URL(document.fileUrl);
      // Decode URL-encoded characters (e.g., %20 -> space)
      const fileKey = decodeURIComponent(url.pathname.substring(1)); // Remove leading '/' and decode

      console.log(`[AdminService] File key: ${fileKey}`);

      // Generate pre-signed URL
      const command = new GetObjectCommand({
        Bucket: this.spacesBucket,
        Key: fileKey,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      console.log(`[AdminService] ✅ Pre-signed URL generated (expires in ${expiresIn}s)`);

      // Log access in history
      await prisma.verification_history.create({
        data: {
          requestId: document.requestId,
          action: 'document_accessed',
          performedBy: 'admin', // Will be updated by route with actual admin ID
          details: {
            documentId,
            documentType: document.documentType,
            fileName: document.fileName,
          },
        },
      });

      return {
        url: presignedUrl,
        document: {
          id: document.id,
          type: document.documentType,
          fileName: document.fileName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
        },
        expiresIn,
      };
    } catch (error: any) {
      console.error('[AdminService] Failed to generate download URL:', error);
      throw error;
    }
  }

  /**
   * Get analytics dashboard data
   */
  async getAnalytics() {
    try {
      // Exclude tenant KYC from admin analytics - tenant KYC is managed by property owners
      const excludeTenantFilter = { customerType: { not: 'tenant' } };

      const [
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        inProgressRequests,
        recentRequests,
        providerStats,
      ] = await Promise.all([
        prisma.verification_requests.count({ where: excludeTenantFilter }),
        prisma.verification_requests.count({ where: { ...excludeTenantFilter, status: 'pending' } }),
        prisma.verification_requests.count({ where: { ...excludeTenantFilter, status: 'approved' } }),
        prisma.verification_requests.count({ where: { ...excludeTenantFilter, status: 'rejected' } }),
        prisma.verification_requests.count({ where: { ...excludeTenantFilter, status: 'in_progress' } }),
        prisma.verification_requests.findMany({
          where: excludeTenantFilter,
          take: 10,
          orderBy: { submittedAt: 'desc' },
          include: {
            documents: {
              select: {
                documentType: true,
                status: true,
              },
            },
          },
        }),
        prisma.provider_logs.groupBy({
          by: ['provider'],
          _count: {
            id: true,
          },
          _avg: {
            duration: true,
          },
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

      // Document type statistics
      const documentStats = await prisma.verification_documents.groupBy({
        by: ['documentType', 'status'],
        _count: {
          id: true,
        },
      });

      // Average processing time
      const avgProcessingTime = await prisma.$queryRaw<any[]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "submittedAt"))) as avg_seconds
        FROM verification_requests
        WHERE "completedAt" IS NOT NULL
        AND "submittedAt" > NOW() - INTERVAL '30 days'
      `;

      return {
        summary: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          rejected: rejectedRequests,
          inProgress: inProgressRequests,
          approvalRate: totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0,
        },
        recentRequests,
        documentStats,
        providerStats: providerStats.map(stat => ({
          provider: stat.provider,
          totalCalls: stat._count.id,
          avgDuration: stat._avg.duration,
        })),
        avgProcessingTime: avgProcessingTime[0]?.avg_seconds || 0,
      };
    } catch (error) {
      console.error('[AdminService] Failed to get analytics:', error);
      throw new Error('Failed to get analytics');
    }
  }

  /**
   * Get provider logs
   * @param provider - Provider name
   * @param limit - Number of logs to return
   */
  async getProviderLogs(provider?: string, limit: number = 50) {
    try {
      const where: any = {};
      if (provider) {
        where.provider = provider;
      }

      const logs = await prisma.provider_logs.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return logs;
    } catch (error) {
      console.error('[AdminService] Failed to get provider logs:', error);
      throw new Error('Failed to get provider logs');
    }
  }

  /**
   * Delete verification request and all related data
   * @param requestId - Verification request ID
   */
  async deleteRequest(requestId: string) {
    try {
      console.log(`[AdminService] Deleting request ${requestId}`);

      const request = await prisma.verification_requests.findUnique({
        where: { id: requestId },
        include: {
          documents: true,
          history: true,
        },
      });

      if (!request) {
        throw new Error('Verification request not found');
      }

      // Delete in transaction (cascade delete documents and history)
      await prisma.$transaction([
        // Delete verification history
        prisma.verification_history.deleteMany({
          where: { requestId },
        }),
        // Delete verification documents
        prisma.verification_documents.deleteMany({
          where: { requestId },
        }),
        // Delete the verification request
        prisma.verification_requests.delete({
          where: { id: requestId },
        }),
      ]);

      console.log(`[AdminService] ✅ Request ${requestId} deleted (${request.documents.length} documents, ${request.history.length} history entries)`);

      return {
        success: true,
        deletedDocuments: request.documents.length,
        deletedHistory: request.history.length,
      };
    } catch (error: any) {
      console.error('[AdminService] Failed to delete request:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();

