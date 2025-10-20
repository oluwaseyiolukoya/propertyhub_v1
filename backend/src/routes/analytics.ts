import express, { Response } from 'express';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

// Get analytics overview (supports period parameter)
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const period = req.query.period as string || '30d';
    
    // Calculate date range based on period
    let startDate = new Date();
    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (period === '1y') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Get counts
    const totalCustomers = await prisma.customer.count();
    const activeCustomers = await prisma.customer.count({ where: { status: 'active' } });
    const trialCustomers = await prisma.customer.count({ where: { status: 'trial' } });
    
    // Get customers in period
    const customersInPeriod = await prisma.customer.count({
      where: { createdAt: { gte: startDate } }
    });
    
    // Get previous period for comparison
    const previousStartDate = new Date(startDate);
    const daysDiff = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
    
    const customersInPreviousPeriod = await prisma.customer.count({
      where: { 
        createdAt: { 
          gte: previousStartDate,
          lt: startDate
        }
      }
    });

    // Calculate growth percentage
    const customerGrowth = customersInPreviousPeriod > 0 
      ? ((customersInPeriod - customersInPreviousPeriod) / customersInPreviousPeriod) * 100
      : 0;

    // Get revenue
    const monthlyRecurringRevenue = await prisma.customer.aggregate({
      where: { status: 'active' },
      _sum: { mrr: true }
    });

    const totalRevenue = await prisma.invoice.aggregate({
      where: { 
        status: 'paid',
        createdAt: { gte: startDate }
      },
      _sum: { amount: true }
    });

    const previousRevenue = await prisma.invoice.aggregate({
      where: { 
        status: 'paid',
        createdAt: { 
          gte: previousStartDate,
          lt: startDate
        }
      },
      _sum: { amount: true }
    });

    const revenueGrowth = previousRevenue._sum.amount && previousRevenue._sum.amount > 0
      ? ((totalRevenue._sum.amount || 0) - previousRevenue._sum.amount) / previousRevenue._sum.amount * 100
      : 0;

    // Get user stats
    const totalUsers = await prisma.user.count();
    const totalProperties = await prisma.property.count();

    // Get recent data for charts
    const recentCustomers = await prisma.customer.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        company: true,
        owner: true,
        status: true,
        createdAt: true,
        mrr: true
      }
    });

    // Get daily stats for charts
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as customers,
        SUM(mrr) as revenue
      FROM customers
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return res.json({
      period,
      overview: {
        totalCustomers,
        activeCustomers,
        trialCustomers,
        totalUsers,
        totalProperties,
        mrr: monthlyRecurringRevenue._sum.mrr || 0,
        revenue: totalRevenue._sum.amount || 0,
        customerGrowth: Math.round(customerGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100
      },
      recentCustomers,
      dailyStats
    });

  } catch (error: any) {
    console.error('Analytics overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// Get dashboard analytics
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    // Get counts
    const totalCustomers = await prisma.customer.count();
    const activeCustomers = await prisma.customer.count({ where: { status: 'active' } });
    const trialCustomers = await prisma.customer.count({ where: { status: 'trial' } });
    const totalUsers = await prisma.user.count();
    const totalProperties = await prisma.property.count();
    const totalUnits = await prisma.unit.count();

    // Get revenue
    const paidInvoices = await prisma.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true }
    });

    const monthlyRecurringRevenue = await prisma.customer.aggregate({
      where: { status: 'active' },
      _sum: { mrr: true }
    });

    // Get recent activity
    const recentCustomers = await prisma.customer.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        company: true,
        owner: true,
        status: true,
        createdAt: true
      }
    });

    // Get customer growth (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const customerGrowth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM customers
      WHERE "createdAt" >= ${twelveMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `;

    // Get plan distribution
    const planDistribution = await prisma.customer.groupBy({
      by: ['planId'],
      _count: true,
      where: {
        planId: { not: null }
      }
    });

    // Get plans for distribution
    const plans = await prisma.plan.findMany({
      select: { id: true, name: true }
    });

    const planStats = planDistribution.map(pd => {
      const plan = plans.find(p => p.id === pd.planId);
      return {
        planId: pd.planId,
        planName: plan?.name || 'Unknown',
        count: pd._count
      };
    });

    return res.json({
      overview: {
        totalCustomers,
        activeCustomers,
        trialCustomers,
        totalUsers,
        totalProperties,
        totalUnits,
        totalRevenue: paidInvoices._sum.amount || 0,
        mrr: monthlyRecurringRevenue._sum.mrr || 0
      },
      recentCustomers,
      customerGrowth,
      planDistribution: planStats
    });

  } catch (error: any) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get system health
router.get('/system-health', async (req: AuthRequest, res: Response) => {
  try {
    // Database check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Get database stats
    const dbStats = await prisma.$queryRaw`
      SELECT 
        pg_database_size(current_database()) as size,
        (SELECT count(*) FROM pg_stat_activity) as connections
    ` as any[];

    // Get error logs (from activity logs)
    const errorLogs = await prisma.activityLog.count({
      where: {
        action: 'error',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return res.json({
      status: 'healthy',
      uptime: process.uptime(),
      database: {
        status: 'connected',
        latency: dbLatency,
        size: dbStats[0]?.size || 0,
        connections: dbStats[0]?.connections || 0
      },
      memory: process.memoryUsage(),
      errorLogs,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('System health error:', error);
    return res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Get activity logs
router.get('/activity-logs', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, customerId, userId, entity, action } = req.query;

    const where: any = {};
    if (customerId) where.customerId = customerId as string;
    if (userId) where.userId = userId as string;
    if (entity) where.entity = entity as string;
    if (action) where.action = action as string;

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            company: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    return res.json(logs);

  } catch (error: any) {
    console.error('Activity logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;


