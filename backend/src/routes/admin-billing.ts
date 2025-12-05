import { Router, Response } from 'express';
import { authMiddleware, AuthRequest, adminOnly } from '../middleware/auth';
import { processRecurringBilling, processAllRecurringBilling } from '../services/recurring-billing.service';
import prisma from '../lib/db';

const router = Router();

/**
 * POST /api/admin/billing/process-recurring
 * Manually trigger recurring billing for all customers
 * Admin only
 */
router.post('/process-recurring', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[Admin Billing] Manually triggering recurring billing...');

    const results = await processAllRecurringBilling();

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      message: 'Recurring billing process completed',
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results: results.map(r => ({
          customerId: r.customerId,
          success: r.success,
          amount: r.amount,
          reference: r.reference,
          error: r.error,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Admin Billing] Error processing recurring billing:', error);
    res.status(500).json({ error: error.message || 'Failed to process recurring billing' });
  }
});

/**
 * POST /api/admin/billing/process-customer/:customerId
 * Manually trigger recurring billing for a specific customer
 * Admin only
 */
router.post('/process-customer/:customerId', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.params;

    console.log('[Admin Billing] Manually triggering recurring billing for customer:', customerId);

    const result = await processRecurringBilling(customerId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Recurring billing processed successfully',
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to process recurring billing',
        data: result,
      });
    }
  } catch (error: any) {
    console.error('[Admin Billing] Error processing recurring billing:', error);
    res.status(500).json({ error: error.message || 'Failed to process recurring billing' });
  }
});

/**
 * GET /api/admin/billing/customer-status/:customerId
 * Get customer billing status including next billing date and payment method
 * Admin only
 */
router.get('/customer-status/:customerId', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.params;

    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      include: {
        plans: true,
        payment_methods: {
          where: { isActive: true },
          orderBy: { isDefault: 'desc' },
        },
        users: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculate next billing date
    let nextBillingDate: Date | null = null;
    if (customer.subscriptionStartDate) {
      nextBillingDate = new Date(customer.subscriptionStartDate);
      if (customer.billingCycle === 'annual') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }
    }

    // Calculate amount for next billing
    const nextBillingAmount = customer.plans
      ? (customer.billingCycle === 'annual' ? customer.plans.annualPrice : customer.plans.monthlyPrice)
      : 0;

    // Check if customer has valid payment method
    const defaultPaymentMethod = customer.payment_methods.find(pm => pm.isDefault);
    const hasValidPaymentMethod = !!defaultPaymentMethod?.authorizationCode;

    res.json({
      success: true,
      data: {
        customerId: customer.id,
        email: customer.email,
        status: customer.status,
        plan: customer.plans ? {
          id: customer.plans.id,
          name: customer.plans.name,
          monthlyPrice: customer.plans.monthlyPrice,
          annualPrice: customer.plans.annualPrice,
          currency: customer.plans.currency,
        } : null,
        billingCycle: customer.billingCycle,
        subscriptionStartDate: customer.subscriptionStartDate,
        nextBillingDate,
        nextBillingAmount,
        currency: customer.plans?.currency || 'NGN',
        hasValidPaymentMethod,
        defaultPaymentMethod: defaultPaymentMethod ? {
          id: defaultPaymentMethod.id,
          cardType: defaultPaymentMethod.cardType,
          last4: defaultPaymentMethod.last4,
          expiryMonth: defaultPaymentMethod.expiryMonth,
          expiryYear: defaultPaymentMethod.expiryYear,
          hasAuthorizationCode: !!defaultPaymentMethod.authorizationCode,
        } : null,
        paymentMethodsCount: customer.payment_methods.length,
        canProcessRenewal: customer.status === 'active' && customer.plans && hasValidPaymentMethod,
      },
    });
  } catch (error: any) {
    console.error('[Admin Billing] Error getting customer status:', error);
    res.status(500).json({ error: error.message || 'Failed to get customer status' });
  }
});

/**
 * POST /api/admin/billing/test-renewal/:customerId
 * Test subscription renewal for a specific customer
 * This will actually charge the card - use with caution!
 * Admin only
 */
router.post('/test-renewal/:customerId', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.params;
    const { skipDateCheck } = req.body; // Allow bypassing the 24-hour check

    console.log('[Admin Billing] Testing renewal for customer:', customerId);

    // Get customer details first
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      include: {
        plans: true,
        payment_methods: {
          where: { isDefault: true, isActive: true },
          take: 1,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Validation checks
    const issues: string[] = [];

    if (customer.status !== 'active') {
      issues.push(`Customer status is '${customer.status}', needs to be 'active'`);
    }

    if (!customer.plans) {
      issues.push('No plan assigned to customer');
    }

    if (!customer.payment_methods[0]?.authorizationCode) {
      issues.push('No default payment method with authorization code');
    }

    if (issues.length > 0 && !skipDateCheck) {
      return res.status(400).json({
        success: false,
        error: 'Cannot process renewal',
        issues,
        data: {
          customerId,
          status: customer.status,
          planId: customer.planId,
          hasPaymentMethod: customer.payment_methods.length > 0,
        },
      });
    }

    // Process the billing
    console.log('[Admin Billing] All checks passed, processing renewal...');
    const result = await processRecurringBilling(customerId);

    if (result.success) {
      // Get updated customer data
      const updatedCustomer = await prisma.customers.findUnique({
        where: { id: customerId },
        select: {
          subscriptionStartDate: true,
          billingCycle: true,
        },
      });

      // Calculate new next billing date
      let newNextBillingDate: Date | null = null;
      if (updatedCustomer?.subscriptionStartDate) {
        newNextBillingDate = new Date(updatedCustomer.subscriptionStartDate);
        if (updatedCustomer.billingCycle === 'annual') {
          newNextBillingDate.setFullYear(newNextBillingDate.getFullYear() + 1);
        } else {
          newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);
        }
      }

      res.json({
        success: true,
        message: '✅ Subscription renewal processed successfully!',
        data: {
          ...result,
          newSubscriptionStartDate: updatedCustomer?.subscriptionStartDate,
          newNextBillingDate,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to process renewal',
        data: result,
      });
    }
  } catch (error: any) {
    console.error('[Admin Billing] Error testing renewal:', error);
    res.status(500).json({ error: error.message || 'Failed to test renewal' });
  }
});

/**
 * POST /api/admin/billing/simulate-due/:customerId
 * Simulate billing due date by setting subscription start date to make renewal due
 * Admin only - FOR TESTING ONLY
 */
router.post('/simulate-due/:customerId', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.params;

    console.log('[Admin Billing] Simulating billing due for customer:', customerId);

    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { billingCycle: true },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Set subscription start date to make billing due "now"
    // For monthly: set to 1 month ago
    // For annual: set to 1 year ago
    const simulatedStartDate = new Date();
    if (customer.billingCycle === 'annual') {
      simulatedStartDate.setFullYear(simulatedStartDate.getFullYear() - 1);
    } else {
      simulatedStartDate.setMonth(simulatedStartDate.getMonth() - 1);
    }

    await prisma.customers.update({
      where: { id: customerId },
      data: {
        subscriptionStartDate: simulatedStartDate,
        updatedAt: new Date(),
      },
    });

    // Calculate what the next billing date would be
    const nextBillingDate = new Date(simulatedStartDate);
    if (customer.billingCycle === 'annual') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    res.json({
      success: true,
      message: 'Billing due date simulated. Customer is now due for renewal.',
      data: {
        customerId,
        billingCycle: customer.billingCycle,
        simulatedStartDate,
        nextBillingDate,
        isDueNow: nextBillingDate <= new Date(),
      },
    });
  } catch (error: any) {
    console.error('[Admin Billing] Error simulating due date:', error);
    res.status(500).json({ error: error.message || 'Failed to simulate due date' });
  }
});

export default router;
