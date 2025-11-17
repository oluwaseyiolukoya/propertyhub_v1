import cron from 'node-cron';
import prisma from '../lib/db';
import { saveMonthlySnapshot, calculateProjectCashFlow } from '../services/cashflow.service';

/**
 * Daily job to calculate cash flow snapshots for all active projects
 * Runs at midnight (00:30) every day
 */
export function startCashFlowSnapshotJob() {
  console.log('📊 Registering cash flow snapshot cron job...');

  // Run daily at 00:30 AM to calculate yesterday's cash flow
  cron.schedule('30 0 * * *', async () => {
    console.log('\n📊 ============================================');
    console.log('📊 Starting daily cash flow snapshot calculation...');
    console.log('📊 ============================================\n');

    try {
      // Get all active projects
      const projects = await prisma.developer_projects.findMany({
        where: {
          status: { in: ['active', 'construction'] }
        },
        select: {
          id: true,
          name: true,
          customerId: true
        }
      });

      console.log(`📊 Found ${projects.length} active projects to process`);

      if (projects.length === 0) {
        console.log('✅ No active projects found. Skipping snapshot calculation.');
        return;
      }

      // Calculate snapshots for previous month
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const year = yesterday.getFullYear();
      const month = yesterday.getMonth() + 1;

      console.log(`📊 Calculating snapshots for ${year}-${month}\n`);

      let successCount = 0;
      let errorCount = 0;

      // Process each project
      for (const project of projects) {
        try {
          console.log(`  📁 Processing: ${project.name} (${project.id})`);
          await saveMonthlySnapshot(project.id, year, month);
          successCount++;
          console.log(`  ✅ Success: ${project.name}\n`);
        } catch (error: any) {
          errorCount++;
          console.error(`  ❌ Error for ${project.name}:`, error.message);
          console.error(`     Details:`, error.stack || error);
        }
      }

      console.log('\n📊 ============================================');
      console.log(`📊 Snapshot calculation complete!`);
      console.log(`   ✅ Success: ${successCount} projects`);
      console.log(`   ❌ Errors: ${errorCount} projects`);
      console.log('📊 ============================================\n');

    } catch (error: any) {
      console.error('❌ Cash flow snapshot job failed:', error);
      console.error('   Stack:', error.stack || error);
    }
  });

  console.log('✅ Cash flow snapshot cron job registered (runs daily at 00:30)');
}

/**
 * Monthly job to finalize previous month's cash flow
 * Runs on the 1st of every month at 02:00 AM
 */
export function startMonthlyCashFlowFinalization() {
  console.log('📊 Registering monthly cash flow finalization job...');

  // Run on the 1st of every month at 02:00 AM
  cron.schedule('0 2 1 * *', async () => {
    console.log('\n📊 ============================================');
    console.log('📊 Starting monthly cash flow finalization...');
    console.log('📊 ============================================\n');

    try {
      // Get previous month
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = prevMonth.getFullYear();
      const month = prevMonth.getMonth() + 1;

      console.log(`📊 Finalizing cash flow for ${year}-${month}\n`);

      // Get all projects (including completed ones from last month)
      const projects = await prisma.developer_projects.findMany({
        where: {
          OR: [
            { status: { in: ['active', 'construction'] } },
            {
              AND: [
                { status: 'completed' },
                { updatedAt: { gte: prevMonth } }
              ]
            }
          ]
        },
        select: {
          id: true,
          name: true,
          customerId: true,
          status: true
        }
      });

      console.log(`📊 Found ${projects.length} projects to finalize`);

      let successCount = 0;
      let errorCount = 0;

      // Calculate and save final snapshots
      for (const project of projects) {
        try {
          console.log(`  📁 Finalizing: ${project.name} (${project.status})`);
          await saveMonthlySnapshot(project.id, year, month);
          successCount++;
          console.log(`  ✅ Finalized: ${project.name}\n`);
        } catch (error: any) {
          errorCount++;
          console.error(`  ❌ Error for ${project.name}:`, error.message);
        }
      }

      // Calculate cumulative statistics
      const totalSnapshots = await prisma.project_cash_flow_snapshots.count({
        where: {
          periodStart: {
            gte: prevMonth,
            lt: now
          }
        }
      });

      console.log('\n📊 ============================================');
      console.log(`📊 Monthly finalization complete!`);
      console.log(`   ✅ Success: ${successCount} projects`);
      console.log(`   ❌ Errors: ${errorCount} projects`);
      console.log(`   📈 Total snapshots created: ${totalSnapshots}`);
      console.log('📊 ============================================\n');

      // TODO: Send monthly reports to project managers
      // TODO: Update project financial summaries
      // TODO: Generate cash flow forecasts

    } catch (error: any) {
      console.error('❌ Monthly cash flow finalization failed:', error);
      console.error('   Stack:', error.stack || error);
    }
  });

  console.log('✅ Monthly finalization job registered (runs on 1st of month at 02:00)');
}

/**
 * Weekly job to clean up old snapshots (optional)
 * Runs every Sunday at 03:00 AM
 */
export function startSnapshotCleanupJob() {
  console.log('📊 Registering snapshot cleanup job...');

  // Run every Sunday at 03:00 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('\n🧹 ============================================');
    console.log('🧹 Starting snapshot cleanup...');
    console.log('🧹 ============================================\n');

    try {
      // Delete snapshots older than 2 years (configurable)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const deletedCount = await prisma.project_cash_flow_snapshots.deleteMany({
        where: {
          periodStart: {
            lt: twoYearsAgo
          }
        }
      });

      console.log(`🧹 Deleted ${deletedCount.count} old snapshots (older than 2 years)`);

      // Get current snapshot statistics
      const stats = await prisma.project_cash_flow_snapshots.groupBy({
        by: ['periodType'],
        _count: { id: true }
      });

      console.log('\n📊 Current snapshot statistics:');
      stats.forEach(stat => {
        console.log(`   ${stat.periodType}: ${stat._count.id} snapshots`);
      });

      console.log('\n🧹 ============================================');
      console.log('🧹 Snapshot cleanup complete!');
      console.log('🧹 ============================================\n');

    } catch (error: any) {
      console.error('❌ Snapshot cleanup failed:', error);
    }
  });

  console.log('✅ Snapshot cleanup job registered (runs weekly on Sunday at 03:00)');
}

/**
 * Initialize all cash flow jobs
 */
export function initializeCashFlowJobs() {
  console.log('\n🚀 Initializing cash flow background jobs...\n');

  startCashFlowSnapshotJob();
  startMonthlyCashFlowFinalization();
  startSnapshotCleanupJob();

  console.log('\n✅ All cash flow jobs initialized successfully!\n');
}







