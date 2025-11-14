# Quick Paystack Setup - 2 Minutes

## The Issue
You're getting **"Payment gateway not configured"** because Paystack keys are not set in your `.env` file.

## Quick Fix (2 Steps)

### Step 1: Get Your Paystack Keys

1. Go to https://dashboard.paystack.com
2. Login or sign up
3. Click **Settings** → **API Keys & Webhooks**
4. Copy your keys:
   - **Test Secret Key** (starts with `sk_test_`)
   - **Test Public Key** (starts with `pk_test_`)

### Step 2: Add to .env File

**Edit `backend/.env` file:**

```env
# Add these lines (replace with your actual keys)
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

**Or create the file if it doesn't exist:**

```bash
cd backend
cat > .env << 'EOF'
DATABASE_URL="your_database_url_here"
PORT=5000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-here
FRONTEND_URL=http://localhost:3000

# Paystack Keys
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
EOF
```

### Step 3: Restart Backend

```bash
# Stop current backend (Ctrl+C)
cd backend
npm run dev
```

### Step 4: Test

1. Login as developer
2. Go to Settings → Billing
3. Click "Change Plan"
4. Select upgrade plan
5. Click "Upgrade Plan"
6. Should redirect to Paystack ✅

## Test Cards

**Success:**
- Card: `4084084084084081`
- CVV: `408`
- PIN: `0000`

**Declined:**
- Card: `5060666666666666666`

## Verify Setup

Check backend logs after restart:
```
[Upgrade] Resolving Paystack configuration...
[Upgrade] Paystack keys resolved: { hasSecretKey: true, hasPublicKey: true, source: 'env' }
```

If you see `source: 'env'` → Setup successful! ✅

## That's It!

Just add the two keys to your `.env` file and restart the backend. The upgrade flow will work immediately. 🚀

