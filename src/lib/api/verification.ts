import { apiClient } from '../api-client';
import type {
  VerificationStatus,
  VerificationRequest,
  VerificationHistory,
  VerificationAnalytics,
  PaginatedRequests,
  DocumentType
} from '../../types/verification';

/**
 * User Verification APIs
 */

/**
 * Start verification process
 */
export const startVerification = async () => {
  return apiClient.post<{ success: boolean; requestId: string; status: string }>('/api/verification/start', {});
};

/**
 * Upload verification document
 */
export const uploadVerificationDocument = async (
  requestId: string,
  file: File,
  documentType: DocumentType,
  documentNumber?: string,
  metadata?: {
    firstName?: string;
    lastName?: string;
    dob?: string;
  }
) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('requestId', requestId);
  formData.append('documentType', documentType);

  if (documentNumber) {
    formData.append('documentNumber', documentNumber);
  }

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  return apiClient.post<{ success: boolean; documentId: string; status: string }>(
    '/api/verification/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
};

/**
 * Get verification status for current user
 */
export const getVerificationStatus = async () => {
  return apiClient.get<VerificationStatus>('/api/verification/status');
};

/**
 * Get verification history
 */
export const getVerificationHistory = async (requestId: string) => {
  return apiClient.get<{ history: VerificationHistory[] }>(`/api/verification/history/${requestId}`);
};

/**
 * Admin Verification APIs
 */

/**
 * Get all verification requests (admin)
 */
export const getVerificationRequests = async (
  status?: string,
  page: number = 1,
  limit: number = 20,
  email?: string
) => {
  // NOTE: apiClient.get expects the second argument to be the params object itself,
  // not an object with a nested `params` property. Passing `{ params: {...} }`
  // results in a query string like `?params=[object+Object]`.
  const params: any = {};
  // Only include status when it's a concrete filter (not 'all' or undefined)
  if (status && status !== 'all') {
    params.status = status;
  }
  params.page = page;
  params.limit = limit;

  if (email && email.trim()) {
    params.email = email.trim();
  }

  return apiClient.get<PaginatedRequests>('/api/admin/verification/requests', params);
};

/**
 * Get request details (admin)
 */
export const getRequestDetails = async (requestId: string) => {
  return apiClient.get<VerificationRequest>(`/api/admin/verification/requests/${requestId}`);
};

/**
 * Approve verification request (admin)
 */
export const approveVerification = async (requestId: string) => {
  return apiClient.post<{ success: boolean }>(`/api/admin/verification/requests/${requestId}/approve`, {});
};

/**
 * Reject verification request (admin)
 */
export const rejectVerification = async (requestId: string, reason: string) => {
  return apiClient.post<{ success: boolean }>(
    `/api/admin/verification/requests/${requestId}/reject`,
    { reason }
  );
};

/**
 * Get verification analytics (admin)
 */
export const getVerificationAnalytics = async () => {
  return apiClient.get<VerificationAnalytics>('/api/admin/verification/analytics');
};

export const getDocumentDownloadUrl = async (documentId: string) => {
  return apiClient.get<{ url: string; document: any; expiresIn: number }>(`/api/admin/verification/documents/${documentId}/download`);
};

/**
 * Delete verification request (admin)
 */
export const deleteVerificationRequest = async (requestId: string) => {
  return apiClient.delete<{ success: boolean }>(`/api/admin/verification/requests/${requestId}`);
};

/**
 * Reset customer KYC (admin)
 */
export const resetCustomerKyc = async (customerId: string) => {
  return apiClient.post<{ success: boolean; message: string }>(`/api/admin/verification/customers/${customerId}/reset`, {});
};

/**
 * Reset tenant (user-level) KYC (admin)
 */
export const resetTenantKyc = async (customerId: string, userId: string) => {
  // Append userId as query param
  return apiClient.post<{ success: boolean; message: string }>(`/api/admin/verification/customers/${customerId}/reset?userId=${encodeURIComponent(userId)}`, {});
};

/**
 * Get provider logs (admin)
 */
export const getProviderLogs = async (provider?: string, limit: number = 50) => {
  return apiClient.get<{ logs: any[] }>('/api/admin/verification/provider-logs', {
    params: { provider, limit }
  });
};

/**
 * KYC-Specific APIs
 */

/**
 * Submit KYC verification request
 */
export const submitKycVerification = async () => {
  return apiClient.post<{ success: boolean; requestId: string; status: string }>(
    '/api/verification/kyc/submit',
    {}
  );
};

/**
 * Get KYC status for current user
 */
export const getKycStatus = async () => {
  return apiClient.get<{
    success: boolean;
    kycStatus: string;
    kycFailureReason: string | null;
    kycCompletedAt: string | null;
    requiresKyc: boolean;
    verificationDetails: any;
  }>('/api/verification/kyc/status');
};

