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

    // Calculate new MRR based on billing cycle
    const billingCycle = customer.billingCycle || 'monthly';
    const newMRR = billingCycle === 'annual'
      ? newPlan.annualPrice / 12
      : newPlan.monthlyPrice;

    // Update customer with new plan
    const updatedCustomer = await prisma.customers.update({
      where: { id: user.customerId },
      data: {
        planId: newPlan.id,
        propertyLimit: newPlan.propertyLimit,
        userLimit: newPlan.userLimit,
        storageLimit: newPlan.storageLimit,
        mrr: newMRR,
        updatedAt: new Date()
      },
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

    // Verify user is owner
    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can cancel subscription' });
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

// Get available plans for owner
router.get('/plans', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plans.findMany({
      where: {
        isActive: true,
        monthlyPrice: { gt: 0 } // Exclude free/trial plans
      },
      orderBy: [
        { monthlyPrice: 'asc' }
      ]
    });

    res.json({ plans });

  } catch (error: any) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

export default router;

