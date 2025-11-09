/**
 * API Client
 * Centralized HTTP client for making API requests
 */

import { API_BASE_URL, REQUEST_TIMEOUT, STORAGE_KEYS } from './api-config';
import { safeStorage } from './safeStorage';

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
  return safeStorage.getItem(STORAGE_KEYS.TOKEN);
};

/**
 * Set auth token in localStorage (persists across page refreshes)
 */
export const setAuthToken = (token: string): void => {
  safeStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

/**
 * Remove auth token from localStorage
 */
export const removeAuthToken = (): void => {
  safeStorage.removeItem(STORAGE_KEYS.TOKEN);
  safeStorage.removeItem(STORAGE_KEYS.USER);
  safeStorage.removeItem(STORAGE_KEYS.USER_TYPE);
};

/**
 * Get user data from localStorage (persists across page refreshes)
 */
export const getUserData = (): any | null => {
  const userData = safeStorage.getItem(STORAGE_KEYS.USER);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Set user data in localStorage (persists across page refreshes)
 */
export const setUserData = (user: any): void => {
  safeStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

/**
 * Get user type from localStorage (persists across page refreshes)
 */
export const getUserType = (): string | null => {
  return safeStorage.getItem(STORAGE_KEYS.USER_TYPE);
};

/**
 * Set user type in localStorage (persists across page refreshes)
 */
export const setUserType = (userType: string): void => {
  safeStorage.setItem(STORAGE_KEYS.USER_TYPE, userType);
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

  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  // Add authorization header if token exists
  const publicEndpoints = ['/api/auth/login', '/api/auth/verify'];
  const isPublicEndpoint = publicEndpoints.some(pe => endpoint.includes(pe));

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Adding auth header for request to:', endpoint);
  } else if (!isPublicEndpoint) {
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

    // Safely parse JSON; tolerate empty/non-JSON responses
    const contentType = response.headers.get('content-type') || '';
    let data: any = undefined;
    if (response.status === 204 || response.status === 205) {
      data = {};
    } else {
      const raw = await response.text().catch(() => '');
      if (!raw || raw.trim() === '') {
        data = {};
      } else {
        try {
          data = contentType.includes('application/json') ? JSON.parse(raw) : { message: raw };
        } catch {
          // Fallback for non-JSON payloads
          data = { message: raw };
        }
      }
    }

    // Handle 401 Unauthorized - check for permissions update (unless suppressed)
    if (response.status === 401 && !extra?.suppressAuthRedirect) {
      if ((data as any)?.code === 'PERMISSIONS_UPDATED') {
        // Show a toast notification before redirecting
        const event = new CustomEvent('permissionsUpdated', {
          detail: { message: (data as any)?.error || 'Your permissions have been updated. Please log in again.' }
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
          error: (data as any)?.error || 'Unauthorized',
          message: (data as any)?.message || (data as any)?.details,
          statusCode: response.status,
          // Surface backend details and code when present
          ...(typeof (data as any)?.details !== 'undefined' ? { details: (data as any).details } : {}),
          ...(typeof (data as any)?.code !== 'undefined' ? { code: (data as any).code } : {}),
        },
      };
    }

    if (!response.ok) {
      // Only broadcast accountBlocked for explicit account deactivation cases
      if (response.status === 403 && (((data as any)?.code === 'ACCOUNT_BLOCKED') || /deactivated|blocked/i.test(((data as any)?.error || '') as string))) {
        const event = new CustomEvent('accountBlocked', {
          detail: { message: (data as any)?.error || 'Your account has been deactivated' }
        });
        window.dispatchEvent(event);
      }
      return {
        error: {
          error: (data as any)?.error || 'Request failed',
          // Prefer backend 'message', then 'details', then fall back to error string
          message: (data as any)?.message || (data as any)?.details || (data as any)?.error,
          statusCode: response.status,
          // Surface backend details and code when present
          ...(typeof (data as any)?.details !== 'undefined' ? { details: (data as any).details } : {}),
          ...(typeof (data as any)?.code !== 'undefined' ? { code: (data as any).code } : {}),
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
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body ?? {}),
    }, extra);
  },

  /**
   * PUT request
   */
  put: <T>(endpoint: string, body?: any, extra?: { suppressAuthRedirect?: boolean }): Promise<ApiResponse<T>> => {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body ?? {}),
    }, extra);
  },

  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, body?: any, extra?: { suppressAuthRedirect?: boolean }): Promise<ApiResponse<T>> => {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body ?? {}),
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

