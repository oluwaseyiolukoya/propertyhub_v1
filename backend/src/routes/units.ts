import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);

// Get all units for a property
router.get('/property/:propertyId', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { status, type } = req.query;
    const userId = req.user?.id;

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
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    const where: any = { propertyId };
    if (status) where.status = status;
    if (type) where.type = type;

    const units = await prisma.unit.findMany({
      where,
      include: {
        leases: {
          where: { status: 'active' },
          include: {
            tenant: {
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

    const unit = await prisma.unit.findFirst({
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
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true
          }
        },
        leases: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found or access denied' });
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
    const role = req.user?.role;

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

    // Check if unit number already exists
    const existingUnit = await prisma.unit.findFirst({
      where: {
        propertyId,
        unitNumber
      }
    });

    if (existingUnit) {
      return res.status(400).json({ error: 'Unit number already exists for this property' });
    }

    const unit = await prisma.unit.create({
      data: {
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
        images
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
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
    return res.status(500).json({ error: 'Failed to create unit' });
  }
});

// Update unit
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check access
    const existingUnit = await prisma.unit.findFirst({
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

    const unit = await prisma.unit.update({
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
        images
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId: existingUnit.property.customerId,
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
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only property owners can delete units' });
    }

    const unit = await prisma.unit.findFirst({
      where: {
        id,
        property: { ownerId: userId }
      },
      include: { property: true }
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found or access denied' });
    }

    // Check for active leases
    const activeLeases = await prisma.lease.count({
      where: {
        unitId: id,
        status: 'active'
      }
    });

    if (activeLeases > 0) {
      return res.status(400).json({
        error: 'Cannot delete unit with active lease'
      });
    }

    await prisma.unit.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId: unit.property.customerId,
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


