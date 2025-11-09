# Trial Management - Quick Start Implementation Guide

## Overview

This guide provides step-by-step instructions to implement the automated trial management system.

---

## Phase 1: Database Setup (30 minutes)

### Step 1: Update Prisma Schema

```prisma
// backend/prisma/schema.prisma

model customers {
  // ... existing fields ...
  
  // Trial Management Fields
  trialStartsAt         DateTime?
  trialEndsAt           DateTime?
  gracePeriodEndsAt     DateTime?
  suspendedAt           DateTime?
  suspensionReason      String?
  lastTrialNotificationSentAt DateTime?
  trialNotificationCount      Int       @default(0)
  
  // Relations
  subscription_events   subscription_events[]
  trial_notifications   trial_notifications[]
}

model subscription_events {
  id              String    @id @default(uuid())
  customerId      String
  eventType       String    // 'trial_started', 'trial_expired', 'subscription_activated', etc.
  previousStatus  String?
  newStatus       String?
  metadata        Json?
  triggeredBy     String    // 'system', 'admin', 'customer', 'payment'
  createdAt       DateTime  @default(now())
  
  customer        customers @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  @@index([customerId])
  @@index([eventType])
  @@index([createdAt])
}

model trial_notifications {
  id                String    @id @default(uuid())
  customerId        String
  notificationType  String    // 'trial_started', 'trial_7_days', 'trial_3_days', etc.
  daysRemaining     Int?
  sentAt            DateTime  @default(now())
  emailSent         Boolean   @default(false)
  smsSent           Boolean   @default(false)
  inAppSent         Boolean   @default(false)
  
  customer          customers @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  @@index([customerId])
  @@index([notificationType])
  @@index([sentAt])
}
```

### Step 2: Generate Migration

```bash
cd backend
npx prisma migrate dev --name add_trial_management
npx prisma generate
```

---

## Phase 2: Update Onboarding Service (15 minutes)

### Update `approveApplication` to set trial dates

```typescript
// backend/src/services/onboarding.service.ts

async approveApplication(
  id: string,
  adminId: string,
  data: ApproveApplicationInput
): Promise<ApprovalResult> {
  // ... existing code ...

  // Calculate trial dates
  const now = new Date();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + (data.trialDays || 14));

  const customer = await prisma.customers.create({
    data: {
      // ... existing fields ...
      status: 'trial',
      trialStartsAt: now,
      trialEndsAt: trialEndsAt,
      subscriptionStartDate: now,
    },
  });

  // Log trial started event
  await prisma.subscription_events.create({
    data: {
      customerId: customer.id,
      eventType: 'trial_started',
      previousStatus: null,
      newStatus: 'trial',
      triggeredBy: 'admin',
      metadata: {
        trialDays: data.trialDays || 14,
        approvedBy: adminId,
      },
    },
  });

  return {
    success: true,
    customerId: customer.id,
    message: 'Application approved and trial started',
  };
}
```

---

## Phase 3: Create Trial Management Service (30 minutes)

```typescript
// backend/src/services/trial-management.service.ts

import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../lib/email';

const prisma = new PrismaClient();

export class TrialManagementService {
  /**
   * Check for expiring trials and take action
   */
  async checkTrialExpirations(): Promise<void> {
    const now = new Date();

    // 1. Find trials expiring today
    const expiringTrials = await prisma.customers.findMany({
      where: {
        status: 'trial',
        trialEndsAt: {
          lte: now,
        },
        gracePeriodEndsAt: null,
      },
      include: {
        payment_methods: true,
        users: {
          where: { role: 'owner' },
          take: 1,
        },
      },
    });

    for (const customer of expiringTrials) {
      if (customer.payment_methods.length > 0) {
        await this.attemptTrialConversion(customer);
      } else {
        await this.startGracePeriod(customer);
      }
    }

    // 2. Find grace periods expiring today
    const graceExpiring = await prisma.customers.findMany({
      where: {
        status: 'trial',
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
        await this.attemptTrialConversion(customer);
      } else {
        await this.suspendAccount(customer);
      }
    }
  }

  /**
   * Attempt to convert trial to paid subscription
   */
  private async attemptTrialConversion(customer: any): Promise<void> {
    try {
      // Get default payment method
      const paymentMethod = customer.payment_methods.find((pm: any) => pm.isDefault) 
        || customer.payment_methods[0];

      if (!paymentMethod) {
        await this.startGracePeriod(customer);
        return;
      }

      // Charge the payment method (integrate with Paystack)
      // const paymentResult = await chargePaymentMethod(customer, paymentMethod);

      // For now, assume success
      await prisma.customers.update({
        where: { id: customer.id },
        data: {
          status: 'active',
          subscriptionStartDate: new Date(),
          updatedAt: new Date(),
        },
      });

      // Log event
      await prisma.subscription_events.create({
        data: {
          customerId: customer.id,
          eventType: 'subscription_activated',
          previousStatus: 'trial',
          newStatus: 'active',
          triggeredBy: 'system',
        },
      });

      // Send success email
      await this.sendNotification(customer, 'subscription_activated');
    } catch (error) {
      console.error('[Trial Conversion] Error:', error);
      await this.startGracePeriod(customer);
    }
  }

  /**
   * Start grace period for customer
   */
  private async startGracePeriod(customer: any): Promise<void> {
    const gracePeriodEnds = new Date();
    gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 3); // 3-day grace

    await prisma.customers.update({
      where: { id: customer.id },
      data: {
        gracePeriodEndsAt: gracePeriodEnds,
        updatedAt: new Date(),
      },
    });

    // Log event
    await prisma.subscription_events.create({
      data: {
        customerId: customer.id,
        eventType: 'grace_period_started',
        previousStatus: 'trial',
        newStatus: 'trial',
        triggeredBy: 'system',
      },
    });

    // Send notification
    await this.sendNotification(customer, 'grace_period_started');
  }

  /**
   * Suspend account after grace period
   */
  private async suspendAccount(customer: any): Promise<void> {
    await prisma.customers.update({
      where: { id: customer.id },
      data: {
        status: 'suspended',
        suspendedAt: new Date(),
        suspensionReason: 'Trial expired without payment',
        updatedAt: new Date(),
      },
    });

    // Disable all users
    await prisma.users.updateMany({
      where: { customerId: customer.id },
      data: {
        isActive: false,
        status: 'suspended',
      },
    });

    // Log event
    await prisma.subscription_events.create({
      data: {
        customerId: customer.id,
        eventType: 'account_suspended',
        previousStatus: 'trial',
        newStatus: 'suspended',
        triggeredBy: 'system',
      },
    });

    // Send notification
    await this.sendNotification(customer, 'account_suspended');
  }

  /**
   * Send notification to customer
   */
  private async sendNotification(customer: any, type: string): Promise<void> {
    const emailTemplates = {
      trial_started: {
        subject: 'Welcome to Contrezz! Your 14-day trial has begun 🎉',
        body: `Hi ${customer.owner},\n\nYour trial has started! You have 14 days of full access.`,
      },
      grace_period_started: {
        subject: 'Your Contrezz trial has ended - 3 days to add payment',
        body: `Hi ${customer.owner},\n\nYour trial has ended. Add a payment method within 3 days to continue.`,
      },
      account_suspended: {
        subject: 'Your Contrezz account has been suspended',
        body: `Hi ${customer.owner},\n\nYour account is suspended. Add payment to reactivate.`,
      },
      subscription_activated: {
        subject: 'Welcome to Contrezz! Your subscription is active',
        body: `Hi ${customer.owner},\n\nThank you for subscribing! Your account is now active.`,
      },
    };

    const template = emailTemplates[type as keyof typeof emailTemplates];
    if (template) {
      await sendEmail({
        to: customer.email,
        subject: template.subject,
        body: template.body,
      });

      // Log notification
      await prisma.trial_notifications.create({
        data: {
          customerId: customer.id,
          notificationType: type,
          emailSent: true,
        },
      });
    }
  }

  /**
   * Send proactive trial notifications
   */
  async sendTrialNotifications(): Promise<void> {
    // 7 days remaining
    await this.sendNotificationForDaysRemaining(7, 'trial_7_days');
    
    // 3 days remaining
    await this.sendNotificationForDaysRemaining(3, 'trial_3_days');
    
    // 1 day remaining
    await this.sendNotificationForDaysRemaining(1, 'trial_1_day');
  }

  private async sendNotificationForDaysRemaining(
    daysRemaining: number,
    notificationType: string
  ): Promise<void> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysRemaining);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const customers = await prisma.customers.findMany({
      where: {
        status: 'trial',
        trialEndsAt: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    });

    for (const customer of customers) {
      // Check if already sent
      const existing = await prisma.trial_notifications.findFirst({
        where: {
          customerId: customer.id,
          notificationType,
        },
      });

      if (!existing) {
        await this.sendNotification(customer, notificationType);
      }
    }
  }
}

export const trialManagementService = new TrialManagementService();
```

---

## Phase 4: Add Cron Jobs (15 minutes)

```typescript
// backend/src/lib/cron-jobs.ts

import cron from 'node-cron';
import { trialManagementService } from '../services/trial-management.service';

export function initializeCronJobs() {
  // ... existing cron jobs ...

  // Trial expiration checker - Daily at 2:00 AM UTC
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [Cron] Running trial expiration checker...');
    try {
      await trialManagementService.checkTrialExpirations();
      console.log('✅ [Cron] Trial expiration check complete');
    } catch (error) {
      console.error('❌ [Cron] Trial expiration check failed:', error);
    }
  });

  // Trial notification sender - Daily at 10:00 AM UTC
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ [Cron] Running trial notification sender...');
    try {
      await trialManagementService.sendTrialNotifications();
      console.log('✅ [Cron] Trial notifications sent');
    } catch (error) {
      console.error('❌ [Cron] Trial notification failed:', error);
    }
  });

  console.log('✅ Trial management cron jobs initialized');
}
```

---

## Phase 5: Add Subscription Middleware (10 minutes)

```typescript
// backend/src/middleware/subscription.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkSubscriptionStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = (req as any).user;
    
    if (!user || !user.customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const customer = await prisma.customers.findUnique({
      where: { id: user.customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Allow access for trial and active accounts
    if (['trial', 'active'].includes(customer.status)) {
      return next();
    }

    // Check grace period
    if (customer.status === 'trial' && customer.gracePeriodEndsAt) {
      const now = new Date();
      if (customer.gracePeriodEndsAt > now) {
        // Read-only access during grace period
        (req as any).readOnly = true;
        return next();
      }
    }

    // Suspended - only allow billing endpoints
    if (customer.status === 'suspended') {
      const allowedPaths = [
        '/api/subscription',
        '/api/payment-methods',
        '/api/auth',
      ];

      if (allowedPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      return res.status(403).json({
        error: 'Account suspended',
        message: 'Please add a payment method to reactivate your account',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    return res.status(403).json({ error: 'Account inactive' });
  } catch (error) {
    console.error('[Subscription Middleware] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Testing

### Manual Testing Steps

1. **Create a test customer with trial**
```bash
# In Prisma Studio or SQL
UPDATE customers 
SET status = 'trial', 
    trialStartsAt = NOW(), 
    trialEndsAt = NOW() + INTERVAL '1 day'
WHERE email = 'test@example.com';
```

2. **Trigger cron job manually**
```typescript
// In your code or via API endpoint
import { trialManagementService } from './services/trial-management.service';

await trialManagementService.checkTrialExpirations();
```

3. **Verify state transitions**
- Check customer status changed to grace period
- Check subscription_events logged
- Check notification sent

---

## Environment Variables

Add to `.env`:

```env
# Trial Management
TRIAL_DURATION_DAYS=14
GRACE_PERIOD_DAYS=3
SUSPENDED_DATA_RETENTION_DAYS=30

# Notifications
TRIAL_NOTIFICATION_ENABLED=true
TRIAL_EMAIL_FROM=noreply@contrezz.com
```

---

## Next Steps

1. ✅ Complete database setup
2. ✅ Update onboarding service
3. ✅ Create trial management service
4. ✅ Add cron jobs
5. ⏳ Create frontend trial status banner
6. ⏳ Create upgrade modal
7. ⏳ Create admin trial dashboard
8. ⏳ Add comprehensive email templates
9. ⏳ Set up monitoring and alerts

---

**Estimated Total Time**: 2-3 hours for basic implementation  
**Full Production Ready**: 1-2 weeks with testing and UI

