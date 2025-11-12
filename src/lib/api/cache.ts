/**
 * Cache Management API
 * Handles cache clearing functionality
 */

import { apiClient } from '../api-client';

export interface CacheClearResponse {
  success: boolean;
  message: string;
  details: {
    timestamp: string;
    clearedBy: string;
    clearedTypes: string[];
  };
}

export interface CacheStatusResponse {
  success: boolean;
  data: {
    timestamp: string;
    status: string;
    lastCleared: string | null;
    cacheTypes: string[];
  };
}

/**
 * Clear cache for all user types
 */
export const clearCache = async (): Promise<{ data?: CacheClearResponse; error?: any }> => {
  try {
    const response = await apiClient.post<CacheClearResponse>('/api/cache/clear');
    return response;
  } catch (error) {
    console.error('Cache clear error:', error);
    return { error };
  }
};

/**
 * Get cache status
 */
export const getCacheStatus = async (): Promise<{ data?: CacheStatusResponse; error?: any }> => {
  try {
    const response = await apiClient.get<CacheStatusResponse>('/api/cache/status');
    return response;
  } catch (error) {
    console.error('Cache status error:', error);
    return { error };
  }
};










