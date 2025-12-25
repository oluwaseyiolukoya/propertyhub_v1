import { apiClient } from "../api-client";

// Types
export interface TenantVerification {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  status: string;
  kycStatus: string | null;
  kycVerificationId: string | null;
  kycCompletedAt: string | null;
  kycFailureReason: string | null;
  kycLastAttemptAt: string | null;
  ownerApprovalStatus: "pending" | "approved" | "rejected";
  ownerReviewedAt: string | null;
  ownerNotes: string | null;
  requiresKyc: boolean;
  createdAt: string;
  property: {
    id: string;
    name: string;
    address: string;
  } | null;
  unit: {
    id: string;
    unitNumber: string;
  } | null;
  leaseId: string | null;
}

export interface TenantVerificationListResponse {
  tenants: TenantVerification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TenantVerificationAnalytics {
  summary: {
    total: number;
    pendingReview: number;
    ownerApproved: number;
    ownerRejected: number;
    verified: number;
    kycInProgress: number;
    approvalRate: number;
  };
}

export interface VerificationDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  status: string;
  uploadedAt: string;
  confidence: number | null;
}

export interface TenantVerificationDetails extends TenantVerification {
  leases: Array<{
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    units: {
      id: string;
      unitNumber: string;
      properties: {
        id: string;
        name: string;
        address: string;
      };
    };
  }>;
  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;
  documents: VerificationDocument[];
}

/**
 * Get all tenant verifications for owner's properties
 */
export const getTenantVerifications = async (
  status?: string,
  page: number = 1,
  limit: number = 20,
  search?: string
) => {
  const params: Record<string, any> = { page, limit };
  if (status && status !== "all") params.status = status;
  if (search && search.trim()) params.search = search.trim();

  return apiClient.get<TenantVerificationListResponse>(
    "/api/owner/tenants/verifications",
    params
  );
};

/**
 * Get verification analytics for owner
 */
export const getTenantVerificationAnalytics = async () => {
  return apiClient.get<TenantVerificationAnalytics>(
    "/api/owner/tenants/verifications/analytics"
  );
};

/**
 * Get specific tenant verification details
 */
export const getTenantVerificationDetails = async (tenantId: string) => {
  return apiClient.get<{ tenant: TenantVerificationDetails }>(
    `/api/owner/tenants/verifications/${tenantId}`
  );
};

/**
 * Approve tenant KYC (Owner action)
 */
export const approveTenantKyc = async (tenantId: string, notes?: string) => {
  return apiClient.post<{
    success: boolean;
    message: string;
    emailSent: boolean;
  }>(`/api/owner/tenants/verifications/${tenantId}/approve`, { notes });
};

/**
 * Reject tenant KYC (Owner action)
 */
export const rejectTenantKyc = async (tenantId: string, reason: string) => {
  return apiClient.post<{
    success: boolean;
    message: string;
    emailSent: boolean;
  }>(`/api/owner/tenants/verifications/${tenantId}/reject`, { reason });
};

/**
 * Request tenant to re-submit KYC
 */
export const requestKycResubmit = async (tenantId: string, reason?: string) => {
  return apiClient.post<{ success: boolean; message: string }>(
    `/api/owner/tenants/verifications/${tenantId}/request-resubmit`,
    { reason }
  );
};

/**
 * Get document download URL
 */
export const getTenantDocumentUrl = async (
  tenantId: string,
  documentId: string
) => {
  return apiClient.get<{ url: string }>(
    `/api/owner/tenants/verifications/${tenantId}/documents/${documentId}`
  );
};

/**
 * Delete tenant verification (reset KYC status so tenant can re-submit)
 */
export const deleteTenantVerification = async (
  tenantId: string,
  reason?: string
) => {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/api/owner/tenants/verifications/${tenantId}`,
    { reason }
  );
};

/**
 * KYC Verification Result Types
 */
export interface DojahVerificationResult {
  success: boolean;
  status: string;
  confidence: number;
  referenceId: string;
  data: any;
  comparison: {
    tenantData: any;
    dojahData: any;
    matches: {
      name: boolean;
      dob: boolean | null;
    };
  };
}

export interface VerifyKYCResponse {
  success: boolean;
  result: DojahVerificationResult;
  message: string;
}

/**
 * Verify tenant KYC using Dojah
 * POST /api/owner/tenants/verifications/:tenantId/verify-kyc
 */
export const verifyTenantKYC = async (
  tenantId: string,
  documentType: "nin" | "passport" | "dl" | "vin" | "bvn",
  documentId?: string
) => {
  return apiClient.post<VerifyKYCResponse>(
    `/api/owner/tenants/verifications/${tenantId}/verify-kyc`,
    { documentType, documentId }
  );
};

/**
 * Request Additional Document Types
 */
export interface RequestAdditionalDocumentPayload {
  documentTypes: string[];
  message?: string;
}

/**
 * Request additional document from tenant
 * POST /api/owner/tenants/verifications/:tenantId/request-document
 */
export const requestAdditionalDocument = async (
  tenantId: string,
  payload: RequestAdditionalDocumentPayload
) => {
  return apiClient.post<{ success: boolean; message: string }>(
    `/api/owner/tenants/verifications/${tenantId}/request-document`,
    payload
  );
};
