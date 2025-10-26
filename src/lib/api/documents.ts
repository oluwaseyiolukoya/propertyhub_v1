import apiClient from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface Document {
  id: string;
  customerId: string;
  propertyId?: string | null;
  unitId?: string | null;
  tenantId?: string | null;
  managerId?: string | null;
  name: string;
  type: string;
  category: string;
  fileUrl: string;
  fileSize?: number | null;
  format?: string | null;
  description?: string | null;
  uploadedBy: string;
  uploadedById: string;
  status: string;
  metadata?: any;
  isShared: boolean;
  sharedWith: string[];
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  properties?: {
    id: string;
    name: string;
    address: string;
  } | null;
  units?: {
    id: string;
    unitNumber: string;
    type: string;
  } | null;
  tenant?: {
    id: string;
    name: string;
    email: string;
  } | null;
  manager?: {
    id: string;
    name: string;
    email: string;
  } | null;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DocumentStats {
  total: number;
  byType: Array<{ type: string; _count: number }>;
  recent: number;
  pending: number;
}

export interface DocumentFilters {
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  type?: string;
  category?: string;
  status?: string;
}

/**
 * Get all documents with optional filters
 */
export async function getDocuments(filters?: DocumentFilters) {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const base = API_ENDPOINTS.DOCUMENTS.LIST;
    const url = `${base}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get(url, undefined, { suppressAuthRedirect: true });
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error('Get documents error:', error);
    return {
      data: null,
      error: error.response?.data?.error || 'Failed to fetch documents'
    };
  }
}

/**
 * Get a single document by ID
 */
export async function getDocument(id: string) {
  try {
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS.GET(id), undefined, { suppressAuthRedirect: true });
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error('Get document error:', error);
    return {
      data: null,
      error: error.response?.data?.error || 'Failed to fetch document'
    };
  }
}

/**
 * Create a document (without file upload - for generated contracts)
 */
export async function createDocument(data: Partial<Document>) {
  try {
    const response = await apiClient.post(API_ENDPOINTS.DOCUMENTS.LIST, data);
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error('Create document error:', error);
    return {
      data: null,
      error: error.response?.data?.error || 'Failed to create document'
    };
  }
}

/**
 * Upload a new document
 */
export async function uploadDocument(formData: FormData) {
  try {
    // Do NOT set Content-Type manually; let the browser set the multipart boundary
    const response = await apiClient.post(API_ENDPOINTS.DOCUMENTS.UPLOAD, formData, { suppressAuthRedirect: true });
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error('Upload document error:', error);
    return {
      data: null,
      error: error.response?.data?.error || 'Failed to upload document'
    };
  }
}

/**
 * Update a document
 */
export async function updateDocument(id: string, data: Partial<Document>) {
  try {
    const response = await apiClient.put(API_ENDPOINTS.DOCUMENTS.UPDATE(id), data, { suppressAuthRedirect: true });
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error('Update document error:', error);
    return {
      data: null,
      error: error.response?.data?.error || 'Failed to update document'
    };
  }
}

/**
 * Delete a document (soft delete)
 */
export async function deleteDocument(id: string) {
  try {
    const response = await apiClient.delete(API_ENDPOINTS.DOCUMENTS.DELETE(id), { suppressAuthRedirect: true });
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error('Delete document error:', error);
    return {
      data: null,
      error: error.response?.data?.error || 'Failed to delete document'
    };
  }
}

/**
 * Get document statistics
 */
export async function getDocumentStats() {
  try {
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS.STATS, undefined, { suppressAuthRedirect: true });
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error('Get document stats error:', error);
    return {
      data: null,
      error: error.response?.data?.error || 'Failed to fetch document stats'
    };
  }
}

/**
 * Download a document
 */
export function getDocumentDownloadUrl(fileUrl: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${fileUrl}`;
}

