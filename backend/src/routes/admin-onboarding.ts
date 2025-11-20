import express, { Request, Response } from 'express';
import { onboardingService } from '../services/onboarding.service';
import {
  applicationFiltersSchema,
  reviewApplicationSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
  requestInfoSchema,
} from '../validators/onboarding.validator';
import { z } from 'zod';

const router = express.Router();

// Note: These routes should be protected by admin authentication middleware
// Add your auth middleware here: router.use(authMiddleware, adminOnlyMiddleware);

/**
 * GET /api/admin/onboarding/applications
 * List all applications with filters and pagination
 */
router.get('/applications', async (req: Request, res: Response) => {
  try {
    console.log('[Admin Onboarding] Listing applications:', req.query);

    // Parse and validate query parameters
    const filters = applicationFiltersSchema.parse({
      status: req.query.status,
      applicationType: req.query.applicationType,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      search: req.query.search,
    });

    const result = await onboardingService.listApplications(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Admin Onboarding] List applications error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to list applications',
    });
  }
});

/**
 * GET /api/admin/onboarding/applications/:id
 * Get single application details
 */
router.get('/applications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = await onboardingService.getApplicationById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('[Admin Onboarding] Get application error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get application',
    });
  }
});

/**
 * PUT /api/admin/onboarding/applications/:id/review
 * Update review status and add notes
 */
router.put('/applications/:id/review', async (req: Request, res: Response) => {
  try {
  const { id } = req.params;
  // TODO: Get admin ID from authenticated session
  const adminId = req.body.adminId; // Use provided adminId if available

    console.log('[Admin Onboarding] Updating review:', { id, adminId });

    const validatedData = reviewApplicationSchema.parse(req.body);

    const application = await onboardingService.updateReview(id, adminId, validatedData);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: application,
    });
  } catch (error) {
    console.error('[Admin Onboarding] Update review error:', error);

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
      error: 'Failed to update review',
    });
  }
});

/**
 * POST /api/admin/onboarding/applications/:id/approve
 * Approve application and create customer account
 */
router.post('/applications/:id/approve', async (req: Request, res: Response) => {
  try {
  const { id } = req.params;
  // TODO: Get admin ID from authenticated session
  const adminId = req.body.adminId; // Use provided adminId if available

    console.log('[Admin Onboarding] Approving application:', { id, adminId });

    const validatedData = approveApplicationSchema.parse(req.body);

    const result = await onboardingService.approveApplication(id, adminId, validatedData);

    // TODO: Send approval email to applicant

    res.json({
      success: true,
      message: result.message,
      data: {
        customerId: result.customerId,
      },
    });
  } catch (error) {
    console.error('[Admin Onboarding] Approve application error:', error);

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
      error: 'Failed to approve application',
    });
  }
});

/**
 * POST /api/admin/onboarding/applications/:id/activate
 * Activate customer account and create user
 */
router.post('/applications/:id/activate', async (req: Request, res: Response) => {
  try {
  const { id } = req.params;
  // TODO: Get admin ID from authenticated session
  const adminId = req.body.adminId; // Use provided adminId if available

    console.log('[Admin Onboarding] Activating application:', { id, adminId });

    const result = await onboardingService.activateApplication(id, adminId);

    // Send activation email with temporary password
    console.log('[Admin Onboarding] Sending activation email to:', result.email);

    const { sendAccountActivationEmail } = require('../lib/email');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    let emailSent = false;
    let emailError = null;

    try {
      emailSent = await sendAccountActivationEmail({
        customerName: result.name,
        customerEmail: result.email,
        companyName: result.companyName,
        temporaryPassword: result.temporaryPassword,
        loginUrl: `${frontendUrl}/signin`,
        applicationType: result.applicationType,
      });

      if (!emailSent) {
        emailError = 'Email function returned false - delivery failed';
        console.error('❌ [Admin Onboarding] Email delivery failed for:', result.email);
      } else {
        console.log('✅ [Admin Onboarding] Activation email sent successfully to:', result.email);
      }
    } catch (emailException: any) {
      emailError = emailException.message || 'Unknown email error';
      console.error('❌ [Admin Onboarding] Email exception:', emailException);
    }

    // Validate email was sent successfully
    if (!emailSent) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('⚠️  [Admin Onboarding] VALIDATION FAILED: Email not sent');
      console.error('📧 Customer Email:', result.email);
      console.error('❌ Error:', emailError);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return res.status(500).json({
        success: false,
        error: 'Failed to send activation email',
        details: emailError,
        data: {
          temporaryPassword: result.temporaryPassword,
          customerEmail: result.email,
          note: 'Account was activated but email delivery failed. Please send credentials to customer manually.',
        },
      });
    }

    // Success - email was validated and sent
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [Admin Onboarding] VALIDATION PASSED: Email sent successfully');
    console.log('📧 Customer Email:', result.email);
    console.log('🎉 Account activated and customer notified');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.json({
      success: true,
      message: result.message,
      data: {
        temporaryPassword: result.temporaryPassword,
        emailSent: true,
        customerEmail: result.email,
        note: 'Account activated and activation email sent to customer successfully',
      },
    });
  } catch (error) {
    console.error('[Admin Onboarding] Activate application error:', error);

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to activate application',
    });
  }
});

/**
 * POST /api/admin/onboarding/applications/:id/reject
 * Reject application with reason
 */
router.post('/applications/:id/reject', async (req: Request, res: Response) => {
  try {
  const { id } = req.params;
  // TODO: Get admin ID from authenticated session
  const adminId = req.body.adminId; // Use provided adminId if available

    console.log('[Admin Onboarding] Rejecting application:', { id, adminId });

    const validatedData = rejectApplicationSchema.parse(req.body);

    const application = await onboardingService.rejectApplication(id, adminId, validatedData);

    // TODO: Send rejection email to applicant

    res.json({
      success: true,
      message: 'Application rejected',
      data: application,
    });
  } catch (error) {
    console.error('[Admin Onboarding] Reject application error:', error);

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
      error: 'Failed to reject application',
    });
  }
});

/**
 * POST /api/admin/onboarding/applications/:id/request-info
 * Request additional information from applicant
 */
router.post('/applications/:id/request-info', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // TODO: Get admin ID from authenticated session
    const adminId = req.body.adminId || 'admin-id'; // Replace with actual admin ID from session

    console.log('[Admin Onboarding] Requesting info:', { id, adminId });

    const validatedData = requestInfoSchema.parse(req.body);

    const application = await onboardingService.requestInfo(id, adminId, validatedData);

    // TODO: Send email to applicant requesting additional information

    res.json({
      success: true,
      message: 'Information request sent',
      data: application,
    });
  } catch (error) {
    console.error('[Admin Onboarding] Request info error:', error);

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
      error: 'Failed to request information',
    });
  }
});

/**
 * DELETE /api/admin/onboarding/applications/:id
 * Delete an application
 */
router.delete('/applications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('[Admin Onboarding] Deleting application:', { id });

    const result = await onboardingService.deleteApplication(id);

    res.json({
      success: true,
      message: 'Application deleted successfully',
      data: result,
    });
  } catch (error) {
    console.error('[Admin Onboarding] Delete application error:', error);

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete application',
    });
  }
});

/**
 * GET /api/admin/onboarding/stats
 * Get application statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await onboardingService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Admin Onboarding] Get stats error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
});

export default router;

