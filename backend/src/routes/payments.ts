import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);

// Get all payments (temporary stub until payments model is added)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    console.warn('Payments model not implemented yet - returning empty list');
    return res.json([]);
  } catch (error: any) {
    console.error('Get payments error:', error);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get single payment
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    console.warn('Payments model not implemented yet - returning 404');
    return res.status(404).json({ error: 'Payment not found or access denied' });
  } catch (error: any) {
    console.error('Get payment error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create payment (record payment)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    return res.status(400).json({ error: 'Payments not implemented yet' });
  } catch (error: any) {
    console.error('Create payment error:', error);
    return res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Update payment
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    // Only managers/owners can update payments
    if (role === 'tenant') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Not implemented yet
    return res.status(400).json({ error: 'Payments not implemented yet' });

  } catch (error: any) {
    console.error('Update payment error:', error);
    return res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Get payment statistics
router.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, startDate, endDate } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    // TODO: Implement payments table in schema
    // For now, return mock data to prevent 500 errors
    console.log('⚠️ Payments not yet implemented - returning mock stats');
    return res.json({
      totalCollected: 0,
      pendingAmount: 0,
      lateFees: 0,
      byMethod: [],
      byType: [],
      recentPayments: []
    });

    /* COMMENTED OUT UNTIL SCHEMA IS UPDATED
    const where: any = {};

    if (role === 'owner') {
      where.lease = { property: { ownerId: userId } };
    } else if (role === 'manager') {
      where.lease = {
        property: {
          managers: {
            some: {
              managerId: userId,
              isActive: true
            }
          }
        }
      };
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (propertyId) {
      where.lease = { ...where.lease, propertyId };
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    // Total collected
    const totalCollected = await prisma.payment.aggregate({
      where: { ...where, status: 'completed' },
      _sum: { amount: true }
    });

    // Pending payments
    const pendingAmount = await prisma.payment.aggregate({
      where: { ...where, status: 'pending' },
      _sum: { amount: true }
    });

    // Late fees collected
    const lateFees = await prisma.payment.aggregate({
      where: { ...where, status: 'completed' },
      _sum: { lateFeesIncluded: true }
    });

    // Payment by method
    const byMethod = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: { ...where, status: 'completed' },
      _sum: { amount: true },
      _count: true
    });

    // Payment by type
    const byType = await prisma.payment.groupBy({
      by: ['type'],
      where: { ...where, status: 'completed' },
      _sum: { amount: true },
      _count: true
    });

    // Recent payments
    const recentPayments = await prisma.payment.findMany({
      where: { ...where, status: 'completed' },
      include: {
        lease: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true
              }
            },
            property: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' },
      take: 10
    });

    return res.json({
      totalCollected: totalCollected._sum.amount || 0,
      pendingAmount: pendingAmount._sum.amount || 0,
      lateFees: lateFees._sum.lateFeesIncluded || 0,
      byMethod: byMethod.map(m => ({
        method: m.paymentMethod,
        amount: m._sum.amount || 0,
        count: m._count
      })),
      byType: byType.map(t => ({
        type: t.type,
        amount: t._sum.amount || 0,
        count: t._count
      })),
      recentPayments
    });
    */

  } catch (error: any) {
    console.error('Get payment stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
});

// Get overdue payments
router.get('/overdue/list', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'property owner' && role !== 'property_owner' && role !== 'manager' && role !== 'property_manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const where: any = {
      status: 'active'
    };

    if (role === 'owner' || role === 'property owner' || role === 'property_owner') {
      where.properties = { ownerId: userId };
    } else if (role === 'manager' || role === 'property_manager') {
      where.properties = {
        property_managers: {
          some: {
            managerId: userId,
            isActive: true
          }
        }
      };
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    // Get active leases (use correct pluralized models)
    const leases = await prisma.leases.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        properties: {
          select: {
            id: true,
            name: true
          }
        },
        units: {
          select: {
            id: true,
            unitNumber: true
          }
        }
      }
    });

    // Calculate overdue
    const currentDate = new Date();
    const overdueLeases = leases.map(lease => {
      const daysSincePayment = Math.floor((currentDate.getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24));

      const isOverdue = daysSincePayment > 30; // More than 30 days

      return {
        leaseId: lease.id,
        tenant: lease.users,
        property: lease.properties,
        unit: lease.units,
        monthlyRent: lease.monthlyRent,
        lastPaymentDate: null,
        daysSincePayment,
        isOverdue,
        estimatedOverdueAmount: isOverdue ? lease.monthlyRent * Math.floor(daysSincePayment / 30) : 0
      };
    }).filter(l => l.isOverdue);

    return res.json(overdueLeases);

  } catch (error: any) {
    console.error('Get overdue payments error:', error);
    return res.status(500).json({ error: 'Failed to fetch overdue payments' });
  }
});

export default router;


