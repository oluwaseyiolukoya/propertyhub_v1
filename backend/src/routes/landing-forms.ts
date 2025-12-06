import express, { Request, Response } from 'express';
import { landingFormsService } from '../services/landing-forms.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

/**
 * Validation schemas
 */
const submissionSchema = z.object({
  formType: z.enum(['contact_us', 'schedule_demo', 'blog_inquiry', 'community_request', 'partnership', 'support']),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  preferredDate: z.string().datetime().optional(),
  preferredTime: z.string().optional(),
  timezone: z.string().optional(),
  source: z.string().optional(),
  referralUrl: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  customFields: z.any().optional(),
});

/**
 * PUBLIC ENDPOINTS
 */

/**
 * POST /api/landing-forms/submit
 * Submit a landing page form (public endpoint)
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    console.log('📥 Landing form submission received:', {
      formType: req.body.formType,
      name: req.body.name,
      email: req.body.email,
      hasMessage: !!req.body.message,
      messageLength: req.body.message?.length
    });

    // Validate request body
    const validatedData = submissionSchema.parse(req.body);

    // Get IP and user agent
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    // Submit form
    const submission = await landingFormsService.submitForm(
      validatedData,
      ipAddress,
      userAgent
    );

    console.log('✅ Form submitted successfully:', submission.id);

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.createdAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Form submission error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        details: error.errors,
      });
    }

    if (error.message === 'Too many submissions. Please try again tomorrow.') {
      return res.status(429).json({
        success: false,
        error: error.message,
      });
    }

    // Return more detailed error in development/staging
    const isDevelopment = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      error: 'Failed to submit form',
      ...(isDevelopment && {
        details: error.message,
        errorType: error.name
      }),
    });
  }
});

/**
 * GET /api/landing-forms/status/:id
 * Get submission status (public endpoint with rate limiting)
 */
router.get('/status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const submission = await landingFormsService.getSubmissionById(id);

    res.json({
      success: true,
      data: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.createdAt,
        responseStatus: submission.responseStatus,
      },
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    res.status(404).json({
      success: false,
      error: 'Submission not found',
    });
  }
});

/**
 * ADMIN ENDPOINTS (Protected)
 */

/**
 * GET /api/landing-forms/admin
 * Get all submissions with filters (admin only)
 */
router.get('/admin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📥 Landing forms GET /admin request received');
    console.log('Query params:', req.query);

    const filters = {
      formType: req.query.formType as string,
      status: req.query.status as string,
      priority: req.query.priority as string,
      search: req.query.search as string,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      assignedToId: req.query.assignedToId as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      showArchived: req.query.showArchived === 'true', // Parse showArchived boolean
    };

    console.log('📊 Filters being applied:', filters);

    const result = await landingFormsService.getSubmissions(filters);

    console.log('✅ Found submissions:', result.submissions?.length || 0);
    console.log('📦 Sending response:', { success: true, totalSubmissions: result.submissions?.length });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Get submissions error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
      details: error.message,
    });
  }
});

/**
 * GET /api/admin/landing-forms/stats
 * Get statistics (admin only)
 */
router.get('/admin/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Parse date parameters, handle "undefined" string and invalid dates
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    if (req.query.dateFrom && req.query.dateFrom !== 'undefined') {
      const parsedFrom = new Date(req.query.dateFrom as string);
      dateFrom = isNaN(parsedFrom.getTime()) ? undefined : parsedFrom;
    }

    if (req.query.dateTo && req.query.dateTo !== 'undefined') {
      const parsedTo = new Date(req.query.dateTo as string);
      dateTo = isNaN(parsedTo.getTime()) ? undefined : parsedTo;
    }

    const stats = await landingFormsService.getStatistics(dateFrom, dateTo);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message,
    });
  }
});

/**
 * GET /api/admin/landing-forms/:id
 * Get single submission by ID (admin only)
 */
router.get('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const submission = await landingFormsService.getSubmissionById(id);

    res.json({
      success: true,
      data: submission,
    });
  } catch (error: any) {
    console.error('Get submission error:', error);
    res.status(404).json({
      success: false,
      error: 'Submission not found',
    });
  }
});

/**
 * PATCH /api/admin/landing-forms/:id
 * Update submission (admin only)
 */
router.patch('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const submission = await landingFormsService.updateSubmission(id, updates);

    res.json({
      success: true,
      message: 'Submission updated successfully',
      data: submission,
    });
  } catch (error: any) {
    console.error('Update submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update submission',
    });
  }
});

/**
 * DELETE /api/admin/landing-forms/:id
 * Soft delete submission (admin only) - Archive
 */
router.delete('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await landingFormsService.deleteSubmission(id);

    res.json({
      success: true,
      message: 'Submission archived successfully',
    });
  } catch (error: any) {
    console.error('Archive submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive submission',
    });
  }
});

/**
 * DELETE /api/admin/landing-forms/:id/permanent
 * Permanently delete submission (admin only) - Hard Delete
 */
router.delete('/admin/:id/permanent', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Permanently deleting submission: ${id}`);

    await landingFormsService.permanentDeleteSubmission(id);

    console.log(`✅ Submission ${id} permanently deleted`);

    res.json({
      success: true,
      message: 'Submission permanently deleted',
    });
  } catch (error: any) {
    console.error('Permanent delete submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to permanently delete submission',
    });
  }
});

/**
 * POST /api/admin/landing-forms/:id/respond
 * Add response to submission (admin only)
 */
router.post('/admin/:id/respond', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { responseType, content, attachments } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const response = await landingFormsService.addResponse(id, {
      responseType,
      content,
      respondedById: req.user.id,
      attachments,
    });

    res.json({
      success: true,
      message: 'Response added successfully',
      data: response,
    });
  } catch (error: any) {
    console.error('Add response error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add response',
    });
  }
});

/**
 * POST /api/admin/landing-forms/:id/assign
 * Assign submission to admin (admin only)
 */
router.post('/admin/:id/assign', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'Admin ID is required',
      });
    }

    const submission = await landingFormsService.assignSubmission(id, adminId);

    res.json({
      success: true,
      message: 'Submission assigned successfully',
      data: submission,
    });
  } catch (error: any) {
    console.error('Assign submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign submission',
    });
  }
});

/**
 * POST /api/admin/landing-forms/bulk-action
 * Perform bulk action on submissions (admin only)
 */
router.post('/admin/bulk-action', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ids, action, value } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid submission IDs',
      });
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required',
      });
    }

    const result = await landingFormsService.bulkAction(ids, action, value);

    res.json({
      success: true,
      message: `Bulk action '${action}' completed successfully`,
      data: result,
    });
  } catch (error: any) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform bulk action',
    });
  }
});

/**
 * GET /api/admin/landing-forms/export
 * Export submissions as CSV (admin only)
 */
router.get('/admin/export', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const filters = {
      formType: req.query.formType as string,
      status: req.query.status as string,
      priority: req.query.priority as string,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
    };

    const csv = await landingFormsService.exportSubmissions(filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=landing-forms-${Date.now()}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export submissions',
    });
  }
});

export default router;

