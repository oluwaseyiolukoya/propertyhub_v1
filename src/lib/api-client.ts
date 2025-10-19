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
 * Get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

/**
 * Set auth token in localStorage
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
 * Get user data from localStorage
 */
export const getUserData = (): any | null => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Set user data in localStorage
 */
export const setUserData = (user: any): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

/**
 * Get user type from localStorage
 */
export const getUserType = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.USER_TYPE);
};

/**
 * Set user type in localStorage
 */
export const setUserType = (userType: string): void => {
  localStorage.setItem(STORAGE_KEYS.USER_TYPE, userType);
};

/**
 * Make an HTTP request
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 Unauthorized - clear auth and redirect to login
    if (response.status === 401) {
      removeAuthToken();
      window.location.href = '/';
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
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
  get: <T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> => {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  },

  /**
   * POST request
   */
  post: <T>(endpoint: string, body?: any): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * PUT request
   */
  put: <T>(endpoint: string, body?: any): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, body?: any): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      method: 'DELETE',
    });
  },
};

export default apiClient;

