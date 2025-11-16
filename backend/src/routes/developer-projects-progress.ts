/**
 * Project Progress API Routes
 * Endpoints for automatic progress calculation and updates
 */

import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  calculateProjectProgress,
  updateProjectProgress,
  updateAllProjectsProgress,
  getProjectProgressBreakdown,
} from '../utils/projectProgressCalculator';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/projects/:projectId/progress
 * Get calculated progress for a project (without updating database)
 */
router.get('/:projectId/progress', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const progressData = await calculateProjectProgress(projectId);

    res.json({
      projectId,
      ...progressData,
    });
  } catch (error: any) {
    console.error('Get project progress error:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate progress' });
  }
});

/**
 * POST /api/projects/:projectId/progress/update
 * Calculate and update project progress in database
 */
router.post('/:projectId/progress/update', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const newProgress = await updateProjectProgress(projectId);

    res.json({
      projectId,
      progress: newProgress,
      message: 'Progress updated successfully',
    });
  } catch (error: any) {
    console.error('Update project progress error:', error);
    res.status(500).json({ error: error.message || 'Failed to update progress' });
  }
});

/**
 * POST /api/projects/progress/update-all
 * Update progress for all active projects (for current customer)
 */
router.post('/progress/update-all', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }

    await updateAllProjectsProgress(customerId);

    res.json({
      message: 'All project progress updated successfully',
    });
  } catch (error: any) {
    console.error('Update all projects progress error:', error);
    res.status(500).json({ error: error.message || 'Failed to update progress' });
  }
});

/**
 * GET /api/projects/:projectId/progress/breakdown
 * Get detailed progress breakdown showing all factors
 */
router.get('/:projectId/progress/breakdown', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const breakdown = await getProjectProgressBreakdown(projectId);

    res.json({
      projectId,
      ...breakdown,
      explanation: {
        milestones: `${breakdown.weights.milestones * 100}% weight - Based on milestone completion`,
        budget: `${breakdown.weights.budget * 100}% weight - Based on budget line items or spend`,
        time: `${breakdown.weights.time * 100}% weight - Based on time elapsed`,
        stage: `${breakdown.weights.stage * 100}% weight - Based on project stage`,
      },
    });
  } catch (error: any) {
    console.error('Get progress breakdown error:', error);
    res.status(500).json({ error: error.message || 'Failed to get progress breakdown' });
  }
});

export default router;

