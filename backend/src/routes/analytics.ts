import express, { Response } from 'express';
import os from 'os';
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

    // Get counts - FIXED: Use correct table names
    const totalCustomers = await prisma.customers.count();
    console.log('📊 Analytics Overview - Total Customers:', totalCustomers);
    const activeCustomers = await prisma.customers.count({ where: { status: 'active' } });
    console.log('📊 Analytics Overview - Active Customers:', activeCustomers);
    const trialCustomers = await prisma.customers.count({ where: { status: 'trial' } });
    console.log('📊 Analytics Overview - Trial Customers:', trialCustomers);

    // Get customers in period
    const customersInPeriod = await prisma.customers.count({
      where: { createdAt: { gte: startDate } }
    });

    // Get previous period for comparison
    const previousStartDate = new Date(startDate);
    const daysDiff = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);

    const customersInPreviousPeriod = await prisma.customers.count({
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
      : customersInPeriod > 0 ? 100 : 0;

    // Get revenue
    const monthlyRecurringRevenue = await prisma.customers.aggregate({
      where: { status: { in: ['active', 'trial'] } },
      _sum: { mrr: true }
    });

    const totalRevenue = await prisma.invoices.aggregate({
      where: {
        status: 'paid',
        createdAt: { gte: startDate }
      },
      _sum: { amount: true }
    });

    const previousRevenue = await prisma.invoices.aggregate({
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
      : (totalRevenue._sum.amount || 0) > 0 ? 100 : 0;

    // Get user stats - FIXED: Use correct table names
    const totalUsers = await prisma.users.count({ where: { isActive: true } });
    console.log('📊 Analytics Overview - Total Users:', totalUsers);
    let totalProperties = await prisma.properties.count();
    console.log('📊 Analytics Overview - Total Properties (raw):', totalProperties);
    // Fallback: if there are no property rows yet (fresh environment),
    // derive an approximate total from customers.propertiesCount
    if (totalProperties === 0) {
      try {
        const agg = await prisma.customers.aggregate({ _sum: { propertiesCount: true } });
        totalProperties = Number(agg._sum.propertiesCount || 0);
        console.log('📊 Analytics Overview - Total Properties (fallback):', totalProperties);
      } catch {}
    }

    // Get recent data for charts
    const recentCustomers = await prisma.customers.findMany({
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
      console.log('⚠️ Raw SQL query failed, using fallback for daily stats:', e.message);
      const recent = await prisma.customers.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true, mrr: true } });
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

    console.log('📊 Analytics Overview - MRR:', monthlyRecurringRevenue._sum.mrr || 0);
    console.log('📊 Analytics Overview - Revenue:', totalRevenue._sum.amount || 0);

    const responseData = {
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
    };

    console.log('✅ Analytics overview response:', JSON.stringify(responseData, null, 2));
    return res.json(responseData);

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
    // Get counts - FIXED: Use correct table names
    const totalCustomers = await prisma.customers.count();
    const activeCustomers = await prisma.customers.count({ where: { status: 'active' } });
    const trialCustomers = await prisma.customers.count({ where: { status: 'trial' } });
    const totalUsers = await prisma.users.count({ where: { isActive: true } });
    const totalProperties = await prisma.properties.count();
    const totalUnits = await prisma.units.count();

    // Get revenue
    const paidInvoices = await prisma.invoices.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true }
    });

    const monthlyRecurringRevenue = await prisma.customers.aggregate({
      where: { status: { in: ['active', 'trial'] } },
      _sum: { mrr: true }
    });

    // Get recent activity
    const recentCustomers = await prisma.customers.findMany({
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
      const recent = await prisma.customers.findMany({ where: { createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true } });
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
      planDistribution = await prisma.customers.groupBy({
        by: ['planId'],
        _count: true,
        where: {
          planId: { not: null }
        }
      });
    } catch (e: any) {
      // Fallback when groupBy unsupported in mock
      const all = await prisma.customers.findMany({ select: { planId: true } });
      const bucket: Record<string, number> = {};
      for (const c of all) {
        if (!c.planId) continue;
        bucket[c.planId] = (bucket[c.planId] || 0) + 1;
      }
      planDistribution = Object.entries(bucket).map(([planId, count]) => ({ planId, _count: count }));
    }

    // Get plans for distribution
    const plans = await prisma.plans.findMany({
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
    // Env-aware health mode and caching
    const NODE_ENV = process.env.NODE_ENV || 'development';
    const HEALTH_MODE = (process.env.HEALTH_MODE || (NODE_ENV === 'production' ? 'live' : 'hybrid')).toLowerCase();
    const HEALTH_CACHE_TTL_MS = Number(process.env.HEALTH_CACHE_TTL_MS || 30000);

    // Simple in-memory cache (module scope)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!global.__healthCache) global.__healthCache = { data: null, at: 0 };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const cache = global.__healthCache as { data: any; at: number };

    const now = Date.now();
    const cacheValid = cache.data && now - cache.at < HEALTH_CACHE_TTL_MS;
    if (cacheValid) {
      return res.json({ ...cache.data, cached: true });
    }

    const resp: any = {
      environment: NODE_ENV,
      mode: HEALTH_MODE,
      cacheTtlMs: HEALTH_CACHE_TTL_MS,
      cached: false,
      timestamp: new Date().toISOString(),
    };

    // Always-on cheap live checks
    // Database ping (live)
    let dbLatency = null;
    let dbSize = 0;
    let dbConnections = 0;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch {}

    if (HEALTH_MODE === 'live' || HEALTH_MODE === 'hybrid') {
      try {
        const rows = await prisma.$queryRaw`
          SELECT
            pg_database_size(current_database()) as size,
            (SELECT count(*) FROM pg_stat_activity) as connections
        ` as any[];
        dbSize = rows?.[0]?.size || 0;
        dbConnections = rows?.[0]?.connections || 0;
      } catch {
        // hybrid: tolerate missing stats
      }
    }

    resp.database = {
      status: dbLatency !== null ? 'connected' : 'unknown',
      latency: dbLatency,
      size: dbSize,
      connections: dbConnections,
      isSimulated: HEALTH_MODE !== 'live' && (dbLatency === null || (dbSize === 0 && dbConnections === 0))
    };

    // Process & memory (live)
    resp.memory = {
      ...process.memoryUsage(),
      isSimulated: false
    };

    // CPU/load (live, aggregated)
    try {
      const load = os.loadavg();
      const cpu = process.cpuUsage();
      resp.cpu = {
        load1: Number(load?.[0] || 0).toFixed(2),
        load5: Number(load?.[1] || 0).toFixed(2),
        load15: Number(load?.[2] || 0).toFixed(2),
        userMs: Math.round((cpu.user || 0) / 1000),
        systemMs: Math.round((cpu.system || 0) / 1000),
        isSimulated: false
      };
    } catch {
      resp.cpu = { load1: 0, load5: 0, load15: 0, userMs: 0, systemMs: 0, isSimulated: true };
    }

    // Event loop lag (hybrid/live only, guarded for Node versions without monitorEventLoopDelay)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const perf = require('perf_hooks');
      if (typeof perf.monitorEventLoopDelay === 'function') {
        const h = perf.monitorEventLoopDelay({ resolution: 10 });
        h.enable();
        await new Promise(r => setTimeout(r, 25));
        h.disable();
        resp.eventLoop = {
          minMs: Math.round(h.min / 1e6),
          meanMs: Math.round(h.mean / 1e6),
          maxMs: Math.round(h.max / 1e6),
          isSimulated: false
        };
      } else {
        resp.eventLoop = { minMs: 0, meanMs: 0, maxMs: 0, isSimulated: true };
      }
    } catch {
      resp.eventLoop = { minMs: 0, meanMs: 0, maxMs: 0, isSimulated: true };
    }

    // Disk (simulate in dev/hybrid to avoid privileged calls)
    if (HEALTH_MODE === 'live') {
      // Not gathering real disk stats here; keep safe defaults
      resp.disk = { total: null, free: null, used: null, isSimulated: true };
    } else {
      resp.disk = { total: 20 * 1024 ** 3, free: 18 * 1024 ** 3, used: 2 * 1024 ** 3, isSimulated: true };
    }

    // Error logs (last 24h) – tolerate missing tables
    let errorLogs = 0;
    try {
      errorLogs = await prisma.activity_logs.count({
        where: {
          action: 'error',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });
    } catch {
      errorLogs = 0;
    }
    resp.errorLogs = errorLogs;

    // App uptime and status
    resp.uptime = process.uptime();
    // Provide a coarse uptime percentage (simulated in dev/hybrid)
    const simulatedUptimePct = 99.99;
    resp.uptimePercent = HEALTH_MODE === 'live' && typeof resp.uptime === 'number'
      ? 100 // process is up; without a failure budget, treat as 100 in live context
      : simulatedUptimePct;
    resp.status = 'healthy';

    // Open support tickets (last 24h or all open states)
    try {
      const openTickets = await prisma.support_tickets.count({
        where: {
          status: { in: ['open', 'pending'] }
        }
      });
      resp.support = { open: openTickets, isSimulated: false };
    } catch {
      resp.support = { open: 0, isSimulated: true };
    }

    // Cache and return
    cache.data = resp;
    cache.at = now;
    return res.json(resp);

  } catch (error: any) {
    console.error('System health error:', error);
    return res.json({
      environment: process.env.NODE_ENV || 'development',
      mode: process.env.HEALTH_MODE || 'hybrid',
      cacheTtlMs: Number(process.env.HEALTH_CACHE_TTL_MS || 30000),
      cached: false,
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

// Get customer analytics with detailed metrics
router.get('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const period = req.query.period as string || '30d';

    // Calculate date range
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

    // Previous period for comparison
    const daysDiff = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);

    // Customer Acquisition (new customers in period)
    const newCustomersInPeriod = await prisma.customers.count({
      where: { createdAt: { gte: startDate } }
    });

    const newCustomersInPreviousPeriod = await prisma.customers.count({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    });

    // Churn Rate Calculation
    // Customers at start of period
    const customersAtStartOfPeriod = await prisma.customers.count({
      where: { createdAt: { lt: startDate } }
    });

    // Customers who cancelled during the period
    const churnedCustomers = await prisma.customers.count({
      where: {
        status: { in: ['cancelled', 'suspended'] },
        updatedAt: { gte: startDate },
        createdAt: { lt: startDate } // Only count those who existed before period
      }
    });

    const customerChurnRate = customersAtStartOfPeriod > 0
      ? (churnedCustomers / customersAtStartOfPeriod) * 100
      : 0;

    // MRR Churn Rate
    const churnedCustomersWithMRR = await prisma.customers.findMany({
      where: {
        status: { in: ['cancelled', 'suspended'] },
        updatedAt: { gte: startDate },
        createdAt: { lt: startDate }
      },
      select: { mrr: true }
    });

    const churnedMRR = churnedCustomersWithMRR.reduce((sum, c) => sum + (c.mrr || 0), 0);

    const totalMRRAtStart = await prisma.customers.aggregate({
      where: {
        createdAt: { lt: startDate },
        status: { in: ['active', 'trial'] }
      },
      _sum: { mrr: true }
    });

    const mrrChurnRate = (totalMRRAtStart._sum.mrr || 0) > 0
      ? (churnedMRR / (totalMRRAtStart._sum.mrr || 1)) * 100
      : 0;

    // Average Revenue Per Customer (ARPU)
    const activeCustomersCount = await prisma.customers.count({
      where: { status: { in: ['active', 'trial'] } }
    });

    const totalMRR = await prisma.customers.aggregate({
      where: { status: { in: ['active', 'trial'] } },
      _sum: { mrr: true }
    });

    const arpu = activeCustomersCount > 0
      ? (totalMRR._sum.mrr || 0) / activeCustomersCount
      : 0;

    // Customer Growth Analysis - Daily breakdown
    const dailyGrowth = [];
    const daysInPeriod = Math.min(daysDiff, 30); // Limit to 30 days for performance

    for (let i = daysInPeriod - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const newCustomers = await prisma.customers.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      const churned = await prisma.customers.count({
        where: {
          status: { in: ['cancelled', 'suspended'] },
          updatedAt: {
            gte: dayStart,
            lte: dayEnd
          },
          createdAt: { lt: dayStart }
        }
      });

      const netGrowth = newCustomers - churned;

      // Total customers at end of day (all customers created up to that day)
      const totalAtEndOfDay = await prisma.customers.count({
        where: {
          createdAt: { lte: dayEnd }
        }
      });

      dailyGrowth.push({
        date: dayStart.toISOString().split('T')[0],
        newCustomers,
        churned,
        netGrowth,
        total: totalAtEndOfDay
      });
    }

    // Top Customers by Revenue with growth calculation
    const topCustomers = await prisma.customers.findMany({
      where: {
        status: { in: ['active', 'trial'] },
        mrr: { gt: 0 }
      },
      include: {
        plans: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            properties: true
          }
        }
      },
      orderBy: {
        mrr: 'desc'
      },
      take: 10
    });

    // Calculate revenue growth for each top customer
    const topCustomersWithGrowth = await Promise.all(
      topCustomers.map(async (customer) => {
        // Get MRR from 30 days ago (if available from snapshots or historical data)
        const previousMRR = customer.mrr || 0; // Simplified - in production, fetch from mrr_snapshots

        // For now, calculate based on recent invoice changes
        const recentInvoices = await prisma.invoices.aggregate({
          where: {
            customerId: customer.id,
            createdAt: { gte: startDate },
            status: 'paid'
          },
          _sum: { amount: true }
        });

        const previousInvoices = await prisma.invoices.aggregate({
          where: {
            customerId: customer.id,
            createdAt: {
              gte: previousStartDate,
              lt: startDate
            },
            status: 'paid'
          },
          _sum: { amount: true }
        });

        const currentRevenue = recentInvoices._sum.amount || 0;
        const previousRevenue = previousInvoices._sum.amount || 0;

        const growth = previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : currentRevenue > 0 ? 100 : 0;

        return {
          id: customer.id,
          company: customer.company,
          plan: customer.plans?.name || 'No Plan',
          mrr: customer.mrr || 0,
          properties: customer._count.properties,
          growth: Math.round(growth * 10) / 10,
          status: customer.status
        };
      })
    );

    console.log('📊 Customer Analytics:', {
      acquisition: newCustomersInPeriod,
      churnRate: customerChurnRate,
      mrrChurnRate,
      arpu,
      topCustomersCount: topCustomersWithGrowth.length
    });

    return res.json({
      acquisition: {
        current: newCustomersInPeriod,
        previous: newCustomersInPreviousPeriod,
        growth: newCustomersInPreviousPeriod > 0
          ? ((newCustomersInPeriod - newCustomersInPreviousPeriod) / newCustomersInPreviousPeriod) * 100
          : newCustomersInPeriod > 0 ? 100 : 0
      },
      churn: {
        customerChurnRate: Math.round(customerChurnRate * 100) / 100,
        mrrChurnRate: Math.round(mrrChurnRate * 100) / 100,
        churnedCustomers,
        churnedMRR: Math.round(churnedMRR * 100) / 100
      },
      arpu: Math.round(arpu * 100) / 100,
      dailyGrowth,
      topCustomers: topCustomersWithGrowth
    });
  } catch (error: any) {
    console.error('Customer analytics error:', error?.message || error);
    if (error?.stack) console.error(error.stack);
    return res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
});

export default router;


