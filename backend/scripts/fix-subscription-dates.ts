/**
 * Script to fix subscriptionStartDate for active customers
 * Run with: npx ts-node scripts/fix-subscription-dates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSubscriptionDates() {
  console.log('🔄 Fixing subscriptionStartDate for active customers...\n');

  try {
    // Get all active customers with null subscriptionStartDate
    const activeCustomers = await prisma.customer.findMany({
      where: {
        status: 'active',
        subscriptionStartDate: null
      },
      include: {
        plan: true
      }
    });

    console.log(`Found ${activeCustomers.length} active customers with missing subscriptionStartDate\n`);

    if (activeCustomers.length === 0) {
      console.log('✅ All active customers already have subscriptionStartDate set!');
      return;
    }

    let fixedCount = 0;

    for (const customer of activeCustomers) {
      // Set subscriptionStartDate to their createdAt date (or current date if unavailable)
      const startDate = customer.createdAt || new Date();

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          subscriptionStartDate: startDate,
          trialEndsAt: null // Clear trial end date for active customers
        }
      });

      console.log(`✅ Fixed ${customer.company}`);
      console.log(`   Status: ${customer.status}`);
      console.log(`   Subscription Start: ${startDate.toISOString()}`);
      console.log(`   Plan: ${customer.plan?.name || 'No plan'}\n`);
      
      fixedCount++;
    }

    console.log(`\n✨ Subscription dates fix complete!`);
    console.log(`   Fixed: ${fixedCount} customers`);

    // Also check trial customers with null trialEndsAt
    console.log('\n🔄 Checking trial customers...\n');

    const trialCustomers = await prisma.customer.findMany({
      where: {
        status: 'trial',
        trialEndsAt: null
      },
      include: {
        plan: true
      }
    });

    console.log(`Found ${trialCustomers.length} trial customers with missing trialEndsAt\n`);

    if (trialCustomers.length > 0) {
      for (const customer of trialCustomers) {
        // Set trial end date to 14 days from created date
        const trialEnd = new Date(customer.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);

        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            trialEndsAt: trialEnd,
            subscriptionStartDate: null // Ensure no subscription start for trial
          }
        });

        console.log(`✅ Fixed trial for ${customer.company}`);
        console.log(`   Trial Ends: ${trialEnd.toISOString()}\n`);
      }
    } else {
      console.log('✅ All trial customers already have trialEndsAt set!');
    }

  } catch (error) {
    console.error('❌ Error fixing subscription dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSubscriptionDates();

