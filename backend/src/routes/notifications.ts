import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);

// Get all notifications for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, priority } = req.query;
    const userId = req.user?.id;

    const where: any = {
      recipientId: userId
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.json(notifications);

  } catch (error: any) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread/count', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const count = await prisma.notification.count({
      where: {
        recipientId: userId,
        status: 'unread'
      }
    });

    return res.json({ count });

  } catch (error: any) {
    console.error('Get unread count error:', error);
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Create notification (send)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Only owners and managers can send notifications' });
    }

    const {
      recipientIds,
      title,
      message,
      type,
      priority,
      channels,
      propertyId,
      metadata
    } = req.body;

    if (!recipientIds || recipientIds.length === 0 || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create notifications for all recipients
    const notifications = await Promise.all(
      recipientIds.map((recipientId: string) =>
        prisma.notification.create({
          data: {
            recipientId,
            senderId: userId,
            title,
            message,
            type: type || 'general',
            priority: priority || 'medium',
            status: 'unread',
            channels: channels || ['in_app'],
            propertyId,
            metadata
          },
          include: {
            recipient: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      )
    );

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'send',
        entity: 'notification',
        entityId: notifications[0]?.id,
        description: `Notification sent to ${recipientIds.length} recipient(s): ${title}`
      }
    });

    return res.status(201).json(notifications);

  } catch (error: any) {
    console.error('Create notification error:', error);
    return res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        recipientId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        status: 'read',
        readAt: new Date()
      }
    });

    return res.json(updated);

  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all as read
router.post('/mark-all-read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        status: 'unread'
      },
      data: {
        status: 'read',
        readAt: new Date()
      }
    });

    return res.json({ message: 'All notifications marked as read' });

  } catch (error: any) {
    console.error('Mark all as read error:', error);
    return res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        recipientId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({ where: { id } });

    return res.json({ message: 'Notification deleted' });

  } catch (error: any) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get notification templates
router.get('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const templates = await prisma.notificationTemplate.findMany({
      where: {
        OR: [
          { customerId },
          { isGlobal: true }
        ]
      },
      orderBy: { name: 'asc' }
    });

    return res.json(templates);

  } catch (error: any) {
    console.error('Get notification templates error:', error);
    return res.status(500).json({ error: 'Failed to fetch notification templates' });
  }
});

// Create notification template
router.post('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      name,
      description,
      subject,
      body,
      type,
      variables
    } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        customerId,
        createdById: userId,
        name,
        description,
        subject,
        body,
        type: type || 'general',
        variables,
        isGlobal: false
      }
    });

    return res.status(201).json(template);

  } catch (error: any) {
    console.error('Create notification template error:', error);
    return res.status(500).json({ error: 'Failed to create notification template' });
  }
});

// Get notification statistics
router.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const customerId = req.user?.customerId;
    
    // Get sent notifications count (for managers/owners)
    const sentCount = await prisma.notification.count({
      where: { senderId: userId }
    });

    // Get received notifications count
    const receivedCount = await prisma.notification.count({
      where: { recipientId: userId }
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        status: 'unread'
      }
    });

    // Get by type
    const byType = await prisma.notification.groupBy({
      by: ['type'],
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId }
        ]
      },
      _count: true
    });

    return res.json({
      sent: sentCount,
      received: receivedCount,
      unread: unreadCount,
      byType: byType.map(t => ({ type: t.type, count: t._count }))
    });

  } catch (error: any) {
    console.error('Get notification stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

export default router;


