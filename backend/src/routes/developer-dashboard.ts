import { Router, Request, Response } from 'express';
import prisma from '../lib/db';
import { authMiddleware } from '../middleware/auth';
import {
  calculateProjectCashFlow,
  getCashFlowFromSnapshots,
  calculateCumulativeCashFlow,
  calculateMonthlyCashFlowLegacy,
  PeriodType
} from '../services/cashflow.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate monthly cash flow from invoices
 * Inflow: Approved/Paid invoices (money coming in from client/funding)
 * Outflow: Paid invoices to vendors (money going out)
 */
function calculateMonthlyCashFlow(invoices: any[], projectStartDate: Date | null) {
  const monthlyData: { [key: string]: { inflow: number; outflow: number } } = {};

  // Get last 6 months from today or project start date
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 5); // Last 6 months

  // If project started recently, use project start date
  if (projectStartDate && new Date(projectStartDate) > startDate) {
    startDate.setTime(new Date(projectStartDate).getTime());
  }

  // Initialize months
  const months = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' });
    months.push({ key: monthKey, name: monthName });
    monthlyData[monthKey] = { inflow: 0, outflow: 0 };
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Process invoices
  invoices.forEach(invoice => {
    const invoiceDate = invoice.paidDate || invoice.dueDate || invoice.createdAt;
    if (!invoiceDate) return;

    const date = new Date(invoiceDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (monthlyData[monthKey]) {
      // All invoices are outflow (payments to vendors)
      // In a real system, you might have different invoice types
      if (invoice.status === 'paid') {
        monthlyData[monthKey].outflow += invoice.amount;
      }

      // For demo purposes, we can simulate inflow as budget allocation or funding
      // In reality, this would come from a separate funding/payment received table
      // For now, we'll estimate inflow as 120% of outflow to show positive cash flow
      if (invoice.status === 'paid' || invoice.status === 'approved') {
        monthlyData[monthKey].inflow += invoice.amount * 1.2;
      }
    }
  });

  // Convert to array format for charts
  return months.map(month => ({
    month: month.name,
    inflow: Math.round(monthlyData[month.key].inflow),
    outflow: Math.round(monthlyData[month.key].outflow),
  }));
}

/**
 * Calculate budget vs actual spend by month
 * Compares planned budget from budget line items with actual spend from expenses
 */
function calculateBudgetVsActual(budgetLineItems: any[], expenses: any[], projectStartDate: Date | null) {
  const monthlyData: { [key: string]: { budget: number; actual: number } } = {};

  // Get last 6 months from today or project start date
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 5); // Last 6 months

  // If project started recently, use project start date
  if (projectStartDate && new Date(projectStartDate) > startDate) {
    startDate.setTime(new Date(projectStartDate).getTime());
  }

  // Initialize months
  const months = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    months.push({ key: monthKey, name: monthName });
    monthlyData[monthKey] = { budget: 0, actual: 0 };
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Calculate total budget and distribute evenly across months
  const totalBudget = budgetLineItems.reduce((sum, item) => sum + item.plannedAmount, 0);
  const monthlyBudget = totalBudget / months.length;

  // Set budget for each month
  months.forEach(month => {
    monthlyData[month.key].budget = monthlyBudget;
  });

  // Process actual expenses (only paid expenses)
  expenses.forEach(expense => {
    const expenseDate = expense.paidDate || expense.createdAt;
    if (!expenseDate) return;

    const date = new Date(expenseDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (monthlyData[monthKey]) {
      monthlyData[monthKey].actual += expense.totalAmount;
    }
  });

  // Convert to array format for charts with cumulative values
  let cumulativeBudget = 0;
  let cumulativeActual = 0;

  return months.map(month => {
    cumulativeBudget += monthlyData[month.key].budget;
    cumulativeActual += monthlyData[month.key].actual;

    return {
      month: month.name.split(' ')[0], // Just month name (e.g., "Jan")
      budget: Math.round(cumulativeBudget),
      actual: Math.round(cumulativeActual),
    };
  });
}

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

    // Calculate actual spend by category from expenses (paid expenses only)
    const expenses = await prisma.project_expenses.findMany({
      where: {
        projectId,
        paymentStatus: 'paid', // Only count paid expenses
      },
      select: {
        category: true,
        totalAmount: true,
        paidDate: true,
        createdAt: true,
      },
    });

    const spendByCategory = expenses.reduce((acc: any[], expense) => {
      const existing = acc.find(c => c.category === expense.category);
      if (existing) {
        existing.amount += expense.totalAmount;
      } else {
        acc.push({
          category: expense.category,
          amount: expense.totalAmount,
        });
      }
      return acc;
    }, []);

    // Sort by amount descending
    spendByCategory.sort((a, b) => b.amount - a.amount);

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

    // Calculate monthly cash flow from invoices
    const cashFlowData = calculateMonthlyCashFlow(invoices, project.startDate);

    // Calculate budget vs actual spend by month
    const budgetVsActual = calculateBudgetVsActual(budgetLineItems, expenses, project.startDate);

    // Calculate KPI values from real data
    const totalBudget = budgetLineItems.reduce((sum, item) => {
      const amount = Number(item.plannedAmount) || 0;
      return sum + amount;
    }, 0);

    const actualSpend = expenses.reduce((sum, expense) => {
      const amount = Number(expense.totalAmount) || 0;
      return sum + amount;
    }, 0);

    const variance = actualSpend - totalBudget;
    const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    // Calculate forecasted completion based on current progress and spend rate
    let forecastedCompletion = totalBudget;
    const progress = project.progress || 0;
    if (progress > 0 && progress <= 100 && actualSpend > 0) {
      // Forecast = (actualSpend / progress) * 100
      // This estimates total cost based on current spend rate
      // Convert progress percentage to decimal (e.g., 25% -> 0.25)
      const progressDecimal = progress / 100;
      forecastedCompletion = actualSpend / progressDecimal;
    }

    // Enhanced project object with calculated values
    const projectWithCalculations = {
      ...project,
      totalBudget,
      actualSpend,
      variance,
      variancePercent,
      forecastedCompletion,
    };

    res.json({
      project: projectWithCalculations,
      budgetLineItems,
      invoices,
      forecasts,
      milestones,
      alerts,
      budgetByCategory,
      spendByCategory, // Real spend data from expenses table
      budgetVsActual, // Monthly budget vs actual spend
      spendTrend: [], // TODO: Calculate spend trend over time
      cashFlowData, // Monthly cash flow (inflow/outflow)
    });
  } catch (error: any) {
    console.error('Error fetching project dashboard:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to fetch project dashboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    // Get all paid expenses for this project
    const expenses = await prisma.project_expenses.findMany({
      where: {
        projectId,
        paymentStatus: 'paid',
      },
      select: {
        category: true,
        totalAmount: true,
      },
    });

    // Calculate actual amounts by category
    const expensesByCategory: { [key: string]: number } = {};
    expenses.forEach(expense => {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0;
      }
      expensesByCategory[expense.category] += expense.totalAmount;
    });

    // Update budget items with calculated actual amounts and variance
    const budgetItemsWithActuals = budgetItems.map(item => {
      const actualAmount = expensesByCategory[item.category] || 0;
      const variance = actualAmount - item.plannedAmount;
      const variancePercent = item.plannedAmount > 0 ? (variance / item.plannedAmount) * 100 : 0;

      return {
        ...item,
        actualAmount,
        variance,
        variancePercent,
      };
    });

    res.json(budgetItemsWithActuals);
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

    // Remove actualAmount from update data - it should be calculated, not manually set
    delete updateData.actualAmount;
    delete updateData.variance;
    delete updateData.variancePercent;

    // Get the budget item to access its category
    const item = await prisma.budget_line_items.findUnique({
      where: { id: lineItemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Budget line item not found' });
    }

    // Calculate actualAmount from paid expenses in this category
    const expensesInCategory = await prisma.project_expenses.findMany({
      where: {
        projectId,
        category: updateData.category || item.category, // Use new category if updating, otherwise existing
        paymentStatus: 'paid',
      },
      select: {
        totalAmount: true,
      },
    });

    const actualAmount = expensesInCategory.reduce((sum, expense) => sum + expense.totalAmount, 0);

    // Calculate variance
    const plannedAmount = updateData.plannedAmount !== undefined
      ? parseFloat(updateData.plannedAmount)
      : item.plannedAmount;

    const variance = actualAmount - plannedAmount;
    const variancePercent = plannedAmount > 0 ? (variance / plannedAmount) * 100 : 0;

    // Add calculated fields to update data
    updateData.actualAmount = actualAmount;
    updateData.variance = variance;
    updateData.variancePercent = variancePercent;

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

router.delete('/projects/:projectId/budget/:lineItemId', async (req: Request, res: Response) => {
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

    // Verify budget item exists and belongs to this project
    const existingItem = await prisma.budget_line_items.findFirst({
      where: {
        id: lineItemId,
        projectId,
      },
    });

    if (!existingItem) {
      return res.status(404).json({ error: 'Budget line item not found' });
    }

    // Delete the budget item
    await prisma.budget_line_items.delete({
      where: { id: lineItemId },
    });

    console.log(`✅ Budget line item deleted: ${lineItemId} from project ${projectId}`);
    res.json({ message: 'Budget line item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting budget item:', error);
    res.status(500).json({ error: 'Failed to delete budget item' });
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

// ============================================
// Enhanced Cash Flow Management
// ============================================

/**
 * GET /api/developer-dashboard/projects/:projectId/cash-flow
 * Get cash flow data with multiple options
 */
router.get('/projects/:projectId/cash-flow', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    const {
      startDate,
      endDate,
      periodType = 'monthly',
      useSnapshot = 'false', // Use pre-calculated snapshots for performance
      cumulative = 'false'
    } = req.query;

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

    // Determine date range
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getFullYear(), end.getMonth() - 5, 1); // Last 6 months by default

    let cashFlow;
    let source = 'realtime';

    // Option 1: Use pre-calculated snapshots (FAST)
    if (useSnapshot === 'true') {
      cashFlow = await getCashFlowFromSnapshots(
        projectId,
        start,
        end,
        periodType as PeriodType
      );
      source = 'snapshot';
    }
    // Option 2: Calculate cumulative cash flow
    else if (cumulative === 'true') {
      cashFlow = await calculateCumulativeCashFlow(
        projectId,
        start,
        end,
        periodType as PeriodType
      );
      source = 'cumulative';
    }
    // Option 3: Calculate in real-time (ACCURATE)
    else {
      cashFlow = await calculateProjectCashFlow(
        projectId,
        start,
        end,
        periodType as PeriodType
      );
    }

    res.json({
      data: cashFlow,
      source,
      periodType,
      startDate: start,
      endDate: end,
      calculatedAt: new Date()
    });

  } catch (error: any) {
    console.error('Cash flow error:', error);
    res.status(500).json({ error: 'Failed to fetch cash flow', details: error.message });
  }
});

/**
 * GET /api/developer-dashboard/projects/:projectId/cash-flow/summary
 * Get cash flow summary (totals)
 */
router.get('/projects/:projectId/cash-flow/summary', async (req: Request, res: Response) => {
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

    // Get all-time totals
    const [fundingTotal, expensesTotal] = await Promise.all([
      prisma.project_funding.aggregate({
        where: {
          projectId,
          status: 'received'
        },
        _sum: { amount: true }
      }),
      prisma.project_expenses.aggregate({
        where: {
          projectId,
          paymentStatus: 'paid'
        },
        _sum: { totalAmount: true }
      })
    ]);

    const totalInflow = fundingTotal._sum.amount || 0;
    const totalOutflow = expensesTotal._sum.totalAmount || 0;
    const netCashFlow = totalInflow - totalOutflow;

    // Get pending amounts
    const [pendingFunding, pendingExpenses] = await Promise.all([
      prisma.project_funding.aggregate({
        where: {
          projectId,
          status: 'pending'
        },
        _sum: { amount: true }
      }),
      prisma.project_expenses.aggregate({
        where: {
          projectId,
          paymentStatus: { in: ['unpaid', 'partial'] }
        },
        _sum: { totalAmount: true }
      })
    ]);

    res.json({
      totalInflow,
      totalOutflow,
      netCashFlow,
      pendingInflow: pendingFunding._sum.amount || 0,
      pendingOutflow: pendingExpenses._sum.totalAmount || 0,
      currency: project.currency
    });

  } catch (error: any) {
    console.error('Cash flow summary error:', error);
    res.status(500).json({ error: 'Failed to fetch cash flow summary' });
  }
});

// ============================================
// Project Funding Management
// ============================================

/**
 * GET /api/developer-dashboard/projects/:projectId/funding
 * Get all funding records for a project
 */
router.get('/projects/:projectId/funding', async (req: Request, res: Response) => {
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

    const funding = await prisma.project_funding.findMany({
      where: { projectId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(funding);
  } catch (error: any) {
    console.error('Error fetching funding:', error);
    res.status(500).json({ error: 'Failed to fetch funding records' });
  }
});

/**
 * POST /api/developer-dashboard/projects/:projectId/funding
 * Create a new funding record
 */
router.post('/projects/:projectId/funding', async (req: Request, res: Response) => {
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
      amount,
      currency = 'NGN',
      fundingType,
      fundingSource,
      expectedDate,
      receivedDate,
      status = 'pending',
      referenceNumber,
      description,
      notes
    } = req.body;

    const funding = await prisma.project_funding.create({
      data: {
        projectId,
        customerId,
        amount: parseFloat(amount),
        currency,
        fundingType,
        fundingSource,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
        status,
        referenceNumber,
        description,
        notes,
        createdBy: userId
      }
    });

    res.status(201).json(funding);
  } catch (error: any) {
    console.error('Error creating funding:', error);
    res.status(500).json({ error: 'Failed to create funding record' });
  }
});

// ============================================
// Project Expenses Management
// ============================================

/**
 * GET /api/developer-dashboard/projects/:projectId/expenses
 * Get all expenses for a project
 */
router.get('/projects/:projectId/expenses', async (req: Request, res: Response) => {
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

    const expenses = await prisma.project_expenses.findMany({
      where: { projectId },
      include: {
        vendor: { select: { id: true, name: true, vendorType: true } },
        approver: { select: { id: true, name: true, email: true } },
        budgetLineItem: { select: { id: true, category: true, subcategory: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(expenses);
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * POST /api/developer-dashboard/projects/:projectId/expenses
 * Create a new expense record
 */
router.post('/projects/:projectId/expenses', async (req: Request, res: Response) => {
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
      vendorId,
      amount,
      taxAmount = 0,
      currency = 'NGN',
      expenseType,
      category,
      subcategory,
      invoiceNumber,
      description,
      invoiceDate,
      dueDate,
      paidDate,
      status = 'pending',
      paymentStatus = 'unpaid',
      paymentMethod,
      paymentReference,
      budgetLineItemId,
      notes
    } = req.body;

    const totalAmount = parseFloat(amount) + parseFloat(taxAmount);

    const expense = await prisma.project_expenses.create({
      data: {
        projectId,
        vendorId,
        amount: parseFloat(amount),
        taxAmount: parseFloat(taxAmount),
        totalAmount,
        currency,
        expenseType,
        category,
        subcategory,
        invoiceNumber,
        description,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        paidDate: paidDate ? new Date(paidDate) : null,
        status,
        paymentStatus,
        paymentMethod,
        paymentReference,
        budgetLineItemId,
        notes
      }
    });

    res.status(201).json(expense);
  } catch (error: any) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense record' });
  }
});

/**
 * PATCH /api/developer-dashboard/projects/:projectId/expenses/:expenseId
 * Update an existing expense record
 */
router.patch('/projects/:projectId/expenses/:expenseId', async (req: Request, res: Response) => {
  try {
    const { projectId, expenseId } = req.params;
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

    // Verify expense exists and belongs to this project
    const existingExpense = await prisma.project_expenses.findFirst({
      where: {
        id: expenseId,
        projectId,
      },
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const {
      vendorId,
      amount,
      taxAmount,
      currency,
      expenseType,
      category,
      subcategory,
      invoiceNumber,
      description,
      invoiceDate,
      dueDate,
      paidDate,
      status,
      paymentStatus,
      paymentMethod,
      paymentReference,
      budgetLineItemId,
      notes
    } = req.body;

    // Calculate new total if amount or tax changed
    const newAmount = amount !== undefined ? parseFloat(amount) : existingExpense.amount;
    const newTaxAmount = taxAmount !== undefined ? parseFloat(taxAmount) : existingExpense.taxAmount;
    const totalAmount = newAmount + newTaxAmount;

    const expense = await prisma.project_expenses.update({
      where: { id: expenseId },
      data: {
        ...(vendorId !== undefined && { vendorId }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(taxAmount !== undefined && { taxAmount: parseFloat(taxAmount) }),
        totalAmount,
        ...(currency !== undefined && { currency }),
        ...(expenseType !== undefined && { expenseType }),
        ...(category !== undefined && { category }),
        ...(subcategory !== undefined && { subcategory }),
        ...(invoiceNumber !== undefined && { invoiceNumber }),
        ...(description !== undefined && { description }),
        ...(invoiceDate !== undefined && { invoiceDate: invoiceDate ? new Date(invoiceDate) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(paidDate !== undefined && { paidDate: paidDate ? new Date(paidDate) : null }),
        ...(status !== undefined && { status }),
        ...(paymentStatus !== undefined && { paymentStatus }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(paymentReference !== undefined && { paymentReference }),
        ...(budgetLineItemId !== undefined && { budgetLineItemId }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      }
    });

    res.json(expense);
  } catch (error: any) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense record' });
  }
});

/**
 * DELETE /api/developer-dashboard/projects/:projectId/expenses/:expenseId
 * Delete an expense record
 */
router.delete('/projects/:projectId/expenses/:expenseId', async (req: Request, res: Response) => {
  try {
    const { projectId, expenseId } = req.params;
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

    // Verify expense exists and belongs to this project
    const existingExpense = await prisma.project_expenses.findFirst({
      where: {
        id: expenseId,
        projectId,
      },
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Delete the expense
    await prisma.project_expenses.delete({
      where: { id: expenseId },
    });

    console.log(`✅ Expense deleted: ${expenseId} from project ${projectId}`);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense record' });
  }
});

export default router;

