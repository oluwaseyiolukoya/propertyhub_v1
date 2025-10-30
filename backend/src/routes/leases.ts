import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { sendTenantInvitation } from '../lib/email';

const router = express.Router();

router.use(authMiddleware);

// Get all leases for user's properties
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, status, search } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    const where: any = {
      properties: {
        OR: [
          { ownerId: userId },
          { property_managers: { some: { managerId: userId, isActive: true } } }
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

    const leases = await prisma.leases.findMany({
      where,
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            currency: true
          }
        },
        units: {
          select: {
            id: true,
            unitNumber: true,
            type: true,
            bedrooms: true,
            bathrooms: true
          }
        },
        users: {
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
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({
      error: 'Failed to fetch leases',
      details: error.message
    });
  }
});

// Get single lease
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const lease = await prisma.leases.findFirst({
      where: {
        id,
        properties: {
          OR: [
            { ownerId: userId },
            { property_managers: { some: { managerId: userId, isActive: true } } }
          ]
        }
      },
      include: {
        properties: true,
        units: true,
        users: {
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
      sendInvitation,
      // Optional: allow client to provide a temp password; fallback to server-generated
      tempPassword: clientProvidedTempPassword,
      password: clientProvidedPassword
    } = req.body;

    if (!propertyId || !unitId || !tenantName || !tenantEmail || !startDate || !endDate || !monthlyRent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check property access
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          { property_managers: { some: { managerId: userId, isActive: true } } }
        ]
      }
    });

    if (!property) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    // Check unit availability
    const unit = await prisma.units.findFirst({
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
    const overlappingLease = await prisma.leases.findFirst({
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
    let tenant = await prisma.users.findFirst({
      where: {
        customerId,
        email: tenantEmail
      }
    });

    let tempPassword: string | null = null; // Store password to return in response

    if (!tenant) {
      // Create new tenant user
      const proposed = (clientProvidedTempPassword || clientProvidedPassword);
      // Basic validation for a provided password
      const isValidProvided = typeof proposed === 'string' && proposed.length >= 8;
      tempPassword = isValidProvided
        ? proposed
        : Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      tenant = await prisma.users.create({
        data: {
          id: require('crypto').randomUUID(),
          customerId,
          name: tenantName,
          email: tenantEmail,
          password: hashedPassword, // Always set password, no invitation system for tenants
          phone: tenantPhone,
          role: 'tenant',
          status: 'active', // Always set to active so tenants can log in immediately
          isActive: true, // Explicitly set isActive to true
          invitedAt: null,
          updatedAt: new Date()
        }
      });

      console.log('✅ New tenant created with email:', tenantEmail);
      console.log('🔐 Generated password for tenant:', tempPassword);
    } else {
      console.log('ℹ️  Existing tenant found:', tenantEmail);
    }

    // Generate lease number
    const leaseNumber = `LSE-${Date.now()}`;

    // Create lease
    const lease = await prisma.leases.create({
      data: {
        id: require('crypto').randomUUID(),
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
        signedAt: new Date(),
        updatedAt: new Date()
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

    // Update unit status
    await prisma.units.update({
      where: { id: unitId },
      data: {
        status: 'occupied',
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId,
        userId,
        action: 'LEASE_CREATED',
        entity: 'Lease',
        entityId: lease.id,
        description: `Lease ${leaseNumber} created for ${tenantName}`
      }
    });

    // Send invitation email if sendInvitation is true and tenant was newly created
    if (sendInvitation && tempPassword) {
      try {
        // Get user info (owner or manager) for email
        const invitingUser = await prisma.users.findUnique({
          where: { id: userId },
          select: { name: true, role: true }
        });

        await sendTenantInvitation({
          tenantName,
          tenantEmail,
          tempPassword,
          propertyName: property.name,
          unitNumber: unit.unitNumber,
          leaseStartDate: startDate,
          ownerName: invitingUser?.role === 'owner' ? invitingUser.name : undefined,
          managerName: invitingUser?.role === 'manager' || invitingUser?.role === 'property_manager' ? invitingUser.name : undefined
        });

        console.log(`✅ Invitation email sent to ${tenantEmail}`);
      } catch (emailError: any) {
        console.error('❌ Failed to send invitation email:', emailError);
        // Don't fail the lease creation if email fails
      }
    }

    return res.status(201).json({
      lease,
      tenant,
      ...(tempPassword && { tempPassword }) // Return actual generated password if tenant was newly created
    });

  } catch (error: any) {
    console.error('Create lease error:', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({
      error: 'Failed to create lease',
      details: error.message
    });
  }
});

// Update lease
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check access
    const existingLease = await prisma.leases.findFirst({
      where: {
        id,
        properties: {
          OR: [
            { ownerId: userId },
            { property_managers: { some: { managerId: userId, isActive: true } } }
          ]
        }
      },
      include: { properties: true }
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

    const lease = await prisma.leases.update({
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
        terminatedAt: status === 'terminated' ? new Date() : undefined,
        updatedAt: new Date()
      }
    });

    // If lease is terminated, update unit status
    if (status === 'terminated' || status === 'expired') {
      await prisma.units.update({
        where: { id: existingLease.unitId },
        data: {
          status: 'vacant',
          updatedAt: new Date()
        }
      });
    }

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId: existingLease.properties.customerId,
        userId,
        action: 'LEASE_UPDATED',
        entity: 'Lease',
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

    const lease = await prisma.leases.findFirst({
      where: {
        id,
        properties: {
          OR: [
            { ownerId: userId },
            { property_managers: { some: { managerId: userId, isActive: true } } }
          ]
        }
      },
      include: { properties: true }
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found or access denied' });
    }

    const updatedLease = await prisma.leases.update({
      where: { id },
      data: {
        status: 'terminated',
        terminatedAt: new Date(),
        terminationReason: reason,
        updatedAt: new Date()
      }
    });

    // Update unit status
    await prisma.units.update({
      where: { id: lease.unitId },
      data: {
        status: 'vacant',
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId: lease.properties.customerId,
        userId,
        action: 'LEASE_TERMINATED',
        entity: 'Lease',
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

    const tenants = await prisma.users.findMany({
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


