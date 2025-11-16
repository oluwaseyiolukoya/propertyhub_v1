/**
 * Project Stages Service
 * Handles API calls for project stages management
 */

import { apiClient } from '../../../lib/api-client';

export interface ProjectStage {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  order: number;
  weight: number;
  isCompleted: boolean;
  completedAt?: Date | null;
  completedBy?: string | null;
  isOptional: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StageProgressResult {
  overallProgress: number;
  totalStages: number;
  completedStages: number;
  stages: ProjectStage[];
}

export interface StageTemplate {
  id: string;
  name: string;
  projectType: string;
  stageCount: number;
  stages: Array<{
    name: string;
    description?: string;
    order: number;
    weight: number;
    isOptional?: boolean;
  }>;
}

/**
 * Get all stages for a project with progress
 */
export async function getProjectStages(
  projectId: string
): Promise<StageProgressResult> {
  const response = await apiClient.get(
    `/api/developer-dashboard/projects/${projectId}/stages`
  );
  if (response.error) {
    throw new Error(response.error.message || response.error.error);
  }
  return response.data!;
}

/**
 * Create a new stage
 */
export async function createProjectStage(
  projectId: string,
  data: {
    name: string;
    description?: string;
    order: number;
    weight?: number;
    isOptional?: boolean;
  }
): Promise<{ stage: ProjectStage; projectProgress: number }> {
  const response = await apiClient.post(
    `/api/developer-dashboard/projects/${projectId}/stages`,
    data
  );
  if (response.error) {
    throw new Error(response.error.message || response.error.error);
  }
  return response.data!;
}

/**
 * Update a stage
 */
export async function updateProjectStage(
  projectId: string,
  stageId: string,
  data: {
    name?: string;
    description?: string;
    order?: number;
    weight?: number;
    isOptional?: boolean;
  }
): Promise<{ stage: ProjectStage; projectProgress: number }> {
  const response = await apiClient.put(
    `/api/developer-dashboard/projects/${projectId}/stages/${stageId}`,
    data
  );
  if (response.error) {
    throw new Error(response.error.message || response.error.error);
  }
  return response.data!;
}

/**
 * Delete a stage
 */
export async function deleteProjectStage(
  projectId: string,
  stageId: string
): Promise<{ message: string; projectProgress: number }> {
  const response = await apiClient.delete(
    `/api/developer-dashboard/projects/${projectId}/stages/${stageId}`
  );
  if (response.error) {
    throw new Error(response.error.message || response.error.error);
  }
  return response.data!;
}

/**
 * Mark a stage as completed
 */
export async function markStageCompleted(
  projectId: string,
  stageId: string,
  userId: string
): Promise<{
  stage: ProjectStage;
  projectProgress: number;
  completedStages: number;
  totalStages: number;
}> {
  const response = await apiClient.post(
    `/api/developer-dashboard/projects/${projectId}/stages/${stageId}/complete`,
    { userId }
  );
  if (response.error) {
    throw new Error(response.error.message || response.error.error);
  }
  return response.data!;
}

/**
 * Mark a stage as incomplete
 */
export async function markStageIncomplete(
  projectId: string,
  stageId: string
): Promise<{
  stage: ProjectStage;
  projectProgress: number;
  completedStages: number;
  totalStages: number;
}> {
  const response = await apiClient.post(
    `/api/developer-dashboard/projects/${projectId}/stages/${stageId}/incomplete`
  );
  if (response.error) {
    throw new Error(response.error.message || response.error.error);
  }
  return response.data!;
}

/**
 * Initialize stages from a template
 */
export async function initializeStagesFromTemplate(
  projectId: string,
  templateType?: string
): Promise<StageProgressResult> {
  const response = await apiClient.post(
    `/api/developer-dashboard/projects/${projectId}/stages/initialize`,
    { templateType }
  );
  if (response.error) {
    throw new Error(response.error.message || response.error.error);
  }
  return response.data!;
}

/**
 * Get available stage templates
 */
export async function getStageTemplates(): Promise<{
  templates: StageTemplate[];
}> {
  const response = await apiClient.get(
    '/api/developer-dashboard/projects/stage-templates'
  );
  if (response.error) {
    throw new Error(response.error.message || response.error.error);
  }
  return response.data!;
}

/**
 * Reorder stages
 */
export async function reorderStages(
  projectId: string,
  stageOrders: Array<{ stageId: string; order: number }>
): Promise<StageProgressResult> {
  const response = await apiClient.post(
    `/api/developer-dashboard/projects/${projectId}/stages/reorder`,
    { stageOrders }
  );
  if (response.error) {
    throw new Error(response.error.message || response.error.error);
  }
  return response.data!;
}

