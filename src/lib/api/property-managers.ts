import { apiClient, ApiResponse } from '../api-client';

export interface Manager {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  property_managers?: Array<{
    id: string;
    propertyId: string;
    managerId: string;
    isActive: boolean;
    assignedAt: string;
    properties?: {
      id: string;
      name: string;
      address: string;
      city?: string;
      state?: string;
      totalUnits?: number;
    }
  }>;
}

export interface CreateManagerPayload {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  specialization?: string;
  commission?: number;
  permissions?: any;
  password?: string;
  credentials?: { username?: string; tempPassword?: string };
  sendInvitation?: boolean;
}

export const getManagers = () => apiClient.get<Manager[]>('/api/property-managers');

export const createManager = (payload: CreateManagerPayload) =>
  apiClient.post<{ tempPassword?: string } & Manager>('/api/property-managers', payload);

export const updateManager = (id: string, updates: Partial<CreateManagerPayload>) =>
  apiClient.put<Manager>(`/api/property-managers/${id}`, updates);

export const assignManagerToProperty = (
  managerId: string,
  propertyId: string,
  permissions?: any
) => apiClient.post(`/api/property-managers/${managerId}/assign`, { propertyId, permissions });

export const removeManagerFromProperty = (managerId: string, propertyId: string) =>
  apiClient.delete(`/api/property-managers/${managerId}/property/${propertyId}`);

export const deactivateManager = (id: string) =>
  apiClient.post(`/api/property-managers/${id}/deactivate`);

export interface ManagerStats {
  totalManagers: number;
  propertiesManaged: number;
  totalProperties: number;
  coverageRate: number;
  totalAssignments: number;
  activeManagers: number;
  pendingManagers: number;
  inactiveManagers: number;
  unmanagedProperties: number;
}

export const getManagerStats = () => 
  apiClient.get<ManagerStats>('/api/property-managers/stats');

export const resetManagerPassword = (managerId: string) =>
  apiClient.post<{
    message: string;
    tempPassword: string;
    managerEmail: string;
    managerName: string;
  }>(`/api/property-managers/${managerId}/reset-password`, {});


