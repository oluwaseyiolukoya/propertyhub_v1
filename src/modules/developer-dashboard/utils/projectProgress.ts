/**
 * Calculate project progress based on lifecycle stage
 *
 * Stage progression:
 * - planning: 0-20%
 * - design: 20-40%
 * - pre-construction: 40-60%
 * - construction: 60-90%
 * - completion: 90-100%
 */

export const STAGE_PROGRESS_MAP: Record<string, number> = {
  planning: 10,
  design: 30,
  'pre-construction': 50,
  construction: 75,
  completion: 95,
};

/**
 * Get progress percentage for a given stage
 */
export function getProgressFromStage(stage: string): number {
  const normalizedStage = stage.toLowerCase().replace(/_/g, '-');
  return STAGE_PROGRESS_MAP[normalizedStage] || 0;
}

/**
 * Get stage from progress percentage (reverse mapping)
 */
export function getStageFromProgress(progress: number): string {
  if (progress >= 95) return 'completion';
  if (progress >= 75) return 'construction';
  if (progress >= 50) return 'pre-construction';
  if (progress >= 30) return 'design';
  return 'planning';
}

/**
 * Validate if progress matches the stage
 */
export function isProgressValidForStage(progress: number, stage: string): boolean {
  const stageProgress = getProgressFromStage(stage);
  const tolerance = 20; // Allow 20% tolerance
  return Math.abs(progress - stageProgress) <= tolerance;
}

