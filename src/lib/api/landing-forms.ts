/**
 * Landing Page Forms API Client
 */

import { apiClient } from '../api-client';

export interface SubmissionData {
  formType: 'contact_us' | 'schedule_demo' | 'blog_inquiry' | 'community_request' | 'partnership' | 'support';
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  subject?: string;
  message: string;
  preferredDate?: string;
  preferredTime?: string;
  timezone?: string;
  source?: string;
  referralUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  customFields?: any;
}

export interface FilterOptions {
  formType?: string;
  status?: string;
  priority?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
  showArchived?: boolean;
}

export interface UpdateData {
  status?: string;
  priority?: string;
  adminNotes?: string;
  assignedToId?: string;
  responseStatus?: string;
  internalTags?: string[];
}

export interface ResponseData {
  responseType: 'email' | 'phone' | 'meeting' | 'internal_note';
  content: string;
  attachments?: any;
}

/**
 * Public API - Form submission
 */
export const submitLandingForm = (data: SubmissionData) => {
  return apiClient.post('/api/landing-forms/submit', data);
};

/**
 * Public API - Check submission status
 */
export const checkSubmissionStatus = (id: string) => {
  return apiClient.get(`/api/landing-forms/status/${id}`);
};

/**
 * Admin API - Get all submissions with filters
 */
export const getAllSubmissions = (filters?: FilterOptions) => {
  return apiClient.get('/api/landing-forms/admin', filters as any);
};

/**
 * Admin API - Get statistics
 */
export const getSubmissionStats = (dateFrom?: string, dateTo?: string) => {
  const params: any = {};
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  return apiClient.get('/api/landing-forms/admin/stats', params);
};

/**
 * Admin API - Get single submission
 */
export const getSubmissionById = (id: string) => {
  return apiClient.get(`/api/landing-forms/admin/${id}`);
};

/**
 * Admin API - Update submission
 */
export const updateSubmission = (id: string, data: UpdateData) => {
  return apiClient.patch(`/api/landing-forms/admin/${id}`, data);
};

/**
 * Admin API - Delete submission (soft delete / archive)
 */
export const deleteSubmission = (id: string) => {
  return apiClient.delete(`/api/landing-forms/admin/${id}`);
};

/**
 * Admin API - Permanently delete submission (hard delete)
 */
export const permanentDeleteSubmission = (id: string) => {
  return apiClient.delete(`/api/landing-forms/admin/${id}/permanent`);
};

/**
 * Admin API - Add response to submission
 */
export const addResponse = (id: string, response: ResponseData) => {
  return apiClient.post(`/api/landing-forms/admin/${id}/respond`, response);
};

/**
 * Admin API - Assign submission to admin
 */
export const assignSubmission = (id: string, adminId: string) => {
  return apiClient.post(`/api/landing-forms/admin/${id}/assign`, { adminId });
};

/**
 * Admin API - Bulk action
 */
export const bulkAction = (ids: string[], action: string, value?: any) => {
  return apiClient.post('/api/landing-forms/admin/bulk-action', {
    ids,
    action,
    value,
  });
};

/**
 * Admin API - Export submissions
 */
export const exportSubmissions = (filters?: FilterOptions) => {
  return apiClient.get('/api/landing-forms/admin/export', filters as any);
};

