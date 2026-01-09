/**
 * System API (Admin Only)
 */

import { apiClient } from "../api-client";
import { API_BASE_URL } from "../api-config";

/**
 * Get system health status
 */
export const getSystemHealth = async () => {
  return apiClient.get<any>("/api/system/health");
};

/**
 * Get system metrics
 */
export const getSystemMetrics = async () => {
  return apiClient.get<any>("/api/system/metrics");
};

/**
 * Get system logs
 */
export const getSystemLogs = async (params?: {
  level?: string;
  limit?: number;
  offset?: number;
}) => {
  return apiClient.get<any>("/api/system/logs", params);
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
  return apiClient.get<any>("/api/system/activity-logs", params);
};

/**
 * Ping server health check
 */
export const pingServer = async () => {
  return fetch(`${API_BASE_URL}/health`).then((res) => res.json());
};

/**
 * System settings (brand logo, etc.)
 */
export const getSystemSetting = async (key: string) => {
  return apiClient.get<any>(`/api/system/settings/${key}`);
};

export const getSystemSettings = async (category?: string) => {
  const params = category ? { category } : undefined;
  return apiClient.get<any>("/api/system/settings", params as any);
};

export const saveSystemSetting = async (
  key: string,
  value: any,
  category?: string,
  description?: string
) => {
  return apiClient.post<any>("/api/system/settings", {
    key,
    value,
    category,
    description,
  });
};

export const uploadPlatformLogo = async (file: File) => {
  const form = new FormData();
  form.append("logo", file);
  // Use fetch directly to avoid JSON headers
  const token =
    localStorage.getItem("auth_token") ||
    localStorage.getItem("PROPERTY_HUB_TOKEN");
  const res = await fetch(`${API_BASE_URL}/api/system/settings/upload-logo`, {
    method: "POST",
    headers: token ? ({ Authorization: `Bearer ${token}` } as any) : undefined,
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    return {
      error: { error: data.error || "Upload failed", statusCode: res.status },
    };
  }
  // Normalize URL to absolute so the frontend can display it regardless of origin
  const url: string = data?.url;
  const absoluteUrl =
    typeof url === "string" &&
    (url.startsWith("http://") || url.startsWith("https://"))
      ? url
      : `${API_BASE_URL}${url?.startsWith("/") ? "" : "/"}${url || ""}`;
  return { data: { ...data, url: absoluteUrl } };
};

/**
 * Admin Payment Gateway Configuration (Platform-level)
 * Used for subscription payments, separate from owner-level payment_settings
 */

export interface AdminPaymentGatewayConfig {
  provider: "paystack" | "monicredit";
  isEnabled: boolean;
  testMode: boolean;
  publicKey: string | null;
  secretKey?: string | null;
  privateKey?: string | null;
  merchantId?: string | null;
  verifyToken?: string | null;
  metadata?: any;
}

/**
 * Get platform payment gateway configuration (admin only)
 */
export const getAdminPaymentGateway = async (
  provider: "paystack" | "monicredit" = "monicredit"
): Promise<{ data?: AdminPaymentGatewayConfig; error?: any }> => {
  return apiClient.get<AdminPaymentGatewayConfig>(
    `/api/system/admin/payment-gateway?provider=${provider}`
  );
};

/**
 * Get platform payment gateway status (read-only, for developers and all authenticated users)
 * Returns only status information, no sensitive keys
 */
export const getPaymentGatewayStatus = async (
  provider: "paystack" | "monicredit" = "paystack"
): Promise<{
  data?: { provider: string; isEnabled: boolean; testMode: boolean };
  error?: any;
}> => {
  return apiClient.get<{
    provider: string;
    isEnabled: boolean;
    testMode: boolean;
  }>(`/api/system/payment-gateway/status?provider=${provider}`);
};

/**
 * Save/Update platform payment gateway configuration
 */
export const saveAdminPaymentGateway = async (config: {
  provider: "paystack" | "monicredit";
  publicKey?: string;
  secretKey?: string;
  privateKey?: string;
  merchantId?: string;
  testMode?: boolean;
  isEnabled?: boolean;
}): Promise<{ data?: AdminPaymentGatewayConfig; error?: any }> => {
  return apiClient.post<AdminPaymentGatewayConfig>(
    "/api/system/admin/payment-gateway",
    config
  );
};
