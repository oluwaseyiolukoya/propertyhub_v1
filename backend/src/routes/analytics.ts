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
    let dailyStats: any[] = [];
    try {
      dailyStats = await prisma.$queryRaw`
        SELECT
          DATE("createdAt") as date,
          COUNT(*) as customers,
          SUM(mrr) as revenue
        FROM customers
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      ` as any[];
    } catch (e: any) {
      // Fallback when using mock DB or no SQL support
      const recent = await prisma.customer.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true, mrr: true } });
      const bucket: Record<string, { customers: number; revenue: number }> = {};
      for (const c of recent) {
        const d = new Date(c.createdAt).toISOString().split('T')[0];
        if (!bucket[d]) bucket[d] = { customers: 0, revenue: 0 };
        bucket[d].customers += 1;
        bucket[d].revenue += Number(c.mrr || 0);
      }
      dailyStats = Object.entries(bucket)
        .map(([date, v]) => ({ date, customers: v.customers, revenue: v.revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

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
    // Graceful fallback response
    return res.json({
      period: req.query.period || '30d',
      overview: {
        totalCustomers: 0,
        activeCustomers: 0,
        trialCustomers: 0,
        totalUsers: 0,
        totalProperties: 0,
        mrr: 0,
        revenue: 0,
        customerGrowth: 0,
        revenueGrowth: 0
      },
      recentCustomers: [],
      dailyStats: []
    });
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

    let customerGrowth: any[] = [];
    try {
      customerGrowth = await prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count
        FROM customers
        WHERE "createdAt" >= ${twelveMonthsAgo}
        GROUP BY month
        ORDER BY month ASC
      ` as any[];
    } catch (e: any) {
      // Fallback: group in JS
      const recent = await prisma.customer.findMany({ where: { createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true } });
      const bucket: Record<string, number> = {};
      for (const c of recent) {
        const d = new Date(c.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        bucket[key] = (bucket[key] || 0) + 1;
      }
      customerGrowth = Object.entries(bucket)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));
    }

    // Get plan distribution
    let planDistribution: any[] = [];
    try {
      planDistribution = await prisma.customer.groupBy({
        by: ['planId'],
        _count: true,
        where: {
          planId: { not: null }
        }
      });
    } catch (e: any) {
      // Fallback when groupBy unsupported in mock
      const all = await prisma.customer.findMany({ select: { planId: true } });
      const bucket: Record<string, number> = {};
      for (const c of all) {
        if (!c.planId) continue;
        bucket[c.planId] = (bucket[c.planId] || 0) + 1;
      }
      planDistribution = Object.entries(bucket).map(([planId, count]) => ({ planId, _count: count }));
    }

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
    // Graceful fallback
    return res.json({
      overview: {
        totalCustomers: 0,
        activeCustomers: 0,
        trialCustomers: 0,
        totalUsers: 0,
        totalProperties: 0,
        totalUnits: 0,
        totalRevenue: 0,
        mrr: 0
      },
      recentCustomers: [],
      customerGrowth: [],
      planDistribution: []
    });
  }
});

// Get system health
router.get('/system-health', async (req: AuthRequest, res: Response) => {
  try {
    // Database check
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {}
    const dbLatency = Date.now() - dbStart;

    // Get database stats
    let dbStats: any[] = [];
    try {
      dbStats = await prisma.$queryRaw`
        SELECT
          pg_database_size(current_database()) as size,
          (SELECT count(*) FROM pg_stat_activity) as connections
      ` as any[];
    } catch (e: any) {
      // Fallback defaults when not using PostgreSQL or in mock mode
      dbStats = [{ size: 0, connections: 0 }];
    }

    // Get error logs (from activity logs)
    let errorLogs = 0;
    try {
      errorLogs = await prisma.activity_logs.count({
        where: {
          action: 'error',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
    } catch {
      errorLogs = 0;
    }

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
    return res.json({
      status: 'unhealthy',
      uptime: process.uptime(),
      database: {
        status: 'disconnected',
        latency: null,
        size: 0,
        connections: 0
      },
      memory: process.memoryUsage(),
      errorLogs: 0,
      timestamp: new Date().toISOString()
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

    const logs = await prisma.activity_logs.findMany({
      where,
      include: {
        customers: {
          select: {
            id: true,
            company: true
          }
        },
        users: {
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


