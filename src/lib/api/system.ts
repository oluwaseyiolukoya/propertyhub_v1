/**
 * System API (Admin Only)
 */

import { apiClient } from '../api-client';
import { API_BASE_URL } from '../api-config';

/**
 * Get system health status
 */
export const getSystemHealth = async () => {
  return apiClient.get<any>('/api/system/health');
};

/**
 * Get system metrics
 */
export const getSystemMetrics = async () => {
  return apiClient.get<any>('/api/system/metrics');
};

/**
 * Get system logs
 */
export const getSystemLogs = async (params?: {
  level?: string;
  limit?: number;
  offset?: number;
}) => {
  return apiClient.get<any>('/api/system/logs', params);
};

/**
 * Get activity logs
 */
export const getActivityLogs = async (params?: {
  userId?: string;
  customerId?: string;
  action?: string;
  entity?: string;
  limit?: number;
  offset?: number;
}) => {
  return apiClient.get<any>('/api/system/activity-logs', params);
};

/**
 * Ping server health check
 */
export const pingServer = async () => {
  return fetch(`${API_BASE_URL}/health`).then(res => res.json());
};

