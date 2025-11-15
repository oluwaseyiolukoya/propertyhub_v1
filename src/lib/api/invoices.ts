import { apiClient, ApiResponse } from '../api-client';

// ============================================
// Billing Invoices (for subscriptions/billing)
// ============================================

export interface InvoiceDTO {
  id: string;
  customerId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueDate?: string;
  paidAt?: string;
  billingPeriod?: string;
  description?: string;
  items?: any;
  createdAt: string;
  updatedAt: string;
  refunds?: { amount: number }[];
  customer?: { id: string; company: string; email: string };
}

/**
 * Get all billing invoices
 */
export async function getInvoices(params?: { customerId?: string; status?: string }): Promise<ApiResponse<InvoiceDTO[]>> {
  try {
    const query = new URLSearchParams();
    if (params?.customerId) query.set('customerId', params.customerId);
    if (params?.status) query.set('status', params.status);
    const response = await apiClient.get<InvoiceDTO[]>(`/api/invoices${query.toString() ? `?${query.toString()}` : ''}`);
    return response;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return { data: null, error: { message: 'Failed to fetch invoices' } };
  }
}

/**
 * Create a refund for a billing invoice
 */
export async function createRefund(
  invoiceId: string,
  payload: { amount: number; currency?: string; reason?: string }
): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.post<any>(`/api/invoices/${invoiceId}/refunds`, payload);
    return response;
  } catch (error) {
    console.error('Error creating refund:', error);
    return { data: null, error: { message: 'Failed to create refund' } };
  }
}

// ============================================
// Project Invoices (for developer projects)
// ============================================

export interface ProjectInvoice {
  id: string;
  projectId: string;
  vendorId?: string;
  purchaseOrderId?: string;
  invoiceNumber: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'matched';
  dueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  approvedBy?: string;
  approvedAt?: string;
  attachments?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
  purchaseOrder?: {
    id: string;
    poNumber: string;
    totalAmount: number;
    status: string;
  };
}

export interface CreateInvoiceData {
  purchaseOrderId?: string;
  vendorId?: string;
  description: string;
  category: string;
  amount: number;
  currency?: string;
  dueDate?: string;
  paymentMethod?: string;
  notes?: string;
  attachments?: any;
}

/**
 * Get all invoices for a project
 */
export async function getProjectInvoices(projectId: string): Promise<ApiResponse<ProjectInvoice[]>> {
  try {
    const response = await apiClient.get<ProjectInvoice[]>(
      `/api/developer-dashboard/projects/${projectId}/invoices`
    );
    return response;
  } catch (error) {
    console.error('Error fetching project invoices:', error);
    return { data: null, error: { message: 'Failed to fetch invoices' } };
  }
}

/**
 * Create a new invoice for a project
 */
export async function createProjectInvoice(
  projectId: string,
  data: CreateInvoiceData
): Promise<ApiResponse<ProjectInvoice>> {
  try {
    const response = await apiClient.post<ProjectInvoice>(
      `/api/developer-dashboard/projects/${projectId}/invoices`,
      data
    );
    return response;
  } catch (error) {
    console.error('Error creating invoice:', error);
    return { data: null, error: { message: 'Failed to create invoice' } };
  }
}

/**
 * Mark a project invoice as paid and automatically create an expense
 */
export async function markInvoiceAsPaid(
  projectId: string,
  invoiceId: string,
  paymentDetails: {
    paymentMethod: string;
    paymentReference?: string;
    paidDate?: string;
    notes?: string;
  }
): Promise<ApiResponse<{ message: string; invoice: ProjectInvoice; expense: any }>> {
  try {
    const response = await apiClient.post<{ message: string; invoice: ProjectInvoice; expense: any }>(
      `/api/developer-dashboard/projects/${projectId}/invoices/${invoiceId}/mark-paid`,
      paymentDetails
    );
    return response;
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return { data: null, error: { message: 'Failed to mark invoice as paid' } };
  }
}
