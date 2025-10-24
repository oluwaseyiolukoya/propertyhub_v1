import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface UnitFilters {
  status?: string;
  type?: string;
  propertyId?: string;
}

export const getUnits = async (filters?: UnitFilters) => {
  return apiClient.get<any[]>(API_ENDPOINTS.UNITS.LIST, filters as any);
};

export const getUnitsByProperty = async (propertyId: string, filters?: Omit<UnitFilters, 'propertyId'>) => {
  return apiClient.get<any[]>(`${API_ENDPOINTS.UNITS.LIST}/property/${propertyId}`, filters as any);
};

export const getUnit = async (id: string) => {
  return apiClient.get<any>(API_ENDPOINTS.UNITS.GET(id));
};

export const createUnit = async (data: any) => {
  return apiClient.post<any>(API_ENDPOINTS.UNITS.CREATE, data);
};

export const updateUnit = async (id: string, data: any) => {
  return apiClient.put<any>(API_ENDPOINTS.UNITS.UPDATE(id), data);
};

export const deleteUnit = async (id: string) => {
  return apiClient.delete<any>(API_ENDPOINTS.UNITS.DELETE(id));
};






