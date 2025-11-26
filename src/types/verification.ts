/**
 * Identity Verification Types
 */

export type DocumentType =
  | 'nin'
  | 'passport'
  | 'drivers_license'
  | 'voters_card'
  | 'utility_bill'
  | 'proof_of_address';

export type VerificationStatus =
  | 'not_started'
  | 'pending'
  | 'in_progress'
  | 'approved'
  | 'rejected'
  | 'failed';

export type DocumentStatus =
  | 'pending'
  | 'in_progress'
  | 'verified'
  | 'failed'
  | 'rejected';

export interface DocumentTypeInfo {
  value: DocumentType;
  label: string;
  requiresNumber: boolean;
  description: string;
  placeholder?: string;
}

export interface VerificationDocument {
  id: string;
  documentType: DocumentType;
  status: DocumentStatus;
  confidence?: number;
  verifiedAt?: string;
  failureReason?: string;
  fileName: string;
}

export interface VerificationRequest {
  id: string;
  customerId: string;
  customerType: string;
  status: VerificationStatus;
  submittedAt: string;
  completedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documents: VerificationDocument[];
}

export interface VerificationStatus {
  verified: boolean;
  status: VerificationStatus;
  requestId?: string;
  submittedAt?: string;
  completedAt?: string;
  documents?: VerificationDocument[];
  rejectionReason?: string;
  message?: string;
}

export interface VerificationHistory {
  id: string;
  requestId: string;
  action: string;
  performedBy?: string;
  details?: any;
  createdAt: string;
}

export interface VerificationAnalytics {
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    inProgress: number;
    approvalRate: number;
  };
  recentRequests: VerificationRequest[];
  documentStats: Array<{
    documentType: DocumentType;
    status: DocumentStatus;
    _count: { id: number };
  }>;
  providerStats: Array<{
    provider: string;
    totalCalls: number;
    avgDuration: number;
  }>;
  avgProcessingTime: number;
}

export interface PaginatedRequests {
  requests: VerificationRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

