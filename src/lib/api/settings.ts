import { apiClient, ApiResponse } from "../api-client";

export interface ManagerPermissions {
  managerCanViewUnits?: boolean;
  managerCanCreateUnits?: boolean;
  managerCanEditUnits?: boolean;
  managerCanDeleteUnits?: boolean;
  managerCanViewProperties?: boolean;
  managerCanEditProperty?: boolean;
  managerCanViewTenants?: boolean;
  managerCanCreateTenants?: boolean;
  managerCanEditTenants?: boolean;
  managerCanDeleteTenants?: boolean;
  managerCanViewFinancials?: boolean;
}

export interface UserSettings {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: ManagerPermissions;
  baseCurrency?: string;
  phone?: string;
  department?: string;
  company?: string;
  isActive?: boolean;
  status?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get user settings (including permissions)
 */
export const getSettings = async (): Promise<ApiResponse<UserSettings>> => {
  return await apiClient.get<UserSettings>("/api/settings");
};

/**
 * Update manager permissions (Owner only)
 */
export const updateManagerPermissions = async (
  permissions: ManagerPermissions
): Promise<ApiResponse<any>> => {
  return await apiClient.put<any>(
    "/api/settings/manager-permissions",
    permissions
  );
};

/**
 * Update user profile settings
 */
export const updateProfile = async (profileData: {
  name?: string;
  phone?: string;
  baseCurrency?: string;
  department?: string;
  company?: string;
  bio?: string;
}): Promise<ApiResponse<{ message: string; user: UserSettings }>> => {
  return await apiClient.put<{ message: string; user: UserSettings }>(
    "/api/settings/profile",
    profileData
  );
};

/**
 * Update customer/organization settings
 */
export const updateOrganization = async (organizationData: {
  company?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  industry?: string;
  companySize?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  licenseNumber?: string;
  organizationType?: string;
}): Promise<ApiResponse<{ message: string; customer: any }>> => {
  return await apiClient.put<{ message: string; customer: any }>(
    "/api/settings/organization",
    organizationData
  );
};

export interface PaymentGatewaySettings {
  id?: string;
  customerId?: string;
  provider: "paystack" | "monicredit";
  publicKey?: string;
  // secretKey/privateKey is never returned from server
  testMode?: boolean;
  isEnabled?: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export const getPaymentGatewaySettings = async (
  provider: "paystack" | "monicredit" = "paystack"
): Promise<ApiResponse<PaymentGatewaySettings | null>> => {
  return await apiClient.get<PaymentGatewaySettings | null>(
    `/api/settings/payment-gateway?provider=${provider}`
  );
};

export const getPublicPaymentGatewaySettings = async (): Promise<
  ApiResponse<{
    isEnabled: boolean;
    testMode: boolean;
    bankTransferTemplate?: string;
    updatedAt?: string;
  } | null>
> => {
  return await apiClient.get<{
    isEnabled: boolean;
    testMode: boolean;
    bankTransferTemplate?: string;
    updatedAt?: string;
  } | null>("/api/settings/payment-gateway/public");
};

export const getTenantPublicPaymentGateway = async (): Promise<
  ApiResponse<{
    provider: string | null;
    publicKey: string | null;
    isEnabled: boolean;
    testMode: boolean;
    bankTransferTemplate?: string;
    updatedAt?: string;
  }>
> => {
  return await apiClient.get<{
    provider: string | null;
    publicKey: string | null;
    isEnabled: boolean;
    testMode: boolean;
    bankTransferTemplate?: string;
    updatedAt?: string;
  }>("/api/tenant/payment-gateway/public");
};

export const savePaymentGatewaySettings = async (
  provider: "paystack" | "monicredit",
  payload: {
    publicKey?: string;
    secretKey?: string; // For Paystack
    privateKey?: string; // For Monicredit
    testMode?: boolean;
    isEnabled?: boolean;
    bankTransferTemplate?: string; // For Paystack only
  }
): Promise<
  ApiResponse<{ message: string; settings: PaymentGatewaySettings }>
> => {
  return await apiClient.put<{
    message: string;
    settings: PaymentGatewaySettings;
  }>(`/api/settings/payment-gateway?provider=${provider}`, payload);
};
