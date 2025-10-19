/**
 * Dashboard API
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

/**
 * Get manager dashboard overview
 */
export const getManagerDashboardOverview = async (propertyId?: string) => {
  return apiClient.get<any>(
    API_ENDPOINTS.DASHBOARD.MANAGER_OVERVIEW,
    propertyId ? { propertyId } : undefined
  );
};

/**
 * Get property performance metrics
 */
export const getPropertyPerformance = async (propertyId: string, period: string = '30') => {
  return apiClient.get<any>(
    API_ENDPOINTS.DASHBOARD.MANAGER_PERFORMANCE,
    { propertyId, period }
  );
};

/**
 * Get owner dashboard overview
 */
export const getOwnerDashboardOverview = async () => {
  return apiClient.get<any>(API_ENDPOINTS.DASHBOARD.OWNER_OVERVIEW);
};

