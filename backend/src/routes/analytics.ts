import express, { Response } from 'express';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

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


