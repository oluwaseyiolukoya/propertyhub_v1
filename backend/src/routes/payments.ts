import express, { Response } from 'express';
import { randomUUID } from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { emitToCustomer, emitToUser } from '../lib/socket';

const router = express.Router();

router.use(authMiddleware);

// Get all payments (temporary stub until payments model is added)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    if (!userId || !customerId) return res.status(401).json({ error: 'Unauthorized' });

    if (!['owner', 'property owner', 'property_owner', 'manager', 'property_manager', 'admin', 'super_admin', 'tenant'].includes(role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, method, propertyId, startDate, endDate, search, type } = req.query as any;
    const page = Math.max(1, parseInt((req.query as any).page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt((req.query as any).pageSize || '10', 10)));

    const where: any = { customerId };

    if (status) where.status = status;
    if (method) where.paymentMethod = method;
    if (type) where.type = type;
    if (propertyId) where.propertyId = propertyId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { providerReference: { contains: String(search), mode: 'insensitive' } },
        { type: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    // Scope by role
    if (['owner', 'property owner', 'property_owner'].includes(role)) {
      // For subscription payments, they're already scoped by customerId (no propertyId)
      // For rent/other payments, scope by property ownership
      if (type !== 'subscription') {
        where.properties = { ownerId: userId };
      }
    } else if (['manager', 'property_manager'].includes(role)) {
      // Managers can only see property-related payments, not subscriptions
      if (type === 'subscription') {
        return res.json({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }
      where.properties = {
        property_managers: {
          some: { managerId: userId, isActive: true }
        }
      };
    } else if (role === 'tenant') {
      // Tenants can only see their own rent payments, not subscriptions
      if (type === 'subscription') {
        return res.json({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }
      where.tenantId = userId;
    }

    console.log('[Payments API] Query where clause:', JSON.stringify(where, null, 2));

    const [total, list] = await Promise.all([
      prisma.payments.count({ where }),
      prisma.payments.findMany({
        where,
        include: {
          leases: {
            select: {
              id: true,
              leaseNumber: true,
              users: { select: { id: true, name: true, email: true } },
              properties: { select: { id: true, name: true } },
              units: { select: { id: true, unitNumber: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      })
    ]);

    console.log('[Payments API] Found', total, 'payments, returning', list.length, 'items');
    if (type === 'subscription') {
      console.log('[Payments API] Subscription payments:', list.map(p => ({ id: p.id, amount: p.amount, status: p.status, paidAt: p.paidAt })));
    }

    return res.json({
      items: list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error('Get payments error:', error);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Record manual payment (for cash, bank transfer, etc.) - Manager/Owner only
router.post('/record', async (req: AuthRequest, res: Response) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    if (!userId || !customerId) return res.status(401).json({ error: 'Unauthorized' });

    // Only managers and owners can record manual payments
    if (!['owner', 'property owner', 'property_owner', 'manager', 'property_manager'].includes(role)) {
      return res.status(403).json({ error: 'Only managers and owners can record payments' });
    }

    const { leaseId, amount, paymentMethod, paymentDate, notes, type = 'rent' } = req.body;

    if (!leaseId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'leaseId, amount, and paymentMethod are required' });
    }

    // Validate payment method
    const validMethods = ['cash', 'bank_transfer', 'cheque', 'mobile_money', 'other'];
    if (!validMethods.includes(paymentMethod.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Fetch lease details
    const lease = await prisma.leases.findUnique({
      where: { id: leaseId },
      include: {
        properties: { select: { id: true, name: true, ownerId: true } },
        units: { select: { id: true, unitNumber: true } },
        users: { select: { id: true, name: true, email: true } }
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Verify access rights
    if (['owner', 'property owner', 'property_owner'].includes(role)) {
      if (lease.properties.ownerId !== userId) {
        return res.status(403).json({ error: 'You can only record payments for your properties' });
      }
    } else if (['manager', 'property_manager'].includes(role)) {
      const assignment = await prisma.property_managers.findFirst({
        where: {
          propertyId: lease.propertyId,
          managerId: userId,
          isActive: true
        }
      });
      if (!assignment) {
        return res.status(403).json({ error: 'You can only record payments for properties you manage' });
      }
    }

    // Create payment record
    const reference = `PH-MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const paidAt = paymentDate ? new Date(paymentDate) : new Date();

    const payment = await prisma.payments.create({
      data: {
        id: randomUUID(),
        customerId,
        propertyId: lease.propertyId,
        unitId: lease.unitId,
        leaseId: lease.id,
        tenantId: lease.tenantId,
        amount: parseFloat(amount),
        currency: lease.currency || 'NGN',
        status: 'success',
        type: type || 'rent',
        paymentMethod: paymentMethod.toLowerCase(),
        provider: 'manual',
        providerReference: reference,
        paidAt,
        metadata: {
          recordedBy: userId,
          recordedByRole: role,
          notes: notes || null
        } as any
      ,
        updatedAt: new Date()
      },
      include: {
        leases: {
          select: {
            id: true,
            leaseNumber: true,
            users: { select: { id: true, name: true, email: true } },
            properties: { select: { id: true, name: true } },
            units: { select: { id: true, unitNumber: true } }
          }
        }
      }
    });

    // Emit real-time updates
    emitToCustomer(customerId, 'payment:updated', payment);
    if (lease.tenantId) {
      emitToUser(lease.tenantId, 'payment:updated', payment);
    }

    return res.status(201).json({ success: true, payment });
  } catch (error: any) {
    console.error('Record payment error:', error);
    return res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Initialize tenant payment via Paystack
router.post('/initialize', async (req: AuthRequest, res: Response) => {
  try {
    // Ensure real database is configured
    const hasPrismaPayments = (prisma as any)?.payments?.create && (prisma as any)?.payment_settings?.findFirst;
    if (!hasPrismaPayments) {
      return res.status(503).json({
        error: 'Database not configured for payments. Set DATABASE_URL and run Prisma migrations.',
        action: 'Create backend/.env with DATABASE_URL, then: cd backend && npx prisma generate && npx prisma migrate dev',
      });
    }

    const user = req.user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { leaseId, amount, currency } = req.body || {};
    if (!leaseId) return res.status(400).json({ error: 'leaseId is required' });

    // Load lease, tenant, property, customer
    const lease = await prisma.leases.findUnique({
      where: { id: leaseId },
      include: {
        users: { select: { id: true, email: true, name: true } },
        properties: { select: { id: true, customerId: true, ownerId: true, currency: true } },
        units: { select: { id: true, unitNumber: true } }
      }
    });
    if (!lease) return res.status(404).json({ error: 'Lease not found' });

    const customerId = lease.properties.customerId;
    const tenant = lease.users;
    const property = lease.properties;
    const unit = lease.units;

    // Ensure tenant or manager/owner can initiate
    const role = (user.role || '').toLowerCase();
    if (!['tenant', 'manager', 'property_manager', 'owner', 'property owner', 'property_owner', 'admin', 'super_admin'].includes(role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Payment settings
    const settings = await prisma.payment_settings.findFirst({
      where: { customerId, provider: 'paystack', isEnabled: true }
    });
    if (!settings?.secretKey || !settings?.publicKey) {
      return res.status(400).json({ error: 'Owner has not configured Paystack' });
    }

    // Determine amount and currency
    const payAmount = typeof amount === 'number' && amount > 0 ? amount : lease.monthlyRent;
    let payCurrency = (currency || lease.currency || property.currency || 'NGN').toUpperCase();
    // Enforce Paystack-supported currencies; default to NGN
    const supportedCurrencies = new Set(['NGN']);
    if (!supportedCurrencies.has(payCurrency)) {
      payCurrency = 'NGN';
    }

    // Create pending payment record
    const reference = `PH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await prisma.payments.create({
        data: {
          id: randomUUID(),
          customerId,
          propertyId: property.id,
          unitId: unit?.id || null,
          leaseId: lease.id,
          tenantId: tenant.id,
          amount: payAmount,
          currency: payCurrency,
          status: 'pending',
          type: 'rent',
          provider: 'paystack',
          providerReference: reference,
          metadata: {
            leaseNumber: lease.leaseNumber,
            unitNumber: unit?.unitNumber
          } as any,
          updatedAt: new Date()
        }
      });
    } catch (err: any) {
      // Prisma code P2021: table does not exist; P2022: column does not exist
      if (err?.code === 'P2021' || err?.code === 'P2022') {
        console.error('Payments table missing or out of date. Run migrations.', err?.meta || err);
        return res.status(503).json({
          error: 'Database not migrated for payments. Please run prisma migrate.',
          action: 'Execute: cd backend && npx prisma migrate dev',
        });
      }
      throw err;
    }

    // Initialize transaction on Paystack
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const callbackUrl = `${frontendUrl}/?payment_ref=${encodeURIComponent(reference)}`;

    let resp: any;
    try {
      resp = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: tenant.email || `${tenant.id}@tenant.local`,
        amount: Math.round(payAmount * 100),
        currency: payCurrency,
        reference,
        callback_url: callbackUrl,
        metadata: {
          customerId,
          leaseId: lease.id,
          propertyId: property.id,
          unitId: unit?.id,
          tenantId: tenant.id,
          type: 'rent'
        }
      })
      } as any);
    } catch (err: any) {
      console.error('Paystack init network error:', err?.message || err);
      try {
        await prisma.payments.updateMany({
          where: { customerId, provider: 'paystack', providerReference: reference },
          data: { status: 'failed', updatedAt: new Date() }
        });
      } catch {}
      return res.status(400).json({ error: 'Network error initializing payment. Please try again.' });
    }

    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || !json?.status) {
      console.error('Paystack init error:', json);
      try {
        await prisma.payments.updateMany({
          where: { customerId, provider: 'paystack', providerReference: reference },
          data: { status: 'failed', updatedAt: new Date() }
        });
      } catch {}
      return res.status(400).json({ error: json?.message || 'Failed to initialize payment' });
    }

    return res.json({
      authorizationUrl: json.data?.authorization_url,
      reference,
      publicKey: settings.publicKey
    });
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.code === 'P2022') {
      console.error('Initialize payment failed due to missing migrations:', error?.meta || error);
      return res.status(503).json({
        error: 'Database not migrated for payments. Please run prisma migrate.',
        action: 'Execute: cd backend && npx prisma migrate dev',
      });
    }
    console.error('Initialize payment error:', error?.message || error);
    return res.status(500).json({ error: 'Failed to initialize payment', details: error?.message || String(error) });
  }
});

// Initialize subscription payment (Admin/platform-level)
router.post('/subscription/initialize', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { customerId, invoiceId } = req.body || {};
    if (!customerId || !invoiceId) return res.status(400).json({ error: 'customerId and invoiceId are required' });

    // Load invoice
    const invoice = await prisma.invoices.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.customerId !== customerId) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Load system-level paystack keys from system_settings
    const system = await prisma.system_settings.findUnique({ where: { key: 'payments.paystack' } });
    const conf = (system?.value as any) || {};
    if (!conf.secretKey || !conf.publicKey) {
      return res.status(400).json({ error: 'Platform Paystack keys not configured' });
    }

    const reference = `PH-SUB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await prisma.payments.create({
      data: {
        id: randomUUID(),
        customerId,
        invoiceId,
        amount: invoice.amount,
        currency: invoice.currency || 'NGN',
        status: 'pending',
        type: 'subscription',
        provider: 'paystack',
        providerReference: reference,
        metadata: { billingPeriod: invoice.billingPeriod } as any,
        updatedAt: new Date()
      }
    });

    const resp = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${conf.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'billing@customer.local',
        amount: Math.round(invoice.amount * 100),
        currency: invoice.currency || 'NGN',
        reference,
        metadata: { customerId, invoiceId, type: 'subscription' }
      })
    } as any);

    const json = await resp.json() as any;
    if (!resp.ok || !json?.status) {
      console.error('Paystack init (subscription) error:', json);
      return res.status(400).json({ error: json?.message || 'Failed to initialize subscription payment' });
    }

    return res.json({ authorizationUrl: json.data?.authorization_url, reference, publicKey: conf.publicKey });
  } catch (error: any) {
    console.error('Initialize subscription error:', error);
    return res.status(500).json({ error: 'Failed to initialize subscription payment' });
  }
});

// Get single payment
router.get('/id/:id', async (req: AuthRequest, res: Response) => {
  try {
    console.warn('Payments model not implemented yet - returning 404');
    return res.status(404).json({ error: 'Payment not found or access denied' });
  } catch (error: any) {
    console.error('Get payment error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Verify payment status with Paystack by reference and update DB
router.get('/verify/:reference', async (req: AuthRequest, res: Response) => {
  try {
    const { reference } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    if (!userId || !customerId) return res.status(401).json({ error: 'Unauthorized' });

    // Find pending/any payment by reference within the same customer
    const payment = await prisma.payments.findFirst({
      where: { customerId, provider: 'paystack', providerReference: reference },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    // Get secret key: owner-level for rent/fees, system-level for subscriptions
    let secretKey: string | undefined;
    if (payment.type === 'subscription') {
      const system = await prisma.system_settings.findUnique({ where: { key: 'payments.paystack' } });
      secretKey = (system?.value as any)?.secretKey;
    } else {
      const settings = await prisma.payment_settings.findFirst({ where: { customerId, provider: 'paystack' } });
      secretKey = settings?.secretKey;
    }
    if (!secretKey) return res.status(400).json({ error: 'Paystack configuration not found' });

    // Call Paystack verify
    const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    } as any);
    const json = await resp.json().catch(() => ({})) as any;
    if (!resp.ok || !json?.status) {
      return res.status(400).json({ error: json?.message || 'Verification failed' });
    }

    const data = json.data || {};
    // Map Paystack status
    // success | failed | abandoned | reversed (map abandoned/reversed to failed/pending decisions)
    let mappedStatus: 'success' | 'failed' | 'pending' = 'pending';
    if (data.status === 'success') mappedStatus = 'success';
    else if (data.status === 'failed' || data.status === 'reversed' || data.gateway_response === 'Abandoned') mappedStatus = 'failed';
    else if (data.status === 'abandoned') mappedStatus = 'failed';

    // Update DB record
    const updated = await prisma.payments.updateMany({
      where: { customerId, provider: 'paystack', providerReference: reference },
      data: {
        status: mappedStatus,
        currency: data.currency || payment.currency,
        providerFee: data.fees || payment.providerFee || undefined,
        paymentMethod: data.channel || payment.paymentMethod || undefined,
        paidAt: data.paid_at ? new Date(data.paid_at) : mappedStatus === 'success' ? new Date() : payment.paidAt || undefined,
        updatedAt: new Date(),
      }
    });

    // Emit realtime update
    try {
      emitToCustomer(customerId, 'payment:updated', { reference, status: mappedStatus });
      if (payment.tenantId) emitToUser(payment.tenantId, 'payment:updated', { reference, status: mappedStatus });
    } catch {}

    return res.json({ reference, status: mappedStatus });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Get payment by provider reference
router.get('/by-reference/:reference', async (req: AuthRequest, res: Response) => {
  try {
    const { reference } = req.params;
    const userId = req.user?.id;
    const role = (req.user?.role || '').toLowerCase();
    const customerId = req.user?.customerId;

    if (!userId || !customerId) return res.status(401).json({ error: 'Unauthorized' });

    const where: any = { customerId, providerReference: reference };
    // Scope by role
    if (['owner', 'property owner', 'property_owner'].includes(role)) {
      where.properties = { ownerId: userId };
    } else if (['manager', 'property_manager'].includes(role)) {
      where.properties = { property_managers: { some: { managerId: userId, isActive: true } } };
    } else if (role === 'tenant') {
      where.tenantId = userId;
    }

    const payment = await prisma.payments.findFirst({
      where,
      select: {
        id: true,
        providerReference: true,
        status: true,
        amount: true,
        currency: true,
        type: true,
        paidAt: true,
      },
    });

    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    return res.json(payment);
  } catch (error: any) {
    console.error('Get payment by reference error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create payment (record payment)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    return res.status(400).json({ error: 'Payments not implemented yet' });
  } catch (error: any) {
    console.error('Create payment error:', error);
    return res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Update payment
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    // Only managers/owners can update payments
    if (role === 'tenant') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Not implemented yet
    return res.status(400).json({ error: 'Payments not implemented yet' });

  } catch (error: any) {
    console.error('Update payment error:', error);
    return res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Get payment statistics
router.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, startDate, endDate } = req.query as any;
    const userId = req.user?.id;
    const role = (req.user?.role || '').toLowerCase();
    const customerId = req.user?.customerId;

    if (!userId || !customerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!['owner', 'property owner', 'property_owner', 'manager', 'property_manager', 'admin', 'super_admin'].includes(role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const baseWhere: any = { customerId };
    if (propertyId) baseWhere.propertyId = propertyId;
    if (startDate || endDate) {
      baseWhere.createdAt = {};
      if (startDate) baseWhere.createdAt.gte = new Date(startDate);
      if (endDate) baseWhere.createdAt.lte = new Date(endDate);
    }

    // Scope by role
    if (['owner', 'property owner', 'property_owner'].includes(role)) {
      baseWhere.properties = { ownerId: userId };
    } else if (['manager', 'property_manager'].includes(role)) {
      baseWhere.properties = {
        property_managers: { some: { managerId: userId, isActive: true } }
      };
    }

    const [totalCollectedAgg, pendingAgg, byMethod, byType, recent] = await Promise.all([
      prisma.payments.aggregate({ _sum: { amount: true }, where: { ...baseWhere, status: 'success' } }),
      prisma.payments.aggregate({ _sum: { amount: true }, where: { ...baseWhere, status: 'pending' } }),
      prisma.payments.groupBy({ by: ['paymentMethod'], where: { ...baseWhere, status: 'success' }, _sum: { amount: true }, _count: true }),
      prisma.payments.groupBy({ by: ['type'], where: { ...baseWhere, status: 'success' }, _sum: { amount: true }, _count: true }),
      prisma.payments.findMany({
        where: { ...baseWhere, status: 'success' },
        include: {
          leases: {
            select: {
              id: true,
              leaseNumber: true,
              users: { select: { id: true, name: true } },
              properties: { select: { id: true, name: true } },
              units: { select: { id: true, unitNumber: true } }
            }
          }
        },
        orderBy: { paidAt: 'desc' },
        take: 10
      })
    ]);

    return res.json({
      totalCollected: totalCollectedAgg._sum.amount || 0,
      pendingAmount: pendingAgg._sum.amount || 0,
      lateFees: 0,
      byMethod: byMethod.map((m: any) => ({ method: m.paymentMethod || 'Unknown', amount: m._sum.amount || 0, count: m._count })),
      byType: byType.map((t: any) => ({ type: t.type || 'Unknown', amount: t._sum.amount || 0, count: t._count })),
      recentPayments: recent
    });

    /* COMMENTED OUT UNTIL SCHEMA IS UPDATED
    const where: any = {};

    if (role === 'owner') {
      where.lease = { property: { ownerId: userId } };
    } else if (role === 'manager') {
      where.lease = {
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

    if (propertyId) {
      where.lease = { ...where.lease, propertyId };
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    // Total collected
    const totalCollected = await prisma.payment.aggregate({
      where: { ...where, status: 'completed' },
      _sum: { amount: true }
    });

    // Pending payments
    const pendingAmount = await prisma.payment.aggregate({
      where: { ...where, status: 'pending' },
      _sum: { amount: true }
    });

    // Late fees collected
    const lateFees = await prisma.payment.aggregate({
      where: { ...where, status: 'completed' },
      _sum: { lateFeesIncluded: true }
    });

    // Payment by method
    const byMethod = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: { ...where, status: 'completed' },
      _sum: { amount: true },
      _count: true
    });

    // Payment by type
    const byType = await prisma.payment.groupBy({
      by: ['type'],
      where: { ...where, status: 'completed' },
      _sum: { amount: true },
      _count: true
    });

    // Recent payments
    const recentPayments = await prisma.payment.findMany({
      where: { ...where, status: 'completed' },
      include: {
        lease: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true
              }
            },
            property: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' },
      take: 10
    });

    return res.json({
      totalCollected: totalCollected._sum.amount || 0,
      pendingAmount: pendingAmount._sum.amount || 0,
      lateFees: lateFees._sum.lateFeesIncluded || 0,
      byMethod: byMethod.map(m => ({
        method: m.paymentMethod,
        amount: m._sum.amount || 0,
        count: m._count
      })),
      byType: byType.map(t => ({
        type: t.type,
        amount: t._sum.amount || 0,
        count: t._count
      })),
      recentPayments
    });
    */

  } catch (error: any) {
    console.error('Get payment stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
});

// Get overdue payments
router.get('/overdue/list', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'property owner' && role !== 'property_owner' && role !== 'manager' && role !== 'property_manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const where: any = {
      status: 'active'
    };

    if (role === 'owner' || role === 'property owner' || role === 'property_owner') {
      where.properties = { ownerId: userId };
    } else if (role === 'manager' || role === 'property_manager') {
      where.properties = {
        property_managers: {
          some: {
            managerId: userId,
            isActive: true
          }
        }
      };
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    // Get active leases (use correct pluralized models)
    const leases = await prisma.leases.findMany({
      where,
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

    // Calculate overdue
    const currentDate = new Date();
    const overdueLeases = leases.map(lease => {
      const daysSincePayment = Math.floor((currentDate.getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24));

      const isOverdue = daysSincePayment > 30; // More than 30 days

      return {
        leaseId: lease.id,
        tenant: lease.users,
        property: lease.properties,
        unit: lease.units,
        monthlyRent: lease.monthlyRent,
        lastPaymentDate: null,
        daysSincePayment,
        isOverdue,
        estimatedOverdueAmount: isOverdue ? lease.monthlyRent * Math.floor(daysSincePayment / 30) : 0
      };
    }).filter(l => l.isOverdue);

    return res.json(overdueLeases);

  } catch (error: any) {
    console.error('Get overdue payments error:', error);
    return res.status(500).json({ error: 'Failed to fetch overdue payments' });
  }
});

export default router;


