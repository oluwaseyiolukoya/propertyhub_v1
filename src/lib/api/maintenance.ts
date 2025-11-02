/**
 * Maintenance API
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  unitId?: string;
  reportedById: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  images?: string[];
  preferredSchedule?: string;
  assignedToId?: string;
  scheduledDate?: string;
  completedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
}

export interface MaintenanceFilters {
  propertyId?: string;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}

/**
 * Get all maintenance requests
 */
export const getMaintenanceRequests = async (filters?: MaintenanceFilters) => {
  return apiClient.get<MaintenanceRequest[]>(API_ENDPOINTS.MAINTENANCE.LIST, filters);
};

/**
 * Get single maintenance request
 */
export const getMaintenanceRequest = async (id: string) => {
  return apiClient.get<MaintenanceRequest>(API_ENDPOINTS.MAINTENANCE.GET(id));
};

/**
 * Create maintenance request
 */
export const createMaintenanceRequest = async (data: Partial<MaintenanceRequest>) => {
  return apiClient.post<MaintenanceRequest>(API_ENDPOINTS.MAINTENANCE.CREATE, data);
};

/**
 * Update maintenance request
 */
export const updateMaintenanceRequest = async (
  id: string,
  data: Partial<MaintenanceRequest>
) => {
  return apiClient.put<MaintenanceRequest>(API_ENDPOINTS.MAINTENANCE.UPDATE(id), data);
};

/**
 * Reply to a maintenance request (tenant, manager, or owner)
 */
export const replyMaintenanceRequest = async (
  id: string,
  data: { note: string; status?: string; attachments?: string[] }
) => {
  return apiClient.post<any>(API_ENDPOINTS.MAINTENANCE.REPLY(id), data);
};

/**
 * Assign maintenance request
 */
export const assignMaintenanceRequest = async (
  id: string,
  data: { assignedToId: string; notes?: string }
) => {
  return apiClient.post<MaintenanceRequest>(API_ENDPOINTS.MAINTENANCE.ASSIGN(id), data);
};

/**
 * Complete maintenance request
 */
export const completeMaintenanceRequest = async (
  id: string,
  data: { actualCost?: number; completionNotes?: string }
) => {
  return apiClient.post<MaintenanceRequest>(API_ENDPOINTS.MAINTENANCE.COMPLETE(id), data);
};

/**
 * Get maintenance statistics
 */
export const getMaintenanceStats = async (propertyId?: string) => {
  return apiClient.get<any>(
    API_ENDPOINTS.MAINTENANCE.STATS,
    propertyId ? { propertyId } : undefined
  );
};

/**
 * Upload files for maintenance request
 */
export const uploadMaintenanceFiles = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/maintenance/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload files');
  }

  return response.json();
};

