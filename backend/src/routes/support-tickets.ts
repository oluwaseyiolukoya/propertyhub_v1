import express, { Response } from 'express';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

// Get all support tickets
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, status, priority, category } = req.query;

    const where: any = {};
    if (customerId) where.customerId = customerId as string;
    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (category) where.category = category as string;

    const tickets = await prisma.supportTicket.findMany({
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

    return res.json(tickets);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// Get single ticket
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        customer: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.json(ticket);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create ticket
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId,
      subject,
      description,
      category,
      priority,
      assignedTo,
      tags,
      attachments
    } = req.body;

    if (!customerId || !subject || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now()}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        customerId,
        ticketNumber,
        subject,
        description,
        category: category || 'other',
        priority: priority || 'medium',
        assignedTo,
        tags: tags || [],
        attachments: attachments || []
      },
      include: {
        customer: true
      }
    });

    return res.status(201).json(ticket);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Update ticket
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      assignedTo,
      resolution,
      tags
    } = req.body;

    const data: any = {
      status,
      priority,
      assignedTo,
      resolution,
      tags
    };

    if (status === 'resolved' && !data.resolvedAt) {
      data.resolvedAt = new Date();
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data
    });

    return res.json(ticket);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update ticket' });
  }
});

export default router;


