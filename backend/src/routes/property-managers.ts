import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);

// Get all managers for current owner
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only property owners can access managers' });
    }

    const managers = await prisma.user.findMany({
      where: {
        customerId,
        role: 'manager'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        company: true,
        status: true,
        isActive: true,
        createdAt: true,
        managerAssignments: {
          where: { isActive: true },
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(managers);

  } catch (error: any) {
    console.error('Get managers error:', error);
    return res.status(500).json({ error: 'Failed to fetch managers' });
  }
});

// Get single manager
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const manager = await prisma.user.findFirst({
      where: {
        id,
        customerId,
        role: 'manager'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        company: true,
        status: true,
        isActive: true,
        permissions: true,
        createdAt: true,
        managerAssignments: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                totalUnits: true
              }
            }
          }
        }
      }
    });

    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    return res.json(manager);

  } catch (error: any) {
    console.error('Get manager error:', error);
    return res.status(500).json({ error: 'Failed to fetch manager' });
  }
});

// Create manager
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only property owners can create managers' });
    }

    const {
      name,
      email,
      phone,
      department,
      specialization,
      commission,
      permissions,
      sendInvitation
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate temporary password if not sending invite
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const manager = await prisma.user.create({
      data: {
        customerId,
        name,
        email,
        password: sendInvitation ? null : hashedPassword,
        phone,
        role: 'manager',
        department: department || specialization,
        permissions,
        status: sendInvitation ? 'pending' : 'active',
        invitedAt: sendInvitation ? new Date() : null
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'create',
        entity: 'manager',
        entityId: manager.id,
        description: `Manager ${name} created`
      }
    });

    // TODO: Send invitation email if sendInvitation is true

    const { password, ...managerWithoutPassword } = manager;

    return res.status(201).json({
      ...managerWithoutPassword,
      ...(!sendInvitation && { tempPassword })
    });

  } catch (error: any) {
    console.error('Create manager error:', error);
    return res.status(500).json({ error: 'Failed to create manager' });
  }
});

// Update manager
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      name,
      email,
      phone,
      department,
      permissions,
      isActive,
      status
    } = req.body;

    const manager = await prisma.user.update({
      where: {
        id,
        customerId,
        role: 'manager'
      },
      data: {
        name,
        email,
        phone,
        department,
        permissions,
        isActive,
        status
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'update',
        entity: 'manager',
        entityId: manager.id,
        description: `Manager ${name} updated`
      }
    });

    const { password, ...managerWithoutPassword } = manager;

    return res.json(managerWithoutPassword);

  } catch (error: any) {
    console.error('Update manager error:', error);
    return res.status(500).json({ error: 'Failed to update manager' });
  }
});

// Assign manager to property
router.post('/:managerId/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { managerId } = req.params;
    const { propertyId, permissions } = req.body;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only property owners can assign managers' });
    }

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Verify manager belongs to same customer
    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        customerId,
        role: 'manager'
      }
    });

    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    // Verify property belongs to owner
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: userId
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    // Check if already assigned
    const existing = await prisma.propertyManager.findFirst({
      where: {
        managerId,
        propertyId,
        isActive: true
      }
    });

    if (existing) {
      return res.status(400).json({
        error: 'Manager already assigned to this property'
      });
    }

    const assignment = await prisma.propertyManager.create({
      data: {
        propertyId,
        managerId,
        permissions,
        isActive: true
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'assign',
        entity: 'property_manager',
        entityId: assignment.id,
        description: `${manager.name} assigned to ${property.name}`
      }
    });

    return res.status(201).json(assignment);

  } catch (error: any) {
    console.error('Assign manager error:', error);
    return res.status(500).json({ error: 'Failed to assign manager' });
  }
});

// Remove manager from property
router.delete('/:managerId/property/:propertyId', async (req: AuthRequest, res: Response) => {
  try {
    const { managerId, propertyId } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignment = await prisma.propertyManager.findFirst({
      where: {
        managerId,
        propertyId,
        property: {
          ownerId: userId,
          customerId
        }
      },
      include: {
        manager: { select: { name: true } },
        property: { select: { name: true } }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Soft delete by setting isActive to false
    await prisma.propertyManager.update({
      where: { id: assignment.id },
      data: { isActive: false }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'unassign',
        entity: 'property_manager',
        entityId: assignment.id,
        description: `${assignment.manager.name} removed from ${assignment.property.name}`
      }
    });

    return res.json({ message: 'Manager removed from property' });

  } catch (error: any) {
    console.error('Remove manager error:', error);
    return res.status(500).json({ error: 'Failed to remove manager' });
  }
});

// Deactivate manager
router.post('/:id/deactivate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const manager = await prisma.user.update({
      where: {
        id,
        customerId,
        role: 'manager'
      },
      data: {
        isActive: false,
        status: 'inactive'
      }
    });

    // Deactivate all assignments
    await prisma.propertyManager.updateMany({
      where: { managerId: id },
      data: { isActive: false }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'deactivate',
        entity: 'manager',
        entityId: manager.id,
        description: `Manager ${manager.name} deactivated`
      }
    });

    const { password, ...managerWithoutPassword } = manager;

    return res.json(managerWithoutPassword);

  } catch (error: any) {
    console.error('Deactivate manager error:', error);
    return res.status(500).json({ error: 'Failed to deactivate manager' });
  }
});

export default router;


