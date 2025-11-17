/**
 * Developer Dashboard Reports API
 * Fetches real-time data for reports and analytics
 */

import { apiClient } from '../api-client';

export interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface CostBreakdownData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface VendorPerformanceData {
  vendor: string;
  vendorId: string;
  onTime: number;
  quality: number;
  cost: number;
  totalOrders: number;
  totalSpent: number;
}

export interface PhaseSpendData {
  phase: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export interface ReportSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  overdueExpenses: number;
}

export interface ReportsData {
  summary: ReportSummary;
  cashFlow: CashFlowData[];
  costBreakdown: CostBreakdownData[];
  vendorPerformance: VendorPerformanceData[];
  phaseSpend: PhaseSpendData[];
  currency?: string; // Project currency (NGN, USD, etc.)
  projectName?: string; // Project name for reference
}

/**
 * Get comprehensive reports data for a project
 */
export const getProjectReports = async (projectId: string, period: string = 'last-6-months'): Promise<ReportsData> => {
  const response = await apiClient.get(`/api/developer-dashboard/projects/${projectId}/reports`, {
    period
  });

  if (response.error) {
    throw new Error(response.error.message || 'Failed to fetch reports data');
  }

  return response.data as ReportsData;
};

/**
 * Get cash flow data for a project
 */
export const getCashFlowData = async (projectId: string, period: string = 'last-6-months'): Promise<CashFlowData[]> => {
  const response = await apiClient.get(`/api/developer-dashboard/projects/${projectId}/reports/cashflow`, {
    period
  });

  if (response.error) {
    throw new Error(response.error.message || 'Failed to fetch cash flow data');
  }

  return response.data as CashFlowData[];
};

/**
 * Get cost breakdown by category
 */
export const getCostBreakdown = async (projectId: string): Promise<CostBreakdownData[]> => {
  const response = await apiClient.get(`/api/developer-dashboard/projects/${projectId}/reports/cost-breakdown`);

  if (response.error) {
    throw new Error(response.error.message || 'Failed to fetch cost breakdown');
  }

  return response.data as CostBreakdownData[];
};

/**
 * Get vendor performance metrics
 */
export const getVendorPerformance = async (projectId: string): Promise<VendorPerformanceData[]> => {
  const response = await apiClient.get(`/api/developer-dashboard/projects/${projectId}/reports/vendor-performance`);

  if (response.error) {
    throw new Error(response.error.message || 'Failed to fetch vendor performance');
  }

  return response.data as VendorPerformanceData[];
};

/**
 * Get phase spending data
 */
export const getPhaseSpending = async (projectId: string): Promise<PhaseSpendData[]> => {
  const response = await apiClient.get(`/api/developer-dashboard/projects/${projectId}/reports/phase-spending`);

  if (response.error) {
    throw new Error(response.error.message || 'Failed to fetch phase spending');
  }

  return response.data as PhaseSpendData[];
};

/**
 * Generate and download report PDF
 */
export const downloadReportPDF = async (projectId: string, reportType: string): Promise<Blob> => {
  const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/developer-dashboard/projects/${projectId}/reports/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ reportType })
  });

  if (!response.ok) {
    throw new Error('Failed to download report');
  }

  return await response.blob();
};

/**
 * Schedule email report
 */
export const scheduleEmailReport = async (
  projectId: string,
  reportType: string,
  recipients: string[],
  frequency: string
): Promise<void> => {
  const response = await apiClient.post(`/api/developer-dashboard/projects/${projectId}/reports/schedule-email`, {
    reportType,
    recipients,
    frequency
  });

  if (response.error) {
    throw new Error(response.error.message || 'Failed to schedule email report');
  }
};

