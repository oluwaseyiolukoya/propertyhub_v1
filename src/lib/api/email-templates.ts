/**
 * Email Templates API (Admin)
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  category?: string;
  subject: string;
  body_html: string;
  body_text?: string;
  variables: Array<{ name: string; description: string; required?: boolean }>;
  is_system: boolean;
  is_active: boolean;
  version: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  updater?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface EmailTemplateFilters {
  type?: string;
  category?: string;
  is_active?: boolean;
  search?: string;
}

export interface CreateEmailTemplateData {
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

export interface UpdateEmailTemplateData extends Partial<CreateEmailTemplateData> {}

export interface PreviewEmailTemplateData {
  variables: Record<string, any>;
}

export interface TestEmailTemplateData {
  recipientEmail: string;
  variables?: Record<string, any>;
}

export interface DuplicateEmailTemplateData {
  name: string;
}

/**
 * Get all email templates
 */
export const getEmailTemplates = async (filters?: EmailTemplateFilters) => {
  const queryParams = new URLSearchParams();
  if (filters?.type) queryParams.append('type', filters.type);
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.is_active !== undefined) queryParams.append('is_active', String(filters.is_active));
  if (filters?.search) queryParams.append('search', filters.search);

  const endpoint = queryParams.toString()
    ? `${API_ENDPOINTS.EMAIL_TEMPLATES.LIST}?${queryParams.toString()}`
    : API_ENDPOINTS.EMAIL_TEMPLATES.LIST;

  return apiClient.get<EmailTemplate[]>(endpoint);
};

/**
 * Get single email template by ID
 */
export const getEmailTemplate = async (id: string) => {
  return apiClient.get<EmailTemplate>(API_ENDPOINTS.EMAIL_TEMPLATES.GET(id));
};

/**
 * Get email template by type
 */
export const getEmailTemplateByType = async (type: string) => {
  return apiClient.get<EmailTemplate>(API_ENDPOINTS.EMAIL_TEMPLATES.GET_BY_TYPE(type));
};

/**
 * Seed default email templates
 */
export const seedEmailTemplates = async () => {
  return apiClient.post<{ message: string; created: number; updated: number; total: number }>(
    `${API_ENDPOINTS.EMAIL_TEMPLATES.LIST}/seed`,
    {}
  );
};

/**
 * Create email template
 */
export const createEmailTemplate = async (data: CreateEmailTemplateData) => {
  return apiClient.post<EmailTemplate>(API_ENDPOINTS.EMAIL_TEMPLATES.CREATE, data);
};

/**
 * Update email template
 */
export const updateEmailTemplate = async (id: string, data: UpdateEmailTemplateData) => {
  return apiClient.put<EmailTemplate>(API_ENDPOINTS.EMAIL_TEMPLATES.UPDATE(id), data);
};

/**
 * Delete email template
 */
export const deleteEmailTemplate = async (id: string) => {
  return apiClient.delete<{ message: string }>(API_ENDPOINTS.EMAIL_TEMPLATES.DELETE(id));
};

/**
 * Preview email template with sample data
 */
export const previewEmailTemplate = async (id: string, data: PreviewEmailTemplateData) => {
  return apiClient.post<{
    subject: string;
    body_html: string;
    body_text: string;
  }>(API_ENDPOINTS.EMAIL_TEMPLATES.PREVIEW(id), data);
};

/**
 * Send test email
 */
export const testEmailTemplate = async (id: string, data: TestEmailTemplateData) => {
  return apiClient.post<{
    message: string;
    recipient: string;
  }>(API_ENDPOINTS.EMAIL_TEMPLATES.TEST(id), data);
};

/**
 * Duplicate email template
 */
export const duplicateEmailTemplate = async (id: string, data: DuplicateEmailTemplateData) => {
  return apiClient.post<EmailTemplate>(API_ENDPOINTS.EMAIL_TEMPLATES.DUPLICATE(id), data);
};

