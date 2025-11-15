/**
 * Cron Jobs Service
 *
 * Handles scheduled tasks like monthly MRR snapshots
 */

import cron from 'node-cron';
import { captureMonthlySnapshots, captureSnapshotOnChange } from './mrr-snapshot';
import { trialManagementService } from '../services/trial-management.service';
import { initializeCashFlowJobs } from '../jobs/cashflow-snapshots.job';
import prisma from './db';

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...');

  // Initialize cash flow snapshot jobs
  initializeCashFlowJobs();

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

  // Trial Expiration Checker - Runs every day at 02:00 AM UTC
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Trial expiration checker job triggered');
    try {
      await trialManagementService.checkTrialExpirations();
      console.log('✅ Trial expiration check completed successfully');
    } catch (error) {
      console.error('❌ Trial expiration check failed:', error);
    }
  });

  // Trial Notification Sender - Runs every day at 10:00 AM UTC
  cron.schedule('0 10 * * *', async () => {
    console.log('📧 Trial notification sender job triggered');
    try {
      await trialManagementService.sendTrialNotifications();
      console.log('✅ Trial notifications sent successfully');
    } catch (error) {
      console.error('❌ Trial notification sender failed:', error);
    }
  });

  // Cleanup Suspended Accounts - Runs every day at 03:00 AM UTC
  cron.schedule('0 3 * * *', async () => {
    console.log('🗑️  Suspended account cleanup job triggered');
    try {
      await trialManagementService.cleanupSuspendedAccounts();
      console.log('✅ Suspended account cleanup completed successfully');
    } catch (error) {
      console.error('❌ Suspended account cleanup failed:', error);
    }
  });

  console.log('✅ Cron jobs initialized:');
  console.log('   - Monthly MRR Snapshot: 1st of every month at 00:05 AM');
  console.log('   - Daily MRR Update: Every day at 00:10 AM');
  console.log('   - Trial Expiration Checker: Every day at 02:00 AM UTC');
  console.log('   - Trial Notification Sender: Every day at 10:00 AM UTC');
  console.log('   - Suspended Account Cleanup: Every day at 03:00 AM UTC');

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

