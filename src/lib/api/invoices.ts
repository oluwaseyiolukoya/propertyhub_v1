import { apiClient } from '../api-client';

export interface InvoiceDTO {
  id: string;
  customerId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt?: string | null;
  refundedAt?: string | null;
  billingPeriod?: string;
  description?: string | null;
  items?: any;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; company: string; email: string };
}

export async function getInvoices(params?: { customerId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.customerId) query.set('customerId', params.customerId);
  if (params?.status) query.set('status', params.status);
  return apiClient.get<InvoiceDTO[]>(`/api/invoices${query.toString() ? `?${query.toString()}` : ''}`);
}

export async function createRefund(invoiceId: string, payload: { amount: number; currency?: string; reason?: string }) {
  return apiClient.post(`/api/invoices/${invoiceId}/refunds`, payload);
}

export async function getRefunds(invoiceId: string) {
  return apiClient.get(`/api/invoices/${invoiceId}/refunds`);
}


