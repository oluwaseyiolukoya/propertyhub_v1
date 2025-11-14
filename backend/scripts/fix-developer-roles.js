/**
 * Fix Developer Roles Migration Script
 *
 * This script fixes existing users who have development plans but were created
 * with the wrong role ('owner' instead of 'developer').
 *
 * It will:
 * 1. Find all customers with development plans (category = 'development')
 * 2. Update their users' role from 'owner' to 'developer'
 * 3. Update customers' planCategory to 'development'
 * 4. Log all changes for verification
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDeveloperRoles() {
  console.log('🔍 Starting Developer Role Fix Migration...\n');

  try {
    // Step 1: Find all customers with development plans
    const customersWithDevPlans = await prisma.customers.findMany({
      where: {
        plans: {
          category: 'development'
        }
      },
      include: {
        plans: true,
        users: {
          where: {
            role: { in: ['owner', 'property-owner', 'property owner'] }
          }
        }
      }
    });

    console.log(`📊 Found ${customersWithDevPlans.length} customers with development plans\n`);

    if (customersWithDevPlans.length === 0) {
      console.log('✅ No customers need fixing. All good!');
      return;
    }

    let fixedUsers = 0;
    let fixedCustomers = 0;

    // Step 2: Fix each customer and their users
    for (const customer of customersWithDevPlans) {
      console.log(`\n📦 Processing Customer: ${customer.company}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Plan: ${customer.plans?.name} (${customer.plans?.category})`);
      console.log(`   Current Plan Category: ${customer.planCategory || 'null'}`);

      // Fix customer plan category if needed
      if (customer.planCategory !== 'development') {
        await prisma.customers.update({
          where: { id: customer.id },
          data: {
            planCategory: 'development',
            projectLimit: customer.plans?.projectLimit || customer.projectLimit || 3,
            propertyLimit: 0 // Set to 0 for developers (they use projectLimit instead)
          }
        });
        console.log(`   ✅ Updated customer planCategory to 'development'`);
        console.log(`   ✅ Set projectLimit to ${customer.plans?.projectLimit || customer.projectLimit || 3}`);
        console.log(`   ✅ Set propertyLimit to 0 (developers use projectLimit)`);
        fixedCustomers++;
      }

      // Fix users' roles
      for (const user of customer.users) {
        console.log(`\n   👤 User: ${user.name} (${user.email})`);
        console.log(`      Current Role: ${user.role}`);

        if (user.role !== 'developer') {
          await prisma.users.update({
            where: { id: user.id },
            data: { role: 'developer' }
          });
          console.log(`      ✅ Updated role to 'developer'`);
          fixedUsers++;
        } else {
          console.log(`      ℹ️  Already has correct role`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Fixed ${fixedUsers} user(s)`);
    console.log(`✅ Fixed ${fixedCustomers} customer(s)`);
    console.log('='.repeat(60));

    // Step 3: Verify the fixes
    console.log('\n🔍 Verifying fixes...\n');

    const verifyCustomers = await prisma.customers.findMany({
      where: {
        plans: {
          category: 'development'
        }
      },
      include: {
        plans: true,
        users: true
      }
    });

    let allCorrect = true;
    for (const customer of verifyCustomers) {
      const hasCorrectCategory = customer.planCategory === 'development';
      const allUsersCorrect = customer.users.every(u => u.role === 'developer');

      if (!hasCorrectCategory || !allUsersCorrect) {
        console.log(`❌ Issue with customer: ${customer.email}`);
        console.log(`   Plan Category: ${customer.planCategory} (expected: development)`);
        customer.users.forEach(u => {
          console.log(`   User ${u.email}: ${u.role} (expected: developer)`);
        });
        allCorrect = false;
      }
    }

    if (allCorrect) {
      console.log('✅ All development customers and users are now correctly configured!');
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixDeveloperRoles()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

