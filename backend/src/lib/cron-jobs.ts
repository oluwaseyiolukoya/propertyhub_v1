/**
 * Cron Jobs Service
 *
 * Handles scheduled tasks like monthly MRR snapshots
 */

import cron from 'node-cron';
import { captureMonthlySnapshots, captureSnapshotOnChange } from './mrr-snapshot';
import prisma from './db';

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...');

  // Monthly MRR Snapshot - Runs on the 1st of every month at 00:05 AM
  cron.schedule('5 0 1 * *', async () => {
    console.log('🗓️  Monthly MRR snapshot job triggered');
    try {
      await captureMonthlySnapshots();
      console.log('✅ Monthly MRR snapshot completed successfully');
    } catch (error) {
      console.error('❌ Monthly MRR snapshot failed:', error);
    }
  });

  // Daily MRR Snapshot (for current month) - Runs every day at 00:10 AM
  // This ensures we have up-to-date data for the current month
  cron.schedule('10 0 * * *', async () => {
    console.log('📅 Daily MRR snapshot job triggered');
    try {
      const now = new Date();
      await captureMonthlySnapshots(now);
      console.log('✅ Daily MRR snapshot completed successfully');
    } catch (error) {
      console.error('❌ Daily MRR snapshot failed:', error);
    }
  });

  console.log('✅ Cron jobs initialized:');
  console.log('   - Monthly MRR Snapshot: 1st of every month at 00:05 AM');
  console.log('   - Daily MRR Update: Every day at 00:10 AM');

  // Nightly MRR Reconciliation - ensure customer.mrr matches plan + billingCycle
  cron.schedule('20 0 * * *', async () => {
    console.log('🧮 Nightly MRR reconciliation job triggered');
    try {
      const customers = await prisma.customers.findMany({
        where: { planId: { not: null }, status: { in: ['active', 'trial'] } },
        select: { id: true, planId: true, billingCycle: true, status: true, mrr: true },
      });
      if (customers.length === 0) {
        console.log('ℹ️  No customers to reconcile');
        return;
      }

      // Fetch plans into a map to avoid repeated queries
      const planIds = Array.from(new Set(customers.map(c => c.planId!)));
      const plans = await prisma.plans.findMany({ where: { id: { in: planIds } } });
      const planById = new Map(plans.map(p => [p.id, p]));

      let updated = 0;
      for (const c of customers) {
        const plan = planById.get(c.planId!);
        if (!plan) continue;
        const cycle = (c.billingCycle || 'monthly').toLowerCase();
        let newMRR = 0;
        if (c.status === 'active' || c.status === 'trial') {
          newMRR = cycle === 'annual' ? ((plan.annualPrice ?? plan.monthlyPrice * 12) / 12) : plan.monthlyPrice;
        }
        if (Math.abs((c.mrr || 0) - newMRR) > 0.0001) {
          await prisma.customers.update({ where: { id: c.id }, data: { mrr: newMRR, updatedAt: new Date() } });
          try { await captureSnapshotOnChange(c.id); } catch {}
          updated += 1;
        }
      }
      console.log(`✅ Nightly MRR reconciliation completed. Updated: ${updated}`);
    } catch (error) {
      console.error('❌ Nightly MRR reconciliation failed:', error);
    }
  });
}

/**
 * Manually trigger monthly snapshot (for testing or manual runs)
 */
export async function triggerMonthlySnapshot() {
  console.log('🔧 Manually triggering monthly snapshot...');
  try {
    await captureMonthlySnapshots();
    console.log('✅ Manual snapshot completed');
    return { success: true };
  } catch (error) {
    console.error('❌ Manual snapshot failed:', error);
    return { success: false, error };
  }
}

