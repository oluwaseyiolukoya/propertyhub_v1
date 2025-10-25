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

/**
 * Get manager analytics data
 */
export const getManagerAnalytics = async () => {
  return apiClient.get<{
    averageRent: number;
    tenantRetention: number;
    avgDaysVacant: number;
    unitDistribution: Array<{
      bedrooms: string;
      count: number;
      percentage: number;
    }>;
    revenueByProperty: Array<{
      id: string;
      name: string;
      revenue: number;
      currency: string;
      percentage: number;
    }>;
  }>(API_ENDPOINTS.DASHBOARD.MANAGER_ANALYTICS);
};

/**
 * Get paginated activity logs for manager
 */
export const getManagerActivities = async (page: number = 1, limit: number = 5) => {
  return apiClient.get<{
    activities: Array<{
      id: string;
      action: string;
      entity: string;
      description: string;
      createdAt: Date;
      entityId: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  }>('/api/dashboard/manager/activities', { page, limit });
};

/**
 * Get paginated activity logs for owner
 */
export const getOwnerActivities = async (page: number = 1, limit: number = 5) => {
  return apiClient.get<{
    activities: Array<{
      id: string;
      action: string;
      entity: string;
      description: string;
      createdAt: Date;
      entityId: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  }>('/api/dashboard/owner/activities', { page, limit });
};

