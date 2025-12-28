import prisma from '../lib/db';

// Import pricing data structure (we'll define this interface here to avoid circular dependencies)
interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: 'month' | 'year';
  userType: 'property-owner' | 'property-developer';
  popular?: boolean;
  features: Array<{ text: string; included: boolean }>;
  limits: {
    properties?: number;
    units?: number;
    projects?: number;
    users: number;
    storage: string;
  };
}

// Property Owner Plans
const PROPERTY_OWNER_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For asset management, tenant mgmt., facility mgmt., maintenance, budgeting & document control',
    price: 9900,
    currency: 'NGN',
    billingPeriod: 'month',
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
      { text: 'Asset & facility management', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For asset management, tenant mgmt., facility mgmt., maintenance, budgeting & document control',
    price: 29900,
    currency: 'NGN',
    billingPeriod: 'month',
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
      { text: 'Tax Calculator', included: true },
      { text: 'tax_calculator', included: true },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For asset management, tenant mgmt., facility mgmt., maintenance, budgeting & document control',
    price: 69900,
    currency: 'NGN',
    billingPeriod: 'month',
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
      { text: 'Tax Calculator', included: true },
      { text: 'tax_calculator', included: true },
    ],
  },
];

// Property Developer Plans
const PROPERTY_DEVELOPER_PLANS: PricingPlan[] = [
  {
    id: 'project-lite',
    name: 'Project Lite',
    description: 'For construction projects, budgeting, collaboration & document management',
    price: 14900,
    currency: 'NGN',
    billingPeriod: 'month',
    userType: 'property-developer',
    limits: {
      projects: 1,
      users: 3,
      storage: '10GB',
    },
    features: [
      { text: 'Up to 2 project managers', included: true },
      { text: '1 active project', included: true },
      { text: 'Budget tracking', included: true },
      { text: 'Task & milestone management', included: true },
      { text: '10GB document storage', included: true },
      { text: 'Email support', included: true },
      { text: 'Contractor collaboration', included: false },
      { text: 'Workflow automation', included: false },
    ],
  },
  {
    id: 'project-pro',
    name: 'Project Pro',
    description: 'For construction projects, budgeting, collaboration & document management',
    price: 39900,
    currency: 'NGN',
    billingPeriod: 'month',
    userType: 'property-developer',
    popular: true,
    limits: {
      projects: 3,
      users: 8,
      storage: '50GB',
    },
    features: [
      { text: 'Up to 5 project managers', included: true },
      { text: 'Up to 3 active projects', included: true },
      { text: 'Advanced project tracking', included: true },
      { text: 'Contractor collaboration', included: true },
      { text: 'Cost & budget control', included: true },
      { text: 'Document management (50GB)', included: true },
      { text: 'Priority support', included: true },
      { text: 'Workflow automation', included: false },
    ],
  },
  {
    id: 'project-enterprise',
    name: 'Project Enterprise',
    description: 'For construction projects, budgeting, collaboration & document management',
    price: 99900,
    currency: 'NGN',
    billingPeriod: 'month',
    userType: 'property-developer',
    limits: {
      projects: 10,
      users: -1, // Unlimited
      storage: 'Unlimited',
    },
    features: [
      { text: 'Unlimited project managers', included: true },
      { text: 'Up to 10 active projects', included: true },
      { text: 'Complete construction suite', included: true },
      { text: 'Workflow automation', included: true },
      { text: 'Financial reporting', included: true },
      { text: 'API access', included: true },
      { text: 'Dedicated account manager', included: true },
    ],
  },
];

/**
 * Convert storage string to MB
 */
function storageToMB(storage: string): number {
  if (storage === 'Unlimited') return 999999;
  const match = storage.match(/(\d+)(GB|MB)/);
  if (!match) return 1000; // Default 1GB
  const value = parseInt(match[1]);
  const unit = match[2];
  return unit === 'GB' ? value * 1024 : value;
}

/**
 * Sync pricing plans to database
 */
export async function syncPricingPlansToDatabase(): Promise<{
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  try {
    console.log('🔄 Starting pricing plans sync...');

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
          projectLimit: plan.limits.projects || null,
          userLimit: plan.limits.users > 0 ? plan.limits.users : 999, // Unlimited = 999
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
          console.log(`✅ Updated plan: ${plan.name}`);
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
          console.log(`✅ Created plan: ${plan.name}`);
        }
      } catch (error: any) {
        const errorMsg = `Failed to sync plan ${plan.name}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`🎉 Sync complete: ${created} created, ${updated} updated`);

    return {
      success: errors.length === 0,
      created,
      updated,
      errors,
    };
  } catch (error: any) {
    console.error('❌ Pricing sync failed:', error);
    return {
      success: false,
      created,
      updated,
      errors: [error.message],
    };
  }
}

/**
 * Get all pricing plans from database
 */
export async function getPricingPlans(category?: 'property_management' | 'development') {
  try {
    const where = category ? { category, isActive: true } : { isActive: true };

    const plans = await prisma.plans.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { monthlyPrice: 'asc' },
      ],
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });

    return plans;
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    throw error;
  }
}

/**
 * Get pricing plan by ID
 */
export async function getPricingPlanById(id: string) {
  try {
    const plan = await prisma.plans.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });

    return plan;
  } catch (error) {
    console.error('Error fetching pricing plan:', error);
    throw error;
  }
}

export { PROPERTY_OWNER_PLANS, PROPERTY_DEVELOPER_PLANS };

