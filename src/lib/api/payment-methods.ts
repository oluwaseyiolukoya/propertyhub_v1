import { apiClient, ApiResponse } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface PaymentMethod {
  id: string;
  tenantId: string;
  customerId: string;
  type: string;
  provider: string;
  authorizationCode: string;
  cardBrand: string;
  cardLast4: string;
  cardExpMonth: string;
  cardExpYear: string;
  cardBin?: string;
  cardType?: string;
  bank?: string;
  accountName?: string;
  isDefault: boolean;
  isActive: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AddPaymentMethodPayload {
  email: string;
  authorizationCode: string;
}

export interface ChargeCardPayload {
  paymentMethodId: string;
  amount: number;
  leaseId: string;
}

/**
 * Get all payment methods for the current tenant
 */
export const getPaymentMethods = async (): Promise<ApiResponse<PaymentMethod[]>> => {
  return apiClient.get<PaymentMethod[]>(API_ENDPOINTS.PAYMENT_METHODS.LIST);
};

/**
 * Add a new payment method
 */
export const addPaymentMethod = async (payload: AddPaymentMethodPayload): Promise<ApiResponse<PaymentMethod>> => {
  return apiClient.post<PaymentMethod>(API_ENDPOINTS.PAYMENT_METHODS.ADD, payload);
};

/**
 * Set a payment method as default
 */
export const setDefaultPaymentMethod = async (id: string): Promise<ApiResponse<PaymentMethod>> => {
  return apiClient.put<PaymentMethod>(API_ENDPOINTS.PAYMENT_METHODS.SET_DEFAULT(id), {});
};

/**
 * Delete a payment method
 */
export const deletePaymentMethod = async (id: string): Promise<ApiResponse<void>> => {
  return apiClient.delete<void>(API_ENDPOINTS.PAYMENT_METHODS.DELETE(id));
};

/**
 * Charge a saved card
 */
export const chargeCard = async (payload: ChargeCardPayload): Promise<ApiResponse<any>> => {
  return apiClient.post<any>(API_ENDPOINTS.PAYMENT_METHODS.CHARGE, payload);
};
