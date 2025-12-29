/**
 * Script to add tax_calculator feature to all appropriate plans
 * Run this in production to ensure all plans that should have tax calculator get it
 *
 * Usage:
 *   cd backend
 *   npx tsx scripts/add-tax-feature-to-all-plans.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTaxFeatureToAllPlans() {
  try {
    console.log('🔄 Adding tax_calculator feature to all appropriate plans...\n');

    // Plans that should have tax_calculator feature
    const plansToUpdate = ['Professional', 'Business', 'Enterprise'];

    for (const planName of plansToUpdate) {
      console.log(`\n📦 Processing ${planName} plan...`);

      const plan = await prisma.plans.findFirst({
        where: {
          category: 'property_management',
          name: planName,
        },
      });

      if (!plan) {
        console.log(`   ⚠️  ${planName} plan not found, skipping...`);
        continue;
      }

      console.log(`   Found plan: ${plan.id}`);

      // Parse existing features
      let features: string[] = [];
      if (Array.isArray(plan.features)) {
        features = [...plan.features].filter((f): f is string => typeof f === 'string');
      } else if (typeof plan.features === 'string') {
        try {
          const parsed = JSON.parse(plan.features);
          if (Array.isArray(parsed)) {
            features = parsed.filter((f): f is string => typeof f === 'string');
          }
        } catch {
          features = [];
        }
      } else if (typeof plan.features === 'object' && plan.features !== null) {
        const featuresObj = plan.features as any;
        if (Array.isArray(featuresObj.features)) {
          features = featuresObj.features.filter((f): f is string => typeof f === 'string');
        } else if (Array.isArray(featuresObj.list)) {
          features = featuresObj.list.filter((f): f is string => typeof f === 'string');
        } else {
          features = Object.keys(featuresObj).filter(
            (key) => featuresObj[key] === true || featuresObj[key] === 'enabled'
          );
        }
      }

      console.log(`   Current features (${features.length}):`, features.slice(0, 5), features.length > 5 ? '...' : '');

      // Check if tax_calculator already exists
      const hasTax = features.some(
        (f: string) =>
          f.toLowerCase() === 'tax_calculator' ||
          f.toLowerCase().includes('tax_calculator') ||
          f.toLowerCase() === 'tax calculator'
      );

      if (hasTax) {
        console.log(`   ✅ ${planName} plan already has tax_calculator feature`);
        continue;
      }

      // Add tax_calculator feature (add both display name and key)
      if (!features.includes('Tax Calculator')) {
        features.push('Tax Calculator');
      }
      if (!features.includes('tax_calculator')) {
        features.push('tax_calculator');
      }

      await prisma.plans.update({
        where: { id: plan.id },
        data: {
          features,
          updatedAt: new Date(),
        },
      });

      console.log(`   ✅ Successfully added tax_calculator feature to ${planName} plan`);
      console.log(`   Updated features count: ${features.length}`);
    }

    // Verify all plans
    console.log('\n🔍 Verifying tax_calculator feature in all plans...\n');
    const allPlans = await prisma.plans.findMany({
      where: {
        category: 'property_management',
        name: { in: plansToUpdate },
      },
      select: {
        name: true,
        features: true,
      },
    });

    for (const plan of allPlans) {
      const features = Array.isArray(plan.features) ? plan.features : [];
      const hasTax = features.some(
        (f: string) =>
          f.toLowerCase() === 'tax_calculator' ||
          f.toLowerCase().includes('tax_calculator') ||
          f.toLowerCase() === 'tax calculator'
      );
      console.log(`   ${plan.name}: ${hasTax ? '✅' : '❌'} tax_calculator feature`);
    }

    console.log('\n✅ Script completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Users on Professional, Business, or Enterprise plans should now see Tax Calculator');
    console.log('   2. Users may need to refresh their browser to see the new feature');
    console.log('   3. If still not visible, check that the user\'s plan is one of the above');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addTaxFeatureToAllPlans();

