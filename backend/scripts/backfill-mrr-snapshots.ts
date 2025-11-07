/**
 * Backfill MRR Snapshots Script
 *
 * This script creates historical MRR snapshots for all customers.
 * It generates snapshots from the customer's creation date to the current month.
 *
 * Usage: npx tsx backend/scripts/backfill-mrr-snapshots.ts
 */

import prisma from '../src/lib/db';

async function backfillMRRSnapshots() {
  console.log('🚀 Starting MRR Snapshots Backfill...\n');

  try {
    // Get all customers
    const customers = await prisma.customers.findMany({
      include: {
        plans: true
      }
    });

    console.log(`📊 Found ${customers.length} customers to process\n`);

    let totalSnapshotsCreated = 0;
    let customersProcessed = 0;

    for (const customer of customers) {
      console.log(`Processing: ${customer.company} (${customer.email})`);

      // Determine the start date (customer creation month)
      const customerCreatedDate = new Date(customer.createdAt);
      const startMonth = new Date(customerCreatedDate.getFullYear(), customerCreatedDate.getMonth(), 1);

      // Current month
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Generate snapshots for each month from creation to now
      let monthToSnapshot = new Date(startMonth);
      let snapshotsForCustomer = 0;

      while (monthToSnapshot <= currentMonth) {
        // Check if snapshot already exists
        const existingSnapshot = await prisma.mrr_snapshots.findUnique({
          where: {
            customerId_month: {
              customerId: customer.id,
              month: monthToSnapshot
            }
          }
        });

        if (!existingSnapshot) {
          // Determine the status and MRR for this month
          let status = customer.status;
          let mrr = customer.mrr;

          // If customer was cancelled before this month, use cancelled status and 0 MRR
          if (customer.status === 'cancelled' && customer.updatedAt < monthToSnapshot) {
            status = 'cancelled';
            mrr = 0;
          }

          // If customer was created after this month, skip (shouldn't happen due to loop logic)
          if (customerCreatedDate > monthToSnapshot) {
            monthToSnapshot.setMonth(monthToSnapshot.getMonth() + 1);
            continue;
          }

          // Create snapshot
          await prisma.mrr_snapshots.create({
            data: {
              customerId: customer.id,
              month: monthToSnapshot,
              mrr: mrr,
              planId: customer.planId,
              planName: customer.plans?.name || null,
              status: status,
              billingCycle: customer.billingCycle,
              createdAt: new Date() // Snapshot creation time
            }
          });

          snapshotsForCustomer++;
          totalSnapshotsCreated++;
        }

        // Move to next month
        monthToSnapshot = new Date(monthToSnapshot);
        monthToSnapshot.setMonth(monthToSnapshot.getMonth() + 1);
      }

      console.log(`  ✅ Created ${snapshotsForCustomer} snapshots`);
      customersProcessed++;
    }

    console.log('\n✨ Backfill Complete!');
    console.log(`📈 Total snapshots created: ${totalSnapshotsCreated}`);
    console.log(`👥 Customers processed: ${customersProcessed}`);

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillMRRSnapshots()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });



