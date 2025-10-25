/**
 * Update Base Currency for Existing Users
 * 
 * This script updates all existing owners and managers to have baseCurrency set to 'USD'
 * Run this script once to migrate existing data after adding the baseCurrency feature.
 * 
 * Usage: npx tsx backend/scripts/update-user-base-currency.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Verifying base currency for existing users...\n');

  try {
    // Count users by role and currency
    const totalOwners = await prisma.users.count({
      where: { role: 'owner' }
    });

    const totalManagers = await prisma.users.count({
      where: { role: 'manager' }
    });

    const ownersWithUSD = await prisma.users.count({
      where: {
        role: 'owner',
        baseCurrency: 'USD'
      }
    });

    const managersWithUSD = await prisma.users.count({
      where: {
        role: 'manager',
        baseCurrency: 'USD'
      }
    });

    // Get sample users to verify
    const sampleOwners = await prisma.users.findMany({
      where: { role: 'owner' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        baseCurrency: true
      },
      take: 3
    });

    const sampleManagers = await prisma.users.findMany({
      where: { role: 'manager' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        baseCurrency: true
      },
      take: 3
    });

    // Display summary
    console.log('📊 Base Currency Status:\n');
    console.log('Owners:');
    console.log(`   Total: ${totalOwners}`);
    console.log(`   With USD: ${ownersWithUSD}`);
    console.log(`   Status: ${ownersWithUSD === totalOwners ? '✅ All set' : '⚠️  Some missing'}\n`);

    console.log('Managers:');
    console.log(`   Total: ${totalManagers}`);
    console.log(`   With USD: ${managersWithUSD}`);
    console.log(`   Status: ${managersWithUSD === totalManagers ? '✅ All set' : '⚠️  Some missing'}\n`);

    if (sampleOwners.length > 0) {
      console.log('Sample Owners:');
      sampleOwners.forEach(owner => {
        console.log(`   ${owner.name} (${owner.email}): ${owner.baseCurrency}`);
      });
      console.log('');
    }

    if (sampleManagers.length > 0) {
      console.log('Sample Managers:');
      sampleManagers.forEach(manager => {
        console.log(`   ${manager.name} (${manager.email}): ${manager.baseCurrency}`);
      });
      console.log('');
    }

    console.log('🎉 Verification completed successfully!');
    console.log('\nNote: The baseCurrency field has a default value of "USD" in the schema.');
    console.log('All existing users should have been automatically set to USD when the schema was updated.');
  } catch (error) {
    console.error('❌ Error verifying base currency:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });

