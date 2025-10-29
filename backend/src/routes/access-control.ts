import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);

const OWNER_ROLES = ['owner', 'property_owner', 'property owner'];
const MANAGER_ROLES = ['manager', 'property_manager', 'property manager'];

const buildPropertyAccessFilter = (req: AuthRequest) => {
  const role = (req.user?.role || '').toLowerCase();
  const userId = req.user?.id;

  if (!userId) {
    return null;
  }

  if (OWNER_ROLES.includes(role)) {
    return { property: { ownerId: userId } };
  }

  if (MANAGER_ROLES.includes(role)) {
    return {
      property: {
        property_managers: {
          some: {
            managerId: userId,
            isActive: true
          }
        }
      }
    };
  }

  if (role.includes('admin')) {
    return {};
  }

  return null;
};

const resolveActorName = async (req: AuthRequest) => {
  const userId = req.user?.id;
  if (!userId) return undefined;

  const userRecord = await prisma.users.findUnique({
    where: { id: userId },
    select: { name: true, email: true }
  });

  return userRecord?.name || userRecord?.email || undefined;
};

// Fetch key inventory
router.get('/keys', async (req: AuthRequest, res: Response) => {
  try {
    const propertyFilter = buildPropertyAccessFilter(req);
    if (propertyFilter === null) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { propertyId, status, type, search } = req.query;

    const where: any = {
      customerId: req.user?.customerId || undefined
    };

    if (propertyFilter.property) {
      where.property = propertyFilter.property;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.keyType = type;
    }

    if (search) {
      const query = String(search);
      where.OR = [
        { keyNumber: { contains: query, mode: 'insensitive' } },
        { keyLabel: { contains: query, mode: 'insensitive' } },
        { issuedToName: { contains: query, mode: 'insensitive' } },
        { property: { name: { contains: query, mode: 'insensitive' } } },
        { unit: { unitNumber: { contains: query, mode: 'insensitive' } } }
      ];
    }

    const keys = await prisma.property_keys.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            currency: true
          }
        },
        unit: {
          select: {
            id: true,
            unitNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(keys);
  } catch (error: any) {
    console.error('Failed to fetch property keys:', error);
    return res.status(500).json({ error: 'Failed to load key inventory' });
  }
});

// Create a new key in inventory
router.post('/keys', async (req: AuthRequest, res: Response) => {
  try {
    const propertyFilter = buildPropertyAccessFilter(req);
    if (propertyFilter === null) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      keyNumber,
      keyLabel,
      keyType,
      propertyId,
      unitId,
      numberOfCopies,
      location,
      notes
    } = req.body;

    if (!keyNumber || !keyType || !propertyId) {
      return res.status(400).json({ error: 'Key number, type, and property are required' });
    }

    const propertyAccessCheck = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        ...(propertyFilter.property || {})
      },
      select: { id: true, customerId: true }
    });

    if (!propertyAccessCheck) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    const createdKey = await prisma.property_keys.create({
      data: {
        keyNumber,
        keyLabel,
        keyType,
        propertyId,
        unitId: unitId || null,
        customerId: propertyAccessCheck.customerId,
        numberOfCopies: numberOfCopies ? Number(numberOfCopies) : 1,
        location,
        notes,
        createdById: req.user?.id,
        updatedById: req.user?.id
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            currency: true
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

    return res.status(201).json(createdKey);
  } catch (error: any) {
    console.error('Failed to create property key:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Key number already exists' });
    }
    return res.status(500).json({ error: 'Failed to create key' });
  }
});

// Issue a key to a person
router.post('/keys/:id/issue', async (req: AuthRequest, res: Response) => {
  try {
    const propertyFilter = buildPropertyAccessFilter(req);
    if (propertyFilter === null) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const {
      issuedTo,
      issuedToType,
      expectedReturnDate,
      depositAmount,
      witnessName,
      notes
    } = req.body;

    if (!issuedTo || !issuedToType) {
      return res.status(400).json({ error: 'Issued to name and type are required' });
    }

    const keyRecord = await prisma.property_keys.findFirst({
      where: {
        id,
        customerId: req.user?.customerId || undefined,
        ...(propertyFilter.property ? { property: propertyFilter.property } : {})
      }
    });

    if (!keyRecord) {
      return res.status(404).json({ error: 'Key not found or access denied' });
    }

    if (keyRecord.status === 'issued') {
      return res.status(400).json({ error: 'Key is already issued' });
    }

    const actorName = await resolveActorName(req);

    const updatedKey = await prisma.property_keys.update({
      where: { id },
      data: {
        status: 'issued',
        issuedToName: issuedTo,
        issuedToType,
        issuedDate: new Date(),
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        depositAmount: depositAmount ? Number(depositAmount) : keyRecord.depositAmount,
        depositRefunded: false,
        location: `Issued to ${issuedTo}`,
        depositNotes: notes,
        updatedById: req.user?.id
      },
      include: {
        property: {
          select: { id: true, name: true, currency: true }
        },
        unit: {
          select: { id: true, unitNumber: true }
        }
      }
    });

    await prisma.property_key_transactions.create({
      data: {
        keyId: id,
        customerId: updatedKey.customerId,
        action: 'ISSUE',
        performedById: req.user?.id,
        performedByName: actorName,
        performedForName: issuedTo,
        personType: issuedToType,
        witnessName,
        depositAmount: depositAmount ? Number(depositAmount) : null,
        notes,
        metadata: {
          expectedReturnDate,
          location: updatedKey.location
        }
      }
    });

    return res.json(updatedKey);
  } catch (error: any) {
    console.error('Failed to issue key:', error);
    return res.status(500).json({ error: 'Failed to issue key' });
  }
});

// Return a key
router.post('/keys/:id/return', async (req: AuthRequest, res: Response) => {
  try {
    const propertyFilter = buildPropertyAccessFilter(req);
    if (propertyFilter === null) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { condition, refundDeposit, refundAmount, witnessName, notes } = req.body;

    const keyRecord = await prisma.property_keys.findFirst({
      where: {
        id,
        customerId: req.user?.customerId || undefined,
        ...(propertyFilter.property ? { property: propertyFilter.property } : {})
      }
    });

    if (!keyRecord) {
      return res.status(404).json({ error: 'Key not found or access denied' });
    }

    if (keyRecord.status !== 'issued') {
      return res.status(400).json({ error: 'Key is not currently issued' });
    }

    const actorName = await resolveActorName(req);

    const updatedKey = await prisma.property_keys.update({
      where: { id },
      data: {
        status: 'available',
        issuedToName: null,
        issuedToType: null,
        issuedToUserId: null,
        issuedDate: null,
        expectedReturnDate: null,
        returnedDate: new Date(),
        depositRefunded: !!refundDeposit,
        location: 'Key Cabinet - Office',
        depositNotes: notes,
        updatedById: req.user?.id
      },
      include: {
        property: {
          select: { id: true, name: true, currency: true }
        },
        unit: {
          select: { id: true, unitNumber: true }
        }
      }
    });

    await prisma.property_key_transactions.create({
      data: {
        keyId: id,
        customerId: updatedKey.customerId,
        action: 'RETURN',
        performedById: req.user?.id,
        performedByName: actorName,
        performedForName: keyRecord.issuedToName || undefined,
        personType: keyRecord.issuedToType || undefined,
        witnessName,
        // Use provided refundAmount for partial refunds, fallback to full deposit for full refund
        depositAmount: refundDeposit
          ? (typeof refundAmount === 'number' && !isNaN(refundAmount) ? Number(refundAmount) : (keyRecord.depositAmount || undefined))
          : undefined,
        notes,
        metadata: {
          condition,
          refundDeposit: !!refundDeposit,
          refundAmount: (typeof refundAmount === 'number' && !isNaN(refundAmount)) ? Number(refundAmount) : undefined,
          partialRefund: (typeof refundAmount === 'number' && !isNaN(refundAmount) && keyRecord.depositAmount && Number(refundAmount) < keyRecord.depositAmount) || false
        }
      }
    });

    return res.json(updatedKey);
  } catch (error: any) {
    console.error('Failed to return key:', error);
    return res.status(500).json({ error: 'Failed to return key' });
  }
});

// Report a lost key
router.post('/keys/:id/report-lost', async (req: AuthRequest, res: Response) => {
  try {
    const propertyFilter = buildPropertyAccessFilter(req);
    if (propertyFilter === null) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const {
      reportedBy,
      lostDate,
      circumstances,
      policeReportNumber,
      replaceLock
    } = req.body;

    if (!reportedBy || !lostDate) {
      return res.status(400).json({ error: 'Reported by and lost date are required' });
    }

    const keyRecord = await prisma.property_keys.findFirst({
      where: {
        id,
        customerId: req.user?.customerId || undefined,
        ...(propertyFilter.property ? { property: propertyFilter.property } : {})
      }
    });

    if (!keyRecord) {
      return res.status(404).json({ error: 'Key not found or access denied' });
    }

    const actorName = await resolveActorName(req);

    const combinedNotes = [
      keyRecord.notes,
      `Lost on ${lostDate}${circumstances ? ` - ${circumstances}` : ''}`,
      policeReportNumber ? `Police report: ${policeReportNumber}` : null,
      replaceLock ? 'Lock replacement required' : null
    ]
      .filter(Boolean)
      .join('\n');

    const updatedKey = await prisma.property_keys.update({
      where: { id },
      data: {
        status: 'lost',
        location: 'Lost',
        depositRefunded: false,
        depositNotes: combinedNotes,
        notes: combinedNotes,
        updatedById: req.user?.id
      },
      include: {
        property: {
          select: { id: true, name: true, currency: true }
        },
        unit: {
          select: { id: true, unitNumber: true }
        }
      }
    });

    await prisma.property_key_transactions.create({
      data: {
        keyId: id,
        customerId: updatedKey.customerId,
        action: 'LOST_REPORT',
        performedById: req.user?.id,
        performedByName: actorName,
        performedForName: keyRecord.issuedToName || reportedBy,
        personType: keyRecord.issuedToType || undefined,
        notes: circumstances,
        metadata: {
          reportedBy,
          lostDate,
          policeReportNumber,
          replaceLock
        }
      }
    });

    return res.json(updatedKey);
  } catch (error: any) {
    console.error('Failed to report lost key:', error);
    return res.status(500).json({ error: 'Failed to report lost key' });
  }
});

// Fetch custody chain / transactions
router.get('/transactions', async (req: AuthRequest, res: Response) => {
  try {
    const propertyFilter = buildPropertyAccessFilter(req);
    if (propertyFilter === null) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { search, action, limit } = req.query;

    const where: any = {
      customerId: req.user?.customerId || undefined
    };

    // Only add key filter if propertyFilter has property criteria
    if (propertyFilter.property && Object.keys(propertyFilter.property).length > 0) {
      // Scope transactions by keys that belong to properties accessible to the requester
      where.key = {
        property: propertyFilter.property
      };
    }

    if (action) {
      where.action = action;
    }

    if (search) {
      const query = String(search);
      where.OR = [
        { key: { keyNumber: { contains: query, mode: 'insensitive' } } },
        { performedForName: { contains: query, mode: 'insensitive' } },
        { performedByName: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } }
      ];
    }

    const transactions = await prisma.property_key_transactions.findMany({
      where,
      include: {
        key: {
          select: {
            id: true,
            keyNumber: true,
            keyType: true,
            property: {
              select: { id: true, name: true }
            },
            unit: {
              select: { id: true, unitNumber: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : 100
    });

    return res.json(transactions);
  } catch (error: any) {
    console.error('Failed to fetch key transactions:', error);
    return res.status(500).json({ error: 'Failed to load key transactions' });
  }
});

// Stats overview
router.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  try {
    const propertyFilter = buildPropertyAccessFilter(req);
    if (propertyFilter === null) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { propertyId } = req.query;

    const baseWhere: any = {
      customerId: req.user?.customerId || undefined
    };

    if (propertyFilter.property) {
      baseWhere.property = propertyFilter.property;
    }

    if (propertyId) {
      baseWhere.propertyId = propertyId;
    }

    const [totalKeys, issuedKeys, availableKeys, lostKeys, depositAggregate, typeBreakdown] = await Promise.all([
      prisma.property_keys.count({ where: baseWhere }),
      prisma.property_keys.count({ where: { ...baseWhere, status: 'issued' } }),
      prisma.property_keys.count({ where: { ...baseWhere, status: 'available' } }),
      prisma.property_keys.count({ where: { ...baseWhere, status: 'lost' } }),
      prisma.property_keys.aggregate({
        _sum: { depositAmount: true },
        where: {
          ...baseWhere,
          depositAmount: { not: null },
          depositRefunded: false
        }
      }),
      prisma.property_keys.groupBy({
        by: ['keyType'],
        where: baseWhere,
        _count: true
      })
    ]);

    return res.json({
      totalKeys,
      issuedKeys,
      availableKeys,
      lostKeys,
      depositHeld: depositAggregate._sum.depositAmount || 0,
      byType: typeBreakdown.map((item) => ({
        keyType: item.keyType,
        count: item._count
      }))
    });
  } catch (error: any) {
    console.error('Failed to load key stats:', error);
    return res.status(500).json({ error: 'Failed to fetch key statistics' });
  }
});

export default router;
