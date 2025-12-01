#!/bin/bash

# Check Paystack Keys in Production
# Run this in DigitalOcean Console

echo "🔍 Checking Paystack Configuration in Production"
echo "================================================"
echo ""

cd /workspace/backend

# Check environment variables
echo "1️⃣ Environment Variables:"
echo "   PAYSTACK_SECRET_KEY: ${PAYSTACK_SECRET_KEY:0:10}... (${#PAYSTACK_SECRET_KEY} chars)"
echo "   PAYSTACK_PUBLIC_KEY: ${PAYSTACK_PUBLIC_KEY:0:10}... (${#PAYSTACK_PUBLIC_KEY} chars)"
echo ""

# Check system settings
echo "2️⃣ System Settings (database):"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const settings = await prisma.system_settings.findUnique({
      where: { key: 'payments.paystack' }
    });

    if (settings) {
      const value = settings.value;
      console.log('   ✅ Found in system_settings');
      console.log('   Secret Key:', value.secretKey ? value.secretKey.substring(0, 10) + '... (' + value.secretKey.length + ' chars)' : 'NOT SET');
      console.log('   Public Key:', value.publicKey ? value.publicKey.substring(0, 10) + '... (' + value.publicKey.length + ' chars)' : 'NOT SET');
      console.log('   Test Mode:', value.testMode);
    } else {
      console.log('   ❌ Not found in system_settings');
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

check();
"

echo ""
echo "3️⃣ Key Format Validation:"
echo ""

# Validate key format
if [[ $PAYSTACK_SECRET_KEY == sk_test_* ]]; then
  echo "   ✅ Secret key format looks correct (starts with sk_test_)"
elif [[ $PAYSTACK_SECRET_KEY == sk_live_* ]]; then
  echo "   ✅ Secret key format looks correct (starts with sk_live_)"
else
  echo "   ❌ Secret key format is INVALID (should start with sk_test_ or sk_live_)"
fi

if [[ $PAYSTACK_PUBLIC_KEY == pk_test_* ]]; then
  echo "   ✅ Public key format looks correct (starts with pk_test_)"
elif [[ $PAYSTACK_PUBLIC_KEY == pk_live_* ]]; then
  echo "   ✅ Public key format looks correct (starts with pk_live_)"
else
  echo "   ❌ Public key format is INVALID (should start with pk_test_ or pk_live_)"
fi

echo ""
echo "================================================"
echo "✅ Check complete!"

