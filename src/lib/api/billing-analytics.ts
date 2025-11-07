/**
 * Billing Analytics API
 */

import { apiClient } from '../api-client';

export interface BillingOverview {
  currentMonth: {
    mrr: number;
    activeSubscriptions: number;
    newSubscriptions: number;
    cancelledSubscriptions: number;
    avgRevenuePerCustomer: number;
    trialCount: number;
    activeCount: number;
  };
  lastMonth: {
    mrr: number;
    activeSubscriptions: number;
  };
  growth: {
    revenueGrowthPercent: number;
    subscriptionGrowthPercent: number;
    churnRatePercent: number;
  };
}

/**
 * Get billing overview with growth metrics
 */
export const getBillingOverview = async () => {
  return apiClient.get<BillingOverview>('/api/billing-analytics/overview');
};



