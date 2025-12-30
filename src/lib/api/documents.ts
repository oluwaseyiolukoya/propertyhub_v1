import apiClient, { getAuthToken } from "../api-client";
import { API_ENDPOINTS } from "../api-config";

export interface Document {
  id: string;
  customerId: string;
  propertyId?: string | null;
  unitId?: string | null;
  tenantId?: string | null;
  managerId?: string | null;
  projectId?: string | null;
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
  developer_projects?: {
    id: string;
    name: string;
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
  projectId?: string;
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
    const url = `${base}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiClient.get(url, undefined, {
      suppressAuthRedirect: true,
    });
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error("Get documents error:", error);
    return {
      data: null,
      error: error.response?.data?.error || "Failed to fetch documents",
    };
  }
}

/**
 * Get a single document by ID
 */
export async function getDocument(id: string) {
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.DOCUMENTS.GET(id),
      undefined,
      { suppressAuthRedirect: true }
    );
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error("Get document error:", error);
    return {
      data: null,
      error: error.response?.data?.error || "Failed to fetch document",
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
    console.error("Create document error:", error);
    return {
      data: null,
      error: error.response?.data?.error || "Failed to create document",
    };
  }
}

/**
 * Upload a new document
 */
export async function uploadDocument(formData: FormData) {
  // Emit storage update event after successful upload
  const emitStorageUpdate = () => {
    window.dispatchEvent(new CustomEvent("storage:updated", { detail: { action: "upload" } }));
  };
  console.log("[uploadDocument] Starting upload...");
  console.log("[uploadDocument] FormData entries:");
  for (const [key, value] of formData.entries()) {
    console.log(
      `  ${key}:`,
      value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value
    );
  }

  // Do NOT set Content-Type manually; let the browser set the multipart boundary
  const response = await apiClient.post(
    API_ENDPOINTS.DOCUMENTS.UPLOAD,
    formData,
    { suppressAuthRedirect: true }
  );

  console.log("[uploadDocument] Response:", response);

  // API client returns { data } on success, { error } on failure
  if (response.error) {
    console.error("[uploadDocument] Upload failed:", response.error);
    return {
      data: null,
      error:
        response.error.error ||
        response.error.message ||
        "Failed to upload document",
    };
  }

  console.log("[uploadDocument] Upload successful:", response.data);

  // Emit storage update event after successful upload
  window.dispatchEvent(new CustomEvent("storage:updated", { detail: { action: "upload" } }));

  return { data: response.data, error: null };
}

/**
 * Update a document
 */
export async function updateDocument(id: string, data: Partial<Document>) {
  try {
    const response = await apiClient.put(
      API_ENDPOINTS.DOCUMENTS.UPDATE(id),
      data,
      { suppressAuthRedirect: true }
    );
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error("Update document error:", error);
    return {
      data: null,
      error: error.response?.data?.error || "Failed to update document",
    };
  }
}

/**
 * Delete a document (soft delete)
 */
export async function deleteDocument(id: string) {
  try {
    const response = await apiClient.delete(
      API_ENDPOINTS.DOCUMENTS.DELETE(id),
      { suppressAuthRedirect: true }
    );

    // Emit storage update event after successful delete
    if (!response.error) {
      window.dispatchEvent(new CustomEvent("storage:updated", { detail: { action: "delete" } }));
    }

    return { data: response.data, error: null };
  } catch (error: any) {
    console.error("Delete document error:", error);
    return {
      data: null,
      error: error.response?.data?.error || "Failed to delete document",
    };
  }
}

/**
 * Get document statistics
 */
export async function getDocumentStats() {
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.DOCUMENTS.STATS,
      undefined,
      { suppressAuthRedirect: true }
    );
    return { data: response.data, error: null };
  } catch (error: any) {
    console.error("Get document stats error:", error);
    return {
      data: null,
      error: error.response?.data?.error || "Failed to fetch document stats",
    };
  }
}

/**
 * Get document download URL via API endpoint (handles both Spaces and local files)
 * @deprecated Use downloadDocumentInFormat() instead for proper authentication
 */
export function getDocumentDownloadUrl(
  documentId: string,
  format: string = "pdf"
): string {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = getAuthToken();
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  const qs = params.toString();
  return `${baseUrl}/api/documents/${documentId}/download/${format}${
    qs ? `?${qs}` : ""
  }`;
}

/**
 * Download a document in a specific format (PDF or DOCX)
 */
export function downloadDocumentInFormat(
  documentId: string,
  format: "pdf" | "docx",
  options?: { inline?: boolean; includeToken?: boolean }
): string {
  // Use relative path to leverage same-origin proxy in dev and avoid CSP/frame-ancestors issues
  const params = new URLSearchParams();
  if (options?.inline) params.set("inline", "1");

  if (options?.includeToken) {
    const token = getAuthToken();
    if (token) params.set("token", token);
  }

  const qs = params.toString();
  return `/api/documents/${documentId}/download/${format}${qs ? `?${qs}` : ""}`;
}
