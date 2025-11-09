import { apiClient } from '../api-client';

export interface OnboardingApplication {
  id: string;
  applicationType: 'property-owner' | 'property-manager' | 'tenant';
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  businessType?: string | null;
  numberOfProperties?: number | null;
  totalUnits?: number | null;
  website?: string | null;
  taxId?: string | null;
  managementCompany?: string | null;
  yearsOfExperience?: number | null;
  licenseNumber?: string | null;
  propertiesManaged?: number | null;
  currentlyRenting?: string | null;
  moveInDate?: string | null;
  employmentStatus?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  status: string;
  reviewStatus?: string | null;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  activatedBy?: string | null;
  activatedAt?: string | null;
  selectedPlanId?: string | null;
  selectedBillingCycle?: string | null;
  customerId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  referralSource?: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  } | null;
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
  activator?: {
    id: string;
    name: string;
    email: string;
  } | null;
  customer?: {
    id: string;
    company: string;
    email: string;
    status: string;
  } | null;
  plan?: {
    id: string;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
  } | null;
  timeline?: Array<{
    action: string;
    timestamp: string;
    actor: string;
    details?: string;
  }>;
}

export interface ApplicationStats {
  pending: number;
  under_review: number;
  info_requested: number;
  approved: number;
  rejected: number;
  activated: number;
  total: number;
}

export interface PaginatedApplications {
  applications: OnboardingApplication[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: ApplicationStats;
}

export interface ApplicationFilters {
  status?: string;
  applicationType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * Get list of applications with filters
 */
export async function getOnboardingApplications(
  filters: ApplicationFilters = {}
): Promise<PaginatedApplications> {
  try {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.applicationType) params.append('applicationType', filters.applicationType);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/api/admin/onboarding/applications?${params.toString()}`);
    if (response.error) {
      throw new Error(response.error.message || response.error.error || 'Failed to fetch applications');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('[Admin Onboarding API] List applications error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch applications');
  }
}

/**
 * Get single application by ID
 */
export async function getOnboardingApplicationById(
  id: string
): Promise<OnboardingApplication> {
  try {
    const response = await apiClient.get(`/api/admin/onboarding/applications/${id}`);
    if (response.error) {
      throw new Error(response.error.message || response.error.error || 'Failed to fetch application');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('[Admin Onboarding API] Get application error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch application');
  }
}

/**
 * Update review status
 */
export async function updateApplicationReview(
  id: string,
  data: {
    reviewStatus?: string;
    reviewNotes?: string;
    adminId?: string;
  }
): Promise<OnboardingApplication> {
  try {
    const response = await apiClient.put(`/api/admin/onboarding/applications/${id}/review`, data);
    if (response.error) {
      throw new Error(response.error.message || response.error.error || 'Failed to update review');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('[Admin Onboarding API] Update review error:', error);
    throw new Error(error.response?.data?.error || 'Failed to update review');
  }
}

/**
 * Approve application
 */
export async function approveApplication(
  id: string,
  data: {
    planId?: string;
    billingCycle?: 'monthly' | 'annual';
    trialDays?: number;
    notes?: string;
    adminId?: string;
  }
): Promise<{ customerId: string }> {
  try {
    const response = await apiClient.post(`/api/admin/onboarding/applications/${id}/approve`, data);
    if (response.error) {
      throw new Error(response.error.message || response.error.error || 'Failed to approve application');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('[Admin Onboarding API] Approve application error:', error);
    throw new Error(error.response?.data?.error || 'Failed to approve application');
  }
}

/**
 * Activate application
 */
export async function activateApplication(
  id: string,
  adminId?: string
): Promise<{ temporaryPassword: string }> {
  try {
    const response = await apiClient.post(`/api/admin/onboarding/applications/${id}/activate`, {
      adminId,
    });
    if (response.error) {
      throw new Error(response.error.message || response.error.error || 'Failed to activate application');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('[Admin Onboarding API] Activate application error:', error);
    throw new Error(error.response?.data?.error || 'Failed to activate application');
  }
}

/**
 * Reject application
 */
export async function rejectApplication(
  id: string,
  data: {
    reason: string;
    message?: string;
    adminId?: string;
  }
): Promise<OnboardingApplication> {
  try {
    const response = await apiClient.post(`/api/admin/onboarding/applications/${id}/reject`, data);
    if (response.error) {
      throw new Error(response.error.message || response.error.error || 'Failed to reject application');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('[Admin Onboarding API] Reject application error:', error);
    throw new Error(error.response?.data?.error || 'Failed to reject application');
  }
}

/**
 * Request additional information
 */
export async function requestApplicationInfo(
  id: string,
  data: {
    requestedInfo: string[];
    message: string;
    adminId?: string;
  }
): Promise<OnboardingApplication> {
  try {
    const response = await apiClient.post(`/api/admin/onboarding/applications/${id}/request-info`, data);
    if (response.error) {
      throw new Error(response.error.message || response.error.error || 'Failed to request information');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('[Admin Onboarding API] Request info error:', error);
    throw new Error(error.response?.data?.error || 'Failed to request information');
  }
}

/**
 * Get application statistics
 */
export async function getOnboardingStats(): Promise<ApplicationStats> {
  try {
    const response = await apiClient.get('/api/admin/onboarding/stats');
    if (response.error) {
      throw new Error(response.error.message || response.error.error || 'Failed to fetch statistics');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('[Admin Onboarding API] Get stats error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch statistics');
  }
}

/**
 * Delete application
 */
export async function deleteOnboardingApplication(id: string): Promise<{ success: boolean }> {
  try {
    const response = await apiClient.delete(`/api/admin/onboarding/applications/${id}`);
    if (response.error) {
      throw new Error(response.error.message || response.error.error || 'Failed to delete application');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('[Admin Onboarding API] Delete application error:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete application');
  }
}

