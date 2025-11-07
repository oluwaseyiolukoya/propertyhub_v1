# 💳 Paystack Payment Setup Guide

This guide explains how to set up Paystack for local development and testing.

---

## 🎯 Understanding the Errors

The errors you're seeing are because:

1. **CORS Errors** (pusher.min.js, paystack.jpg):

   - These are from Paystack's checkout popup
   - They're **cosmetic** and don't affect functionality
   - They happen because Paystack loads resources from S3

2. **500 Error** (/api/payment-methods):
   - This happens because **Paystack API keys are not configured**
   - The backend can't communicate with Paystack without valid keys

---

## 🔑 Get Paystack Test Keys

### Step 1: Create Paystack Account (If you don't have one)

1. Go to: https://paystack.com/
2. Click "Get Started"
3. Sign up for a free account

### Step 2: Get Test API Keys

1. Log in to Paystack Dashboard: https://dashboard.paystack.com/
2. Click on **Settings** (gear icon)
3. Click on **API Keys & Webhooks**
4. You'll see two test keys:
   - **Public Key**: `pk_test_...`
   - **Secret Key**: `sk_test_...`

---

## 🛠️ Configure for Local Development

### Option 1: Quick Setup (For Testing)

Add Paystack test keys to your backend `.env` file:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# Add these lines to .env (not .env.local)
cat >> .env <<EOF

# Paystack Test Keys
PAYSTACK_TEST_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
PAYSTACK_TEST_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
EOF
```

### Option 2: Configure via Frontend (Recommended)

1. **Log in as Property Owner**:

   - Email: `john@metro-properties.com`
   - Password: `owner123`

2. **Go to Settings**:

   - Click on your name (top right)
   - Click "Settings"

3. **Configure Payment Gateway**:
   - Scroll to "Payment Gateway Settings"
   - Select "Paystack"
   - Enter your test keys:
     - **Public Key**: `pk_test_...`
     - **Secret Key**: `sk_test_...`
   - Click "Save"

---

## 🧪 Testing Payments

### Test Card Numbers (Paystack)

Use these test cards to simulate different scenarios:

#### Successful Payment

```
Card Number: 4084084084084081
CVV: 408
Expiry: Any future date
PIN: 0000
OTP: 123456
```

#### Declined Payment

```
Card Number: 5060666666666666666
CVV: 123
Expiry: Any future date
```

#### Insufficient Funds

```
Card Number: 5060666666666666666
CVV: 123
Expiry: Any future date
PIN: 0000
```

---

## 🔄 Restart Backend After Configuration

After adding Paystack keys:

```bash
# Stop backend
pkill -f "tsx watch src/index.ts"

# Start backend
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
npm run dev
```

---

## 🎯 How Paystack Integration Works

### Architecture

```
Tenant (Frontend)
    ↓
Get Owner's Paystack Public Key
    ↓
Paystack Checkout Popup (Client-side)
    ↓
Card Tokenization (Paystack)
    ↓
Send Token to Backend
    ↓
Backend Charges Card (using Owner's Secret Key)
    ↓
Payment Recorded
```

### Multi-Tenant Setup

- Each **Property Owner** configures their own Paystack keys
- **Tenants** pay using their owner's Paystack account
- **Platform** doesn't handle money directly
- **Owners** receive payments in their Paystack account

---

## 🐛 Troubleshooting

### Issue 1: CORS Errors (pusher.min.js, paystack.jpg)

**Status**: ⚠️ Cosmetic only

**Explanation**:

- These are from Paystack's checkout popup
- They don't affect functionality
- They happen in development mode
- They won't appear in production

**Solution**: Ignore them - they're harmless!

---

### Issue 2: 500 Error on /api/payment-methods

**Status**: ❌ Blocks functionality

**Cause**: Paystack keys not configured

**Solution**:

1. Add test keys to backend `.env` file, OR
2. Configure via frontend (Property Owner Settings)
3. Restart backend

---

### Issue 3: "Invalid API Key"

**Cause**: Using wrong keys or mixing test/live keys

**Solution**:

- Ensure you're using **test keys** (`pk_test_...` and `sk_test_...`)
- Don't mix test and live keys
- Copy keys carefully (no extra spaces)

---

### Issue 4: Card Authorization Fails

**Cause**: Using real card instead of test card

**Solution**:

- Use Paystack test card: `4084084084084081`
- Never use real cards in test mode

---

## 📝 Environment Variables

### Backend `.env` (Optional - for platform-level payments)

```bash
# Paystack Test Keys (Optional)
PAYSTACK_TEST_PUBLIC_KEY=pk_test_...
PAYSTACK_TEST_SECRET_KEY=sk_test_...

# Paystack Live Keys (Production only)
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
```

### Owner-Level Configuration (Recommended)

Property owners configure their keys via:

- Frontend → Settings → Payment Gateway Settings
- Stored in database (`payment_settings` table)

---

## 🎯 Quick Test Flow

### 1. Configure Paystack (One-time)

```bash
# Add to backend/.env
echo "PAYSTACK_TEST_PUBLIC_KEY=pk_test_YOUR_KEY" >> backend/.env
echo "PAYSTACK_TEST_SECRET_KEY=sk_test_YOUR_KEY" >> backend/.env

# Restart backend
pkill -f "tsx watch src/index.ts"
cd backend && npm run dev
```

### 2. Test as Tenant

1. Log in as tenant: `tenant1@metro-properties.com` / `tenant123`
2. Go to **Payments** → **Payment Methods**
3. Click **Add Card**
4. Enter test card: `4084084084084081`
5. CVV: `408`, Expiry: `12/25`
6. PIN: `0000`, OTP: `123456`
7. Card should be added successfully!

---

## 🚀 Production Setup

### When Deploying to AWS

1. **Get Live Paystack Keys**:

   - Go to Paystack Dashboard
   - Switch to "Live Mode"
   - Copy live keys (`pk_live_...` and `sk_live_...`)

2. **Add to AWS Secrets Manager**:

   ```bash
   aws secretsmanager update-secret \
     --secret-id ph-dev-app-secrets \
     --secret-string '{
       "DATABASE_URL": "...",
       "JWT_SECRET": "...",
       "PAYSTACK_PUBLIC_KEY": "pk_live_...",
       "PAYSTACK_SECRET_KEY": "sk_live_..."
     }'
   ```

3. **Property Owners Configure Their Keys**:
   - Each owner logs in
   - Goes to Settings → Payment Gateway
   - Enters their live Paystack keys

---

## 💡 Best Practices

### For Development

- ✅ Use test keys
- ✅ Use test cards
- ✅ Test all payment scenarios
- ❌ Never use real cards
- ❌ Never use live keys

### For Production

- ✅ Use live keys
- ✅ Enable webhooks
- ✅ Test with small amounts first
- ✅ Monitor transactions
- ❌ Never commit keys to git

---

## 📚 Additional Resources

- **Paystack Documentation**: https://paystack.com/docs
- **Test Cards**: https://paystack.com/docs/payments/test-payments
- **API Reference**: https://paystack.com/docs/api
- **Webhooks**: https://paystack.com/docs/payments/webhooks

---

## 🎉 Summary

**To fix the 500 error:**

1. Get Paystack test keys from https://dashboard.paystack.com/
2. Add to `backend/.env`:
   ```
   PAYSTACK_TEST_PUBLIC_KEY=pk_test_...
   PAYSTACK_TEST_SECRET_KEY=sk_test_...
   ```
3. Restart backend
4. Test with card: `4084084084084081`

**The CORS errors are harmless and can be ignored!**

---

**Need help?** Check the Paystack documentation or contact their support!
