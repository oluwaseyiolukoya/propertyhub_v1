/**
 * Diagnostic script to check if a user has tax_calculator feature
 * Usage: npx tsx scripts/check-user-tax-feature.ts <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserTaxFeature() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Please provide an email address');
    console.error('Usage: npx tsx scripts/check-user-tax-feature.ts <email>');
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Checking tax_calculator feature access for: ${email}\n`);

    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        customers: {
          include: {
            plans: {
              select: {
                id: true,
                name: true,
                category: true,
                features: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('👤 User Details:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Customer ID:', user.customerId);

    if (!user.customerId) {
      console.log('\n⚠️  User has no customerId (internal admin?)');
      process.exit(0);
    }

    if (!user.customers) {
      console.log('\n❌ Customer not found');
      process.exit(1);
    }

    console.log('\n🏢 Customer Details:');
    console.log('  - Customer ID:', user.customers.id);
    console.log('  - Company:', user.customers.company);
    console.log('  - Status:', user.customers.status);

    if (!user.customers.plans) {
      console.log('\n❌ Customer has no plan assigned');
      console.log('   This is why tax_calculator feature is not available.');
      process.exit(0);
    }

    const plan = user.customers.plans;
    console.log('\n📦 Plan Details:');
    console.log('  - Plan ID:', plan.id);
    console.log('  - Plan Name:', plan.name);
    console.log('  - Category:', plan.category);
    console.log('  - Features Type:', typeof plan.features);
    console.log('  - Features Raw:', JSON.stringify(plan.features, null, 2));

    // Parse features
    let features: string[] = [];
    if (Array.isArray(plan.features)) {
      features = plan.features;
      console.log('  - Features (Array):', features);
    } else if (typeof plan.features === 'object' && plan.features !== null) {
      const featuresObj = plan.features as any;
      if (Array.isArray(featuresObj.features)) {
        features = featuresObj.features;
        console.log('  - Features (Object.features):', features);
      } else if (Array.isArray(featuresObj.list)) {
        features = featuresObj.list;
        console.log('  - Features (Object.list):', features);
      } else {
        features = Object.keys(featuresObj).filter(
          (key) => featuresObj[key] === true || featuresObj[key] === 'enabled'
        );
        console.log('  - Features (Object.keys):', features);
      }
    } else if (typeof plan.features === 'string') {
      try {
        const parsed = JSON.parse(plan.features);
        if (Array.isArray(parsed)) {
          features = parsed;
          console.log('  - Features (Parsed String):', features);
        }
      } catch {
        features = [plan.features];
        console.log('  - Features (String as-is):', features);
      }
    }

    // Check for tax_calculator
    const hasTaxCalculator = features.some(
      (f) =>
        f.toLowerCase() === 'tax_calculator' ||
        f.toLowerCase().includes('tax_calculator') ||
        f.toLowerCase() === 'tax calculator'
    );

    console.log('\n✅ Feature Check:');
    console.log('  - Has tax_calculator:', hasTaxCalculator ? '✅ YES' : '❌ NO');
    console.log('  - All features:', features);

    if (!hasTaxCalculator) {
      console.log('\n🔧 Solution:');
      console.log('  1. Run: npx tsx scripts/add-tax-feature-to-all-plans.ts');
      console.log('  2. Or manually update the plan in the database');
      console.log('  3. Or assign the user to a plan that has tax_calculator');
    } else {
      console.log('\n✅ User should have access to tax_calculator feature');
      console.log('   If still getting 403, check backend logs for middleware errors');
    }

    console.log('\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserTaxFeature();

