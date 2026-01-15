/**
 * Check property currencies for a user
 * Usage: npx tsx scripts/check-property-currencies.ts <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPropertyCurrencies() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Please provide an email address');
    console.error('Usage: npx tsx scripts/check-property-currencies.ts <email>');
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Checking property currencies for: ${email}\n`);

    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    const properties = await prisma.properties.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        name: true,
        address: true,
        currency: true,
      },
    });

    console.log(`📊 Properties Found: ${properties.length}\n`);

    const currencies = new Set<string>();

    properties.forEach((prop, idx) => {
      const currency = prop.currency || 'NOT SET (defaults to USD)';
      currencies.add(prop.currency || 'USD');

      console.log(`   ${idx + 1}. ${prop.name}`);
      console.log(`      Currency: ${currency}`);
      console.log(`      Address: ${prop.address}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Summary:');
    console.log(`   Total Properties: ${properties.length}`);
    console.log(`   Unique Currencies: ${currencies.size}`);
    console.log(`   Currencies Used: ${Array.from(currencies).join(', ')}\n`);

    if (currencies.size === 1) {
      const singleCurrency = Array.from(currencies)[0];
      console.log(`✅ All properties use ${singleCurrency}`);
      console.log(`   → Dashboard will display in ${singleCurrency === 'USD' ? '$' : singleCurrency === 'NGN' ? '₦' : singleCurrency}\n`);
    } else {
      console.log(`⚠️  Multiple currencies detected`);
      console.log(`   → Dashboard will display in $ (USD) as base currency\n`);
    }

    console.log('💡 To change property currency:');
    console.log('   UPDATE properties SET currency = \'NGN\' WHERE id = \'property-id\';');
    console.log('\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPropertyCurrencies();

