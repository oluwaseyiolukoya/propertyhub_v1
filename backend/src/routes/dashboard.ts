import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { emitToAdmins, emitToCustomer } from '../lib/socket';

const router = express.Router();

router.use(authMiddleware);

// Get manager dashboard overview
router.get('/manager/overview', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'manager' && role !== 'owner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const where: any = {};

    if (role === 'owner') {
      where.ownerId = userId;
    } else if (role === 'manager') {
      where.property_managers = {
        some: {
          managerId: userId,
          isActive: true
        }
      };
    }

    if (propertyId) {
      where.id = propertyId;
    }

    // Get properties
    const properties = await prisma.properties.findMany({
      where,
      include: {
        _count: {
          select: {
            units: true,
            leases: true
          }
        }
      }
    });

    const propertyIds = properties.map(p => p.id);

    // Get total units and occupancy
    const [totalUnits, occupiedUnits, vacantUnits] = await Promise.all([
      prisma.units.count({ where: { propertyId: { in: propertyIds } } }),
      prisma.units.count({ where: { propertyId: { in: propertyIds }, status: 'occupied' } }),
      prisma.units.count({ where: { propertyId: { in: propertyIds }, status: 'vacant' } })
    ]);

    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Get active leases
    const activeLeases = await prisma.leases.count({
      where: {
        propertyId: { in: propertyIds },
        status: 'active'
      }
    });

    // Get expiring leases (next 30 days)
    const expiringLeases = await prisma.leases.count({
      where: {
        propertyId: { in: propertyIds },
        status: 'active',
        endDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date()
        }
      }
    });

    // TODO: payments and maintenance_requests tables don't exist yet
    // These will be added in future migrations
    const monthlyRevenue = { _sum: { amount: 0 } };
    const openMaintenance = 0;
    const urgentMaintenance = 0;
    const recentActivities: any[] = [];
    const scheduledMaintenanceCount = 0;

    return res.json({
      properties: {
        total: properties.length,
        properties: properties.map(p => ({
          id: p.id,
          name: p.name,
          totalUnits: p._count.units,
          activeLeases: p._count.leases
        }))
      },
      units: {
        total: totalUnits,
        occupied: occupiedUnits,
        vacant: vacantUnits,
        occupancyRate: Math.round(occupancyRate * 10) / 10
      },
      leases: {
        active: activeLeases,
        expiringSoon: expiringLeases
      },
      revenue: {
        currentMonth: monthlyRevenue._sum.amount || 0
      },
      maintenance: {
        open: openMaintenance,
        urgent: urgentMaintenance
      },
      recentActivities,
      upcomingTasks: {
        leaseRenewals: expiringLeases,
        scheduledMaintenance: scheduledMaintenanceCount
      }
    });

  } catch (error: any) {
    console.error('❌ Get manager dashboard overview error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return res.status(500).json({ 
      error: 'Failed to fetch dashboard overview',
      details: error.message 
    });
  }
});

// Get property performance metrics
router.get('/manager/property-performance', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, period = '30' } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'manager' && role !== 'owner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Verify access
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId as string,
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
      },
      include: {
        _count: {
          select: {
            units: true,
            leases: true
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    const daysAgo = parseInt(period as string);
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Get revenue over time
    const payments = await prisma.payment.findMany({
      where: {
        lease: { propertyId: propertyId as string },
        status: 'completed',
        paymentDate: { gte: startDate }
      },
      select: {
        amount: true,
        paymentDate: true
      },
      orderBy: { paymentDate: 'asc' }
    });

    // Get maintenance requests over time
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: {
        propertyId: propertyId as string,
        createdAt: { gte: startDate }
      },
      select: {
        status: true,
        priority: true,
        createdAt: true
      }
    });

    // Get occupancy trend
    const units = await prisma.unit.findMany({
      where: { propertyId: propertyId as string },
      select: {
        status: true
      }
    });

    const occupied = units.filter(u => u.status === 'occupied').length;
    const occupancyRate = units.length > 0 ? (occupied / units.length) * 100 : 0;

    return res.json({
      property: {
        id: property.id,
        name: property.name,
        totalUnits: property._count.units,
        activeLeases: property._count.leases
      },
      revenue: {
        total: payments.reduce((sum, p) => sum + p.amount, 0),
        payments: payments.map(p => ({
          amount: p.amount,
          date: p.paymentDate
        }))
      },
      maintenance: {
        total: maintenanceRequests.length,
        byStatus: {
          open: maintenanceRequests.filter(m => m.status === 'open').length,
          inProgress: maintenanceRequests.filter(m => m.status === 'in_progress').length,
          completed: maintenanceRequests.filter(m => m.status === 'completed').length
        },
        byPriority: {
          urgent: maintenanceRequests.filter(m => m.priority === 'urgent').length,
          high: maintenanceRequests.filter(m => m.priority === 'high').length,
          medium: maintenanceRequests.filter(m => m.priority === 'medium').length,
          low: maintenanceRequests.filter(m => m.priority === 'low').length
        }
      },
      occupancy: {
        rate: Math.round(occupancyRate * 10) / 10,
        occupied,
        total: units.length,
        vacant: units.length - occupied
      }
    });

  } catch (error: any) {
    console.error('Get property performance error:', error);
    return res.status(500).json({ error: 'Failed to fetch property performance' });
  }
});

// Get owner dashboard overview
router.get('/owner/overview', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Try database first
    try {
      // Get all properties
      const properties = await prisma.properties.findMany({
        where: { ownerId: userId },
        include: {
          _count: {
            select: {
              units: true,
              leases: true
            }
          }
        }
      });

      const propertyIds = properties.map(p => p.id);

      // Portfolio value (not modeled) → 0 for now
      const portfolioValue = 0;

      // Total units and occupancy
      const [totalUnits, occupiedUnits] = await Promise.all([
        prisma.units.count({ where: { propertyId: { in: propertyIds } } }),
        prisma.units.count({ where: { propertyId: { in: propertyIds }, status: 'occupied' } })
      ]);

      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      // Monthly revenue from occupied units' monthlyRent
      const monthlyIncome = await prisma.units.aggregate({
        where: { propertyId: { in: propertyIds }, status: 'occupied' },
        _sum: { monthlyRent: true }
      });

      // Active managers via property_managers
      const activeManagers = await prisma.property_managers.count({
        where: { propertyId: { in: propertyIds }, isActive: true }
      });

      // Pending maintenance not modeled → 0
      const pendingMaintenance = 0;

      // Expiring leases (next 60 days)
      const expiringLeases = await prisma.leases.count({
        where: {
          propertyId: { in: propertyIds },
          status: 'active',
          endDate: { lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), gte: new Date() }
        }
      });

    return res.json({
      portfolio: {
        totalProperties: properties.length,
        totalValue: portfolioValue,
        totalUnits,
        occupiedUnits,
        occupancyRate: Math.round(occupancyRate * 10) / 10
      },
      revenue: {
        currentMonth: monthlyIncome._sum.monthlyRent || 0
      },
      collection: await (async () => {
        // Approximate collection rate from units rent: occupied vs all
        const [collectedUnits, allUnits] = await Promise.all([
          prisma.units.aggregate({
            where: { propertyId: { in: propertyIds }, status: 'occupied' },
            _sum: { monthlyRent: true }
          }),
          prisma.units.aggregate({
            where: { propertyId: { in: propertyIds } },
            _sum: { monthlyRent: true }
          })
        ]);
        const collectedAmt = collectedUnits._sum.monthlyRent || 0;
        const expectedAmt = allUnits._sum.monthlyRent || 0;
        const rate = expectedAmt > 0 ? (collectedAmt / expectedAmt) * 100 : 0;
        return { collected: collectedAmt, expected: expectedAmt, rate: Math.round(rate * 10) / 10 };
      })(),
      recentActivity: await (async () => {
        // Pull last 10 activities for this owner's properties
        const logs = await prisma.activity_logs.findMany({
          where: {
            OR: [
              { entity: 'property', entityId: { in: propertyIds } },
              { entity: 'unit' },
              { entity: 'lease' },
              { entity: 'maintenance_request' },
              { entity: 'payment' }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
        return logs;
      })(),
      operations: {
        activeManagers,
        pendingMaintenance,
        expiringLeases
      },
      properties: properties.map(p => ({
        id: p.id,
        name: p.name,
        value: 0,
        units: p._count.units,
        activeLeases: p._count.leases
      }))
    });
    } catch (dbError) {
      // Database not available
      return res.status(500).json({ error: 'Failed to fetch dashboard overview' });
    }

  } catch (error: any) {
    console.error('Get owner dashboard overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

export default router;

// Owner: Cancel subscription (best-practice: owner-scoped endpoint)
router.post('/owner/subscription/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = (req.user?.role || '').toLowerCase();

    if (role !== 'owner' && role !== 'property owner' && role !== 'property_owner') {
      return res.status(403).json({ error: 'Access denied. Owner only.' });
    }

    // Resolve owner's customerId
    const user = await prisma.user.findUnique({ where: { id: userId || '' } });
    if (!user || !user.customerId) {
      return res.status(404).json({ error: 'Owner account not linked to a customer' });
    }

    // Update customer status to cancelled
    const customer = await prisma.customer.update({
      where: { id: user.customerId },
      data: { status: 'cancelled' }
    });

    // Emit realtime updates
    try { emitToAdmins('customer:updated', { customer }); } catch {}
    try { emitToCustomer(customer.id, 'account:updated', { customer }); } catch {}

    return res.json({ message: 'Subscription cancelled', customer });
  } catch (error: any) {
    console.error('Owner cancel subscription error:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});


