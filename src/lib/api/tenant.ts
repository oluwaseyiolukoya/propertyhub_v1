/**
 * Tenant API
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

/**
 * Get tenant dashboard overview
 */
export const getTenantDashboardOverview = async () => {
  return apiClient.get<any>(API_ENDPOINTS.TENANT.DASHBOARD);
};

/**
 * Get tenant profile
 */
export const getTenantProfile = async () => {
  return apiClient.get<any>(API_ENDPOINTS.TENANT.PROFILE);
};

/**
 * Update tenant profile
 */
export const updateTenantProfile = async (data: any) => {
  return apiClient.put<any>(API_ENDPOINTS.TENANT.UPDATE_PROFILE, data);
};

/**
 * Change password
 */
export const changeTenantPassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  return apiClient.post<{ message: string }>(
    API_ENDPOINTS.TENANT.CHANGE_PASSWORD,
    data
  );
};

/**
 * Get tenant lease details
 */
export const getTenantLease = async () => {
  return apiClient.get<any>(API_ENDPOINTS.TENANT.LEASE);
};

/**
 * Get payment history
 */
export const getTenantPaymentHistory = async (filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}) => {
  return apiClient.get<any>(API_ENDPOINTS.TENANT.PAYMENT_HISTORY, filters);
};

/**
 * Submit payment
 */
export const submitTenantPayment = async (data: {
  amount: number;
  paymentMethod: string;
  type?: string;
  notes?: string;
}) => {
  return apiClient.post<any>(API_ENDPOINTS.TENANT.SUBMIT_PAYMENT, data);
};

/**
 * Get tenant documents
 */
export const getTenantDocuments = async () => {
  return apiClient.get<any>(API_ENDPOINTS.TENANT.DOCUMENTS);
};

/**
 * Reset tenant password (for property owners)
 */
export const resetTenantPassword = async (tenantId: string) => {
  return apiClient.post<{
    message: string;
    tempPassword: string;
    tenantEmail: string;
    tenantName: string;
  }>(`${API_ENDPOINTS.TENANT.BASE}/${tenantId}/reset-password`, {});
};

/**
 * Delete tenant (for property owners/managers)
 */
export const deleteTenant = async (tenantId: string) => {
  return apiClient.delete<{
    message: string;
    tenantEmail: string;
    tenantName: string;
  }>(`${API_ENDPOINTS.TENANT.BASE}/${tenantId}`);
};

