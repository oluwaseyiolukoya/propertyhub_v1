# Paystack Setup Guide for Plan Upgrades

## Issue
Getting error: **"Failed to initialize upgrade payment"**

## Root Cause
The Paystack payment gateway is not configured in the `system_settings` table.

## Solution

### Step 1: Get Paystack API Keys

1. **Sign up/Login to Paystack:**
   - Go to https://paystack.com
   - Create an account or login
   - Navigate to Settings → API Keys & Webhooks

2. **Get Your Keys:**
   - **Test Mode Keys** (for development):
     - Public Key: `pk_test_xxxxxxxxxxxxx`
     - Secret Key: `sk_test_xxxxxxxxxxxxx`
   - **Live Mode Keys** (for production):
     - Public Key: `pk_live_xxxxxxxxxxxxx`
     - Secret Key: `sk_live_xxxxxxxxxxxxx`

### Step 2: Configure Paystack in Database

#### Option A: Using Prisma Studio (Recommended)

1. **Start Prisma Studio:**
```bash
cd backend
npx prisma studio
```

2. **Navigate to `system_settings` table**

3. **Add New Record:**
   - Click "Add record"
   - Fill in the fields:
     - **key:** `payments.paystack`
     - **value:** (Click "Edit JSON" and paste):
```json
{
  "secretKey": "sk_test_your_secret_key_here",
  "publicKey": "pk_test_your_public_key_here",
  "testMode": true
}
```
   - Click "Save 1 change"

#### Option B: Using SQL Query

```sql
INSERT INTO system_settings (key, value, createdAt, updatedAt)
VALUES (
  'payments.paystack',
  '{"secretKey":"sk_test_your_secret_key_here","publicKey":"pk_test_your_public_key_here","testMode":true}',
  NOW(),
  NOW()
);
```

#### Option C: Using Node.js Script

Create a file `backend/scripts/setup-paystack.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupPaystack() {
  try {
    // Check if already exists
    const existing = await prisma.system_settings.findUnique({
      where: { key: 'payments.paystack' }
    });

    if (existing) {
      console.log('⚠️  Paystack configuration already exists');
      console.log('Current value:', existing.value);
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Do you want to update it? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
          await updatePaystack();
        } else {
          console.log('Cancelled');
          process.exit(0);
        }
        readline.close();
      });
    } else {
      await createPaystack();
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function createPaystack() {
  const paystackConfig = {
    secretKey: process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key_here',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key_here',
    testMode: true
  };

  await prisma.system_settings.create({
    data: {
      key: 'payments.paystack',
      value: paystackConfig,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log('✅ Paystack configuration created successfully!');
  console.log('Configuration:', paystackConfig);
  
  await prisma.$disconnect();
  process.exit(0);
}

async function updatePaystack() {
  const paystackConfig = {
    secretKey: process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key_here',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key_here',
    testMode: true
  };

  await prisma.system_settings.update({
    where: { key: 'payments.paystack' },
    data: {
      value: paystackConfig,
      updatedAt: new Date()
    }
  });

  console.log('✅ Paystack configuration updated successfully!');
  console.log('Configuration:', paystackConfig);
  
  await prisma.$disconnect();
  process.exit(0);
}

setupPaystack();
```

**Run the script:**
```bash
cd backend
node scripts/setup-paystack.js
```

**Or with environment variables:**
```bash
PAYSTACK_SECRET_KEY=sk_test_xxx PAYSTACK_PUBLIC_KEY=pk_test_xxx node scripts/setup-paystack.js
```

### Step 3: Verify Configuration

1. **Check in Prisma Studio:**
   - Open `system_settings` table
   - Look for key `payments.paystack`
   - Verify the value contains your keys

2. **Check in Backend Logs:**
   - Restart your backend server
   - Try to upgrade a plan
   - Check backend logs for:
```
[Upgrade] Initialize payment for user: xxx plan: xxx
[Upgrade] Invoice created: xxx
[Upgrade] Paystack initialized successfully: xxx
```

### Step 4: Test the Integration

1. **Login as Developer**
2. **Go to Settings → Billing**
3. **Click "Change Plan"**
4. **Select an upgrade plan**
5. **Click "Upgrade Plan"**
6. **You should be redirected to Paystack**

### Test Cards (Paystack)

**Successful Payment:**
- Card Number: `4084084084084081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`

**Declined Payment:**
- Card Number: `5060666666666666666`
- CVV: Any 3 digits
- Expiry: Any future date

## Troubleshooting

### Error: "Payment gateway not configured"

**Cause:** Paystack keys not found in `system_settings`

**Solution:**
1. Follow Step 2 above to add configuration
2. Restart backend server
3. Try again

### Error: "Failed to initialize payment"

**Possible Causes:**
1. **Invalid API Keys:**
   - Verify keys are correct
   - Check if using test keys in test mode
   - Check if using live keys in live mode

2. **Paystack API Down:**
   - Check https://status.paystack.com
   - Try again later

3. **Network Issues:**
   - Check internet connection
   - Check firewall settings

**Debug Steps:**
1. Check backend logs for detailed error
2. Verify Paystack configuration in database
3. Test API keys using curl:
```bash
curl https://api.paystack.co/transaction/initialize \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","amount":"10000"}' \
  -X POST
```

### Error: "Invalid plan category"

**Cause:** Trying to upgrade to wrong plan type

**Solution:**
- Developers can only upgrade to development plans
- Property owners/managers can only upgrade to property management plans
- Check plan category in database

### Error: "Customer not found"

**Cause:** User has no associated customer record

**Solution:**
1. Check if user has `customerId` field populated
2. Check if customer record exists in `customers` table
3. Verify user was created properly

## Production Setup

### For Production (Live Mode):

1. **Get Live API Keys from Paystack**
2. **Update system_settings:**
```json
{
  "secretKey": "sk_live_your_live_secret_key",
  "publicKey": "pk_live_your_live_public_key",
  "testMode": false
}
   ```

3. **Set Environment Variable:**
```env
FRONTEND_URL=https://contrezz.com
```

4. **Configure Webhook (Optional but Recommended):**
   - Go to Paystack Dashboard → Settings → Webhooks
   - Add webhook URL: `https://api.contrezz.com/api/webhooks/paystack`
   - This allows automatic payment verification

## Security Best Practices

1. **Never commit API keys to git**
   - Use environment variables
   - Add to `.gitignore`

2. **Use test keys in development**
   - Set `testMode: true`
   - Use test cards

3. **Use live keys only in production**
   - Set `testMode: false`
   - Use real cards

4. **Rotate keys periodically**
   - Generate new keys every 6 months
   - Update in database

5. **Monitor transactions**
   - Check Paystack dashboard regularly
   - Set up alerts for failed payments

## Quick Fix Script

Save this as `backend/scripts/quick-setup-paystack.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickSetup() {
  const config = {
    secretKey: 'sk_test_your_secret_key_here',  // ← REPLACE THIS
    publicKey: 'pk_test_your_public_key_here',  // ← REPLACE THIS
    testMode: true
  };

  try {
    await prisma.system_settings.upsert({
      where: { key: 'payments.paystack' },
      update: { value: config, updatedAt: new Date() },
      create: {
        key: 'payments.paystack',
        value: config,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Paystack configured successfully!');
    console.log('You can now test plan upgrades.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickSetup();
```

**Run:**
```bash
cd backend
node scripts/quick-setup-paystack.js
```

## Summary

To fix the "Failed to initialize upgrade payment" error:

1. ✅ Get Paystack API keys from https://paystack.com
2. ✅ Add to `system_settings` table with key `payments.paystack`
3. ✅ Restart backend server
4. ✅ Test upgrade flow

That's it! The payment gateway should now work. 🚀
