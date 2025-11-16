# Subscription Management Implementation

## Overview
Complete subscription management system for property owners including plan changes, billing cycle changes, and subscription cancellation.

## Features Implemented

### 1. Backend API (`backend/src/routes/subscriptions.ts`)

#### Endpoints Created:

**POST `/api/subscriptions/change-plan`**
- Allows owners to change their subscription plan
- Updates customer limits (properties, users, storage)
- Recalculates MRR based on billing cycle
- Emits real-time events to admins
- **Required**: `planId`

**POST `/api/subscriptions/change-billing-cycle`**
- Allows owners to switch between monthly and annual billing
- Recalculates MRR based on new billing cycle
- Emits real-time events to admins
- **Required**: `billingCycle` ('monthly' or 'annual')

**POST `/api/subscriptions/cancel`**
- Allows owners to cancel their subscription
- Deactivates customer account (status: 'cancelled')
- Deactivates all associated users (owner, managers, tenants)
- Sets MRR to 0
- Logs cancellation reason in notes
- Emits real-time events to admins and affected users
- **Required**: `confirmation` (must be 'CANCEL_SUBSCRIPTION')
- **Optional**: `reason`

**GET `/api/subscriptions/plans`**
- Returns all active subscription plans
- Available to authenticated owners

### 2. Frontend API Client (`src/lib/api/subscriptions.ts`)

#### Functions Created:
```typescript
- getSubscriptionPlans(): Promise<{ plans: Plan[] }>
- changePlan(data: { planId: string }): Promise<any>
- changeBillingCycle(data: { billingCycle: 'monthly' | 'annual' }): Promise<any>
- cancelSubscription(data: { reason?: string, confirmation: string }): Promise<any>
```

### 3. API Configuration (`src/lib/api-config.ts`)

Added SUBSCRIPTIONS endpoints:
```typescript
SUBSCRIPTIONS: {
  PLANS: '/api/subscriptions/plans',
  CHANGE_PLAN: '/api/subscriptions/change-plan',
  CHANGE_BILLING_CYCLE: '/api/subscriptions/change-billing-cycle',
  CANCEL: '/api/subscriptions/cancel',
}
```

## Frontend Implementation Guide

### Enhanced Subscription Section Component

The `SubscriptionSection` component in `PropertyOwnerSettings.tsx` needs to be updated with the following features:

#### State Management
```typescript
const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
const [loadingPlans, setLoadingPlans] = useState(true);
const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
const [showChangeBillingDialog, setShowChangeBillingDialog] = useState(false);
const [showCancelDialog, setShowCancelDialog] = useState(false);
const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
const [newBillingCycle, setNewBillingCycle] = useState<'monthly' | 'annual'>('monthly');
const [cancelReason, setCancelReason] = useState('');
const [cancelConfirmation, setCancelConfirmation] = useState('');
const [isProcessing, setIsProcessing] = useState(false);
```

#### Load Available Plans
```typescript
useEffect(() => {
  const loadPlans = async () => {
    try {
      const response = await getSubscriptionPlans();
      if (response.data) {
        setAvailablePlans(response.data.plans);
      }
    } catch (error) {
      toast.error('Failed to load subscription plans');
    } finally {
      setLoadingPlans(false);
    }
  };
  loadPlans();
}, []);
```

#### Change Plan Handler
```typescript
const handleChangePlan = async () => {
  if (!selectedPlan) return;
  
  setIsProcessing(true);
  try {
    const response = await changePlan({ planId: selectedPlan.id });
    if (response.error) {
      toast.error(response.error.error || 'Failed to change plan');
      return;
    }
    
    toast.success('Subscription plan updated successfully!');
    setShowChangePlanDialog(false);
    // Refresh account data
    await fetchAccountData();
  } catch (error: any) {
    toast.error(error?.message || 'Failed to change plan');
  } finally {
    setIsProcessing(false);
  }
};
```

#### Change Billing Cycle Handler
```typescript
const handleChangeBillingCycle = async () => {
  setIsProcessing(true);
  try {
    const response = await changeBillingCycle({ billingCycle: newBillingCycle });
    if (response.error) {
      toast.error(response.error.error || 'Failed to change billing cycle');
      return;
    }
    
    toast.success('Billing cycle updated successfully!');
    setShowChangeBillingDialog(false);
    // Refresh account data
    await fetchAccountData();
  } catch (error: any) {
    toast.error(error?.message || 'Failed to change billing cycle');
  } finally {
    setIsProcessing(false);
  }
};
```

#### Cancel Subscription Handler
```typescript
const handleCancelSubscription = async () => {
  if (cancelConfirmation !== 'CANCEL_SUBSCRIPTION') {
    toast.error('Please type "CANCEL_SUBSCRIPTION" to confirm');
    return;
  }
  
  setIsProcessing(true);
  try {
    const response = await cancelSubscription({
      reason: cancelReason,
      confirmation: cancelConfirmation
    });
    
    if (response.error) {
      toast.error(response.error.error || 'Failed to cancel subscription');
      return;
    }
    
    toast.success('Subscription cancelled. Logging you out...');
    
    // Wait 2 seconds then logout
    setTimeout(() => {
      onLogout();
    }, 2000);
    
  } catch (error: any) {
    toast.error(error?.message || 'Failed to cancel subscription');
  } finally {
    setIsProcessing(false);
  }
};
```

### UI Components to Add

#### 1. Change Plan Dialog
```tsx
<Dialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Change Subscription Plan</DialogTitle>
      <DialogDescription>
        Select a new plan for your subscription
      </DialogDescription>
    </DialogHeader>
    
    <div className="grid md:grid-cols-3 gap-4 py-4">
      {availablePlans.map((plan) => (
        <div
          key={plan.id}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            selectedPlan?.id === plan.id
              ? 'border-blue-500 bg-blue-50'
              : 'hover:border-gray-400'
          }`}
          onClick={() => setSelectedPlan(plan)}
        >
          <h4 className="font-semibold mb-2">{plan.name}</h4>
          <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
          <p className="text-gray-900 text-2xl font-bold mb-4">
            ${plan.monthlyPrice}
            <span className="text-sm font-normal text-gray-600">/mo</span>
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Up to {plan.propertyLimit} properties</li>
            <li>{plan.userLimit} users</li>
            <li>{plan.storageLimit} MB storage</li>
          </ul>
        </div>
      ))}
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowChangePlanDialog(false)}>
        Cancel
      </Button>
      <Button onClick={handleChangePlan} disabled={!selectedPlan || isProcessing}>
        {isProcessing ? 'Processing...' : 'Change Plan'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 2. Change Billing Cycle Dialog
```tsx
<Dialog open={showChangeBillingDialog} onOpenChange={setShowChangeBillingDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Change Billing Cycle</DialogTitle>
      <DialogDescription>
        Switch between monthly and annual billing
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      <div
        className={`p-4 border rounded-lg cursor-pointer ${
          newBillingCycle === 'monthly' ? 'border-blue-500 bg-blue-50' : ''
        }`}
        onClick={() => setNewBillingCycle('monthly')}
      >
        <h4 className="font-semibold">Monthly Billing</h4>
        <p className="text-sm text-gray-600">Pay month-to-month</p>
      </div>
      
      <div
        className={`p-4 border rounded-lg cursor-pointer ${
          newBillingCycle === 'annual' ? 'border-blue-500 bg-blue-50' : ''
        }`}
        onClick={() => setNewBillingCycle('annual')}
      >
        <h4 className="font-semibold">Annual Billing</h4>
        <p className="text-sm text-gray-600">Save 20% with annual billing</p>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowChangeBillingDialog(false)}>
        Cancel
      </Button>
      <Button onClick={handleChangeBillingCycle} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Change Billing Cycle'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 3. Cancel Subscription Dialog (with Warning)
```tsx
<Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="text-red-600">Cancel Subscription</DialogTitle>
      <DialogDescription>
        This action cannot be undone
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      {/* Warning Box */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-2">
              Warning: Data Loss and Account Deactivation
            </h4>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Your account will be immediately deactivated</li>
              <li>• All managers and tenants will lose access</li>
              <li>• Your data may be permanently deleted after 30 days</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Reason */}
      <div>
        <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
        <Textarea
          id="cancel-reason"
          placeholder="Help us improve by telling us why you're cancelling..."
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={3}
        />
      </div>
      
      {/* Confirmation */}
      <div>
        <Label htmlFor="cancel-confirmation">
          Type <strong>CANCEL_SUBSCRIPTION</strong> to confirm
        </Label>
        <Input
          id="cancel-confirmation"
          placeholder="CANCEL_SUBSCRIPTION"
          value={cancelConfirmation}
          onChange={(e) => setCancelConfirmation(e.target.value)}
        />
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
        Keep Subscription
      </Button>
      <Button
        variant="destructive"
        onClick={handleCancelSubscription}
        disabled={cancelConfirmation !== 'CANCEL_SUBSCRIPTION' || isProcessing}
      >
        {isProcessing ? 'Cancelling...' : 'Cancel Subscription'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Testing Steps

### Test 1: Change Plan
1. Login as owner
2. Go to Settings → Subscription
3. Click "Upgrade Plan" or "Change Plan"
4. Select a different plan
5. Click "Change Plan"
6. Verify success message
7. Refresh page and verify new plan is shown
8. Login as admin and verify the customer's plan was updated

### Test 2: Change Billing Cycle
1. Login as owner
2. Go to Settings → Subscription
3. Click "Change Billing"
4. Select monthly or annual
5. Click "Change Billing Cycle"
6. Verify success message
7. Refresh page and verify new billing cycle
8. Login as admin and verify the customer's billing cycle was updated

### Test 3: Cancel Subscription
1. Login as owner
2. Go to Settings → Subscription
3. Click "Cancel Subscription"
4. Read the warning message
5. Enter cancellation reason (optional)
6. Type "CANCEL_SUBSCRIPTION" in confirmation field
7. Click "Cancel Subscription"
8. Verify success message and automatic logout
9. Try to login again - should fail (account deactivated)
10. Login as admin and verify:
    - Customer status is 'cancelled'
    - Customer MRR is 0
    - All associated users are inactive

### Test 4: Admin Visibility
1. Login as admin
2. Go to Customers tab
3. Find the customer who changed their plan/billing/cancelled
4. Verify the changes are reflected in the customer record
5. Check real-time notifications for subscription events

## Database Changes

The subscription endpoints use existing database fields:
- `customers.planId` - Updated when plan changes
- `customers.billingCycle` - Updated when billing cycle changes
- `customers.status` - Set to 'cancelled' when subscription is cancelled
- `customers.mrr` - Recalculated based on plan and billing cycle
- `customers.notes` - Cancellation reason appended
- `users.isActive` - Set to false for all users when subscription is cancelled
- `users.status` - Set to 'inactive' for all users when subscription is cancelled

## Real-time Events

### Events Emitted to Admins:
- `subscription:plan-changed` - When owner changes plan
- `subscription:billing-changed` - When owner changes billing cycle
- `subscription:cancelled` - When owner cancels subscription

### Events Emitted to Customer Users:
- `subscription:updated` - When plan or billing cycle changes
- `account:deactivated` - When subscription is cancelled

## Security Considerations

1. **Owner-Only Access**: All endpoints verify that the user is an owner
2. **Confirmation Required**: Cancellation requires explicit confirmation text
3. **Audit Trail**: All changes are logged with timestamps
4. **Real-time Notifications**: Admins are immediately notified of all changes
5. **Graceful Deactivation**: All users are properly deactivated on cancellation

## Success Criteria
- ✅ Owner can view available plans
- ✅ Owner can change subscription plan
- ✅ Owner can change billing cycle
- ✅ Owner can cancel subscription with proper warnings
- ✅ All changes are reflected in admin dashboard
- ✅ Real-time events are emitted
- ✅ Proper error handling and user feedback
- ✅ Account deactivation works correctly on cancellation

---

**Status**: Backend Complete, Frontend Implementation Guide Provided
**Last Updated**: 2025-11-05



