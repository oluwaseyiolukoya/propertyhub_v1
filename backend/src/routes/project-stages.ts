/**
 * Project Stages API Routes
 * Handles CRUD operations for project stages and progress calculation
 */

import express from 'express';
import prisma from '../lib/db';
import {
  calculateStageBasedProgress,
  updateProjectProgressFromStages,
  markStageAsCompleted,
  markStageAsIncomplete,
  createStagesFromTemplate,
  INDUSTRY_STANDARD_TEMPLATES,
} from '../utils/stageProgressCalculator';

const router = express.Router();

/**
 * GET /api/projects/stage-templates
 * Get available stage templates
 * IMPORTANT: This route must come BEFORE /:projectId routes to avoid route conflicts
 */
router.get('/stage-templates', async (req, res) => {
  try {
    const templates = Object.entries(INDUSTRY_STANDARD_TEMPLATES).map(
      ([key, value]) => ({
        id: key,
        name: value.name,
        projectType: value.projectType,
        stageCount: value.stages.length,
        stages: value.stages,
      })
    );

    res.json({ templates });
  } catch (error: any) {
    console.error('Error fetching stage templates:', error);
    res.status(500).json({ error: 'Failed to fetch stage templates' });
  }
});

/**
 * GET /api/projects/:projectId/stages
 * Get all stages for a project with progress calculation
 */
router.get('/:projectId/stages', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and user has access
    const project = await prisma.developer_projects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get stages with progress
    const result = await calculateStageBasedProgress(projectId);

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching project stages:', error);
    res.status(500).json({ error: 'Failed to fetch project stages' });
  }
});

/**
 * POST /api/projects/:projectId/stages
 * Create a new stage for a project
 */
router.post('/:projectId/stages', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, order, weight, isOptional } = req.body;

    // Validate required fields
    if (!name || order === undefined) {
      return res.status(400).json({ error: 'Name and order are required' });
    }

    // Verify project exists
    const project = await prisma.developer_projects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Create stage
    const stage = await prisma.project_stages.create({
      data: {
        projectId,
        name,
        description: description || null,
        order,
        weight: weight || 1,
        isOptional: isOptional || false,
      },
    });

    // Update project progress
    const newProgress = await updateProjectProgressFromStages(projectId);

    res.status(201).json({
      stage,
      projectProgress: newProgress,
    });
  } catch (error: any) {
    console.error('Error creating project stage:', error);
    res.status(500).json({ error: 'Failed to create project stage' });
  }
});

/**
 * PUT /api/projects/:projectId/stages/:stageId
 * Update a stage
 */
router.put('/:projectId/stages/:stageId', async (req, res) => {
  try {
    const { stageId } = req.params;
    const { name, description, order, weight, isOptional } = req.body;

    // Update stage
    const stage = await prisma.project_stages.update({
      where: { id: stageId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(weight !== undefined && { weight }),
        ...(isOptional !== undefined && { isOptional }),
      },
    });

    // Update project progress
    const newProgress = await updateProjectProgressFromStages(stage.projectId);

    res.json({
      stage,
      projectProgress: newProgress,
    });
  } catch (error: any) {
    console.error('Error updating project stage:', error);
    res.status(500).json({ error: 'Failed to update project stage' });
  }
});

/**
 * DELETE /api/projects/:projectId/stages/:stageId
 * Delete a stage
 */
router.delete('/:projectId/stages/:stageId', async (req, res) => {
  try {
    const { projectId, stageId } = req.params;

    // Delete stage
    await prisma.project_stages.delete({
      where: { id: stageId },
    });

    // Update project progress
    const newProgress = await updateProjectProgressFromStages(projectId);

    res.json({
      message: 'Stage deleted successfully',
      projectProgress: newProgress,
    });
  } catch (error: any) {
    console.error('Error deleting project stage:', error);
    res.status(500).json({ error: 'Failed to delete project stage' });
  }
});

/**
 * POST /api/projects/:projectId/stages/:stageId/complete
 * Mark a stage as completed
 */
router.post('/:projectId/stages/:stageId/complete', async (req, res) => {
  try {
    const { stageId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await markStageAsCompleted(stageId, userId);

    // Get updated stage and progress
    const stage = await prisma.project_stages.findUnique({
      where: { id: stageId },
    });

    const progressResult = await calculateStageBasedProgress(
      stage!.projectId
    );

    res.json({
      stage,
      projectProgress: progressResult.overallProgress,
      completedStages: progressResult.completedStages,
      totalStages: progressResult.totalStages,
    });
  } catch (error: any) {
    console.error('Error marking stage as completed:', error);
    res.status(500).json({ error: 'Failed to mark stage as completed' });
  }
});

/**
 * POST /api/projects/:projectId/stages/:stageId/incomplete
 * Mark a stage as incomplete
 */
router.post('/:projectId/stages/:stageId/incomplete', async (req, res) => {
  try {
    const { stageId } = req.params;

    await markStageAsIncomplete(stageId);

    // Get updated stage and progress
    const stage = await prisma.project_stages.findUnique({
      where: { id: stageId },
    });

    const progressResult = await calculateStageBasedProgress(
      stage!.projectId
    );

    res.json({
      stage,
      projectProgress: progressResult.overallProgress,
      completedStages: progressResult.completedStages,
      totalStages: progressResult.totalStages,
    });
  } catch (error: any) {
    console.error('Error marking stage as incomplete:', error);
    res.status(500).json({ error: 'Failed to mark stage as incomplete' });
  }
});

/**
 * POST /api/projects/:projectId/stages/initialize
 * Initialize stages from a template
 */
router.post('/:projectId/stages/initialize', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { templateType } = req.body;

    // Verify project exists
    const project = await prisma.developer_projects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if project already has stages
    const existingStages = await prisma.project_stages.count({
      where: { projectId },
    });

    if (existingStages > 0) {
      return res.status(400).json({
        error: 'Project already has stages. Delete existing stages first.',
      });
    }

    // Use provided template type or project's projectType
    const typeToUse = templateType || project.projectType;

    // Create stages from template
    await createStagesFromTemplate(projectId, typeToUse);

    // Get created stages and calculate progress
    const result = await calculateStageBasedProgress(projectId);

    res.status(201).json({
      message: 'Stages initialized successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error initializing project stages:', error);
    res.status(500).json({ error: error.message || 'Failed to initialize stages' });
  }
});

/**
 * POST /api/projects/:projectId/stages/reorder
 * Reorder stages
 */
router.post('/:projectId/stages/reorder', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { stageOrders } = req.body; // Array of { stageId, order }

    if (!Array.isArray(stageOrders)) {
      return res.status(400).json({ error: 'stageOrders must be an array' });
    }

    // Update each stage's order
    await Promise.all(
      stageOrders.map((item) =>
        prisma.project_stages.update({
          where: { id: item.stageId },
          data: { order: item.order },
        })
      )
    );

    // Get updated stages
    const result = await calculateStageBasedProgress(projectId);

    res.json({
      message: 'Stages reordered successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error reordering stages:', error);
    res.status(500).json({ error: 'Failed to reorder stages' });
  }
});

export default router;

