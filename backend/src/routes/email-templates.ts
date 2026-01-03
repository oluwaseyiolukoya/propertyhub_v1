import express, { Request, Response } from 'express';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import { emailTemplateService } from '../services/email-template.service';
import { templateRendererService } from '../services/template-renderer.service';
import { sendEmail } from '../lib/email';
import { seedEmailTemplates } from '../services/email-template-seed.service';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

/**
 * GET /api/admin/email-templates
 * List all email templates with optional filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, category, is_active, search } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    console.log('📧 Fetching email templates:', {
      userId,
      userRole,
      filters: { type, category, is_active, search }
    });

    const filters: any = {};
    if (type) filters.type = type as string;
    if (category) filters.category = category as string;
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (search) filters.search = search as string;

    const templates = await emailTemplateService.getAllTemplates(filters);

    // Ensure we always return an array
    const templatesArray = Array.isArray(templates) ? templates : [];

    console.log(`✅ Found ${templatesArray.length} email templates`);

    return res.json(templatesArray);
  } catch (error: any) {
    console.error('❌ Error fetching email templates:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to fetch email templates',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/admin/email-templates/type/:type
 * Get active template by type
 * NOTE: This must come before /:id route to avoid route conflicts
 */
router.get('/type/:type', async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;
    const template = await emailTemplateService.getTemplateByType(type);

    if (!template) {
      return res.status(404).json({ error: `No active template found for type: ${type}` });
    }

    return res.json(template);
  } catch (error: any) {
    console.error('Error fetching email template by type:', error);
    return res.status(500).json({ error: 'Failed to fetch email template' });
  }
});

/**
 * GET /api/admin/email-templates/:id
 * Get single email template by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const template = await emailTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json(template);
  } catch (error: any) {
    console.error('Error fetching email template:', error);
    return res.status(500).json({ error: 'Failed to fetch email template' });
  }
});

/**
 * POST /api/admin/email-templates
 * Create new email template
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      name,
      type,
      category,
      subject,
      body_html,
      body_text,
      variables,
      is_system,
      is_active,
    } = req.body;

    // Validate required fields
    if (!name || !type || !subject || !body_html) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, subject, body_html',
      });
    }

    // Validate template syntax
    const subjectValidation = templateRendererService.validateTemplate(subject);
    const htmlValidation = templateRendererService.validateTemplate(body_html);

    if (!subjectValidation.valid || !htmlValidation.valid) {
      return res.status(400).json({
        error: 'Template syntax errors',
        errors: [...subjectValidation.errors, ...htmlValidation.errors],
      });
    }

    const template = await emailTemplateService.createTemplate(
      {
        name,
        type,
        category,
        subject,
        body_html,
        body_text,
        variables,
        is_system,
        is_active,
      },
      userId
    );

    return res.status(201).json(template);
  } catch (error: any) {
    console.error('Error creating email template:', error);
    if (error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to create email template' });
  }
});

/**
 * PUT /api/admin/email-templates/:id
 * Update email template
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      name,
      type,
      category,
      subject,
      body_html,
      body_text,
      variables,
      is_active,
    } = req.body;

    // Validate template syntax if provided
    if (subject) {
      const validation = templateRendererService.validateTemplate(subject);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Subject template syntax errors',
          errors: validation.errors,
        });
      }
    }

    if (body_html) {
      const validation = templateRendererService.validateTemplate(body_html);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'HTML body template syntax errors',
          errors: validation.errors,
        });
      }
    }

    const template = await emailTemplateService.updateTemplate(
      id,
      {
        name,
        type,
        category,
        subject,
        body_html,
        body_text,
        variables,
        is_active,
      },
      userId
    );

    return res.json(template);
  } catch (error: any) {
    console.error('Error updating email template:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('system template')) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to update email template' });
  }
});

/**
 * DELETE /api/admin/email-templates/:id
 * Delete email template
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await emailTemplateService.deleteTemplate(id);
    return res.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting email template:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('system template')) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to delete email template' });
  }
});

/**
 * POST /api/admin/email-templates/:id/preview
 * Preview template with sample data
 */
router.post('/:id/preview', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { variables = {} } = req.body;

    const template = await emailTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Validate variables
    const validation = emailTemplateService.validateVariables(template, variables);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Missing required variables',
        missing: validation.missing,
      });
    }

    // Render template
    const renderedSubject = templateRendererService.renderSubject(template.subject, variables);
    const renderedHtml = templateRendererService.renderHtmlBody(template.body_html, variables);
    const renderedText = template.body_text
      ? templateRendererService.renderTemplate(template.body_text, variables)
      : templateRendererService.generatePlainText(renderedHtml, variables);

    return res.json({
      subject: renderedSubject,
      body_html: renderedHtml,
      body_text: renderedText,
    });
  } catch (error: any) {
    console.error('Error previewing email template:', error);
    return res.status(500).json({ error: 'Failed to preview email template' });
  }
});

/**
 * POST /api/admin/email-templates/:id/test
 * Send test email
 */
router.post('/:id/test', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { recipientEmail, variables = {} } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ error: 'recipientEmail is required' });
    }

    const template = await emailTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (!template.is_active) {
      return res.status(400).json({ error: 'Template is not active' });
    }

    // Validate variables (for test emails, provide defaults for missing required vars)
    const validation = emailTemplateService.validateVariables(template, variables);
    const finalVariables = { ...variables };

    // Provide default values for missing required variables in test emails
    if (!validation.valid && validation.missing.length > 0) {
      validation.missing.forEach((varName) => {
        finalVariables[varName] = `[Sample ${varName}]`;
      });
    }

    // Render template with final variables
    const renderedSubject = templateRendererService.renderSubject(template.subject, finalVariables);
    const renderedHtml = templateRendererService.renderHtmlBody(template.body_html, finalVariables);
    const renderedText = template.body_text
      ? templateRendererService.renderTemplate(template.body_text, finalVariables)
      : templateRendererService.generatePlainText(renderedHtml, finalVariables);

    // Send test email
    const emailSent = await sendEmail({
      to: recipientEmail,
      subject: `[TEST] ${renderedSubject}`,
      html: renderedHtml,
      text: renderedText,
    });

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send test email' });
    }

    return res.json({
      message: 'Test email sent successfully',
      recipient: recipientEmail,
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return res.status(500).json({ error: 'Failed to send test email' });
  }
});

/**
 * POST /api/admin/email-templates/seed
 * Seed default email templates
 */
router.post('/seed', async (req: AuthRequest, res: Response) => {
  try {
    console.log('🌱 Seeding email templates via API...');
    const result = await seedEmailTemplates();
    return res.json({
      message: 'Email templates seeded successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('❌ Error seeding email templates:', error);
    return res.status(500).json({
      error: 'Failed to seed email templates',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/admin/email-templates/:id/duplicate
 * Duplicate template
 */
router.post('/:id/duplicate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required for duplicate' });
    }

    const duplicated = await emailTemplateService.duplicateTemplate(id, name, userId);
    return res.status(201).json(duplicated);
  } catch (error: any) {
    console.error('Error duplicating email template:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to duplicate email template' });
  }
});

export default router;

