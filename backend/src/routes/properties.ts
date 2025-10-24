import express, { Response } from 'express';
import { randomUUID } from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);


// Get all properties for current user (owner or manager)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, propertyType } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Try database first
    try {
      const where: any = {};

      // Filter by owner or assigned manager
      if (role === 'owner') {
        where.ownerId = userId;
      } else if (role === 'manager') {
        where.property_managers = {
          some: {
            managerId: userId,
            isActive: true
          }
        };
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Additional filters
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { address: { contains: search as string, mode: 'insensitive' } },
          { city: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (propertyType) {
        where.propertyType = propertyType;
      }

      const properties = await prisma.properties.findMany({
      where,
      include: {
        _count: {
          select: {
            units: true,
            leases: true
          }
        },
        property_managers: {
          where: { isActive: true },
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add computed fields
    const propertiesWithStats = await Promise.all(
      properties.map(async (property) => {
        // Get occupied units count
        const occupiedUnits = await prisma.units.count({
          where: {
            propertyId: property.id,
            status: 'occupied'
          }
        });

        // Get total monthly rent
        const totalRent = await prisma.units.aggregate({
          where: {
            propertyId: property.id,
            status: 'occupied'
          },
          _sum: {
            monthlyRent: true
          }
        });

        return {
          ...property,
          occupiedUnits,
          occupancyRate: property._count.units > 0 
            ? (occupiedUnits / property._count.units) * 100 
            : 0,
          totalMonthlyIncome: totalRent._sum.monthlyRent || 0
        };
      })
    );

      return res.json(propertiesWithStats);
    } catch (dbError) {
      // Database not available
      return res.status(500).json({ error: 'Failed to fetch properties' });
    }

  } catch (error: any) {
    console.error('Get properties error:', error);
    return res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get single property
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    // Check access
    const property = await prisma.properties.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          {
            property_managers: {
              some: {
                managerId: userId,
                isActive: true
              }
            }
          }
        ]
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        units: {
          include: {
            leases: {
              where: { status: 'active' },
              include: {
                users: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        property_managers: {
          where: { isActive: true },
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        leases: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            units: {
              select: {
                id: true,
                unitNumber: true
              }
            }
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    // Get statistics
    const stats = {
      totalUnits: property.units.length,
      occupiedUnits: property.units.filter(u => u.status === 'occupied').length,
      vacantUnits: property.units.filter(u => u.status === 'vacant').length,
      maintenanceUnits: property.units.filter(u => u.status === 'maintenance').length,
      totalMonthlyRent: property.units
        .filter(u => u.status === 'occupied')
        .reduce((sum, u) => sum + u.monthlyRent, 0),
      activeLeases: property.leases.filter(l => l.status === 'active').length
    };

    return res.json({
      ...property,
      stats
    });

  } catch (error: any) {
    console.error('Get property error:', error);
    return res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Create property (owner only)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only property owners can create properties' });
    }

    const {
      name,
      propertyType,
      address,
      city,
      state,
      postalCode,
      country,
      yearBuilt,
      totalUnits,
      floors,
      totalArea,
      lotSize,
      parking,
      currency,
      avgRent,
      securityDeposit,
      applicationFee,
      cautionFee,
      legalFee,
      agentCommission,
      serviceCharge,
      agreementFee,
      features,
      unitFeatures,
      insuranceProvider,
      insurancePolicyNumber,
      insurancePremium,
      insuranceExpiration,
      propertyTaxes,
      coverImage,
      images,
      description,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !propertyType || !address || !city || !state || !totalUnits) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check customer's property limit
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      include: {
        _count: {
          select: { properties: true }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer._count.properties >= customer.propertyLimit) {
      return res.status(400).json({
        error: `Property limit reached. Your plan allows ${customer.propertyLimit} properties.`
      });
    }

    const property = await prisma.properties.create({
      data: {
        id: randomUUID(),
        customerId,
        ownerId: userId,
        name,
        propertyType,
        address,
        city,
        state,
        postalCode,
        country: country || 'Nigeria',
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
        totalUnits: parseInt(totalUnits),
        floors: floors ? parseInt(floors) : null,
        totalArea: totalArea ? parseFloat(totalArea) : null,
        lotSize: lotSize ? parseFloat(lotSize) : null,
        parking: parking ? parseInt(parking) : null,
        currency: currency || 'NGN',
        avgRent: avgRent ? parseFloat(avgRent) : null,
        securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null,
        applicationFee: applicationFee ? parseFloat(applicationFee) : null,
        cautionFee: cautionFee ? parseFloat(cautionFee) : null,
        legalFee: legalFee ? parseFloat(legalFee) : null,
        agentCommission: agentCommission ? parseFloat(agentCommission) : null,
        serviceCharge: serviceCharge ? parseFloat(serviceCharge) : null,
        agreementFee: agreementFee ? parseFloat(agreementFee) : null,
        features: features || [],
        unitFeatures: unitFeatures || [],
        insuranceProvider: insuranceProvider || null,
        insurancePolicyNumber: insurancePolicyNumber || null,
        insurancePremium: insurancePremium ? parseFloat(insurancePremium) : null,
        insuranceExpiration: insuranceExpiration ? new Date(insuranceExpiration) : null,
        propertyTaxes: propertyTaxes ? parseFloat(propertyTaxes) : null,
        coverImage: coverImage || null,
        images: images || [],
        description: description || null,
        notes: notes || null,
        status: 'active',
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: randomUUID(),
        customerId,
        userId,
        action: 'create',
        entity: 'property',
        entityId: property.id,
        description: `Property ${name} created`
      }
    });

    return res.status(201).json(property);

  } catch (error: any) {
    console.error('Create property error:', error);
    console.error('Error details:', error.message);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    return res.status(500).json({ 
      error: 'Failed to create property',
      details: error.message 
    });
  }
});

// Update property
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    // Check ownership
    const existingProperty = await prisma.properties.findFirst({
      where: {
        id,
        ownerId: userId
      }
    });

    if (!existingProperty && role !== 'owner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      name,
      propertyType,
      address,
      city,
      state,
      postalCode,
      country,
      yearBuilt,
      totalUnits,
      floors,
      totalArea,
      lotSize,
      parking,
      currency,
      avgRent,
      securityDeposit,
      applicationFee,
      cautionFee,
      legalFee,
      agentCommission,
      serviceCharge,
      agreementFee,
      status,
      features,
      unitFeatures,
      insuranceProvider,
      insurancePolicyNumber,
      insurancePremium,
      insuranceExpiration,
      propertyTaxes,
      coverImage,
      images,
      description,
      notes
    } = req.body;

    const property = await prisma.properties.update({
      where: { id },
      data: {
        name,
        propertyType,
        address,
        city,
        state,
        postalCode,
        country,
        yearBuilt,
        totalUnits,
        floors,
        totalArea,
        lotSize,
        parking,
        currency,
        avgRent,
        securityDeposit,
        applicationFee,
        cautionFee,
        legalFee,
        agentCommission,
        serviceCharge,
        agreementFee,
        status,
        features,
        unitFeatures,
        insuranceProvider,
        insurancePolicyNumber,
        insurancePremium,
        insuranceExpiration: insuranceExpiration ? new Date(insuranceExpiration) : undefined,
        propertyTaxes,
        coverImage,
        images,
        description,
        notes
      }
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: randomUUID(),
        customerId: property.customerId,
        userId,
        action: 'update',
        entity: 'property',
        entityId: property.id,
        description: `Property ${name} updated`
      }
    });

    return res.json(property);

  } catch (error: any) {
    console.error('Update property error:', error);
    return res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property (owner only)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only property owners can delete properties' });
    }

    const property = await prisma.properties.findFirst({
      where: {
        id,
        ownerId: userId
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    // Check for active leases
    const activeLeases = await prisma.leases.count({
      where: {
        propertyId: id,
        status: 'active'
      }
    });

    if (activeLeases > 0) {
      return res.status(400).json({
        error: 'Cannot delete property with active leases'
      });
    }

    await prisma.properties.delete({ where: { id } });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: randomUUID(),
        customerId: property.customerId,
        userId,
        action: 'delete',
        entity: 'property',
        entityId: id,
        description: `Property ${property.name} deleted`
      }
    });

    return res.json({ message: 'Property deleted successfully' });

  } catch (error: any) {
    console.error('Delete property error:', error);
    return res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Get property analytics
router.get('/:id/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check access
    const property = await prisma.property.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { managers: { some: { managerId: userId, isActive: true } } }
        ]
      },
      include: {
        units: true,
        leases: true
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    // Calculate analytics
    const totalUnits = property.units.length;
    const occupiedUnits = property.units.filter(u => u.status === 'occupied').length;
    const vacantUnits = property.units.filter(u => u.status === 'vacant').length;
    
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    
    const potentialMonthlyIncome = property.units.reduce((sum, u) => sum + u.monthlyRent, 0);
    const actualMonthlyIncome = property.units
      .filter(u => u.status === 'occupied')
      .reduce((sum, u) => sum + u.monthlyRent, 0);
    
    const activeLeases = property.leases.filter(l => l.status === 'active').length;
    const expiringLeases = property.leases.filter(l => {
      const endDate = new Date(l.endDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return l.status === 'active' && endDate <= thirtyDaysFromNow;
    }).length;

    return res.json({
      overview: {
        totalUnits,
        occupiedUnits,
        vacantUnits,
        occupancyRate,
        potentialMonthlyIncome,
        actualMonthlyIncome,
        lossFromVacancy: potentialMonthlyIncome - actualMonthlyIncome
      },
      leases: {
        active: activeLeases,
        expiringSoon: expiringLeases
      },
      performance: {
        revenueEfficiency: potentialMonthlyIncome > 0 
          ? (actualMonthlyIncome / potentialMonthlyIncome) * 100 
          : 0
      }
    });

  } catch (error: any) {
    console.error('Get property analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;


