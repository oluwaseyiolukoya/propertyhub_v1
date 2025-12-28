/**
 * Diagnostic script to check tax_calculator feature in plans
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTaxFeature() {
  try {
    console.log('🔍 Checking tax_calculator feature in plans...\n');

    // Get all plans
    const plans = await prisma.plans.findMany({
      where: {
        category: 'property_management',
        name: { in: ['Professional', 'Business', 'Starter'] },
      },
      select: {
        id: true,
        name: true,
        features: true,
      },
    });

    console.log(`Found ${plans.length} plans:\n`);

    for (const plan of plans) {
      console.log(`📦 Plan: ${plan.name} (${plan.id})`);
      console.log(`   Features type: ${typeof plan.features}`);

      if (Array.isArray(plan.features)) {
        console.log(`   Features (${plan.features.length}):`, plan.features);
        const hasTax = plan.features.some(
          (f: string) =>
            f.toLowerCase() === 'tax_calculator' ||
            f.toLowerCase().includes('tax_calculator') ||
            f.toLowerCase() === 'tax calculator'
        );
        console.log(`   ✅ Has tax_calculator: ${hasTax}`);
      } else if (typeof plan.features === 'object') {
        console.log(`   Features (object):`, JSON.stringify(plan.features, null, 2));
      } else {
        console.log(`   Features (string):`, plan.features);
      }
      console.log('');
    }

    // Check a sample customer
    const customer = await prisma.customers.findFirst({
      where: {
        planId: { not: null },
      },
      include: {
        plans: {
          select: {
            name: true,
            features: true,
          },
        },
      },
    });

    if (customer) {
      console.log(`\n👤 Sample Customer: ${customer.email}`);
      console.log(`   Plan: ${customer.plans?.name || 'None'}`);
      if (customer.plans) {
        console.log(`   Features:`, customer.plans.features);
      }
    }

    console.log('\n✅ Diagnostic complete');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTaxFeature();


