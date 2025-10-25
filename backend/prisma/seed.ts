import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admins.upsert({
    where: { email: 'admin@propertyhub.com' },
    update: {},
    create: {
      id: 'admin-1',
      email: 'admin@propertyhub.com',
      password: adminPassword,
      name: 'Super Admin',
      role: 'super_admin',
      updatedAt: new Date()
    }
  });
  console.log('✅ Created Super Admin:', admin.email);

  // Create Plans
  const starterPlan = await prisma.plans.upsert({
    where: { name: 'Starter' },
    update: {},
    create: {
      id: 'plan-starter-1',
      name: 'Starter',
      description: 'Perfect for small property owners',
      monthlyPrice: 500,
      annualPrice: 5000,
      currency: 'NGN',
      propertyLimit: 5,
      userLimit: 3,
      storageLimit: 1000,
      features: [
        'Up to 5 properties',
        'Up to 3 users',
        '1GB storage',
        'Basic reporting',
        'Email support'
      ],
      isActive: true,
      updatedAt: new Date()
    }
  });

  const professionalPlan = await prisma.plans.upsert({
    where: { name: 'Professional' },
    update: {},
    create: {
      id: 'plan-professional-1',
      name: 'Professional',
      description: 'For growing property portfolios',
      monthlyPrice: 1200,
      annualPrice: 12000,
      currency: 'NGN',
      propertyLimit: 20,
      userLimit: 10,
      storageLimit: 5000,
      features: [
        'Up to 20 properties',
        'Up to 10 users',
        '5GB storage',
        'Advanced reporting',
        'Priority support',
        'Custom branding'
      ],
      isActive: true,
      isPopular: true,
      updatedAt: new Date()
    }
  });

  const enterprisePlan = await prisma.plans.upsert({
    where: { name: 'Enterprise' },
    update: {},
    create: {
      id: 'plan-enterprise-1',
      name: 'Enterprise',
      description: 'For large property management companies',
      monthlyPrice: 2500,
      annualPrice: 25000,
      currency: 'NGN',
      propertyLimit: 100,
      userLimit: 50,
      storageLimit: 20000,
      features: [
        'Up to 100 properties',
        'Up to 50 users',
        '20GB storage',
        'Enterprise reporting',
        'Dedicated support',
        'Custom branding',
        'API access',
        'White-label options'
      ],
      isActive: true,
      updatedAt: new Date()
    }
  });

  console.log('✅ Created Plans');

  // Create Sample Customer
  const customer = await prisma.customers.upsert({
    where: { email: 'john@metro-properties.com' },
    update: {},
    create: {
      id: 'customer-1',
      company: 'Metro Properties LLC',
      owner: 'John Smith',
      email: 'john@metro-properties.com',
      phone: '+234-800-1234567',
      website: 'https://metro-properties.com',
      taxId: 'TAX-12345678',
      industry: 'Real Estate',
      companySize: '10-50',
      planId: professionalPlan.id,
      billingCycle: 'monthly',
      mrr: 1200,
      status: 'active',
      street: '123 Lagos Street',
      city: 'Lagos',
      state: 'Lagos',
      postalCode: '100001',
      country: 'Nigeria',
      propertyLimit: 20,
      userLimit: 10,
      storageLimit: 5000,
      subscriptionStartDate: new Date(),
      updatedAt: new Date()
    }
  });

  console.log('✅ Created Sample Customer:', customer.company);

  // Create Owner User
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.users.upsert({
    where: { email: 'john@metro-properties.com' },
    update: {},
    create: {
      id: 'user-owner-1',
      customerId: customer.id,
      name: 'John Smith',
      email: 'john@metro-properties.com',
      password: ownerPassword,
      phone: '+234-800-1234567',
      role: 'owner',
      status: 'active',
      company: 'Metro Properties LLC',
      baseCurrency: 'USD', // Set default base currency to USD
      updatedAt: new Date()
    }
  });

  console.log('✅ Created Owner User:', owner.email);

  // Create Roles
  // Internal Admin Role
  await prisma.roles.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      id: 'role-super-admin',
      name: 'Super Admin',
      description: 'Full system access with all permissions for internal admin users',
      permissions: [
        'customer_management', 'customer_create', 'customer_edit', 'customer_delete', 'customer_view',
        'user_management', 'user_create', 'user_edit', 'user_delete', 'user_view',
        'role_management', 'role_create', 'role_edit', 'role_delete',
        'billing_management', 'plan_management', 'invoice_management', 'payment_view',
        'analytics_view', 'analytics_reports', 'analytics_export',
        'system_health', 'system_settings', 'platform_settings', 'system_logs',
        'support_tickets', 'support_view', 'support_respond', 'support_close',
        'activity_logs', 'audit_reports'
      ],
      isActive: true,
      isSystem: true, // System roles cannot be deleted
      updatedAt: new Date()
    }
  });

  // Customer-Facing Roles (for customers' users)
  await prisma.roles.upsert({
    where: { name: 'Property Owner' },
    update: {},
    create: {
      id: 'role-property-owner',
      name: 'Property Owner',
      description: 'Full access to all features',
      permissions: [
        'property_management',
        'tenant_management',
        'financial_reports',
        'maintenance_management',
        'access_control',
        'user_management'
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date()
    }
  });

  await prisma.roles.upsert({
    where: { name: 'Property Manager' },
    update: {},
    create: {
      id: 'role-property-manager',
      name: 'Property Manager',
      description: 'Manage assigned properties',
      permissions: [
        'property_management',
        'tenant_management',
        'maintenance_management',
        'access_control'
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date()
    }
  });

  await prisma.roles.upsert({
    where: { name: 'Tenant' },
    update: {},
    create: {
      id: 'role-tenant',
      name: 'Tenant',
      description: 'Tenant portal access',
      permissions: [
        'view_lease',
        'submit_maintenance',
        'make_payments'
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date()
    }
  });

  console.log('✅ Created Roles (1 Internal Admin + 3 Customer-Facing)');
  
  // Additional Internal Roles
  await prisma.roles.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      id: 'role-admin',
      name: 'Admin',
      description: 'Internal admin with broad platform access',
      permissions: [
        'customer_management', 'customer_create', 'customer_edit', 'customer_delete', 'customer_view',
        'user_management', 'user_create', 'user_edit', 'user_delete', 'user_view',
        'role_management', 'role_create', 'role_edit', 'role_delete',
        'billing_management', 'plan_management', 'invoice_management', 'payment_view',
        'analytics_view', 'analytics_reports', 'analytics_export',
        'system_health', 'platform_settings',
        'support_tickets', 'support_view', 'support_respond', 'support_close',
        'activity_logs', 'audit_reports'
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date()
    }
  });

  await prisma.roles.upsert({
    where: { name: 'Billing' },
    update: {},
    create: {
      id: 'role-billing',
      name: 'Billing',
      description: 'Finance team with billing and plan management access',
      permissions: [
        'billing_management', 'plan_management', 'invoice_management', 'payment_view',
        'customer_view',
        'analytics_view'
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date()
    }
  });

  await prisma.roles.upsert({
    where: { name: 'Support' },
    update: {},
    create: {
      id: 'role-support',
      name: 'Support',
      description: 'Support staff for handling support tickets and customer view',
      permissions: [
        'support_tickets', 'support_view', 'support_respond', 'support_close',
        'customer_view'
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date()
    }
  });

  await prisma.roles.upsert({
    where: { name: 'Analyst' },
    update: {},
    create: {
      id: 'role-analyst',
      name: 'Analyst',
      description: 'Read-only analytics and reporting',
      permissions: [
        'analytics_view', 'analytics_reports', 'analytics_export',
        'customer_view'
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date()
    }
  });

  console.log('✅ Upserted Internal Roles: Admin, Billing, Support, Analyst');

  // Create System Settings
  await prisma.system_settings.upsert({
    where: { key: 'site_name' },
    update: {},
    create: {
      id: 'setting-site-name',
      key: 'site_name',
      value: 'PropertyHub',
      category: 'system',
      description: 'Platform name',
      updatedAt: new Date()
    }
  });

  await prisma.system_settings.upsert({
    where: { key: 'maintenance_mode' },
    update: {},
    create: {
      id: 'setting-maintenance-mode',
      key: 'maintenance_mode',
      value: false,
      category: 'system',
      description: 'Enable/disable maintenance mode',
      updatedAt: new Date()
    }
  });

  await prisma.system_settings.upsert({
    where: { key: 'default_currency' },
    update: {},
    create: {
      id: 'setting-default-currency',
      key: 'default_currency',
      value: 'USD',
      category: 'system',
      description: 'Default platform currency',
      updatedAt: new Date()
    }
  });

  console.log('✅ Created System Settings');

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Login Credentials:');
  console.log('Super Admin:');
  console.log('  Email: admin@propertyhub.com');
  console.log('  Password: admin123');
  console.log('\nProperty Owner:');
  console.log('  Email: john@metro-properties.com');
  console.log('  Password: owner123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });


