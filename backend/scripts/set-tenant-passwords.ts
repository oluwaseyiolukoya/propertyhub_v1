/**
 * Set Tenant Passwords - Generate passwords for tenants without passwords
 * Run with: tsx backend/scripts/set-tenant-passwords.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setTenantPasswords() {
  try {
    console.log('🔧 Setting passwords for tenants...\n');

    // Find all tenants without passwords
    const tenants = await prisma.users.findMany({
      where: {
        role: 'tenant',
        password: null
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.log(`📊 Found ${tenants.length} tenant(s) without passwords\n`);

    if (tenants.length === 0) {
      console.log('✅ All tenants already have passwords!');
      return;
    }

    console.log('Generating passwords for:');
    const credentials: Array<{ name: string; email: string; password: string }> = [];

    for (const tenant of tenants) {
      // Generate a secure temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Update the tenant with the new password
      await prisma.users.update({
        where: { id: tenant.id },
        data: { 
          password: hashedPassword,
          status: 'active',
          isActive: true
        }
      });

      credentials.push({
        name: tenant.name,
        email: tenant.email,
        password: tempPassword
      });

      console.log(`✅ ${tenant.name} (${tenant.email})`);
    }

    console.log('\n📋 TENANT LOGIN CREDENTIALS');
    console.log('============================');
    console.log('⚠️  IMPORTANT: Save these credentials securely!\n');

    credentials.forEach((cred, index) => {
      console.log(`${index + 1}. ${cred.name}`);
      console.log(`   Email: ${cred.email}`);
      console.log(`   Password: ${cred.password}`);
      console.log('');
    });

    console.log('============================');
    console.log('\n✅ All tenants now have passwords and can log in!');
    console.log('\n🔐 How to log in:');
    console.log('1. Go to http://localhost:5173');
    console.log('2. Select "Tenant" as User Type');
    console.log('3. Enter email and password from above');
    console.log('4. Click Login\n');

  } catch (error) {
    console.error('❌ Error setting tenant passwords:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setTenantPasswords()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

