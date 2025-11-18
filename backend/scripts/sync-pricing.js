const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Property Owner Plans
const PROPERTY_OWNER_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For asset management, tenant mgmt., facility mgmt., maintenance, budgeting & document control',
    price: 9900,
    currency: 'NGN',
    userType: 'property-owner',
    limits: {
      properties: 1,
      units: 20,
      users: 2,
      storage: '5GB',
    },
    features: [
      { text: '1 property', included: true },
      { text: '1 property manager', included: true },
      { text: 'Up to 20 units', included: true },
      { text: 'Tenant management', included: true },
      { text: 'Basic maintenance tracking', included: true },
      { text: '5GB document storage', included: true },
      { text: 'Email support', included: true },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For asset management, tenant mgmt., facility mgmt., maintenance, budgeting & document control',
    price: 29900,
    currency: 'NGN',
    userType: 'property-owner',
    popular: true,
    limits: {
      properties: 5,
      units: 200,
      users: 6,
      storage: '25GB',
    },
    features: [
      { text: '5 properties', included: true },
      { text: 'Up to 3 property managers', included: true },
      { text: 'Up to 200 units', included: true },
      { text: 'Asset & facility management', included: true },
      { text: 'Budget management', included: true },
      { text: 'Maintenance reports', included: true },
      { text: '25GB document storage', included: true },
      { text: 'Priority support', included: true },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For asset management, tenant mgmt., facility mgmt., maintenance, budgeting & document control',
    price: 69900,
    currency: 'NGN',
    userType: 'property-owner',
    limits: {
      properties: 15,
      units: 500,
      users: 15,
      storage: '50GB',
    },
    features: [
      { text: '15 properties', included: true },
      { text: 'Up to 10 property managers', included: true },
      { text: 'Up to 500 units', included: true },
      { text: 'Full property & tenant suite', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Project tracking', included: true },
      { text: 'Document management (50GB)', included: true },
      { text: 'API access', included: true },
      { text: 'Dedicated support', included: true },
    ],
  },
];

// Property Developer Plans
const PROPERTY_DEVELOPER_PLANS = [
  {
    id: 'dev-starter',
    name: 'Developer Starter',
    description: 'For construction management, project tracking & budgeting',
    price: 19900,
    currency: 'NGN',
    userType: 'property-developer',
    limits: {
      projects: 3,
      users: 5,
      storage: '10GB',
    },
    features: [
      { text: '3 active projects', included: true },
      { text: '5 team members', included: true },
      { text: 'Project tracking', included: true },
      { text: 'Budget management', included: true },
      { text: 'Vendor management', included: true },
      { text: '10GB document storage', included: true },
      { text: 'Email support', included: true },
    ],
  },
  {
    id: 'dev-professional',
    name: 'Developer Professional',
    description: 'For construction management, project tracking & budgeting',
    price: 49900,
    currency: 'NGN',
    userType: 'property-developer',
    popular: true,
    limits: {
      projects: 10,
      users: 15,
      storage: '50GB',
    },
    features: [
      { text: '10 active projects', included: true },
      { text: '15 team members', included: true },
      { text: 'Advanced project management', included: true },
      { text: 'Financial tracking', included: true },
      { text: 'Vendor & contractor management', included: true },
      { text: 'Progress reporting', included: true },
      { text: '50GB document storage', included: true },
      { text: 'Priority support', included: true },
    ],
  },
  {
    id: 'dev-enterprise',
    name: 'Developer Enterprise',
    description: 'For construction management, project tracking & budgeting',
    price: 99900,
    currency: 'NGN',
    userType: 'property-developer',
    limits: {
      projects: -1, // Unlimited
      users: 50,
      storage: 'Unlimited',
    },
    features: [
      { text: 'Unlimited projects', included: true },
      { text: '50+ team members', included: true },
      { text: 'Enterprise project management', included: true },
      { text: 'Advanced financial analytics', included: true },
      { text: 'Multi-project dashboards', included: true },
      { text: 'Vendor & contractor management', included: true },
      { text: 'Unlimited document storage', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Custom branding', included: true },
      { text: 'API access', included: true },
    ],
  },
];

function storageToMB(storage) {
  if (storage === 'Unlimited' || storage === 'unlimited') {
    return 999999;
  }
  const match = storage.match(/^(\d+)GB$/i);
  if (match) {
    return parseInt(match[1]) * 1024;
  }
  return 1024; // Default 1GB
}

async function syncPricingPlans() {
  let created = 0;
  let updated = 0;
  const errors = [];

  try {
    console.log('🔄 Starting pricing plans sync...\n');

    const allPlans = [...PROPERTY_OWNER_PLANS, ...PROPERTY_DEVELOPER_PLANS];

    for (const plan of allPlans) {
      try {
        const category = plan.userType === 'property-owner' ? 'property_management' : 'development';

        // Calculate annual price (12 months with 2 months free = 10x monthly)
        const annualPrice = plan.price * 10;

        // Prepare features array (only included features)
        const features = plan.features
          .filter(f => f.included)
          .map(f => f.text);

        // Check if plan exists
        const existingPlan = await prisma.plans.findFirst({
          where: {
            OR: [
              { id: plan.id },
              { name: plan.name, category }
            ]
          }
        });

        const planData = {
          name: plan.name,
          description: plan.description,
          category,
          monthlyPrice: plan.price,
          annualPrice,
          currency: plan.currency,
          propertyLimit: plan.limits.properties || null,
          projectLimit: plan.limits.projects === -1 ? 999 : (plan.limits.projects || null),
          userLimit: plan.limits.users > 0 ? plan.limits.users : 999,
          storageLimit: storageToMB(plan.limits.storage),
          features,
          isActive: true,
          isPopular: plan.popular || false,
          updatedAt: new Date(),
        };

        if (existingPlan) {
          // Update existing plan
          await prisma.plans.update({
            where: { id: existingPlan.id },
            data: planData,
          });
          updated++;
          console.log(`✅ Updated plan: ${plan.name} (${category})`);
        } else {
          // Create new plan
          await prisma.plans.create({
            data: {
              id: plan.id,
              ...planData,
              createdAt: new Date(),
            },
          });
          created++;
          console.log(`✅ Created plan: ${plan.name} (${category})`);
        }
      } catch (error) {
        const errorMsg = `Failed to sync plan ${plan.name}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`\n🎉 Sync complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);

    if (errors.length > 0) {
      console.log(`   Errors: ${errors.length}`);
      errors.forEach(err => console.log(`     - ${err}`));
    }

    return { success: errors.length === 0, created, updated, errors };
  } catch (error) {
    console.error('❌ Pricing sync failed:', error);
    return { success: false, created, updated, errors: [error.message] };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncPricingPlans()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

