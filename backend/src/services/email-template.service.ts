import prisma from '../lib/db';

export interface EmailTemplateData {
  name: string;
  type: string;
  category?: string;
  subject: string;
  body_html: string;
  body_text?: string;
  variables?: Array<{ name: string; description: string; required?: boolean }>;
  is_system?: boolean;
  is_active?: boolean;
}

export interface EmailTemplateFilters {
  type?: string;
  category?: string;
  is_active?: boolean;
  search?: string;
}

export class EmailTemplateService {
  /**
   * Get all email templates with optional filters
   */
  async getAllTemplates(filters?: EmailTemplateFilters) {
    try {
      const where: any = {};

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { subject: { contains: filters.search, mode: 'insensitive' } },
          { type: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Fetch templates without relations for now (relations may not be set up)
      const templates = await prisma.email_templates.findMany({
        where,
        orderBy: [
          { is_system: 'desc' },
          { type: 'asc' },
          { name: 'asc' },
        ],
      });

      // Ensure we always return an array
      return Array.isArray(templates) ? templates : [];
    } catch (error: any) {
      console.error('Error in getAllTemplates:', error);
      console.error('Error stack:', error.stack);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  /**
   * Get single template by ID
   */
  async getTemplateById(id: string) {
    // Fetch template without relations for now (relations may not be set up)
    return await prisma.email_templates.findUnique({
      where: { id },
    });
  }

  /**
   * Get active template by type
   */
  async getTemplateByType(type: string) {
    return await prisma.email_templates.findFirst({
      where: {
        type,
        is_active: true,
      },
    });
  }

  /**
   * Create new template
   */
  async createTemplate(data: EmailTemplateData, createdBy?: string) {
    // Check if template type already exists (if unique constraint allows)
    const existing = await prisma.email_templates.findUnique({
      where: { type: data.type },
    });

    if (existing) {
      throw new Error(`Template with type "${data.type}" already exists`);
    }

      const template = await prisma.email_templates.create({
        data: {
          name: data.name,
          type: data.type,
          category: data.category,
          subject: data.subject,
          body_html: data.body_html,
          body_text: data.body_text,
          variables: data.variables || [],
          is_system: data.is_system || false,
          is_active: data.is_active !== undefined ? data.is_active : true,
          version: 1,
          created_by: createdBy,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return template;
  }

  /**
   * Update template (increments version)
   */
  async updateTemplate(id: string, data: Partial<EmailTemplateData>, updatedBy?: string) {
    const existing = await prisma.email_templates.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Template with id "${id}" not found`);
    }

    if (existing.is_system && data.is_system === false) {
      throw new Error('Cannot change system template status');
    }

    // Increment version if content changed
    const contentChanged =
      data.subject !== undefined ||
      data.body_html !== undefined ||
      data.body_text !== undefined;

    const updateData: any = {
      ...data,
      updated_by: updatedBy,
      updated_at: new Date(),
    };

    if (contentChanged) {
      updateData.version = existing.version + 1;
    }

    const template = await prisma.email_templates.update({
      where: { id },
      data: updateData,
    });

    return template;
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string) {
    const template = await prisma.email_templates.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error(`Template with id "${id}" not found`);
    }

    // Allow deletion of all templates, including system templates
    // Admin can always delete templates if needed
    return await prisma.email_templates.delete({
      where: { id },
    });
  }

  /**
   * Duplicate template
   */
  async duplicateTemplate(id: string, newName: string, createdBy?: string) {
    const template = await prisma.email_templates.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error(`Template with id "${id}" not found`);
    }

    // Generate new type by appending timestamp or random string
    const newType = `${template.type}_copy_${Date.now()}`;

    return await prisma.email_templates.create({
      data: {
        name: newName,
        type: newType,
        category: template.category,
        subject: template.subject,
        body_html: template.body_html,
        body_text: template.body_text,
        variables: template.variables as any,
        is_system: false, // Duplicates are never system templates
        is_active: template.is_active,
        version: 1,
        created_by: createdBy,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * Validate variables against template requirements
   */
  validateVariables(
    template: { variables: any },
    providedVariables: Record<string, any>
  ): { valid: boolean; missing: string[]; errors: string[] } {
    const templateVars = (template.variables as Array<{ name: string; required?: boolean }>) || [];
    const missing: string[] = [];
    const errors: string[] = [];

    // Check required variables
    templateVars.forEach((varDef) => {
      if (varDef.required && !providedVariables[varDef.name]) {
        missing.push(varDef.name);
      }
    });

    return {
      valid: missing.length === 0,
      missing,
      errors,
    };
  }
}

export const emailTemplateService = new EmailTemplateService();

