import axios from 'axios';
import prisma from '../../lib/db';

/**
 * Notification Service
 * Sends notifications to users via main dashboard
 */
export class NotificationService {
  private mainDashboardUrl: string;
  private apiKeyMainDashboard: string;

  constructor() {
    // When consolidated into main backend, this URL can be 'http://localhost:5000' or use internal routing
    this.mainDashboardUrl = process.env.MAIN_DASHBOARD_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
    this.apiKeyMainDashboard = process.env.API_KEY_MAIN_DASHBOARD || '';
  }

  /**
   * Notify user that verification is complete
   * @param customerId - Customer ID
   * @param status - Verification status ('approved' or 'rejected')
   * @param details - Additional details
   */
  async notifyVerificationComplete(
    customerId: string,
    status: 'approved' | 'rejected',
    details?: any
  ): Promise<boolean> {
    try {
      console.log(`[NotificationService] Notifying customer ${customerId} - Status: ${status}`);

      // Send notification to main dashboard
      // The main dashboard will handle email/in-app notifications
      await axios.post(
        `${this.mainDashboardUrl}/api/notifications/verification-complete`,
        {
          customerId,
          status,
          details,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'X-API-Key': this.apiKeyMainDashboard,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      console.log(`[NotificationService] ✅ Notification sent successfully`);
      return true;
    } catch (error: any) {
      console.error('[NotificationService] ❌ Failed to send notification:', error.message);

      // Log failed notification for retry
      await this.logFailedNotification(customerId, status, details, error.message);

      return false;
    }
  }

  /**
   * Notify user that document verification failed
   * @param customerId - Customer ID
   * @param documentType - Type of document that failed
   * @param reason - Failure reason
   */
  async notifyDocumentFailed(
    customerId: string,
    documentType: string,
    reason: string
  ): Promise<boolean> {
    try {
      console.log(`[NotificationService] Notifying customer ${customerId} - Document ${documentType} failed`);

      await axios.post(
        `${this.mainDashboardUrl}/api/notifications/document-failed`,
        {
          customerId,
          documentType,
          reason,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'X-API-Key': this.apiKeyMainDashboard,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      console.log(`[NotificationService] ✅ Document failure notification sent`);
      return true;
    } catch (error: any) {
      console.error('[NotificationService] ❌ Failed to send document failure notification:', error.message);
      return false;
    }
  }

  /**
   * Notify admin that manual review is required
   * @param requestId - Verification request ID
   * @param documentType - Type of document requiring review
   */
  async notifyAdminManualReview(
    requestId: string,
    documentType: string
  ): Promise<boolean> {
    try {
      console.log(`[NotificationService] Notifying admin - Manual review required for ${documentType}`);

      await axios.post(
        `${this.mainDashboardUrl}/api/notifications/admin-review-required`,
        {
          requestId,
          documentType,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'X-API-Key': this.apiKeyMainDashboard,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      console.log(`[NotificationService] ✅ Admin notification sent`);
      return true;
    } catch (error: any) {
      console.error('[NotificationService] ❌ Failed to send admin notification:', error.message);
      return false;
    }
  }

  /**
   * Log failed notification for retry
   */
  private async logFailedNotification(
    customerId: string,
    status: string,
    details: any,
    errorMessage: string
  ): Promise<void> {
    try {
      await prisma.verification_history.create({
        data: {
          requestId: details?.requestId || 'unknown',
          action: 'notification_failed',
          performedBy: 'system',
          details: {
            customerId,
            status,
            errorMessage,
            retryable: true,
          },
        },
      });
    } catch (error) {
      console.error('[NotificationService] Failed to log failed notification:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

