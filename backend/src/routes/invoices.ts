import express, { Response } from 'express';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

// Get all invoices
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, status } = req.query;

    const where: any = {};
    if (customerId) where.customerId = customerId as string;
    if (status) where.status = status as string;

    // Select explicit columns to remain compatible if DB migration for new fields isn't applied yet
    const invoices = await prisma.invoices.findMany({
      where,
      select: {
        id: true,
        customerId: true,
        invoiceNumber: true,
        amount: true,
        currency: true,
        status: true,
        dueDate: true,
        paidAt: true,
        billingPeriod: true,
        description: true,
        items: true,
        createdAt: true,
        updatedAt: true,
        // include refunds to compute refunded totals
        refunds: {
          select: { amount: true }
        },
        customers: {
          select: { id: true, company: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(invoices);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Create invoice
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId,
      amount,
      currency,
      dueDate,
      billingPeriod,
      description,
      items
    } = req.body;

    if (!customerId || !amount || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await prisma.invoices.create({
      data: {
        customerId,
        invoiceNumber,
        amount,
        currency: currency || 'NGN',
        dueDate: new Date(dueDate),
        billingPeriod,
        description,
        items: items || []
      },
      include: {
        customers: true
      }
    });

    return res.status(201).json(invoice);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update invoice
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paidAt } = req.body;

    const invoice = await prisma.invoices.update({
      where: { id },
      data: {
        status,
        paidAt: paidAt ? new Date(paidAt) : null
      }
    });

    return res.json(invoice);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Create a refund for an invoice (full or partial)
router.post('/:id/refunds', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, currency, reason } = req.body;

    // Select only guaranteed columns (schema compatibility if migrations not applied)
    const invoice = await prisma.invoices.findUnique({
      where: { id },
      select: {
        id: true,
        customerId: true,
        invoiceNumber: true,
        amount: true,
        currency: true,
        createdAt: true
      }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const refundAmount = Number(amount);
    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ error: 'Invalid refund amount' });
    }

    // Sum existing refunds (tolerate missing refunds table if migration not applied)
    let totalRefunded = 0;
    try {
      const existingRefunds = await (prisma as any).refunds.findMany({ where: { invoiceId: id } });
      totalRefunded = Array.isArray(existingRefunds)
        ? existingRefunds.reduce((s: number, r: any) => s + (r.amount || 0), 0)
        : 0;
    } catch (e) {
      console.warn('Refunds table not available yet; proceeding without historical refunds');
    }
    const remaining = invoice.amount - totalRefunded;
    // Allow a tiny epsilon for rounding
    if (refundAmount - remaining > 0.00001) {
      return res.status(400).json({ error: `Refund amount exceeds remaining charge. Remaining: ${remaining}` });
    }

    // Create refund
    let refund: any = null;
    try {
      refund = await (prisma as any).refunds.create({
        data: {
          invoiceId: id,
          amount: refundAmount,
          currency: currency || invoice.currency,
          reason: reason || null,
          actorId: (req as any).user?.id || null
        }
      });
    } catch (e) {
      console.warn('Unable to persist refund record; likely missing migration');
    }

    // Update invoice status
    const newTotalRefunded = totalRefunded + refundAmount;
    const isFull = Math.abs(newTotalRefunded - invoice.amount) < 0.00001;
    let updatedInvoice: any = null;
    try {
      updatedInvoice = await prisma.invoices.update({
        where: { id },
        data: {
          status: isFull ? 'refunded' : 'partially_refunded',
          // Try including refundedAt (may fail if column missing)
          // @ts-ignore
          refundedAt: new Date()
        }
      });
    } catch (e) {
      // Retry without refundedAt for backward compatibility
      updatedInvoice = await prisma.invoices.update({
        where: { id },
        data: {
          status: isFull ? 'refunded' : 'partially_refunded'
        }
      });
    }

    // Activity log
    try {
      await prisma.activity_logs.create({
        data: {
          customerId: invoice.customerId,
          action: 'refund',
          entity: 'invoice',
          entityId: invoice.id,
          description: `Invoice ${invoice.invoiceNumber} ${isFull ? 'refunded' : 'partially refunded'} (${refundAmount} ${currency || invoice.currency})`,
          metadata: { refundId: refund?.id || null, amount: refundAmount, reason: reason || null }
        }
      });
    } catch {}

    return res.status(201).json({ refund, invoice: updatedInvoice });
  } catch (error: any) {
    console.error('Refund error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to create refund' });
  }
});

// List refunds for an invoice
router.get('/:id/refunds', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const refunds = await prisma.refunds.findMany({
      where: { invoiceId: id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(refunds);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch refunds' });
  }
});

export default router;


