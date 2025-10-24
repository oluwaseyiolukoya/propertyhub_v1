/**
 * Properties API
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface Property {
  id: string;
  name: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
  yearBuilt?: number;
  totalUnits: number;
  floors?: number;
  totalArea?: number;
  lotSize?: number;
  parking?: number;
  currency: string;
  purchasePrice?: number;
  marketValue?: number;
  avgRent?: number;
  status: string;
  features?: any;
  unitFeatures?: any;
  coverImage?: string;
  images?: string[];
  description?: string;
  notes?: string;
  occupiedUnits?: number;
  occupancyRate?: number;
  totalMonthlyIncome?: number;
}

export interface PropertyFilters {
  search?: string;
  status?: string;
  propertyType?: string;
}

/**
 * Get all properties
 */
export const getProperties = async (filters?: PropertyFilters) => {
  return apiClient.get<Property[]>(API_ENDPOINTS.PROPERTIES.LIST, filters);
};

/**
 * Get single property
 */
export const getProperty = async (id: string) => {
  return apiClient.get<Property>(API_ENDPOINTS.PROPERTIES.GET(id));
};

/**
 * Create property
 */
export const createProperty = async (data: Partial<Property>) => {
  return apiClient.post<Property>(API_ENDPOINTS.PROPERTIES.CREATE, data);
};

/**
 * Update property
 */
export const updateProperty = async (id: string, data: Partial<Property>) => {
  return apiClient.put<Property>(API_ENDPOINTS.PROPERTIES.UPDATE(id), data);
};

/**
 * Archive property (soft delete)
 */
export const archiveProperty = async (id: string) => {
  return apiClient.put<Property>(API_ENDPOINTS.PROPERTIES.UPDATE(id), { status: 'archived' });
};

/**
 * Delete property (hard delete)
 */
export const deleteProperty = async (id: string) => {
  return apiClient.delete<{ message: string }>(API_ENDPOINTS.PROPERTIES.DELETE(id));
};

/**
 * Get property analytics
 */
export const getPropertyAnalytics = async (id: string) => {
  return apiClient.get<any>(API_ENDPOINTS.PROPERTIES.ANALYTICS(id));
};

