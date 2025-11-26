import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import prisma from '../config/database';
import { ProviderFactory } from '../providers';
import { notificationService } from '../services/notification.service';
import { decrypt } from '../lib/encryption';
import { VerificationJobData } from '../types';

/**
 * Verification Worker
 * Processes verification jobs from the queue asynchronously
 */
const worker = new Worker<VerificationJobData>(
  'verification',
  async (job: Job<VerificationJobData>) => {
    const { documentId } = job.data;

    console.log(`\n🔄 [Worker] Processing job ${job.id} for document ${documentId}`);

    try {
      // Update job progress
      await job.updateProgress(10);

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

      console.log(`[Worker] Document type: ${document.documentType}, Status: ${document.status}`);

      // Check if already processed (idempotency)
      if (document.status === 'verified' || document.status === 'failed') {
        console.log(`[Worker] ⚠️  Document already processed with status: ${document.status}`);
        return {
          success: true,
          alreadyProcessed: true,
          status: document.status,
        };
      }

      await job.updateProgress(20);

      // Update status to in_progress
      await prisma.verification_documents.update({
        where: { id: documentId },
        data: { status: 'in_progress' },
      });

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId: document.requestId,
          action: 'verification_started',
          performedBy: 'system',
          details: {
            documentId,
            documentType: document.documentType,
            provider: 'dojah',
          },
        },
      });

      await job.updateProgress(30);

      // Get verification provider
      const provider = ProviderFactory.getProvider('dojah');

      console.log(`[Worker] Using provider: ${provider.name}`);

      // Verify based on document type
      let result;

      switch (document.documentType) {
        case 'nin': {
          // Decrypt document number
          const nin = decrypt(document.documentNumber!);

          // Extract metadata (firstName, lastName, dob should be in verificationData or request)
          const metadata = document.verificationData as any || {};
          const firstName = metadata.firstName || '';
          const lastName = metadata.lastName || '';
          const dob = metadata.dob || '';

          if (!firstName || !lastName || !dob) {
            throw new Error('Missing required fields: firstName, lastName, or dob');
          }

          result = await provider.verifyNIN(nin, firstName, lastName, dob);
          break;
        }

        case 'passport': {
          const passportNumber = decrypt(document.documentNumber!);
          const metadata = document.verificationData as any || {};
          const firstName = metadata.firstName || '';
          const lastName = metadata.lastName || '';

          if (!firstName || !lastName) {
            throw new Error('Missing required fields: firstName or lastName');
          }

          result = await provider.verifyPassport(passportNumber, firstName, lastName);
          break;
        }

        case 'drivers_license': {
          const licenseNumber = decrypt(document.documentNumber!);
          const metadata = document.verificationData as any || {};
          const firstName = metadata.firstName || '';
          const lastName = metadata.lastName || '';

          if (!firstName || !lastName) {
            throw new Error('Missing required fields: firstName or lastName');
          }

          result = await provider.verifyDriversLicense(licenseNumber, firstName, lastName);
          break;
        }

        case 'voters_card': {
          const vin = decrypt(document.documentNumber!);
          const metadata = document.verificationData as any || {};
          const firstName = metadata.firstName || '';
          const lastName = metadata.lastName || '';

          if (!firstName || !lastName) {
            throw new Error('Missing required fields: firstName or lastName');
          }

          result = await provider.verifyVotersCard(vin, firstName, lastName);
          break;
        }

        case 'utility_bill':
        case 'proof_of_address': {
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
          throw new Error(`Unsupported document type: ${document.documentType}`);
      }

      await job.updateProgress(70);

      console.log(`[Worker] Verification result:`, {
        success: result.success,
        status: result.status,
        confidence: result.confidence,
      });

      // Update document with results
      await prisma.verification_documents.update({
        where: { id: documentId },
        data: {
          status: result.status === 'verified' ? 'verified' : result.status === 'pending' ? 'pending' : 'failed',
          provider: provider.name,
          providerReference: result.referenceId,
          verificationData: result.data,
          confidence: result.confidence,
          verifiedAt: result.status === 'verified' ? new Date() : null,
          failureReason: result.error,
        },
      });

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId: document.requestId,
          action: result.status === 'verified' ? 'document_verified' : 'document_failed',
          performedBy: 'system',
          details: {
            documentId,
            documentType: document.documentType,
            provider: provider.name,
            confidence: result.confidence,
            status: result.status,
          },
        },
      });

      await job.updateProgress(80);

      // Check if all documents in the request are processed
      const allDocuments = await prisma.verification_documents.findMany({
        where: { requestId: document.requestId },
      });

      const pendingDocuments = allDocuments.filter(d => d.status === 'pending' || d.status === 'in_progress');
      const verifiedDocuments = allDocuments.filter(d => d.status === 'verified');
      const failedDocuments = allDocuments.filter(d => d.status === 'failed');

      console.log(`[Worker] Request status: ${verifiedDocuments.length} verified, ${failedDocuments.length} failed, ${pendingDocuments.length} pending`);

      // If all documents are processed
      if (pendingDocuments.length === 0) {
        const allVerified = allDocuments.every(d => d.status === 'verified');
        const newStatus = allVerified ? 'approved' : 'rejected';

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
            action: allVerified ? 'request_approved' : 'request_rejected',
            performedBy: 'system',
            details: {
              totalDocuments: allDocuments.length,
              verifiedDocuments: verifiedDocuments.length,
              failedDocuments: failedDocuments.length,
              autoApproved: allVerified,
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

        console.log(`[Worker] ✅ Request ${document.requestId} completed with status: ${newStatus}`);
      } else if (result.status === 'failed') {
        // Notify customer about failed document
        await notificationService.notifyDocumentFailed(
          document.request.customerId,
          document.documentType,
          result.error || 'Verification failed'
        );
      }

      await job.updateProgress(100);

      console.log(`[Worker] ✅ Job ${job.id} completed successfully\n`);

      return {
        success: true,
        documentId,
        status: result.status,
        confidence: result.confidence,
      };

    } catch (error: any) {
      console.error(`[Worker] ❌ Job ${job.id} failed:`, error.message);

      // Update document status to failed
      try {
        await prisma.verification_documents.update({
          where: { id: documentId },
          data: {
            status: 'failed',
            failureReason: error.message,
          },
        });

        // Log error in history
        await prisma.verification_history.create({
          data: {
            requestId: (await prisma.verification_documents.findUnique({
              where: { id: documentId },
              select: { requestId: true }
            }))?.requestId || 'unknown',
            action: 'verification_error',
            performedBy: 'system',
            details: {
              documentId,
              error: error.message,
              stack: error.stack,
            },
          },
        });
      } catch (dbError) {
        console.error('[Worker] Failed to update document status:', dbError);
      }

      throw error; // Re-throw for BullMQ retry logic
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // Per second
    },
  }
);

// Worker event handlers
worker.on('completed', (job) => {
  console.log(`✅ [Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  console.error(`❌ [Worker] Job ${job?.id} failed:`, error.message);
});

worker.on('error', (error) => {
  console.error('❌ [Worker] Worker error:', error);
});

worker.on('stalled', (jobId) => {
  console.warn(`⚠️  [Worker] Job ${jobId} stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});

console.log('🚀 Verification Worker started');
console.log('📋 Concurrency: 5 jobs');
console.log('⏱️  Rate limit: 10 jobs/second');
console.log('');

export default worker;

