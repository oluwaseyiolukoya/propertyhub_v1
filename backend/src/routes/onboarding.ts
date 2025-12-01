import express, { Request, Response } from 'express';
import { onboardingService } from '../services/onboarding.service';
import { applicationSchema } from '../validators/onboarding.validator';
import { sendOnboardingConfirmation, sendEmail } from '../lib/email';
import { z } from 'zod';

const router = express.Router();

/**
 * Rate limiting map for application submissions
 * In production, use Redis or a proper rate limiting service
 */
const submissionAttempts = new Map<string, { count: number; resetAt: number }>();

// Simple rate limiting middleware
const rateLimitMiddleware = (req: Request, res: Response, next: Function) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours
  const maxAttempts = 5;

  const attempts = submissionAttempts.get(ip);

  if (attempts) {
    if (now < attempts.resetAt) {
      if (attempts.count >= maxAttempts) {
        return res.status(429).json({
          success: false,
          error: 'Too many applications submitted. Please try again tomorrow.',
        });
      }
      attempts.count++;
    } else {
      submissionAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    }
  } else {
    submissionAttempts.set(ip, { count: 1, resetAt: now + windowMs });
  }

  next();
};

/**
 * POST /api/onboarding/apply
 * Submit a new onboarding application
 * Public endpoint - no authentication required
 */
router.post('/apply', rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('[Onboarding] New application submission:', {
      email: req.body.email,
      type: req.body.applicationType,
      ip: req.ip,
    });

    // Validate request body
    const validatedData = applicationSchema.parse(req.body);

    // Get IP and user agent
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    // Submit application
    const application = await onboardingService.submitApplication(
      validatedData,
      ipAddress,
      userAgent
    );

    console.log('[Onboarding] Application submitted successfully:', {
      id: application.id,
      email: application.email,
    });

    // Send confirmation email
    let emailSent = false;
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[Onboarding] 📧 Starting confirmation email process...');
      console.log('[Onboarding] Recipient:', application.email);
      console.log('[Onboarding] Application ID:', application.id);
      console.log('[Onboarding] Application Type:', application.applicationType);
      console.log('[Onboarding] Applicant Name:', application.name);
      console.log('[Onboarding] SMTP Host:', process.env.SMTP_HOST || 'NOT SET');
      console.log('[Onboarding] SMTP Port:', process.env.SMTP_PORT || 'NOT SET');
      console.log('[Onboarding] SMTP User:', process.env.SMTP_USER || 'NOT SET');
      console.log('[Onboarding] SMTP From:', process.env.SMTP_FROM || 'NOT SET');
      console.log('[Onboarding] Has SMTP Password:', !!process.env.SMTP_PASS);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      emailSent = await sendOnboardingConfirmation({
        applicantName: application.name,
        applicantEmail: application.email,
        applicationType: application.applicationType as 'property-owner' | 'property-manager' | 'developer',
        applicationId: application.id,
        estimatedReviewTime: '24-48 hours'
      });

      if (emailSent) {
        console.log('[Onboarding] ✅✅✅ Confirmation email sent successfully to:', application.email);
      } else {
        console.error('[Onboarding] ❌❌❌ Failed to send confirmation email to:', application.email);
        console.error('[Onboarding] Email function returned false - check email.ts logs above for details');
      }
    } catch (emailError: any) {
      console.error('[Onboarding] ❌❌❌ EXCEPTION while sending confirmation email:', emailError);
      console.error('📧 Email error details:', {
        message: emailError?.message,
        code: emailError?.code,
        command: emailError?.command,
        stack: emailError?.stack?.substring(0, 500), // First 500 chars of stack
      });
      console.error('[Onboarding] Full error object:', JSON.stringify(emailError, null, 2));
      // Don't fail the application submission if email fails
    }

    // Send admin notification email (fire and forget)
    (async () => {
      try {
        console.log('[Onboarding] 📧 Sending admin notification to admin@contrezz.com...');
        const adminHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#2563eb">🔔 New Onboarding Application</h2>
            <p>A new customer application has been submitted and is awaiting review.</p>
            <table style="border-collapse:collapse;width:100%;margin-top:16px">
              <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb">Applicant Name</td><td style="padding:8px;border:1px solid #e5e7eb">${application.name}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb">Email</td><td style="padding:8px;border:1px solid #e5e7eb">${application.email}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb">Application Type</td><td style="padding:8px;border:1px solid #e5e7eb">${application.applicationType}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb">Company</td><td style="padding:8px;border:1px solid #e5e7eb">${application.companyName || 'N/A'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb">Phone</td><td style="padding:8px;border:1px solid #e5e7eb">${application.phone || 'N/A'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb">City</td><td style="padding:8px;border:1px solid #e5e7eb">${application.city || 'N/A'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb">Country</td><td style="padding:8px;border:1px solid #e5e7eb">${application.country || 'Nigeria'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb">Submitted At</td><td style="padding:8px;border:1px solid #e5e7eb">${new Date().toLocaleString()}</td></tr>
            </table>
            <p style="margin-top:20px">
              <a href="${process.env.FRONTEND_URL || 'https://contrezz.com'}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
                Review Application
              </a>
            </p>
            <p style="margin-top:16px;color:#6b7280;font-size:12px">This is an automated notification from Contrezz.</p>
          </div>
        `;
        const adminEmailSent = await sendEmail({
          to: 'admin@contrezz.com',
          subject: `🔔 New Onboarding Application: ${application.name} (${application.applicationType})`,
          html: adminHtml,
        });
        if (adminEmailSent) {
          console.log('[Onboarding] ✅ Admin notification sent to admin@contrezz.com');
        } else {
          console.error('[Onboarding] ❌ Failed to send admin notification');
        }
      } catch (adminEmailError) {
        console.error('[Onboarding] ❌ Error sending admin notification:', adminEmailError);
      }
    })();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application.id,
        status: application.status,
        estimatedReviewTime: '24-48 hours',
        submittedAt: application.createdAt,
        emailSent: emailSent,
      },
    });
  } catch (error) {
    console.error('[Onboarding] Application submission error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to submit application',
    });
  }
});

/**
 * GET /api/onboarding/status/:email
 * Check application status by email
 * Public endpoint - rate limited
 */
router.get('/status/:email', rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    // Validate email
    const emailSchema = z.string().email();
    const validatedEmail = emailSchema.parse(email);

    const application = await onboardingService.getApplicationByEmail(validatedEmail);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'No application found for this email',
      });
    }

    // Return limited information for privacy
    res.json({
      success: true,
      data: {
        status: application.status,
        submittedAt: application.createdAt,
        message: getStatusMessage(application.status),
        estimatedReviewTime: application.status === 'pending' ? '24-48 hours' : null,
      },
    });
  } catch (error) {
    console.error('[Onboarding] Status check error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to check application status',
    });
  }
});

/**
 * Helper function to get user-friendly status messages
 */
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    pending: 'Your application is pending review. We will contact you within 24-48 hours.',
    under_review: 'Your application is currently under review by our team.',
    info_requested: 'We need additional information. Please check your email.',
    approved: 'Congratulations! Your application has been approved. Check your email for next steps.',
    rejected: 'Unfortunately, your application was not approved at this time.',
    activated: 'Your account is active! You can now log in to your dashboard.',
  };

  return messages[status] || 'Application status unknown';
}

export default router;

