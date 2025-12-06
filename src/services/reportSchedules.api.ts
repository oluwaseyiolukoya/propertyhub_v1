/**
 * Report Schedules API Service
 *
 * Handles all API calls related to scheduled reports
 */

import apiClient from "../lib/api-client";

export interface ReportFilters {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

export interface ReportSchedule {
  id: string;
  customerId: string;
  userId: string;
  name: string;
  reportType: "financial" | "occupancy" | "maintenance" | "tenant" | "all";
  propertyId?: string | null;
  frequency: "weekly" | "monthly";
  dayOfWeek?: string | null;
  dayOfMonth?: number | null;
  time: string;
  email: string;
  status: "active" | "paused";
  filters?: ReportFilters | null;
  lastRun?: string | null;
  nextRun: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleRequest {
  name: string;
  reportType: "financial" | "occupancy" | "maintenance" | "tenant" | "all";
  propertyId?: string;
  frequency: "weekly" | "monthly";
  dayOfWeek?: string;
  dayOfMonth?: number;
  time: string;
  email: string;
  filters?: ReportFilters;
}

export interface UpdateScheduleRequest {
  name?: string;
  frequency?: "weekly" | "monthly";
  dayOfWeek?: string;
  dayOfMonth?: number;
  time?: string;
  email?: string;
  status?: "active" | "paused";
  filters?: ReportFilters;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Get all report schedules for the authenticated user
 */
export const getReportSchedules = async (): Promise<
  ApiResponse<ReportSchedule[]>
> => {
  try {
    const response = await apiClient.get("/api/report-schedules");
    return { success: true, data: response.data.data || [] };
  } catch (error: any) {
    console.error("Failed to fetch report schedules:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to fetch report schedules",
    };
  }
};

/**
 * Get a specific report schedule by ID
 */
export const getReportSchedule = async (
  id: string
): Promise<ApiResponse<ReportSchedule>> => {
  try {
    const response = await apiClient.get(`/api/report-schedules/${id}`);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    console.error("Failed to fetch report schedule:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to fetch report schedule",
    };
  }
};

/**
 * Create a new report schedule
 */
export const createReportSchedule = async (
  schedule: CreateScheduleRequest
): Promise<ApiResponse<ReportSchedule>> => {
  try {
    const response = await apiClient.post("/api/report-schedules", schedule);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    console.error("Failed to create report schedule:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to create report schedule",
    };
  }
};

/**
 * Update an existing report schedule
 */
export const updateReportSchedule = async (
  id: string,
  updates: UpdateScheduleRequest
): Promise<ApiResponse<ReportSchedule>> => {
  try {
    const response = await apiClient.patch(
      `/api/report-schedules/${id}`,
      updates
    );
    return { success: true, data: response.data.data };
  } catch (error: any) {
    console.error("Failed to update report schedule:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to update report schedule",
    };
  }
};

/**
 * Delete a report schedule
 */
export const deleteReportSchedule = async (
  id: string
): Promise<ApiResponse> => {
  try {
    const response = await apiClient.delete(`/api/report-schedules/${id}`);
    return { success: true, message: response.data.message };
  } catch (error: any) {
    console.error("Failed to delete report schedule:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to delete report schedule",
    };
  }
};

/**
 * Send a scheduled report immediately (test email)
 */
export const sendScheduledReport = async (
  id: string
): Promise<ApiResponse<{ emailSent: boolean }>> => {
  try {
    const response = await apiClient.post(`/api/report-schedules/${id}/send`);

    // Check if response has an error
    if (response.error) {
      console.error("Failed to send scheduled report:", response.error);
      return {
        success: false,
        error:
          response.error.message ||
          response.error.error ||
          "Failed to send scheduled report",
      };
    }

    return {
      success: true,
      data: { emailSent: response.data?.emailSent || false },
      message: response.data?.message,
    };
  } catch (error: any) {
    console.error("Failed to send scheduled report:", error);
    return {
      success: false,
      error: error.message || "Failed to send scheduled report",
    };
  }
};

/**
 * Toggle schedule status (active/paused)
 */
export const toggleScheduleStatus = async (
  id: string,
  status: "active" | "paused"
): Promise<ApiResponse<ReportSchedule>> => {
  return updateReportSchedule(id, { status });
};
