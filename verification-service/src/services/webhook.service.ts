import crypto from 'crypto';
import prisma from '../config/database';
import { config } from '../config/env';
import { notificationService } from './notification.service';

/**
 * Webhook Service
 * Handles webhooks from verification providers (Dojah, etc.)
 */
export class WebhookService {
  /**
   * Verify Dojah webhook signature
   * @param payload - Webhook payload
   * @param signature - Signature from header
   */
  verifyDojahSignature(payload: any, signature: string): boolean {
    try {
      const secret = config.dojah.webhookSecret;

      if (!secret) {
        console.warn('[WebhookService] Dojah webhook secret not configured');
        return true; // Allow in development
      }

      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return computedSignature === signature;
    } catch (error) {
      console.error('[WebhookService] Failed to verify signature:', error);
      return false;
    }
  }

  /**
   * Handle Dojah webhook
   * @param payload - Webhook payload
   */
  async handleDojahWebhook(payload: any) {
    try {
      console.log('[WebhookService] Processing Dojah webhook:', payload.event_type);

      const { event_type, data } = payload;

      switch (event_type) {
        case 'verification.completed':
          await this.handleVerificationCompleted(data);
          break;

        case 'verification.failed':
          await this.handleVerificationFailed(data);
          break;

        default:
          console.log(`[WebhookService] Unknown event type: ${event_type}`);
      }

      // Log webhook receipt
      await prisma.provider_logs.create({
        data: {
          provider: 'dojah',
          endpoint: '/webhook',
          requestPayload: payload,
          responsePayload: { processed: true },
          statusCode: 200,
          duration: 0,
          success: true,
        },
      });

      console.log('[WebhookService] ✅ Webhook processed successfully');
    } catch (error) {
      console.error('[WebhookService] Failed to process webhook:', error);
      throw error;
    }
  }

  /**
   * Handle verification completed event
   */
  private async handleVerificationCompleted(data: any) {
    try {
      const { reference_id, status, confidence, entity } = data;

      // Find document by provider reference
      const document = await prisma.verification_documents.findFirst({
        where: { providerReference: reference_id },
        include: { request: true },
      });

      if (!document) {
        console.warn(`[WebhookService] Document not found for reference: ${reference_id}`);
        return;
      }

      // Update document status
      await prisma.verification_documents.update({
        where: { id: document.id },
        data: {
          status: status === 'success' ? 'verified' : 'failed',
          confidence: confidence || 0,
          verificationData: entity,
          verifiedAt: new Date(),
        },
      });

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId: document.requestId,
          action: 'webhook_received',
          performedBy: 'system',
          details: {
            provider: 'dojah',
            referenceId: reference_id,
            status,
          },
        },
      });

      // Check if all documents are processed
      const allDocuments = await prisma.verification_documents.findMany({
        where: { requestId: document.requestId },
      });

      const pendingDocuments = allDocuments.filter(
        d => d.status === 'pending' || d.status === 'in_progress'
      );

      if (pendingDocuments.length === 0) {
        const allVerified = allDocuments.every(d => d.status === 'verified');
        const newStatus = allVerified ? 'approved' : 'rejected';

        await prisma.verification_requests.update({
          where: { id: document.requestId },
          data: {
            status: newStatus,
            completedAt: new Date(),
          },
        });

        // Send notification
        await notificationService.notifyVerificationComplete(
          document.request.customerId,
          newStatus,
          {
            requestId: document.requestId,
            totalDocuments: allDocuments.length,
          }
        );
      }

      console.log(`[WebhookService] ✅ Verification completed for document ${document.id}`);
    } catch (error) {
      console.error('[WebhookService] Failed to handle verification completed:', error);
      throw error;
    }
  }

  /**
   * Handle verification failed event
   */
  private async handleVerificationFailed(data: any) {
    try {
      const { reference_id, error_message } = data;

      // Find document by provider reference
      const document = await prisma.verification_documents.findFirst({
        where: { providerReference: reference_id },
        include: { request: true },
      });

      if (!document) {
        console.warn(`[WebhookService] Document not found for reference: ${reference_id}`);
        return;
      }

      // Update document status
      await prisma.verification_documents.update({
        where: { id: document.id },
        data: {
          status: 'failed',
          failureReason: error_message,
        },
      });

      // Log history
      await prisma.verification_history.create({
        data: {
          requestId: document.requestId,
          action: 'verification_failed',
          performedBy: 'system',
          details: {
            provider: 'dojah',
            referenceId: reference_id,
            error: error_message,
          },
        },
      });

      // Notify customer
      await notificationService.notifyDocumentFailed(
        document.request.customerId,
        document.documentType,
        error_message
      );

      console.log(`[WebhookService] ✅ Verification failed for document ${document.id}`);
    } catch (error) {
      console.error('[WebhookService] Failed to handle verification failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService();

