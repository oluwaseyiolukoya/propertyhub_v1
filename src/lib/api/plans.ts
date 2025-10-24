/**
 * Billing Plans API (Admin Only)
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface BillingPlan {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice?: number;
  currency: string;
  propertyLimit: number;
  userLimit: number;
  storageLimit: number;
  features: any;
  isActive: boolean;
  isPopular?: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all billing plans
 */
export const getBillingPlans = async () => {
  return apiClient.get<BillingPlan[]>(API_ENDPOINTS.PLANS.LIST);
};

/**
 * Get single billing plan
 */
export const getBillingPlan = async (id: string) => {
  return apiClient.get<BillingPlan>(API_ENDPOINTS.PLANS.GET(id));
};

/**
 * Create billing plan
 */
export const createBillingPlan = async (data: Partial<BillingPlan>) => {
  return apiClient.post<BillingPlan>(API_ENDPOINTS.PLANS.CREATE, data);
};

/**
 * Update billing plan
 */
export const updateBillingPlan = async (id: string, data: Partial<BillingPlan>) => {
  return apiClient.put<BillingPlan>(API_ENDPOINTS.PLANS.UPDATE(id), data);
};

/**
 * Delete billing plan
 */
export const deleteBillingPlan = async (id: string) => {
  return apiClient.delete<{ message: string }>(API_ENDPOINTS.PLANS.DELETE(id));
};

