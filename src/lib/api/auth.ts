/**
 * Authentication API
 */

import { apiClient, setAuthToken, setUserData, setUserType } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface LoginRequest {
  email: string;
  password: string;
  userType?: string; // Optional - backend will auto-detect from database
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
    // Use userType from response (auto-detected by backend) or fall back to credentials
    setUserType(response.data.user.userType || credentials.userType || 'owner');
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
      baseCurrency: string; // Added for multi-currency support
      customerId?: string;
      userType?: string;
    };
    customer: {
      id: string;
      company: string;
      owner: string;
      email: string;
      phone: string;
      website: string;
      taxId?: string;
      industry?: string;
      companySize?: string;
      yearEstablished?: string;
      licenseNumber?: string;
      insuranceProvider?: string;
      insurancePolicy?: string;
      insuranceExpiration?: string;
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      zipCode?: string;
      country?: string;
      status: string;
      billingCycle: string;
      propertyLimit: number;
      projectLimit?: number;
      userLimit: number;
      storageLimit: number;
      propertiesCount: number;
      unitsCount: number;
      projectsCount?: number;
      actualPropertiesCount?: number;
      actualUnitsCount?: number;
      actualManagersCount?: number;
      subscriptionStartDate: string | null;
      trialEndsAt: string | null;
      plan: {
        name: string;
        description: string;
        category?: string;
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

/**
 * Change password for authenticated user
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (data: ChangePasswordRequest) => {
  return apiClient.post<{ message: string }>(
    API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
    data
  );
};

