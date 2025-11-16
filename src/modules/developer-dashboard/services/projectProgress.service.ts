import { apiClient } from '../../../lib/api-client';

export interface ProgressBreakdown {
  milestonesProgress: number;
  budgetProgress: number;
  timeProgress: number;
  stageProgress: number;
}

export interface ProgressResponse {
  projectId: string;
  overallProgress: number;
  breakdown: ProgressBreakdown;
  weights: {
    milestones: number;
    budget: number;
    time: number;
    stage: number;
  };
}

/**
 * Fetches the calculated progress for a project
 */
export const getProjectProgress = async (projectId: string): Promise<ProgressResponse> => {
  try {
    const response = await apiClient.get(`/api/developer-dashboard/projects/${projectId}/progress`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching project progress:', error);
    throw error;
  }
};

/**
 * Triggers a progress update for a project
 */
export const updateProjectProgress = async (projectId: string): Promise<ProgressResponse> => {
  try {
    const response = await apiClient.post(`/api/developer-dashboard/projects/${projectId}/progress/update`);
    return response.data;
  } catch (error: any) {
    console.error('Error updating project progress:', error);
    throw error;
  }
};

/**
 * Gets detailed progress breakdown for a project
 */
export const getProgressBreakdown = async (projectId: string): Promise<ProgressResponse> => {
  try {
    const response = await apiClient.get(`/api/developer-dashboard/projects/${projectId}/progress/breakdown`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching progress breakdown:', error);
    throw error;
  }
};

/**
 * Updates progress for all projects (admin/developer only)
 */
export const updateAllProjectsProgress = async (): Promise<{ updated: number; failed: number }> => {
  try {
    const response = await apiClient.post('/api/developer-dashboard/projects/progress/update-all');
    return response.data;
  } catch (error: any) {
    console.error('Error updating all projects progress:', error);
    throw error;
  }
};

