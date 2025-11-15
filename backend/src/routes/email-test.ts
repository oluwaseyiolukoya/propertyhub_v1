/**
 * Email Test Routes
 *
 * Routes for testing email configuration and sending test emails
 */

import express, { Request, Response } from 'express';
import { testEmailConnection, sendTestEmail } from '../lib/email';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware - only admins can test emails
router.use(authMiddleware);
router.use(adminOnly);

/**
 * Test email connection
 * GET /api/email-test/connection
 */
router.get('/connection', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Testing email connection...');

    const result = await testEmailConnection();

    if (result.success) {
      return res.json({
        success: true,
        message: result.message
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error('❌ Email connection test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to test email connection',
      error: error.message
    });
  }
});

/**
 * Send test email
 * POST /api/email-test/send
 * Body: { to: string }
 */
router.post('/send', async (req: AuthRequest, res: Response) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format'
      });
    }

    console.log(`📧 Sending test email to: ${to}`);

    const result = await sendTestEmail(to);

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error('❌ Send test email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

/**
 * Get email configuration (without sensitive data)
 * GET /api/email-test/config
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = {
      host: process.env.SMTP_HOST || 'mail.privateemail.com',
      port: process.env.SMTP_PORT || '465',
      secure: process.env.SMTP_SECURE !== 'false',
      user: process.env.SMTP_USER || 'Not configured',
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'Not configured',
      configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    };

    return res.json({
      success: true,
      config
    });
  } catch (error: any) {
    console.error('❌ Get email config error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get email configuration',
      error: error.message
    });
  }
});

export default router;

