# Payment Architecture - Paystack Integration

## Overview

The system supports **two separate payment flows** for different purposes. Understanding this distinction is crucial for proper configuration.

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOWS                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. PLATFORM SUBSCRIPTIONS (Optional)                        │
│     Admin → Property Owners                                  │
│     ┌──────────────────────────────────────┐               │
│     │  Owner buys subscription plan         │               │
│     │  Uses: Platform Paystack keys         │               │
│     │  From: Backend ENV variables          │               │
│     │  Revenue: Goes to platform owner      │               │
│     └──────────────────────────────────────┘               │
│                                                               │
│  2. RENT PAYMENTS (Main Use Case) ✅                         │
│     Tenant → Property Owner                                  │
│     ┌──────────────────────────────────────┐               │
│     │  Tenant pays rent/fees                │               │
│     │  Uses: Owner's Paystack keys          │               │
│     │  From: Database (payment_settings)    │               │
│     │  Revenue: Goes to property owner      │               │
│     └──────────────────────────────────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 1️⃣ Platform Subscription Payments (Optional)

### Purpose
Charge property owners for using your SaaS platform (subscription plans, premium features, etc.)

### Configuration
**Backend Environment Variables (Render):**
```env
# Platform-level Paystack account
PAYSTACK_SECRET_KEY=sk_live_your_platform_account
PAYSTACK_PUBLIC_KEY=pk_live_your_platform_account
```

### When to Use
- ✅ You're charging monthly/yearly subscription fees
- ✅ You offer premium plans (Basic, Pro, Enterprise)
- ✅ Platform revenue model (you make money from subscriptions)

### When NOT to Use
- ❌ You're offering free platform access
- ❌ You only want to facilitate tenant payments
- ❌ You don't have a subscription billing model

### Implementation Status
- Route: `backend/src/routes/plans.ts`
- Currently set up but optional
- Can be disabled if not needed

## 2️⃣ Rent/Fee Payments (Main Use Case) ✅

### Purpose
Enable tenants to pay rent, deposits, and fees to property owners

### Configuration
**Configured by Each Owner in Frontend UI:**

1. Owner logs in → Settings → Payment Gateway
2. Enters their own Paystack keys:
   - Secret Key: `sk_live_owner_account`
   - Public Key: `pk_live_owner_account`
3. Keys stored in database:
   ```sql
   payment_settings {
     customerId: owner_id
     provider: 'paystack'
     secretKey: 'sk_live_owner_account'
     publicKey: 'pk_live_owner_account'
   }
   ```

### Flow

```
┌──────────┐         ┌──────────────┐         ┌──────────────┐
│  Tenant  │────────▶│   Backend    │────────▶│  Database    │
│          │  Pay    │              │  Fetch  │              │
│  Clicks  │  Rent   │  Get owner's │  Keys   │payment_      │
│  "Pay"   │         │  Paystack    │         │settings      │
└──────────┘         │  keys        │         └──────────────┘
                     │              │
                     │  Initialize  │
                     │  payment     │
                     │  with owner  │
                     │  keys        │
                     │              │
                     ▼              
            ┌──────────────────┐
            │   Paystack API   │
            │                  │
            │  Uses owner's    │
            │  account         │
            └──────────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  Owner's Bank    │
            │  Account         │
            │  (receives $$)   │
            └──────────────────┘
```

### Key Implementation

**Backend retrieves owner's keys dynamically:**
```typescript
// backend/src/routes/payments.ts - Tenant payment initialization
const paymentSettings = await prisma.payment_settings.findUnique({
  where: {
    customerId_provider: {
      customerId: ownerId,
      provider: 'paystack'
    }
  }
});

if (!paymentSettings || !paymentSettings.isEnabled) {
  return res.status(400).json({ 
    error: 'Owner has not configured Paystack' 
  });
}

// Use owner's secret key for this transaction
const response = await axios.post(
  'https://api.paystack.co/transaction/initialize',
  paymentData,
  {
    headers: {
      Authorization: `Bearer ${paymentSettings.secretKey}`
    }
  }
);
```

### Security
- ✅ Secret keys stored in database (not exposed to frontend)
- ✅ Only public key sent to frontend for checkout
- ✅ Each owner controls their own payment gateway
- ✅ Payments go directly to owner's Paystack account

## 📋 Configuration Summary

### For Render Deployment

**Minimum Required (Rent payments only):**
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-strong-secret
FRONTEND_URL=https://your-frontend.vercel.app
```

**Optional (If you want subscription billing):**
```env
PAYSTACK_SECRET_KEY=sk_live_your_platform_key
PAYSTACK_PUBLIC_KEY=pk_live_your_platform_key
```

### For Local Development

**Backend `.env`:**
```env
DATABASE_URL=postgresql://localhost:5432/contrezz
JWT_SECRET=dev-secret-key
FRONTEND_URL=http://localhost:5173

# Optional - only for testing subscription billing
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
```

**Property Owners Configure Individually:**
- Each owner adds their keys in the frontend UI
- Test with Paystack test keys: `sk_test_...`, `pk_test_...`
- Switch to live keys when ready

## 🎯 Decision Guide

### Do I Need Platform Paystack Keys in Render?

**NO - If:**
- ❌ You're offering free platform access
- ❌ You only want tenants to pay owners
- ❌ You don't have subscription plans
- ✅ **This is most common for property management systems**

**YES - If:**
- ✅ You're charging owners monthly/yearly fees
- ✅ You have tiered pricing (Basic/Pro/Enterprise)
- ✅ You need platform revenue from subscriptions
- ✅ **This is for SaaS monetization**

## 🔧 How to Disable Subscription Billing

If you don't need platform subscriptions:

1. **Don't set Paystack ENV vars in Render**
2. **Optional:** Hide subscription UI in Super Admin dashboard
3. **Optional:** Disable subscription routes in backend

The tenant payment flow will work perfectly without platform Paystack keys!

## 🧪 Testing

### Testing Tenant Payments

1. **Owner Setup:**
   - Log in as owner
   - Go to Settings → Payment Gateway
   - Add Paystack test keys:
     - Secret: `sk_test_...`
     - Public: `pk_test_...`
   - Enable Paystack

2. **Tenant Payment:**
   - Log in as tenant
   - Go to Payments
   - Click "Pay Now" on an invoice
   - Redirected to Paystack test checkout
   - Use test card: `4084 0840 8408 4081`
   - Payment processes to owner's test account

### Testing Subscription Billing (If Enabled)

1. **Set platform keys in backend `.env`**
2. **Owner subscribes to plan**
3. **Payment goes to platform account**

## 📊 Revenue Flows

### Without Platform Paystack (Most Common)
```
Tenant ──(pays rent)──▶ Owner's Bank Account
                        (100% to owner)
```

### With Platform Paystack (SaaS Model)
```
Tenant ──(pays rent)──▶ Owner's Bank Account (100% to owner)
Owner ──(pays subscription)──▶ Platform Bank Account (your revenue)
```

## 🔐 Security Best Practices

1. **Never expose secret keys in frontend**
   - ✅ Stored in database
   - ✅ Only used in backend

2. **Use environment-specific keys**
   - Development: Test keys
   - Production: Live keys

3. **Validate webhook signatures**
   - Verify requests are from Paystack
   - Prevent fraudulent payment confirmations

4. **Test thoroughly before going live**
   - Use Paystack test mode
   - Verify payment flows
   - Check bank account deposits

## 📚 Related Documentation

- [RENDER_QUICK_SETUP.md](setup/RENDER_QUICK_SETUP.md) - Deployment guide
- [PAYMENT_METHODS_IMPLEMENTATION.md](features/PAYMENT_METHODS_IMPLEMENTATION.md) - Payment features
- [Paystack Documentation](https://paystack.com/docs/api/) - Official API docs

---

**Key Takeaway:** Most property management systems only need rent payment functionality (flow #2). Platform subscription keys are optional and only needed if you're monetizing the platform itself through subscription fees.

