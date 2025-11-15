import { apiClient, ApiResponse } from '../api-client';

export interface Vendor {
  id: string;
  customerId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  vendorType: 'contractor' | 'supplier' | 'consultant' | 'subcontractor';
  specialization?: string;
  rating?: number; // 0-5 stars
  totalContracts: number;
  totalValue: number;
  currency: string;
  status: 'active' | 'inactive' | 'blacklisted';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  vendorType: 'contractor' | 'supplier' | 'consultant' | 'subcontractor';
  specialization?: string;
  rating?: number;
  status?: 'active' | 'inactive' | 'blacklisted';
  notes?: string;
}

export interface UpdateVendorData extends Partial<CreateVendorData> {}

export interface VendorStats {
  vendor: Vendor;
  stats: {
    purchaseOrders: {
      total: number;
      approved: number;
      pending: number;
      totalValue: number;
    };
    invoices: {
      total: number;
      paid: number;
      pending: number;
    };
  };
}

/**
 * Get all vendors for the current customer
 */
export async function getVendors(params?: {
  status?: string;
  vendorType?: string;
  search?: string;
}): Promise<ApiResponse<Vendor[]>> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.vendorType) query.set('vendorType', params.vendorType);
    if (params?.search) query.set('search', params.search);

    const response = await apiClient.get<Vendor[]>(
      `/api/developer-dashboard/vendors${query.toString() ? `?${query.toString()}` : ''}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return { data: null, error: { message: 'Failed to fetch vendors' } };
  }
}

/**
 * Get a single vendor by ID
 */
export async function getVendor(vendorId: string): Promise<ApiResponse<Vendor>> {
  try {
    const response = await apiClient.get<Vendor>(`/api/developer-dashboard/vendors/${vendorId}`);
    return response;
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return { data: null, error: { message: 'Failed to fetch vendor' } };
  }
}

/**
 * Create a new vendor
 */
export async function createVendor(data: CreateVendorData): Promise<ApiResponse<Vendor>> {
  try {
    const response = await apiClient.post<Vendor>('/api/developer-dashboard/vendors', data);
    return response;
  } catch (error) {
    console.error('Error creating vendor:', error);
    return { data: null, error: { message: 'Failed to create vendor' } };
  }
}

/**
 * Update an existing vendor
 */
export async function updateVendor(
  vendorId: string,
  data: UpdateVendorData
): Promise<ApiResponse<Vendor>> {
  try {
    const response = await apiClient.patch<Vendor>(
      `/api/developer-dashboard/vendors/${vendorId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Error updating vendor:', error);
    return { data: null, error: { message: 'Failed to update vendor' } };
  }
}

/**
 * Delete a vendor
 */
export async function deleteVendor(vendorId: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await apiClient.delete<{ message: string }>(
      `/api/developer-dashboard/vendors/${vendorId}`
    );
    return response;
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return { data: null, error: { message: 'Failed to delete vendor' } };
  }
}

/**
 * Get vendor statistics (purchase orders, invoices, etc.)
 */
export async function getVendorStats(vendorId: string): Promise<ApiResponse<VendorStats>> {
  try {
    const response = await apiClient.get<VendorStats>(
      `/api/developer-dashboard/vendors/${vendorId}/stats`
    );
    return response;
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    return { data: null, error: { message: 'Failed to fetch vendor stats' } };
  }
}

