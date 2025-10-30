import { apiClient, ApiResponse } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  bank?: string;
  accountName?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface AddPaymentMethodPayload {
  authorizationCode: string;
  cardBrand?: string;
  cardLast4: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  cardBin?: string;
  cardType?: string;
  bank?: string;
  accountName?: string;
  setAsDefault?: boolean;
}

export interface ChargePaymentMethodPayload {
  amount: number;
  leaseId?: string;
  type?: string;
}

/**
 * Get all payment methods for the authenticated tenant
 */
export const getPaymentMethods = async (): Promise<ApiResponse<PaymentMethod[]>> => {
  return apiClient.get<PaymentMethod[]>(API_ENDPOINTS.PAYMENT_METHODS.LIST);
};

/**
 * Add a new payment method (card)
 */
export const addPaymentMethod = async (payload: AddPaymentMethodPayload): Promise<ApiResponse<PaymentMethod>> => {
  return apiClient.post<PaymentMethod>(API_ENDPOINTS.PAYMENT_METHODS.ADD, payload);
};

/**
 * Set a payment method as default
 */
export const setDefaultPaymentMethod = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.put<{ message: string }>(API_ENDPOINTS.PAYMENT_METHODS.SET_DEFAULT(id), {});
};

/**
 * Delete (deactivate) a payment method
 */
export const deletePaymentMethod = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.delete<{ message: string }>(API_ENDPOINTS.PAYMENT_METHODS.DELETE(id));
};

/**
 * Charge a specific payment method
 */
export const chargePaymentMethod = async (id: string, payload: ChargePaymentMethodPayload): Promise<ApiResponse<any>> => {
  return apiClient.post<any>(API_ENDPOINTS.PAYMENT_METHODS.CHARGE(id), payload);
};

