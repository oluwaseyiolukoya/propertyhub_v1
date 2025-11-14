const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupPaystack() {
  console.log('🔧 Setting up Paystack configuration...\n');

  // Get keys from environment or use placeholders
  const secretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key_here';
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key_here';

  if (secretKey === 'sk_test_your_secret_key_here' || publicKey === 'pk_test_your_public_key_here') {
    console.log('⚠️  WARNING: Using placeholder keys!');
    console.log('Please replace with your actual Paystack keys.\n');
    console.log('Get your keys from: https://dashboard.paystack.com/#/settings/developers\n');
    console.log('Then run:');
    console.log('PAYSTACK_SECRET_KEY=sk_test_xxx PAYSTACK_PUBLIC_KEY=pk_test_xxx node scripts/setup-paystack.js\n');
  }

  const config = {
    secretKey,
    publicKey,
    testMode: true
  };

  try {
    // Check if already exists
    const existing = await prisma.system_settings.findUnique({
      where: { key: 'payments.paystack' }
    });

    if (existing) {
      console.log('📝 Paystack configuration already exists');
      console.log('Current value:', JSON.stringify(existing.value, null, 2));
      console.log('\n🔄 Updating configuration...');

      await prisma.system_settings.update({
        where: { key: 'payments.paystack' },
        data: {
          value: config,
          updatedAt: new Date()
        }
      });

      console.log('✅ Paystack configuration updated successfully!');
    } else {
      console.log('➕ Creating new Paystack configuration...');

      await prisma.system_settings.create({
        data: {
          key: 'payments.paystack',
          value: config,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log('✅ Paystack configuration created successfully!');
    }

    console.log('\n📋 Configuration:');
    console.log(JSON.stringify(config, null, 2));
    console.log('\n🎉 Setup complete! You can now test plan upgrades.');
    console.log('\nTest cards:');
    console.log('  Success: 4084084084084081');
    console.log('  Declined: 5060666666666666666');

  } catch (error) {
    console.error('❌ Error setting up Paystack:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupPaystack();

