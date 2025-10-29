import express, { Response } from 'express';
import { randomUUID } from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);

// Get all units across user's accessible properties
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const roleRaw = req.user?.role || '';
    const role = roleRaw.toLowerCase();
    const isOwner = ['owner', 'property_owner', 'property owner'].includes(role);
    const isManager = ['manager', 'property_manager', 'property manager'].includes(role);
    const { status, type, propertyId } = req.query as { status?: string; type?: string; propertyId?: string };

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // Scope by access - need to filter via property relation
    let accessiblePropertyIds: string[] = [];

    if (isOwner) {
      const props = await prisma.properties.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
      accessiblePropertyIds = props.map(p => p.id);
    } else if (isManager) {
      const props = await prisma.properties.findMany({
        where: {
          property_managers: {
            some: {
              managerId: userId,
              isActive: true
            }
          }
        },
        select: { id: true }
      });
      accessiblePropertyIds = props.map(p => p.id);
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (accessiblePropertyIds.length === 0) {
      return res.json([]);
    }

    // If specific propertyId requested, ensure it's in accessible list
    if (propertyId) {
      if (accessiblePropertyIds.includes(propertyId)) {
        where.propertyId = propertyId;
      } else {
        return res.status(403).json({ error: 'Access denied to this property' });
      }
    } else {
      where.propertyId = { in: accessiblePropertyIds };
    }

    // For managers, enforce owner-level view permission
    if (isManager) {
      try {
        // Find any accessible property to derive customerId (portfolio-level permission)
        const anyProperty = await prisma.properties.findFirst({
          where: { id: { in: accessiblePropertyIds } },
          select: { customerId: true }
        });

        if (anyProperty?.customerId) {
          const owner = await prisma.users.findFirst({
            where: { customerId: anyProperty.customerId, role: { in: ['owner', 'property_owner', 'property owner'] } },
            select: { permissions: true }
          });
          const ownerPerms = (owner?.permissions || {}) as any;
          if (ownerPerms.managerCanViewUnits === false) {
            return res.status(403).json({ error: 'Access denied. Manager cannot view units.' });
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not verify owner permissions for manager unit list:', (e as any)?.message || e);
      }
    }

    const units = await prisma.units.findMany({
      where,
      include: {
        leases: {
          where: { status: 'active' },
          include: {
            users: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        },
        properties: {
          select: { id: true, name: true, address: true, city: true, state: true }
        }
      },
      orderBy: { unitNumber: 'asc' }
    });

    return res.json(units);
  } catch (error: any) {
    console.error('List units error:', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({
      error: 'Failed to fetch units',
      details: error.message
    });
  }
});

// Get all units for a property
router.get('/property/:propertyId', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { status, type } = req.query;
    const userId = req.user?.id;
    const roleRaw = req.user?.role || '';
    const role = roleRaw.toLowerCase();
    const isManager = ['manager', 'property_manager', 'property manager'].includes(role);

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
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    const where: any = { propertyId };
    if (status) where.status = status;
    if (type) where.type = type;

    // For managers, enforce view permission for this property's owner
    if (isManager) {
      try {
        const owner = await prisma.users.findFirst({
          where: { customerId: property.customerId as any, role: { in: ['owner', 'property_owner', 'property owner'] } },
          select: { permissions: true }
        });
        const ownerPerms = (owner?.permissions || {}) as any;
        if (ownerPerms.managerCanViewUnits === false) {
          return res.status(403).json({ error: 'Access denied. Manager cannot view units.' });
        }
      } catch (e) {
        console.warn('⚠️ Could not verify owner permissions for manager unit list (by property):', (e as any)?.message || e);
      }
    }

    const units = await prisma.units.findMany({
      where,
      include: {
        leases: {
          where: { status: 'active' },
          include: {
            users: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        }
      },
      orderBy: { unitNumber: 'asc' }
    });

    return res.json(units);

  } catch (error: any) {
    console.error('Get units error:', error);
    return res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// Get single unit
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const roleRaw = req.user?.role || '';
    const role = roleRaw.toLowerCase();
    const isManager = ['manager', 'property_manager', 'property manager'].includes(role);

    const unit = await prisma.units.findFirst({
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
        properties: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            currency: true,
            securityDeposit: true,
            serviceCharge: true,
            cautionFee: true,
            legalFee: true,
            agentCommission: true,
            agreementFee: true,
            applicationFee: true
          }
        },
        leases: {
          include: {
            users: {
              select: { id: true, name: true, email: true, phone: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found or access denied' });
    }

    // For managers, enforce view permission for this property's owner
    if (isManager) {
      try {
        const owner = await prisma.users.findFirst({
          where: { customerId: (unit as any).properties.customerId, role: { in: ['owner', 'property_owner', 'property owner'] } },
          select: { permissions: true }
        });
        const ownerPerms = (owner?.permissions || {}) as any;
        if (ownerPerms.managerCanViewUnits === false) {
          return res.status(403).json({ error: 'Access denied. Manager cannot view units.' });
        }
      } catch (e) {
        console.warn('⚠️ Could not verify owner permissions for manager view unit:', (e as any)?.message || e);
      }
    }

    return res.json(unit);

  } catch (error: any) {
    console.error('Get unit error:', error);
    return res.status(500).json({ error: 'Failed to fetch unit' });
  }
});

// Create unit
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const roleRaw = req.user?.role || '';
    const role = roleRaw.toLowerCase();
    const isManager = ['manager', 'property_manager', 'property manager'].includes(role);

    const {
      propertyId,
      unitNumber,
      type,
      floor,
      bedrooms,
      bathrooms,
      size,
      monthlyRent,
      securityDeposit,
      status,
      features,
      images
    } = req.body;

    if (!propertyId || !unitNumber || !type || !monthlyRent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check property ownership
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

    // If manager, enforce owner-level permission: managerCanCreateUnits
    if (isManager) {
      try {
        // property is already fetched above and verified accessible
        const owner = await prisma.users.findFirst({
          where: {
            customerId: (property as any).customerId,
            role: { in: ['owner', 'property_owner', 'property owner'] }
          },
          select: { permissions: true }
        });

        const ownerPerms = (owner?.permissions || {}) as any;
        if (ownerPerms.managerCanCreateUnits === false) {
          return res.status(403).json({ error: 'Access denied. Manager cannot create units.' });
        }
      } catch (e) {
        console.warn('⚠️ Could not verify owner permissions for manager unit creation:', (e as any)?.message || e);
      }
    }

    // Check if unit number already exists
    const existingUnit = await prisma.units.findFirst({
      where: {
        propertyId,
        unitNumber
      }
    });

    if (existingUnit) {
      return res.status(400).json({ error: 'Unit number already exists for this property' });
    }

    const unit = await prisma.units.create({
      data: {
        id: randomUUID(),
        propertyId,
        unitNumber,
        type,
        floor,
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        size,
        monthlyRent,
        securityDeposit,
        status: status || 'vacant',
        features,
        images,
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId: property.customerId,
        userId,
        action: 'create',
        entity: 'unit',
        entityId: unit.id,
        description: `Unit ${unitNumber} created in ${property.name}`
      }
    });

    return res.status(201).json(unit);

  } catch (error: any) {
    console.error('Create unit error:', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({
      error: 'Failed to create unit',
      details: error.message
    });
  }
});

// Update unit
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const roleRaw = req.user?.role || '';
    const role = roleRaw.toLowerCase();
    const isManager = ['manager', 'property_manager', 'property manager'].includes(role);

    // Check access
    const existingUnit = await prisma.units.findFirst({
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

    if (!existingUnit) {
      return res.status(404).json({ error: 'Unit not found or access denied' });
    }

    const {
      unitNumber,
      type,
      floor,
      bedrooms,
      bathrooms,
      size,
      monthlyRent,
      securityDeposit,
      status,
      features,
      images
    } = req.body;

    // If manager, enforce edit permission
    if (isManager) {
      try {
        const owner = await prisma.users.findFirst({
          where: { customerId: (existingUnit as any).properties.customerId, role: { in: ['owner', 'property_owner', 'property owner'] } },
          select: { permissions: true }
        });
        const ownerPerms = (owner?.permissions || {}) as any;
        if (ownerPerms.managerCanEditUnits === false) {
          return res.status(403).json({ error: 'Access denied. Manager cannot edit units.' });
        }
      } catch (e) {
        console.warn('⚠️ Could not verify owner permissions for manager edit unit:', (e as any)?.message || e);
      }
    }

    const unit = await prisma.units.update({
      where: { id },
      data: {
        unitNumber,
        type,
        floor,
        bedrooms,
        bathrooms,
        size,
        monthlyRent,
        securityDeposit,
        status,
        features,
        images,
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId: (existingUnit as any).properties.customerId,
        userId,
        action: 'update',
        entity: 'unit',
        entityId: unit.id,
        description: `Unit ${unitNumber} updated`
      }
    });

    return res.json(unit);

  } catch (error: any) {
    console.error('Update unit error:', error);
    return res.status(500).json({ error: 'Failed to update unit' });
  }
});

// Delete unit
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const roleRaw = req.user?.role || '';
    const role = roleRaw.toLowerCase();
    const isOwner = ['owner', 'property_owner', 'property owner'].includes(role);
    const isManager = ['manager', 'property_manager', 'property manager'].includes(role);

    const unit: any = await prisma.units.findFirst({
      where: {
        id,
        // Access validated below per role; fetch with property
        properties: {}
      },
      include: { properties: true }
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found or access denied' });
    }

    // Role-based authorization
    if (isOwner) {
      if (unit.properties.ownerId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (isManager) {
      // Ensure manager assigned to this property and has permission
      const assignment = await prisma.property_managers.findFirst({
        where: { propertyId: unit.properties.id, managerId: userId, isActive: true }
      });
      if (!assignment) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const owner = await prisma.users.findFirst({
        where: { customerId: unit.properties.customerId, role: { in: ['owner', 'property_owner', 'property owner'] } },
        select: { permissions: true }
      });
      const ownerPerms = (owner?.permissions || {}) as any;
      if (ownerPerms.managerCanDeleteUnits === false) {
        return res.status(403).json({ error: 'Access denied. Manager cannot delete units.' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check for active leases before deletion
    const activeLeases = await prisma.leases.count({
      where: {
        unitId: id,
        status: 'active'
      }
    });

    if (activeLeases > 0) {
      return res.status(400).json({
        error: 'Cannot delete unit with active leases. Please terminate or move active leases first.'
      });
    }

    // Delete the unit (historical lease records will have unitId set to null)
    await prisma.units.delete({ where: { id } });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId: unit.properties.customerId,
        userId,
        action: 'delete',
        entity: 'unit',
        entityId: id,
        description: `Unit ${unit.unitNumber} deleted`
      }
    });

    return res.json({ message: 'Unit deleted successfully' });

  } catch (error: any) {
    console.error('Delete unit error:', error);
    return res.status(500).json({ error: 'Failed to delete unit' });
  }
});

export default router;


