import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);

// Get financial overview
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 Financial overview requested by:', req.user?.role, req.user?.email);
    const userId = req.user?.id;
    const roleRaw = req.user?.role || '';
    const normalizedRole = roleRaw.toLowerCase().replace(/[\s_-]/g, '');
    const isOwner = normalizedRole === 'owner' || normalizedRole === 'propertyowner';
    const isManager = normalizedRole === 'manager' || normalizedRole === 'propertymanager';
    const { startDate, endDate } = req.query;

    if (!isOwner && !isManager) {
      console.log('❌ Access denied for role:', roleRaw);
      return res.status(403).json({ error: 'Access denied' });
    }
    
    console.log('✅ Access granted, fetching properties for user:', userId);

    // Get properties for the user
    // NOTE: Use include with relation filters; do not mix include and select in the same query
    const properties = await prisma.properties.findMany({
      where: isOwner
        ? { ownerId: userId }
        : {
            property_managers: {
              some: {
                managerId: userId,
                isActive: true
              }
            }
          },
      include: {
        units: {
          select: {
            monthlyRent: true,
            status: true
          }
        },
        leases: {
          where: {
            status: 'active'
          },
          select: {
            monthlyRent: true,
            securityDeposit: true
          }
        }
      }
    });

    console.log(`📦 Found ${properties.length} properties for user`);
    
    // If no properties, return empty data
    if (properties.length === 0) {
      console.log('⚠️  No properties found, returning empty data');
      return res.json({
        totalRevenue: 0,
        netOperatingIncome: 0,
        portfolioCapRate: 0,
        operatingMargin: 0,
        occupancyRate: 0,
        totalProperties: 0,
        totalUnits: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        estimatedExpenses: 0,
        annualRevenue: 0,
        annualNOI: 0,
        totalPropertyValue: 0
      });
    }

    // Calculate total revenue (sum of all occupied unit rents)
    let totalRevenue = 0;
    let totalOccupiedUnits = 0;
    let totalUnits = 0;
    let totalPropertyValue = 0;

    properties.forEach(property => {
      // Handle properties without units
      if (property.units && property.units.length > 0) {
        property.units.forEach(unit => {
          totalUnits++;
          if (unit.status === 'occupied') {
            totalRevenue += unit.monthlyRent || 0;
            totalOccupiedUnits++;
          }
        });
      }

      // Use currentValue if available, otherwise purchasePrice, otherwise estimate
      if (property.currentValue) {
        totalPropertyValue += property.currentValue;
      } else if (property.purchasePrice) {
        totalPropertyValue += property.purchasePrice;
      } else if (property.units && property.units.length > 0) {
        // Fallback: estimate at 15x annual rent for this property
        const propertyRevenue = property.units
          .filter(u => u.status === 'occupied')
          .reduce((sum, u) => sum + (u.monthlyRent || 0), 0);
        totalPropertyValue += propertyRevenue * 12 * 15;
      }
    });

    // Calculate actual expenses from database
    const propertyIds = properties.map(p => p.id);
    const actualExpenses = await prisma.expenses.aggregate({
      where: {
        propertyId: { in: propertyIds },
        status: { in: ['paid', 'pending'] }, // Include paid and pending expenses
        ...(startDate && endDate ? {
          date: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        } : {})
      },
      _sum: {
        amount: true
      }
    });

    // Use actual expenses if available, otherwise estimate at 30% of revenue
    const estimatedExpenses = actualExpenses._sum.amount || (totalRevenue * 0.3);
    
    // Net Operating Income (NOI) = Revenue - Operating Expenses
    const netOperatingIncome = totalRevenue - estimatedExpenses;

    // Operating Margin = (NOI / Revenue) * 100
    const operatingMargin = totalRevenue > 0 ? (netOperatingIncome / totalRevenue) * 100 : 0;

    // Portfolio Cap Rate (based on annual NOI / actual property value)
    const annualNOI = netOperatingIncome * 12;
    const portfolioCapRate = totalPropertyValue > 0 ? (annualNOI / totalPropertyValue) * 100 : 0;

    // Occupancy rate
    const occupancyRate = totalUnits > 0 ? (totalOccupiedUnits / totalUnits) * 100 : 0;

    console.log('💰 Financial Overview Calculated:', {
      totalRevenue,
      netOperatingIncome,
      estimatedExpenses,
      portfolioCapRate,
      totalUnits,
      occupiedUnits: totalOccupiedUnits
    });

    return res.json({
      totalRevenue,
      netOperatingIncome,
      portfolioCapRate,
      operatingMargin,
      occupancyRate,
      totalProperties: properties.length,
      totalUnits,
      occupiedUnits: totalOccupiedUnits,
      vacantUnits: totalUnits - totalOccupiedUnits,
      estimatedExpenses,
      annualRevenue: totalRevenue * 12,
      annualNOI,
      totalPropertyValue
    });

  } catch (error: any) {
    console.error('❌ Get financial overview error:', error);
    console.error('❌ Error details:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch financial overview',
      details: error.message 
    });
  }
});

// Get monthly revenue data
router.get('/monthly-revenue', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { months = 12 } = req.query;

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For now, return current month data multiplied
    // In production, you'd query actual payment history
    const properties = await prisma.properties.findMany({
      where: role === 'owner' 
        ? { ownerId: userId }
        : {
            property_managers: {
              some: {
                managerId: userId,
                isActive: true
              }
            }
          },
      include: {
        units: {
          where: { status: 'occupied' },
          select: { monthlyRent: true }
        }
      }
    });

    // If no properties, return empty array
    if (properties.length === 0) {
      return res.json([]);
    }

    const currentRevenue = properties.reduce((sum, prop) => 
      sum + (prop.units || []).reduce((unitSum, unit) => unitSum + (unit.monthlyRent || 0), 0), 0
    );

    const monthlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = Number(months) - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthIndex = date.getMonth();
      
      // Add slight variation for demo purposes
      const variation = 1 + (Math.random() * 0.1 - 0.05);
      const revenue = currentRevenue * variation;
      const expenses = revenue * 0.3;
      
      monthlyData.push({
        month: monthNames[monthIndex],
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
        netIncome: Math.round(revenue - expenses)
      });
    }

    return res.json(monthlyData);

  } catch (error: any) {
    console.error('Get monthly revenue error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch monthly revenue',
      details: error.message 
    });
  }
});

// Get property performance data
router.get('/property-performance', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get properties with detailed financial data
    const properties = await prisma.properties.findMany({
      where: role === 'owner' 
        ? { ownerId: userId }
        : {
            property_managers: {
              some: {
                managerId: userId,
                isActive: true
              }
            }
          },
      include: {
        units: {
          select: {
            id: true,
            monthlyRent: true,
            status: true
          }
        },
        leases: {
          where: {
            status: 'active'
          },
          select: {
            id: true,
            monthlyRent: true
          }
        }
      }
    });

    // If no properties, return empty array
    if (properties.length === 0) {
      return res.json([]);
    }

    // Calculate performance metrics for each property
    const performanceData = properties.map(property => {
      // Calculate revenue (sum of occupied unit rents)
      const monthlyRevenue = (property.units || [])
        .filter(u => u.status === 'occupied')
        .reduce((sum, u) => sum + (u.monthlyRent || 0), 0);

      const annualRevenue = monthlyRevenue * 12;

      // Calculate expenses (30% of revenue)
      const monthlyExpenses = monthlyRevenue * 0.3;
      const annualExpenses = monthlyExpenses * 12;

      // Calculate NOI
      const monthlyNOI = monthlyRevenue - monthlyExpenses;
      const annualNOI = monthlyNOI * 12;

      // Calculate occupancy rate
      const totalUnits = (property.units || []).length;
      const occupiedUnits = (property.units || []).filter(u => u.status === 'occupied').length;
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      // Calculate Cap Rate
      let capRate = 0;
      let propertyValue = 0;
      
      if (property.currentValue) {
        propertyValue = property.currentValue;
      } else if (property.purchasePrice) {
        propertyValue = property.purchasePrice;
      } else {
        // Estimate: 15x annual rent
        propertyValue = annualRevenue * 15;
      }

      if (propertyValue > 0) {
        capRate = (annualNOI / propertyValue) * 100;
      }

      // Calculate ROI (Return on Investment)
      // ROI = (Annual NOI / Property Value) * 100
      const roi = propertyValue > 0 ? (annualNOI / propertyValue) * 100 : 0;

      // Calculate Cash Flow (NOI - debt service)
      // For now, assume no debt or use 40% of NOI as cash flow
      const cashFlow = monthlyNOI * 0.6;

      return {
        id: property.id,
        name: property.name,
        propertyType: property.propertyType,
        address: property.address,
        city: property.city,
        state: property.state,
        currency: property.currency,
        totalUnits,
        occupiedUnits,
        vacantUnits: totalUnits - occupiedUnits,
        occupancyRate,
        monthlyRevenue,
        annualRevenue,
        monthlyExpenses,
        annualExpenses,
        monthlyNOI,
        annualNOI,
        propertyValue,
        purchasePrice: property.purchasePrice,
        currentValue: property.currentValue,
        capRate,
        roi,
        cashFlow,
        avgRent: property.avgRent || 0,
        insurancePremium: property.insurancePremium || 0,
        propertyTaxes: property.propertyTaxes || 0
      };
    });

    return res.json(performanceData);

  } catch (error: any) {
    console.error('Get property performance error:', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch property performance',
      details: error.message 
    });
  }
});

export default router;

