import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
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

    console.log('📋 Get managers request:', { userId, customerId, role });

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only property owners can access managers' });
    }

    const managers = await prisma.users.findMany({
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
        property_managers: {
          where: { isActive: true },
          include: {
            properties: {
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

    console.log(`✅ Found ${managers.length} managers for customer ${customerId}`);

    return res.json(managers);

  } catch (error: any) {
    console.error('Get managers error:', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({ error: 'Failed to fetch managers' });
  }
});

// Get property manager statistics (MUST be before /:id route)
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only property owners can access manager statistics' });
    }

    // Get all properties owned by this user
    const ownerProperties = await prisma.properties.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });

    const propertyIds = ownerProperties.map(p => p.id);

    // Get all managers for this customer (including inactive)
    const allManagers = await prisma.users.findMany({
      where: {
        customerId,
        role: 'manager'
      },
      select: {
        id: true,
        status: true,
        isActive: true
      }
    });

    // Calculate manager statistics
    const totalManagers = allManagers.length;
    const activeManagers = allManagers.filter(m => m.status === 'active' && m.isActive !== false).length;
    const pendingManagers = allManagers.filter(m => m.status === 'pending').length;
    const inactiveManagers = allManagers.filter(m => m.isActive === false).length;

    // Get total number of active property-manager assignments
    const totalAssignments = await prisma.property_managers.count({
      where: {
        propertyId: { in: propertyIds },
        isActive: true
      }
    });

    // Get number of properties with at least one active manager
    const propertiesWithManagers = await prisma.property_managers.groupBy({
      by: ['propertyId'],
      where: {
        propertyId: { in: propertyIds },
        isActive: true
      }
    });

    const propertiesManagedCount = propertiesWithManagers.length;
    const totalProperties = ownerProperties.length;

    // Calculate coverage rate (percentage of properties with managers)
    const coverageRate = totalProperties > 0 
      ? (propertiesManagedCount / totalProperties) * 100 
      : 0;

    return res.json({
      totalManagers,
      propertiesManaged: propertiesManagedCount,
      totalProperties,
      coverageRate,
      totalAssignments,
      activeManagers,
      pendingManagers,
      inactiveManagers,
      unmanagedProperties: totalProperties - propertiesManagedCount
    });

  } catch (error: any) {
    console.error('Get manager statistics error:', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch manager statistics',
      details: error.message 
    });
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

    const manager = await prisma.users.findFirst({
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
        property_managers: {
          include: {
            properties: {
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
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate temporary password if not sending invite
    const suppliedPassword: string | undefined = (req.body.password as string) || (req.body.credentials?.tempPassword as string);
    const tempPassword = suppliedPassword || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const manager = await prisma.users.create({
      data: {
        id: randomUUID(),
        customerId,
        name,
        email,
        password: hashedPassword, // Always set password, no invitation system for managers
        phone,
        role: 'manager',
        department: department || specialization,
        permissions,
        status: 'active', // Always set to active so managers can log in immediately
        isActive: true, // Explicitly set isActive to true
        invitedAt: null,
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

    const manager = await prisma.users.update({
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
    await prisma.activity_logs.create({
      data: {
        id: randomUUID(),
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
    const manager = await prisma.users.findFirst({
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
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        ownerId: userId
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    // Check if property is already assigned to ANY manager (one property = one manager rule)
    const propertyHasManager = await prisma.property_managers.findFirst({
      where: {
        propertyId,
        isActive: true
      },
      include: {
        users: {
          select: {
            name: true
          }
        }
      }
    });

    if (propertyHasManager && propertyHasManager.managerId !== managerId) {
      return res.status(400).json({
        error: `Property is already assigned to ${propertyHasManager.users.name}. Please unassign first.`
      });
    }

    // Check if assignment exists (active or inactive) for THIS manager
    const existing = await prisma.property_managers.findFirst({
      where: {
        managerId,
        propertyId
      }
    });

    let assignment;

    if (existing) {
      // If exists and is active, return error
      if (existing.isActive) {
        return res.status(400).json({
          error: 'Manager already assigned to this property'
        });
      }
      
      // If exists but inactive, reactivate it
      console.log(`♻️ Reactivating existing assignment: ${existing.id}`);
      assignment = await prisma.property_managers.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          permissions,
          assignedAt: new Date()
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          properties: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        }
      });
    } else {
      // Create new assignment
      console.log(`➕ Creating new assignment for manager ${managerId} to property ${propertyId}`);
      assignment = await prisma.property_managers.create({
        data: {
          id: randomUUID(),
          propertyId,
          managerId,
          permissions,
          isActive: true
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          properties: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        }
      });
    }

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: randomUUID(),
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
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return res.status(500).json({ 
      error: 'Failed to assign manager',
      details: error.message 
    });
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

    const assignment = await prisma.property_managers.findFirst({
      where: {
        managerId,
        propertyId,
        properties: {
          ownerId: userId,
          customerId
        }
      },
      include: {
        users: { select: { name: true } },
        properties: { select: { name: true } }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Soft delete by setting isActive to false
    await prisma.property_managers.update({
      where: { id: assignment.id },
      data: { isActive: false }
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: randomUUID(),
        customerId,
        userId,
        action: 'unassign',
        entity: 'property_manager',
        entityId: assignment.id,
        description: `${assignment.users.name} removed from ${assignment.properties.name}`
      }
    });

    return res.json({ message: 'Manager removed from property' });

  } catch (error: any) {
    console.error('Remove manager error:', error);
    return res.status(500).json({ error: 'Failed to remove manager' });
  }
});

// Deactivate manager
// Reset manager password
router.post('/:id/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    console.log('🔐 Reset manager password request - User role:', role, 'Manager ID:', id);

    // Check if user is owner or admin
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isOwner = role === 'owner' || role === 'property owner' || role === 'property_owner';

    if (!isAdmin && !isOwner) {
      console.log('❌ Access denied - Invalid role:', role);
      return res.status(403).json({ error: 'Access denied. Only property owners can reset manager passwords.' });
    }

    // Find the manager
    const manager = await prisma.users.findUnique({
      where: { id },
    });

    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    // Verify the manager has role 'manager'
    if (manager.role !== 'manager' && manager.role !== 'property_manager' && manager.role !== 'property manager') {
      return res.status(400).json({ error: 'User is not a manager' });
    }

    // For owners (non-admins), verify the manager belongs to their customer
    if (!isAdmin && manager.customerId !== customerId) {
      console.log('❌ Access denied - Manager belongs to different customer');
      return res.status(403).json({ error: 'Access denied. You do not manage this manager.' });
    }

    // Generate a new temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update manager's password in the database
    await prisma.users.update({
      where: { id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    console.log('✅ Password reset for manager:', manager.email);

    // Log activity
    if (manager.customerId) {
      await prisma.activity_logs.create({
        data: {
          id: randomUUID(),
          customerId: manager.customerId,
          userId,
          action: 'update',
          entity: 'manager',
          entityId: id,
          description: `Password reset for manager ${manager.name}`
        }
      });
    }

    // Return the temporary password (for owner to give to manager)
    return res.json({
      message: 'Password reset successfully',
      tempPassword: tempPassword,
      managerEmail: manager.email,
      managerName: manager.name
    });

  } catch (error: any) {
    console.error('❌ Reset manager password error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return res.status(500).json({ 
      error: 'Failed to reset manager password',
      details: error.message 
    });
  }
});

router.post('/:id/deactivate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const manager = await prisma.users.update({
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
    await prisma.property_managers.updateMany({
      where: { managerId: id },
      data: { isActive: false }
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: randomUUID(),
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


