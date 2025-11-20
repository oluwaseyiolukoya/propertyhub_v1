/**
 * Safe Script to Insert System Roles
 * Run this in production console if roles are missing
 *
 * Usage:
 *   cd /workspace/backend
 *   node scripts/insert-system-roles-safe.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const systemRoles = [
  {
    id: 'role-owner',
    name: 'Owner',
    description: 'Full access to all features',
    is_system_role: true,
    permissions: { all: true },
    can_approve_invoices: true,
    approval_limit: null,
    can_create_invoices: true,
    can_manage_projects: true,
    can_view_reports: true,
  },
  {
    id: 'role-finance-manager',
    name: 'Finance Manager',
    description: 'Approve invoices and manage finances',
    is_system_role: true,
    permissions: {
      invoices: 'approve',
      expenses: 'manage',
      reports: 'view',
      projects: 'view',
    },
    can_approve_invoices: true,
    approval_limit: 50000,
    can_create_invoices: false,
    can_manage_projects: false,
    can_view_reports: true,
  },
  {
    id: 'role-project-manager',
    name: 'Project Manager',
    description: 'Create invoices and manage projects',
    is_system_role: true,
    permissions: {
      invoices: 'create',
      projects: 'manage',
      reports: 'view',
    },
    can_approve_invoices: false,
    approval_limit: 1000000,
    can_create_invoices: true,
    can_manage_projects: true,
    can_view_reports: true,
  },
  {
    id: 'role-accountant',
    name: 'Accountant',
    description: 'Record payments and view reports',
    is_system_role: true,
    permissions: {
      payments: 'record',
      reports: 'view',
      invoices: 'view',
    },
    can_approve_invoices: false,
    approval_limit: null,
    can_create_invoices: false,
    can_manage_projects: false,
    can_view_reports: true,
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'View-only access',
    is_system_role: true,
    permissions: {
      projects: 'view',
      invoices: 'view',
    },
    can_approve_invoices: false,
    approval_limit: null,
    can_create_invoices: false,
    can_manage_projects: false,
    can_view_reports: true,
  },
];

async function insertSystemRoles() {
  console.log('🚀 Starting system roles insertion...\n');

  try {
    // Check if roles table exists
    console.log('1️⃣ Checking if team_roles table exists...');
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'team_roles'
      );
    `;

    if (!tableExists[0].exists) {
      console.error('❌ ERROR: team_roles table does not exist!');
      console.log('\n📝 You need to run the migration first:');
      console.log('   npx prisma migrate deploy');
      process.exit(1);
    }

    console.log('✅ team_roles table exists\n');

    // Check current roles
    console.log('2️⃣ Checking existing system roles...');
    const existingRoles = await prisma.team_roles.findMany({
      where: { is_system_role: true },
    });

    console.log(`   Found ${existingRoles.length} existing system roles`);
    existingRoles.forEach(role => {
      console.log(`   - ${role.name} (${role.id})`);
    });
    console.log('');

    // Insert or update each role
    console.log('3️⃣ Inserting/updating system roles...\n');

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const roleData of systemRoles) {
      try {
        const existing = await prisma.team_roles.findUnique({
          where: { id: roleData.id },
        });

        if (existing) {
          // Update existing role
          await prisma.team_roles.update({
            where: { id: roleData.id },
            data: {
              name: roleData.name,
              description: roleData.description,
              is_system_role: roleData.is_system_role,
              permissions: roleData.permissions,
              can_approve_invoices: roleData.can_approve_invoices,
              approval_limit: roleData.approval_limit,
              can_create_invoices: roleData.can_create_invoices,
              can_manage_projects: roleData.can_manage_projects,
              can_view_reports: roleData.can_view_reports,
              updated_at: new Date(),
            },
          });
          console.log(`   ✅ Updated: ${roleData.name}`);
          updated++;
        } else {
          // Insert new role
          await prisma.team_roles.create({
            data: {
              ...roleData,
              customer_id: null, // System roles have no customer
              requires_approval_from: [],
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
          console.log(`   ✅ Inserted: ${roleData.name}`);
          inserted++;
        }
      } catch (error) {
        console.error(`   ❌ Error with ${roleData.name}:`, error.message);
        skipped++;
      }
    }

    console.log('\n4️⃣ Summary:');
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📊 Total: ${systemRoles.length}`);

    // Verify final count
    console.log('\n5️⃣ Verifying...');
    const finalRoles = await prisma.team_roles.findMany({
      where: { is_system_role: true },
      select: { id: true, name: true, description: true },
    });

    console.log(`\n✅ SUCCESS! ${finalRoles.length} system roles in database:\n`);
    finalRoles.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role.name}`);
      console.log(`      ID: ${role.id}`);
      console.log(`      Description: ${role.description}\n`);
    });

    console.log('🎉 System roles are ready!\n');
    console.log('📝 Next steps:');
    console.log('   1. Test the role dropdown in the UI');
    console.log('   2. Try inviting a team member');
    console.log('   3. Verify roles appear in the dropdown\n');

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
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

