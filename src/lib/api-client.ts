/**
 * API Client
 * Centralized HTTP client for making API requests
 */

import { API_BASE_URL, REQUEST_TIMEOUT, STORAGE_KEYS } from './api-config';

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

/**
 * Get auth token from localStorage (persists across page refreshes)
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

/**
 * Set auth token in localStorage (persists across page refreshes)
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

/**
 * Remove auth token from localStorage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.USER_TYPE);
};

/**
 * Get user data from localStorage (persists across page refreshes)
 */
export const getUserData = (): any | null => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Set user data in localStorage (persists across page refreshes)
 */
export const setUserData = (user: any): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

/**
 * Get user type from localStorage (persists across page refreshes)
 */
export const getUserType = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.USER_TYPE);
};

/**
 * Set user type in localStorage (persists across page refreshes)
 */
export const setUserType = (userType: string): void => {
  localStorage.setItem(STORAGE_KEYS.USER_TYPE, userType);
};

/**
 * Make an HTTP request
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  extra?: { suppressAuthRedirect?: boolean }
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Adding auth header for request to:', endpoint);
  } else {
    console.log('⚠️ No auth token found for request to:', endpoint);
  }

  const config: RequestInit = {
    ...options,
    headers,
    cache: 'no-store',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    // Handle 401 Unauthorized - check for permissions update (unless suppressed)
    if (response.status === 401 && !extra?.suppressAuthRedirect) {
      if (data.code === 'PERMISSIONS_UPDATED') {
        // Show a toast notification before redirecting
        const event = new CustomEvent('permissionsUpdated', {
          detail: { message: data.error || 'Your permissions have been updated. Please log in again.' }
        });
        window.dispatchEvent(event);
        
        // Wait a moment for the toast to show, then clear auth and redirect
        setTimeout(() => {
          removeAuthToken();
          window.location.href = '/';
        }, 2000);
        
        throw new Error('Permissions updated');
      } else {
        // Regular unauthorized error
        removeAuthToken();
        window.location.href = '/';
        throw new Error('Unauthorized');
      }
    }
    // If suppressed, return error object to caller without redirecting
    if (response.status === 401 && extra?.suppressAuthRedirect) {
      return {
        error: {
          error: data.error || 'Unauthorized',
          message: data.message,
          statusCode: response.status,
        },
      };
    }

    if (!response.ok) {
      // Broadcast account blocked event on 403 to centralize handling
      if (response.status === 403) {
        const event = new CustomEvent('accountBlocked', {
          detail: { message: data.error || 'Your account has been deactivated' }
        });
        window.dispatchEvent(event);
      }
      return {
        error: {
          error: data.error || 'Request failed',
          message: data.message,
          statusCode: response.status,
        },
      };
    }

    return { data };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        error: {
          error: 'Request timeout',
          message: 'The request took too long to complete',
        },
      };
    }

    return {
      error: {
        error: error.message || 'Network error',
        message: 'Failed to connect to the server',
      },
    };
  }
}

/**
 * API Client methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, params?: Record<string, any>, extra?: { suppressAuthRedirect?: boolean }): Promise<ApiResponse<T>> => {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
      headers: {
        // Bypass HTTP cache at the browser and any intermediaries
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
      },
    }, extra);
  },

  /**
   * POST request
   */
  post: <T>(endpoint: string, body?: any, extra?: { suppressAuthRedirect?: boolean }): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }, extra);
  },

  /**
   * PUT request
   */
  put: <T>(endpoint: string, body?: any, extra?: { suppressAuthRedirect?: boolean }): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, extra);
  },

  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, body?: any, extra?: { suppressAuthRedirect?: boolean }): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }, extra);
  },

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, extra?: { suppressAuthRedirect?: boolean }): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      method: 'DELETE',
    }, extra);
  },
};

export default apiClient;

