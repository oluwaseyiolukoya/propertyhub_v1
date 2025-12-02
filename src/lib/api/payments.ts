/**
 * Payments API
 */

import { apiClient } from "../api-client";
import { API_ENDPOINTS } from "../api-config";

export interface Payment {
  id: string;
  leaseId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  type: string;
  status: string;
  transactionId?: string;
  confirmationNumber?: string;
  lateFeesIncluded?: number;
  notes?: string;
}

export interface PaymentFilters {
  propertyId?: string;
  leaseId?: string;
  status?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Get all payments
 */
export const getPayments = async (filters?: PaymentFilters) => {
  return apiClient.get<any>(API_ENDPOINTS.PAYMENTS.LIST, filters);
};

/**
 * Get single payment
 */
export const getPayment = async (id: string) => {
  return apiClient.get<Payment>(API_ENDPOINTS.PAYMENTS.GET(id));
};

/**
 * Create payment (record payment)
 */
export const createPayment = async (data: Partial<Payment>) => {
  return apiClient.post<Payment>(API_ENDPOINTS.PAYMENTS.CREATE, data);
};

/**
 * Update payment
 */
export const updatePayment = async (id: string, data: Partial<Payment>) => {
  return apiClient.put<Payment>(API_ENDPOINTS.PAYMENTS.UPDATE(id), data);
};

/**
 * Delete payment
 */
export const deletePayment = async (id: string) => {
  return apiClient.delete<{ success: boolean; message?: string }>(
    API_ENDPOINTS.PAYMENTS.UPDATE(id)
  );
};

/**
 * Get payment statistics
 */
export const getPaymentStats = async (filters?: {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return apiClient.get<any>(API_ENDPOINTS.PAYMENTS.STATS, filters);
};

/**
 * Get overdue payments
 */
export const getOverduePayments = async (propertyId?: string) => {
  return apiClient.get<any>(
    API_ENDPOINTS.PAYMENTS.OVERDUE,
    propertyId ? { propertyId } : undefined
  );
};

/**
 * Initialize tenant rent payment via Paystack
 */
export const initializeTenantPayment = async (payload: {
  leaseId: string;
  amount?: number;
  currency?: string;
}) => {
  return apiClient.post<{
    authorizationUrl: string;
    reference: string;
    publicKey: string;
  }>(API_ENDPOINTS.PAYMENTS.INIT, payload);
};

/**
 * Initialize subscription payment (admin/platform)
 */
export const initializeSubscriptionPayment = async (payload: {
  customerId: string;
  invoiceId: string;
}) => {
  return apiClient.post<{
    authorizationUrl: string;
    reference: string;
    publicKey: string;
  }>(API_ENDPOINTS.PAYMENTS.INIT_SUBSCRIPTION, payload);
};

/**
 * Record manual payment (cash, bank transfer, etc.) - Manager/Owner only
 */
export const recordManualPayment = async (payload: {
  leaseId: string;
  amount: number;
  paymentMethod: string;
  paymentDate?: string;
  notes?: string;
  type?: string;
}) => {
  return apiClient.post<{ success: boolean; payment: any }>(
    API_ENDPOINTS.PAYMENTS.RECORD,
    payload
  );
};

/**
 * Get scheduled payments
 */
export const getScheduledPayments = async () => {
  return apiClient.get<any[]>("/api/payments/scheduled");
};

/**
 * Verify payment by reference
 */
export const verifyPayment = async (reference: string) => {
  return apiClient.get<{ reference: string; status: string; paidAt?: string }>(
    `/api/payments/verify/${reference}`
  );
};

/**
 * Get auto-pay settings
 */
export interface AutoPaySettings {
  enabled: boolean;
  paymentMethodId: string | null;
  paymentMethod: {
    id: string;
    cardBrand: string | null;
    cardLast4: string | null;
    cardExpMonth: string | null;
    cardExpYear: string | null;
  } | null;
  dayOfMonth: number;
  amount: number;
  currency: string;
  rentFrequency: string;
  leaseId: string;
}

export const getAutopaySettings = async () => {
  return apiClient.get<AutoPaySettings>("/api/tenant/autopay/settings");
};

/**
 * Update auto-pay settings
 */
export const updateAutopaySettings = async (settings: {
  enabled: boolean;
  paymentMethodId?: string | null;
  dayOfMonth?: number;
}) => {
  return apiClient.post<{ success: boolean; message: string; settings: any }>(
    "/api/tenant/autopay/settings",
    settings
  );
};

/**
 * Process auto-pay manually (trigger payment)
 */
export const processAutopay = async () => {
  return apiClient.post<{ success: boolean; message: string; payment: any }>(
    "/api/tenant/autopay/process",
    {}
  );
};
