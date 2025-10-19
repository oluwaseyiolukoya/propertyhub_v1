import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.use(authMiddleware);

// Get tenant dashboard overview
router.get('/dashboard/overview', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    // Get tenant's active lease
    const activeLease = await prisma.lease.findFirst({
      where: {
        tenantId: userId,
        status: 'active'
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            coverImage: true,
            features: true
          }
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            type: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
            features: true
          }
        }
      }
    });

    if (!activeLease) {
      return res.json({
        hasActiveLease: false,
        message: 'No active lease found'
      });
    }

    // Calculate days until rent due (assuming rent due on 1st of month)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysUntilDue = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Get last payment
    const lastPayment = await prisma.payment.findFirst({
      where: {
        leaseId: activeLease.id,
        status: 'completed'
      },
      orderBy: { paymentDate: 'desc' }
    });

    // Calculate payment status
    const daysSinceLastPayment = lastPayment
      ? Math.floor((today.getTime() - new Date(lastPayment.paymentDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const isOverdue = daysSinceLastPayment > 30;

    // Get total paid this year
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const totalPaidThisYear = await prisma.payment.aggregate({
      where: {
        leaseId: activeLease.id,
        status: 'completed',
        paymentDate: { gte: yearStart }
      },
      _sum: { amount: true }
    });

    // Get pending maintenance requests
    const pendingMaintenance = await prisma.maintenanceRequest.count({
      where: {
        reportedById: userId,
        status: { in: ['open', 'in_progress'] }
      }
    });

    // Get recent maintenance requests
    const recentMaintenance = await prisma.maintenanceRequest.findMany({
      where: {
        reportedById: userId
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true
      }
    });

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        leaseId: activeLease.id,
        status: 'completed'
      },
      orderBy: { paymentDate: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        paymentMethod: true,
        type: true,
        confirmationNumber: true
      }
    });

    // Get unread notifications count
    const unreadNotifications = await prisma.notification.count({
      where: {
        recipientId: userId,
        status: 'unread'
      }
    });

    // Get recent announcements
    const announcements = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        type: 'announcement'
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        message: true,
        priority: true,
        createdAt: true
      }
    });

    // Calculate lease expiration
    const leaseEndDate = new Date(activeLease.endDate);
    const daysUntilLeaseEnd = Math.ceil((leaseEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return res.json({
      hasActiveLease: true,
      lease: {
        id: activeLease.id,
        leaseNumber: activeLease.leaseNumber,
        startDate: activeLease.startDate,
        endDate: activeLease.endDate,
        monthlyRent: activeLease.monthlyRent,
        securityDeposit: activeLease.securityDeposit,
        daysUntilLeaseEnd,
        isExpiringSoon: daysUntilLeaseEnd <= 60
      },
      property: activeLease.property,
      unit: activeLease.unit,
      rent: {
        monthlyAmount: activeLease.monthlyRent,
        daysUntilDue,
        nextPaymentDue: nextMonth.toISOString().split('T')[0],
        lastPaymentDate: lastPayment?.paymentDate || null,
        isOverdue,
        totalPaidThisYear: totalPaidThisYear._sum.amount || 0
      },
      maintenance: {
        pending: pendingMaintenance,
        recent: recentMaintenance
      },
      payments: {
        recent: recentPayments
      },
      notifications: {
        unread: unreadNotifications,
        announcements
      }
    });

  } catch (error: any) {
    console.error('Get tenant dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch tenant dashboard' });
  }
});

// Get tenant profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    const tenant = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        avatar: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        preferences: true,
        tenantLeases: {
          where: { status: 'active' },
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
            }
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    return res.json(tenant);

  } catch (error: any) {
    console.error('Get tenant profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch tenant profile' });
  }
});

// Update tenant profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    const {
      name,
      phone,
      avatar,
      emergencyContactName,
      emergencyContactPhone,
      preferences
    } = req.body;

    const tenant = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        avatar,
        emergencyContactName,
        emergencyContactPhone,
        preferences
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        preferences: true
      }
    });

    return res.json(tenant);

  } catch (error: any) {
    console.error('Update tenant profile error:', error);
    return res.status(500).json({ error: 'Failed to update tenant profile' });
  }
});

// Change password
router.post('/change-password', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return res.json({ message: 'Password changed successfully' });

  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get tenant lease details
router.get('/lease', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    const lease = await prisma.lease.findFirst({
      where: {
        tenantId: userId,
        status: 'active'
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            coverImage: true,
            features: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            type: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
            features: true,
            images: true
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'No active lease found' });
    }

    return res.json(lease);

  } catch (error: any) {
    console.error('Get tenant lease error:', error);
    return res.status(500).json({ error: 'Failed to fetch lease details' });
  }
});

// Get payment history
router.get('/payment-history', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, status } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    // Get tenant's active lease
    const lease = await prisma.lease.findFirst({
      where: {
        tenantId: userId,
        status: 'active'
      }
    });

    if (!lease) {
      return res.json([]);
    }

    const where: any = {
      leaseId: lease.id
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        paymentDate: true,
        type: true,
        status: true,
        confirmationNumber: true,
        transactionId: true,
        lateFeesIncluded: true,
        notes: true
      }
    });

    // Get payment statistics
    const totalPaid = await prisma.payment.aggregate({
      where: {
        leaseId: lease.id,
        status: 'completed'
      },
      _sum: { amount: true }
    });

    const totalLateFees = await prisma.payment.aggregate({
      where: {
        leaseId: lease.id,
        status: 'completed'
      },
      _sum: { lateFeesIncluded: true }
    });

    return res.json({
      payments,
      statistics: {
        totalPaid: totalPaid._sum.amount || 0,
        totalLateFees: totalLateFees._sum.lateFeesIncluded || 0,
        paymentCount: payments.length
      }
    });

  } catch (error: any) {
    console.error('Get payment history error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Submit payment (initiate payment)
router.post('/submit-payment', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    const { amount, paymentMethod, type, notes } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ error: 'Amount and payment method are required' });
    }

    // Get tenant's active lease
    const lease = await prisma.lease.findFirst({
      where: {
        tenantId: userId,
        status: 'active'
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'No active lease found' });
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}`;
    const confirmationNumber = `CONF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payment record (status: pending until confirmed)
    const payment = await prisma.payment.create({
      data: {
        leaseId: lease.id,
        amount,
        paymentMethod,
        paymentDate: new Date(),
        type: type || 'rent',
        status: 'pending', // Will be updated to 'completed' after payment gateway confirmation
        transactionId,
        confirmationNumber,
        notes,
        processedById: userId
      }
    });

    // In production, integrate with payment gateway here
    // For now, auto-complete the payment
    const completedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId,
        action: 'create',
        entity: 'payment',
        entityId: payment.id,
        description: `Payment of ${amount} submitted`
      }
    });

    return res.status(201).json({
      payment: completedPayment,
      message: 'Payment submitted successfully'
    });

  } catch (error: any) {
    console.error('Submit payment error:', error);
    return res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// Get tenant documents
router.get('/documents', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    // Get tenant's active lease
    const lease = await prisma.lease.findFirst({
      where: {
        tenantId: userId,
        status: 'active'
      },
      include: {
        property: true
      }
    });

    if (!lease) {
      return res.json({
        lease: null,
        receipts: [],
        notices: [],
        other: []
      });
    }

    // Get payment receipts
    const receipts = await prisma.payment.findMany({
      where: {
        leaseId: lease.id,
        status: 'completed'
      },
      orderBy: { paymentDate: 'desc' },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        confirmationNumber: true,
        transactionId: true,
        paymentMethod: true,
        type: true
      }
    });

    // Get documents from document management system (if implemented)
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { leaseId: lease.id },
          { propertyId: lease.propertyId, category: 'announcement' },
          { propertyId: lease.propertyId, category: 'policy' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      lease: {
        id: lease.id,
        leaseNumber: lease.leaseNumber,
        documentUrl: lease.documentUrl,
        startDate: lease.startDate,
        endDate: lease.endDate
      },
      receipts: receipts.map(r => ({
        id: r.id,
        type: 'receipt',
        name: `Payment Receipt - ${r.paymentDate}`,
        date: r.paymentDate,
        amount: r.amount,
        confirmationNumber: r.confirmationNumber
      })),
      documents: documents.map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
        url: d.url,
        createdAt: d.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Get tenant documents error:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

export default router;


