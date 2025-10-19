import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);

// Get all keycards
router.get('/keycards', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, status, search } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

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

    if (search) {
      where.OR = [
        { cardNumber: { contains: search as string, mode: 'insensitive' } },
        { assignedTo: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const keycards = await prisma.keycard.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        unit: {
          select: {
            id: true,
            unitNumber: true
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
      orderBy: { createdAt: 'desc' }
    });

    return res.json(keycards);

  } catch (error: any) {
    console.error('Get keycards error:', error);
    return res.status(500).json({ error: 'Failed to fetch keycards' });
  }
});

// Get single keycard
router.get('/keycards/:id', async (req: AuthRequest, res: Response) => {
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
    }

    const keycard = await prisma.keycard.findFirst({
      where: whereCondition,
      include: {
        property: true,
        unit: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        accessLogs: {
          orderBy: { accessTime: 'desc' },
          take: 20
        }
      }
    });

    if (!keycard) {
      return res.status(404).json({ error: 'Keycard not found or access denied' });
    }

    return res.json(keycard);

  } catch (error: any) {
    console.error('Get keycard error:', error);
    return res.status(500).json({ error: 'Failed to fetch keycard' });
  }
});

// Create keycard
router.post('/keycards', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const {
      propertyId,
      unitId,
      assignedToId,
      cardType,
      accessLevel,
      validFrom,
      validUntil,
      accessZones,
      notes
    } = req.body;

    if (!propertyId || !cardType || !accessLevel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify property access
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
          }
        ]
      }
    });

    if (!property) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    // Generate card number
    const cardNumber = `KEY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const keycard = await prisma.keycard.create({
      data: {
        propertyId,
        unitId,
        assignedToId,
        cardNumber,
        cardType,
        accessLevel,
        status: 'active',
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        accessZones,
        notes,
        issuedById: userId
      },
      include: {
        property: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
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
        entity: 'keycard',
        entityId: keycard.id,
        description: `Keycard ${cardNumber} issued${keycard.assignedTo ? ` to ${keycard.assignedTo.name}` : ''}`
      }
    });

    return res.status(201).json(keycard);

  } catch (error: any) {
    console.error('Create keycard error:', error);
    return res.status(500).json({ error: 'Failed to create keycard' });
  }
});

// Update keycard
router.put('/keycards/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check access
    const existing = await prisma.keycard.findFirst({
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
      },
      include: { property: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Keycard not found or access denied' });
    }

    const {
      status,
      assignedToId,
      accessLevel,
      validFrom,
      validUntil,
      accessZones,
      notes
    } = req.body;

    const keycard = await prisma.keycard.update({
      where: { id },
      data: {
        status,
        assignedToId,
        accessLevel,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        accessZones,
        notes
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'update',
        entity: 'keycard',
        entityId: keycard.id,
        description: `Keycard ${keycard.cardNumber} updated`
      }
    });

    return res.json(keycard);

  } catch (error: any) {
    console.error('Update keycard error:', error);
    return res.status(500).json({ error: 'Failed to update keycard' });
  }
});

// Deactivate keycard
router.post('/keycards/:id/deactivate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const keycard = await prisma.keycard.findFirst({
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
      },
      include: { property: true }
    });

    if (!keycard) {
      return res.status(404).json({ error: 'Keycard not found or access denied' });
    }

    const updated = await prisma.keycard.update({
      where: { id },
      data: {
        status: 'inactive',
        deactivatedAt: new Date(),
        notes: reason ? `${keycard.notes || ''}\nDeactivated: ${reason}` : keycard.notes
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'deactivate',
        entity: 'keycard',
        entityId: id,
        description: `Keycard ${keycard.cardNumber} deactivated${reason ? `: ${reason}` : ''}`
      }
    });

    return res.json(updated);

  } catch (error: any) {
    console.error('Deactivate keycard error:', error);
    return res.status(500).json({ error: 'Failed to deactivate keycard' });
  }
});

// Get access logs
router.get('/access-logs', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, keycardId, startDate, endDate, accessResult } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    const where: any = {};

    // Filter by role access
    if (role === 'owner') {
      where.keycard = { property: { ownerId: userId } };
    } else if (role === 'manager') {
      where.keycard = {
        property: {
          managers: {
            some: {
              managerId: userId,
              isActive: true
            }
          }
        }
      };
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Additional filters
    if (propertyId) {
      where.keycard = { ...where.keycard, propertyId };
    }

    if (keycardId) {
      where.keycardId = keycardId;
    }

    if (startDate || endDate) {
      where.accessTime = {};
      if (startDate) where.accessTime.gte = new Date(startDate as string);
      if (endDate) where.accessTime.lte = new Date(endDate as string);
    }

    if (accessResult) {
      where.accessResult = accessResult;
    }

    const logs = await prisma.accessLog.findMany({
      where,
      include: {
        keycard: {
          include: {
            property: {
              select: {
                id: true,
                name: true
              }
            },
            assignedTo: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { accessTime: 'desc' },
      take: 100
    });

    return res.json(logs);

  } catch (error: any) {
    console.error('Get access logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch access logs' });
  }
});

// Get access control statistics
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

    const [totalKeycards, activeKeycards, expiringSoon, suspended] = await Promise.all([
      prisma.keycard.count({ where }),
      prisma.keycard.count({ where: { ...where, status: 'active' } }),
      prisma.keycard.count({
        where: {
          ...where,
          status: 'active',
          validUntil: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            gte: new Date()
          }
        }
      }),
      prisma.keycard.count({ where: { ...where, status: 'suspended' } })
    ]);

    // By card type
    const byType = await prisma.keycard.groupBy({
      by: ['cardType'],
      where,
      _count: true
    });

    // By access level
    const byAccessLevel = await prisma.keycard.groupBy({
      by: ['accessLevel'],
      where,
      _count: true
    });

    // Recent access activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = await prisma.accessLog.count({
      where: {
        keycard: where,
        accessTime: { gte: last24Hours }
      }
    });

    // Failed access attempts (last 24 hours)
    const failedAttempts = await prisma.accessLog.count({
      where: {
        keycard: where,
        accessTime: { gte: last24Hours },
        accessResult: 'denied'
      }
    });

    return res.json({
      totalKeycards,
      activeKeycards,
      expiringSoon,
      suspended,
      byType: byType.map(t => ({ type: t.cardType, count: t._count })),
      byAccessLevel: byAccessLevel.map(a => ({ level: a.accessLevel, count: a._count })),
      recentActivity24h: recentActivity,
      failedAttempts24h: failedAttempts
    });

  } catch (error: any) {
    console.error('Get access control stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch access control statistics' });
  }
});

export default router;


