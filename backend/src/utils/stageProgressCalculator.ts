/**
 * Stage-Based Project Progress Calculator
 *
 * Calculates project progress based on completed stages in a checklist.
 * Each stage can have a custom weight, and progress is calculated as:
 * (Sum of completed stage weights / Total stage weights) * 100
 */

import prisma from '../lib/db';

interface StageProgressResult {
  overallProgress: number;
  totalStages: number;
  completedStages: number;
  stages: Array<{
    id: string;
    name: string;
    order: number;
    weight: number;
    isCompleted: boolean;
    completedAt?: Date | null;
    isOptional: boolean;
  }>;
}

/**
 * Calculate project progress based on completed stages
 */
export async function calculateStageBasedProgress(
  projectId: string
): Promise<StageProgressResult> {
  // Fetch all stages for the project
  const stages = await prisma.project_stages.findMany({
    where: { projectId },
    orderBy: { order: 'asc' },
  });

  if (stages.length === 0) {
    return {
      overallProgress: 0,
      totalStages: 0,
      completedStages: 0,
      stages: [],
    };
  }

  // Calculate total weight (excluding optional stages if not completed)
  const totalWeight = stages.reduce((sum, stage) => {
    // Include optional stages in total weight only if they're completed
    if (stage.isOptional && !stage.isCompleted) {
      return sum;
    }
    return sum + stage.weight;
  }, 0);

  // Calculate completed weight
  const completedWeight = stages
    .filter((stage) => stage.isCompleted)
    .reduce((sum, stage) => sum + stage.weight, 0);

  // Calculate progress percentage
  const overallProgress =
    totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  // Count completed stages
  const completedStages = stages.filter((stage) => stage.isCompleted).length;

  return {
    overallProgress: Math.min(100, overallProgress), // Cap at 100%
    totalStages: stages.length,
    completedStages,
    stages: stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      order: stage.order,
      weight: stage.weight,
      isCompleted: stage.isCompleted,
      completedAt: stage.completedAt,
      isOptional: stage.isOptional,
    })),
  };
}

/**
 * Update project progress in database based on stages
 */
export async function updateProjectProgressFromStages(
  projectId: string
): Promise<number> {
  const result = await calculateStageBasedProgress(projectId);

  await prisma.developer_projects.update({
    where: { id: projectId },
    data: { progress: result.overallProgress },
  });

  return result.overallProgress;
}

/**
 * Mark a stage as completed
 */
export async function markStageAsCompleted(
  stageId: string,
  userId: string
): Promise<void> {
  const stage = await prisma.project_stages.update({
    where: { id: stageId },
    data: {
      isCompleted: true,
      completedAt: new Date(),
      completedBy: userId,
    },
  });

  // Update project progress
  await updateProjectProgressFromStages(stage.projectId);
}

/**
 * Mark a stage as incomplete
 */
export async function markStageAsIncomplete(stageId: string): Promise<void> {
  const stage = await prisma.project_stages.update({
    where: { id: stageId },
    data: {
      isCompleted: false,
      completedAt: null,
      completedBy: null,
    },
  });

  // Update project progress
  await updateProjectProgressFromStages(stage.projectId);
}

/**
 * Get industry-standard stage templates
 */
export const INDUSTRY_STANDARD_TEMPLATES = {
  residential: {
    name: 'Residential Construction',
    projectType: 'residential',
    stages: [
      {
        name: 'Site Acquisition & Feasibility Study',
        description: 'Land purchase, surveys, and feasibility analysis',
        order: 1,
        weight: 5,
      },
      {
        name: 'Design & Planning',
        description: 'Architectural design, engineering plans, and approvals',
        order: 2,
        weight: 10,
      },
      {
        name: 'Permits & Approvals',
        description: 'Building permits, environmental clearances, and regulatory approvals',
        order: 3,
        weight: 5,
      },
      {
        name: 'Site Preparation',
        description: 'Land clearing, grading, and utility connections',
        order: 4,
        weight: 8,
      },
      {
        name: 'Foundation Work',
        description: 'Excavation, footings, and foundation construction',
        order: 5,
        weight: 12,
      },
      {
        name: 'Structural Framework',
        description: 'Framing, columns, beams, and roofing structure',
        order: 6,
        weight: 15,
      },
      {
        name: 'Exterior Walls & Roofing',
        description: 'External walls, windows, doors, and roof installation',
        order: 7,
        weight: 10,
      },
      {
        name: 'MEP Installation',
        description: 'Mechanical, Electrical, and Plumbing rough-in',
        order: 8,
        weight: 12,
      },
      {
        name: 'Interior Finishes',
        description: 'Drywall, flooring, painting, and interior fixtures',
        order: 9,
        weight: 10,
      },
      {
        name: 'Final Inspections & Handover',
        description: 'Final inspections, certifications, and project handover',
        order: 10,
        weight: 8,
      },
      {
        name: 'Landscaping & External Works',
        description: 'Landscaping, driveways, and external amenities',
        order: 11,
        weight: 5,
        isOptional: true,
      },
    ],
  },
  commercial: {
    name: 'Commercial Development',
    projectType: 'commercial',
    stages: [
      {
        name: 'Project Initiation & Feasibility',
        description: 'Market research, site selection, and financial feasibility',
        order: 1,
        weight: 5,
      },
      {
        name: 'Design Development',
        description: 'Architectural and engineering design',
        order: 2,
        weight: 10,
      },
      {
        name: 'Regulatory Approvals',
        description: 'Zoning, permits, and environmental clearances',
        order: 3,
        weight: 8,
      },
      {
        name: 'Procurement & Contracting',
        description: 'Contractor selection and material procurement',
        order: 4,
        weight: 5,
      },
      {
        name: 'Site Mobilization',
        description: 'Site setup, temporary facilities, and mobilization',
        order: 5,
        weight: 5,
      },
      {
        name: 'Foundation & Substructure',
        description: 'Excavation, piling, and foundation construction',
        order: 6,
        weight: 12,
      },
      {
        name: 'Superstructure Construction',
        description: 'Structural framework, floors, and core construction',
        order: 7,
        weight: 18,
      },
      {
        name: 'Building Envelope',
        description: 'Exterior cladding, glazing, and weatherproofing',
        order: 8,
        weight: 10,
      },
      {
        name: 'MEP Systems Installation',
        description: 'HVAC, electrical, plumbing, and fire protection systems',
        order: 9,
        weight: 12,
      },
      {
        name: 'Interior Fit-Out',
        description: 'Interior finishes, fixtures, and fittings',
        order: 10,
        weight: 10,
      },
      {
        name: 'Testing & Commissioning',
        description: 'System testing, commissioning, and quality assurance',
        order: 11,
        weight: 5,
      },
    ],
  },
  infrastructure: {
    name: 'Infrastructure Project',
    projectType: 'infrastructure',
    stages: [
      {
        name: 'Planning & Design',
        description: 'Project planning, surveys, and detailed design',
        order: 1,
        weight: 15,
      },
      {
        name: 'Environmental & Social Impact Assessment',
        description: 'Environmental studies and community consultations',
        order: 2,
        weight: 8,
      },
      {
        name: 'Land Acquisition & Resettlement',
        description: 'Land acquisition and resettlement planning',
        order: 3,
        weight: 10,
      },
      {
        name: 'Procurement',
        description: 'Contractor and supplier procurement',
        order: 4,
        weight: 5,
      },
      {
        name: 'Site Preparation & Mobilization',
        description: 'Site clearing, access roads, and mobilization',
        order: 5,
        weight: 8,
      },
      {
        name: 'Main Construction Works',
        description: 'Primary construction activities',
        order: 6,
        weight: 35,
      },
      {
        name: 'Quality Assurance & Testing',
        description: 'Quality control and performance testing',
        order: 7,
        weight: 10,
      },
      {
        name: 'Commissioning & Handover',
        description: 'System commissioning and project handover',
        order: 8,
        weight: 9,
      },
    ],
  },
  'mixed-use': {
    name: 'Mixed-Use Development',
    projectType: 'mixed-use',
    stages: [
      {
        name: 'Concept & Feasibility',
        description: 'Concept development and feasibility studies',
        order: 1,
        weight: 5,
      },
      {
        name: 'Master Planning',
        description: 'Master plan design and zoning',
        order: 2,
        weight: 8,
      },
      {
        name: 'Detailed Design',
        description: 'Architectural and engineering detailed design',
        order: 3,
        weight: 10,
      },
      {
        name: 'Approvals & Permits',
        description: 'Regulatory approvals and building permits',
        order: 4,
        weight: 7,
      },
      {
        name: 'Phase 1: Foundation & Structure',
        description: 'Foundation and structural framework',
        order: 5,
        weight: 15,
      },
      {
        name: 'Phase 2: Building Envelope',
        description: 'Exterior walls, glazing, and roofing',
        order: 6,
        weight: 10,
      },
      {
        name: 'Phase 3: MEP Systems',
        description: 'Mechanical, electrical, and plumbing systems',
        order: 7,
        weight: 12,
      },
      {
        name: 'Phase 4: Residential Fit-Out',
        description: 'Residential units interior finishes',
        order: 8,
        weight: 10,
      },
      {
        name: 'Phase 5: Commercial Fit-Out',
        description: 'Commercial spaces interior finishes',
        order: 9,
        weight: 10,
      },
      {
        name: 'Common Areas & Amenities',
        description: 'Lobby, amenities, and common area finishes',
        order: 10,
        weight: 8,
      },
      {
        name: 'Final Inspections & Handover',
        description: 'Final inspections and project handover',
        order: 11,
        weight: 5,
      },
    ],
  },
};

/**
 * Create stages for a project from a template
 */
export async function createStagesFromTemplate(
  projectId: string,
  projectType: string
): Promise<void> {
  const template =
    INDUSTRY_STANDARD_TEMPLATES[
      projectType as keyof typeof INDUSTRY_STANDARD_TEMPLATES
    ];

  if (!template) {
    throw new Error(`No template found for project type: ${projectType}`);
  }

  // Create stages from template
  await prisma.project_stages.createMany({
    data: template.stages.map((stage) => ({
      projectId,
      name: stage.name,
      description: stage.description,
      order: stage.order,
      weight: stage.weight,
      isOptional: stage.isOptional || false,
    })),
  });
}

