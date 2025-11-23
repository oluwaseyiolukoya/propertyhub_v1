import { Router, Request, Response } from 'express';
import prisma from '../lib/db';
import { authMiddleware } from '../middleware/auth';
import { trialManagementService } from '../services/trial-management.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/subscription/status
 * Get current subscription status and trial information
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || !user.customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Prevent any caching of subscription status
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    res.set('Vary', 'Authorization');

    const customer = await prisma.customers.findUnique({
      where: { id: user.customerId },
      include: {
        plans: true,
        payment_methods: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculate days remaining
    let daysRemaining = 0;
    let inGracePeriod = false;
    let graceDaysRemaining = 0;

    if (customer.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(customer.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      daysRemaining = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0 && customer.gracePeriodEndsAt) {
        inGracePeriod = true;
        const graceEnd = new Date(customer.gracePeriodEndsAt);
        const graceDiffTime = graceEnd.getTime() - now.getTime();
        graceDaysRemaining = Math.floor(graceDiffTime / (1000 * 60 * 60 * 24));
      }
    }

    // Calculate next billing date
    let nextBillingDate = null;
    if (customer.status === 'active' && customer.subscriptionStartDate) {
      const startDate = new Date(customer.subscriptionStartDate);
      nextBillingDate = new Date(startDate);

      if (customer.billingCycle === 'annual') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }
    }

    const response = {
      status: customer.status,
      trialStartsAt: customer.trialStartsAt,
      trialEndsAt: customer.trialEndsAt,
      daysRemaining: Math.max(0, daysRemaining),
      inGracePeriod,
      gracePeriodEndsAt: customer.gracePeriodEndsAt,
      graceDaysRemaining: Math.max(0, graceDaysRemaining),
      suspendedAt: customer.suspendedAt,
      suspensionReason: customer.suspensionReason,
      hasPaymentMethod: customer.payment_methods.length > 0,
      canUpgrade: customer.status === 'trial' || customer.status === 'suspended',
      nextBillingDate,
      plan: customer.plans ? {
        id: customer.plans.id,
        name: customer.plans.name,
        monthlyPrice: customer.plans.monthlyPrice,
        annualPrice: customer.plans.annualPrice,
      } : null,
      billingCycle: customer.billingCycle,
      mrr: customer.mrr,
    };

    res.json(response);
  } catch (error) {
    console.error('[Subscription] Get status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

/**
 * POST /api/subscription/upgrade
 * Upgrade from trial to paid subscription
 */
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { planId, billingCycle, paymentReference, savePaymentMethod } = req.body;

    console.log('[Subscription] ========== UPGRADE REQUEST START ==========');
    console.log('[Subscription] User:', { id: user?.id, customerId: user?.customerId, email: user?.email });
    console.log('[Subscription] Request body:', { planId, billingCycle, paymentReference, savePaymentMethod });

    if (!user || !user.customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!planId || !billingCycle) {
      return res.status(400).json({ error: 'Plan ID and billing cycle are required' });
    }

    if (!paymentReference) {
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    console.log('[Subscription] Fetching customer...');
    const customer = await prisma.customers.findUnique({
      where: { id: user.customerId },
      include: { payment_methods: true, users: true },
    });

    if (!customer) {
      console.error('[Subscription] Customer not found:', user.customerId);
      return res.status(404).json({ error: 'Customer not found' });
    }

    console.log('[Subscription] Customer found:', { id: customer.id, email: customer.email, status: customer.status });

    if (customer.status !== 'trial' && customer.status !== 'suspended') {
      return res.status(400).json({ error: 'Account is not eligible for upgrade' });
    }

    // Resolve Paystack secret key (customer-level → system-level → env)
    console.log('[Subscription] Verifying payment with Paystack...');
    let paystackSecretKey: string | undefined;
    try {
      const customerSettings = await prisma.payment_settings.findFirst({
        where: { customerId: user.customerId, provider: 'paystack', isEnabled: true },
        select: { secretKey: true }
      });
      const system = await prisma.system_settings.findUnique({
        where: { key: 'payments.paystack' }
      });
      const systemConf = (system?.value as any) || {};
      paystackSecretKey =
        customerSettings?.secretKey ||
        systemConf?.secretKey ||
        process.env.PAYSTACK_SECRET_KEY;
    } catch (settingsErr) {
      console.warn('[Subscription] Failed to read payment settings, falling back to env:', (settingsErr as any)?.message || settingsErr);
      paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    }
    if (!paystackSecretKey) {
      console.error('[Subscription] Paystack secret key not configured at any level (customer/system/env)');
      return res.status(500).json({ error: 'Payment gateway not configured', details: 'Missing Paystack secret key' });
    }

    console.log('[Subscription] Calling Paystack API with reference:', paymentReference);
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${paymentReference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();
    console.log('[Subscription] Paystack verification response:', {
      status: verifyData.status,
      dataStatus: verifyData.data?.status,
      message: verifyData.message,
    });

    if (!verifyData.status || verifyData.data.status !== 'success') {
      console.error('[Subscription] Payment verification failed:', verifyData);
      return res.status(400).json({ error: 'Payment verification failed', details: verifyData.message });
    }

    console.log('[Subscription] Payment verified successfully');

    // Create payment record for the subscription
    try {
      const data = verifyData.data || {};
      await prisma.payments.create({
        data: {
          id: require('crypto').randomUUID(),
          customerId: customer.id,
          amount: typeof data.amount === 'number' ? data.amount / 100 : 0,
          currency: (data.currency || 'NGN').toUpperCase(),
          status: 'success',
          type: 'subscription',
          paymentMethod: data.channel || 'card',
          provider: 'paystack',
          providerReference: paymentReference,
          paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
          metadata: {
            planId,
            billingCycle,
            authorization: data.authorization?.last4 ? {
              last4: data.authorization.last4,
              brand: data.authorization.brand,
              bank: data.authorization.bank,
              exp: `${data.authorization.exp_month}/${data.authorization.exp_year}`
            } : undefined
          } as any,
          updatedAt: new Date()
        }
      });
      console.log('[Subscription] Payment record created');
    } catch (paymentCreateErr) {
      console.warn('[Subscription] Failed to create payment record (non-blocking):', (paymentCreateErr as any)?.message || paymentCreateErr);
    }

    // Get plan details
    console.log('[Subscription] Fetching plan:', planId);
    const plan = await prisma.plans.findUnique({ where: { id: planId } });
    if (!plan) {
      console.error('[Subscription] Plan not found:', planId);
      return res.status(404).json({ error: 'Plan not found' });
    }
    console.log('[Subscription] Plan found:', { id: plan.id, name: plan.name, monthlyPrice: plan.monthlyPrice });

    // Calculate MRR
    const mrr = billingCycle === 'annual'
      ? (plan.annualPrice || plan.monthlyPrice * 12) / 12
      : plan.monthlyPrice;

    // Save payment method if requested
    let savedPaymentMethodId: string | null = null;
    if (savePaymentMethod && verifyData.data.authorization) {
      const auth = verifyData.data.authorization;
      const ownerUser = customer.users.find(u => u.role === 'owner');

      if (ownerUser) {
        try {
          const newPaymentMethod = await prisma.payment_methods.create({
            data: {
              id: require('uuid').v4(),
              tenantId: ownerUser.id,
              customerId: customer.id,
              authorizationCode: auth.authorization_code,
              cardType: auth.card_type,
              cardLast4: auth.last4,
              cardExpMonth: auth.exp_month,
              cardExpYear: auth.exp_year,
              bank: auth.bank,
              cardBrand: auth.brand,
              isDefault: customer.payment_methods.length === 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          savedPaymentMethodId = newPaymentMethod.id;
          console.log('[Subscription] Payment method saved:', savedPaymentMethodId);
        } catch (pmError) {
          console.error('[Subscription] Failed to save payment method:', pmError);
          // Continue with upgrade even if saving payment method fails
        }
      }
    }

    // Update customer with plan limits
    console.log('[Subscription] Updating customer in database...');

    // 1) Set planId via raw SQL to avoid Prisma planId/plans input mismatch
    if (planId) {
      await prisma.$executeRawUnsafe(
        'UPDATE "customers" SET "planId" = $1 WHERE "id" = $2',
        planId,
        user.customerId
      );
    }

    // 2) Update the rest of the customer fields via Prisma
    const customerUpdateData: any = {
      status: 'active',
      billingCycle,
      mrr,
      userLimit: plan.userLimit,
      storageLimit: plan.storageLimit,
      planCategory: plan.category,
      subscriptionStartDate: new Date(),
      trialStartsAt: null,
      trialEndsAt: null,
      gracePeriodEndsAt: null,
      suspendedAt: null,
      suspensionReason: null,
      updatedAt: new Date(),
    };

    // Apply limits based on plan category, ensuring we never write null into non-nullable columns
    if (plan.category === 'property_management') {
      // For property owner plans, update propertyLimit explicitly and clear projectLimit
      customerUpdateData.propertyLimit =
        plan.propertyLimit ??
        customer.propertyLimit ??
        5; // safe default
      customerUpdateData.projectLimit = null;
    } else if (plan.category === 'development') {
      // For developer plans, use projectLimit and leave propertyLimit unchanged
      customerUpdateData.projectLimit =
        plan.projectLimit ?? customer.projectLimit ?? 0;
      // Intentionally do NOT touch propertyLimit here to avoid null writes
    }

    const updatedCustomer = await prisma.customers.update({
      where: { id: user.customerId },
      data: customerUpdateData,
      include: {
        plans: true,
      },
    });

    console.log('[Subscription] Customer updated successfully:', {
      id: updatedCustomer.id,
      status: updatedCustomer.status,
      planId: updatedCustomer.planId,
      propertyLimit: updatedCustomer.propertyLimit,
      userLimit: updatedCustomer.userLimit,
      storageLimit: updatedCustomer.storageLimit,
    });

    // Reactivate users if suspended
    if (customer.status === 'suspended') {
      await prisma.users.updateMany({
        where: { customerId: user.customerId },
        data: {
          isActive: true,
          status: 'active',
        },
      });
    }

    // Log event
    await prisma.subscription_events.create({
      data: {
        customerId: user.customerId,
        eventType: 'subscription_activated',
        previousStatus: customer.status,
        newStatus: 'active',
        triggeredBy: 'customer',
        metadata: {
          planId,
          billingCycle,
          mrr,
          paymentReference,
          paymentMethodId: savedPaymentMethodId || customer.payment_methods[0]?.id,
        },
      },
    });

    // Calculate next billing date
    const nextBillingDate = new Date();
    if (billingCycle === 'annual') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    // Send upgrade confirmation email
    let emailSent = false;
    let emailErrorDetails: any = null;
    
    try {
      const { sendPlanUpgradeEmail } = require('../lib/email');
      
      // Get old plan name (if exists)
      let oldPlanName = 'Free Plan';
      if (customer.planId) {
        const oldPlan = await prisma.plans.findUnique({
          where: { id: customer.planId }
        });
        if (oldPlan) {
          oldPlanName = oldPlan.name;
        }
      }

      const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;
      const effectiveDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Build features object
      const newFeatures: any = {
        users: plan.userLimit,
        storage: plan.storageLimit,
      };

      if (plan.category === 'development' && plan.projectLimit) {
        newFeatures.projects = plan.projectLimit;
      } else if (plan.category === 'property_management') {
        if (plan.propertyLimit) newFeatures.properties = plan.propertyLimit;
        if (plan.unitLimit) newFeatures.units = plan.unitLimit;
      }

      console.log('[Subscription] Sending upgrade confirmation email...');
      emailSent = await sendPlanUpgradeEmail({
        customerName: customer.company || customer.owner || 'Customer',
        customerEmail: customer.email,
        companyName: customer.company || 'Your Company',
        oldPlanName,
        newPlanName: plan.name,
        newPlanPrice: billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice,
        currency: plan.currency,
        billingCycle,
        effectiveDate,
        newFeatures,
        dashboardUrl,
      });
    } catch (emailError: any) {
      console.error('[Subscription] ❌ EXCEPTION while sending upgrade confirmation email:', emailError);
      emailErrorDetails = {
        message: emailError?.message,
        code: emailError?.code,
        response: emailError?.response,
      };
    }

    if (!emailSent) {
      console.warn('[Subscription] ⚠️  Email notification failed for upgrade, but subscription was successful');
      console.warn('[Subscription] Email error:', emailErrorDetails);
      // Don't fail the upgrade if email fails - just log it
    } else {
      console.log('[Subscription] ✅ Upgrade confirmation email sent successfully');
    }

    console.log('[Subscription] ========== UPGRADE SUCCESS ==========');

    const response = {
      success: true,
      subscriptionId: updatedCustomer.id,
      status: updatedCustomer.status,
      plan: updatedCustomer.plans ? {
        id: updatedCustomer.plans.id,
        name: updatedCustomer.plans.name,
        monthlyPrice: updatedCustomer.plans.monthlyPrice,
        annualPrice: updatedCustomer.plans.annualPrice,
        propertyLimit: updatedCustomer.plans.propertyLimit,
        userLimit: updatedCustomer.plans.userLimit,
        storageLimit: updatedCustomer.plans.storageLimit,
      } : null,
      propertyLimit: updatedCustomer.propertyLimit,
      userLimit: updatedCustomer.userLimit,
      storageLimit: updatedCustomer.storageLimit,
      nextBillingDate,
      message: 'Subscription activated successfully',
      emailSent, // Include email status in response
    };

    console.log('[Subscription] Sending response:', response);
    res.json(response);
  } catch (error) {
    const message = (error as any)?.message || String(error);
    const code = (error as any)?.code;
    const stack = (error as any)?.stack;
    console.error('[Subscription] ========== UPGRADE ERROR ==========');
    console.error('[Subscription] Error message:', message);
    console.error('[Subscription] Error code:', code);
    console.error('[Subscription] Error stack:', stack);
    res.status(500).json({ error: 'Failed to upgrade subscription', details: message, code });
  }
});

/**
 * POST /api/subscription/reactivate
 * Reactivate suspended account
 */
router.post('/reactivate', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { paymentMethodId } = req.body;

    if (!user || !user.customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const customer = await prisma.customers.findUnique({
      where: { id: user.customerId },
      include: { payment_methods: true },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.status !== 'suspended') {
      return res.status(400).json({ error: 'Account is not suspended' });
    }

    // Verify payment method
    if (paymentMethodId) {
      const paymentMethod = customer.payment_methods.find(pm => pm.id === paymentMethodId);
      if (!paymentMethod) {
        return res.status(400).json({ error: 'Payment method not found' });
      }
    } else if (customer.payment_methods.length === 0) {
      return res.status(400).json({ error: 'No payment method on file. Please add a payment method first.' });
    }

    // Reactivate account
    await trialManagementService.reactivateAccount(user.customerId);

    res.json({
      success: true,
      status: 'active',
      message: 'Account reactivated successfully',
    });
  } catch (error: any) {
    console.error('[Subscription] Reactivate error:', error);
    res.status(500).json({ error: error.message || 'Failed to reactivate account' });
  }
});

/**
 * GET /api/subscription/history
 * Get subscription event history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || !user.customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const events = await prisma.subscription_events.findMany({
      where: { customerId: user.customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ events });
  } catch (error) {
    console.error('[Subscription] Get history error:', error);
    res.status(500).json({ error: 'Failed to get subscription history' });
  }
});

export default router;

