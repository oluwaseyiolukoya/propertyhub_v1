/**
 * Sync pricing plans to add tax_calculator feature
 */

import { PrismaClient } from '@prisma/client';
import { syncPricingPlansToDatabase } from '../src/services/pricing-sync.service';

const prisma = new PrismaClient();

async function syncPlans() {
  try {
    console.log('🔄 Syncing pricing plans to add tax_calculator feature...\n');

    const result = await syncPricingPlansToDatabase();

    if (result.success) {
      console.log(`\n✅ Success! ${result.created} created, ${result.updated} updated`);
    } else {
      console.log(`\n⚠️  Completed with errors:`);
      result.errors.forEach(err => console.log(`   - ${err}`));
    }

    // Add tax_calculator feature to Enterprise plan if it exists
    console.log('\n🔍 Adding tax_calculator to Enterprise plan...\n');
    const enterprisePlan = await prisma.plans.findFirst({
      where: {
        category: 'property_management',
        name: 'Enterprise',
      },
    });

    if (enterprisePlan) {
      let features: string[] = [];
      if (Array.isArray(enterprisePlan.features)) {
        features = [...enterprisePlan.features];
      } else if (typeof enterprisePlan.features === 'string') {
        try {
          const parsed = JSON.parse(enterprisePlan.features);
          features = Array.isArray(parsed) ? parsed : [];
        } catch {
          features = [];
        }
      }

      // Check if tax_calculator already exists
      const hasTax = features.some(
        (f: string) =>
          f.toLowerCase() === 'tax_calculator' ||
          f.toLowerCase().includes('tax_calculator') ||
          f.toLowerCase() === 'tax calculator'
      );

      if (!hasTax) {
        // Add tax_calculator feature
        features.push('Tax Calculator', 'tax_calculator');
        await prisma.plans.update({
          where: { id: enterprisePlan.id },
          data: {
            features,
            updatedAt: new Date(),
          },
        });
        console.log('✅ Added tax_calculator feature to Enterprise plan');
      } else {
        console.log('✅ Enterprise plan already has tax_calculator feature');
      }
    } else {
      console.log('⚠️  Enterprise plan not found');
    }

    // Verify the feature was added
    console.log('\n🔍 Verifying tax_calculator feature...\n');
    const plans = await prisma.plans.findMany({
      where: {
        category: 'property_management',
        name: { in: ['Professional', 'Business', 'Enterprise'] },
      },
      select: {
        name: true,
        features: true,
      },
    });

    for (const plan of plans) {
      const features = Array.isArray(plan.features) ? plan.features : [];
      const hasTax = features.some(
        (f: string) =>
          f.toLowerCase() === 'tax_calculator' ||
          f.toLowerCase().includes('tax_calculator') ||
          f.toLowerCase() === 'tax calculator'
      );
      console.log(`${plan.name}: ${hasTax ? '✅' : '❌'} tax_calculator feature`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncPlans();

