# Setup Paystack in Production

## Problem
Developer upgrade is failing with "Invalid key" error because Paystack API keys are not configured in production.

## Solution: Add Paystack Keys to Production

### Option 1: Add to System Settings (Recommended)

Run this in the **DigitalOcean Console**:

```bash
# Connect to production database and add Paystack configuration
cd /workspace/backend

# Run this node script
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupPaystack() {
  try {
    // Check if already exists
    const existing = await prisma.system_settings.findUnique({
      where: { key: 'payments.paystack' }
    });

    if (existing) {
      console.log('✅ Paystack already configured');
      console.log('Current value:', existing.value);
      return;
    }

    // Add Paystack configuration
    await prisma.system_settings.create({
      data: {
        key: 'payments.paystack',
        value: {
          secretKey: process.env.PAYSTACK_SECRET_KEY || 'YOUR_SECRET_KEY_HERE',
          publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'YOUR_PUBLIC_KEY_HERE',
          testMode: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Paystack configuration added to system_settings');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

setupPaystack();
"
```

### Option 2: Add Environment Variables in DigitalOcean

1. Go to your DigitalOcean App Platform dashboard
2. Click on your backend app
3. Go to **Settings** → **App-Level Environment Variables**
4. Add these variables:
   - `PAYSTACK_SECRET_KEY` = `sk_test_your_secret_key_here`
   - `PAYSTACK_PUBLIC_KEY` = `pk_test_your_public_key_here`
5. Click **Save**
6. Redeploy the app

### Option 3: Manual SQL Insert

Run this in the DigitalOcean Console:

```bash
# Connect to database
cd /workspace/backend

# Insert Paystack config
npx prisma db execute --stdin <<EOF
INSERT INTO system_settings (key, value, "createdAt", "updatedAt")
VALUES (
  'payments.paystack',
  '{"secretKey":"sk_test_YOUR_KEY","publicKey":"pk_test_YOUR_KEY","testMode":true}',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    "updatedAt" = NOW();
EOF
```

---

## Get Your Paystack Keys

1. Go to https://dashboard.paystack.com
2. Sign up or login
3. Navigate to **Settings** → **API Keys & Webhooks**
4. Copy your:
   - **Test Secret Key** (starts with `sk_test_`)
   - **Test Public Key** (starts with `pk_test_`)

---

## Verify Configuration

After adding the keys, run this in the console to verify:

```bash
cd /workspace/backend

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const settings = await prisma.system_settings.findUnique({
    where: { key: 'payments.paystack' }
  });
  
  console.log('Paystack configured:', !!settings);
  if (settings) {
    const value = settings.value;
    console.log('Has secret key:', !!(value.secretKey));
    console.log('Has public key:', !!(value.publicKey));
    console.log('Test mode:', value.testMode);
  }
  
  await prisma.\$disconnect();
}

check();
"
```

Should show:
```
Paystack configured: true
Has secret key: true
Has public key: true
Test mode: true
```

---

## Test Upgrade

After configuration:
1. Login as developer in production
2. Go to Settings → Billing
3. Click "Change Plan"
4. Select upgrade plan
5. Click "Upgrade Plan"
6. Should redirect to Paystack payment page ✅

---

## Important Notes

- ✅ Use **Test keys** for testing
- ✅ Switch to **Live keys** when ready for production
- ⚠️ Never commit API keys to git
- ⚠️ Keep secret keys secure

