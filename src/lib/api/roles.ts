/**
 * Roles API (Admin)
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  isSystem?: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoleFilters {
  search?: string;
  isActive?: boolean;
}

/**
 * Get all roles
 */
export const getRoles = async (filters?: RoleFilters) => {
  const queryParams = new URLSearchParams();
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
  
  const endpoint = queryParams.toString() 
    ? `${API_ENDPOINTS.ROLES.LIST}?${queryParams.toString()}`
    : API_ENDPOINTS.ROLES.LIST;
    
  return apiClient.get<Role[]>(endpoint);
};

/**
 * Get single role
 */
export const getRole = async (id: string) => {
  return apiClient.get<Role>(API_ENDPOINTS.ROLES.GET(id));
};

/**
 * Create role
 */
export const createRole = async (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystem' | 'userCount'>) => {
  return apiClient.post<Role>(API_ENDPOINTS.ROLES.CREATE, data);
};

/**
 * Update role
 */
export const updateRole = async (id: string, data: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>>) => {
  return apiClient.put<Role>(API_ENDPOINTS.ROLES.UPDATE(id), data);
};

/**
 * Delete role
 */
export const deleteRole = async (id: string) => {
  return apiClient.delete<{ message: string }>(API_ENDPOINTS.ROLES.DELETE(id));
};

