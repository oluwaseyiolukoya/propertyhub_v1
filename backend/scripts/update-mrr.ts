/**
 * Script to update MRR for existing customers
 * Run with: npx ts-node scripts/update-mrr.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCustomerMRR() {
  console.log('🔄 Starting MRR update for all customers...\n');

  try {
    // Get all customers with their plans
    const customers = await prisma.customer.findMany({
      include: {
        plan: true
      }
    });

    console.log(`Found ${customers.length} customers\n`);

    let updatedCount = 0;

    for (const customer of customers) {
      let calculatedMRR = 0;

      // Calculate MRR only for active or trial customers with a plan
      if (customer.plan && (customer.status === 'active' || customer.status === 'trial')) {
        if (customer.billingCycle === 'monthly') {
          calculatedMRR = customer.plan.monthlyPrice;
        } else if (customer.billingCycle === 'annual') {
          calculatedMRR = customer.plan.annualPrice / 12; // Convert annual to monthly
        }
      }

      // Update if MRR changed
      if (customer.mrr !== calculatedMRR) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { mrr: calculatedMRR }
        });

        console.log(`✅ Updated ${customer.company}`);
        console.log(`   Old MRR: ₦${customer.mrr} → New MRR: ₦${calculatedMRR}`);
        console.log(`   Plan: ${customer.plan?.name || 'No plan'}, Cycle: ${customer.billingCycle}, Status: ${customer.status}\n`);
        
        updatedCount++;
      } else {
        console.log(`⏭️  Skipped ${customer.company} (MRR already correct: ₦${customer.mrr})\n`);
      }
    }

    console.log(`\n✨ MRR update complete!`);
    console.log(`   Updated: ${updatedCount} customers`);
    console.log(`   Skipped: ${customers.length - updatedCount} customers`);

  } catch (error) {
    console.error('❌ Error updating MRR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCustomerMRR();

