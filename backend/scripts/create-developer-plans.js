/**
 * Create Developer Plans in Production
 *
 * This script creates development plans for property developer customers
 */

const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function createDeveloperPlans() {
  console.log('🏗️  Creating Developer Plans');
  console.log('================================================\n');

  try {
    // Check if developer plans already exist
    const existingDevPlans = await prisma.plans.findMany({
      where: { category: 'development' }
    });

    if (existingDevPlans.length > 0) {
      console.log('⚠️  Developer plans already exist:');
      existingDevPlans.forEach(plan => {
        console.log(`  - ${plan.name} (${plan.monthlyPrice} ${plan.currency}/month)`);
      });
      console.log('\n❓ Do you want to create additional plans? (Ctrl+C to cancel)\n');
      // Continue anyway in case they want more plans
    }

    // Developer plans to create
    const developerPlans = [
      {
        id: randomUUID(),
        name: 'Developer Starter',
        description: 'Perfect for small development projects and individual developers',
        category: 'development',
        monthlyPrice: 49.99,
        annualPrice: 499.99,
        currency: 'USD',
        propertyLimit: null, // Developers don't use propertyLimit
        projectLimit: 3,
        userLimit: 3,
        storageLimit: 5000,
        features: [
          'Up to 3 active projects',
          '3 team members',
          '5GB storage',
          'Project management dashboard',
          'Budget tracking',
          'Expense management',
          'Vendor management',
          'Basic reporting',
          'Email support'
        ],
        isActive: true,
        isPopular: false,
        trialDurationDays: 14
      },
      {
        id: randomUUID(),
        name: 'Developer Professional',
        description: 'For growing development companies with multiple projects',
        category: 'development',
        monthlyPrice: 149.99,
        annualPrice: 1499.99,
        currency: 'USD',
        propertyLimit: null,
        projectLimit: 10,
        userLimit: 10,
        storageLimit: 20000,
        features: [
          'Up to 10 active projects',
          '10 team members',
          '20GB storage',
          'Advanced project management',
          'Budget vs actual tracking',
          'Expense management',
          'Vendor management',
          'Purchase order management',
          'Project funding tracking',
          'Advanced reporting & analytics',
          'Custom reports',
          'Priority email support',
          'Phone support'
        ],
        isActive: true,
        isPopular: true,
        trialDurationDays: 14
      },
      {
        id: randomUUID(),
        name: 'Developer Enterprise',
        description: 'For large development companies with unlimited projects',
        category: 'development',
        monthlyPrice: 399.99,
        annualPrice: 3999.99,
        currency: 'USD',
        propertyLimit: null,
        projectLimit: 999, // Unlimited (high number)
        userLimit: 999, // Unlimited
        storageLimit: 100000,
        features: [
          'Unlimited projects',
          'Unlimited team members',
          '100GB storage',
          'Enterprise project management',
          'Advanced budget tracking',
          'Expense management',
          'Vendor management',
          'Purchase order management',
          'Project funding tracking',
          'Multi-project reporting',
          'Custom dashboards',
          'API access',
          'White-label options',
          'Dedicated account manager',
          '24/7 priority support',
          'Custom integrations',
          'Training & onboarding'
        ],
        isActive: true,
        isPopular: false,
        trialDurationDays: 30
      }
    ];

    console.log('📋 Plans to create:\n');
    developerPlans.forEach(plan => {
      console.log(`  🏗️  ${plan.name}`);
      console.log(`     Price: $${plan.monthlyPrice}/month or $${plan.annualPrice}/year`);
      console.log(`     Projects: ${plan.projectLimit === 999 ? 'Unlimited' : plan.projectLimit}`);
      console.log(`     Users: ${plan.userLimit === 999 ? 'Unlimited' : plan.userLimit}`);
      console.log(`     Storage: ${plan.storageLimit / 1000}GB`);
      console.log('');
    });

    console.log('🔧 Creating plans...\n');

    for (const planData of developerPlans) {
      // Check if plan with same name exists
      const existing = await prisma.plans.findFirst({
        where: { name: planData.name }
      });

      if (existing) {
        console.log(`  ⚠️  Plan "${planData.name}" already exists, skipping...`);
        continue;
      }

      const plan = await prisma.plans.create({
        data: {
          ...planData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`  ✅ Created: ${plan.name} (ID: ${plan.id})`);
    }

    console.log('\n═════════════════════════════════════════════════════════');
    console.log('✅ Developer plans created successfully!');
    console.log('═════════════════════════════════════════════════════════\n');

    // Show final summary
    const allPlans = await prisma.plans.findMany({
      orderBy: [
        { category: 'asc' },
        { monthlyPrice: 'asc' }
      ]
    });

    console.log('📊 All Plans in Database:\n');

    const devPlans = allPlans.filter(p => p.category === 'development');
    const propPlans = allPlans.filter(p => p.category === 'property_management');

    console.log('🏗️  Development Plans:');
    devPlans.forEach(plan => {
      console.log(`  - ${plan.name} ($${plan.monthlyPrice}/mo, ${plan.projectLimit} projects)`);
    });

    console.log('\n🏢 Property Management Plans:');
    propPlans.forEach(plan => {
      console.log(`  - ${plan.name} ($${plan.monthlyPrice}/mo, ${plan.propertyLimit} properties)`);
    });

    console.log('\n📈 Summary:');
    console.log(`  🏗️  Development Plans: ${devPlans.length}`);
    console.log(`  🏢 Property Management Plans: ${propPlans.length}`);
    console.log(`  📊 Total Plans: ${allPlans.length}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Error creating developer plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDeveloperPlans()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

