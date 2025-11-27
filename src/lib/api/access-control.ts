import { apiClient, ApiResponse } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface PropertyKey {
  id: string;
  customerId: string;
  propertyId: string;
  unitId?: string | null;
  keyNumber: string;
  keyLabel?: string | null;
  keyType: string;
  status: string;
  numberOfCopies: number;
  location?: string | null;
  notes?: string | null;
  issuedToName?: string | null;
  issuedToType?: string | null;
  issuedDate?: string | null;
  expectedReturnDate?: string | null;
  returnedDate?: string | null;
  depositAmount?: number | null;
  depositCurrency?: string | null;
  depositRefunded: boolean;
  depositNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  properties?: {
    id: string;
    name: string;
    currency: string;
  };
  units?: {
    id: string;
    unitNumber: string;
  } | null;
}

export interface PropertyKeyTransaction {
  id: string;
  keyId: string;
  customerId: string;
  action: string;
  performedById?: string | null;
  performedByName?: string | null;
  performedForUserId?: string | null;
  performedForName?: string | null;
  personType?: string | null;
  witnessName?: string | null;
  witnessSignature?: string | null;
  depositAmount?: number | null;
  notes?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  key?: {
    id: string;
    keyNumber: string;
    keyType: string;
    properties?: {
      id: string;
      name: string;
    };
    units?: {
      id: string;
      unitNumber: string;
    } | null;
  };
}

export interface KeyStats {
  totalKeys: number;
  issuedKeys: number;
  availableKeys: number;
  lostKeys: number;
  depositHeld: number;
  byType: Array<{ keyType: string; count: number }>;
}

export interface FetchKeysParams {
  propertyId?: string;
  status?: string;
  type?: string;
  search?: string;
}

export interface FetchTransactionsParams {
  search?: string;
  action?: string;
  limit?: number;
}

export const getPropertyKeys = (params?: FetchKeysParams): Promise<ApiResponse<PropertyKey[]>> => {
  return apiClient.get<PropertyKey[]>(API_ENDPOINTS.ACCESS_CONTROL.KEYS, params);
};

export const createPropertyKey = (payload: Partial<PropertyKey>): Promise<ApiResponse<PropertyKey>> => {
  return apiClient.post<PropertyKey>(API_ENDPOINTS.ACCESS_CONTROL.KEYS, payload);
};

export const updatePropertyKey = (id: string, payload: Partial<PropertyKey>): Promise<ApiResponse<PropertyKey>> => {
  return apiClient.put<PropertyKey>(API_ENDPOINTS.ACCESS_CONTROL.KEY(id), payload);
};

export const issuePropertyKey = (
  keyId: string,
  payload: {
    issuedTo: string;
    issuedToType: string;
    expectedReturnDate?: string;
    depositAmount?: number;
    witnessName?: string;
    notes?: string;
  }
): Promise<ApiResponse<PropertyKey>> => {
  return apiClient.post<PropertyKey>(API_ENDPOINTS.ACCESS_CONTROL.ISSUE(keyId), payload);
};

export const returnPropertyKey = (
  keyId: string,
  payload: {
    condition?: string;
    refundDeposit?: boolean;
    witnessName?: string;
    refundAmount?: number;
    notes?: string;
  }
): Promise<ApiResponse<PropertyKey>> => {
  return apiClient.post<PropertyKey>(API_ENDPOINTS.ACCESS_CONTROL.RETURN(keyId), payload);
};

export const reportLostPropertyKey = (
  keyId: string,
  payload: {
    reportedBy: string;
    lostDate: string;
    circumstances?: string;
    policeReportNumber?: string;
    replaceLock?: boolean;
  }
): Promise<ApiResponse<PropertyKey>> => {
  return apiClient.post<PropertyKey>(API_ENDPOINTS.ACCESS_CONTROL.REPORT_LOST(keyId), payload);
};

export const getPropertyKeyTransactions = (
  params?: FetchTransactionsParams
): Promise<ApiResponse<PropertyKeyTransaction[]>> => {
  return apiClient.get<PropertyKeyTransaction[]>(API_ENDPOINTS.ACCESS_CONTROL.TRANSACTIONS, params);
};

export const getPropertyKeyStats = (params?: { propertyId?: string }): Promise<ApiResponse<KeyStats>> => {
  return apiClient.get<KeyStats>(API_ENDPOINTS.ACCESS_CONTROL.STATS, params);
};


