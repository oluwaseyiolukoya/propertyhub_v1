/**
 * Subscription Management API
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  propertyLimit: number;
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
  billingCycle: 'monthly' | 'annual';
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



