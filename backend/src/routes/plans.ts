import express, { Response } from 'express';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { emitToAdmins } from '../lib/socket';
import { captureSnapshotOnChange } from '../lib/mrr-snapshot';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

// Get all plans
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plans.findMany({
      include: {
        _count: {
          select: { customers: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(plans);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Create plan
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      monthlyPrice,
      annualPrice,
      currency,
      propertyLimit,
      userLimit,
      storageLimit,
      features,
      isActive,
      isPopular,
      trialDurationDays
    } = req.body;

    console.log('[Plans] Creating plan with data:', req.body);

    if (!name || monthlyPrice === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const plan = await prisma.plans.create({
      data: {
        id: uuidv4(),
        name,
        description,
        monthlyPrice: parseFloat(monthlyPrice),
        annualPrice: annualPrice ? parseFloat(annualPrice) : parseFloat(monthlyPrice) * 10,
        currency: currency || 'NGN',
        propertyLimit: parseInt(propertyLimit) || 5,
        userLimit: parseInt(userLimit) || 3,
        storageLimit: parseInt(storageLimit) || 1000,
        features: features || {},
        isActive: isActive !== undefined ? isActive : true,
        isPopular: isPopular || false,
        trialDurationDays: trialDurationDays !== undefined ? parseInt(trialDurationDays) : undefined,
        updatedAt: new Date()
      }
    });

    console.log('[Plans] Plan created successfully:', plan.id);

    // Emit real-time event to all admins
    try {
      emitToAdmins('plan:created', { plan });
    } catch {}

    return res.status(201).json(plan);
  } catch (error: any) {
    console.error('[Plans] Failed to create plan:', error);
    return res.status(500).json({ error: 'Failed to create plan', details: error.message });
  }
});

// Update plan
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      monthlyPrice,
      annualPrice,
      currency,
      propertyLimit,
      userLimit,
      storageLimit,
      features,
      isActive,
      isPopular,
      trialDurationDays
    } = req.body;

    const plan = await prisma.plans.update({
      where: { id },
      data: {
        name,
        description,
        monthlyPrice,
        annualPrice,
        currency,
        propertyLimit,
        userLimit,
        storageLimit,
        features,
        isActive,
        isPopular,
        trialDurationDays: trialDurationDays !== undefined ? trialDurationDays : undefined,
        updatedAt: new Date()
      }
    });

    // Emit real-time event to all admins
    try {
      emitToAdmins('plan:updated', { plan });
    } catch {}

    // Recalculate MRR for customers on this plan (active or trial)
    try {
      const affectedCustomers = await prisma.customers.findMany({
        where: { planId: id, status: { in: ['active', 'trial'] } },
        select: { id: true, billingCycle: true, status: true, mrr: true }
      });

      let updatedCount = 0;
      for (const c of affectedCustomers) {
        const cycle = (c.billingCycle || 'monthly').toLowerCase();
        let newMRR = 0;
        if (c.status === 'active' || c.status === 'trial') {
          if (cycle === 'annual') {
            newMRR = (plan.annualPrice ?? plan.monthlyPrice * 12) / 12;
          } else {
            newMRR = plan.monthlyPrice;
          }
        }
        // Only update if changed
        if (Math.abs((c.mrr || 0) - newMRR) > 0.0001) {
          await prisma.customers.update({
            where: { id: c.id },
            data: { mrr: newMRR, updatedAt: new Date() }
          });
          updatedCount += 1;
          // Capture snapshot for historical accuracy
          try { await captureSnapshotOnChange(c.id); } catch {}
        }
      }

      return res.json({ plan, mrrRecalculated: updatedCount });
    } catch (recalcError) {
      console.error('⚠️  Failed to recalculate MRR for customers on plan update:', recalcError);
      // Still return success for plan update, but include warning
      return res.json({ plan, mrrRecalculated: 0, warning: 'Failed to recalculate some customer MRR values' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Recalculate MRR for a specific plan's customers (manual trigger)
router.post('/:id/recalculate-mrr', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await prisma.plans.findUnique({ where: { id } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const customers = await prisma.customers.findMany({
      where: { planId: id, status: { in: ['active', 'trial'] } },
      select: { id: true, billingCycle: true, status: true, mrr: true }
    });

    let updatedCount = 0;
    for (const c of customers) {
      const cycle = (c.billingCycle || 'monthly').toLowerCase();
      let newMRR = 0;
      if (c.status === 'active' || c.status === 'trial') {
        if (cycle === 'annual') {
          newMRR = (plan.annualPrice ?? plan.monthlyPrice * 12) / 12;
        } else {
          newMRR = plan.monthlyPrice;
        }
      }
      if (Math.abs((c.mrr || 0) - newMRR) > 0.0001) {
        await prisma.customers.update({ where: { id: c.id }, data: { mrr: newMRR, updatedAt: new Date() } });
        updatedCount += 1;
        try { await captureSnapshotOnChange(c.id); } catch {}
      }
    }

    return res.json({ planId: id, mrrRecalculated: updatedCount });
  } catch (error: any) {
    console.error('Recalculate plan MRR failed:', error);
    return res.status(500).json({ error: 'Failed to recalculate MRR for plan' });
  }
});

// Delete plan
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if plan has customers
    const count = await prisma.customers.count({
      where: { planId: id }
    });

    if (count > 0) {
      return res.status(400).json({
        error: 'Cannot delete plan with active customers'
      });
    }

    await prisma.plans.delete({ where: { id } });

    // Emit real-time event to all admins
    try {
      emitToAdmins('plan:deleted', { planId: id });
    } catch {}

    return res.json({ message: 'Plan deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete plan' });
  }
});

export default router;


