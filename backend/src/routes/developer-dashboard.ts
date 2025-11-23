import path from 'path';
import { Router, Request, Response } from 'express';
import prisma from '../lib/db';
import { authMiddleware } from '../middleware/auth';
import storageService from '../services/storage.service';
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

// ============================================
// Attachment Helper Functions
// ============================================

const guessMimeTypeFromPath = (filePath: string): string => {
  const ext = path.extname(filePath || '').toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
};

const extractAttachmentPaths = (rawValue: any): string[] => {
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) {
    return rawValue.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  if (typeof rawValue === 'string') {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
      }
    } catch {
      return [];
    }
  }

  return [];
};

const ensureInvoiceAttachmentRecords = async ({
  invoice,
  customerId,
  userId,
  filePaths,
}: {
  invoice: any;
  customerId: string;
  userId: string;
  filePaths?: string[];
}) => {
  const resolvedPaths = filePaths ?? extractAttachmentPaths(invoice.attachments);
  if (resolvedPaths.length === 0) {
    return [];
  }

  const createdRecords: any[] = [];

  for (const filePath of resolvedPaths) {
    if (!filePath) continue;

    const existing = await prisma.invoice_attachments.findFirst({
      where: {
        invoice_id: invoice.id,
        file_path: filePath,
      },
    });

    if (existing) {
      createdRecords.push(existing);
      continue;
    }

    let fileName = filePath.split('/').pop() || 'Attachment';
    let mimeType = guessMimeTypeFromPath(filePath);
    let fileType = storageService.getFileType(mimeType);
    let uploadedBy = userId;
    let fileSize = BigInt(0);

    try {
      const transaction = await prisma.storage_transactions.findFirst({
        where: {
          customer_id: customerId,
          file_path: filePath,
          action: 'upload',
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (transaction) {
        fileName = transaction.file_name || fileName;
        fileSize = transaction.file_size ?? fileSize;
        mimeType =
          (transaction.metadata as any)?.mime_type ||
          (transaction.metadata as any)?.mimeType ||
          mimeType;
        fileType = transaction.file_type || storageService.getFileType(mimeType);
        uploadedBy = transaction.uploaded_by || uploadedBy;
      } else {
        const metadata = await storageService.getFileMetadata(filePath);
        fileSize = BigInt(metadata.size || 0);
        if (metadata.contentType) {
          mimeType = metadata.contentType;
          fileType = storageService.getFileType(mimeType);
        }
      }
    } catch (metadataError: any) {
      console.warn(
        `[developer-dashboard] Failed to fetch metadata for invoice attachment ${filePath}:`,
        metadataError?.message || metadataError
      );
    }

    try {
      const created = await prisma.invoice_attachments.create({
        data: {
          invoice_id: invoice.id,
          customer_id: customerId,
          file_path: filePath,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
          mime_type: mimeType,
          uploaded_by: uploadedBy,
          metadata: {
            autoBackfill: true,
            source: 'invoice.attachments',
          },
        },
      });

      createdRecords.push(created);
    } catch (creationError: any) {
      console.error(
        `[developer-dashboard] Failed to create invoice_attachment record for ${filePath}:`,
        creationError?.message || creationError
      );
    }
  }

  return createdRecords;
};

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
    const userId = (req as any).user?.id;
    const customerId = (req as any).user?.customerId;

    // Validate required authentication data
    if (!userId) {
      console.error('Error fetching portfolio overview: Missing userId');
      return res.status(401).json({
        error: 'Unauthorized: User ID not found',
        details: 'Please log in again'
      });
    }

    if (!customerId) {
      console.error('Error fetching portfolio overview: Missing customerId', {
        userId,
        userEmail: (req as any).user?.email,
        userRole: (req as any).user?.role
      });
      // Return empty portfolio if no customerId (developer without customer)
      return res.json({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalBudget: 0,
        totalActualSpend: 0,
        totalVariance: 0,
        variancePercent: 0,
        averageProgress: 0,
        projectsOnTrack: 0,
        projectsDelayed: 0,
        projectsOverBudget: 0,
        currency: 'NGN',
      });
    }

    // ============================================
    // PRODUCTION DEBUG: Verify customer exists
    // ============================================
    console.log('🔍 [DEBUG] Fetching portfolio overview:', {
      userId,
      customerId,
      userEmail: (req as any).user?.email
    });

    // Check if customer exists
    const customerExists = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { id: true, company: true }
    });

    if (!customerExists) {
      console.error('❌ [ERROR] Customer not found for portfolio overview:', {
        customerId,
        userId
      });
      return res.status(400).json({
        error: 'Customer account not found',
        details: 'Your customer account does not exist in the database',
        debugInfo: { customerId, userId }
      });
    }

    console.log('✅ [DEBUG] Customer found:', customerExists.company);

    let projectsWithActualSpend: any[] = [];

    try {
      // Get all projects for this customer (includes projects created by admin and team members)
      const projects = await prisma.developer_projects.findMany({
        where: {
          customerId,
          // Removed developerId filter so team members can see all customer projects
        },
      });

      // Calculate actual spend from expenses for each project
      projectsWithActualSpend = await Promise.all(
        projects.map(async (project) => {
          // Get paid expenses for this project
          const expenses = await prisma.project_expenses.findMany({
            where: {
              projectId: project.id,
              paymentStatus: 'paid',
            },
          });

          // Calculate actual spend from paid expenses
          const actualSpend = expenses.reduce((sum, expense) => {
            const amount = Number(expense.totalAmount) || 0;
            return sum + amount;
          }, 0);

          return {
            ...project,
            actualSpend,
          };
        })
      );
    } catch (dbErr: any) {
      // Gracefully handle missing or mismatched developer tables in dev environments
      const msg = dbErr?.message || '';
      if (
        dbErr?.code === 'P2021' || // table does not exist
        dbErr?.code === 'P2022' ||
        msg.includes('developer_projects') ||
        msg.includes('project_expenses') ||
        msg.includes('relation') && msg.includes('does not exist')
      ) {
        console.warn(
          '⚠️ [Developer Dashboard] Project tables are missing or not provisioned. Returning empty portfolio overview instead of 500.',
          {
            code: dbErr?.code,
            message: dbErr?.message,
          }
        );

        return res.json({
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalBudget: 0,
          totalActualSpend: 0,
          totalVariance: 0,
          variancePercent: 0,
          averageProgress: 0,
          projectsOnTrack: 0,
          projectsDelayed: 0,
          projectsOverBudget: 0,
          currency: 'NGN',
        });
      }

      // Unknown DB error – rethrow to outer handler
      throw dbErr;
    }

    const totalProjects = projectsWithActualSpend.length;
    const activeProjects = projectsWithActualSpend.filter(p => p.status === 'active').length;
    const completedProjects = projectsWithActualSpend.filter(p => p.status === 'completed').length;
    const totalBudget = projectsWithActualSpend.reduce((sum, p) => sum + p.totalBudget, 0);
    const totalActualSpend = projectsWithActualSpend.reduce((sum, p) => sum + p.actualSpend, 0);
    const totalVariance = totalActualSpend - totalBudget;
    const variancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;
    const averageProgress = projectsWithActualSpend.length > 0
      ? projectsWithActualSpend.reduce((sum, p) => sum + p.progress, 0) / projectsWithActualSpend.length
      : 0;
    const projectsOnTrack = projectsWithActualSpend.filter(p => p.actualSpend <= p.totalBudget).length;
    const projectsDelayed = projectsWithActualSpend.filter(p => p.status === 'active' && p.progress < 50).length;
    const projectsOverBudget = projectsWithActualSpend.filter(p => p.actualSpend > p.totalBudget).length;

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
      currency: projectsWithActualSpend[0]?.currency || 'NGN',
    });
  } catch (error: any) {
    console.error('❌ [CRITICAL ERROR] Error fetching portfolio overview:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      userId: (req as any).user?.id,
      customerId: (req as any).user?.customerId
    });
    res.status(500).json({
      error: 'Failed to fetch portfolio overview',
      details: error.message, // Show error message for debugging
      code: error.code,
      debugInfo: {
        userId: (req as any).user?.id,
        customerId: (req as any).user?.customerId,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// ============================================
// Projects List
// ============================================

router.get('/projects', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const customerId = (req as any).user?.customerId;

    // Validate required authentication data
    if (!userId) {
      console.error('Error fetching projects: Missing userId');
      return res.status(401).json({
        error: 'Unauthorized: User ID not found',
        details: 'Please log in again'
      });
    }

    if (!customerId) {
      console.error('Error fetching projects: Missing customerId', {
        userId,
        userEmail: (req as any).user?.email,
        userRole: (req as any).user?.role
      });
      // Return empty list if no customerId
      return res.json({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      });
    }

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

    // Build where clause - filter by customer only (team members see all customer projects)
    const where: any = {
      customerId,
      // Removed developerId filter so team members can see all customer projects
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

    let total = 0;
    let projectsWithActualSpend: any[] = [];

    try {
      // Get total count
      total = await prisma.developer_projects.count({ where });

      // Get projects
      const projects = await prisma.developer_projects.findMany({
        where,
        orderBy: { [sortField as string]: sortOrder },
        skip,
        take: limitNum,
      });

      // Calculate actual spend from expenses for each project
      projectsWithActualSpend = await Promise.all(
        projects.map(async (project) => {
          // Get paid expenses for this project
          const expenses = await prisma.project_expenses.findMany({
            where: {
              projectId: project.id,
              paymentStatus: 'paid',
            },
          });

          // Calculate actual spend from paid expenses
          const actualSpend = expenses.reduce((sum, expense) => {
            const amount = Number(expense.totalAmount) || 0;
            return sum + amount;
          }, 0);

          return {
            ...project,
            actualSpend, // Override with calculated value
          };
        })
      );
    } catch (dbErr: any) {
      const msg = dbErr?.message || '';
      if (
        dbErr?.code === 'P2021' ||
        dbErr?.code === 'P2022' ||
        msg.includes('developer_projects') ||
        msg.includes('project_expenses') ||
        (msg.includes('relation') && msg.includes('does not exist'))
      ) {
        console.warn(
          '⚠️ [Developer Dashboard] Project tables are missing or not provisioned. Returning empty projects list instead of 500.',
          {
            code: dbErr?.code,
            message: dbErr?.message,
          }
        );

        return res.json({
          data: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        });
      }

      throw dbErr;
    }

    res.json({
      data: projectsWithActualSpend,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + projects.length < total,
      },
    });
  } catch (error: any) {
    console.error('❌ [CRITICAL ERROR] Error fetching projects:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      userId: (req as any).user?.id,
      customerId: (req as any).user?.customerId,
      query: req.query
    });
    res.status(500).json({
      error: 'Failed to fetch projects',
      details: error.message, // Show error message for debugging
      code: error.code,
      debugInfo: {
        userId: (req as any).user?.id,
        customerId: (req as any).user?.customerId,
        timestamp: new Date().toISOString()
      }
    });
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
        // Team members can access all customer projects
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

    // Get project - filter by customer only (team members can access all customer projects)
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Removed developerId filter so team members can access all customer projects
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

    // Generate alerts based on real data
    const alerts: any[] = [];

    console.log(`🚨 Generating alerts for project: ${projectId}`);

    // Get all expenses for more accurate budget tracking
    const allExpenses = await prisma.project_expenses.findMany({
      where: { projectId },
      select: {
        category: true,
        totalAmount: true,
        paymentStatus: true,
        status: true,
        dueDate: true,
      },
    });

    console.log(`📊 Found ${allExpenses.length} expenses for alert generation`);
    console.log(`📋 Budget line items: ${budgetLineItems.length}`);

    // Calculate actual spend per category
    const categorySpend: { [key: string]: number } = {};
    allExpenses
      .filter(e => e.paymentStatus === 'paid')
      .forEach(expense => {
        categorySpend[expense.category] = (categorySpend[expense.category] || 0) + expense.totalAmount;
      });

    console.log(`💰 Category spend:`, categorySpend);

    // 1. Budget overrun alerts (compare budget vs actual spend)
    budgetLineItems.forEach(item => {
      const actualSpend = categorySpend[item.category] || 0;
      const budgetAmount = item.plannedAmount;
      const variance = actualSpend - budgetAmount;
      const variancePercent = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;

      if (variancePercent > 10) {
        alerts.push({
          id: `budget-${item.id}`,
          type: 'budget-overrun',
          severity: variancePercent > 25 ? 'critical' : 'high',
          title: `Budget Overrun: ${item.category}`,
          message: `${item.category} is ${variancePercent.toFixed(1)}% over budget (₦${variance.toLocaleString()})`,
          projectId,
          entityId: item.id,
          createdAt: new Date().toISOString(),
        });
      } else if (variancePercent > 5 && variancePercent <= 10) {
        // Warning for approaching budget limit
        alerts.push({
          id: `budget-warning-${item.id}`,
          type: 'budget-overrun',
          severity: 'medium',
          title: `Budget Warning: ${item.category}`,
          message: `${item.category} is ${variancePercent.toFixed(1)}% over budget`,
          projectId,
          entityId: item.id,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // 2. Pending expense approvals
    const pendingExpenses = allExpenses.filter(e => e.status === 'pending');
    if (pendingExpenses.length > 0) {
      const totalPending = pendingExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
      alerts.push({
        id: 'pending-expenses',
        type: 'pending-approval',
        severity: pendingExpenses.length > 5 ? 'high' : 'medium',
        title: 'Pending Expense Approvals',
        message: `${pendingExpenses.length} expense(s) awaiting approval (₦${totalPending.toLocaleString()})`,
        projectId,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Overdue payments
    const now = new Date();
    const overdueExpenses = allExpenses.filter(e =>
      e.paymentStatus !== 'paid' &&
      e.dueDate &&
      new Date(e.dueDate) < now
    );
    if (overdueExpenses.length > 0) {
      const totalOverdue = overdueExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
      alerts.push({
        id: 'overdue-payments',
        type: 'payment-due',
        severity: 'critical',
        title: 'Overdue Payments',
        message: `${overdueExpenses.length} payment(s) are overdue (₦${totalOverdue.toLocaleString()})`,
        projectId,
        createdAt: new Date().toISOString(),
      });
    }

    // 4. Pending invoice alerts
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
    if (pendingInvoices.length > 0) {
      const totalPendingInvoices = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      alerts.push({
        id: 'pending-invoices',
        type: 'pending-approval',
        severity: 'medium',
        title: 'Pending Invoices',
        message: `${pendingInvoices.length} invoice(s) awaiting approval (₦${totalPendingInvoices.toLocaleString()})`,
        projectId,
        createdAt: new Date().toISOString(),
      });
    }

    // 5. Upcoming milestones (within 7 days)
    const upcomingMilestones = milestones.filter(m => {
      if (!m.targetDate || m.status === 'completed') return false;
      const daysUntil = Math.ceil((new Date(m.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 7;
    });
    if (upcomingMilestones.length > 0) {
      alerts.push({
        id: 'upcoming-milestones',
        type: 'milestone-due',
        severity: 'medium',
        title: 'Upcoming Milestones',
        message: `${upcomingMilestones.length} milestone(s) due within 7 days`,
        projectId,
        createdAt: new Date().toISOString(),
      });
    }

    // If no alerts, add a positive status message (only if project has budget items)
    if (alerts.length === 0 && budgetLineItems.length > 0) {
      alerts.push({
        id: 'all-good',
        type: 'status',
        severity: 'low',
        title: 'All Systems Good',
        message: 'No budget overruns or pending approvals. Project is on track!',
        projectId,
        createdAt: new Date().toISOString(),
      });
    }

    // Sort alerts by severity (critical > high > medium > low)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    console.log(`🚨 Generated ${alerts.length} alerts:`, alerts.map(a => ({ type: a.type, severity: a.severity, title: a.title })));

    // Calculate monthly cash flow from invoices
    // Handle null startDate safely
    let cashFlowData: any[] = [];
    try {
      cashFlowData = calculateMonthlyCashFlow(invoices, project.startDate || null);
    } catch (err: any) {
      console.error('Error calculating cash flow:', err);
      cashFlowData = [];
    }

    // Calculate budget vs actual spend by month
    // Handle null startDate safely
    let budgetVsActual: any[] = [];
    try {
      budgetVsActual = calculateBudgetVsActual(budgetLineItems, expenses, project.startDate || null);
    } catch (err: any) {
      console.error('Error calculating budget vs actual:', err);
      budgetVsActual = [];
    }

    // Calculate KPI values from real data
    // Use budget line items total if available, otherwise use project's totalBudget
    const budgetLineItemsTotal = budgetLineItems.reduce((sum, item) => {
      const amount = Number(item.plannedAmount) || 0;
      return sum + amount;
    }, 0);

    // If no budget line items exist, use the project's initial totalBudget
    // Otherwise, use the sum of budget line items (more accurate breakdown)
    const totalBudget = budgetLineItemsTotal > 0 ? budgetLineItemsTotal : (project.totalBudget || 0);

    // Calculate Gross Spend (total expenses)
    const grossSpend = expenses.reduce((sum, expense) => {
      const amount = Number(expense.totalAmount) || 0;
      return sum + amount;
    }, 0);

    // Fetch funding received for this project
    const fundingReceived = await prisma.project_funding.aggregate({
      where: {
        projectId,
        status: 'received',
        receivedDate: { not: null }
      },
      _sum: {
        amount: true
      }
    });

    const totalFundingReceived = fundingReceived._sum.amount || 0;

    // Calculate Net Spend (expenses - funding)
    const netSpend = grossSpend - totalFundingReceived;

    // Calculate Available Budget (budget + funding - expenses)
    const availableBudget = totalBudget + totalFundingReceived - grossSpend;

    // Calculate variances
    const variance = grossSpend - totalBudget; // Gross variance (for backward compatibility)
    const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    const netVariance = netSpend - totalBudget; // Net variance (after funding)
    const netVariancePercent = totalBudget > 0 ? (netVariance / totalBudget) * 100 : 0;

    // Keep actualSpend for backward compatibility
    const actualSpend = grossSpend;

    // Calculate forecasted completion based on current progress and spend rate
    let forecastedCompletion = totalBudget;
    const progress = project.progress || 0;
    if (progress > 0 && progress <= 100 && grossSpend > 0) {
      // Forecast = (grossSpend / progress) * 100
      // This estimates total cost based on current spend rate
      // Convert progress percentage to decimal (e.g., 25% -> 0.25)
      const progressDecimal = progress / 100;
      forecastedCompletion = grossSpend / progressDecimal;
    }

    // Enhanced project object with calculated values
    const projectWithCalculations = {
      ...project,
      totalBudget,
      actualSpend,              // Keep for backward compatibility
      grossSpend,               // NEW: Total expenses
      netSpend,                 // NEW: Expenses - Funding
      totalFundingReceived,     // NEW: Total funding received
      availableBudget,          // NEW: Budget + Funding - Expenses
      variance,                 // Keep for backward compatibility (gross variance)
      variancePercent,          // Keep for backward compatibility
      netVariance,              // NEW: Net variance after funding
      netVariancePercent,       // NEW: Net variance percentage
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
    const userId = (req as any).user?.id;
    const customerId = (req as any).user?.customerId;

    // Validate required authentication data
    if (!userId) {
      console.error('Error creating project: Missing userId in request');
      return res.status(401).json({
        error: 'Unauthorized: User ID not found',
        details: 'Please log in again'
      });
    }

    if (!customerId) {
      console.error('Error creating project: Missing customerId', {
        userId,
        userEmail: (req as any).user?.email,
        userRole: (req as any).user?.role
      });
      return res.status(400).json({
        error: 'Cannot create project: Customer ID is required',
        details: 'Your account must be associated with a customer to create projects'
      });
    }

    // ============================================
    // PRODUCTION DEBUG: Verify customer and user exist
    // ============================================
    console.log('🔍 [DEBUG] Attempting to create project:', {
      userId,
      customerId,
      userEmail: (req as any).user?.email,
      projectName: req.body.name
    });

    // Check if customer exists in database
    const customerExists = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { id: true, company: true }
    });

    if (!customerExists) {
      console.error('❌ [ERROR] Customer not found in database:', {
        customerId,
        userId,
        userEmail: (req as any).user?.email
      });
      return res.status(400).json({
        error: 'Customer account not found',
        details: 'Your customer account does not exist in the database. Please contact support.',
        debugInfo: {
          customerId,
          userId
        }
      });
    }

    // Check if user/developer exists in database
    const userExists = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, customerId: true }
    });

    if (!userExists) {
      console.error('❌ [ERROR] User not found in database:', {
        userId,
        customerId
      });
      return res.status(400).json({
        error: 'User account not found',
        details: 'Your user account does not exist in the database. Please contact support.',
        debugInfo: {
          userId,
          customerId
        }
      });
    }

    // Verify user is associated with the customer
    if (userExists.customerId !== customerId) {
      console.error('❌ [ERROR] User-Customer mismatch:', {
        userId,
        tokenCustomerId: customerId,
        dbCustomerId: userExists.customerId,
        userEmail: userExists.email
      });
      return res.status(400).json({
        error: 'Account mismatch',
        details: 'Your user account is not associated with the specified customer. Please log out and log in again.',
        debugInfo: {
          tokenCustomerId: customerId,
          dbCustomerId: userExists.customerId
        }
      });
    }

    console.log('✅ [DEBUG] Customer and user validation passed:', {
      customerCompany: customerExists.company,
      userEmail: userExists.email,
      userRole: userExists.role
    });

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

    // Validate required fields
    if (!name || !projectType) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Project name and type are required'
      });
    }

    const project = await prisma.developer_projects.create({
      data: {
        customerId,
        developerId: userId, // Required field in schema
        // Team members can access all customer projects
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

    console.log('✅ [SUCCESS] Project created:', {
      projectId: project.id,
      projectName: project.name,
      customerId,
      userId
    });

    res.status(201).json(project);
  } catch (error: any) {
    console.error('❌ [CRITICAL ERROR] Error creating project:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
      userId: (req as any).user?.id,
      customerId: (req as any).user?.customerId,
      body: req.body
    });

    // Return more specific error messages
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Project already exists',
        details: error.meta?.target
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Invalid reference',
        details: 'The customer or developer ID does not exist in the database',
        debugInfo: {
          code: error.code,
          target: error.meta?.target,
          field_name: error.meta?.field_name
        }
      });
    }

    res.status(500).json({
      error: 'Failed to create project',
      details: error.message, // Now show error message in production for debugging
      code: error.code,
      debugInfo: {
        userId: (req as any).user?.id,
        customerId: (req as any).user?.customerId,
        timestamp: new Date().toISOString()
      }
    });
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
        // Team members can access all customer projects
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
// Delete Project
// ============================================

router.delete('/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify ownership
    const existing = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete budget line items
      await tx.budget_line_items.deleteMany({
        where: { projectId },
      });

      // Delete expenses
      await tx.project_expenses.deleteMany({
        where: { projectId },
      });

      // Delete funding
      await tx.project_funding.deleteMany({
        where: { projectId },
      });

      // Delete cash flow snapshots
      await tx.project_cash_flow_snapshots.deleteMany({
        where: { projectId },
      });

      // Delete the project itself
      await tx.developer_projects.delete({
        where: { id: projectId },
      });
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
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
        // Team members can access all customer projects
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
        // Team members can access all customer projects
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
        // Team members can access all customer projects
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
        // Team members can access all customer projects
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

// Get all invoices across all projects for the developer
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    console.log(`[GET /invoices] Fetching invoices for userId: ${userId}, customerId: ${customerId}`);

    // Get all projects for this developer
    const projects = await prisma.developer_projects.findMany({
      where: {
        customerId,
        // Team members can access all customer projects
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`[GET /invoices] Found ${projects.length} projects`);

    const projectIds = projects.map(p => p.id);

    // If no projects, return empty array
    if (projectIds.length === 0) {
      console.log('[GET /invoices] No projects found, returning empty array');
      return res.json({
        success: true,
        data: [],
      });
    }

    // Get all invoices for these projects
    const invoices = await prisma.project_invoices.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
      include: {
        vendor: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[GET /invoices] Found ${invoices.length} invoices`);

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error: any) {
    console.error('[GET /invoices] Error fetching all invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      details: error.message
    });
  }
});

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
        // Team members can access all customer projects
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const invoices = await prisma.project_invoices.findMany({
      where: { projectId },
      include: {
        vendor: true,
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Create invoice for a project
router.post('/projects/:projectId/invoices', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;
    const {
      purchaseOrderId,
      vendorId,
      description,
      category,
      amount,
      currency,
      dueDate,
      paymentMethod,
      notes,
      attachments,
    } = req.body;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate required fields
    if (!description || !category || !amount) {
      return res.status(400).json({ error: 'Missing required fields: description, category, amount' });
    }

    // If purchaseOrderId provided, verify it exists and belongs to this project
    if (purchaseOrderId) {
      const po = await prisma.purchase_orders.findFirst({
        where: {
          id: purchaseOrderId,
          projectId,
          customerId,
        },
      });

      if (!po) {
        return res.status(404).json({ error: 'Purchase order not found' });
      }
    }

    // Generate invoice number (INV-YYYY-###)
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.project_invoices.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}-`,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    });

    let invoiceNumber: string;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      invoiceNumber = `INV-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      invoiceNumber = `INV-${year}-001`;
    }

    // Create invoice
    const invoice = await prisma.project_invoices.create({
      data: {
        projectId,
        purchaseOrderId: purchaseOrderId || null,
        vendorId: vendorId || null,
        invoiceNumber,
        description,
        category,
        amount: parseFloat(amount),
        currency: currency || 'NGN',
        status: 'pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        attachments: attachments || null,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    // If there are attachment paths, create invoice_attachments records
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (const filePath of attachments as string[]) {
        if (!filePath) continue;

        try {
          // Find latest upload transaction for this file and customer
          const tx = await prisma.storage_transactions.findFirst({
            where: {
              customer_id: customerId,
              file_path: filePath,
              action: "upload",
            },
            orderBy: {
              created_at: "desc",
            },
          });

          if (!tx) {
            console.warn(
              "[developer-dashboard] No storage transaction found for attachment path:",
              filePath
            );
            continue;
          }

          await prisma.invoice_attachments.create({
            data: {
              invoice_id: invoice.id,
              customer_id: customerId,
              file_path: filePath,
              file_name: tx.file_name,
              file_size: tx.file_size,
              file_type: tx.file_type || "other",
              mime_type:
                (tx.metadata as any)?.mime_type ||
                (tx.metadata as any)?.mimeType ||
                "application/octet-stream",
              uploaded_by: tx.uploaded_by || userId,
              metadata: {
                source: "project_invoice",
                fromPurchaseOrder: !!purchaseOrderId,
                ...((tx.metadata as any) || {}),
              },
            },
          });
        } catch (attachError) {
          console.error(
            "[developer-dashboard] Failed to create invoice_attachment for path:",
            filePath,
            attachError
          );
        }
      }
    }

    res.status(201).json(invoice);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice', details: error.message });
  }
});

// Get attachments for an invoice
router.get('/projects/:projectId/invoices/:invoiceId/attachments', async (req: Request, res: Response) => {
  try {
    const { projectId, invoiceId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify invoice belongs to project
    const invoice = await prisma.project_invoices.findFirst({
      where: {
        id: invoiceId,
        projectId,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const attachmentPaths = extractAttachmentPaths(invoice.attachments);

    // Get attachments
    let attachments = await prisma.invoice_attachments.findMany({
      where: { invoice_id: invoiceId },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { uploaded_at: 'desc' },
    });

    if (attachments.length === 0 && attachmentPaths.length > 0) {
      const rebuilt = await ensureInvoiceAttachmentRecords({
        invoice,
        customerId,
        userId,
        filePaths: attachmentPaths,
      });

      if (rebuilt.length > 0) {
        attachments = rebuilt;
      }
    }

    if (attachments.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Generate signed URLs for each attachment
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (att) => {
        console.log(`[developer-dashboard] Generating signed URL for file_path: ${att.file_path}`);

        // Check if file exists before generating URL
        const fileExists = await storageService.fileExists(att.file_path);
        console.log(`[developer-dashboard] File exists check for ${att.file_path}: ${fileExists}`);

        if (!fileExists) {
          console.error(`[developer-dashboard] File not found in storage: ${att.file_path}`);
          // Return a placeholder or error URL
          return {
            id: att.id,
            fileName: att.file_name,
            fileSize: Number(att.file_size),
            fileSizeFormatted: storageService.formatBytes(Number(att.file_size)),
            fileType: att.file_type,
            mimeType: att.mime_type,
            uploadedAt: att.uploaded_at,
            uploadedBy: att.uploader,
            url: '', // Empty URL if file doesn't exist
            metadata: att.metadata,
            error: 'File not found in storage',
          };
        }

        const signedUrl = await storageService.getFileUrl(att.file_path, 3600);
        console.log(`[developer-dashboard] Generated signed URL: ${signedUrl.substring(0, 100)}...`);

        return {
          id: att.id,
          fileName: att.file_name,
          fileSize: Number(att.file_size),
          fileSizeFormatted: storageService.formatBytes(Number(att.file_size)),
          fileType: att.file_type,
          mimeType: att.mime_type,
          uploadedAt: att.uploaded_at,
          uploadedBy: att.uploader,
          url: signedUrl,
          metadata: att.metadata,
        };
      })
    );

    res.json({
      success: true,
      data: attachmentsWithUrls,
    });
  } catch (error: any) {
    console.error('Error fetching invoice attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments', details: error.message });
  }
});

// Update invoice for a project
router.put('/projects/:projectId/invoices/:invoiceId', async (req: Request, res: Response) => {
  try {
    const { projectId, invoiceId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;
    const updateData = req.body;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify invoice belongs to project
    const existingInvoice = await prisma.project_invoices.findFirst({
      where: {
        id: invoiceId,
        projectId,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Prevent editing paid invoices
    if (existingInvoice.status === 'paid' || existingInvoice.status === 'Paid') {
      return res.status(400).json({
        error: 'Cannot edit paid invoice',
        message: 'Paid invoices cannot be modified.'
      });
    }

    // Update invoice
    const updatedInvoice = await prisma.project_invoices.update({
      where: { id: invoiceId },
      data: {
        description: updateData.description,
        category: updateData.category,
        amount: updateData.amount,
        currency: updateData.currency || 'NGN',
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : null,
        notes: updateData.notes,
        vendorId: updateData.vendorId,
        updatedAt: new Date(),
      },
      include: {
        vendor: true,
        purchaseOrder: true,
      },
    });

    console.log(`[developer-dashboard] Invoice updated: ${invoiceId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice', details: error.message });
  }
});

// Delete invoice for a project
router.delete('/projects/:projectId/invoices/:invoiceId', async (req: Request, res: Response) => {
  try {
    const { projectId, invoiceId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify invoice belongs to project
    const invoice = await prisma.project_invoices.findFirst({
      where: {
        id: invoiceId,
        projectId,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if invoice is already paid - prevent deletion of paid invoices
    if (invoice.status === 'paid' || invoice.status === 'Paid') {
      return res.status(400).json({
        error: 'Cannot delete paid invoice',
        message: 'Paid invoices cannot be deleted. Please contact support if you need to reverse this transaction.'
      });
    }

    // Get all attachments for this invoice to delete from storage
    const attachments = await prisma.invoice_attachments.findMany({
      where: { invoice_id: invoiceId },
    });

    // Delete files from Digital Ocean Spaces
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          await storageService.deleteFile(customerId, attachment.file_path);
          console.log(`[developer-dashboard] Deleted file from storage: ${attachment.file_path}`);
        } catch (storageError) {
          console.error(`[developer-dashboard] Failed to delete file from storage: ${attachment.file_path}`, storageError);
          // Continue with deletion even if storage deletion fails
        }
      }
    }

    // Delete invoice (cascade will delete invoice_attachments via FK constraint)
    await prisma.project_invoices.delete({
      where: { id: invoiceId },
    });

    console.log(`[developer-dashboard] Invoice deleted: ${invoiceId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice', details: error.message });
  }
});

// ============================================
// Approve Invoice
// ============================================
router.post('/projects/:projectId/invoices/:invoiceId/approve', async (req: Request, res: Response) => {
  try {
    const { projectId, invoiceId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get the invoice
    const invoice = await prisma.project_invoices.findFirst({
      where: {
        id: invoiceId,
        projectId,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Cannot approve a paid invoice' });
    }

    if (invoice.status === 'approved') {
      return res.status(400).json({ error: 'Invoice is already approved' });
    }

    // Update invoice status to approved
    const updatedInvoice = await prisma.project_invoices.update({
      where: { id: invoiceId },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        vendor: true,
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ Invoice ${invoiceId} approved by user ${userId}`);

    res.json({
      message: 'Invoice approved successfully',
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error approving invoice:', error);
    res.status(500).json({ error: 'Failed to approve invoice', details: error.message });
  }
});

// ============================================
// Reject Invoice
// ============================================
router.post('/projects/:projectId/invoices/:invoiceId/reject', async (req: Request, res: Response) => {
  try {
    const { projectId, invoiceId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;
    const { reason } = req.body;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get the invoice
    const invoice = await prisma.project_invoices.findFirst({
      where: {
        id: invoiceId,
        projectId,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Cannot reject a paid invoice' });
    }

    // Update invoice status to rejected
    const updatedInvoice = await prisma.project_invoices.update({
      where: { id: invoiceId },
      data: {
        status: 'rejected',
        notes: reason ? `Rejected: ${reason}` : invoice.notes,
      },
      include: {
        vendor: true,
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`❌ Invoice ${invoiceId} rejected by user ${userId}`);

    res.json({
      message: 'Invoice rejected successfully',
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error rejecting invoice:', error);
    res.status(500).json({ error: 'Failed to reject invoice', details: error.message });
  }
});

// ============================================
// Mark Invoice as Paid and Create Expense
// ============================================
router.post('/projects/:projectId/invoices/:invoiceId/mark-paid', async (req: Request, res: Response) => {
  try {
    const { projectId, invoiceId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;
    const {
      paymentMethod,
      paymentReference,
      paidDate,
      notes,
    } = req.body;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get the invoice
    const invoice = await prisma.project_invoices.findFirst({
      where: {
        id: invoiceId,
        projectId,
      },
      include: {
        vendor: true,
        purchaseOrder: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice is already marked as paid' });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update invoice status to paid
      const updatedInvoice = await tx.project_invoices.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidDate: paidDate ? new Date(paidDate) : new Date(),
          paymentMethod: paymentMethod || null,
        },
      });

      // 2. Check if expense already exists for this invoice
      const existingExpense = await tx.project_expenses.findFirst({
        where: {
          projectId,
          invoiceNumber: invoice.invoiceNumber,
        },
      });

      let expense;
      if (!existingExpense) {
        // 3. Create expense automatically
        expense = await tx.project_expenses.create({
          data: {
            projectId,
            vendorId: invoice.vendorId || null,
            amount: invoice.amount,
            currency: invoice.currency,
            taxAmount: 0,
            totalAmount: invoice.amount,
            expenseType: 'invoice',
            category: invoice.category,
            invoiceNumber: invoice.invoiceNumber,
            description: invoice.description || `Payment for invoice ${invoice.invoiceNumber}`,
            invoiceDate: invoice.createdAt,
            dueDate: invoice.dueDate,
            paidDate: paidDate ? new Date(paidDate) : new Date(),
            status: 'approved',
            paymentStatus: 'paid',
            paymentMethod: paymentMethod || null,
            paymentReference: paymentReference || null,
            approvedBy: userId,
            approvedAt: new Date(),
            notes: notes || `Auto-created from invoice ${invoice.invoiceNumber}`,
          },
        });
      } else {
        expense = existingExpense;
      }

      return { invoice: updatedInvoice, expense };
    });

    res.json({
      message: 'Invoice marked as paid and expense created successfully',
      invoice: result.invoice,
      expense: result.expense,
    });
  } catch (error: any) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({ error: 'Failed to mark invoice as paid', details: error.message });
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
        // Team members can access all customer projects
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
        // Team members can access all customer projects
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
        // Team members can access all customer projects
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

    console.log('💰 Creating funding for project:', projectId);
    console.log('👤 User ID:', userId, 'Customer ID:', customerId);
    console.log('📦 Request body:', req.body);

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!project) {
      console.log('❌ Project not found:', projectId);
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('✅ Project found:', project.name);

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

    // Validate required fields
    if (!amount || !fundingType) {
      console.log('❌ Missing required fields:', { amount, fundingType });
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Amount and funding type are required'
      });
    }

    // If referenceNumber is provided, check if it already exists
    if (referenceNumber) {
      const existingFunding = await prisma.project_funding.findUnique({
        where: { referenceNumber }
      });

      if (existingFunding) {
        console.log('❌ Duplicate reference number:', referenceNumber);
        return res.status(409).json({
          error: 'Duplicate reference number',
          details: 'A funding record with this reference number already exists'
        });
      }
    }

    console.log('📝 Creating funding record...');

    const funding = await prisma.project_funding.create({
      data: {
        projectId,
        customerId,
        amount: parseFloat(amount),
        currency,
        fundingType,
        fundingSource: fundingSource || null,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
        status,
        referenceNumber: referenceNumber || null,
        description: description || null,
        notes: notes || null,
        createdBy: userId
      }
    });

    console.log('✅ Funding created successfully:', funding.id);

    res.status(201).json(funding);
  } catch (error: any) {
    console.error('❌ Error creating funding:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    console.error('Error stack:', error.stack);

    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        details: `A funding record with this ${error.meta?.target?.[0]} already exists`,
        field: error.meta?.target
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Invalid reference',
        details: 'The project or customer ID does not exist',
        field: error.meta?.field_name
      });
    }

    res.status(500).json({
      error: 'Failed to create funding record',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/developer-dashboard/projects/:projectId/funding/:fundingId
 * Update a funding record
 */
router.put('/projects/:projectId/funding/:fundingId', async (req: Request, res: Response) => {
  try {
    const { projectId, fundingId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    console.log('💰 Updating funding:', fundingId, 'for project:', projectId);

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify funding exists and belongs to this project
    const existingFunding = await prisma.project_funding.findFirst({
      where: {
        id: fundingId,
        projectId,
      },
    });

    if (!existingFunding) {
      return res.status(404).json({ error: 'Funding record not found' });
    }

    const {
      amount,
      fundingType,
      fundingSource,
      expectedDate,
      receivedDate,
      status,
      referenceNumber,
      description,
      notes
    } = req.body;

    // Update the funding record
    const updatedFunding = await prisma.project_funding.update({
      where: { id: fundingId },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        fundingType,
        fundingSource,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
        status,
        referenceNumber,
        description,
        notes,
        updatedAt: new Date(),
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } }
      },
    });

    console.log('✅ Funding updated successfully:', updatedFunding.id);
    res.json(updatedFunding);
  } catch (error: any) {
    console.error('❌ Error updating funding:', error);
    res.status(500).json({
      error: 'Failed to update funding record',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/developer-dashboard/projects/:projectId/funding/:fundingId/status
 * Update funding status only
 */
router.patch('/projects/:projectId/funding/:fundingId/status', async (req: Request, res: Response) => {
  try {
    const { projectId, fundingId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    console.log('💰 Updating funding status:', fundingId, 'to:', status);

    // Validate status
    const validStatuses = ['pending', 'received', 'partial', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        details: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify funding exists and belongs to this project
    const existingFunding = await prisma.project_funding.findFirst({
      where: {
        id: fundingId,
        projectId,
      },
    });

    if (!existingFunding) {
      return res.status(404).json({ error: 'Funding record not found' });
    }

    // Update status and set receivedDate if status is 'received' and not already set
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'received' && !existingFunding.receivedDate) {
      updateData.receivedDate = new Date();
    }

    const updatedFunding = await prisma.project_funding.update({
      where: { id: fundingId },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } }
      },
    });

    console.log('✅ Funding status updated successfully');
    res.json(updatedFunding);
  } catch (error: any) {
    console.error('❌ Error updating funding status:', error);
    res.status(500).json({
      error: 'Failed to update funding status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
        // Team members can access all customer projects
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
        // Team members can access all customer projects
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
        // Team members can access all customer projects
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
        // Team members can access all customer projects
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

// ============================================
// Recent Activity
// ============================================

router.get('/projects/:projectId/recent-activity', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = parseInt(req.query.skip as string) || 0;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fetch ALL recent activities first (we'll paginate after combining)
    // Fetch recent expenses
    const recentExpenses = await prisma.project_expenses.findMany({
      where: { projectId },
      include: {
        approver: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch recent funding
    const recentFunding = await prisma.project_funding.findMany({
      where: { projectId },
      include: {
        creator: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch recent budget changes (newly created or updated budget items)
    const recentBudgetItems = await prisma.budget_line_items.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });

    // Combine and format all activities
    const activities: any[] = [];

    // Add expenses
    recentExpenses.forEach(expense => {
      activities.push({
        id: `expense-${expense.id}`,
        type: 'expense',
        description: `Expense: ${expense.description || expense.category}`,
        amount: expense.totalAmount,
        currency: expense.currency,
        user: expense.approver?.name || 'System',
        timestamp: expense.createdAt,
        status: expense.paymentStatus,
        metadata: {
          category: expense.category,
          paymentStatus: expense.paymentStatus,
          paidDate: expense.paidDate,
        }
      });
    });

    // Add funding
    recentFunding.forEach(funding => {
      activities.push({
        id: `funding-${funding.id}`,
        type: 'funding',
        description: `Funding: ${funding.description || funding.fundingType}`,
        amount: funding.amount,
        currency: funding.currency,
        user: funding.creator?.name || 'Unknown',
        timestamp: funding.createdAt,
        status: funding.status,
        metadata: {
          fundingType: funding.fundingType,
          fundingSource: funding.fundingSource,
          status: funding.status,
          receivedDate: funding.receivedDate,
        }
      });
    });

    // Add budget items
    recentBudgetItems.forEach(item => {
      const isNew = item.createdAt.getTime() === item.updatedAt.getTime();
      activities.push({
        id: `budget-${item.id}`,
        type: 'budget',
        description: isNew
          ? `Budget created: ${item.category}`
          : `Budget updated: ${item.category}`,
        amount: item.plannedAmount,
        currency: project.currency,
        user: 'System',
        timestamp: item.updatedAt,
        status: 'completed',
        metadata: {
          category: item.category,
          plannedAmount: item.plannedAmount,
          actualAmount: item.actualAmount,
          variance: item.variance,
        }
      });
    });

    // Sort by timestamp (most recent first)
    // Handle both Date objects and ISO strings
    activities.sort((a, b) => {
      const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });

    // Convert Date objects to ISO strings for JSON serialization
    activities.forEach(activity => {
      if (activity.timestamp instanceof Date) {
        activity.timestamp = activity.timestamp.toISOString();
      }
    });

    // Apply pagination
    const totalActivities = activities.length;
    const paginatedActivities = activities.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalActivities / limit);
    const currentPage = Math.floor(skip / limit) + 1;

    res.json({
      activities: paginatedActivities,
      total: totalActivities,
      page: currentPage,
      limit: limit,
      totalPages: totalPages,
      hasMore: skip + limit < totalActivities,
    });

  } catch (error: any) {
    console.error('Error fetching recent activity:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({
      error: 'Failed to fetch recent activity',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// Reports & Analytics
// ============================================

/**
 * GET /api/developer-dashboard/projects/:projectId/reports
 * Get comprehensive reports data for a project
 */
router.get('/projects/:projectId/reports', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { period = 'last-6-months' } = req.query;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    console.log(`📊 Fetching reports for project: ${projectId}`);
    console.log(`👤 User ID: ${userId}, Customer ID: ${customerId}`);

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!project) {
      console.log(`❌ Project not found: ${projectId}`);
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log(`✅ Project found: ${project.name}`);

    // Get budget items
    const budgetItems = await prisma.budget_line_items.findMany({
      where: { projectId },
    });

    console.log(`📋 Budget items found: ${budgetItems.length}`);

    // Get all expenses
    const expenses = await prisma.project_expenses.findMany({
      where: { projectId },
      include: {
        vendor: true,
      },
    });

    console.log(`💰 Expenses found: ${expenses.length}`);

    // Calculate summary
    const totalBudget = budgetItems.reduce((sum, item) => sum + item.plannedAmount, 0);
    const totalSpent = expenses
      .filter(e => e.paymentStatus === 'paid')
      .reduce((sum, e) => sum + e.totalAmount, 0);
    const remaining = totalBudget - totalSpent;
    const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const summary = {
      totalBudget,
      totalSpent,
      remaining,
      percentageUsed,
      totalExpenses: expenses.length,
      paidExpenses: expenses.filter(e => e.paymentStatus === 'paid').length,
      pendingExpenses: expenses.filter(e => e.paymentStatus === 'pending').length,
      overdueExpenses: expenses.filter(e => {
        return e.paymentStatus !== 'paid' && e.dueDate && new Date(e.dueDate) < new Date();
      }).length,
    };

    // Calculate cash flow (last 6 months) - convert expenses to invoice format
    const expensesAsInvoices = expenses.map(expense => ({
      amount: expense.totalAmount,
      status: expense.paymentStatus === 'paid' ? 'paid' : (expense.status === 'approved' ? 'approved' : 'pending'),
      paidDate: expense.paidDate,
      dueDate: expense.dueDate,
      createdAt: expense.createdAt,
    }));
    const cashFlow = calculateMonthlyCashFlow(expensesAsInvoices, project.startDate);

    // Calculate cost breakdown by category
    const categoryTotals: { [key: string]: number } = {};
    expenses
      .filter(e => e.paymentStatus === 'paid')
      .forEach(expense => {
        if (!categoryTotals[expense.category]) {
          categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.totalAmount;
      });

    const colors = ['#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#6b7280'];
    const costBreakdown = Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
      percentage: totalSpent > 0 ? (value / totalSpent) * 100 : 0,
    }));

    // Calculate vendor performance with real metrics
    const vendorStats: { [key: string]: any } = {};

    // Get vendor details including ratings
    const projectVendors = await prisma.project_vendors.findMany({
      where: {
        customerId,
      },
      select: {
        id: true,
        name: true,
        rating: true,
        status: true,
      },
    });

    // Create vendor lookup map
    const vendorMap: { [key: string]: any } = {};
    projectVendors.forEach(v => {
      vendorMap[v.id] = v;
    });

    expenses.forEach(expense => {
      if (!expense.vendorId || !expense.vendor) return;

      if (!vendorStats[expense.vendorId]) {
        const vendorInfo = vendorMap[expense.vendorId];
        vendorStats[expense.vendorId] = {
          vendor: expense.vendor.name,
          vendorId: expense.vendorId,
          rating: vendorInfo?.rating || null,
          totalOrders: 0,
          totalSpent: 0,
          budgetedAmount: 0,
          onTimeDeliveries: 0,
          lateDeliveries: 0,
          approvedExpenses: 0,
          rejectedExpenses: 0,
        };
      }

      vendorStats[expense.vendorId].totalOrders += 1;

      if (expense.paymentStatus === 'paid') {
        vendorStats[expense.vendorId].totalSpent += expense.totalAmount;
      }

      // Track approval status for quality metric
      if (expense.status === 'approved' || expense.status === 'paid') {
        vendorStats[expense.vendorId].approvedExpenses += 1;
      } else if (expense.status === 'rejected') {
        vendorStats[expense.vendorId].rejectedExpenses += 1;
      }

      // Check if delivered on time
      if (expense.dueDate && expense.paidDate) {
        if (new Date(expense.paidDate) <= new Date(expense.dueDate)) {
          vendorStats[expense.vendorId].onTimeDeliveries += 1;
        } else {
          vendorStats[expense.vendorId].lateDeliveries += 1;
        }
      }

      // Track budgeted amount for cost efficiency
      if (expense.budgetLineItemId) {
        const budgetItem = budgetItems.find(b => b.id === expense.budgetLineItemId);
        if (budgetItem) {
          vendorStats[expense.vendorId].budgetedAmount += budgetItem.plannedAmount;
        }
      }
    });

    const vendorPerformance = Object.values(vendorStats).map((vendor: any) => {
      // 1. On-Time Delivery % (Real data from due dates vs paid dates)
      const totalDeliveries = vendor.onTimeDeliveries + vendor.lateDeliveries;
      const onTimePercent = totalDeliveries > 0
        ? (vendor.onTimeDeliveries / totalDeliveries) * 100
        : 0;

      // 2. Quality Score (Based on vendor rating and approval rate)
      let qualityScore = 0;
      if (vendor.rating) {
        // Convert 5-star rating to percentage (e.g., 4.5 stars = 90%)
        qualityScore = (vendor.rating / 5) * 100;
      } else {
        // Fallback: Calculate from approval rate
        const totalProcessed = vendor.approvedExpenses + vendor.rejectedExpenses;
        if (totalProcessed > 0) {
          qualityScore = (vendor.approvedExpenses / totalProcessed) * 100;
        } else {
          qualityScore = 85; // Default for new vendors with no history
        }
      }

      // 3. Cost Efficiency % (Actual cost vs budgeted cost)
      let costEfficiency = 0;
      if (vendor.budgetedAmount > 0 && vendor.totalSpent > 0) {
        // If spent less than budget, efficiency is high
        // If spent more than budget, efficiency is low
        const costRatio = vendor.totalSpent / vendor.budgetedAmount;
        if (costRatio <= 1) {
          // Under or on budget: 90-100% efficiency
          costEfficiency = 100 - (costRatio * 10);
        } else {
          // Over budget: decreasing efficiency
          costEfficiency = Math.max(0, 100 - ((costRatio - 1) * 50));
        }
      } else {
        // Default: assume good cost efficiency if no budget data
        costEfficiency = 88;
      }

      return {
        vendor: vendor.vendor,
        vendorId: vendor.vendorId,
        onTime: Math.round(onTimePercent),
        quality: Math.round(qualityScore),
        cost: Math.round(costEfficiency),
        totalOrders: vendor.totalOrders,
        totalSpent: vendor.totalSpent,
      };
    });

    console.log(`👥 Vendor performance calculated for ${vendorPerformance.length} vendors`);

    // Calculate phase spending
    const phaseSpending = budgetItems.map(item => {
      const actualAmount = expenses
        .filter(e => e.category === item.category && e.paymentStatus === 'paid')
        .reduce((sum, e) => sum + e.totalAmount, 0);

      const variance = actualAmount - item.plannedAmount;
      const variancePercent = item.plannedAmount > 0 ? (variance / item.plannedAmount) * 100 : 0;

      return {
        phase: item.category,
        budget: item.plannedAmount,
        actual: actualAmount,
        variance,
        variancePercent,
      };
    });

    // Safely construct response data
    const responseData = {
      summary: summary || {},
      cashFlow: cashFlow || [],
      costBreakdown: costBreakdown || [],
      vendorPerformance: vendorPerformance || [],
      phaseSpend: phaseSpending || [],
      currency: project?.currency || 'NGN', // Include project currency with safe access
      projectName: project?.name || 'Unknown Project', // Include project name with safe access
    };

    console.log(`📊 Reports summary:`, {
      totalBudget: summary?.totalBudget || 0,
      totalSpent: summary?.totalSpent || 0,
      remaining: summary?.remaining || 0,
      totalExpenses: summary?.totalExpenses || 0,
      cashFlowMonths: cashFlow?.length || 0,
      costCategories: costBreakdown?.length || 0,
      vendors: vendorPerformance?.length || 0,
      phases: phaseSpending?.length || 0,
      currency: project?.currency || 'NGN',
    });

    res.json(responseData);
  } catch (error: any) {
    console.error('❌ Error fetching reports data:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Return detailed error in development
    const isDevelopment = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      error: 'Failed to fetch reports data',
      ...(isDevelopment && {
        details: error.message,
        stack: error.stack
      })
    });
  }
});

/**
 * GET /api/developer-dashboard/projects/:projectId/reports/cashflow
 * Get cash flow data for a project
 */
router.get('/projects/:projectId/reports/cashflow', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        // Team members can access all customer projects
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const expenses = await prisma.project_expenses.findMany({
      where: { projectId },
    });

    // Convert expenses to invoice format for calculateMonthlyCashFlow
    const expensesAsInvoices = expenses.map(expense => ({
      amount: expense.totalAmount,
      status: expense.paymentStatus === 'paid' ? 'paid' : expense.status,
      paidDate: expense.paidDate,
      dueDate: expense.dueDate,
      createdAt: expense.createdAt,
    }));

    const cashFlow = calculateMonthlyCashFlow(expensesAsInvoices, project.startDate);

    res.json(cashFlow);
  } catch (error: any) {
    console.error('Error fetching cash flow data:', error);
    res.status(500).json({ error: 'Failed to fetch cash flow data' });
  }
});

export default router;

