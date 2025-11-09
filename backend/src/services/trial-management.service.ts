import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../lib/email';

const prisma = new PrismaClient();

export class TrialManagementService {
  /**
   * Check for expiring trials and take action
   */
  async checkTrialExpirations(): Promise<void> {
    console.log('[Trial Management] Starting trial expiration check...');
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

    console.log(`[Trial Management] Found ${expiringTrials.length} expiring trials`);

    for (const customer of expiringTrials) {
      if (customer.payment_methods.length > 0) {
        console.log(`[Trial Management] Customer ${customer.email} has payment method, attempting conversion...`);
        await this.attemptTrialConversion(customer);
      } else {
        console.log(`[Trial Management] Customer ${customer.email} has no payment method, starting grace period...`);
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

    console.log(`[Trial Management] Found ${graceExpiring.length} expiring grace periods`);

    for (const customer of graceExpiring) {
      if (customer.payment_methods.length > 0) {
        console.log(`[Trial Management] Customer ${customer.email} added payment during grace, attempting conversion...`);
        await this.attemptTrialConversion(customer);
      } else {
        console.log(`[Trial Management] Customer ${customer.email} grace period expired, suspending account...`);
        await this.suspendAccount(customer);
      }
    }

    console.log('[Trial Management] Trial expiration check complete');
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

      // TODO: Integrate with Paystack to charge the payment method
      // For now, we'll assume success and activate the subscription
      // const paymentResult = await chargePaymentMethod(customer, paymentMethod);

      await prisma.customers.update({
        where: { id: customer.id },
        data: {
          status: 'active',
          subscriptionStartDate: new Date(),
          gracePeriodEndsAt: null,
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
          metadata: {
            paymentMethodId: paymentMethod.id,
            convertedFromTrial: true,
          },
        },
      });

      // Send success email
      await this.sendNotification(customer, 'subscription_activated');
      console.log(`[Trial Management] Successfully converted ${customer.email} to paid subscription`);
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
        metadata: {
          gracePeriodDays: 3,
          gracePeriodEndsAt: gracePeriodEnds.toISOString(),
        },
      },
    });

    // Send notification
    await this.sendNotification(customer, 'grace_period_started');
    console.log(`[Trial Management] Started grace period for ${customer.email}, ends ${gracePeriodEnds.toISOString()}`);
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
        metadata: {
          reason: 'Trial expired without payment',
        },
      },
    });

    // Send notification
    await this.sendNotification(customer, 'account_suspended');
    console.log(`[Trial Management] Suspended account for ${customer.email}`);
  }

  /**
   * Cleanup suspended accounts older than 30 days
   */
  async cleanupSuspendedAccounts(): Promise<void> {
    console.log('[Trial Management] Starting cleanup of old suspended accounts...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const accountsToCleanup = await prisma.customers.findMany({
      where: {
        status: 'suspended',
        suspendedAt: {
          lte: thirtyDaysAgo,
        },
      },
    });

    console.log(`[Trial Management] Found ${accountsToCleanup.length} accounts to cleanup`);

    for (const customer of accountsToCleanup) {
      // Log deletion event before deleting
      await prisma.subscription_events.create({
        data: {
          customerId: customer.id,
          eventType: 'account_deleted',
          previousStatus: 'suspended',
          newStatus: 'deleted',
          triggeredBy: 'system',
          metadata: {
            reason: 'Suspended for 30+ days',
            suspendedAt: customer.suspendedAt?.toISOString(),
          },
        },
      });

      // Delete customer (cascade will handle related records)
      await prisma.customers.delete({
        where: { id: customer.id },
      });

      console.log(`[Trial Management] Deleted suspended account: ${customer.email}`);
    }

    console.log('[Trial Management] Cleanup complete');
  }

  /**
   * Send notification to customer
   */
  private async sendNotification(customer: any, type: string): Promise<void> {
    const emailTemplates: Record<string, { subject: string; body: string }> = {
      trial_started: {
        subject: 'Welcome to Contrezz! Your 14-day trial has begun 🎉',
        body: `Hi ${customer.owner},\n\nYour Contrezz account is now active! You have 14 days of full access to explore all features.\n\nWhat's included in your trial:\n✓ Unlimited properties and units\n✓ Tenant management\n✓ Payment processing\n✓ Maintenance tracking\n✓ Financial reports\n✓ 24/7 support\n\nGet started by logging into your dashboard.\n\nBest regards,\nThe Contrezz Team`,
      },
      trial_7_days: {
        subject: 'Your Contrezz trial ends in 7 days',
        body: `Hi ${customer.owner},\n\nYour trial ends in 7 days. Don't lose access to your data!\n\nAdd a payment method now to continue without interruption.\n\nBest regards,\nThe Contrezz Team`,
      },
      trial_3_days: {
        subject: 'Your Contrezz trial ends in 3 days ⏰',
        body: `Hi ${customer.owner},\n\nYour trial ends in 3 days. Don't lose access to:\n• Your properties and units\n• Your tenants\n• Your payment history\n\n👉 Add a payment method now to continue.\n\nPlans starting at $99/month.\n\nBest regards,\nThe Contrezz Team`,
      },
      trial_1_day: {
        subject: 'Last chance! Your Contrezz trial ends tomorrow',
        body: `Hi ${customer.owner},\n\nThis is your final reminder - your trial ends tomorrow!\n\nAdd a payment method today to avoid losing access to your account.\n\nBest regards,\nThe Contrezz Team`,
      },
      grace_period_started: {
        subject: 'Your Contrezz trial has ended - 3 days to add payment',
        body: `Hi ${customer.owner},\n\nYour trial has ended. We've given you a 3-day grace period to add a payment method.\n\nAdd payment now to reactivate your account: [Add Payment Link]\n\nAfter 3 days, your account will be suspended.\n\nBest regards,\nThe Contrezz Team`,
      },
      account_suspended: {
        subject: 'Your Contrezz account has been suspended',
        body: `Hi ${customer.owner},\n\nYour account has been suspended due to no payment method on file.\n\nYour data is safe for 30 days. Add a payment method to reactivate: [Reactivation Link]\n\nAfter 30 days, your account and data will be permanently deleted.\n\nBest regards,\nThe Contrezz Team`,
      },
      subscription_activated: {
        subject: 'Welcome to Contrezz! Your subscription is active',
        body: `Hi ${customer.owner},\n\nThank you for subscribing to Contrezz! Your account is now active.\n\nYou have full access to all features. If you have any questions, our support team is here to help.\n\nBest regards,\nThe Contrezz Team`,
      },
    };

    const template = emailTemplates[type];
    if (template) {
      try {
        await sendEmail({
          to: customer.email,
          subject: template.subject,
          text: template.body,
          html: template.body.replace(/\n/g, '<br>'),
        });

        // Log notification
        await prisma.trial_notifications.create({
          data: {
            customerId: customer.id,
            notificationType: type,
            emailSent: true,
          },
        });

        console.log(`[Trial Management] Sent ${type} notification to ${customer.email}`);
      } catch (error) {
        console.error(`[Trial Management] Failed to send ${type} notification to ${customer.email}:`, error);
      }
    }
  }

  /**
   * Send proactive trial notifications
   */
  async sendTrialNotifications(): Promise<void> {
    console.log('[Trial Management] Starting trial notification sender...');

    // 7 days remaining
    await this.sendNotificationForDaysRemaining(7, 'trial_7_days');

    // 3 days remaining
    await this.sendNotificationForDaysRemaining(3, 'trial_3_days');

    // 1 day remaining
    await this.sendNotificationForDaysRemaining(1, 'trial_1_day');

    console.log('[Trial Management] Trial notification sender complete');
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

    console.log(`[Trial Management] Found ${customers.length} customers with ${daysRemaining} days remaining`);

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
      } else {
        console.log(`[Trial Management] Notification ${notificationType} already sent to ${customer.email}`);
      }
    }
  }

  /**
   * Reactivate a suspended account
   */
  async reactivateAccount(customerId: string): Promise<void> {
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      include: { payment_methods: true },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.status !== 'suspended') {
      throw new Error('Account is not suspended');
    }

    if (customer.payment_methods.length === 0) {
      throw new Error('No payment method on file');
    }

    // Reactivate account
    await prisma.customers.update({
      where: { id: customerId },
      data: {
        status: 'active',
        suspendedAt: null,
        suspensionReason: null,
        subscriptionStartDate: new Date(),
        updatedAt: new Date(),
      },
    });

    // Reactivate users
    await prisma.users.updateMany({
      where: { customerId },
      data: {
        isActive: true,
        status: 'active',
      },
    });

    // Log event
    await prisma.subscription_events.create({
      data: {
        customerId,
        eventType: 'account_reactivated',
        previousStatus: 'suspended',
        newStatus: 'active',
        triggeredBy: 'customer',
      },
    });

    console.log(`[Trial Management] Reactivated account for ${customer.email}`);
  }
}

export const trialManagementService = new TrialManagementService();

