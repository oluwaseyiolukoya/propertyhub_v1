/**
 * Customers API (Admin Only)
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface Customer {
  id: string;
  company: string;
  owner: string;
  email: string;
  phone?: string;
  website?: string;
  taxId?: string;
  industry?: string;
  companySize?: string;
  planId: string;
  plan?: any;
  billingCycle: string;
  status: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  propertyLimit: number;
  userLimit: number;
  storageLimit: number;
  properties?: any[];
  users?: any[];
  invoices?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  search?: string;
  status?: string;
  plan?: string;
}

/**
 * Get all customers
 */
export const getCustomers = async (filters?: CustomerFilters) => {
  return apiClient.get<Customer[]>(API_ENDPOINTS.CUSTOMERS.LIST, filters);
};

/**
 * Get single customer
 */
export const getCustomer = async (id: string) => {
  return apiClient.get<Customer>(API_ENDPOINTS.CUSTOMERS.GET(id));
};

/**
 * Create customer
 */
export const createCustomer = async (data: Partial<Customer> & { sendInvitation?: boolean }) => {
  return apiClient.post<Customer>(API_ENDPOINTS.CUSTOMERS.CREATE, data);
};

/**
 * Update customer
 */
export const updateCustomer = async (id: string, data: Partial<Customer>) => {
  return apiClient.put<Customer>(API_ENDPOINTS.CUSTOMERS.UPDATE(id), data);
};

/**
 * Delete customer
 */
export const deleteCustomer = async (id: string) => {
  return apiClient.delete<{ message: string }>(API_ENDPOINTS.CUSTOMERS.DELETE(id));
};

/**
 * Get customer statistics
 */
export const getCustomerStats = async () => {
  return apiClient.get<any>(API_ENDPOINTS.CUSTOMERS.STATS);
};

