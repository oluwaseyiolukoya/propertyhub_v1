import prisma from '../lib/db';
import axios from 'axios';
import { randomUUID } from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface RecurringBillingResult {
  success: boolean;
  customerId: string;
  amount: number;
  reference?: string;
  error?: string;
}

/**
 * Process recurring billing for a customer
 */
export async function processRecurringBilling(customerId: string): Promise<RecurringBillingResult> {
  try {
    console.log('[Recurring Billing] Processing for customer:', customerId);

    // Get customer with plan details
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      include: {
        plans: true,
        payment_methods: {
          where: {
            isDefault: true,
            isActive: true,
          },
          take: 1,
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.status !== 'active') {
      console.log('[Recurring Billing] Customer is not active, skipping:', customer.status);
      return {
        success: false,
        customerId,
        amount: 0,
        error: 'Customer is not active',
      };
    }

    if (!customer.plans) {
      console.log('[Recurring Billing] Customer has no plan, skipping');
      return {
        success: false,
        customerId,
        amount: 0,
        error: 'No plan assigned',
      };
    }

    // Get default payment method
    const paymentMethod = customer.payment_methods[0];
    if (!paymentMethod || !paymentMethod.authorizationCode) {
      console.log('[Recurring Billing] No default payment method found');
      return {
        success: false,
        customerId,
        amount: 0,
        error: 'No default payment method',
      };
    }

    // Calculate amount based on billing cycle
    const amount = customer.billingCycle === 'annual'
      ? customer.plans.annualPrice
      : customer.plans.monthlyPrice;

    if (!amount || amount <= 0) {
      console.log('[Recurring Billing] Invalid plan amount:', amount);
      return {
        success: false,
        customerId,
        amount: 0,
        error: 'Invalid plan amount',
      };
    }

    console.log('[Recurring Billing] Charging', amount, customer.plans.currency, 'to authorization:', paymentMethod.authorizationCode);

    // Charge the authorization code
    const reference = `recurring_${customerId}_${Date.now()}`;
    const chargeResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/charge_authorization`,
      {
        authorization_code: paymentMethod.authorizationCode,
        email: customer.email,
        amount: amount * 100, // Convert to kobo
        currency: customer.plans.currency || 'NGN',
        reference,
        metadata: {
          customer_id: customerId,
          plan_id: customer.planId,
          plan_name: customer.plans.name,
          billing_cycle: customer.billingCycle,
          recurring: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!chargeResponse.data.status || chargeResponse.data.data.status !== 'success') {
      console.error('[Recurring Billing] Charge failed:', chargeResponse.data);

      // Create failed payment record
      await prisma.payments.create({
        data: {
          id: randomUUID(),
          customerId,
          amount,
          currency: customer.plans.currency || 'NGN',
          status: 'failed',
          provider: 'paystack',
          providerReference: reference,
          metadata: {
            error: chargeResponse.data.message || 'Charge failed',
            recurring: true,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: false,
        customerId,
        amount,
        error: chargeResponse.data.message || 'Charge failed',
      };
    }

    console.log('[Recurring Billing] Charge successful:', reference);

    // Create successful payment record
    await prisma.payments.create({
      data: {
        id: randomUUID(),
        customerId,
        amount,
        currency: customer.plans.currency || 'NGN',
        status: 'completed',
        provider: 'paystack',
        providerReference: reference,
        paymentMethodId: paymentMethod.id,
        paidAt: new Date(),
        metadata: {
          authorization_code: paymentMethod.authorizationCode,
          recurring: true,
          transaction_id: chargeResponse.data.data.id,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update subscription start date for next billing cycle
    const newSubscriptionStartDate = new Date();
    await prisma.customers.update({
      where: { id: customerId },
      data: {
        subscriptionStartDate: newSubscriptionStartDate,
        updatedAt: new Date(),
      },
    });

    console.log('[Recurring Billing] Subscription renewed for customer:', customerId);

    // TODO: Send receipt email to customer

    return {
      success: true,
      customerId,
      amount,
      reference,
    };
  } catch (error: any) {
    console.error('[Recurring Billing] Error processing billing:', error);
    return {
      success: false,
      customerId,
      amount: 0,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Process recurring billing for all customers due for renewal
 */
export async function processAllRecurringBilling(): Promise<RecurringBillingResult[]> {
  try {
    console.log('[Recurring Billing] Starting batch processing...');

    // Find all active customers with subscriptions due for renewal
    const customers = await prisma.customers.findMany({
      where: {
        status: 'active',
        planId: { not: null },
        subscriptionStartDate: { not: null },
      },
      select: {
        id: true,
        subscriptionStartDate: true,
        billingCycle: true,
      },
    });

    console.log('[Recurring Billing] Found', customers.length, 'active customers');

    const results: RecurringBillingResult[] = [];
    const now = new Date();

    for (const customer of customers) {
      if (!customer.subscriptionStartDate) continue;

      const startDate = new Date(customer.subscriptionStartDate);
      const nextBillingDate = new Date(startDate);

      if (customer.billingCycle === 'annual') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }

      // Check if billing is due (within the next 24 hours)
      const hoursUntilDue = (nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilDue <= 24 && hoursUntilDue >= 0) {
        console.log('[Recurring Billing] Customer due for renewal:', customer.id, 'in', hoursUntilDue.toFixed(2), 'hours');
        const result = await processRecurringBilling(customer.id);
        results.push(result);

        // Add a small delay between charges to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('[Recurring Billing] Batch processing complete. Processed', results.length, 'customers');
    console.log('[Recurring Billing] Successful:', results.filter(r => r.success).length);
    console.log('[Recurring Billing] Failed:', results.filter(r => !r.success).length);

    return results;
  } catch (error: any) {
    console.error('[Recurring Billing] Error in batch processing:', error);
    return [];
  }
}

