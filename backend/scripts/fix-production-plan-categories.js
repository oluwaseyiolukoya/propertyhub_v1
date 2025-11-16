/**
 * Fix Production Plan Categories
 *
 * This script updates plan categories in the production database
 * to ensure developer plans have category='development'
 *
 * Run this script AFTER deploying the Prisma schema fix
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPlanCategories() {
  console.log('🔧 Fixing Plan Categories in Production Database');
  console.log('================================================\n');

  try {
    // Step 1: Fetch all plans
    console.log('📋 Step 1: Fetching all plans...');
    const allPlans = await prisma.plans.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        propertyLimit: true,
        projectLimit: true,
      },
    });

    console.log(`✅ Found ${allPlans.length} plans\n`);

    // Step 2: Display current state
    console.log('📊 Current Plan Categories:');
    console.log('─────────────────────────────────────────────────────────');
    allPlans.forEach(plan => {
      console.log(`  ${plan.name}:`);
      console.log(`    Category: ${plan.category || 'NULL'}`);
      console.log(`    Property Limit: ${plan.propertyLimit || 'NULL'}`);
      console.log(`    Project Limit: ${plan.projectLimit || 'NULL'}`);
      console.log('');
    });

    // Step 3: Identify plans that need fixing
    const developmentKeywords = ['developer', 'development', 'dev', 'project'];

    const plansToFix = allPlans.filter(plan => {
      const nameLower = plan.name.toLowerCase();
      const isDevelopmentPlan = developmentKeywords.some(keyword => nameLower.includes(keyword));
      const needsCategoryFix = isDevelopmentPlan && plan.category !== 'development';
      return needsCategoryFix;
    });

    console.log('\n🔍 Plans that need fixing:');
    console.log('─────────────────────────────────────────────────────────');
    if (plansToFix.length === 0) {
      console.log('  ✅ No plans need fixing! All development plans already have correct categories.');
    } else {
      plansToFix.forEach(plan => {
        console.log(`  ❌ ${plan.name} - Category: ${plan.category || 'NULL'} → Should be: development`);
      });
    }
    console.log('');

    // Step 4: Fix the plans
    if (plansToFix.length > 0) {
      console.log('🔧 Step 2: Updating plan categories...\n');

      for (const plan of plansToFix) {
        console.log(`  Updating: ${plan.name}...`);

        await prisma.plans.update({
          where: { id: plan.id },
          data: {
            category: 'development',
            propertyLimit: null, // Development plans don't use propertyLimit
            projectLimit: plan.projectLimit || 5, // Set default if not set
          },
        });

        console.log(`    ✅ Updated to category='development', projectLimit=${plan.projectLimit || 5}`);
      }

      console.log('\n✅ All development plans updated!');
    }

    // Step 5: Verify property management plans
    console.log('\n🔧 Step 3: Ensuring property management plans have correct category...\n');

    const propertyKeywords = ['property', 'owner', 'manager', 'management', 'basic', 'standard', 'premium', 'enterprise'];

    const propertyPlans = allPlans.filter(plan => {
      const nameLower = plan.name.toLowerCase();
      const isPropertyPlan = propertyKeywords.some(keyword => nameLower.includes(keyword));
      const isDevelopmentPlan = developmentKeywords.some(keyword => nameLower.includes(keyword));
      return isPropertyPlan && !isDevelopmentPlan && plan.category !== 'property_management';
    });

    if (propertyPlans.length === 0) {
      console.log('  ✅ All property management plans already have correct categories.');
    } else {
      for (const plan of propertyPlans) {
        console.log(`  Updating: ${plan.name}...`);

        await prisma.plans.update({
          where: { id: plan.id },
          data: {
            category: 'property_management',
            propertyLimit: plan.propertyLimit || 5, // Set default if not set
          },
        });

        console.log(`    ✅ Updated to category='property_management', propertyLimit=${plan.propertyLimit || 5}`);
      }
    }

    // Step 6: Display final state
    console.log('\n📊 Final Plan Categories:');
    console.log('─────────────────────────────────────────────────────────');

    const updatedPlans = await prisma.plans.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        propertyLimit: true,
        projectLimit: true,
      },
      orderBy: { name: 'asc' },
    });

    updatedPlans.forEach(plan => {
      const icon = plan.category === 'development' ? '🏗️' : '🏢';
      console.log(`  ${icon} ${plan.name}:`);
      console.log(`    Category: ${plan.category || 'NULL'}`);
      console.log(`    Property Limit: ${plan.propertyLimit || 'NULL'}`);
      console.log(`    Project Limit: ${plan.projectLimit || 'NULL'}`);
      console.log('');
    });

    console.log('═════════════════════════════════════════════════════════');
    console.log('✅ Plan categories fixed successfully!');
    console.log('═════════════════════════════════════════════════════════\n');

    // Summary
    const developmentCount = updatedPlans.filter(p => p.category === 'development').length;
    const propertyCount = updatedPlans.filter(p => p.category === 'property_management').length;
    const uncategorized = updatedPlans.filter(p => !p.category).length;

    console.log('📈 Summary:');
    console.log(`  🏗️  Development Plans: ${developmentCount}`);
    console.log(`  🏢 Property Management Plans: ${propertyCount}`);
    console.log(`  ❓ Uncategorized Plans: ${uncategorized}`);
    console.log('');

    if (uncategorized > 0) {
      console.log('⚠️  Warning: Some plans are still uncategorized.');
      console.log('   Please manually review and categorize them.');
    }

  } catch (error) {
    console.error('\n❌ Error fixing plan categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixPlanCategories()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

