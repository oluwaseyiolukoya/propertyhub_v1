import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);

// Get all leases for user's properties
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, status, search } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    const where: any = {
      property: {
        OR: [
          { ownerId: userId },
          { managers: { some: { managerId: userId, isActive: true } } }
        ]
      }
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.tenant = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ]
      };
    }

    const leases = await prisma.lease.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true
          }
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            type: true,
            bedrooms: true,
            bathrooms: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(leases);

  } catch (error: any) {
    console.error('Get leases error:', error);
    return res.status(500).json({ error: 'Failed to fetch leases' });
  }
});

// Get single lease
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const lease = await prisma.lease.findFirst({
      where: {
        id,
        property: {
          OR: [
            { ownerId: userId },
            { managers: { some: { managerId: userId, isActive: true } } }
          ]
        }
      },
      include: {
        property: true,
        unit: true,
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found or access denied' });
    }

    return res.json(lease);

  } catch (error: any) {
    console.error('Get lease error:', error);
    return res.status(500).json({ error: 'Failed to fetch lease' });
  }
});

// Create lease (with tenant)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    const {
      propertyId,
      unitId,
      // Tenant info
      tenantName,
      tenantEmail,
      tenantPhone,
      emergencyContactName,
      emergencyContactPhone,
      // Lease info
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      currency,
      terms,
      specialClauses,
      sendInvitation
    } = req.body;

    if (!propertyId || !unitId || !tenantName || !tenantEmail || !startDate || !endDate || !monthlyRent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check property access
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          { managers: { some: { managerId: userId, isActive: true } } }
        ]
      }
    });

    if (!property) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    // Check unit availability
    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
        propertyId,
        status: { in: ['vacant', 'occupied'] }
      }
    });

    if (!unit) {
      return res.status(400).json({ error: 'Unit not available' });
    }

    // Check for overlapping leases
    const overlappingLease = await prisma.lease.findFirst({
      where: {
        unitId,
        status: 'active',
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              { endDate: { gte: new Date(startDate) } }
            ]
          },
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(endDate) } }
            ]
          }
        ]
      }
    });

    if (overlappingLease) {
      return res.status(400).json({
        error: 'Unit already has an active lease for this period'
      });
    }

    // Create or find tenant
    let tenant = await prisma.user.findFirst({
      where: {
        customerId,
        email: tenantEmail
      }
    });

    if (!tenant) {
      // Create new tenant user
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      tenant = await prisma.user.create({
        data: {
          customerId,
          name: tenantName,
          email: tenantEmail,
          password: sendInvitation ? null : hashedPassword,
          phone: tenantPhone,
          role: 'tenant',
          status: sendInvitation ? 'pending' : 'active',
          invitedAt: sendInvitation ? new Date() : null
        }
      });
    }

    // Generate lease number
    const leaseNumber = `LSE-${Date.now()}`;

    // Create lease
    const lease = await prisma.lease.create({
      data: {
        propertyId,
        unitId,
        tenantId: tenant.id,
        leaseNumber,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        monthlyRent,
        securityDeposit: securityDeposit || 0,
        currency: currency || 'NGN',
        status: 'active',
        terms,
        specialClauses,
        signedAt: new Date()
      },
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
        }
      }
    });

    // Update unit status
    await prisma.unit.update({
      where: { id: unitId },
      data: { status: 'occupied' }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'create',
        entity: 'lease',
        entityId: lease.id,
        description: `Lease ${leaseNumber} created for ${tenantName}`
      }
    });

    // TODO: Send invitation email if sendInvitation is true

    return res.status(201).json({
      lease,
      tenant,
      ...(!sendInvitation && { tempPassword: 'tenant123' })
    });

  } catch (error: any) {
    console.error('Create lease error:', error);
    return res.status(500).json({ error: 'Failed to create lease' });
  }
});

// Update lease
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check access
    const existingLease = await prisma.lease.findFirst({
      where: {
        id,
        property: {
          OR: [
            { ownerId: userId },
            { managers: { some: { managerId: userId, isActive: true } } }
          ]
        }
      },
      include: { property: true }
    });

    if (!existingLease) {
      return res.status(404).json({ error: 'Lease not found or access denied' });
    }

    const {
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      status,
      terms,
      specialClauses,
      terminationReason
    } = req.body;

    const lease = await prisma.lease.update({
      where: { id },
      data: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        monthlyRent,
        securityDeposit,
        status,
        terms,
        specialClauses,
        terminationReason,
        terminatedAt: status === 'terminated' ? new Date() : undefined
      }
    });

    // If lease is terminated, update unit status
    if (status === 'terminated' || status === 'expired') {
      await prisma.unit.update({
        where: { id: existingLease.unitId },
        data: { status: 'vacant' }
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId: existingLease.property.customerId,
        userId,
        action: 'update',
        entity: 'lease',
        entityId: lease.id,
        description: `Lease ${lease.leaseNumber} updated`
      }
    });

    return res.json(lease);

  } catch (error: any) {
    console.error('Update lease error:', error);
    return res.status(500).json({ error: 'Failed to update lease' });
  }
});

// Terminate lease
router.post('/:id/terminate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    const lease = await prisma.lease.findFirst({
      where: {
        id,
        property: {
          OR: [
            { ownerId: userId },
            { managers: { some: { managerId: userId, isActive: true } } }
          ]
        }
      },
      include: { property: true }
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found or access denied' });
    }

    const updatedLease = await prisma.lease.update({
      where: { id },
      data: {
        status: 'terminated',
        terminatedAt: new Date(),
        terminationReason: reason
      }
    });

    // Update unit status
    await prisma.unit.update({
      where: { id: lease.unitId },
      data: { status: 'vacant' }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId: lease.property.customerId,
        userId,
        action: 'terminate',
        entity: 'lease',
        entityId: lease.id,
        description: `Lease ${lease.leaseNumber} terminated`
      }
    });

    return res.json(updatedLease);

  } catch (error: any) {
    console.error('Terminate lease error:', error);
    return res.status(500).json({ error: 'Failed to terminate lease' });
  }
});

// Get tenants
router.get('/tenants/list', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status } = req.query;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    const where: any = {
      customerId,
      role: 'tenant'
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    const tenants = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        tenantLeases: {
          where: { status: 'active' },
          include: {
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
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(tenants);

  } catch (error: any) {
    console.error('Get tenants error:', error);
    return res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

export default router;


