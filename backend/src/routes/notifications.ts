import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { notificationService } from '../services/notification.service';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to ensure user is authenticated
const requireAuth = authMiddleware;

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for the current user
 * @access  Private
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { unread, type, limit, offset } = req.query;

    const notifications = await notificationService.getUserNotifications(userId, {
      unreadOnly: unread === 'true',
      type: type as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      error: 'Failed to fetch unread count',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const success = await notificationService.markAsRead(id, userId);

    if (!success) {
      return res.status(404).json({ error: 'Notification not found or already read' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `Marked ${count} notifications as read`,
      count,
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const success = await notificationService.deleteNotification(id, userId);

    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get notification preferences
 * @access  Private
 */
router.get('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    if (!userId || !customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await notificationService.getPreferences(userId, customerId);

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      error: 'Failed to fetch notification preferences',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    if (!userId || !customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      email_enabled,
      email_invoice_approval,
      email_invoice_approved,
      email_invoice_rejected,
      email_invoice_paid,
      email_team_invitation,
      email_delegation,
      email_daily_digest,
      email_weekly_summary,
      inapp_enabled,
      inapp_invoice_approval,
      inapp_invoice_approved,
      inapp_invoice_rejected,
      inapp_invoice_paid,
      inapp_team_invitation,
      inapp_delegation,
      push_enabled,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
      quiet_hours_timezone,
    } = req.body;

    const updateData: any = {};

    // Email preferences
    if (email_enabled !== undefined) updateData.email_enabled = email_enabled;
    if (email_invoice_approval !== undefined) updateData.email_invoice_approval = email_invoice_approval;
    if (email_invoice_approved !== undefined) updateData.email_invoice_approved = email_invoice_approved;
    if (email_invoice_rejected !== undefined) updateData.email_invoice_rejected = email_invoice_rejected;
    if (email_invoice_paid !== undefined) updateData.email_invoice_paid = email_invoice_paid;
    if (email_team_invitation !== undefined) updateData.email_team_invitation = email_team_invitation;
    if (email_delegation !== undefined) updateData.email_delegation = email_delegation;
    if (email_daily_digest !== undefined) updateData.email_daily_digest = email_daily_digest;
    if (email_weekly_summary !== undefined) updateData.email_weekly_summary = email_weekly_summary;

    // In-app preferences
    if (inapp_enabled !== undefined) updateData.inapp_enabled = inapp_enabled;
    if (inapp_invoice_approval !== undefined) updateData.inapp_invoice_approval = inapp_invoice_approval;
    if (inapp_invoice_approved !== undefined) updateData.inapp_invoice_approved = inapp_invoice_approved;
    if (inapp_invoice_rejected !== undefined) updateData.inapp_invoice_rejected = inapp_invoice_rejected;
    if (inapp_invoice_paid !== undefined) updateData.inapp_invoice_paid = inapp_invoice_paid;
    if (inapp_team_invitation !== undefined) updateData.inapp_team_invitation = inapp_team_invitation;
    if (inapp_delegation !== undefined) updateData.inapp_delegation = inapp_delegation;

    // Push preferences
    if (push_enabled !== undefined) updateData.push_enabled = push_enabled;

    // Quiet hours
    if (quiet_hours_enabled !== undefined) updateData.quiet_hours_enabled = quiet_hours_enabled;
    if (quiet_hours_start !== undefined) updateData.quiet_hours_start = quiet_hours_start;
    if (quiet_hours_end !== undefined) updateData.quiet_hours_end = quiet_hours_end;
    if (quiet_hours_timezone !== undefined) updateData.quiet_hours_timezone = quiet_hours_timezone;

    const preferences = await notificationService.updatePreferences(userId, customerId, updateData);

    res.json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated',
    });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      error: 'Failed to update notification preferences',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/notifications/test
 * @desc    Send a test notification (for testing purposes)
 * @access  Private
 */
router.post('/test', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    if (!userId || !customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user details for email
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send notification with email
    const notification = await notificationService.notifyUser({
      customerId,
      userId,
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification from the system.',
      priority: 'high',
      sendEmail: true,
      emailSubject: 'Test Notification from Contrezz',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Test Notification</h2>
          <p>Hi ${user.name},</p>
          <p>This is a test notification from the Contrezz system.</p>
          <p>If you received this email, your notification system is working correctly! ✅</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">What's Working:</h3>
            <ul style="color: #4b5563;">
              <li>✅ In-app notifications</li>
              <li>✅ Email notifications</li>
              <li>✅ Email queue processing</li>
              <li>✅ SMTP integration</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is an automated test message. You can safely ignore it.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Contrezz Property Management Platform
          </p>
        </div>
      `,
      emailPriority: 1,
    });

    console.log(`✅ Test notification sent to user ${userId} (${user.email})`);
    console.log(`📧 Email queued for delivery`);

    res.json({
      success: true,
      data: notification,
      message: 'Test notification sent successfully. Check your email inbox (and spam folder).',
    });
  } catch (error: any) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      error: 'Failed to send test notification',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/notifications/process-queue
 * @desc    Process pending emails in the queue (can be called by cron)
 * @access  Private (should be protected in production)
 */
router.post('/process-queue', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    console.log(`📧 Processing email queue (limit: ${limit})...`);
    const processed = await notificationService.processPendingEmails(limit);

    res.json({
      success: true,
      message: `Processed ${processed} emails`,
      count: processed,
    });
  } catch (error: any) {
    console.error('Error processing email queue:', error);
    res.status(500).json({
      error: 'Failed to process email queue',
      message: error.message,
    });
  }
});

export default router;
