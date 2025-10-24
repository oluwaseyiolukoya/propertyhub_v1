/**
 * Fix Tenant Login - Update all existing tenants to be active
 * This script sets isActive=true and status='active' for all tenants
 * Run with: tsx backend/scripts/fix-tenant-login.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTenantLogin() {
  try {
    console.log('🔧 Starting tenant login fix...\n');

    // Find all users with role 'tenant'
    const tenants = await prisma.users.findMany({
      where: {
        role: 'tenant'
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        status: true,
        password: true
      }
    });

    console.log(`📊 Found ${tenants.length} tenant(s) in database\n`);

    if (tenants.length === 0) {
      console.log('✅ No tenants found. Nothing to fix.');
      return;
    }

    // Show current status
    console.log('Current tenant status:');
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.email})`);
      console.log(`   - isActive: ${tenant.isActive}`);
      console.log(`   - status: ${tenant.status}`);
      console.log(`   - has password: ${tenant.password ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Update all tenants to be active
    const result = await prisma.users.updateMany({
      where: {
        role: 'tenant'
      },
      data: {
        isActive: true,
        status: 'active'
      }
    });

    console.log(`✅ Updated ${result.count} tenant(s)`);
    console.log('All tenants can now log in!\n');

    // Verify updates
    console.log('Verifying updates...');
    const updatedTenants = await prisma.users.findMany({
      where: {
        role: 'tenant'
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        status: true
      }
    });

    console.log('\nUpdated tenant status:');
    updatedTenants.forEach((tenant, index) => {
      const canLogin = tenant.isActive && tenant.status === 'active' ? '✅' : '❌';
      console.log(`${index + 1}. ${canLogin} ${tenant.name} (${tenant.email})`);
      console.log(`   - isActive: ${tenant.isActive}`);
      console.log(`   - status: ${tenant.status}`);
      console.log('');
    });

    console.log('🎉 All done! All tenants can now log in to their dashboard.');

  } catch (error) {
    console.error('❌ Error fixing tenant login:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixTenantLogin()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

