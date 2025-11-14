import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Super Admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.admins.upsert({
    where: { email: "admin@contrezz.com" },
    update: {},
    create: {
      id: "admin-1",
      email: "admin@contrezz.com",
      password: adminPassword,
      name: "Super Admin",
      role: "super_admin",
      updatedAt: new Date(),
    },
  });
  console.log("✅ Created Super Admin:", admin.email);

  // ========================================
  // Property Management Plans
  // ========================================
  console.log("📦 Creating Property Management Plans...");

  const starterPlan = await prisma.plans.upsert({
    where: { name: "Starter" },
    update: {},
    create: {
      id: "plan-starter-1",
      name: "Starter",
      description: "Perfect for small property owners",
      category: "property_management",
      monthlyPrice: 500,
      annualPrice: 5000,
      currency: "NGN",
      propertyLimit: 5,
      projectLimit: null,
      userLimit: 3,
      storageLimit: 1000,
      features: [
        "Up to 5 properties",
        "Up to 3 users",
        "1GB storage",
        "Basic reporting",
        "Email support",
      ],
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const professionalPlan = await prisma.plans.upsert({
    where: { name: "Professional" },
    update: {},
    create: {
      id: "plan-professional-1",
      name: "Professional",
      description: "For growing property portfolios",
      category: "property_management",
      monthlyPrice: 1200,
      annualPrice: 12000,
      currency: "NGN",
      propertyLimit: 20,
      projectLimit: null,
      userLimit: 10,
      storageLimit: 5000,
      features: [
        "Up to 20 properties",
        "Up to 10 users",
        "5GB storage",
        "Advanced reporting",
        "Priority support",
        "Custom branding",
      ],
      isActive: true,
      isPopular: true,
      updatedAt: new Date(),
    },
  });

  const enterprisePlan = await prisma.plans.upsert({
    where: { name: "Enterprise" },
    update: {},
    create: {
      id: "plan-enterprise-1",
      name: "Enterprise",
      description: "For large property management companies",
      category: "property_management",
      monthlyPrice: 2500,
      annualPrice: 25000,
      currency: "NGN",
      propertyLimit: 100,
      projectLimit: null,
      userLimit: 50,
      storageLimit: 20000,
      features: [
        "Up to 100 properties",
        "Up to 50 users",
        "20GB storage",
        "Enterprise reporting",
        "Dedicated support",
        "Custom branding",
        "API access",
        "White-label options",
      ],
      isActive: true,
      updatedAt: new Date(),
    },
  });

  console.log("✅ Property Management Plans Created");

  // ========================================
  // Development Plans
  // ========================================
  console.log("🏗️  Creating Development Plans...");

  const devStarterPlan = await prisma.plans.upsert({
    where: { name: "Developer Starter" },
    update: {},
    create: {
      id: "plan-dev-starter-1",
      name: "Developer Starter",
      description: "Perfect for small development firms",
      category: "development",
      monthlyPrice: 800,
      annualPrice: 8000,
      currency: "NGN",
      propertyLimit: null,
      projectLimit: 3,
      userLimit: 5,
      storageLimit: 2000,
      features: [
        "Up to 3 active projects",
        "Up to 5 team members",
        "2GB storage",
        "Project tracking",
        "Basic analytics",
        "Email support",
      ],
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const devProfessionalPlan = await prisma.plans.upsert({
    where: { name: "Developer Professional" },
    update: {},
    create: {
      id: "plan-dev-professional-1",
      name: "Developer Professional",
      description: "For growing development companies",
      category: "development",
      monthlyPrice: 1800,
      annualPrice: 18000,
      currency: "NGN",
      propertyLimit: null,
      projectLimit: 10,
      userLimit: 15,
      storageLimit: 10000,
      features: [
        "Up to 10 active projects",
        "Up to 15 team members",
        "10GB storage",
        "Advanced project management",
        "Financial tracking",
        "Vendor management",
        "Priority support",
        "Custom branding",
      ],
      isActive: true,
      isPopular: true,
      updatedAt: new Date(),
    },
  });

  const devEnterprisePlan = await prisma.plans.upsert({
    where: { name: "Developer Enterprise" },
    update: {},
    create: {
      id: "plan-dev-enterprise-1",
      name: "Developer Enterprise",
      description: "For large development corporations",
      category: "development",
      monthlyPrice: 3500,
      annualPrice: 35000,
      currency: "NGN",
      propertyLimit: null,
      projectLimit: 50,
      userLimit: 100,
      storageLimit: 50000,
      features: [
        "Up to 50 active projects",
        "Up to 100 team members",
        "50GB storage",
        "Enterprise project management",
        "Advanced financial analytics",
        "Multi-project dashboards",
        "Vendor & contractor management",
        "Dedicated support",
        "Custom branding",
        "API access",
        "White-label options",
      ],
      isActive: true,
      updatedAt: new Date(),
    },
  });

  console.log("✅ Development Plans Created");

  console.log("✅ Created Plans");

  // Create Sample Customer
  const customer = await prisma.customers.upsert({
    where: { email: "john@metro-properties.com" },
    update: {},
    create: {
      id: "customer-1",
      company: "Metro Properties LLC",
      owner: "John Smith",
      email: "john@metro-properties.com",
      phone: "+234-800-1234567",
      website: "https://metro-properties.com",
      taxId: "TAX-12345678",
      industry: "Real Estate",
      companySize: "10-50",
      planId: professionalPlan.id,
      billingCycle: "monthly",
      mrr: 1200,
      status: "active",
      street: "123 Lagos Street",
      city: "Lagos",
      state: "Lagos",
      postalCode: "100001",
      country: "Nigeria",
      propertyLimit: 20,
      userLimit: 10,
      storageLimit: 5000,
      subscriptionStartDate: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Created Sample Customer:", customer.company);

  // Create Owner User
  const ownerPassword = await bcrypt.hash("owner123", 10);
  const owner = await prisma.users.upsert({
    where: { email: "john@metro-properties.com" },
    update: {},
    create: {
      id: "user-owner-1",
      customerId: customer.id,
      name: "John Smith",
      email: "john@metro-properties.com",
      password: ownerPassword,
      phone: "+234-800-1234567",
      role: "owner",
      status: "active",
      company: "Metro Properties LLC",
      baseCurrency: "USD", // Set default base currency to USD
      updatedAt: new Date(),
    },
  });

  console.log("✅ Created Owner User:", owner.email);

  // Configure Paystack (owner-level) using env test keys if available
  const paystackPublic =
    process.env.PAYSTACK_TEST_PUBLIC_KEY ||
    process.env.PAYSTACK_PUBLIC_KEY ||
    "";
  const paystackSecret =
    process.env.PAYSTACK_TEST_SECRET_KEY ||
    process.env.PAYSTACK_SECRET_KEY ||
    "";
  if (paystackPublic && paystackSecret) {
    await prisma.payment_settings.upsert({
      where: {
        customerId_provider: { customerId: customer.id, provider: "paystack" },
      },
      update: {
        publicKey: paystackPublic,
        secretKey: paystackSecret,
        isEnabled: true,
        testMode: true,
        updatedAt: new Date(),
      },
      create: {
        id: `payment-settings-${customer.id}-paystack`,
        customerId: customer.id,
        provider: "paystack",
        publicKey: paystackPublic,
        secretKey: paystackSecret,
        isEnabled: true,
        testMode: true,
        bankTransferTemplate:
          "Bank Name: First Bank of Nigeria\nAccount Name: Metro Properties Ltd\nAccount Number: 1234567890\n\nUse your UNIT NUMBER as reference.",
      },
    });
    console.log("✅ Configured Paystack test keys for owner");
  } else {
    console.log(
      "ℹ️  PAYSTACK_TEST_PUBLIC_KEY / PAYSTACK_TEST_SECRET_KEY not set; skipping Paystack seed"
    );
  }

  // Create Manager User
  const managerPassword = await bcrypt.hash("manager123", 10);
  const manager = await prisma.users.upsert({
    where: { email: "manager@metro-properties.com" },
    update: {},
    create: {
      id: "user-manager-1",
      customerId: customer.id,
      name: "Mary Johnson",
      email: "manager@metro-properties.com",
      password: managerPassword,
      phone: "+234-800-9876543",
      role: "manager",
      status: "active",
      company: "Metro Properties LLC",
      baseCurrency: "NGN",
    },
  });
  console.log("✅ Created Manager User:", manager.email);

  // Create Tenants
  const tenant1Password = await bcrypt.hash("tenant123", 10);
  const tenant1 = await prisma.users.upsert({
    where: { email: "tenant1@metro-properties.com" },
    update: {},
    create: {
      id: "user-tenant-1",
      customerId: customer.id,
      name: "Ade Akin",
      email: "tenant1@metro-properties.com",
      password: tenant1Password,
      phone: "+234-801-1111111",
      role: "tenant",
      status: "active",
      baseCurrency: "NGN",
    },
  });

  const tenant2Password = await bcrypt.hash("tenant123", 10);
  const tenant2 = await prisma.users.upsert({
    where: { email: "tenant2@metro-properties.com" },
    update: {},
    create: {
      id: "user-tenant-2",
      customerId: customer.id,
      name: "Ngozi Chukwu",
      email: "tenant2@metro-properties.com",
      password: tenant2Password,
      phone: "+234-801-2222222",
      role: "tenant",
      status: "active",
      baseCurrency: "NGN",
    },
  });
  console.log("✅ Created Tenants:", tenant1.email, tenant2.email);

  // Create Property
  const property = await prisma.properties.upsert({
    where: { id: "prop-metro-1" },
    update: {},
    create: {
      id: "prop-metro-1",
      customerId: customer.id,
      ownerId: owner.id,
      name: "Metro Garden Apartments",
      propertyType: "Apartment",
      address: "45 Admiralty Way",
      city: "Lagos",
      state: "Lagos",
      postalCode: "105102",
      country: "Nigeria",
      totalUnits: 3,
      floors: 3,
      currency: "NGN",
      status: "active",
      description: "Modern apartments in Lekki Phase 1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log("✅ Created Property:", property.name);

  // Assign Manager to Property
  await prisma.property_managers.upsert({
    where: {
      propertyId_managerId: { propertyId: property.id, managerId: manager.id },
    },
    update: {},
    create: {
      id: "pm-assignment-1",
      propertyId: property.id,
      managerId: manager.id,
      isActive: true,
    },
  });
  console.log("✅ Assigned Manager to Property");

  // Create Units
  const unitA = await prisma.units.upsert({
    where: {
      propertyId_unitNumber: { propertyId: property.id, unitNumber: "A1" },
    },
    update: {},
    create: {
      id: "unit-metro-a1",
      propertyId: property.id,
      unitNumber: "A1",
      type: "2 Bedroom",
      floor: 1,
      bedrooms: 2,
      bathrooms: 2,
      size: 90,
      monthlyRent: 350000,
      securityDeposit: 350000,
      status: "occupied",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const unitB = await prisma.units.upsert({
    where: {
      propertyId_unitNumber: { propertyId: property.id, unitNumber: "B2" },
    },
    update: {},
    create: {
      id: "unit-metro-b2",
      propertyId: property.id,
      unitNumber: "B2",
      type: "1 Bedroom",
      floor: 2,
      bedrooms: 1,
      bathrooms: 1,
      size: 60,
      monthlyRent: 250000,
      securityDeposit: 250000,
      status: "occupied",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const unitC = await prisma.units.upsert({
    where: {
      propertyId_unitNumber: { propertyId: property.id, unitNumber: "C3" },
    },
    update: {},
    create: {
      id: "unit-metro-c3",
      propertyId: property.id,
      unitNumber: "C3",
      type: "Studio",
      floor: 3,
      bedrooms: 0,
      bathrooms: 1,
      size: 35,
      monthlyRent: 180000,
      securityDeposit: 180000,
      status: "vacant",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(
    "✅ Created Units:",
    unitA.unitNumber,
    unitB.unitNumber,
    unitC.unitNumber
  );

  // Create Leases for two units
  const lease1 = await prisma.leases.upsert({
    where: { leaseNumber: "LEASE-METRO-001" },
    update: {},
    create: {
      id: "lease-metro-1",
      propertyId: property.id,
      unitId: unitA.id,
      tenantId: tenant1.id,
      leaseNumber: "LEASE-METRO-001",
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      monthlyRent: unitA.monthlyRent,
      securityDeposit: unitA.securityDeposit || 0,
      currency: "NGN",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const lease2 = await prisma.leases.upsert({
    where: { leaseNumber: "LEASE-METRO-002" },
    update: {},
    create: {
      id: "lease-metro-2",
      propertyId: property.id,
      unitId: unitB.id,
      tenantId: tenant2.id,
      leaseNumber: "LEASE-METRO-002",
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      monthlyRent: unitB.monthlyRent,
      securityDeposit: unitB.securityDeposit || 0,
      currency: "NGN",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log("✅ Created Leases:", lease1.leaseNumber, lease2.leaseNumber);

  // Create Invoices for current month
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const period = `${yyyy}-${mm}`;

  const invoice1 = await prisma.invoices.upsert({
    where: { invoiceNumber: "INV-METRO-001" },
    update: {},
    create: {
      id: "inv-metro-1",
      customerId: customer.id,
      invoiceNumber: "INV-METRO-001",
      amount: unitA.monthlyRent,
      currency: "NGN",
      status: "paid",
      dueDate: new Date(new Date().setDate(5)),
      paidAt: new Date(),
      billingPeriod: period,
      description: "Monthly Rent",
      items: [{ description: "Rent", amount: unitA.monthlyRent }],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const invoice2 = await prisma.invoices.upsert({
    where: { invoiceNumber: "INV-METRO-002" },
    update: {},
    create: {
      id: "inv-metro-2",
      customerId: customer.id,
      invoiceNumber: "INV-METRO-002",
      amount: unitB.monthlyRent,
      currency: "NGN",
      status: "pending",
      dueDate: new Date(new Date().setDate(5)),
      billingPeriod: period,
      description: "Monthly Rent",
      items: [{ description: "Rent", amount: unitB.monthlyRent }],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(
    "✅ Created Invoices:",
    invoice1.invoiceNumber,
    invoice2.invoiceNumber
  );

  // Create Payments (one success manual, one pending paystack)
  const existingPayments = await prisma.payments.count({
    where: { customerId: customer.id },
  });
  if (existingPayments === 0) {
    await prisma.payments.create({
      data: {
        id: "payment-metro-1",
        customerId: customer.id,
        propertyId: property.id,
        unitId: unitA.id,
        leaseId: lease1.id,
        tenantId: tenant1.id,
        invoiceId: invoice1.id,
        amount: unitA.monthlyRent,
        currency: "NGN",
        status: "success",
        type: "rent",
        paymentMethod: "bank_transfer",
        provider: "manual",
        providerReference: "MANUAL-DEMO-1",
        providerFee: 0,
        paidAt: new Date(),
        metadata: { note: "Seeded payment (manual)" },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.payments.create({
      data: {
        id: "payment-metro-2",
        customerId: customer.id,
        propertyId: property.id,
        unitId: unitB.id,
        leaseId: lease2.id,
        tenantId: tenant2.id,
        invoiceId: invoice2.id,
        amount: unitB.monthlyRent,
        currency: "NGN",
        status: "pending",
        type: "rent",
        paymentMethod: "paystack",
        provider: "paystack",
        providerReference: "PSK-DEMO-PENDING-1",
        metadata: { note: "Seeded payment (pending)" },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✅ Created Payments (1 success, 1 pending)");
  }

  // Create Roles
  // Internal Admin Role
  await prisma.roles.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: {
      id: "role-super-admin",
      name: "Super Admin",
      description:
        "Full system access with all permissions for internal admin users",
      permissions: [
        "customer_management",
        "customer_create",
        "customer_edit",
        "customer_delete",
        "customer_view",
        "user_management",
        "user_create",
        "user_edit",
        "user_delete",
        "user_view",
        "role_management",
        "role_create",
        "role_edit",
        "role_delete",
        "billing_management",
        "plan_management",
        "invoice_management",
        "payment_view",
        "analytics_view",
        "analytics_reports",
        "analytics_export",
        "system_health",
        "system_settings",
        "platform_settings",
        "system_logs",
        "support_tickets",
        "support_view",
        "support_respond",
        "support_close",
        "activity_logs",
        "audit_reports",
      ],
      isActive: true,
      isSystem: true, // System roles cannot be deleted
      updatedAt: new Date(),
    },
  });

  // Customer-Facing Roles (for customers' users)
  await prisma.roles.upsert({
    where: { name: "Property Owner" },
    update: {},
    create: {
      id: "role-property-owner",
      name: "Property Owner",
      description: "Full access to all features",
      permissions: [
        "property_management",
        "tenant_management",
        "financial_reports",
        "maintenance_management",
        "access_control",
        "user_management",
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date(),
    },
  });

  await prisma.roles.upsert({
    where: { name: "Property Manager" },
    update: {},
    create: {
      id: "role-property-manager",
      name: "Property Manager",
      description: "Manage assigned properties",
      permissions: [
        "property_management",
        "tenant_management",
        "maintenance_management",
        "access_control",
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date(),
    },
  });

  await prisma.roles.upsert({
    where: { name: "Tenant" },
    update: {},
    create: {
      id: "role-tenant",
      name: "Tenant",
      description: "Tenant portal access",
      permissions: ["view_lease", "submit_maintenance", "make_payments"],
      isActive: true,
      isSystem: true,
      updatedAt: new Date(),
    },
  });

  console.log("✅ Created Roles (1 Internal Admin + 3 Customer-Facing)");

  // Additional Internal Roles
  await prisma.roles.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      id: "role-admin",
      name: "Admin",
      description: "Internal admin with broad platform access",
      permissions: [
        "customer_management",
        "customer_create",
        "customer_edit",
        "customer_delete",
        "customer_view",
        "user_management",
        "user_create",
        "user_edit",
        "user_delete",
        "user_view",
        "role_management",
        "role_create",
        "role_edit",
        "role_delete",
        "billing_management",
        "plan_management",
        "invoice_management",
        "payment_view",
        "analytics_view",
        "analytics_reports",
        "analytics_export",
        "system_health",
        "platform_settings",
        "support_tickets",
        "support_view",
        "support_respond",
        "support_close",
        "activity_logs",
        "audit_reports",
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date(),
    },
  });

  await prisma.roles.upsert({
    where: { name: "Billing" },
    update: {},
    create: {
      id: "role-billing",
      name: "Billing",
      description: "Finance team with billing and plan management access",
      permissions: [
        "billing_management",
        "plan_management",
        "invoice_management",
        "payment_view",
        "customer_view",
        "analytics_view",
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date(),
    },
  });

  await prisma.roles.upsert({
    where: { name: "Support" },
    update: {},
    create: {
      id: "role-support",
      name: "Support",
      description:
        "Support staff for handling support tickets and customer view",
      permissions: [
        "support_tickets",
        "support_view",
        "support_respond",
        "support_close",
        "customer_view",
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date(),
    },
  });

  await prisma.roles.upsert({
    where: { name: "Analyst" },
    update: {},
    create: {
      id: "role-analyst",
      name: "Analyst",
      description: "Read-only analytics and reporting",
      permissions: [
        "analytics_view",
        "analytics_reports",
        "analytics_export",
        "customer_view",
      ],
      isActive: true,
      isSystem: true,
      updatedAt: new Date(),
    },
  });

  console.log("✅ Upserted Internal Roles: Admin, Billing, Support, Analyst");

  // Create System Settings
  await prisma.system_settings.upsert({
    where: { key: "site_name" },
    update: {},
    create: {
      id: "setting-site-name",
      key: "site_name",
      value: "Contrezz",
      category: "system",
      description: "Platform name",
      updatedAt: new Date(),
    },
  });

  await prisma.system_settings.upsert({
    where: { key: "maintenance_mode" },
    update: {},
    create: {
      id: "setting-maintenance-mode",
      key: "maintenance_mode",
      value: false,
      category: "system",
      description: "Enable/disable maintenance mode",
      updatedAt: new Date(),
    },
  });

  await prisma.system_settings.upsert({
    where: { key: "default_currency" },
    update: {},
    create: {
      id: "setting-default-currency",
      key: "default_currency",
      value: "USD",
      category: "system",
      description: "Default platform currency",
      updatedAt: new Date(),
    },
  });

  console.log("✅ Created System Settings");

  // ============================================
  // Create Property Developer User & Projects
  // ============================================

  const developerPassword = await bcrypt.hash("developer123", 10);
  const developerUser = await prisma.users.upsert({
    where: { email: "developer@contrezz.com" },
    update: {},
    create: {
      id: "dev-user-001",
      customerId: customer.id,
      name: "John Developer",
      email: "developer@contrezz.com",
      password: developerPassword,
      role: "developer",
      isActive: true,
      status: "active",
      updatedAt: new Date(),
    },
  });
  console.log("✅ Developer user created:", developerUser.email);

  // Create sample projects
  const project1 = await prisma.developer_projects.upsert({
    where: { id: "dev-project-001" },
    update: {},
    create: {
      id: "dev-project-001",
      customerId: customer.id,
      developerId: developerUser.id,
      name: "Lekki Heights Residential Complex",
      description: "50-unit luxury apartment complex in Lekki Phase 1, Lagos",
      projectType: "residential",
      stage: "construction",
      status: "active",
      startDate: new Date("2024-01-15"),
      estimatedEndDate: new Date("2025-06-30"),
      location: "Lekki Phase 1",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      totalBudget: 500000000, // ₦500M
      actualSpend: 320000000, // ₦320M
      progress: 64,
      currency: "NGN",
    },
  });

  const project2 = await prisma.developer_projects.upsert({
    where: { id: "dev-project-002" },
    update: {},
    create: {
      id: "dev-project-002",
      customerId: customer.id,
      developerId: developerUser.id,
      name: "Victoria Island Commercial Tower",
      description: "15-story office building in Victoria Island",
      projectType: "commercial",
      stage: "design",
      status: "active",
      startDate: new Date("2024-03-01"),
      estimatedEndDate: new Date("2026-12-31"),
      location: "Victoria Island",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      totalBudget: 1200000000, // ₦1.2B
      actualSpend: 150000000, // ₦150M
      progress: 12,
      currency: "NGN",
    },
  });

  const project3 = await prisma.developer_projects.upsert({
    where: { id: "dev-project-003" },
    update: {},
    create: {
      id: "dev-project-003",
      customerId: customer.id,
      developerId: developerUser.id,
      name: "Ikoyi Luxury Villas",
      description: "10 detached luxury villas in Ikoyi",
      projectType: "residential",
      stage: "completion",
      status: "active",
      startDate: new Date("2023-06-01"),
      estimatedEndDate: new Date("2024-12-31"),
      location: "Ikoyi",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      totalBudget: 800000000, // ₦800M
      actualSpend: 750000000, // ₦750M
      progress: 94,
      currency: "NGN",
    },
  });

  console.log("✅ Created 3 sample projects");

  // Add budget line items for project 1
  const budgetItems = [
    {
      id: "budget-001",
      projectId: project1.id,
      category: "materials",
      subcategory: "Structural",
      description: "Cement, steel, blocks, and structural materials",
      plannedAmount: 150000000,
      actualAmount: 145000000,
      variance: -5000000,
      variancePercent: -3.33,
      status: "in-progress",
    },
    {
      id: "budget-002",
      projectId: project1.id,
      category: "labor",
      subcategory: "Construction",
      description: "Construction workers, masons, and contractors",
      plannedAmount: 120000000,
      actualAmount: 135000000,
      variance: 15000000,
      variancePercent: 12.5,
      status: "overrun",
    },
    {
      id: "budget-003",
      projectId: project1.id,
      category: "equipment",
      subcategory: "Heavy Machinery",
      description: "Excavators, cranes, and construction equipment",
      plannedAmount: 80000000,
      actualAmount: 40000000,
      variance: -40000000,
      variancePercent: -50,
      status: "in-progress",
    },
    {
      id: "budget-004",
      projectId: project1.id,
      category: "professional-fees",
      subcategory: "Architects & Engineers",
      description: "Architectural and engineering services",
      plannedAmount: 50000000,
      actualAmount: 50000000,
      variance: 0,
      variancePercent: 0,
      status: "completed",
    },
    {
      id: "budget-005",
      projectId: project1.id,
      category: "permits",
      subcategory: "Government Approvals",
      description: "Building permits and government approvals",
      plannedAmount: 30000000,
      actualAmount: 35000000,
      variance: 5000000,
      variancePercent: 16.67,
      status: "completed",
    },
    {
      id: "budget-006",
      projectId: project1.id,
      category: "contingency",
      description: "Contingency fund for unexpected costs",
      plannedAmount: 70000000,
      actualAmount: 15000000,
      variance: -55000000,
      variancePercent: -78.57,
      status: "pending",
    },
  ];

  for (const item of budgetItems) {
    await prisma.budget_line_items.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  console.log("✅ Added budget line items for Lekki Heights project");

  // Create sample vendors
  const vendor1 = await prisma.project_vendors.upsert({
    where: { id: "vendor-001" },
    update: {},
    create: {
      id: "vendor-001",
      customerId: customer.id,
      name: "Lagos Construction Materials Ltd",
      contactPerson: "Ade Johnson",
      email: "ade@lcm.com",
      phone: "+234-801-234-5678",
      vendorType: "supplier",
      specialization: "Building materials",
      rating: 4.5,
      totalContracts: 5,
      totalValue: 250000000,
      currency: "NGN",
      status: "active",
    },
  });

  const vendor2 = await prisma.project_vendors.upsert({
    where: { id: "vendor-002" },
    update: {},
    create: {
      id: "vendor-002",
      customerId: customer.id,
      name: "Elite Contractors Nigeria",
      contactPerson: "Chidi Okafor",
      email: "chidi@elitecontractors.ng",
      phone: "+234-802-345-6789",
      vendorType: "contractor",
      specialization: "General contracting",
      rating: 4.8,
      totalContracts: 12,
      totalValue: 800000000,
      currency: "NGN",
      status: "active",
    },
  });

  console.log("✅ Created 2 sample vendors");

  // Create sample invoices
  const invoices = [
    {
      id: "invoice-001",
      projectId: project1.id,
      vendorId: vendor1.id,
      invoiceNumber: "INV-2024-001",
      description: "Q1 2024 - Cement and steel delivery",
      category: "materials",
      amount: 45000000,
      currency: "NGN",
      status: "paid",
      dueDate: new Date("2024-03-31"),
      paidDate: new Date("2024-03-28"),
      paymentMethod: "bank-transfer",
    },
    {
      id: "invoice-002",
      projectId: project1.id,
      vendorId: vendor2.id,
      invoiceNumber: "INV-2024-002",
      description: "April 2024 - Labor and construction services",
      category: "labor",
      amount: 35000000,
      currency: "NGN",
      status: "approved",
      dueDate: new Date("2024-05-15"),
    },
    {
      id: "invoice-003",
      projectId: project1.id,
      vendorId: vendor1.id,
      invoiceNumber: "INV-2024-003",
      description: "May 2024 - Additional materials",
      category: "materials",
      amount: 28000000,
      currency: "NGN",
      status: "pending",
      dueDate: new Date("2024-06-10"),
    },
  ];

  for (const invoice of invoices) {
    await prisma.project_invoices.upsert({
      where: { id: invoice.id },
      update: {},
      create: invoice,
    });
  }

  console.log("✅ Created 3 sample invoices");

  console.log("🎉 Seeding completed!");
  console.log("\n📝 Login Credentials:");
  console.log("Super Admin:");
  console.log("  Email: admin@contrezz.com");
  console.log("  Password: admin123");
  console.log("\nProperty Owner:");
  console.log("  Email: john@metro-properties.com");
  console.log("  Password: owner123");
  console.log("\nProperty Developer:");
  console.log("  Email: developer@contrezz.com");
  console.log("  Password: developer123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
