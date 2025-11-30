import express, { Response } from 'express';
import prisma from '../lib/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { emitToAdmins, emitToCustomer } from '../lib/socket';
import { captureSnapshotOnChange } from '../lib/mrr-snapshot';

const router = express.Router();

// Change subscription plan
router.post('/change-plan', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Get user and customer
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { customers: true }
    });

    if (!user || !user.customerId) {
      return res.status(403).json({ error: 'Only customer owners can change plans' });
    }

    // Verify user is owner
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can change subscription plans' });
    }

    // Get the new plan
    const newPlan = await prisma.plans.findUnique({
      where: { id: planId }
    });

    if (!newPlan || !newPlan.isActive) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const customer = user.customers;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Validate plan category matches user role
    const userPlanCategory = (user.role === 'developer' || user.role === 'property-developer')
      ? 'development'
      : 'property_management';

    if (newPlan.category !== userPlanCategory) {
      return res.status(400).json({
        error: `Invalid plan category. ${user.role === 'developer' || user.role === 'property-developer' ? 'Developers' : 'Property owners/managers'} can only select ${userPlanCategory} plans.`
      });
    }

    // Calculate new MRR based on billing cycle
    const billingCycle = customer.billingCycle || 'monthly';
    const newMRR = billingCycle === 'annual'
      ? newPlan.annualPrice / 12
      : newPlan.monthlyPrice;

    // Update customer with new plan
    const updateData: any = {
      planId: newPlan.id,
      planCategory: newPlan.category,
      userLimit: newPlan.userLimit,
      storageLimit: newPlan.storageLimit,
      mrr: newMRR,
      updatedAt: new Date()
    };

    // Set limits based on plan category
    if (newPlan.category === 'property_management') {
      updateData.propertyLimit = newPlan.propertyLimit;
    } else if (newPlan.category === 'development') {
      updateData.projectLimit = newPlan.projectLimit;
    }

    const updatedCustomer = await prisma.customers.update({
      where: { id: user.customerId },
      data: updateData,
      include: { plans: true }
    });

    // Emit real-time event to admins
    emitToAdmins('subscription:plan-changed', {
      customerId: updatedCustomer.id,
      customerName: updatedCustomer.company,
      oldPlan: customer.planId,
      newPlan: newPlan.name,
      newMRR: newMRR
    });

    // Emit to customer
    emitToCustomer(updatedCustomer.id, 'subscription:updated', {
      plan: newPlan.name,
      limits: {
        properties: newPlan.propertyLimit,
        users: newPlan.userLimit,
        storage: newPlan.storageLimit
      }
    });

    // Capture MRR snapshot for plan change
    try {
      await captureSnapshotOnChange(updatedCustomer.id);
    } catch (snapshotError) {
      console.error('Failed to capture MRR snapshot:', snapshotError);
    }

    res.json({
      message: 'Subscription plan updated successfully',
      customer: updatedCustomer,
      plan: newPlan
    });

  } catch (error: any) {
    console.error('Change plan error:', error);
    res.status(500).json({ error: 'Failed to change subscription plan' });
  }
});

// Change billing cycle
router.post('/change-billing-cycle', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { billingCycle } = req.body;
    if (!billingCycle || !['monthly', 'annual'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle. Must be "monthly" or "annual"' });
    }

    // Get user and customer
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        customers: {
          include: { plans: true }
        }
      }
    });

    if (!user || !user.customerId) {
      return res.status(403).json({ error: 'Only customer owners can change billing cycle' });
    }

    // Verify user is owner
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can change billing cycle' });
    }

    const customer = user.customers;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const plan = customer.plans;
    if (!plan) {
      return res.status(404).json({ error: 'No active plan found' });
    }

    // Calculate new MRR
    const newMRR = billingCycle === 'annual'
      ? plan.annualPrice / 12
      : plan.monthlyPrice;

    // Update billing cycle
    const updatedCustomer = await prisma.customers.update({
      where: { id: user.customerId },
      data: {
        billingCycle,
        mrr: newMRR,
        updatedAt: new Date()
      },
      include: { plans: true }
    });

    // Emit real-time event to admins
    emitToAdmins('subscription:billing-changed', {
      customerId: updatedCustomer.id,
      customerName: updatedCustomer.company,
      newBillingCycle: billingCycle,
      newMRR: newMRR
    });

    // Emit to customer
    emitToCustomer(updatedCustomer.id, 'subscription:updated', {
      billingCycle: billingCycle
    });

    // Capture MRR snapshot for billing cycle change
    try {
      await captureSnapshotOnChange(updatedCustomer.id);
    } catch (snapshotError) {
      console.error('Failed to capture MRR snapshot:', snapshotError);
    }

    res.json({
      message: 'Billing cycle updated successfully',
      customer: updatedCustomer,
      billingCycle: billingCycle,
      newMRR: newMRR
    });

  } catch (error: any) {
    console.error('Change billing cycle error:', error);
    res.status(500).json({ error: 'Failed to change billing cycle' });
  }
});

// Cancel subscription
router.post('/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { reason, confirmation } = req.body;

    // Require explicit confirmation
    if (confirmation !== 'CANCEL_SUBSCRIPTION') {
      return res.status(400).json({ error: 'Confirmation text does not match' });
    }

    // Get user and customer
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { customers: true }
    });

    if (!user || !user.customerId) {
      return res.status(403).json({ error: 'Only customer owners can cancel subscription' });
    }

    // Verify user is owner or developer
    if (user.role !== 'owner' && user.role !== 'developer' && user.role !== 'property-developer') {
      return res.status(403).json({ error: 'Only account owners can cancel subscription' });
    }

    const customer = user.customers;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Deactivate customer account
    const updatedCustomer = await prisma.customers.update({
      where: { id: user.customerId },
      data: {
        status: 'cancelled',
        mrr: 0,
        notes: `${customer.notes || ''}\n\nSubscription cancelled on ${new Date().toISOString()}. Reason: ${reason || 'Not provided'}`,
        updatedAt: new Date()
      }
    });

    // Deactivate all users associated with this customer (owner, managers, tenants)
    await prisma.users.updateMany({
      where: { customerId: user.customerId },
      data: {
        isActive: false,
        status: 'inactive',
        updatedAt: new Date()
      }
    });

    // Emit real-time event to admins
    emitToAdmins('subscription:cancelled', {
      customerId: updatedCustomer.id,
      customerName: updatedCustomer.company,
      reason: reason || 'Not provided',
      cancelledAt: new Date().toISOString()
    });

    // Emit to all users in the customer account
    emitToCustomer(updatedCustomer.id, 'account:deactivated', {
      message: 'Your subscription has been cancelled. Your account is now inactive.',
      cancelledAt: new Date().toISOString()
    });

    // Capture MRR snapshot for cancellation
    try {
      await captureSnapshotOnChange(updatedCustomer.id);
    } catch (snapshotError) {
      console.error('Failed to capture MRR snapshot:', snapshotError);
    }

    res.json({
      message: 'Subscription cancelled successfully. All associated accounts have been deactivated.',
      customer: updatedCustomer
    });

  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get available plans for owner (filtered by user role/category)
router.get('/plans', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user to determine plan category
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        customers: {
          select: { planCategory: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine plan category based on user role
    let planCategory = (user.role === 'developer' || user.role === 'property-developer')
      ? 'development'
      : 'property_management';

    // If customer has a plan category set, use that
    if (user.customers?.planCategory) {
      planCategory = user.customers.planCategory;
    }

    const plans = await prisma.plans.findMany({
      where: {
        category: planCategory,
        isActive: true,
        monthlyPrice: { gt: 0 } // Exclude free/trial plans
      },
      orderBy: [
        { monthlyPrice: 'asc' }
      ]
    });

    res.json({ plans, category: planCategory });

  } catch (error: any) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get billing history for current user
router.get('/billing-history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's customer ID
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { customerId: true }
    });

    if (!user || !user.customerId) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Fetch invoices for this customer
    const invoices = await prisma.invoices.findMany({
      where: {
        customerId: user.customerId,
        status: { in: ['paid', 'pending', 'overdue'] } // Exclude cancelled/draft
      },
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        currency: true,
        status: true,
        dueDate: true,
        paidAt: true,
        billingPeriod: true,
        description: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 12 // Last 12 invoices
    });

    res.json({ invoices });

  } catch (error: any) {
    console.error('Get billing history error:', error);
    res.status(500).json({ error: 'Failed to fetch billing history' });
  }
});

// Initialize upgrade payment
router.post('/upgrade/initialize', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { planId, billingCycle: requestedBillingCycle } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    console.log('[Upgrade] Initialize payment for user:', userId, 'plan:', planId, 'billing cycle:', requestedBillingCycle);

    // Get user and customer
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        customers: {
          include: { plans: true }
        }
      }
    });

    if (!user || !user.customerId || !user.customers) {
      return res.status(403).json({ error: 'Customer not found' });
    }

    const customer = user.customers;

    // Get the new plan
    const newPlan = await prisma.plans.findUnique({
      where: { id: planId }
    });

    if (!newPlan || !newPlan.isActive) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    // Validate plan category matches user role
    const userPlanCategory = (user.role === 'developer' || user.role === 'property-developer')
      ? 'development'
      : 'property_management';

    if (newPlan.category !== userPlanCategory) {
      return res.status(400).json({
        error: `Invalid plan category. ${user.role === 'developer' || user.role === 'property-developer' ? 'Developers' : 'Property owners/managers'} can only select ${userPlanCategory} plans.`
      });
    }

    // Calculate amount based on requested billing cycle (or fall back to customer's current cycle)
    const billingCycle = requestedBillingCycle || customer.billingCycle || 'monthly';
    const amount = billingCycle === 'annual' ? newPlan.annualPrice : newPlan.monthlyPrice;
    const currency = newPlan.currency || 'NGN';

    console.log('[Upgrade] Billing cycle:', billingCycle, 'Amount:', amount, 'Currency:', currency);

    // Resolve Paystack keys (customer-level → system-level → env)
    console.log('[Upgrade] Resolving Paystack configuration...');
    let paystackSecretKey: string | undefined;
    let paystackPublicKey: string | undefined;

    try {
      // Try customer-level settings first
      const customerSettings = await prisma.payment_settings.findFirst({
        where: { customerId: customer.id, provider: 'paystack', isEnabled: true },
        select: { secretKey: true, publicKey: true }
      });

      // Try system-level settings
      const systemSettings = await prisma.system_settings.findUnique({
        where: { key: 'payments.paystack' }
      });
      const systemConf = (systemSettings?.value as any) || {};

      // Fallback chain
      paystackSecretKey =
        customerSettings?.secretKey ||
        systemConf?.secretKey ||
        process.env.PAYSTACK_SECRET_KEY;

      paystackPublicKey =
        customerSettings?.publicKey ||
        systemConf?.publicKey ||
        process.env.PAYSTACK_PUBLIC_KEY;

      console.log('[Upgrade] Paystack keys resolved:', {
        hasSecretKey: !!paystackSecretKey,
        hasPublicKey: !!paystackPublicKey,
        source: customerSettings ? 'customer' : systemConf?.secretKey ? 'system' : 'env'
      });
    } catch (settingsErr) {
      console.warn('[Upgrade] Failed to read payment settings, falling back to env:', (settingsErr as any)?.message);
      paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY;
    }

    if (!paystackSecretKey || !paystackPublicKey) {
      console.error('[Upgrade] Paystack keys not configured at any level (customer/system/env)');
      return res.status(400).json({
        error: 'Payment gateway not configured. Please contact support.',
        details: 'Missing Paystack API keys'
      });
    }

    // Generate unique reference
    const reference = `UPG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Create invoice for the upgrade
    const invoice = await prisma.invoices.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId: customer.id,
        invoiceNumber: `INV-UPG-${Date.now()}`,
        amount,
        currency,
        status: 'pending',
        dueDate: new Date(),
        billingPeriod: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        description: `Plan upgrade to ${newPlan.name}`,
        items: JSON.stringify([{
          description: `${newPlan.name} - ${billingCycle} subscription`,
          quantity: 1,
          unitPrice: amount,
          total: amount
        }]),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('[Upgrade] Invoice created:', invoice.id);

    // Initialize Paystack payment
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: customer.email,
        amount: Math.round(amount * 100), // Paystack expects amount in kobo/cents
        currency,
        reference,
        metadata: {
          customerId: customer.id,
          invoiceId: invoice.id,
          planId: newPlan.id,
          billingCycle,
          type: 'upgrade',
          userId: user.id
        },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?payment_callback=upgrade&tab=billing`
      })
    });

    const paystackData = await paystackResponse.json() as any;

    if (!paystackResponse.ok || !paystackData?.status) {
      console.error('[Upgrade] Paystack initialization failed:', paystackData);
      return res.status(400).json({
        error: paystackData?.message || 'Failed to initialize payment'
      });
    }

    console.log('[Upgrade] Paystack initialized successfully:', reference);

    // Create payment record
    await prisma.payments.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId: customer.id,
        invoiceId: invoice.id,
        amount,
        currency,
        status: 'pending',
        type: 'subscription',
        provider: 'paystack',
        providerReference: reference,
        metadata: JSON.stringify({
          planId: newPlan.id,
          billingCycle,
          type: 'upgrade'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.json({
      authorizationUrl: paystackData.data?.authorization_url,
      reference,
      publicKey: paystackPublicKey,
      invoiceId: invoice.id
    });

  } catch (error: any) {
    console.error('[Upgrade] Initialize payment error:', error);
    res.status(500).json({ error: 'Failed to initialize upgrade payment' });
  }
});

// Verify upgrade payment and complete upgrade
router.post('/upgrade/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    console.log('[Upgrade] Verify payment:', reference);

    // Get user and customer
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { customers: { include: { plans: true } } }
    });

    if (!user || !user.customerId || !user.customers) {
      return res.status(403).json({ error: 'Customer not found' });
    }

    const customer = user.customers;

    // Resolve Paystack secret key (customer-level → system-level → env)
    console.log('[Upgrade] Resolving Paystack configuration for verification...');
    let paystackSecretKey: string | undefined;

    try {
      const customerSettings = await prisma.payment_settings.findFirst({
        where: { customerId: customer.id, provider: 'paystack', isEnabled: true },
        select: { secretKey: true }
      });

      const systemSettings = await prisma.system_settings.findUnique({
        where: { key: 'payments.paystack' }
      });
      const systemConf = (systemSettings?.value as any) || {};

      paystackSecretKey =
        customerSettings?.secretKey ||
        systemConf?.secretKey ||
        process.env.PAYSTACK_SECRET_KEY;

      console.log('[Upgrade] Paystack key resolved for verification:', {
        hasSecretKey: !!paystackSecretKey,
        source: customerSettings ? 'customer' : systemConf?.secretKey ? 'system' : 'env'
      });
    } catch (settingsErr) {
      console.warn('[Upgrade] Failed to read payment settings, falling back to env:', (settingsErr as any)?.message);
      paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    }

    if (!paystackSecretKey) {
      console.error('[Upgrade] Paystack secret key not configured');
      return res.status(400).json({ error: 'Payment gateway not configured' });
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const verifyData = await verifyResponse.json() as any;

    if (!verifyResponse.ok || !verifyData?.status) {
      console.error('[Upgrade] Paystack verification failed:', verifyData);
      return res.status(400).json({
        error: verifyData?.message || 'Payment verification failed'
      });
    }

    const transaction = verifyData.data;

    if (transaction.status !== 'success') {
      return res.status(400).json({ error: 'Payment was not successful' });
    }

    console.log('[Upgrade] Payment verified successfully');

    // Get metadata
    const metadata = transaction.metadata || {};
    const planId = metadata.planId;
    const invoiceId = metadata.invoiceId;
    const verifiedBillingCycle = metadata.billingCycle || customer.billingCycle || 'monthly';

    if (!planId) {
      return res.status(400).json({ error: 'Invalid payment metadata' });
    }

    // Get the new plan
    const newPlan = await prisma.plans.findUnique({
      where: { id: planId }
    });

    if (!newPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Calculate new MRR based on verified billing cycle
    const billingCycle = verifiedBillingCycle;
    const newMRR = billingCycle === 'annual'
      ? newPlan.annualPrice / 12
      : newPlan.monthlyPrice;

    // Update customer with new plan
    const updateData: any = {
      planId: newPlan.id,
      planCategory: newPlan.category,
      userLimit: newPlan.userLimit,
      storageLimit: newPlan.storageLimit,
      mrr: newMRR,
      status: 'active',
      billingCycle,
      subscriptionStartDate: customer.subscriptionStartDate || new Date(),
      // Clear trial-related fields when upgrading to paid plan
      trialStartsAt: null,
      trialEndsAt: null,
      gracePeriodEndsAt: null,
      suspendedAt: null,
      suspensionReason: null,
      updatedAt: new Date()
    };

    // Set limits based on plan category
    if (newPlan.category === 'property_management') {
      updateData.propertyLimit = newPlan.propertyLimit;
    } else if (newPlan.category === 'development') {
      updateData.projectLimit = newPlan.projectLimit;
    }

    const updatedCustomer = await prisma.customers.update({
      where: { id: customer.id },
      data: updateData,
      include: { plans: true }
    });

    console.log('[Upgrade] Customer updated with new plan');

    // Update invoice status
    if (invoiceId) {
      await prisma.invoices.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Update payment record
    await prisma.payments.updateMany({
      where: {
        providerReference: reference,
        customerId: customer.id
      },
      data: {
        status: 'completed',
        paidAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Emit real-time event to admins
    emitToAdmins('subscription:plan-upgraded', {
      customerId: updatedCustomer.id,
      customerName: updatedCustomer.company,
      oldPlan: customer.plans?.name,
      newPlan: newPlan.name,
      amount: transaction.amount / 100,
      currency: transaction.currency
    });

    // Emit to customer
    emitToCustomer(updatedCustomer.id, 'subscription:upgraded', {
      plan: newPlan.name,
      limits: {
        projects: updateData.projectLimit,
        properties: updateData.propertyLimit,
        users: updateData.userLimit,
        storage: updateData.storageLimit
      }
    });

    // Capture MRR snapshot
    await captureSnapshotOnChange(updatedCustomer.id, 'upgrade', customer.mrr || 0, newMRR);

    // -----------------------------------------------------------------------
    // Send upgrade confirmation email (for active → higher plan upgrades)
    // Mirrors logic in /api/subscription/upgrade so behaviour is consistent
    // -----------------------------------------------------------------------
    let emailSent = false;
    let emailErrorDetails: any = null;

    try {
      // Lazy-require to avoid circular deps at module load
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { sendPlanUpgradeEmail } = require('../lib/email');

      // Old plan name comes from the customer snapshot we loaded earlier
      const oldPlanName = customer.plans?.name || 'Free Plan';

      const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;
      const effectiveDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Build features object from the NEW plan
      const newFeatures: any = {
        users: newPlan.userLimit,
        storage: newPlan.storageLimit,
      };

      if (newPlan.category === 'development' && newPlan.projectLimit) {
        newFeatures.projects = newPlan.projectLimit;
      } else if (newPlan.category === 'property_management') {
        if (newPlan.propertyLimit) newFeatures.properties = newPlan.propertyLimit;
        if ((newPlan as any).unitLimit) newFeatures.units = (newPlan as any).unitLimit;
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[Upgrade] 📧 SENDING UPGRADE CONFIRMATION EMAIL (verify flow)');
      console.log('[Upgrade] Customer:', customer.email);
      console.log('[Upgrade] Plan:', `${oldPlanName} → ${newPlan.name}`);
      console.log('[Upgrade] Price:', billingCycle === 'annual' ? newPlan.annualPrice : newPlan.monthlyPrice);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      emailSent = await sendPlanUpgradeEmail({
        customerName: customer.company || customer.owner || 'Customer',
        customerEmail: customer.email,
        companyName: customer.company || 'Your Company',
        oldPlanName,
        newPlanName: newPlan.name,
        newPlanPrice: billingCycle === 'annual' ? newPlan.annualPrice : newPlan.monthlyPrice,
        currency: newPlan.currency || 'NGN',
        billingCycle,
        effectiveDate,
        newFeatures,
        dashboardUrl,
      });

      console.log('[Upgrade] 📧 Email function returned:', emailSent ? '✅ SUCCESS' : '❌ FAILED');
    } catch (emailError: any) {
      console.error('[Upgrade] ❌ EXCEPTION while sending upgrade confirmation email (verify flow):', emailError);
      emailErrorDetails = {
        message: emailError?.message,
        code: emailError?.code,
        response: emailError?.response,
        stack: emailError?.stack,
      };
    }

    if (!emailSent) {
      console.error('[Upgrade] ⚠️ VALIDATION FAILED: Upgrade email was NOT sent (verify flow)');
      console.error('[Upgrade] Email error:', emailErrorDetails);

      // IMPORTANT: At this point, payment and database updates have succeeded.
      // We still return 500 so the caller knows email delivery failed,
      // matching the behaviour of /api/subscription/upgrade.
      return res.status(500).json({
        success: false,
        error: 'Failed to send upgrade confirmation email',
        details: emailErrorDetails?.message || 'Unknown email error',
        data: {
          customerId: updatedCustomer.id,
          customerEmail: customer.email,
          planName: newPlan.name,
          note: 'Upgrade was processed but email delivery failed. Please notify the customer manually.',
        },
      });
    }

    console.log('[Upgrade] ✅ Upgrade completed successfully (verify flow, email sent)');

    res.json({
      success: true,
      message: 'Plan upgraded successfully',
      customer: {
        id: updatedCustomer.id,
        plan: newPlan.name,
        limits: {
          projects: updateData.projectLimit,
          properties: updateData.propertyLimit,
          users: updateData.userLimit,
          storage: updateData.storageLimit
        }
      }
    });

  } catch (error: any) {
    console.error('[Upgrade] Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify upgrade payment' });
  }
});

export default router;

