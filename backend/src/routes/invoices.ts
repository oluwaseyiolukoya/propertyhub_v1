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

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            company: true,
            email: true
          }
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

    const invoice = await prisma.invoice.create({
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
        customer: true
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

    const invoice = await prisma.invoice.update({
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

export default router;


