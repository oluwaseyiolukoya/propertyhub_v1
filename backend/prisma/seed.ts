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

  // Configure Paystack (owner-level) using env test keys if available
  const paystackPublic = process.env.PAYSTACK_TEST_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || '';
  const paystackSecret = process.env.PAYSTACK_TEST_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY || '';
  if (paystackPublic && paystackSecret) {
    await prisma.payment_settings.upsert({
      where: {
        customerId_provider: { customerId: customer.id, provider: 'paystack' }
      },
      update: {
        publicKey: paystackPublic,
        secretKey: paystackSecret,
        isEnabled: true,
        testMode: true,
        updatedAt: new Date(),
      },
      create: {
        customerId: customer.id,
        provider: 'paystack',
        publicKey: paystackPublic,
        secretKey: paystackSecret,
        isEnabled: true,
        testMode: true,
        bankTransferTemplate: 'Bank Name: First Bank of Nigeria\nAccount Name: Metro Properties Ltd\nAccount Number: 1234567890\n\nUse your UNIT NUMBER as reference.',
      }
    });
    console.log('✅ Configured Paystack test keys for owner');
  } else {
    console.log('ℹ️  PAYSTACK_TEST_PUBLIC_KEY / PAYSTACK_TEST_SECRET_KEY not set; skipping Paystack seed');
  }

  // Create Manager User
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.users.upsert({
    where: { email: 'manager@metro-properties.com' },
    update: {},
    create: {
      id: 'user-manager-1',
      customerId: customer.id,
      name: 'Mary Johnson',
      email: 'manager@metro-properties.com',
      password: managerPassword,
      phone: '+234-800-9876543',
      role: 'manager',
      status: 'active',
      company: 'Metro Properties LLC',
      baseCurrency: 'NGN',
    }
  });
  console.log('✅ Created Manager User:', manager.email);

  // Create Tenants
  const tenant1Password = await bcrypt.hash('tenant123', 10);
  const tenant1 = await prisma.users.upsert({
    where: { email: 'tenant1@metro-properties.com' },
    update: {},
    create: {
      id: 'user-tenant-1',
      customerId: customer.id,
      name: 'Ade Akin',
      email: 'tenant1@metro-properties.com',
      password: tenant1Password,
      phone: '+234-801-1111111',
      role: 'tenant',
      status: 'active',
      baseCurrency: 'NGN',
    }
  });

  const tenant2Password = await bcrypt.hash('tenant123', 10);
  const tenant2 = await prisma.users.upsert({
    where: { email: 'tenant2@metro-properties.com' },
    update: {},
    create: {
      id: 'user-tenant-2',
      customerId: customer.id,
      name: 'Ngozi Chukwu',
      email: 'tenant2@metro-properties.com',
      password: tenant2Password,
      phone: '+234-801-2222222',
      role: 'tenant',
      status: 'active',
      baseCurrency: 'NGN',
    }
  });
  console.log('✅ Created Tenants:', tenant1.email, tenant2.email);

  // Create Property
  const property = await prisma.properties.upsert({
    where: { id: 'prop-metro-1' },
    update: {},
    create: {
      id: 'prop-metro-1',
      customerId: customer.id,
      ownerId: owner.id,
      name: 'Metro Garden Apartments',
      propertyType: 'Apartment',
      address: '45 Admiralty Way',
      city: 'Lagos',
      state: 'Lagos',
      postalCode: '105102',
      country: 'Nigeria',
      totalUnits: 3,
      floors: 3,
      currency: 'NGN',
      status: 'active',
      description: 'Modern apartments in Lekki Phase 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });
  console.log('✅ Created Property:', property.name);

  // Assign Manager to Property
  await prisma.property_managers.upsert({
    where: { propertyId_managerId: { propertyId: property.id, managerId: manager.id } },
    update: {},
    create: {
      id: 'pm-assignment-1',
      propertyId: property.id,
      managerId: manager.id,
      isActive: true,
    }
  });
  console.log('✅ Assigned Manager to Property');

  // Create Units
  const unitA = await prisma.units.upsert({
    where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: 'A1' } },
    update: {},
    create: {
      id: 'unit-metro-a1',
      propertyId: property.id,
      unitNumber: 'A1',
      type: '2 Bedroom',
      floor: 1,
      bedrooms: 2,
      bathrooms: 2,
      size: 90,
      monthlyRent: 350000,
      securityDeposit: 350000,
      status: 'occupied',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  const unitB = await prisma.units.upsert({
    where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: 'B2' } },
    update: {},
    create: {
      id: 'unit-metro-b2',
      propertyId: property.id,
      unitNumber: 'B2',
      type: '1 Bedroom',
      floor: 2,
      bedrooms: 1,
      bathrooms: 1,
      size: 60,
      monthlyRent: 250000,
      securityDeposit: 250000,
      status: 'occupied',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  const unitC = await prisma.units.upsert({
    where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: 'C3' } },
    update: {},
    create: {
      id: 'unit-metro-c3',
      propertyId: property.id,
      unitNumber: 'C3',
      type: 'Studio',
      floor: 3,
      bedrooms: 0,
      bathrooms: 1,
      size: 35,
      monthlyRent: 180000,
      securityDeposit: 180000,
      status: 'vacant',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });
  console.log('✅ Created Units:', unitA.unitNumber, unitB.unitNumber, unitC.unitNumber);

  // Create Leases for two units
  const lease1 = await prisma.leases.upsert({
    where: { leaseNumber: 'LEASE-METRO-001' },
    update: {},
    create: {
      id: 'lease-metro-1',
      propertyId: property.id,
      unitId: unitA.id,
      tenantId: tenant1.id,
      leaseNumber: 'LEASE-METRO-001',
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      monthlyRent: unitA.monthlyRent,
      securityDeposit: unitA.securityDeposit || 0,
      currency: 'NGN',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  const lease2 = await prisma.leases.upsert({
    where: { leaseNumber: 'LEASE-METRO-002' },
    update: {},
    create: {
      id: 'lease-metro-2',
      propertyId: property.id,
      unitId: unitB.id,
      tenantId: tenant2.id,
      leaseNumber: 'LEASE-METRO-002',
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      monthlyRent: unitB.monthlyRent,
      securityDeposit: unitB.securityDeposit || 0,
      currency: 'NGN',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });
  console.log('✅ Created Leases:', lease1.leaseNumber, lease2.leaseNumber);

  // Create Invoices for current month
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const period = `${yyyy}-${mm}`;

  const invoice1 = await prisma.invoices.upsert({
    where: { invoiceNumber: 'INV-METRO-001' },
    update: {},
    create: {
      id: 'inv-metro-1',
      customerId: customer.id,
      invoiceNumber: 'INV-METRO-001',
      amount: unitA.monthlyRent,
      currency: 'NGN',
      status: 'paid',
      dueDate: new Date(new Date().setDate(5)),
      paidAt: new Date(),
      billingPeriod: period,
      description: 'Monthly Rent',
      items: [{ description: 'Rent', amount: unitA.monthlyRent }],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  const invoice2 = await prisma.invoices.upsert({
    where: { invoiceNumber: 'INV-METRO-002' },
    update: {},
    create: {
      id: 'inv-metro-2',
      customerId: customer.id,
      invoiceNumber: 'INV-METRO-002',
      amount: unitB.monthlyRent,
      currency: 'NGN',
      status: 'pending',
      dueDate: new Date(new Date().setDate(5)),
      billingPeriod: period,
      description: 'Monthly Rent',
      items: [{ description: 'Rent', amount: unitB.monthlyRent }],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });
  console.log('✅ Created Invoices:', invoice1.invoiceNumber, invoice2.invoiceNumber);

  // Create Payments (one success manual, one pending paystack)
  const existingPayments = await prisma.payments.count({ where: { customerId: customer.id } });
  if (existingPayments === 0) {
    await prisma.payments.create({
      data: {
        customerId: customer.id,
        propertyId: property.id,
        unitId: unitA.id,
        leaseId: lease1.id,
        tenantId: tenant1.id,
        invoiceId: invoice1.id,
        amount: unitA.monthlyRent,
        currency: 'NGN',
        status: 'success',
        type: 'rent',
        paymentMethod: 'bank_transfer',
        provider: 'manual',
        providerReference: 'MANUAL-DEMO-1',
        providerFee: 0,
        paidAt: new Date(),
        metadata: { note: 'Seeded payment (manual)' },
      }
    });

    await prisma.payments.create({
      data: {
        customerId: customer.id,
        propertyId: property.id,
        unitId: unitB.id,
        leaseId: lease2.id,
        tenantId: tenant2.id,
        invoiceId: invoice2.id,
        amount: unitB.monthlyRent,
        currency: 'NGN',
        status: 'pending',
        type: 'rent',
        paymentMethod: 'paystack',
        provider: 'paystack',
        providerReference: 'PSK-DEMO-PENDING-1',
        metadata: { note: 'Seeded payment (pending)' },
      }
    });
    console.log('✅ Created Payments (1 success, 1 pending)');
  }

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


