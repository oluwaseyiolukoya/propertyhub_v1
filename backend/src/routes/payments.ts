import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);

// Get all payments
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, leaseId, status, method, startDate, endDate, search } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    const where: any = {};

    // Filter by role access
    if (role === 'owner') {
      where.lease = {
        property: { ownerId: userId }
      };
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
    } else if (role === 'tenant') {
      where.lease = { tenantId: userId };
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Additional filters
    if (propertyId) {
      where.lease = { ...where.lease, propertyId };
    }

    if (leaseId) {
      where.leaseId = leaseId;
    }

    if (status) {
      where.status = status;
    }

    if (method) {
      where.paymentMethod = method;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    if (search) {
      where.OR = [
        { transactionId: { contains: search as string, mode: 'insensitive' } },
        { confirmationNumber: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        lease: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true
              }
            },
            unit: {
              select: {
                id: true,
                unitNumber: true
              }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    return res.json(payments);

  } catch (error: any) {
    console.error('Get payments error:', error);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get single payment
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const whereCondition: any = {
      id,
      OR: []
    };

    if (role === 'owner') {
      whereCondition.OR.push({ lease: { property: { ownerId: userId } } });
    } else if (role === 'manager') {
      whereCondition.OR.push({
        lease: {
          property: {
            managers: {
              some: {
                managerId: userId,
                isActive: true
              }
            }
          }
        }
      });
    } else if (role === 'tenant') {
      whereCondition.OR.push({ lease: { tenantId: userId } });
    }

    const payment = await prisma.payment.findFirst({
      where: whereCondition,
      include: {
        lease: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            property: true,
            unit: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found or access denied' });
    }

    return res.json(payment);

  } catch (error: any) {
    console.error('Get payment error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create payment (record payment)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    const {
      leaseId,
      amount,
      paymentMethod,
      paymentDate,
      type,
      notes,
      confirmationNumber,
      lateFeesIncluded
    } = req.body;

    if (!leaseId || !amount || !paymentMethod || !paymentDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify access to lease
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        OR: [
          { property: { ownerId: userId } },
          {
            property: {
              managers: {
                some: {
                  managerId: userId,
                  isActive: true
                }
              }
            }
          },
          { tenantId: userId }
        ]
      },
      include: {
        property: true,
        tenant: true
      }
    });

    if (!lease) {
      return res.status(403).json({ error: 'Lease not found or access denied' });
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        leaseId,
        amount,
        paymentMethod,
        paymentDate: new Date(paymentDate),
        type: type || 'rent',
        status: 'completed',
        transactionId,
        confirmationNumber,
        lateFeesIncluded: lateFeesIncluded || 0,
        notes,
        processedById: userId
      },
      include: {
        lease: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true
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
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'create',
        entity: 'payment',
        entityId: payment.id,
        description: `Payment of ${amount} recorded for ${lease.tenant.name}`
      }
    });

    return res.status(201).json(payment);

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

    // Check access
    const existing = await prisma.payment.findFirst({
      where: {
        id,
        lease: {
          property: {
            OR: [
              { ownerId: userId },
              {
                managers: {
                  some: {
                    managerId: userId,
                    isActive: true
                  }
                }
              }
            ]
          }
        }
      },
      include: { lease: { include: { property: true } } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Payment not found or access denied' });
    }

    const {
      status,
      notes,
      confirmationNumber
    } = req.body;

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        notes,
        confirmationNumber
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'update',
        entity: 'payment',
        entityId: payment.id,
        description: `Payment ${payment.transactionId} updated`
      }
    });

    return res.json(payment);

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

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const where: any = {
      status: 'active'
    };

    if (role === 'owner') {
      where.property = { ownerId: userId };
    } else if (role === 'manager') {
      where.property = {
        managers: {
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

    // Get active leases
    const leases = await prisma.lease.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        property: {
          select: {
            id: true,
            name: true
          }
        },
        unit: {
          select: {
            id: true,
            unitNumber: true
          }
        },
        payments: {
          where: {
            status: 'completed'
          },
          orderBy: { paymentDate: 'desc' },
          take: 1
        }
      }
    });

    // Calculate overdue
    const currentDate = new Date();
    const overdueLeases = leases.map(lease => {
      const lastPayment = lease.payments[0];
      const daysSincePayment = lastPayment
        ? Math.floor((currentDate.getTime() - new Date(lastPayment.paymentDate).getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((currentDate.getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24));

      const isOverdue = daysSincePayment > 30; // More than 30 days

      return {
        leaseId: lease.id,
        tenant: lease.tenant,
        property: lease.property,
        unit: lease.unit,
        monthlyRent: lease.monthlyRent,
        lastPaymentDate: lastPayment?.paymentDate || null,
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


