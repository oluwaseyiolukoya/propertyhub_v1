import { apiClient } from '../api-client';

export interface PurchaseOrder {
  id: string;
  projectId: string;
  customerId: string;
  vendorId?: string;
  poNumber: string;
  description: string;
  category: string;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'closed';
  itemCount: number;
  requestedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  expiryDate?: string;
  deliveryDate?: string;
  terms?: string;
  notes?: string;
  attachments?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
  items?: PurchaseOrderItem[];
  _count?: {
    invoices: number;
  };
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderData {
  vendorId?: string;
  description: string;
  category: string;
  totalAmount: number;
  currency?: string;
  status?: string;
  expiryDate?: string;
  deliveryDate?: string;
  terms?: string;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    category?: string;
    notes?: string;
  }[];
}

export interface UpdatePurchaseOrderData {
  vendorId?: string;
  description?: string;
  category?: string;
  totalAmount?: number;
  status?: string;
  expiryDate?: string;
  deliveryDate?: string;
  terms?: string;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    category?: string;
    notes?: string;
  }[];
}

export interface PurchaseOrderStats {
  totalValue: number;
  approvedCount: number;
  pendingCount: number;
  totalCount: number;
}

/**
 * Get all purchase orders for a project
 */
export async function getPurchaseOrders(projectId: string) {
  return apiClient.get<{ data: PurchaseOrder[]; stats: PurchaseOrderStats }>(
    `/api/developer-dashboard/projects/${projectId}/purchase-orders`
  );
}

/**
 * Get a single purchase order by ID
 */
export async function getPurchaseOrder(poId: string) {
  return apiClient.get<PurchaseOrder>(
    `/api/developer-dashboard/purchase-orders/${poId}`
  );
}

/**
 * Create a new purchase order
 */
export async function createPurchaseOrder(
  projectId: string,
  data: CreatePurchaseOrderData
) {
  return apiClient.post<PurchaseOrder>(
    `/api/developer-dashboard/projects/${projectId}/purchase-orders`,
    data
  );
}

/**
 * Update a purchase order
 */
export async function updatePurchaseOrder(
  poId: string,
  data: UpdatePurchaseOrderData
) {
  return apiClient.patch<PurchaseOrder>(
    `/api/developer-dashboard/purchase-orders/${poId}`,
    data
  );
}

/**
 * Approve a purchase order
 */
export async function approvePurchaseOrder(poId: string) {
  return apiClient.post<PurchaseOrder>(
    `/api/developer-dashboard/purchase-orders/${poId}/approve`,
    {}
  );
}

/**
 * Reject a purchase order
 */
export async function rejectPurchaseOrder(poId: string, reason?: string) {
  return apiClient.post<PurchaseOrder>(
    `/api/developer-dashboard/purchase-orders/${poId}/reject`,
    { reason }
  );
}

/**
 * Delete a purchase order
 */
export async function deletePurchaseOrder(poId: string) {
  return apiClient.delete<{ message: string }>(
    `/api/developer-dashboard/purchase-orders/${poId}`
  );
}

/**
 * Get invoices for a purchase order
 */
export async function getPurchaseOrderInvoices(poId: string) {
  return apiClient.get<{ data: any[] }>(
    `/api/developer-dashboard/purchase-orders/${poId}/invoices`
  );
}

/**
 * Add line items to a purchase order
 */
export async function addPurchaseOrderItems(
  poId: string,
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    category?: string;
    notes?: string;
  }[]
) {
  return apiClient.post<{ message: string; count: number }>(
    `/api/developer-dashboard/purchase-orders/${poId}/items`,
    { items }
  );
}

