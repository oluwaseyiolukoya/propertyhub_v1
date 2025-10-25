import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { emitToAdmins, emitToCustomer } from '../lib/socket';

const router = express.Router();

router.use(authMiddleware);

// Get manager analytics data
router.get('/manager/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'manager' && role !== 'property_manager' && role !== 'owner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('📊 Fetching manager analytics for user:', userId, 'role:', role);

    // Get properties accessible to the manager/owner
    const where: any = {};
    if (role === 'owner') {
      where.ownerId = userId;
    } else if (role === 'manager' || role === 'property_manager') {
      where.property_managers = {
        some: {
          managerId: userId,
          isActive: true
        }
      };
    }

    const properties = await prisma.properties.findMany({
      where,
      select: {
        id: true,
        name: true,
        currency: true
      }
    });

    const propertyIds = properties.map(p => p.id);
    console.log(`📍 Found ${properties.length} properties for analytics`);

    if (propertyIds.length === 0) {
      return res.json({
        averageRent: 0,
        tenantRetention: 0,
        avgDaysVacant: 0,
        unitDistribution: [],
        revenueByProperty: []
      });
    }

    // 1. Calculate Average Rent across all units
    const allUnits = await prisma.units.findMany({
      where: {
        propertyId: { in: propertyIds }
      },
      select: {
        monthlyRent: true,
        bedrooms: true,
        status: true,
        propertyId: true
      }
    });

    const averageRent = allUnits.length > 0
      ? allUnits.reduce((sum, unit) => sum + unit.monthlyRent, 0) / allUnits.length
      : 0;

    console.log(`💰 Average rent calculated: ${averageRent} from ${allUnits.length} units`);

    // 2. Calculate Tenant Retention Rate
    // Retention = (number of lease renewals / total leases that ended) * 100
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const endedLeases = await prisma.leases.findMany({
      where: {
        propertyId: { in: propertyIds },
        endDate: {
          gte: oneYearAgo,
          lte: new Date()
        }
      },
      select: {
        tenantId: true,
        unitId: true,
        endDate: true
      }
    });

    // Count how many tenants renewed (stayed in the same or different unit)
    let renewedCount = 0;
    for (const lease of endedLeases) {
      // Check if tenant has a new lease after this one ended
      const renewalLease = await prisma.leases.findFirst({
        where: {
          tenantId: lease.tenantId,
          propertyId: { in: propertyIds },
          startDate: {
            gte: lease.endDate,
            lte: new Date(lease.endDate.getTime() + 60 * 24 * 60 * 60 * 1000) // Within 60 days
          }
        }
      });
      if (renewalLease) renewedCount++;
    }

    const tenantRetention = endedLeases.length > 0
      ? Math.round((renewedCount / endedLeases.length) * 100)
      : 0;

    console.log(`👥 Tenant retention: ${tenantRetention}% (${renewedCount} renewals out of ${endedLeases.length} ended leases)`);

    // 3. Calculate Average Days Vacant
    // Get all terminated leases and find the time between termination and next lease
    const terminatedLeases = await prisma.leases.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: 'terminated',
        endDate: {
          gte: oneYearAgo
        }
      },
      select: {
        unitId: true,
        endDate: true
      },
      orderBy: {
        endDate: 'asc'
      }
    });

    let totalVacantDays = 0;
    let vacancyCount = 0;

    for (const terminatedLease of terminatedLeases) {
      // Find the next lease for this unit
      const nextLease = await prisma.leases.findFirst({
        where: {
          unitId: terminatedLease.unitId,
          startDate: {
            gt: terminatedLease.endDate
          }
        },
        orderBy: {
          startDate: 'asc'
        }
      });

      if (nextLease) {
        const vacantDays = Math.ceil(
          (nextLease.startDate.getTime() - terminatedLease.endDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalVacantDays += vacantDays;
        vacancyCount++;
      }
    }

    // Also include currently vacant units
    const currentlyVacantUnits = await prisma.units.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: 'vacant'
      },
      select: {
        id: true,
        updatedAt: true
      }
    });

    // For currently vacant units, calculate days since last lease ended
    for (const unit of currentlyVacantUnits) {
      const lastLease = await prisma.leases.findFirst({
        where: {
          unitId: unit.id
        },
        orderBy: {
          endDate: 'desc'
        }
      });

      if (lastLease && lastLease.endDate) {
        const vacantDays = Math.ceil(
          (new Date().getTime() - lastLease.endDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalVacantDays += vacantDays;
        vacancyCount++;
      }
    }

    const avgDaysVacant = vacancyCount > 0
      ? Math.round(totalVacantDays / vacancyCount)
      : 0;

    console.log(`📅 Average days vacant: ${avgDaysVacant} days (from ${vacancyCount} vacancy periods)`);

    // 4. Unit Distribution by Bedroom Count
    const bedroomCounts: { [key: string]: number } = {};
    allUnits.forEach(unit => {
      const bedrooms = unit.bedrooms?.toString() || 'Studio';
      bedroomCounts[bedrooms] = (bedroomCounts[bedrooms] || 0) + 1;
    });

    const unitDistribution = Object.entries(bedroomCounts).map(([bedrooms, count]) => ({
      bedrooms,
      count,
      percentage: allUnits.length > 0 ? Math.round((count / allUnits.length) * 100) : 0
    })).sort((a, b) => {
      // Sort by bedroom count (Studio first, then numeric)
      if (a.bedrooms === 'Studio') return -1;
      if (b.bedrooms === 'Studio') return 1;
      return parseInt(a.bedrooms) - parseInt(b.bedrooms);
    });

    console.log(`🏘️ Unit distribution:`, unitDistribution);

    // 5. Revenue by Property
    const revenueByProperty = await Promise.all(
      properties.map(async (property) => {
        const occupiedUnitsForProperty = await prisma.units.findMany({
          where: {
            propertyId: property.id,
            status: 'occupied'
          },
          select: {
            monthlyRent: true
          }
        });

        const revenue = occupiedUnitsForProperty.reduce(
          (sum, unit) => sum + unit.monthlyRent,
          0
        );

        return {
          id: property.id,
          name: property.name,
          revenue,
          currency: property.currency || 'USD'
        };
      })
    );

    const totalRevenue = revenueByProperty.reduce((sum, p) => sum + p.revenue, 0);

    console.log(`✅ Analytics data compiled successfully`);

    return res.json({
      averageRent: Math.round(averageRent),
      tenantRetention,
      avgDaysVacant,
      unitDistribution,
      revenueByProperty: revenueByProperty.map(p => ({
        ...p,
        percentage: totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0
      }))
    });

  } catch (error: any) {
    console.error('❌ Error fetching manager analytics:', error);
    return res.status(500).json({
      error: 'Failed to fetch analytics',
      details: error.message
    });
  }
});

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

    // Calculate monthly revenue from occupied units
    const occupiedUnitsWithRent = await prisma.units.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: 'occupied'
      },
      select: {
        monthlyRent: true
      }
    });

    const monthlyRevenue = occupiedUnitsWithRent.reduce((sum, unit) => sum + unit.monthlyRent, 0);

    // Get maintenance tickets (support_tickets doesn't have propertyId, so we'll use 0 for now)
    // TODO: Create a dedicated maintenance_requests table with propertyId field
    const openMaintenance = 0;
    const urgentMaintenance = 0;
    const scheduledMaintenanceCount = 0;

    // Group revenue by currency for multi-currency support
    const revenueWithCurrency = await prisma.units.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: 'occupied'
      },
      select: {
        monthlyRent: true,
        properties: {
          select: {
            currency: true
          }
        }
      }
    });

    // Get manager's base currency (default to USD)
    const manager = await prisma.users.findUnique({
      where: { id: userId },
      select: { baseCurrency: true }
    });
    const managerBaseCurrency = manager?.baseCurrency || 'USD';

    // Calculate revenue per currency
    const revenueByCurrency: Record<string, number> = {};
    revenueWithCurrency.forEach(unit => {
      const currency = unit.properties.currency || managerBaseCurrency;
      if (!revenueByCurrency[currency]) {
        revenueByCurrency[currency] = 0;
      }
      revenueByCurrency[currency] += unit.monthlyRent;
    });

    // Get the primary currency (most common or first one, fallback to manager's base currency)
    const currencies = Object.keys(revenueByCurrency);
    const primaryCurrency = currencies.length > 0 ? currencies[0] : managerBaseCurrency;

    console.log('💰 Manager Dashboard Revenue:', {
      managerId: userId,
      managerBaseCurrency,
      monthlyRevenue,
      revenueByCurrency,
      currencies,
      primaryCurrency,
      hasMultipleCurrencies: currencies.length > 1
    });

    return res.json({
      properties: {
        total: properties.length,
        properties: properties.map(p => ({
          id: p.id,
          name: p.name,
          currency: p.currency || managerBaseCurrency, // Include currency for each property (defaults to manager's base currency)
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
        currentMonth: Math.round(monthlyRevenue),
        byCurrency: revenueByCurrency, // Revenue broken down by currency
        primaryCurrency: primaryCurrency, // The main currency to display
        hasMultipleCurrencies: currencies.length > 1 // Flag if manager has properties in multiple currencies
      },
      maintenance: {
        open: openMaintenance,
        urgent: urgentMaintenance
      },
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

// Get paginated activity logs for manager
router.get('/manager/activities', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    console.log('📋 Fetching manager activities:', { userId, role, page, limit });

    // Ensure user is a manager
    if (role !== 'manager' && role !== 'property_manager') {
      return res.status(403).json({ error: 'Manager access required' });
    }

    // Get manager's assigned properties
    const assignments = await prisma.property_managers.findMany({
      where: {
        managerId: userId,
        isActive: true
      },
      select: {
        propertyId: true
      }
    });

    const propertyIds = assignments.map(a => a.propertyId);

    if (propertyIds.length === 0) {
      return res.json({
        activities: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false
        }
      });
    }

    // Get property-related activity entityIds (units and leases)
    const units = await prisma.units.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true }
    });
    const unitIds = units.map(u => u.id);

    const leases = await prisma.leases.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true }
    });
    const leaseIds = leases.map(l => l.id);

    // Combine all relevant entity IDs
    const relevantEntityIds = [...propertyIds, ...unitIds, ...leaseIds];

    // Get total count
    const totalCount = await prisma.activity_logs.count({
      where: {
        entityId: { in: relevantEntityIds }
      }
    });

    // Get paginated activities
    const activities = await prisma.activity_logs.findMany({
      where: {
        entityId: { in: relevantEntityIds }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        description: true,
        createdAt: true,
        entityId: true
      }
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    console.log('✅ Fetched activities:', { 
      count: activities.length, 
      total: totalCount, 
      page, 
      totalPages,
      hasMore 
    });

    return res.json({
      activities: activities.map(a => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        description: a.description,
        createdAt: a.createdAt,
        entityId: a.entityId
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore
      }
    });

  } catch (error: any) {
    console.error('❌ Failed to fetch manager activities:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch activities',
      details: error.message 
    });
  }
});

// Get paginated activity logs for owner
router.get('/owner/activities', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    console.log('📋 Fetching owner activities:', { userId, role, page, limit });

    // Ensure user is an owner
    if (role !== 'owner' && role !== 'property owner' && role !== 'property_owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    // Get owner's properties
    const properties = await prisma.properties.findMany({
      where: {
        ownerId: userId
      },
      select: {
        id: true
      }
    });

    const propertyIds = properties.map(p => p.id);

    if (propertyIds.length === 0) {
      return res.json({
        activities: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false
        }
      });
    }

    // Get property-related activity entityIds (units and leases)
    const units = await prisma.units.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true }
    });
    const unitIds = units.map(u => u.id);

    const leases = await prisma.leases.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true }
    });
    const leaseIds = leases.map(l => l.id);

    // Combine all relevant entity IDs
    const relevantEntityIds = [...propertyIds, ...unitIds, ...leaseIds];

    // Get total count
    const totalCount = await prisma.activity_logs.count({
      where: {
        entityId: { in: relevantEntityIds }
      }
    });

    // Get paginated activities
    const activities = await prisma.activity_logs.findMany({
      where: {
        entityId: { in: relevantEntityIds }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        description: true,
        createdAt: true,
        entityId: true
      }
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    console.log('✅ Fetched activities:', { 
      count: activities.length, 
      total: totalCount, 
      page, 
      totalPages,
      hasMore 
    });

    return res.json({
      activities: activities.map(a => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        description: a.description,
        createdAt: a.createdAt,
        entityId: a.entityId
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore
      }
    });

  } catch (error: any) {
    console.error('❌ Failed to fetch owner activities:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch activities',
      details: error.message 
    });
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


