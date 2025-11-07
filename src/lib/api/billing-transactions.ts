/**
 * Billing Transactions API Client
 */

import { apiClient } from '../api-client';

export interface BillingTransaction {
  id: string;
  type: 'invoice' | 'payment';
  customer: string;
  customerId: string;
  plan: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  date: string;
  invoice: string;
  description: string;
  billingPeriod?: string;
  dueDate?: string;
  paidAt?: string | null;
  paymentMethod?: string;
  provider?: string;
  _raw?: any;
}

export interface BillingTransactionsResponse {
  transactions: BillingTransaction[];
  summary: {
    total: number;
    totalAmount: number;
    completed: number;
    pending: number;
    failed: number;
  };
}

export interface GetBillingTransactionsParams {
  status?: 'all' | 'completed' | 'pending' | 'failed' | 'refunded';
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * Get all billing transactions (invoices + payments) for admin
 */
export const getBillingTransactions = async (params?: GetBillingTransactionsParams) => {
  const queryParams = new URLSearchParams();

  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/api/billing-transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return apiClient.get<BillingTransactionsResponse>(url);
};



