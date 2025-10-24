import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);

// Get all maintenance requests
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, status, priority, category, search } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;
    const customerId = req.user?.customerId;

    // TODO: Implement maintenance_requests table in schema
    // For now, return empty array to prevent 500 errors
    console.log('⚠️ Maintenance requests not yet implemented - returning empty array');
    return res.json([]);

    /* COMMENTED OUT UNTIL SCHEMA IS UPDATED
    const where: any = {};

    // Filter by role access
    if (role === 'owner') {
      where.property = { ownerId: userId };
    } else if (role === 'manager') {
      where.property = {
        managers: {
          some: {
            managerId: userId,
            isActive: true
          }
        }
      };
    } else if (role === 'tenant') {
      where.reportedById = userId;
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Additional filters
    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { ticketNumber: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true
          }
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            type: true
          }
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return res.json(requests);
    */

  } catch (error: any) {
    console.error('Get maintenance requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch maintenance requests' });
  }
});

// Get single maintenance request
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const whereCondition: any = {
      id,
      OR: []
    };

    if (role === 'owner') {
      whereCondition.OR.push({ property: { ownerId: userId } });
    } else if (role === 'manager') {
      whereCondition.OR.push({
        property: {
          managers: {
            some: {
              managerId: userId,
              isActive: true
            }
          }
        }
      });
    } else if (role === 'tenant') {
      whereCondition.OR.push({ reportedById: userId });
    }

    const request = await prisma.maintenanceRequest.findFirst({
      where: whereCondition,
      include: {
        property: true,
        unit: true,
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        updates: {
          include: {
            updatedBy: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found or access denied' });
    }

    return res.json(request);

  } catch (error: any) {
    console.error('Get maintenance request error:', error);
    return res.status(500).json({ error: 'Failed to fetch maintenance request' });
  }
});

// Create maintenance request
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    const {
      propertyId,
      unitId,
      title,
      description,
      category,
      priority,
      images,
      preferredSchedule
    } = req.body;

    if (!propertyId || !title || !description || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify access to property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          {
            managers: {
              some: {
                managerId: userId,
                isActive: true
              }
            }
          },
          {
            units: {
              some: {
                leases: {
                  some: {
                    tenantId: userId,
                    status: 'active'
                  }
                }
              }
            }
          }
        ]
      }
    });

    if (!property) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    // Generate ticket number
    const ticketNumber = `MNT-${Date.now()}`;

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        propertyId,
        unitId,
        reportedById: userId,
        ticketNumber,
        title,
        description,
        category,
        priority: priority || 'medium',
        status: 'open',
        images,
        preferredSchedule: preferredSchedule ? new Date(preferredSchedule) : null
      },
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
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'create',
        entity: 'maintenance_request',
        entityId: maintenanceRequest.id,
        description: `Maintenance request ${ticketNumber} created: ${title}`
      }
    });

    return res.status(201).json(maintenanceRequest);

  } catch (error: any) {
    console.error('Create maintenance request error:', error);
    return res.status(500).json({ error: 'Failed to create maintenance request' });
  }
});

// Update maintenance request
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    // Check access
    const existing = await prisma.maintenanceRequest.findFirst({
      where: {
        id,
        OR: [
          { property: { ownerId: userId } },
          {
            property: {
              managers: {
                some: {
                  managerId: userId,
                  isActive: true
                }
              }
            }
          },
          { reportedById: userId }
        ]
      },
      include: { property: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Maintenance request not found or access denied' });
    }

    const {
      status,
      priority,
      category,
      assignedToId,
      scheduledDate,
      completedAt,
      estimatedCost,
      actualCost,
      notes,
      updateNote
    } = req.body;

    // Only managers/owners can assign, change status, costs
    if ((assignedToId || estimatedCost || actualCost) && role === 'tenant') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const maintenanceRequest = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status,
        priority,
        category,
        assignedToId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        completedAt: status === 'completed' ? new Date() : (completedAt ? new Date(completedAt) : undefined),
        estimatedCost,
        actualCost,
        notes
      }
    });

    // Create update record if note provided
    if (updateNote) {
      await prisma.maintenanceUpdate.create({
        data: {
          requestId: id,
          updatedById: userId,
          note: updateNote,
          status: status || existing.status
        }
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'update',
        entity: 'maintenance_request',
        entityId: maintenanceRequest.id,
        description: `Maintenance request ${existing.ticketNumber} updated`
      }
    });

    return res.json(maintenanceRequest);

  } catch (error: any) {
    console.error('Update maintenance request error:', error);
    return res.status(500).json({ error: 'Failed to update maintenance request' });
  }
});

// Assign maintenance request
router.post('/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedToId, notes } = req.body;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Only owners and managers can assign requests' });
    }

    const request = await prisma.maintenanceRequest.findFirst({
      where: {
        id,
        property: {
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
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found or access denied' });
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        assignedToId,
        status: 'in_progress',
        notes
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create update record
    await prisma.maintenanceUpdate.create({
      data: {
        requestId: id,
        updatedById: userId,
        note: `Assigned to ${updated.assignedTo?.name}`,
        status: 'in_progress'
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'assign',
        entity: 'maintenance_request',
        entityId: id,
        description: `Maintenance request assigned to ${updated.assignedTo?.name}`
      }
    });

    return res.json(updated);

  } catch (error: any) {
    console.error('Assign maintenance request error:', error);
    return res.status(500).json({ error: 'Failed to assign maintenance request' });
  }
});

// Complete maintenance request
router.post('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { actualCost, completionNotes } = req.body;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const request = await prisma.maintenanceRequest.findFirst({
      where: {
        id,
        property: {
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
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found or access denied' });
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        actualCost,
        notes: completionNotes
      }
    });

    // Create update record
    await prisma.maintenanceUpdate.create({
      data: {
        requestId: id,
        updatedById: userId,
        note: completionNotes || 'Maintenance request completed',
        status: 'completed'
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'complete',
        entity: 'maintenance_request',
        entityId: id,
        description: `Maintenance request ${request.ticketNumber} completed`
      }
    });

    return res.json(updated);

  } catch (error: any) {
    console.error('Complete maintenance request error:', error);
    return res.status(500).json({ error: 'Failed to complete maintenance request' });
  }
});

// Get maintenance statistics
router.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    const where: any = {};

    if (role === 'owner') {
      where.property = { ownerId: userId };
    } else if (role === 'manager') {
      where.property = {
        managers: {
          some: {
            managerId: userId,
            isActive: true
          }
        }
      };
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const [total, open, inProgress, completed, overdue] = await Promise.all([
      prisma.maintenanceRequest.count({ where }),
      prisma.maintenanceRequest.count({ where: { ...where, status: 'open' } }),
      prisma.maintenanceRequest.count({ where: { ...where, status: 'in_progress' } }),
      prisma.maintenanceRequest.count({ where: { ...where, status: 'completed' } }),
      prisma.maintenanceRequest.count({
        where: {
          ...where,
          status: { in: ['open', 'in_progress'] },
          scheduledDate: { lt: new Date() }
        }
      })
    ]);

    // Get by category
    const byCategory = await prisma.maintenanceRequest.groupBy({
      by: ['category'],
      where,
      _count: true
    });

    // Get by priority
    const byPriority = await prisma.maintenanceRequest.groupBy({
      by: ['priority'],
      where,
      _count: true
    });

    // Average resolution time (completed requests)
    const completedRequests = await prisma.maintenanceRequest.findMany({
      where: {
        ...where,
        status: 'completed',
        completedAt: { not: null }
      },
      select: {
        createdAt: true,
        completedAt: true
      }
    });

    const avgResolutionTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, req) => {
          const diff = new Date(req.completedAt!).getTime() - new Date(req.createdAt).getTime();
          return sum + diff;
        }, 0) / completedRequests.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    return res.json({
      total,
      open,
      inProgress,
      completed,
      overdue,
      byCategory: byCategory.map(c => ({ category: c.category, count: c._count })),
      byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })),
      avgResolutionDays: Math.round(avgResolutionTime * 10) / 10
    });

  } catch (error: any) {
    console.error('Get maintenance stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch maintenance statistics' });
  }
});

export default router;


