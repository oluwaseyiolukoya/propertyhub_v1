import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@propertyhub.com' },
    update: {},
    create: {
      email: 'admin@propertyhub.com',
      password: adminPassword,
      name: 'Super Admin',
      role: 'super_admin'
    }
  });
  console.log('✅ Created Super Admin:', admin.email);

  // Create Plans
  const starterPlan = await prisma.plan.upsert({
    where: { name: 'Starter' },
    update: {},
    create: {
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
      isActive: true
    }
  });

  const professionalPlan = await prisma.plan.upsert({
    where: { name: 'Professional' },
    update: {},
    create: {
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
      isPopular: true
    }
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { name: 'Enterprise' },
    update: {},
    create: {
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
      isActive: true
    }
  });

  console.log('✅ Created Plans');

  // Create Sample Customer
  const customer = await prisma.customer.upsert({
    where: { email: 'john@metro-properties.com' },
    update: {},
    create: {
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
      zipCode: '100001',
      country: 'Nigeria',
      propertyLimit: 20,
      userLimit: 10,
      storageLimit: 5000,
      subscriptionStartDate: new Date()
    }
  });

  console.log('✅ Created Sample Customer:', customer.company);

  // Create Owner User
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'john@metro-properties.com' },
    update: {},
    create: {
      customerId: customer.id,
      name: 'John Smith',
      email: 'john@metro-properties.com',
      password: ownerPassword,
      phone: '+234-800-1234567',
      role: 'owner',
      status: 'active',
      company: 'Metro Properties LLC'
    }
  });

  console.log('✅ Created Owner User:', owner.email);

  // Create Roles
  await prisma.role.upsert({
    where: { name: 'Property Owner' },
    update: {},
    create: {
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
      isSystem: true
    }
  });

  await prisma.role.upsert({
    where: { name: 'Property Manager' },
    update: {},
    create: {
      name: 'Property Manager',
      description: 'Manage assigned properties',
      permissions: [
        'property_management',
        'tenant_management',
        'maintenance_management',
        'access_control'
      ],
      isActive: true,
      isSystem: true
    }
  });

  await prisma.role.upsert({
    where: { name: 'Tenant' },
    update: {},
    create: {
      name: 'Tenant',
      description: 'Tenant portal access',
      permissions: [
        'view_lease',
        'submit_maintenance',
        'make_payments'
      ],
      isActive: true,
      isSystem: true
    }
  });

  console.log('✅ Created Roles');

  // Create System Settings
  await prisma.systemSetting.upsert({
    where: { key: 'site_name' },
    update: {},
    create: {
      key: 'site_name',
      value: 'PropertyHub',
      category: 'system',
      description: 'Platform name'
    }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'maintenance_mode' },
    update: {},
    create: {
      key: 'maintenance_mode',
      value: false,
      category: 'system',
      description: 'Enable/disable maintenance mode'
    }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'default_currency' },
    update: {},
    create: {
      key: 'default_currency',
      value: 'NGN',
      category: 'system',
      description: 'Default platform currency'
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


