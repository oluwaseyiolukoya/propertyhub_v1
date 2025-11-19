import { apiClient, ApiResponse } from '../api-client';

// ============================================
// TYPES
// ============================================

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  minAmount?: number;
  maxAmount?: number;
  categories?: string[];
  approvalLevels: ApprovalLevel[];
  autoApproveUnder?: number;
  createdBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

export interface ApprovalLevel {
  level: number;
  name: string;
  requiredApprovers: number;
  approverRoles: string[];
  approverMembers?: string[];
  timeoutHours?: number;
}

export interface PendingApproval {
  id: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    vendor?: {
      id: string;
      name: string;
    };
    category: string;
    description: string;
    project?: {
      id: string;
      name: string;
    };
    createdAt: string;
  };
  workflow?: {
    id: string;
    name: string;
  };
  level: number;
  levelName?: string;
  status: string;
  requestedAt: string;
  dueAt?: string;
  hoursRemaining?: number;
}

export interface ApprovalHistoryEntry {
  id: string;
  action: string;
  actorName: string;
  actorRole?: string;
  level?: number;
  comments?: string;
  previousStatus?: string;
  newStatus?: string;
  metadata?: any;
  createdAt: string;
}

export interface ApprovalStats {
  totalApprovals: number;
  approved: number;
  rejected: number;
  pending: number;
  averageApprovalTime: number;
  byLevel: {
    level: number;
    name: string;
    averageTime: number;
    approved: number;
    rejected: number;
    pending: number;
  }[];
  byApprover: {
    approver: string;
    role: string;
    totalApprovals: number;
    approved: number;
    rejected: number;
    pending: number;
    averageTime: number;
  }[];
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
  minAmount?: number;
  maxAmount?: number;
  categories?: string[];
  approvalLevels: ApprovalLevel[];
  autoApproveUnder?: number;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
  minAmount?: number;
  maxAmount?: number;
  categories?: string[];
  approvalLevels?: ApprovalLevel[];
  autoApproveUnder?: number;
}

export interface ApproveInvoiceRequest {
  comments?: string;
}

export interface RejectInvoiceRequest {
  comments: string;
  reason?: string;
}

// ============================================
// WORKFLOW API
// ============================================

/**
 * Get all approval workflows
 */
export async function getApprovalWorkflows(): Promise<ApiResponse<ApprovalWorkflow[]>> {
  return apiClient.get<ApprovalWorkflow[]>('/api/approvals/workflows');
}

/**
 * Get a single workflow
 */
export async function getApprovalWorkflow(workflowId: string): Promise<ApiResponse<ApprovalWorkflow>> {
  return apiClient.get<ApprovalWorkflow>(`/api/approvals/workflows/${workflowId}`);
}

/**
 * Create a new workflow
 */
export async function createApprovalWorkflow(data: CreateWorkflowRequest): Promise<ApiResponse<any>> {
  return apiClient.post('/api/approvals/workflows', data);
}

/**
 * Update a workflow
 */
export async function updateApprovalWorkflow(
  workflowId: string,
  data: UpdateWorkflowRequest
): Promise<ApiResponse<any>> {
  return apiClient.put(`/api/approvals/workflows/${workflowId}`, data);
}

/**
 * Delete a workflow
 */
export async function deleteApprovalWorkflow(workflowId: string): Promise<ApiResponse<any>> {
  return apiClient.delete(`/api/approvals/workflows/${workflowId}`);
}

// ============================================
// APPROVAL PROCESSING API
// ============================================

/**
 * Get pending approvals for current user
 */
export async function getPendingApprovals(params?: {
  sort?: 'dueDate' | 'amount' | 'createdDate';
  limit?: number;
}): Promise<ApiResponse<{
  data: PendingApproval[];
  meta: {
    total: number;
    overdue: number;
    dueSoon: number;
  };
}>> {
  const queryParams = new URLSearchParams();
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `/api/approvals/pending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return apiClient.get(url);
}

/**
 * Approve an invoice
 */
export async function approveInvoice(
  approvalId: string,
  data: ApproveInvoiceRequest
): Promise<ApiResponse<any>> {
  return apiClient.post(`/api/approvals/${approvalId}/approve`, data);
}

/**
 * Reject an invoice
 */
export async function rejectInvoice(
  approvalId: string,
  data: RejectInvoiceRequest
): Promise<ApiResponse<any>> {
  return apiClient.post(`/api/approvals/${approvalId}/reject`, data);
}

/**
 * Get approval history for an invoice
 */
export async function getApprovalHistory(invoiceId: string): Promise<ApiResponse<ApprovalHistoryEntry[]>> {
  return apiClient.get<ApprovalHistoryEntry[]>(`/api/approvals/invoices/${invoiceId}/history`);
}

/**
 * Get approval statistics
 */
export async function getApprovalStats(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}): Promise<ApiResponse<ApprovalStats>> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.groupBy) queryParams.append('groupBy', params.groupBy);

  const url = `/api/approvals/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return apiClient.get<ApprovalStats>(url);
}

