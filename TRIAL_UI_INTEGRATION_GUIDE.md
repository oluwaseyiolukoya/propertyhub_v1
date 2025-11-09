# Trial Management UI - Integration Guide

## Overview

This guide shows you how to integrate the trial management UI components into your existing application.

**Created**: November 8, 2025  
**Status**: Ready for Integration

---

## Components Created

### 1. TrialStatusBanner

**File**: `src/components/TrialStatusBanner.tsx`  
**Purpose**: Display prominent banner showing trial status, grace period, or suspension

**Features**:

- Shows days remaining in trial
- Progress bar visualization
- Urgency-based color coding (blue → yellow → orange → red)
- Grace period warning
- Suspension alert
- Call-to-action buttons

### 2. UpgradeModal

**File**: `src/components/UpgradeModal.tsx`  
**Purpose**: Modal for upgrading from trial to paid subscription

**Features**:

- Plan selection with pricing
- Monthly/Annual billing toggle
- Savings calculator
- Payment method selection
- Order summary
- One-click upgrade

### 3. AccountReactivationPage

**File**: `src/components/AccountReactivationPage.tsx`  
**Purpose**: Full-page view for reactivating suspended accounts

**Features**:

- Suspension status display
- Data retention countdown
- Payment method selection
- Reactivation button
- "What happens next" guide

### 4. TrialCountdown

**File**: `src/components/TrialCountdown.tsx`  
**Purpose**: Compact trial countdown for dashboard header

**Features**:

- Minimal design for header
- Days remaining display
- Urgency indicators
- Click to upgrade

---

## API Endpoints Created

### Backend Routes (`backend/src/routes/subscription.ts`)

1. **GET /api/subscription/status**

   - Get current subscription status
   - Returns trial days remaining, grace period info, etc.

2. **POST /api/subscription/upgrade**

   - Upgrade from trial to paid
   - Requires: `planId`, `billingCycle`, optional `paymentMethodId`

3. **POST /api/subscription/reactivate**

   - Reactivate suspended account
   - Requires: optional `paymentMethodId`

4. **GET /api/subscription/history**
   - Get subscription event history
   - Returns last 50 events

### Frontend API Client (`src/lib/api/subscription.ts`)

- `getSubscriptionStatus()` - Fetch subscription status
- `upgradeSubscription()` - Upgrade to paid plan
- `reactivateAccount()` - Reactivate suspended account
- `getSubscriptionHistory()` - Get event history

---

## Integration Steps

### Step 1: Add to Dashboard Overview

```typescript
// src/components/DashboardOverview.tsx

import { TrialStatusBanner } from "./TrialStatusBanner";
import { UpgradeModal } from "./UpgradeModal";
import { useState } from "react";

export function DashboardOverview() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgradeSuccess = () => {
    // Refresh dashboard data
    window.location.reload();
  };

  const handleAddPaymentMethod = () => {
    // Navigate to billing settings
    // or show payment method modal
  };

  return (
    <div>
      {/* Add Trial Banner at the top */}
      <TrialStatusBanner
        onUpgradeClick={() => setShowUpgradeModal(true)}
        onAddPaymentMethod={handleAddPaymentMethod}
      />

      {/* Rest of your dashboard content */}
      {/* ... */}

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={handleUpgradeSuccess}
      />
    </div>
  );
}
```

### Step 2: Add to Dashboard Header

```typescript
// src/components/DashboardHeader.tsx (or wherever your header is)

import { TrialCountdown } from "./TrialCountdown";

export function DashboardHeader() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <header className="flex items-center justify-between p-4">
      <div>{/* Your logo and navigation */}</div>

      <div className="flex items-center gap-4">
        {/* Add Trial Countdown */}
        <TrialCountdown onUpgradeClick={() => setShowUpgradeModal(true)} />

        {/* Your other header items (notifications, profile, etc.) */}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => window.location.reload()}
      />
    </header>
  );
}
```

### Step 3: Handle Suspended Accounts

```typescript
// src/App.tsx or your main routing component

import { AccountReactivationPage } from "./components/AccountReactivationPage";
import { getSubscriptionStatus } from "./lib/api/subscription";
import { useEffect, useState } from "react";

export function App() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null
  );

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status.status);
    } catch (error) {
      console.error("Failed to check subscription status:", error);
    }
  };

  // Show reactivation page for suspended accounts
  if (subscriptionStatus === "suspended") {
    return (
      <AccountReactivationPage
        onSuccess={() => {
          setSubscriptionStatus("active");
          window.location.reload();
        }}
        onAddPaymentMethod={() => {
          // Navigate to billing settings
        }}
      />
    );
  }

  // Normal app rendering
  return <div>{/* Your app content */}</div>;
}
```

### Step 4: Add Middleware Check (Optional)

For extra security, you can check subscription status before rendering protected routes:

```typescript
// src/components/ProtectedRoute.tsx

import { useEffect, useState } from "react";
import { getSubscriptionStatus } from "../lib/api/subscription";
import { AccountReactivationPage } from "./AccountReactivationPage";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const data = await getSubscriptionStatus();
      setStatus(data.status);
    } catch (error) {
      console.error("Failed to check status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (status === "suspended") {
    return (
      <AccountReactivationPage
        onSuccess={() => window.location.reload()}
        onAddPaymentMethod={() => {
          /* Navigate to billing */
        }}
      />
    );
  }

  return <>{children}</>;
}
```

---

## Styling Notes

### Color Scheme

The components use urgency-based colors:

- **Blue**: Normal trial (7+ days)
- **Yellow**: Warning (4-7 days)
- **Orange**: Urgent (1-3 days) or Grace Period
- **Red**: Critical (0 days) or Suspended

### Animations

- Pulse animation for urgent states
- Smooth transitions on hover
- Loading spinners for async actions

### Responsive Design

All components are mobile-responsive:

- Stack on small screens
- Grid layout on larger screens
- Touch-friendly buttons

---

## Testing

### Manual Testing Checklist

1. **Trial Status**

   - [ ] Banner shows correct days remaining
   - [ ] Progress bar updates correctly
   - [ ] Color changes based on urgency
   - [ ] Countdown in header matches banner

2. **Upgrade Flow**

   - [ ] Can select plan
   - [ ] Monthly/Annual toggle works
   - [ ] Savings calculation correct
   - [ ] Payment method selection works
   - [ ] Upgrade button activates subscription
   - [ ] Success message shows
   - [ ] Dashboard refreshes

3. **Grace Period**

   - [ ] Banner shows grace period warning
   - [ ] Grace days countdown correct
   - [ ] Can upgrade during grace
   - [ ] Can add payment method

4. **Suspension**

   - [ ] Reactivation page shows
   - [ ] Data retention countdown correct
   - [ ] Can select payment method
   - [ ] Reactivation works
   - [ ] Redirects to dashboard after reactivation

5. **Edge Cases**
   - [ ] No payment methods: shows "add payment" button
   - [ ] Multiple payment methods: can select
   - [ ] Network errors: shows error toast
   - [ ] Loading states: shows spinners

### Test Subscription Status

You can manually test different states by updating a customer in Prisma Studio:

```sql
-- Set trial expiring in 1 day
UPDATE customers
SET trial_ends_at = NOW() + INTERVAL '1 day'
WHERE email = 'test@example.com';

-- Set grace period
UPDATE customers
SET trial_ends_at = NOW() - INTERVAL '1 day',
    grace_period_ends_at = NOW() + INTERVAL '2 days'
WHERE email = 'test@example.com';

-- Set suspended
UPDATE customers
SET status = 'suspended',
    suspended_at = NOW(),
    suspension_reason = 'Trial expired without payment'
WHERE email = 'test@example.com';

-- Set active
UPDATE customers
SET status = 'active',
    suspended_at = NULL,
    grace_period_ends_at = NULL
WHERE email = 'test@example.com';
```

---

## Customization

### Change Trial Duration Display

Edit `TrialStatusBanner.tsx`:

```typescript
const totalDays = 14; // Change to your trial duration
```

### Change Color Scheme

Edit the urgency thresholds in `TrialStatusBanner.tsx`:

```typescript
if (daysLeft <= 1) {
  urgencyColor = "red";
} else if (daysLeft <= 3) {
  // Change threshold
  urgencyColor = "orange";
} else if (daysLeft <= 7) {
  // Change threshold
  urgencyColor = "yellow";
}
```

### Add Custom Messages

Edit the text in each component:

```typescript
// TrialStatusBanner.tsx
<p className={`${urgencySubtext} mb-4`}>Your custom message here</p>
```

### Change Button Actions

Pass custom handlers:

```typescript
<TrialStatusBanner
  onUpgradeClick={() => {
    // Your custom upgrade logic
    // e.g., navigate to pricing page
    router.push("/pricing");
  }}
  onAddPaymentMethod={() => {
    // Your custom payment method logic
    // e.g., open Stripe checkout
    openStripeCheckout();
  }}
/>
```

---

## Troubleshooting

### Banner Not Showing

1. Check if user is authenticated
2. Verify API endpoint is accessible
3. Check browser console for errors
4. Ensure subscription status is not 'active'

### Upgrade Not Working

1. Check payment method exists
2. Verify plan ID is valid
3. Check backend logs for errors
4. Ensure user has permission

### Countdown Not Updating

1. Check if `trialEndsAt` is set in database
2. Verify API returns correct data
3. Check component is mounted
4. Ensure interval is not cleared

### Styling Issues

1. Ensure Tailwind CSS is configured
2. Check if custom colors are defined
3. Verify component imports are correct
4. Check for CSS conflicts

---

## Performance Optimization

### Caching

The components cache subscription status for 5 minutes:

```typescript
// Refresh every 5 minutes
const interval = setInterval(loadStatus, 5 * 60 * 1000);
```

To change the cache duration:

```typescript
// Refresh every 10 minutes
const interval = setInterval(loadStatus, 10 * 60 * 1000);
```

### Lazy Loading

For better performance, lazy load the modals:

```typescript
import { lazy, Suspense } from 'react';

const UpgradeModal = lazy(() => import('./UpgradeModal'));

// Usage
<Suspense fallback={<div>Loading...</div>}>
  <UpgradeModal ... />
</Suspense>
```

---

## Next Steps

1. **Integrate components** into your dashboard
2. **Test all flows** (trial, grace, suspension, upgrade)
3. **Customize styling** to match your brand
4. **Add analytics** tracking for upgrade conversions
5. **Monitor performance** and user feedback

---

## Support

For issues or questions:

- Check backend logs: `backend/logs/`
- Check browser console for errors
- Review API responses in Network tab
- Test with different subscription states

---

**Integration Complete!** 🎉

Your trial management UI is ready to use. Follow the integration steps above to add it to your application.
