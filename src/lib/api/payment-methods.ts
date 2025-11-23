import { apiClient } from '../api-client';

export interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMonth: string | null;
  cardExpYear: string | null;
  bank: string | null;
  accountName: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InitializeAuthorizationResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  email: string;
}

/**
 * Get all payment methods for the authenticated customer
 */
export const getPaymentMethods = async () => {
  return apiClient.get<{ success: boolean; data: PaymentMethod[] }>(
    '/api/payment-methods'
  );
};

/**
 * Initialize card authorization with Paystack
 */
export const initializeCardAuthorization = async () => {
  return apiClient.post<{ success: boolean; data: InitializeAuthorizationResponse }>(
    '/api/payment-methods/initialize-authorization',
    {}
  );
};

/**
 * Add a new payment method using Paystack reference
 */
export const addPaymentMethod = async (reference: string, setAsDefault: boolean = true) => {
  return apiClient.post<{ success: boolean; message: string; data: PaymentMethod }>(
    '/api/payment-methods/add',
    { reference, setAsDefault }
  );
};

/**
 * Set a payment method as default
 */
export const setDefaultPaymentMethod = async (paymentMethodId: string) => {
  return apiClient.post<{ success: boolean; message: string }>(
    `/api/payment-methods/${paymentMethodId}/set-default`,
    {}
  );
};

/**
 * Remove a payment method
 */
export const removePaymentMethod = async (paymentMethodId: string) => {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/api/payment-methods/${paymentMethodId}`
  );
};
