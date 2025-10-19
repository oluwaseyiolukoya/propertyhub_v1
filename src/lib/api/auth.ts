/**
 * Authentication API
 */

import { apiClient, setAuthToken, setUserData, setUserType } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface LoginRequest {
  email: string;
  password: string;
  userType: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    userType: string;
    customerId?: string;
    customer?: any;
  };
}

export interface SetupPasswordRequest {
  email: string;
  password: string;
  token: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    customerId?: string;
  };
}

/**
 * Login user
 */
export const login = async (credentials: LoginRequest) => {
  const response = await apiClient.post<LoginResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials
  );

  if (response.data) {
    // Store token and user data
    setAuthToken(response.data.token);
    setUserData(response.data.user);
    setUserType(credentials.userType);
  }

  return response;
};

/**
 * Setup password for new user
 */
export const setupPassword = async (data: SetupPasswordRequest) => {
  return apiClient.post<{ message: string }>(
    API_ENDPOINTS.AUTH.SETUP_PASSWORD,
    data
  );
};

/**
 * Verify auth token
 */
export const verifyToken = async () => {
  return apiClient.get<VerifyTokenResponse>(API_ENDPOINTS.AUTH.VERIFY);
};

/**
 * Logout user (client-side only)
 */
export const logout = () => {
  // Clear all auth data from localStorage
  localStorage.clear();
  // Redirect to login
  window.location.href = '/';
};

