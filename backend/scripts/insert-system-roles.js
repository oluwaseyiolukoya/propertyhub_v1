/**
 * Insert System Roles Script
 * Run this in production to ensure all 5 system roles exist
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const systemRoles = [
  {
    id: 'role-owner',
    name: 'Owner',
    description: 'Full system control and access to all features',
    is_system_role: true,
    permissions: { all: true },
    can_approve_invoices: true,
    approval_limit: null,
    requires_approval_from: [],
  },
  {
    id: 'role-finance-manager',
    name: 'Finance Manager',
    description: 'Financial oversight and invoice approval up to specified limit',
    is_system_role: true,
    permissions: {
      reports: 'view',
      expenses: 'manage',
      invoices: 'approve',
      projects: 'view'
    },
    can_approve_invoices: true,
    approval_limit: 50000,
    requires_approval_from: [],
  },
  {
    id: 'role-project-manager',
    name: 'Project Manager',
    description: 'Project operations and team management',
    is_system_role: true,
    permissions: {
      reports: 'view',
      invoices: 'create',
      projects: 'manage'
    },
    can_approve_invoices: false,
    approval_limit: 1000000,
    requires_approval_from: [],
  },
  {
    id: 'role-accountant',
    name: 'Accountant',
    description: 'Financial records and reporting access',
    is_system_role: true,
    permissions: {
      reports: 'view',
      invoices: 'view',
      payments: 'record'
    },
    can_approve_invoices: false,
    approval_limit: null,
    requires_approval_from: [],
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Read-only access to projects and reports',
    is_system_role: true,
    permissions: {
      invoices: 'view',
      projects: 'view'
    },
    can_approve_invoices: false,
    approval_limit: null,
    requires_approval_from: [],
  },
];

async function insertSystemRoles() {
  console.log('🔄 Checking and inserting system roles...\n');

  try {
    // Check current roles
    const existingRoles = await prisma.team_roles.findMany({
      where: { is_system_role: true },
      select: { id: true, name: true }
    });

    console.log(`📊 Found ${existingRoles.length} existing system roles`);
    if (existingRoles.length > 0) {
      console.log('Existing roles:', existingRoles.map(r => r.name).join(', '));
    }
    console.log('');

    // Insert or update each role
    for (const role of systemRoles) {
      try {
        const result = await prisma.team_roles.upsert({
          where: { id: role.id },
          update: {
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            can_approve_invoices: role.can_approve_invoices,
            approval_limit: role.approval_limit,
            requires_approval_from: role.requires_approval_from,
            updated_at: new Date(),
          },
          create: {
            ...role,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        console.log(`✅ ${role.name} (${role.id})`);
      } catch (error) {
        console.error(`❌ Failed to insert ${role.name}:`, error.message);
      }
    }

    // Verify final count
    const finalCount = await prisma.team_roles.count({
      where: { is_system_role: true }
    });

    console.log('');
    console.log('='.repeat(50));
    console.log(`✅ Complete! ${finalCount} system roles in database`);
    console.log('='.repeat(50));

    // List all roles
    const allRoles = await prisma.team_roles.findMany({
      where: { is_system_role: true },
      select: {
        id: true,
        name: true,
        description: true,
        can_approve_invoices: true,
        approval_limit: true,
      },
      orderBy: { name: 'asc' }
    });

    console.log('\n📋 System Roles:');
    allRoles.forEach(role => {
      console.log(`  • ${role.name}`);
      console.log(`    ID: ${role.id}`);
      console.log(`    Description: ${role.description}`);
      if (role.can_approve_invoices) {
        const limit = role.approval_limit ? `₦${Number(role.approval_limit).toLocaleString()}` : 'Unlimited';
        console.log(`    Can Approve: Yes (up to ${limit})`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
insertSystemRoles()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

