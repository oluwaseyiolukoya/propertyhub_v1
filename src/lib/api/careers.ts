/**
 * Careers API
 * API client for career postings management
 */

import { apiClient } from "../api-client";
import { API_BASE_URL } from "../api-config";

export interface CareerPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  remote: string;
  experience: string;
  description: string;
  requirements: string[];
  salary?: string;
  status: string;
  postedBy?: string;
  postedAt: string;
  expiresAt?: string;
  viewCount: number;
  applicationCount: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CareerPostingFilters {
  status?: string;
  department?: string;
  location?: string;
  type?: string;
  remote?: string;
  experience?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateCareerPosting {
  title: string;
  department: string;
  location: string;
  type: string;
  remote: string;
  experience: string;
  description: string;
  requirements: string[];
  salary?: string;
  status?: "active" | "draft" | "closed" | "archived";
  expiresAt?: string;
  metadata?: any;
}

export interface UpdateCareerPosting {
  title?: string;
  department?: string;
  location?: string;
  type?: string;
  remote?: string;
  experience?: string;
  description?: string;
  requirements?: string[];
  salary?: string;
  status?: "active" | "draft" | "closed" | "archived";
  expiresAt?: string;
  metadata?: any;
}

/**
 * Get public career postings
 */
export const getPublicCareerPostings = async (
  filters?: CareerPostingFilters
) => {
  return apiClient.get<{
    postings: CareerPosting[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>("/api/careers", filters);
};

/**
 * Get available filter options for public
 */
export const getCareerFilterOptions = async () => {
  return apiClient.get<{
    departments: string[];
    locations: string[];
    types: string[];
    remoteOptions: string[];
    experienceLevels: string[];
  }>("/api/careers/filters");
};

/**
 * Get a single career posting (public)
 */
export const getCareerPostingById = async (id: string) => {
  return apiClient.get<CareerPosting>(`/api/careers/${id}`);
};

/**
 * ADMIN: Get all career postings
 */
export const getAllCareerPostings = async (filters?: CareerPostingFilters) => {
  return apiClient.get<{
    postings: CareerPosting[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>("/api/admin/careers", filters);
};

/**
 * ADMIN: Get career postings statistics
 */
export const getCareerStatistics = async () => {
  return apiClient.get<{
    total: number;
    active: number;
    draft: number;
    closed: number;
    archived: number;
    totalViews: number;
    totalApplications: number;
  }>("/api/admin/careers/stats");
};

/**
 * ADMIN: Get a single career posting
 */
export const getAdminCareerPostingById = async (id: string) => {
  return apiClient.get<CareerPosting>(`/api/admin/careers/${id}`);
};

/**
 * ADMIN: Create a new career posting
 */
export const createCareerPosting = async (data: CreateCareerPosting) => {
  return apiClient.post<CareerPosting>("/api/admin/careers", data);
};

/**
 * ADMIN: Update a career posting
 */
export const updateCareerPosting = async (
  id: string,
  data: UpdateCareerPosting
) => {
  return apiClient.put<CareerPosting>(`/api/admin/careers/${id}`, data);
};

/**
 * ADMIN: Delete a career posting (soft delete)
 */
export const deleteCareerPosting = async (id: string) => {
  return apiClient.delete<CareerPosting>(`/api/admin/careers/${id}`);
};

/**
 * ADMIN: Permanently delete a career posting
 */
export const permanentDeleteCareerPosting = async (id: string) => {
  return apiClient.delete<CareerPosting>(`/api/admin/careers/${id}/permanent`);
};

