import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../lib/email';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  customerId: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface CreateEmailData {
  customerId: string;
  userId?: string;
  toEmail: string;
  toName?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  templateName?: string;
  templateData?: any;
  priority?: number;
  scheduledAt?: Date;
}

export class NotificationService {
  /**
   * Create an in-app notification
   */
  async createNotification(data: CreateNotificationData) {
    try {
      const notification = await prisma.notifications.create({
        data: {
          customer_id: data.customerId,
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
          action_url: data.actionUrl,
          priority: data.priority || 'normal',
        },
      });

      console.log(`✅ Notification created: ${notification.id} for user ${data.userId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create multiple notifications (bulk)
   */
  async createNotifications(notifications: CreateNotificationData[]) {
    try {
      const created = await prisma.notifications.createMany({
        data: notifications.map(n => ({
          customer_id: n.customerId,
          user_id: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          data: n.data || {},
          action_url: n.actionUrl,
          priority: n.priority || 'normal',
        })),
      });

      console.log(`✅ Created ${created.count} notifications`);
      return created;
    } catch (error) {
      console.error('❌ Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
    type?: string;
  } = {}) {
    try {
      const where: any = { user_id: userId };

      if (options.unreadOnly) {
        where.read = false;
      }

      if (options.type) {
        where.type = options.type;
      }

      const notifications = await prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      });

      return notifications;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notifications.count({
        where: {
          user_id: userId,
          read: false,
        },
      });

      return count;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notifications.updateMany({
        where: {
          id: notificationId,
          user_id: userId,
          read: false,
        },
        data: {
          read: true,
          read_at: new Date(),
        },
      });

      if (notification.count > 0) {
        console.log(`✅ Notification ${notificationId} marked as read`);
      }

      return notification.count > 0;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notifications.updateMany({
        where: {
          user_id: userId,
          read: false,
        },
        data: {
          read: true,
          read_at: new Date(),
        },
      });

      console.log(`✅ Marked ${result.count} notifications as read for user ${userId}`);
      return result.count;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      const deleted = await prisma.notifications.deleteMany({
        where: {
          id: notificationId,
          user_id: userId,
        },
      });

      return deleted.count > 0;
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Queue an email for sending
   */
  async queueEmail(data: CreateEmailData) {
    try {
      const email = await prisma.email_queue.create({
        data: {
          customer_id: data.customerId,
          user_id: data.userId,
          to_email: data.toEmail,
          to_name: data.toName,
          subject: data.subject,
          body_html: data.bodyHtml,
          body_text: data.bodyText,
          template_name: data.templateName,
          template_data: data.templateData || {},
          priority: data.priority || 5,
          scheduled_at: data.scheduledAt,
          status: 'pending',
        },
      });

      console.log(`✅ Email queued: ${email.id} to ${data.toEmail}`);
      return email;
    } catch (error) {
      console.error('❌ Error queueing email:', error);
      throw error;
    }
  }

  /**
   * Process pending emails in the queue
   */
  async processPendingEmails(limit: number = 10) {
    try {
      const pendingEmails = await prisma.email_queue.findMany({
        where: {
          status: 'pending',
          OR: [
            { scheduled_at: null },
            { scheduled_at: { lte: new Date() } },
          ],
        },
        orderBy: [
          { priority: 'desc' },
          { created_at: 'asc' },
        ],
        take: limit,
      });

      console.log(`📧 Processing ${pendingEmails.length} pending emails`);

      for (const email of pendingEmails) {
        try {
          // Mark as processing
          await prisma.email_queue.update({
            where: { id: email.id },
            data: { status: 'processing' },
          });

          // Send email
          const success = await sendEmail({
            to: email.to_email,
            subject: email.subject,
            html: email.body_html,
            text: email.body_text || undefined,
          });

          if (success) {
            // Mark as sent
            await prisma.email_queue.update({
              where: { id: email.id },
              data: {
                status: 'sent',
                sent_at: new Date(),
              },
            });
            console.log(`✅ Email sent: ${email.id}`);
          } else {
            throw new Error('Email sending failed');
          }
        } catch (error: any) {
          console.error(`❌ Error sending email ${email.id}:`, error);

          // Check if we should retry
          const shouldRetry = email.retry_count < email.max_retries;

          await prisma.email_queue.update({
            where: { id: email.id },
            data: {
              status: shouldRetry ? 'pending' : 'failed',
              retry_count: email.retry_count + 1,
              failed_at: shouldRetry ? null : new Date(),
              error_message: error.message,
            },
          });
        }
      }

      return pendingEmails.length;
    } catch (error) {
      console.error('❌ Error processing email queue:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string, customerId: string) {
    try {
      let preferences = await prisma.notification_preferences.findUnique({
        where: {
          user_id_customer_id: {
            user_id: userId,
            customer_id: customerId,
          },
        },
      });

      // Create default preferences if they don't exist
      if (!preferences) {
        preferences = await prisma.notification_preferences.create({
          data: {
            user_id: userId,
            customer_id: customerId,
          },
        });
      }

      return preferences;
    } catch (error) {
      console.error('❌ Error getting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, customerId: string, data: any) {
    try {
      const preferences = await prisma.notification_preferences.upsert({
        where: {
          user_id_customer_id: {
            user_id: userId,
            customer_id: customerId,
          },
        },
        update: data,
        create: {
          user_id: userId,
          customer_id: customerId,
          ...data,
        },
      });

      console.log(`✅ Notification preferences updated for user ${userId}`);
      return preferences;
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Check if user should receive notification based on preferences
   */
  async shouldNotify(userId: string, customerId: string, notificationType: string, channel: 'email' | 'inapp'): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(userId, customerId);

      // Check if channel is enabled
      if (channel === 'email' && !preferences.email_enabled) {
        return false;
      }
      if (channel === 'inapp' && !preferences.inapp_enabled) {
        return false;
      }

      // Check specific notification type
      const prefKey = `${channel}_${notificationType}` as keyof typeof preferences;
      if (prefKey in preferences) {
        return Boolean(preferences[prefKey]);
      }

      // Default to true if preference not found
      return true;
    } catch (error) {
      console.error('❌ Error checking notification preferences:', error);
      // Default to true on error
      return true;
    }
  }

  /**
   * Send notification with preference checks
   */
  async notifyUser(data: CreateNotificationData & { sendEmail?: boolean; emailSubject?: string; emailBody?: string; emailPriority?: number }) {
    try {
      const results: any = {};

      // Check in-app notification preference
      if (data.userId) {
        const shouldSendInApp = await this.shouldNotify(data.userId, data.customerId, data.type, 'inapp');

        if (shouldSendInApp) {
          results.inAppNotification = await this.createNotification(data);
        }
      }

      // Check email notification preference
      if (data.sendEmail && data.userId) {
        const shouldSendEmail = await this.shouldNotify(data.userId, data.customerId, data.type, 'email');

        if (shouldSendEmail) {
          const user = await prisma.users.findUnique({
            where: { id: data.userId },
            select: { email: true, name: true },
          });

          if (user) {
            results.email = await this.queueEmail({
              customerId: data.customerId,
              userId: data.userId,
              toEmail: user.email,
              toName: user.name,
              subject: data.emailSubject || data.title,
              bodyHtml: data.emailBody || data.message,
              bodyText: data.message,
              priority: data.emailPriority || 5,
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Error notifying user:', error);
      throw error;
    }
  }

  /**
   * Get notification template
   */
  async getTemplate(name: string, customerId?: string) {
    try {
      const template = await prisma.notification_templates.findFirst({
        where: {
          name,
          is_active: true,
          OR: [
            { customer_id: customerId },
            { is_system: true, customer_id: null },
          ],
        },
        orderBy: [
          { customer_id: 'desc' }, // Prefer customer-specific templates
          { created_at: 'desc' },
        ],
      });

      return template;
    } catch (error) {
      console.error('❌ Error getting notification template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    return rendered;
  }

  /**
   * Send templated notification
   */
  async sendTemplatedNotification(
    templateName: string,
    variables: Record<string, any>,
    data: Omit<CreateNotificationData, 'title' | 'message'> & { sendEmail?: boolean }
  ) {
    try {
      const template = await this.getTemplate(templateName, data.customerId);

      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }

      const title = this.renderTemplate(template.subject || '', variables);
      const message = this.renderTemplate(template.body_text || '', variables);
      const emailBody = this.renderTemplate(template.body_html || '', variables);

      return await this.notifyUser({
        ...data,
        title,
        message,
        sendEmail: data.sendEmail,
        emailSubject: title,
        emailBody,
      });
    } catch (error) {
      console.error('❌ Error sending templated notification:', error);
      throw error;
    }
  }

  /**
   * Log notification action
   */
  async logAction(
    notificationId: string,
    customerId: string,
    userId: string | null,
    action: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      await prisma.notification_logs.create({
        data: {
          notification_id: notificationId,
          customer_id: customerId,
          user_id: userId,
          action,
          details: details || {},
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      });
    } catch (error) {
      console.error('❌ Error logging notification action:', error);
      // Don't throw, logging shouldn't break the main flow
    }
  }
}

export const notificationService = new NotificationService();

