# Trial Management & Account Lifecycle Architecture

## Executive Summary

This document outlines the architecture for automated trial management, ensuring customers receive a 14-day trial period upon activation, with automatic account suspension if they don't upgrade to a paid plan.

**Last Updated**: November 8, 2025  
**Status**: Design Complete - Ready for Implementation  
**Author**: Lead Architect

---

## Table of Contents

1. [Business Requirements](#business-requirements)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [State Machine](#state-machine)
5. [Automated Jobs](#automated-jobs)
6. [Grace Period & Notifications](#grace-period--notifications)
7. [API Endpoints](#api-endpoints)
8. [Security & Compliance](#security--compliance)
9. [Monitoring & Alerts](#monitoring--alerts)
10. [Implementation Plan](#implementation-plan)

---

## 1. Business Requirements

### Core Requirements

1. **Trial Period**

   - All new customers start with a 14-day free trial
   - Trial starts when admin activates the application
   - Full feature access during trial period

2. **Trial Expiration**

   - System automatically checks trial status daily
   - Customers receive notifications at key intervals (7 days, 3 days, 1 day, expiration)
   - Account suspended if no payment method added by trial end

3. **Account States**

   - `trial` - Active trial period
   - `active` - Paid subscription active
   - `suspended` - Trial expired, no payment
   - `cancelled` - User cancelled subscription
   - `deactivated` - Admin deactivated account

4. **Grace Period**

   - 3-day grace period after trial expiration
   - Limited access during grace period
   - Full suspension after grace period

5. **Reactivation**
   - Customers can reactivate by adding payment method
   - Automatic reactivation upon successful payment
   - Data preserved during suspension (30 days)

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Trial Management System                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Cron Jobs  │    │  Event Bus   │    │  Notification│
│   (Daily)    │    │  (Real-time) │    │   Service    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Database       │
                    │   - customers    │
                    │   - subscriptions│
                    │   - audit_log    │
                    └──────────────────┘
```

### Component Responsibilities

#### 1. Trial Checker (Cron Job)

- Runs daily at 2:00 AM UTC
- Identifies trials expiring today
- Identifies trials in grace period
- Identifies trials past grace period
- Triggers appropriate actions

#### 2. Event Bus

- Real-time event processing
- Triggers on payment success
- Triggers on subscription changes
- Emits events for notifications

#### 3. Notification Service

- Email notifications
- In-app notifications
- SMS notifications (optional)
- Webhook notifications

#### 4. Subscription Manager

- Handles plan upgrades
- Processes payments
- Manages subscription lifecycle
- Integrates with payment gateway (Paystack)

---

## 3. Database Schema

### Enhanced Customers Table

```sql
-- Add trial management fields to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trial_starts_at TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_trial_notification_sent_at TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trial_notification_count INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_trial_ends_at ON customers(trial_ends_at) WHERE status = 'trial';
CREATE INDEX IF NOT EXISTS idx_customers_grace_period ON customers(grace_period_ends_at) WHERE status = 'trial';
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
```

### Subscription Events Table (New)

```sql
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  -- Event types: 'trial_started', 'trial_warning', 'trial_expired',
  --              'grace_period_started', 'account_suspended', 'account_reactivated',
  --              'subscription_activated', 'subscription_cancelled'

  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  metadata JSONB,
  triggered_by VARCHAR(50), -- 'system', 'admin', 'customer', 'payment'
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_subscription_events_customer (customer_id),
  INDEX idx_subscription_events_type (event_type),
  INDEX idx_subscription_events_created (created_at DESC)
);
```

### Trial Notifications Table (New)

```sql
CREATE TABLE IF NOT EXISTS trial_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  -- Types: 'trial_started', 'trial_7_days', 'trial_3_days', 'trial_1_day',
  --        'trial_expired', 'grace_period', 'account_suspended'

  days_remaining INTEGER,
  sent_at TIMESTAMP DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  in_app_sent BOOLEAN DEFAULT false,

  INDEX idx_trial_notifications_customer (customer_id),
  INDEX idx_trial_notifications_type (notification_type),
  INDEX idx_trial_notifications_sent (sent_at DESC)
);
```

---

## 4. State Machine

### Customer Status State Machine

```
                    ┌─────────────┐
                    │   pending   │ (Onboarding application)
                    └──────┬──────┘
                           │ Admin approves
                           ▼
                    ┌─────────────┐
                    │  approved   │ (Customer account created)
                    └──────┬──────┘
                           │ Admin activates
                           ▼
                    ┌─────────────┐
              ┌────▶│    trial    │◀────┐
              │     └──────┬──────┘     │
              │            │            │
              │    Trial expires        │ Payment added
              │            │            │ (reactivation)
              │            ▼            │
              │     ┌─────────────┐    │
              │     │grace_period │────┘
              │     └──────┬──────┘
              │            │
              │    Grace expires
              │            │
              │            ▼
              │     ┌─────────────┐
              └─────│  suspended  │
                    └──────┬──────┘
                           │ Payment added
                           ▼
                    ┌─────────────┐
                    │   active    │ (Paid subscription)
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │             │
            Cancellation    Deactivation
                    │             │
                    ▼             ▼
            ┌─────────────┐ ┌─────────────┐
            │ cancelled   │ │deactivated  │
            └─────────────┘ └─────────────┘
```

### State Transition Rules

| From State   | To State     | Trigger           | Conditions              |
| ------------ | ------------ | ----------------- | ----------------------- |
| approved     | trial        | Admin activation  | -                       |
| trial        | grace_period | Trial expiration  | No payment method       |
| trial        | active       | Payment added     | Valid payment method    |
| grace_period | suspended    | Grace expiration  | No payment after 3 days |
| grace_period | active       | Payment added     | Valid payment method    |
| suspended    | active       | Payment added     | Within 30 days          |
| active       | cancelled    | User cancellation | -                       |
| active       | deactivated  | Admin action      | -                       |

---

## 5. Automated Jobs

### Job 1: Trial Expiration Checker

**Schedule**: Daily at 2:00 AM UTC  
**Purpose**: Check for expiring trials and take action

```typescript
// backend/src/jobs/trial-expiration-checker.ts

export async function checkTrialExpirations() {
  const now = new Date();

  // 1. Find trials expiring today
  const expiringToday = await prisma.customers.findMany({
    where: {
      status: "trial",
      trialEndsAt: {
        lte: now,
      },
      gracePeriodEndsAt: null, // Not in grace period yet
    },
    include: {
      payment_methods: true,
    },
  });

  for (const customer of expiringToday) {
    if (customer.payment_methods.length > 0) {
      // Has payment method - attempt to charge
      await attemptTrialConversion(customer);
    } else {
      // No payment method - start grace period
      await startGracePeriod(customer);
    }
  }

  // 2. Find grace periods expiring today
  const graceExpiring = await prisma.customers.findMany({
    where: {
      status: "trial",
      gracePeriodEndsAt: {
        lte: now,
      },
    },
    include: {
      payment_methods: true,
    },
  });

  for (const customer of graceExpiring) {
    if (customer.payment_methods.length > 0) {
      // Has payment method - attempt to charge
      await attemptTrialConversion(customer);
    } else {
      // No payment method - suspend account
      await suspendAccount(customer);
    }
  }

  // 3. Delete data for accounts suspended > 30 days
  await cleanupSuspendedAccounts();
}

async function attemptTrialConversion(customer: Customer) {
  try {
    // Charge the payment method
    const paymentResult = await chargePaymentMethod(customer);

    if (paymentResult.success) {
      // Update to active subscription
      await prisma.customers.update({
        where: { id: customer.id },
        data: {
          status: "active",
          subscriptionStartDate: new Date(),
          updatedAt: new Date(),
        },
      });

      // Log event
      await logSubscriptionEvent(
        customer.id,
        "subscription_activated",
        "system"
      );

      // Send success notification
      await sendNotification(customer, "subscription_activated");
    } else {
      // Payment failed - start grace period
      await startGracePeriod(customer);
    }
  } catch (error) {
    console.error("[Trial Conversion] Error:", error);
    await startGracePeriod(customer);
  }
}

async function startGracePeriod(customer: Customer) {
  const gracePeriodEnds = new Date();
  gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 3); // 3-day grace period

  await prisma.customers.update({
    where: { id: customer.id },
    data: {
      gracePeriodEndsAt: gracePeriodEnds,
      updatedAt: new Date(),
    },
  });

  // Log event
  await logSubscriptionEvent(customer.id, "grace_period_started", "system");

  // Send notification
  await sendNotification(customer, "grace_period_started");
}

async function suspendAccount(customer: Customer) {
  await prisma.customers.update({
    where: { id: customer.id },
    data: {
      status: "suspended",
      suspendedAt: new Date(),
      suspensionReason: "Trial expired without payment",
      updatedAt: new Date(),
    },
  });

  // Disable all users for this customer
  await prisma.users.updateMany({
    where: { customerId: customer.id },
    data: {
      isActive: false,
      status: "suspended",
    },
  });

  // Log event
  await logSubscriptionEvent(customer.id, "account_suspended", "system");

  // Send notification
  await sendNotification(customer, "account_suspended");
}

async function cleanupSuspendedAccounts() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const accountsToCleanup = await prisma.customers.findMany({
    where: {
      status: "suspended",
      suspendedAt: {
        lte: thirtyDaysAgo,
      },
    },
  });

  for (const customer of accountsToCleanup) {
    // Archive data (optional - move to archive table)
    await archiveCustomerData(customer);

    // Delete customer data
    await prisma.customers.delete({
      where: { id: customer.id },
    });

    console.log(`[Cleanup] Deleted suspended account: ${customer.email}`);
  }
}
```

### Job 2: Trial Notification Sender

**Schedule**: Daily at 10:00 AM UTC (customer's timezone)  
**Purpose**: Send proactive notifications about trial status

```typescript
// backend/src/jobs/trial-notification-sender.ts

export async function sendTrialNotifications() {
  const now = new Date();

  // 1. Trial started (Day 0)
  await sendNotificationForDaysRemaining(14, "trial_started");

  // 2. 7 days remaining
  await sendNotificationForDaysRemaining(7, "trial_7_days");

  // 3. 3 days remaining
  await sendNotificationForDaysRemaining(3, "trial_3_days");

  // 4. 1 day remaining
  await sendNotificationForDaysRemaining(1, "trial_1_day");

  // 5. Trial expired (Day 0)
  await sendNotificationForDaysRemaining(0, "trial_expired");
}

async function sendNotificationForDaysRemaining(
  daysRemaining: number,
  notificationType: string
) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysRemaining);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const customers = await prisma.customers.findMany({
    where: {
      status: "trial",
      trialEndsAt: {
        gte: targetDate,
        lt: nextDay,
      },
    },
    include: {
      users: {
        where: { role: "owner" },
        take: 1,
      },
    },
  });

  for (const customer of customers) {
    // Check if notification already sent
    const existingNotification = await prisma.trial_notifications.findFirst({
      where: {
        customerId: customer.id,
        notificationType,
      },
    });

    if (!existingNotification) {
      await sendNotification(customer, notificationType, daysRemaining);

      // Log notification
      await prisma.trial_notifications.create({
        data: {
          customerId: customer.id,
          notificationType,
          daysRemaining,
          emailSent: true,
          inAppSent: true,
        },
      });
    }
  }
}
```

---

## 6. Grace Period & Notifications

### Notification Schedule

| Days Remaining | Notification Type | Channels           | Content                               |
| -------------- | ----------------- | ------------------ | ------------------------------------- |
| 14             | Trial Started     | Email, In-app      | Welcome, feature tour                 |
| 7              | Mid-trial         | Email, In-app      | Reminder, upgrade CTA                 |
| 3              | Urgent            | Email, In-app, SMS | Upgrade urgency                       |
| 1              | Final Warning     | Email, In-app, SMS | Last chance                           |
| 0              | Trial Expired     | Email, In-app      | Grace period info                     |
| Grace +1       | Grace Period      | Email, In-app      | 2 days remaining                      |
| Grace +3       | Suspended         | Email              | Account suspended, reactivation steps |

### Email Templates

#### Trial Started Email

```
Subject: Welcome to Contrezz! Your 14-day trial has begun 🎉

Hi [Customer Name],

Your Contrezz account is now active! You have 14 days of full access to explore all features.

What's included in your trial:
✓ Unlimited properties and units
✓ Tenant management
✓ Payment processing
✓ Maintenance tracking
✓ Financial reports
✓ 24/7 support

Get started: [Dashboard Link]
Add payment method: [Billing Link]

Questions? Reply to this email or visit our Help Center.

Best regards,
The Contrezz Team
```

#### 3 Days Remaining Email

```
Subject: Your Contrezz trial ends in 3 days ⏰

Hi [Customer Name],

Your trial ends on [Date]. Don't lose access to:
• [X] properties you've added
• [X] tenants you're managing
• [X] payments processed

👉 Add a payment method now to continue: [Billing Link]

Plans starting at $[Price]/month.

Need help choosing? Schedule a call: [Calendar Link]

Best regards,
The Contrezz Team
```

#### Account Suspended Email

```
Subject: Your Contrezz account has been suspended

Hi [Customer Name],

Your trial has ended and we haven't received payment information.

Your account is now suspended, but your data is safe for 30 days.

Reactivate now: [Reactivation Link]

What happens next:
• Day 1-30: Data preserved, reactivation available
• Day 30+: Account and data permanently deleted

Questions? Contact support: [Support Link]

Best regards,
The Contrezz Team
```

---

## 7. API Endpoints

### Customer-Facing Endpoints

#### GET /api/subscription/status

Get current subscription status and trial information

```typescript
Response:
{
  status: 'trial' | 'active' | 'suspended',
  trialEndsAt: '2025-11-22T00:00:00Z',
  daysRemaining: 7,
  inGracePeriod: false,
  gracePeriodEndsAt: null,
  hasPaymentMethod: false,
  canUpgrade: true,
  nextBillingDate: null,
  plan: {
    id: 'plan-id',
    name: 'Professional',
    price: 99.00,
    billingCycle: 'monthly'
  }
}
```

#### POST /api/subscription/upgrade

Upgrade from trial to paid subscription

```typescript
Request:
{
  planId: 'plan-id',
  billingCycle: 'monthly' | 'annual',
  paymentMethodId: 'pm-id'
}

Response:
{
  success: true,
  subscriptionId: 'sub-id',
  status: 'active',
  nextBillingDate: '2025-12-08T00:00:00Z'
}
```

#### POST /api/subscription/reactivate

Reactivate suspended account

```typescript
Request:
{
  paymentMethodId: 'pm-id'
}

Response:
{
  success: true,
  status: 'active',
  message: 'Account reactivated successfully'
}
```

### Admin Endpoints

#### GET /api/admin/subscriptions/expiring

Get list of trials expiring soon

```typescript
Query:
?days=7&page=1&limit=20

Response:
{
  trials: [
    {
      customerId: 'cust-id',
      company: 'ABC Properties',
      email: 'owner@abc.com',
      trialEndsAt: '2025-11-15T00:00:00Z',
      daysRemaining: 3,
      hasPaymentMethod: false,
      totalProperties: 5,
      totalRevenue: 12500
    }
  ],
  pagination: { ... }
}
```

#### POST /api/admin/subscriptions/:id/extend-trial

Extend trial period (admin only)

```typescript
Request:
{
  additionalDays: 7,
  reason: 'Customer requested extension'
}

Response:
{
  success: true,
  newTrialEndsAt: '2025-11-22T00:00:00Z'
}
```

---

## 8. Security & Compliance

### Data Retention Policy

1. **Active Accounts**: Indefinite retention
2. **Suspended Accounts**: 30-day retention
3. **Deleted Accounts**: 90-day backup retention (compliance)

### Access Control During Suspension

```typescript
// Middleware: Check subscription status
export async function checkSubscriptionStatus(req, res, next) {
  const user = req.user;
  const customer = await prisma.customers.findUnique({
    where: { id: user.customerId },
  });

  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  // Allow access during trial and active
  if (["trial", "active"].includes(customer.status)) {
    return next();
  }

  // Limited access during grace period
  if (customer.status === "trial" && customer.gracePeriodEndsAt) {
    const now = new Date();
    if (customer.gracePeriodEndsAt > now) {
      // Allow read-only access during grace period
      req.readOnly = true;
      return next();
    }
  }

  // Suspended - only allow billing/reactivation
  if (customer.status === "suspended") {
    const allowedPaths = [
      "/api/subscription/status",
      "/api/subscription/reactivate",
      "/api/payment-methods",
    ];

    if (allowedPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    return res.status(403).json({
      error: "Account suspended",
      message: "Please add a payment method to reactivate your account",
      reactivationUrl: "/billing/reactivate",
    });
  }

  return res.status(403).json({ error: "Account inactive" });
}
```

### Audit Logging

All subscription events are logged:

- Trial started
- Payment method added/removed
- Subscription upgraded/downgraded
- Account suspended/reactivated
- Admin actions (trial extensions, manual activations)

---

## 9. Monitoring & Alerts

### Metrics to Track

1. **Trial Conversion Rate**

   - % of trials that convert to paid
   - Target: >25%

2. **Average Trial Duration**

   - How long customers use trial before converting
   - Target: 7-10 days

3. **Grace Period Recovery Rate**

   - % of grace period accounts that reactivate
   - Target: >15%

4. **Suspension Rate**
   - % of trials that end in suspension
   - Target: <50%

### Admin Dashboard Widgets

```typescript
// Trial Health Dashboard
{
  activeTrials: 45,
  expiringThisWeek: 12,
  inGracePeriod: 8,
  suspended: 23,
  conversionRate: 28.5,
  averageTimeToConvert: 8.2, // days

  recentConversions: [...],
  atRiskCustomers: [...], // No payment method, <3 days remaining
}
```

### Automated Alerts

1. **Low Conversion Rate Alert**

   - Trigger: Conversion rate drops below 20%
   - Action: Email to sales team

2. **High Suspension Rate Alert**

   - Trigger: >60% of trials ending in suspension
   - Action: Review trial experience, pricing

3. **Payment Failure Alert**
   - Trigger: Payment fails during trial conversion
   - Action: Notify customer support

---

## 10. Implementation Plan

### Phase 1: Database & Core Logic (Week 1)

**Tasks**:

1. ✅ Add trial management fields to customers table
2. ✅ Create subscription_events table
3. ✅ Create trial_notifications table
4. ✅ Update onboarding service to set trial dates
5. ✅ Implement state machine logic

**Deliverables**:

- Migration scripts
- Updated Prisma schema
- Service layer functions

### Phase 2: Automated Jobs (Week 2)

**Tasks**:

1. ⏳ Implement trial expiration checker cron job
2. ⏳ Implement notification sender cron job
3. ⏳ Implement grace period handler
4. ⏳ Implement account suspension logic
5. ⏳ Implement cleanup job for old accounts

**Deliverables**:

- Cron job scripts
- Unit tests
- Integration tests

### Phase 3: API Endpoints (Week 2-3)

**Tasks**:

1. ⏳ Implement subscription status endpoint
2. ⏳ Implement upgrade endpoint
3. ⏳ Implement reactivation endpoint
4. ⏳ Implement admin trial management endpoints
5. ⏳ Add subscription middleware

**Deliverables**:

- API routes
- Middleware
- API documentation

### Phase 4: Notifications (Week 3)

**Tasks**:

1. ⏳ Design email templates
2. ⏳ Implement email service integration
3. ⏳ Implement in-app notification system
4. ⏳ Implement SMS service (optional)
5. ⏳ Test notification delivery

**Deliverables**:

- Email templates
- Notification service
- Delivery tracking

### Phase 5: Frontend UI (Week 4)

**Tasks**:

1. ⏳ Create trial status banner component
2. ⏳ Create upgrade modal
3. ⏳ Create reactivation page
4. ⏳ Add trial countdown in dashboard
5. ⏳ Create admin trial management UI

**Deliverables**:

- React components
- Admin dashboard widgets
- User flows

### Phase 6: Testing & Monitoring (Week 5)

**Tasks**:

1. ⏳ End-to-end testing
2. ⏳ Load testing
3. ⏳ Set up monitoring dashboards
4. ⏳ Configure alerts
5. ⏳ Documentation

**Deliverables**:

- Test suite
- Monitoring setup
- Documentation

---

## Technical Considerations

### Performance Optimization

1. **Database Indexes**

   - Index on `trialEndsAt` for quick lookups
   - Index on `status` for filtering
   - Composite index on `(status, trialEndsAt)` for cron jobs

2. **Caching**

   - Cache subscription status (5-minute TTL)
   - Invalidate on payment/status changes

3. **Batch Processing**
   - Process trial expirations in batches of 100
   - Use database transactions for consistency

### Error Handling

1. **Payment Failures**

   - Retry up to 3 times with exponential backoff
   - Fall back to grace period if all retries fail

2. **Notification Failures**

   - Queue failed notifications for retry
   - Log failures for manual review

3. **Job Failures**
   - Dead letter queue for failed jobs
   - Alert on consecutive failures

### Scalability

1. **Horizontal Scaling**

   - Cron jobs use distributed locks (Redis)
   - Prevent duplicate processing

2. **Database Scaling**
   - Read replicas for reporting queries
   - Partition subscription_events by date

---

## Success Metrics

### Key Performance Indicators (KPIs)

| Metric                     | Target    | Measurement                   |
| -------------------------- | --------- | ----------------------------- |
| Trial Conversion Rate      | >25%      | Trials → Paid subscriptions   |
| Grace Period Recovery      | >15%      | Grace → Paid subscriptions    |
| Average Time to Convert    | 7-10 days | Trial start → First payment   |
| Suspension Rate            | <50%      | Trials → Suspended accounts   |
| Notification Delivery Rate | >98%      | Sent → Delivered              |
| Payment Success Rate       | >90%      | Attempts → Successful charges |

### Business Impact

- **Revenue**: Automated conversion increases MRR by 30-40%
- **Retention**: Early engagement reduces churn
- **Efficiency**: Automated process saves 10+ hours/week of manual work
- **Customer Experience**: Clear communication improves satisfaction

---

## Appendix

### A. Sample Cron Schedule

```typescript
// backend/src/lib/cron-jobs.ts

import cron from "node-cron";
import { checkTrialExpirations } from "../jobs/trial-expiration-checker";
import { sendTrialNotifications } from "../jobs/trial-notification-sender";

export function initializeTrialManagementJobs() {
  // Trial expiration checker - Daily at 2:00 AM UTC
  cron.schedule("0 2 * * *", async () => {
    console.log("[Cron] Running trial expiration checker...");
    await checkTrialExpirations();
  });

  // Trial notification sender - Daily at 10:00 AM UTC
  cron.schedule("0 10 * * *", async () => {
    console.log("[Cron] Running trial notification sender...");
    await sendTrialNotifications();
  });

  console.log("✅ Trial management cron jobs initialized");
}
```

### B. Environment Variables

```env
# Trial Management
TRIAL_DURATION_DAYS=14
GRACE_PERIOD_DAYS=3
SUSPENDED_DATA_RETENTION_DAYS=30

# Notifications
TRIAL_NOTIFICATION_ENABLED=true
TRIAL_EMAIL_FROM=noreply@contrezz.com
TRIAL_SMS_ENABLED=false

# Payment
AUTO_CHARGE_ON_TRIAL_END=true
PAYMENT_RETRY_ATTEMPTS=3
PAYMENT_RETRY_DELAY_HOURS=24
```

### C. Testing Checklist

- [ ] Trial starts correctly on activation
- [ ] Trial end date calculated correctly (14 days)
- [ ] Notifications sent at correct intervals
- [ ] Grace period starts when trial expires without payment
- [ ] Account suspended after grace period
- [ ] Payment method addition triggers conversion
- [ ] Suspended account can be reactivated
- [ ] Data deleted after 30 days of suspension
- [ ] Admin can extend trials
- [ ] Metrics tracked correctly

---

## Conclusion

This architecture provides a robust, automated trial management system that:

1. **Maximizes Conversions**: Proactive notifications and clear CTAs
2. **Reduces Churn**: Grace period gives customers time to add payment
3. **Scales Automatically**: Cron jobs handle thousands of accounts
4. **Maintains Compliance**: Clear data retention and deletion policies
5. **Provides Insights**: Comprehensive metrics and monitoring

**Next Steps**: Begin Phase 1 implementation with database schema updates.

---

**Document Version**: 1.0  
**Last Updated**: November 8, 2025  
**Status**: Ready for Implementation  
**Approval Required**: Product Owner, CTO
