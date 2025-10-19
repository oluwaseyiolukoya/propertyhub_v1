/**
 * Users API (Admin)
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  customerId?: string;
  status: string;
  avatar?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferences?: any;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  customerId?: string;
}

/**
 * Get all users
 */
export const getUsers = async (filters?: UserFilters) => {
  return apiClient.get<User[]>(API_ENDPOINTS.USERS.LIST, filters);
};

/**
 * Get single user
 */
export const getUser = async (id: string) => {
  return apiClient.get<User>(API_ENDPOINTS.USERS.GET(id));
};

/**
 * Create user
 */
export const createUser = async (data: Partial<User> & { password?: string; sendInvitation?: boolean }) => {
  return apiClient.post<User>(API_ENDPOINTS.USERS.CREATE, data);
};

/**
 * Update user
 */
export const updateUser = async (id: string, data: Partial<User>) => {
  return apiClient.put<User>(API_ENDPOINTS.USERS.UPDATE(id), data);
};

/**
 * Delete user
 */
export const deleteUser = async (id: string) => {
  return apiClient.delete<{ message: string }>(API_ENDPOINTS.USERS.DELETE(id));
};

/**
 * Send user invitation
 */
export const sendUserInvitation = async (data: {
  email: string;
  name: string;
  role: string;
  customerId?: string;
}) => {
  return apiClient.post<{ message: string }>(API_ENDPOINTS.USERS.SEND_INVITATION, data);
};

