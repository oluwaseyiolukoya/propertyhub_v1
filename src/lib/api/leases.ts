/**
 * Leases API
 */

import { apiClient } from '../api-client';

export interface CreateLeasePayload {
  propertyId: string;
  unitId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  monthlyRent: number;
  securityDeposit?: number;
  currency?: string;
  terms?: string;
  specialClauses?: string;
  sendInvitation?: boolean;
}

export const createLease = async (data: CreateLeasePayload) => {
  return apiClient.post<any>('/api/leases', data);
};

export const getLeases = async (filters?: { propertyId?: string; status?: string; search?: string }) => {
  return apiClient.get<any[]>('/api/leases', filters as any);
};

export const getLease = async (id: string) => {
  return apiClient.get<any>(`/api/leases/${id}`);
};

export const updateLease = async (id: string, data: any) => {
  return apiClient.put<any>(`/api/leases/${id}`, data);
};

export const terminateLease = async (id: string, reason: string) => {
  return apiClient.post<any>(`/api/leases/${id}/terminate`, { reason });
};

