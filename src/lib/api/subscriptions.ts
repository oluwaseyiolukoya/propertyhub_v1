/**
 * Subscription Management API
 */

import { apiClient } from "../api-client";
import { API_ENDPOINTS } from "../api-config";

export interface Plan {
  id: string;
  name: string;
  description?: string;
  category?: string; // 'property_management' | 'development'
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  propertyLimit?: number;
  projectLimit?: number;
  userLimit: number;
  storageLimit: number;
  features: any;
  isActive: boolean;
  isPopular?: boolean;
}

export interface ChangePlanRequest {
  planId: string;
}

export interface ChangeBillingCycleRequest {
  billingCycle: "monthly" | "annual";
}

export interface CancelSubscriptionRequest {
  reason?: string;
  confirmation: string; // Must be 'CANCEL_SUBSCRIPTION'
}

/**
 * Get available subscription plans
 */
export const getSubscriptionPlans = async () => {
  return apiClient.get<{ plans: Plan[] }>(API_ENDPOINTS.SUBSCRIPTIONS.PLANS);
};

/**
 * Change subscription plan
 */
export const changePlan = async (data: ChangePlanRequest) => {
  return apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CHANGE_PLAN, data);
};

/**
 * Change billing cycle
 */
export const changeBillingCycle = async (data: ChangeBillingCycleRequest) => {
  return apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CHANGE_BILLING_CYCLE, data);
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (data: CancelSubscriptionRequest) => {
  return apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CANCEL, data);
};

/**
 * Get billing history for current user
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt: string | null;
  billingPeriod: string | null;
  description: string | null;
  createdAt: string;
}

export const getBillingHistory = async () => {
  return apiClient.get<{ invoices: Invoice[] }>(
    "/api/subscriptions/billing-history"
  );
};

/**
 * Initialize upgrade payment
 */
export interface InitializeUpgradeResponse {
  authorizationUrl: string;
  reference: string;
  publicKey: string;
  invoiceId: string;
}

export const initializeUpgrade = async (
  planId: string,
  billingCycle?: "monthly" | "annual"
) => {
  return apiClient.post<InitializeUpgradeResponse>(
    "/api/subscriptions/upgrade/initialize",
    { planId, billingCycle }
  );
};

/**
 * Verify upgrade payment
 * Uses GET with reference in URL (matches tenant payment pattern)
 */
export interface VerifyUpgradeResponse {
  success: boolean;
  status: string;
  reference: string;
  provider: string;
  verified: boolean;
  verificationSource?: string;
  message?: string;
  plan?: string;
  error?: string;
}

export const verifyUpgrade = async (reference: string) => {
  // Use GET with reference in URL path (same as tenant payments)
  return apiClient.get<VerifyUpgradeResponse>(
    `/api/subscriptions/upgrade/verify/${encodeURIComponent(reference)}`
  );
};
