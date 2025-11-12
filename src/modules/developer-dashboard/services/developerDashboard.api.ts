import { apiClient } from '../../../lib/api-client';
import type {
  DeveloperProject,
  PortfolioOverview,
  ProjectDashboardData,
  BudgetLineItem,
  ProjectInvoice,
  ProjectVendor,
  ProjectForecast,
  ProjectMilestone,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateBudgetLineItemRequest,
  UpdateBudgetLineItemRequest,
  CreateInvoiceRequest,
  CreateVendorRequest,
  ProjectFilters,
  ProjectSortOptions,
  PaginatedResponse,
  ApiResponse,
} from '../types';

const BASE_URL = '/api/developer-dashboard';

// ============================================
// Portfolio & Overview APIs
// ============================================

export const getPortfolioOverview = async (): Promise<ApiResponse<PortfolioOverview>> => {
  try {
    const response = await apiClient.get(`${BASE_URL}/portfolio/overview`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch portfolio overview',
    };
  }
};

export const getProjects = async (
  filters?: ProjectFilters,
  sort?: ProjectSortOptions,
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<PaginatedResponse<DeveloperProject>>> => {
  try {
    const params = {
      ...filters,
      sortField: sort?.field,
      sortOrder: sort?.order,
      page,
      limit,
    };
    const response = await apiClient.get(`${BASE_URL}/projects`, { params });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch projects',
    };
  }
};

// ============================================
// Project Management APIs
// ============================================

export const getProjectById = async (projectId: string): Promise<ApiResponse<DeveloperProject>> => {
  try {
    const response = await apiClient.get(`${BASE_URL}/projects/${projectId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch project',
    };
  }
};

export const getProjectDashboard = async (
  projectId: string
): Promise<ApiResponse<ProjectDashboardData>> => {
  try {
    const response = await apiClient.get(`${BASE_URL}/projects/${projectId}/dashboard`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch project dashboard',
    };
  }
};

export const createProject = async (
  data: CreateProjectRequest
): Promise<ApiResponse<DeveloperProject>> => {
  try {
    const response = await apiClient.post(`${BASE_URL}/projects`, data);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create project',
    };
  }
};

export const updateProject = async (
  projectId: string,
  data: UpdateProjectRequest
): Promise<ApiResponse<DeveloperProject>> => {
  try {
    const response = await apiClient.patch(`${BASE_URL}/projects/${projectId}`, data);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update project',
    };
  }
};

export const deleteProject = async (projectId: string): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete(`${BASE_URL}/projects/${projectId}`);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete project',
    };
  }
};

// ============================================
// Budget Management APIs
// ============================================

export const getBudgetLineItems = async (
  projectId: string
): Promise<ApiResponse<BudgetLineItem[]>> => {
  try {
    const response = await apiClient.get(`${BASE_URL}/projects/${projectId}/budget`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch budget line items',
    };
  }
};

export const createBudgetLineItem = async (
  projectId: string,
  data: CreateBudgetLineItemRequest
): Promise<ApiResponse<BudgetLineItem>> => {
  try {
    const response = await apiClient.post(`${BASE_URL}/projects/${projectId}/budget`, data);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create budget line item',
    };
  }
};

export const updateBudgetLineItem = async (
  projectId: string,
  lineItemId: string,
  data: UpdateBudgetLineItemRequest
): Promise<ApiResponse<BudgetLineItem>> => {
  try {
    const response = await apiClient.patch(
      `${BASE_URL}/projects/${projectId}/budget/${lineItemId}`,
      data
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update budget line item',
    };
  }
};

export const deleteBudgetLineItem = async (
  projectId: string,
  lineItemId: string
): Promise<ApiResponse<void>> => {
  try {
    await apiClient.delete(`${BASE_URL}/projects/${projectId}/budget/${lineItemId}`);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete budget line item',
    };
  }
};

export const importBudgetCSV = async (
  projectId: string,
  file: File
): Promise<ApiResponse<{ imported: number; errors: string[] }>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      `${BASE_URL}/projects/${projectId}/budget/import`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to import budget CSV',
    };
  }
};

export const exportBudgetCSV = async (projectId: string): Promise<ApiResponse<Blob>> => {
  try {
    const response = await apiClient.get(`${BASE_URL}/projects/${projectId}/budget/export`, {
      responseType: 'blob',
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to export budget CSV',
    };
  }
};

// ============================================
// Invoice Management APIs
// ============================================

export const getProjectInvoices = async (
  projectId: string
): Promise<ApiResponse<ProjectInvoice[]>> => {
  try {
    const response = await apiClient.get(`${BASE_URL}/projects/${projectId}/invoices`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch invoices',
    };
  }
};

export const createInvoice = async (
  projectId: string,
  data: CreateInvoiceRequest
): Promise<ApiResponse<ProjectInvoice>> => {
  try {
    const response = await apiClient.post(`${BASE_URL}/projects/${projectId}/invoices`, data);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create invoice',
    };
  }
};

export const updateInvoiceStatus = async (
  projectId: string,
  invoiceId: string,
  status: 'approved' | 'paid' | 'rejected'
): Promise<ApiResponse<ProjectInvoice>> => {
  try {
    const response = await apiClient.patch(
      `${BASE_URL}/projects/${projectId}/invoices/${invoiceId}/status`,
      { status }
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update invoice status',
    };
  }
};

// ============================================
// Vendor Management APIs
// ============================================

export const getVendors = async (): Promise<ApiResponse<ProjectVendor[]>> => {
  try {
    const response = await apiClient.get(`${BASE_URL}/vendors`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch vendors',
    };
  }
};

export const createVendor = async (
  data: CreateVendorRequest
): Promise<ApiResponse<ProjectVendor>> => {
  try {
    const response = await apiClient.post(`${BASE_URL}/vendors`, data);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create vendor',
    };
  }
};

// ============================================
// Forecast & Analytics APIs
// ============================================

export const getProjectForecasts = async (
  projectId: string
): Promise<ApiResponse<ProjectForecast[]>> => {
  try {
    const response = await apiClient.get(`${BASE_URL}/projects/${projectId}/forecasts`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch forecasts',
    };
  }
};

export const getProjectMilestones = async (
  projectId: string
): Promise<ApiResponse<ProjectMilestone[]>> => {
  try {
    const response = await apiClient.get(`${BASE_URL}/projects/${projectId}/milestones`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch milestones',
    };
  }
};

// ============================================
// Reporting APIs
// ============================================

export const generateProjectReport = async (
  projectId: string,
  format: 'pdf' | 'excel' = 'pdf'
): Promise<ApiResponse<Blob>> => {
  try {
    const response = await apiClient.get(`${BASE_URL}/projects/${projectId}/report`, {
      params: { format },
      responseType: 'blob',
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to generate report',
    };
  }
};

export const scheduleReport = async (
  projectId: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  recipients: string[]
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiClient.post(`${BASE_URL}/projects/${projectId}/report/schedule`, {
      frequency,
      recipients,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to schedule report',
    };
  }
};

