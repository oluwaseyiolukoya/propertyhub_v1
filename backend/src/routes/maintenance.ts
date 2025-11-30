import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { emitToCustomer, emitToUser } from '../lib/socket';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = express.Router();

// Configure multer for maintenance file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const customerId = (req as any).user?.customerId || 'general';
    const uploadDir = path.join(__dirname, `../../uploads/maintenance/${customerId}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${uniqueSuffix}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp',
      'application/pdf',
      'video/mp4',
      'video/quicktime'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images, PDF, and videos allowed.`));
    }
  }
});

router.use(authMiddleware);

// Upload files for maintenance requests
router.post('/upload', upload.array('files', 5), async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const customerId = req.user?.customerId || 'general';
    const fileUrls = files.map(file => `/uploads/maintenance/${customerId}/${file.filename}`);

    return res.json({
      success: true,
      files: fileUrls,
      count: files.length
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload files' });
  }
});

// Get all maintenance requests
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, status, priority, category, search } = req.query as any;
    const userId = req.user?.id as string;
    const role = (req.user?.role || '').toLowerCase();

    const where: any = {};

    // Filter by role access
    if (role === 'owner' || role === 'property owner') {
      where.property = { ownerId: userId };
    } else if (role === 'manager' || role === 'property manager') {
      where.property = {
        property_managers: {
          some: {
            managerId: userId,
            isActive: true
          }
        }
      };
    } else if (role === 'tenant') {
      // Tenants can see tickets they reported OR tickets for their unit
      // First, find the tenant's active lease to get their unit
      const tenantLease = await prisma.leases.findFirst({
        where: {
          tenantId: userId,
          status: 'active'
        },
        select: {
          unitId: true,
          propertyId: true
        }
      });

      if (tenantLease) {
        // Tenant can see tickets they reported OR tickets for their unit
        where.OR = [
          { reportedById: userId },
          { unitId: tenantLease.unitId }
        ];
      } else {
        // No active lease, only show tickets they reported
        where.reportedById = userId;
      }
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

    const requests = await prisma.maintenance_requests.findMany({
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
  } catch (error: any) {
    console.error('Get maintenance requests error:', error);
    // Always degrade gracefully to avoid breaking tenant UI
    return res.json([]);
  }
});

// Get single maintenance request
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = (req.user?.role || '').toLowerCase();

    const whereCondition: any = {
      id,
      OR: []
    };

    if (role === 'owner' || role === 'property owner') {
      whereCondition.OR.push({ property: { ownerId: userId } });
    } else if (role === 'manager' || role === 'property manager') {
      whereCondition.OR.push({
        property: {
          property_managers: {
            some: {
              managerId: userId,
              isActive: true
            }
          }
        }
      });
    } else if (role === 'tenant') {
      // Tenant can view tickets they reported OR tickets for their unit
      whereCondition.OR.push({ reportedById: userId });

      // Also check if ticket is for tenant's unit
      const tenantLease = await prisma.leases.findFirst({
        where: {
          tenantId: userId,
          status: 'active'
        },
        select: { unitId: true }
      });

      if (tenantLease?.unitId) {
        whereCondition.OR.push({ unitId: tenantLease.unitId });
      }
    }

  const request = await prisma.maintenance_requests.findFirst({
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
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          {
            property_managers: {
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

    const maintenanceRequest = await prisma.maintenance_requests.create({
      data: {
        customerId: property.customerId,
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
    await prisma.activity_logs.create({
      data: {
        id: uuidv4(),
        customerId: maintenanceRequest.customerId,
        userId,
        action: 'create',
        entity: 'maintenance_request',
        entityId: maintenanceRequest.id,
        description: `Maintenance request ${ticketNumber} created: ${title}`
      }
    });

    // Realtime: notify customer users and the reporting tenant
    try {
      if (maintenanceRequest.customerId) {
        emitToCustomer(maintenanceRequest.customerId, 'maintenance:created', {
          id: maintenanceRequest.id,
          ticketNumber: maintenanceRequest.ticketNumber,
          title: maintenanceRequest.title,
          status: maintenanceRequest.status,
          priority: maintenanceRequest.priority,
          propertyId: maintenanceRequest.propertyId,
          unitId: maintenanceRequest.unitId,
          reportedById: maintenanceRequest.reportedById,
          createdAt: maintenanceRequest.createdAt
        });
      }
      if (maintenanceRequest.reportedById) {
        emitToUser(maintenanceRequest.reportedById, 'maintenance:updated', { id: maintenanceRequest.id, action: 'created' });
      }
    } catch {}

    return res.status(201).json(maintenanceRequest);

  } catch (error: any) {
    console.error('Create maintenance request error:', error);
    if (error?.code === 'P2021') {
      return res.status(503).json({
        error: 'Maintenance feature not initialized. Please run database migrations.'
      });
    }
    return res.status(500).json({ error: error?.message || 'Failed to create maintenance request' });
  }
});

// Update maintenance request
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = (req.user?.role || '').toLowerCase();

    // Build access conditions
    const accessConditions: any[] = [
      { property: { ownerId: userId } },
      {
        property: {
          property_managers: {
            some: {
              managerId: userId,
              isActive: true
            }
          }
        }
      },
      { reportedById: userId }
    ];

    // For tenants, also allow access if the ticket is for their unit
    if (role === 'tenant') {
      const tenantLease = await prisma.leases.findFirst({
        where: {
          tenantId: userId,
          status: 'active'
        },
        select: { unitId: true }
      });

      if (tenantLease?.unitId) {
        accessConditions.push({ unitId: tenantLease.unitId });
      }
    }

    // Check access
    const existing = await prisma.maintenance_requests.findFirst({
      where: {
        id,
        OR: accessConditions
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

  const maintenanceRequest = await prisma.maintenance_requests.update({
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
      await prisma.maintenance_updates.create({
        data: {
          requestId: id,
          updatedById: userId,
          note: updateNote,
          status: status || existing.status
        }
      });
    }

    // Log activity
  await prisma.activity_logs.create({
      data: {
        id: uuidv4(),
        customerId,
        userId,
        action: 'update',
        entity: 'maintenance_request',
        entityId: maintenanceRequest.id,
        description: `Maintenance request ${existing.ticketNumber} updated`
      }
    });

    try {
      if (existing.property.customerId) {
        emitToCustomer(existing.property.customerId, 'maintenance:updated', { id, action: 'updated' });
      }
      emitToUser(existing.reportedById, 'maintenance:updated', { id, action: 'updated' });
      if (assignedToId) emitToUser(assignedToId, 'maintenance:updated', { id, action: 'assigned' });
    } catch {}

    return res.json(maintenanceRequest);

  } catch (error: any) {
    console.error('Update maintenance request error:', error);
    if (error?.code === 'P2021') {
      return res.status(503).json({ error: 'Maintenance feature not initialized. Please run database migrations.' });
    }
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

  const request = await prisma.maintenance_requests.findFirst({
      where: {
        id,
        property: {
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
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found or access denied' });
    }

  const updated = await prisma.maintenance_requests.update({
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
  await prisma.maintenance_updates.create({
      data: {
        requestId: id,
        updatedById: userId,
        note: `Assigned to ${updated.assignedTo?.name}`,
        status: 'in_progress'
      }
    });

    // Log activity
  await prisma.activity_logs.create({
      data: {
        id: uuidv4(),
        customerId,
        userId,
        action: 'assign',
        entity: 'maintenance_request',
        entityId: id,
        description: `Maintenance request assigned to ${updated.assignedTo?.name}`
      }
    });

    try {
      // Fetch customer id via property if missing
      const prop = await prisma.properties.findUnique({ where: { id: updated.propertyId }, select: { customerId: true } });
      const custId = prop?.customerId || customerId;
      if (custId) {
        emitToCustomer(custId, 'maintenance:updated', { id, action: 'assigned', assignedToId });
      }
      emitToUser(updated.reportedById, 'maintenance:updated', { id, action: 'assigned', assignedToId });
      if (assignedToId) emitToUser(assignedToId, 'maintenance:updated', { id, action: 'assigned' });
    } catch {}

    return res.json(updated);

  } catch (error: any) {
    console.error('Assign maintenance request error:', error);
    if (error?.code === 'P2021') {
      return res.status(503).json({ error: 'Maintenance feature not initialized. Please run database migrations.' });
    }
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

  const request = await prisma.maintenance_requests.findFirst({
      where: {
        id,
        property: {
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
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found or access denied' });
    }

    const updated = await prisma.maintenance_requests.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        actualCost,
        notes: completionNotes
      }
    });

    // Create update record
  await prisma.maintenance_updates.create({
      data: {
        requestId: id,
        updatedById: userId,
        note: completionNotes || 'Maintenance request completed',
        status: 'completed'
      }
    });

    // Log activity
  await prisma.activity_logs.create({
      data: {
        id: uuidv4(),
        customerId,
        userId,
        action: 'complete',
        entity: 'maintenance_request',
        entityId: id,
        description: `Maintenance request ${request.ticketNumber} completed`
      }
    });

    try {
      const prop = await prisma.properties.findUnique({ where: { id: updated.propertyId }, select: { customerId: true } });
      const custId = prop?.customerId || customerId;
      if (custId) emitToCustomer(custId, 'maintenance:updated', { id, action: 'completed' });
      emitToUser(updated.reportedById, 'maintenance:updated', { id, action: 'completed' });
      if (updated.assignedToId) emitToUser(updated.assignedToId, 'maintenance:updated', { id, action: 'completed' });
    } catch {}

    return res.json(updated);

  } catch (error: any) {
    console.error('Complete maintenance request error:', error);
    if (error?.code === 'P2021') {
      return res.status(503).json({ error: 'Maintenance feature not initialized. Please run database migrations.' });
    }
    return res.status(500).json({ error: 'Failed to complete maintenance request' });
  }
});

// Reply to a maintenance request (tenant/manager/owner)
router.post('/:id/replies', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note, status, attachments } = req.body as { note: string; status?: string; attachments?: string[] };
    const userId = req.user?.id as string;
    const role = (req.user?.role || '').toLowerCase();

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ error: 'Note is required' });
    }

    // Build access conditions based on role
    const accessConditions: any[] = [
      { reportedById: userId },
      { property: { ownerId: userId } },
      {
        property: {
          property_managers: {
            some: { managerId: userId, isActive: true }
          }
        }
      }
    ];

    // For tenants, also allow access if the ticket is for their unit
    if (role === 'tenant') {
      const tenantLease = await prisma.leases.findFirst({
        where: {
          tenantId: userId,
          status: 'active'
        },
        select: { unitId: true }
      });

      if (tenantLease?.unitId) {
        accessConditions.push({ unitId: tenantLease.unitId });
      }
    }

    // Ensure user has access
    const request = await prisma.maintenance_requests.findFirst({
      where: {
        id,
        OR: accessConditions
      },
      include: { property: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found or access denied' });
    }

    // Create update (conditionally include attachments to avoid schema mismatch)
    const updateData: any = {
      requestId: id,
      updatedById: userId,
      note: note.trim(),
      status: status || undefined
    };
    if (Array.isArray(attachments) && attachments.length > 0) {
      updateData.attachments = attachments;
    }

    let update;
    try {
      update = await prisma.maintenance_updates.create({
        data: updateData
      });
    } catch (e: any) {
      // Fallback: if attachments field is unknown (client not regenerated), retry without attachments
      if (String(e?.message || '').includes('Unknown argument `attachments`')) {
        const { attachments: _omit, ...withoutAttachments } = updateData;
        update = await prisma.maintenance_updates.create({ data: withoutAttachments });
      } else {
        throw e;
      }
    }

    // If manager/owner replies and ticket is open, move to in_progress unless explicitly set
    if ((role === 'owner' || role === 'property owner' || role === 'manager' || role === 'property manager') && request.status === 'open' && !status) {
      await prisma.maintenance_requests.update({
        where: { id },
        data: { status: 'in_progress' }
      });
    }

    try {
      const prop = await prisma.properties.findUnique({ where: { id: request.propertyId }, select: { customerId: true } });
      const custId = prop?.customerId || request.customerId;
      if (custId) emitToCustomer(custId, 'maintenance:updated', { id, action: 'replied' });
      emitToUser(request.reportedById, 'maintenance:updated', { id, action: 'replied' });
      if (request.assignedToId) emitToUser(request.assignedToId, 'maintenance:updated', { id, action: 'replied' });
    } catch {}

    return res.json(update);

  } catch (error: any) {
    console.error('Reply maintenance request error:', error);
    if (error?.code === 'P2021') {
      return res.status(503).json({ error: 'Maintenance feature not initialized. Please run database migrations.' });
    }
    return res.status(500).json({ error: error?.message || 'Failed to add reply' });
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


