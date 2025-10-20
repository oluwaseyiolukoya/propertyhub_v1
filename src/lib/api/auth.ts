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
    permissions?: string[];
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
  // Suppress auth redirect so the login form can show 401 inline
  const response = await apiClient.post<LoginResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials,
    { suppressAuthRedirect: true }
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
 * Get current user's account information (includes updated customer/plan data)
 */
export const getAccountInfo = async () => {
  return apiClient.get<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
    };
    customer: {
      id: string;
      company: string;
      owner: string;
      email: string;
      phone: string;
      website: string;
      status: string;
      billingCycle: string;
      propertyLimit: number;
      userLimit: number;
      storageLimit: number;
      propertiesCount: number;
      unitsCount: number;
      subscriptionStartDate: string | null;
      trialEndsAt: string | null;
      plan: {
        name: string;
        description: string;
        monthlyPrice: number;
        annualPrice: number;
        currency: string;
        features: string[];
      } | null;
    } | null;
  }>(API_ENDPOINTS.AUTH.ACCOUNT);
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

