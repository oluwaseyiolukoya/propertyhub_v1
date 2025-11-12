import { Router, Request, Response } from 'express';
import prisma from '../lib/db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// Portfolio Overview
// ============================================

router.get('/portfolio/overview', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Get all projects for this developer
    const projects = await prisma.developer_projects.findMany({
      where: {
        customerId,
        developerId: userId,
      },
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const totalBudget = projects.reduce((sum, p) => sum + p.totalBudget, 0);
    const totalActualSpend = projects.reduce((sum, p) => sum + p.actualSpend, 0);
    const totalVariance = totalActualSpend - totalBudget;
    const variancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;
    const averageProgress = projects.length > 0
      ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
      : 0;
    const projectsOnTrack = projects.filter(p => p.actualSpend <= p.totalBudget).length;
    const projectsDelayed = projects.filter(p => p.status === 'active' && p.progress < 50).length;
    const projectsOverBudget = projects.filter(p => p.actualSpend > p.totalBudget).length;

    res.json({
      totalProjects,
      activeProjects,
      completedProjects,
      totalBudget,
      totalActualSpend,
      totalVariance,
      variancePercent,
      averageProgress,
      projectsOnTrack,
      projectsDelayed,
      projectsOverBudget,
      currency: projects[0]?.currency || 'NGN',
    });
  } catch (error: any) {
    console.error('Error fetching portfolio overview:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio overview' });
  }
});

// ============================================
// Projects List
// ============================================

router.get('/projects', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    const {
      search,
      status,
      stage,
      projectType,
      sortField = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      customerId,
      developerId: userId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status && Array.isArray(status)) {
      where.status = { in: status };
    } else if (status) {
      where.status = status;
    }

    if (stage && Array.isArray(stage)) {
      where.stage = { in: stage };
    } else if (stage) {
      where.stage = stage;
    }

    if (projectType && Array.isArray(projectType)) {
      where.projectType = { in: projectType };
    } else if (projectType) {
      where.projectType = projectType;
    }

    // Get total count
    const total = await prisma.developer_projects.count({ where });

    // Get projects
    const projects = await prisma.developer_projects.findMany({
      where,
      orderBy: { [sortField as string]: sortOrder },
      skip,
      take: limitNum,
    });

    res.json({
      data: projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + projects.length < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// ============================================
// Single Project
// ============================================

router.get('/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        developerId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// ============================================
// Project Dashboard (Detailed View)
// ============================================

router.get('/projects/:projectId/dashboard', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Get project
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        developerId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get budget line items
    const budgetLineItems = await prisma.budget_line_items.findMany({
      where: { projectId },
      orderBy: { category: 'asc' },
    });

    // Get invoices with vendor info
    const invoices = await prisma.project_invoices.findMany({
      where: { projectId },
      include: {
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get forecasts
    const forecasts = await prisma.project_forecasts.findMany({
      where: { projectId },
      orderBy: { forecastDate: 'desc' },
      take: 10,
    });

    // Get milestones
    const milestones = await prisma.project_milestones.findMany({
      where: { projectId },
      orderBy: { targetDate: 'asc' },
    });

    // Calculate budget by category
    const budgetByCategory = budgetLineItems.reduce((acc: any[], item) => {
      const existing = acc.find(c => c.category === item.category);
      if (existing) {
        existing.planned += item.plannedAmount;
        existing.actual += item.actualAmount;
        existing.variance += item.variance;
      } else {
        acc.push({
          category: item.category,
          planned: item.plannedAmount,
          actual: item.actualAmount,
          variance: item.variance,
          variancePercent: item.variancePercent,
        });
      }
      return acc;
    }, []);

    // Generate alerts
    const alerts: any[] = [];

    // Budget overrun alerts
    budgetLineItems.forEach(item => {
      if (item.variancePercent > 10) {
        alerts.push({
          id: `budget-${item.id}`,
          type: 'budget-overrun',
          severity: item.variancePercent > 25 ? 'critical' : 'high',
          title: `Budget Overrun: ${item.category}`,
          message: `${item.category} is ${item.variancePercent.toFixed(1)}% over budget`,
          projectId,
          entityId: item.id,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Pending invoice alerts
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
    if (pendingInvoices.length > 0) {
      alerts.push({
        id: 'pending-invoices',
        type: 'pending-approval',
        severity: 'medium',
        title: 'Pending Invoices',
        message: `${pendingInvoices.length} invoice(s) awaiting approval`,
        projectId,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({
      project,
      budgetLineItems,
      invoices,
      forecasts,
      milestones,
      alerts,
      budgetByCategory,
      spendTrend: [], // TODO: Calculate spend trend over time
      cashFlowForecast: [], // TODO: Calculate cash flow forecast
    });
  } catch (error: any) {
    console.error('Error fetching project dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch project dashboard' });
  }
});

// ============================================
// Create Project
// ============================================

router.post('/projects', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    const {
      name,
      description,
      projectType,
      stage = 'planning',
      startDate,
      estimatedEndDate,
      location,
      city,
      state,
      totalBudget,
      currency = 'NGN',
    } = req.body;

    const project = await prisma.developer_projects.create({
      data: {
        customerId,
        developerId: userId,
        name,
        description,
        projectType,
        stage,
        startDate: startDate ? new Date(startDate) : null,
        estimatedEndDate: estimatedEndDate ? new Date(estimatedEndDate) : null,
        location,
        city,
        state,
        totalBudget: parseFloat(totalBudget) || 0,
        currency,
      },
    });

    res.status(201).json(project);
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// ============================================
// Update Project
// ============================================

router.patch('/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify ownership
    const existing = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        developerId: userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updateData: any = { ...req.body };

    // Convert date strings to Date objects
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.estimatedEndDate) updateData.estimatedEndDate = new Date(updateData.estimatedEndDate);
    if (updateData.actualEndDate) updateData.actualEndDate = new Date(updateData.actualEndDate);

    const project = await prisma.developer_projects.update({
      where: { id: projectId },
      data: updateData,
    });

    res.json(project);
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ============================================
// Budget Line Items
// ============================================

router.get('/projects/:projectId/budget', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        developerId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const budgetItems = await prisma.budget_line_items.findMany({
      where: { projectId },
      orderBy: { category: 'asc' },
    });

    res.json(budgetItems);
  } catch (error: any) {
    console.error('Error fetching budget items:', error);
    res.status(500).json({ error: 'Failed to fetch budget items' });
  }
});

router.post('/projects/:projectId/budget', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        developerId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const {
      category,
      subcategory,
      description,
      plannedAmount,
      startDate,
      endDate,
      notes,
    } = req.body;

    const budgetItem = await prisma.budget_line_items.create({
      data: {
        projectId,
        category,
        subcategory,
        description,
        plannedAmount: parseFloat(plannedAmount),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes,
      },
    });

    res.status(201).json(budgetItem);
  } catch (error: any) {
    console.error('Error creating budget item:', error);
    res.status(500).json({ error: 'Failed to create budget item' });
  }
});

router.patch('/projects/:projectId/budget/:lineItemId', async (req: Request, res: Response) => {
  try {
    const { projectId, lineItemId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        developerId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updateData: any = { ...req.body };

    // Calculate variance if actualAmount is updated
    if (updateData.actualAmount !== undefined) {
      const item = await prisma.budget_line_items.findUnique({
        where: { id: lineItemId },
      });

      if (item) {
        const variance = updateData.actualAmount - item.plannedAmount;
        const variancePercent = item.plannedAmount > 0
          ? (variance / item.plannedAmount) * 100
          : 0;

        updateData.variance = variance;
        updateData.variancePercent = variancePercent;
      }
    }

    const budgetItem = await prisma.budget_line_items.update({
      where: { id: lineItemId },
      data: updateData,
    });

    res.json(budgetItem);
  } catch (error: any) {
    console.error('Error updating budget item:', error);
    res.status(500).json({ error: 'Failed to update budget item' });
  }
});

// ============================================
// Vendors
// ============================================

router.get('/vendors', async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user.customerId;

    const vendors = await prisma.project_vendors.findMany({
      where: { customerId },
      orderBy: { name: 'asc' },
    });

    res.json(vendors);
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

router.post('/vendors', async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user.customerId;

    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      vendorType,
      specialization,
      notes,
    } = req.body;

    const vendor = await prisma.project_vendors.create({
      data: {
        customerId,
        name,
        contactPerson,
        email,
        phone,
        address,
        vendorType,
        specialization,
        notes,
      },
    });

    res.status(201).json(vendor);
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// ============================================
// Invoices
// ============================================

router.get('/projects/:projectId/invoices', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        developerId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const invoices = await prisma.project_invoices.findMany({
      where: { projectId },
      include: {
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

export default router;

