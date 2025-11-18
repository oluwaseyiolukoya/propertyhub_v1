// Pricing Plan Types

export type UserType = 'property-owner' | 'property-developer';

export interface PricingFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  annualPrice?: number;
  currency: string;
  billingPeriod: 'month' | 'year';
  userType: UserType;
  popular?: boolean;
  features: PricingFeature[];
  limits: {
    properties?: number;
    units?: number;
    projects?: number;
    users: number;
    storage: string;
  };
  cta: {
    text: string;
    action: string;
  };
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  userTypes: UserType[];
}

export const PROPERTY_OWNER_PLANS: PricingPlan[] = [
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
    cta: {
      text: 'Start Free Trial',
      action: 'signup',
    },
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
    ],
    cta: {
      text: 'Start Free Trial',
      action: 'signup',
    },
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
    ],
    cta: {
      text: 'Contact Sales',
      action: 'contact',
    },
  },
];

export const PROPERTY_DEVELOPER_PLANS: PricingPlan[] = [
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
    cta: {
      text: 'Start Free Trial',
      action: 'signup',
    },
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
    cta: {
      text: 'Start Free Trial',
      action: 'signup',
    },
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
    cta: {
      text: 'Contact Sales',
      action: 'contact',
    },
  },
];

export const ADD_ONS: AddOn[] = [
  {
    id: 'additional-property-manager',
    name: 'Additional Property Manager',
    description: 'Add more property managers to your team',
    price: 1500,
    unit: 'per month',
    userTypes: ['property-owner'],
  },
  {
    id: 'additional-developer-manager',
    name: 'Additional Developer/Project Manager',
    description: 'Add more developers or project managers',
    price: 1500,
    unit: 'per month',
    userTypes: ['property-developer'],
  },
  {
    id: 'extra-unit',
    name: 'Extra Unit',
    description: 'Manage more properties beyond your plan limit',
    price: 60,
    unit: 'per unit/month',
    userTypes: ['property-owner'],
  },
  {
    id: 'extra-project',
    name: 'Extra Project',
    description: 'Add more active projects to your account',
    price: 14900,
    unit: 'per project/month',
    userTypes: ['property-developer'],
  },
  {
    id: 'extra-storage',
    name: 'Extra Storage',
    description: 'Increase your document storage capacity',
    price: 1000,
    unit: 'per GB/month',
    userTypes: ['property-owner', 'property-developer'],
  },
  {
    id: 'onboarding-basic',
    name: 'Setup/Onboarding',
    description: 'Get started with guided setup and training',
    price: 25000,
    unit: 'one-time (₦25k-₦75k)',
    userTypes: ['property-owner', 'property-developer'],
  },
  {
    id: 'training-basic',
    name: 'Basic Training (Remote)',
    description: '1 hour, up to 5 participants. Platform basics & setup',
    price: 35000,
    unit: 'one-time',
    userTypes: ['property-owner', 'property-developer'],
  },
  {
    id: 'training-advanced',
    name: 'Advanced Training (Remote/On-site)',
    description: '2–3 hours, up to 15 participants. Workflow customization, admin & FM operations',
    price: 95000,
    unit: 'one-time',
    userTypes: ['property-owner', 'property-developer'],
  },
  {
    id: 'training-annual',
    name: 'Annual Training Package',
    description: 'Quarterly refreshers, unlimited participants, new features walkthrough',
    price: 180000,
    unit: 'per year',
    userTypes: ['property-owner', 'property-developer'],
  },
];

export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

