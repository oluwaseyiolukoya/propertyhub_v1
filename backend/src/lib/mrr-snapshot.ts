/**
 * MRR Snapshot Service
 *
 * This service handles creating and managing MRR snapshots for accurate historical tracking.
 */

import prisma from './db';

/**
 * Capture MRR snapshot for a specific customer and month
 */
export async function captureCustomerSnapshot(customerId: string, month?: Date) {
  try {
    // Default to first day of current month
    const snapshotMonth = month || new Date();
    snapshotMonth.setDate(1);
    snapshotMonth.setHours(0, 0, 0, 0);

    // Get customer data
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      include: { plans: true }
    });

    if (!customer) {
      console.error(`Customer ${customerId} not found for snapshot`);
      return null;
    }

    // Check if snapshot already exists
    const existingSnapshot = await prisma.mrr_snapshots.findUnique({
      where: {
        customerId_month: {
          customerId: customerId,
          month: snapshotMonth
        }
      }
    });

    const snapshotData = {
      customerId: customer.id,
      month: snapshotMonth,
      mrr: customer.mrr,
      planId: customer.planId,
      planName: customer.plans?.name || null,
      status: customer.status,
      billingCycle: customer.billingCycle
    };

    if (existingSnapshot) {
      // Update existing snapshot
      return await prisma.mrr_snapshots.update({
        where: { id: existingSnapshot.id },
        data: snapshotData
      });
    } else {
      // Create new snapshot
      return await prisma.mrr_snapshots.create({
        data: snapshotData
      });
    }
  } catch (error) {
    console.error('Error capturing customer snapshot:', error);
    throw error;
  }
}

/**
 * Capture MRR snapshots for all active customers for a specific month
 */
export async function captureMonthlySnapshots(month?: Date) {
  console.log('📸 Starting monthly MRR snapshot capture...');

  try {
    // Default to first day of current month
    const snapshotMonth = month || new Date();
    snapshotMonth.setDate(1);
    snapshotMonth.setHours(0, 0, 0, 0);

    console.log(`📅 Capturing snapshots for: ${snapshotMonth.toISOString().split('T')[0]}`);

    // Get all customers (including cancelled ones for historical accuracy)
    const customers = await prisma.customers.findMany({
      include: { plans: true }
    });

    console.log(`👥 Found ${customers.length} customers to snapshot`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const customer of customers) {
      try {
        // Check if snapshot already exists
        const existingSnapshot = await prisma.mrr_snapshots.findUnique({
          where: {
            customerId_month: {
              customerId: customer.id,
              month: snapshotMonth
            }
          }
        });

        const snapshotData = {
          customerId: customer.id,
          month: snapshotMonth,
          mrr: customer.mrr,
          planId: customer.planId,
          planName: customer.plans?.name || null,
          status: customer.status,
          billingCycle: customer.billingCycle
        };

        if (existingSnapshot) {
          // Update if data has changed
          if (
            existingSnapshot.mrr !== customer.mrr ||
            existingSnapshot.status !== customer.status ||
            existingSnapshot.planId !== customer.planId
          ) {
            await prisma.mrr_snapshots.update({
              where: { id: existingSnapshot.id },
              data: snapshotData
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Create new snapshot
          await prisma.mrr_snapshots.create({
            data: snapshotData
          });
          created++;
        }
      } catch (error) {
        console.error(`Error snapshotting customer ${customer.id}:`, error);
      }
    }

    console.log(`✅ Snapshot complete: ${created} created, ${updated} updated, ${skipped} skipped`);

    return { created, updated, skipped, total: customers.length };
  } catch (error) {
    console.error('Error capturing monthly snapshots:', error);
    throw error;
  }
}

/**
 * Get MRR for a specific month from snapshots
 */
export async function getMonthlyMRR(month: Date) {
  const snapshotMonth = new Date(month);
  snapshotMonth.setDate(1);
  snapshotMonth.setHours(0, 0, 0, 0);

  const result = await prisma.mrr_snapshots.aggregate({
    where: {
      month: snapshotMonth,
      status: { in: ['active', 'trial'] }
    },
    _sum: {
      mrr: true
    },
    _count: true
  });

  return {
    totalMRR: result._sum.mrr || 0,
    customerCount: result._count
  };
}

/**
 * Get MRR growth between two months
 */
export async function getMRRGrowth(currentMonth: Date, previousMonth: Date) {
  const current = await getMonthlyMRR(currentMonth);
  const previous = await getMonthlyMRR(previousMonth);

  const growth = previous.totalMRR > 0
    ? ((current.totalMRR - previous.totalMRR) / previous.totalMRR) * 100
    : current.totalMRR > 0 ? 100 : 0;

  return {
    currentMRR: current.totalMRR,
    previousMRR: previous.totalMRR,
    growthPercent: Math.round(growth * 10) / 10,
    currentCustomers: current.customerCount,
    previousCustomers: previous.customerCount
  };
}

/**
 * Get MRR trend for the last N months
 */
export async function getMRRTrend(months: number = 6) {
  const trends = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const data = await getMonthlyMRR(month);
    trends.push({
      month: month.toISOString().split('T')[0],
      mrr: data.totalMRR,
      customers: data.customerCount
    });
  }

  return trends;
}

/**
 * Capture snapshot when customer data changes (plan, status, MRR)
 * This ensures we have accurate data for the current month
 */
export async function captureSnapshotOnChange(customerId: string) {
  try {
    // Capture snapshot for current month
    await captureCustomerSnapshot(customerId);
    console.log(`📸 Snapshot captured for customer ${customerId} on change`);
  } catch (error) {
    console.error(`Failed to capture snapshot on change for ${customerId}:`, error);
  }
}



