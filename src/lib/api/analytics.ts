/**
 * Analytics API (Admin Only)
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

/**
 * Get analytics overview
 */
export const getAnalyticsOverview = async (params?: {
  startDate?: string;
  endDate?: string;
  period?: string;
}) => {
  return apiClient.get<any>(API_ENDPOINTS.ANALYTICS.OVERVIEW, params);
};

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics = async (params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}) => {
  return apiClient.get<any>(API_ENDPOINTS.ANALYTICS.REVENUE, params);
};

/**
 * Get occupancy analytics
 */
export const getOccupancyAnalytics = async (params?: {
  customerId?: string;
  propertyId?: string;
  period?: string;
}) => {
  return apiClient.get<any>(API_ENDPOINTS.ANALYTICS.OCCUPANCY, params);
};

export const getAnalyticsDashboard = async () => {
  return apiClient.get<any>('/api/analytics/dashboard');
};

export const getSystemHealth = async () => {
  return apiClient.get<any>('/api/analytics/system-health');
};

export const getActivityLogs = async (params?: { limit?: number; customerId?: string; userId?: string; entity?: string; action?: string; }) => {
  return apiClient.get<any[]>('/api/analytics/activity-logs', params);
};

