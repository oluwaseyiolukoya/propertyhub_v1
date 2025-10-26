/**
 * API Module - Central export
 */

// Export all API modules
export * from './auth';
export * from './dashboard';
export * from './properties';
export * from './tenant';
export * from './payments';
export * from './maintenance';
export * from './customers';
export * from './plans';
export * from './analytics';
export * from './system';
export * from './users';
export * from './documents';

// Re-export API client utilities
export { apiClient, getAuthToken, getUserData, getUserType, removeAuthToken } from '../api-client';
export { API_ENDPOINTS } from '../api-config';

