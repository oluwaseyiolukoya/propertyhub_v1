import express, { Request, Response } from 'express';
import { onboardingService } from '../services/onboarding.service';
import { applicationSchema } from '../validators/onboarding.validator';
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

    // TODO: Send confirmation email

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application.id,
        status: application.status,
        estimatedReviewTime: '24-48 hours',
        submittedAt: application.createdAt,
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

