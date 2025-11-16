/**
 * Automatic Project Progress Calculator
 * 
 * Calculates project progress based on multiple factors:
 * 1. Milestones completion (40% weight)
 * 2. Budget spend vs planned (30% weight)
 * 3. Time elapsed vs total duration (20% weight)
 * 4. Project stage (10% weight)
 */

import prisma from '../lib/db';

// Stage base progress mapping
const STAGE_PROGRESS_MAP: Record<string, number> = {
  planning: 10,
  design: 30,
  'pre-construction': 50,
  construction: 75,
  completion: 95,
};

interface ProgressCalculationResult {
  overallProgress: number;
  breakdown: {
    milestonesProgress: number;
    budgetProgress: number;
    timeProgress: number;
    stageProgress: number;
  };
  weights: {
    milestones: number;
    budget: number;
    time: number;
    stage: number;
  };
}

/**
 * Calculate overall project progress automatically
 */
export async function calculateProjectProgress(
  projectId: string
): Promise<ProgressCalculationResult> {
  // Fetch project data
  const project = await prisma.developer_projects.findUnique({
    where: { id: projectId },
    include: {
      project_milestones: true,
      budget_line_items: true,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // 1. Calculate Milestones Progress (40% weight)
  const milestonesProgress = calculateMilestonesProgress(
    project.project_milestones
  );

  // 2. Calculate Budget Progress (30% weight)
  const budgetProgress = calculateBudgetProgress(
    project.totalBudget,
    project.actualSpend,
    project.budget_line_items
  );

  // 3. Calculate Time Progress (20% weight)
  const timeProgress = calculateTimeProgress(
    project.startDate,
    project.estimatedEndDate
  );

  // 4. Get Stage Progress (10% weight)
  const stageProgress = getStageProgress(project.stage);

  // Define weights
  const weights = {
    milestones: 0.4,
    budget: 0.3,
    time: 0.2,
    stage: 0.1,
  };

  // Calculate weighted overall progress
  const overallProgress = Math.round(
    milestonesProgress * weights.milestones +
    budgetProgress * weights.budget +
    timeProgress * weights.time +
    stageProgress * weights.stage
  );

  // Cap at 100%
  const cappedProgress = Math.min(100, Math.max(0, overallProgress));

  return {
    overallProgress: cappedProgress,
    breakdown: {
      milestonesProgress,
      budgetProgress,
      timeProgress,
      stageProgress,
    },
    weights,
  };
}

/**
 * Calculate progress based on milestones
 */
function calculateMilestonesProgress(milestones: any[]): number {
  if (!milestones || milestones.length === 0) {
    return 0; // No milestones defined yet
  }

  // Calculate average progress of all milestones
  const totalProgress = milestones.reduce((sum, milestone) => {
    if (milestone.status === 'completed') {
      return sum + 100;
    } else if (milestone.status === 'in-progress') {
      return sum + (milestone.progress || 50); // Use milestone's own progress or default to 50%
    } else {
      return sum + 0; // pending or delayed
    }
  }, 0);

  return Math.round(totalProgress / milestones.length);
}

/**
 * Calculate progress based on budget spend
 */
function calculateBudgetProgress(
  totalBudget: number,
  actualSpend: number,
  budgetLineItems: any[]
): number {
  if (totalBudget === 0) {
    return 0; // No budget defined
  }

  // Method 1: Use budget line items completion if available
  if (budgetLineItems && budgetLineItems.length > 0) {
    const completedItems = budgetLineItems.filter(
      (item) => item.status === 'completed'
    ).length;
    const totalItems = budgetLineItems.length;
    
    if (totalItems > 0) {
      return Math.round((completedItems / totalItems) * 100);
    }
  }

  // Method 2: Fallback to spend percentage (capped at 90% to avoid over-reporting)
  const spendPercent = (actualSpend / totalBudget) * 100;
  return Math.min(90, Math.round(spendPercent));
}

/**
 * Calculate progress based on time elapsed
 */
function calculateTimeProgress(
  startDate: Date | null,
  estimatedEndDate: Date | null
): number {
  if (!startDate || !estimatedEndDate) {
    return 0; // No dates defined
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(estimatedEndDate);

  // If project hasn't started yet
  if (now < start) {
    return 0;
  }

  // If project is past end date
  if (now > end) {
    return 100;
  }

  // Calculate percentage of time elapsed
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const timePercent = (elapsed / totalDuration) * 100;

  return Math.round(timePercent);
}

/**
 * Get base progress from project stage
 */
function getStageProgress(stage: string): number {
  const normalizedStage = stage.toLowerCase().replace(/_/g, '-');
  return STAGE_PROGRESS_MAP[normalizedStage] || 0;
}

/**
 * Update project progress in database
 */
export async function updateProjectProgress(projectId: string): Promise<number> {
  const result = await calculateProjectProgress(projectId);
  
  await prisma.developer_projects.update({
    where: { id: projectId },
    data: { progress: result.overallProgress },
  });

  return result.overallProgress;
}

/**
 * Batch update progress for multiple projects
 */
export async function updateAllProjectsProgress(customerId?: string): Promise<void> {
  const whereClause = customerId ? { customerId } : {};
  
  const projects = await prisma.developer_projects.findMany({
    where: {
      ...whereClause,
      status: { in: ['active', 'on-hold'] }, // Don't update completed/cancelled projects
    },
    select: { id: true },
  });

  // Update each project's progress
  for (const project of projects) {
    try {
      await updateProjectProgress(project.id);
    } catch (error) {
      console.error(`Failed to update progress for project ${project.id}:`, error);
    }
  }
}

/**
 * Get detailed progress breakdown for display
 */
export async function getProjectProgressBreakdown(
  projectId: string
): Promise<ProgressCalculationResult> {
  return await calculateProjectProgress(projectId);
}

