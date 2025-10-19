import express, { Response } from 'express';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

// Get all plans
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
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
      isPopular
    } = req.body;

    if (!name || monthlyPrice === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        monthlyPrice,
        annualPrice: annualPrice || monthlyPrice * 10,
        currency: currency || 'NGN',
        propertyLimit: propertyLimit || 5,
        userLimit: userLimit || 3,
        storageLimit: storageLimit || 1000,
        features: features || [],
        isActive: isActive !== undefined ? isActive : true,
        isPopular: isPopular || false
      }
    });

    return res.status(201).json(plan);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create plan' });
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
      isPopular
    } = req.body;

    const plan = await prisma.plan.update({
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
        isPopular
      }
    });

    return res.json(plan);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Delete plan
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if plan has customers
    const count = await prisma.customer.count({
      where: { planId: id }
    });

    if (count > 0) {
      return res.status(400).json({
        error: 'Cannot delete plan with active customers'
      });
    }

    await prisma.plan.delete({ where: { id } });

    return res.json({ message: 'Plan deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete plan' });
  }
});

export default router;


