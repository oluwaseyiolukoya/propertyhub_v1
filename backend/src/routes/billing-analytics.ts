import express, { Response } from 'express';
import prisma from '../lib/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getMonthlyMRR, getMRRGrowth, getMRRTrend } from '../lib/mrr-snapshot';

const router = express.Router();

// Get billing overview with growth metrics (using MRR snapshots)
router.get('/overview', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get MRR growth using snapshots (accurate historical data)
    const mrrGrowth = await getMRRGrowth(currentMonth, lastMonth);

    // Calculate new subscriptions this month
    const newSubscriptionsThisMonth = await prisma.customers.count({
      where: {
        status: { in: ['active', 'trial'] },
        createdAt: { gte: currentMonthStart }
      }
    });

    // Get cancelled subscriptions this month
    const cancelledThisMonth = await prisma.customers.count({
      where: {
        status: 'cancelled',
        updatedAt: { gte: currentMonthStart }
      }
    });

    // Calculate churn rate (cancelled / total active at start of month)
    const churnRate = mrrGrowth.previousCustomers > 0
      ? (cancelledThisMonth / mrrGrowth.previousCustomers) * 100
      : 0;

    // Get average revenue per customer
    const avgRevenuePerCustomer = mrrGrowth.currentCustomers > 0
      ? mrrGrowth.currentMRR / mrrGrowth.currentCustomers
      : 0;

    // Get trial vs active breakdown
    const trialCount = await prisma.customers.count({
      where: { status: 'trial' }
    });

    const activeCount = await prisma.customers.count({
      where: { status: 'active' }
    });

    // Calculate subscription growth
    const subscriptionGrowth = mrrGrowth.previousCustomers > 0
      ? ((mrrGrowth.currentCustomers - mrrGrowth.previousCustomers) / mrrGrowth.previousCustomers) * 100
      : mrrGrowth.currentCustomers > 0 ? 100 : 0;

    // Debug logging
    console.log('📊 Billing Analytics Debug (Snapshot-based):');
    console.log('  Current MRR:', mrrGrowth.currentMRR);
    console.log('  Last Month MRR:', mrrGrowth.previousMRR);
    console.log('  Current Active Subs:', mrrGrowth.currentCustomers);
    console.log('  Last Month Active Subs:', mrrGrowth.previousCustomers);
    console.log('  New This Month:', newSubscriptionsThisMonth);
    console.log('  Cancelled This Month:', cancelledThisMonth);
    console.log('  Revenue Growth:', mrrGrowth.growthPercent + '%');

    res.json({
      currentMonth: {
        mrr: mrrGrowth.currentMRR,
        activeSubscriptions: mrrGrowth.currentCustomers,
        newSubscriptions: newSubscriptionsThisMonth,
        cancelledSubscriptions: cancelledThisMonth,
        avgRevenuePerCustomer: avgRevenuePerCustomer,
        trialCount: trialCount,
        activeCount: activeCount
      },
      lastMonth: {
        mrr: mrrGrowth.previousMRR,
        activeSubscriptions: mrrGrowth.previousCustomers
      },
      growth: {
        revenueGrowthPercent: mrrGrowth.growthPercent,
        subscriptionGrowthPercent: Math.round(subscriptionGrowth * 10) / 10,
        churnRatePercent: Math.round(churnRate * 10) / 10
      }
    });

  } catch (error: any) {
    console.error('Billing overview error:', error);
    res.status(500).json({ error: 'Failed to fetch billing overview' });
  }
});

// Get MRR trend for the last N months
router.get('/trend', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const trend = await getMRRTrend(months);
    res.json({ trend });
  } catch (error: any) {
    console.error('MRR trend error:', error);
    res.status(500).json({ error: 'Failed to fetch MRR trend' });
  }
});

export default router;

