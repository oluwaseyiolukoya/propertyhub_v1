import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const router = express.Router();

router.use(authMiddleware);

// Helper function to calculate next payment due date
function calculateNextPaymentDue(lastPaymentDate: Date | null, leaseStartDate: Date, isAnnualRent: boolean): Date {
  const today = new Date();
  const leaseStart = new Date(leaseStartDate);

  if (lastPaymentDate) {
    // Calculate from last payment
    const nextDue = new Date(lastPaymentDate);
    if (isAnnualRent) {
      nextDue.setFullYear(nextDue.getFullYear() + 1);
    } else {
      nextDue.setMonth(nextDue.getMonth() + 1);
    }
    return nextDue;
  }

  // No payment yet - the first payment is due at lease start
  // If lease start is in the future, payment is due at lease start
  // If lease start is in the past, payment was due at lease start (overdue)
  // We return the lease start date to show the tenant they need to pay

  if (isAnnualRent) {
    // For annual rent with no payment:
    // - First payment is always due at lease start
    // - Return lease start date even if in the past (to show it's overdue)
    return leaseStart;
  } else {
    // For monthly rent with no payment:
    // - First payment is due at lease start
    // - If lease start is in the past, they're overdue from that date
    return leaseStart;
  }
}

// Get all tenants for property owner/manager (including assigned and unassigned)
router.get('/all', async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const role = req.user?.role;

    console.log('📋 Fetching all tenants for user:', { currentUserId, role });

    // Check if user is owner or manager
    if (role !== 'owner' && role !== 'manager' && role !== 'property_manager' && role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Property owners and managers only.' });
    }

    // Get all tenants with their leases
    // For owners: tenants who have leases in their properties
    // For managers: tenants who have leases in properties they manage
    const leases = await prisma.leases.findMany({
      where: {
        properties: {
          OR: [
            { ownerId: currentUserId },
            { property_managers: { some: { managerId: currentUserId, isActive: true } } }
          ]
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        },
        properties: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            currency: true
          }
        },
        units: {
          select: {
            id: true,
            unitNumber: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('✅ Found leases:', leases.length);
    return res.json({ data: leases });

  } catch (error: any) {
    console.error('❌ Failed to get all tenants:', error);
    return res.status(500).json({
      error: 'Failed to retrieve tenants',
      details: error.message
    });
  }
});

// Public, tenant-safe payment gateway info (owner-level)
router.get('/payment-gateway/public', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    // Find tenant's active lease to determine property owner (customer)
    const lease = await prisma.leases.findFirst({
      where: { tenantId: userId, status: 'active' },
      include: {
        properties: { select: { customerId: true } },
        units: { include: { properties: { select: { customerId: true } } } }
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'No active lease found' });
    }

    const ownerCustomerId = lease.properties?.customerId || lease.units?.properties?.customerId;
    if (!ownerCustomerId) {
      return res.status(400).json({ error: 'Property owner not found' });
    }

    // Get owner's Paystack settings (public key is safe for client)
    const settings = await prisma.payment_settings.findFirst({
      where: { customerId: ownerCustomerId, provider: 'paystack' },
      select: {
        publicKey: true,
        testMode: true,
        isEnabled: true,
        bankTransferTemplate: true,
        updatedAt: true
      }
    });

    if (!settings) {
      return res.json({ publicKey: null, testMode: false, isEnabled: false, bankTransferTemplate: null });
    }

    return res.json({
      publicKey: settings.publicKey || null,
      testMode: settings.testMode,
      isEnabled: settings.isEnabled,
      bankTransferTemplate: settings.bankTransferTemplate || null,
      updatedAt: settings.updatedAt
    });
  } catch (error: any) {
    console.error('❌ Tenant public payment gateway error:', error);
    return res.status(500).json({ error: 'Failed to load payment gateway settings' });
  }
});

// Get tenant dashboard overview
router.get('/dashboard/overview', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    // Get tenant's active lease
    const activeLease = await prisma.leases.findFirst({
      where: {
        tenantId: userId,
        status: 'active'
      },
      include: {
        properties: {
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
        units: {
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

    const today = new Date();

    // Get rent frequency from unit features
    const unitFeatures = activeLease.units?.features as any;
    const rentFrequency = unitFeatures?.nigeria?.rentFrequency || unitFeatures?.rentFrequency || 'monthly';
    const isAnnualRent = rentFrequency === 'annual';

    // Get the last successful payment and scheduled payment for this lease
    let lastPayment: any = null;
    let scheduledPayment: any = null;
    let recentPayments: any[] = [];
    let totalPaidThisYear = { _sum: { amount: 0 } };

    try {
      // Get last successful rent payment
      lastPayment = await prisma.payments.findFirst({
        where: {
          leaseId: activeLease.id,
          type: 'rent',
          status: 'success'
        },
        orderBy: { paidAt: 'desc' }
      });

      // Get scheduled payment (next payment due)
      scheduledPayment = await prisma.payments.findFirst({
        where: {
          leaseId: activeLease.id,
          type: 'rent',
          status: 'scheduled'
        },
        orderBy: { createdAt: 'desc' }
      });

      // Get recent payments
      const recentPaymentsList = await prisma.payments.findMany({
        where: {
          leaseId: activeLease.id,
          type: 'rent',
          status: { in: ['success', 'paid'] }
        },
        orderBy: { paidAt: 'desc' },
        take: 5
      });
      recentPayments = recentPaymentsList.map(p => ({
        id: p.id,
        amount: p.amount,
        paymentDate: p.paidAt,
        paymentMethod: p.paymentMethod || p.provider
      }));

      // Get total paid this year
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      totalPaidThisYear = await prisma.payments.aggregate({
        where: {
          leaseId: activeLease.id,
          type: 'rent',
          status: { in: ['success', 'paid'] },
          paidAt: { gte: startOfYear }
        },
        _sum: { amount: true }
      });
    } catch (paymentError) {
      console.error('Error fetching payment data:', paymentError);
    }

    // Calculate next payment due date
    let nextPaymentDue: Date;

    // Check if there's a scheduled payment
    if (scheduledPayment?.metadata) {
      const metadata = scheduledPayment.metadata as any;
      if (metadata.scheduledDate) {
        nextPaymentDue = new Date(metadata.scheduledDate);
      } else {
        // Fallback calculation
        nextPaymentDue = calculateNextPaymentDue(lastPayment?.paidAt, activeLease.startDate, isAnnualRent);
      }
    } else if (lastPayment?.paidAt) {
      // Calculate from last payment
      nextPaymentDue = calculateNextPaymentDue(lastPayment.paidAt, activeLease.startDate, isAnnualRent);
    } else {
      // No payments yet - due from lease start or 1st of next month
      nextPaymentDue = calculateNextPaymentDue(null, activeLease.startDate, isAnnualRent);
    }

    const daysUntilDue = Math.ceil((nextPaymentDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntilDue < 0;

    // Get maintenance data
    let pendingMaintenance = 0;
    let recentMaintenance: any[] = [];
    try {
      pendingMaintenance = await prisma.maintenance_requests.count({
        where: {
          OR: [
            { reportedById: userId },
            { unitId: activeLease.unitId }
          ],
          status: { notIn: ['completed', 'cancelled'] }
        }
      });

      const maintenanceList = await prisma.maintenance_requests.findMany({
        where: {
          OR: [
            { reportedById: userId },
            { unitId: activeLease.unitId }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      recentMaintenance = maintenanceList;
    } catch (maintenanceError) {
      console.error('Error fetching maintenance data:', maintenanceError);
    }

    const unreadNotifications = 0;
    const announcements: any[] = [];

    // Calculate lease expiration
    const leaseEndDate = new Date(activeLease.endDate);
    const daysUntilLeaseEnd = Math.ceil((leaseEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Get tenant user information
    const tenantUser = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true
      }
    });

    return res.json({
      hasActiveLease: true,
      user: tenantUser,
      lease: {
        id: activeLease.id,
        leaseNumber: activeLease.leaseNumber,
        startDate: activeLease.startDate,
        endDate: activeLease.endDate,
        monthlyRent: activeLease.monthlyRent,
        securityDeposit: activeLease.securityDeposit,
        currency: activeLease.currency,
        daysUntilLeaseEnd,
        isExpiringSoon: daysUntilLeaseEnd <= 60,
        rentFrequency: rentFrequency // 'monthly' or 'annual'
      },
      property: activeLease.properties,
      unit: {
        ...activeLease.units,
        rentFrequency: rentFrequency // Also include at unit level for convenience
      },
      rent: {
        monthlyAmount: activeLease.monthlyRent,
        daysUntilDue,
        nextPaymentDue: nextPaymentDue.toISOString().split('T')[0],
        lastPaymentDate: lastPayment?.paidAt || null,
        isOverdue,
        totalPaidThisYear: totalPaidThisYear._sum?.amount || 0,
        rentFrequency
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
    console.error('❌ Get tenant dashboard error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    return res.status(500).json({
      error: 'Failed to fetch tenant dashboard',
      details: error.message
    });
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

    const tenant = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        leases: {
          where: { status: 'active' },
          include: {
            properties: {
              select: {
                id: true,
                name: true,
                address: true
              }
            },
            units: {
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

    const tenant = await prisma.users.update({
      where: { id: userId },
      data: {
        name,
        phone
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true
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
    const user = await prisma.users.findUnique({
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
    await prisma.users.update({
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

    const lease = await prisma.leases.findFirst({
      where: {
        tenantId: userId,
        status: 'active'
      },
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            coverImage: true,
            features: true
          }
        },
        units: {
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

    // TODO: payments table doesn't exist yet
    return res.json({
      payments: [],
      statistics: {
        totalPaid: 0,
        totalLateFees: 0,
        paymentCount: 0
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

    // TODO: payments table doesn't exist yet
    return res.status(501).json({
      error: 'Payment feature not yet implemented',
      message: 'The payment system is currently under development. Please contact your property manager for payment arrangements.'
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
    const lease = await prisma.leases.findFirst({
      where: {
        tenantId: userId,
        status: 'active'
      },
      include: {
        properties: true
      }
    });

    if (!lease) {
      return res.json({
        lease: null,
        receipts: [],
        documents: []
      });
    }

    // TODO: payments and documents tables don't exist yet
    return res.json({
      lease: {
        id: lease.id,
        leaseNumber: lease.leaseNumber,
        startDate: lease.startDate,
        endDate: lease.endDate
      },
      receipts: [],
      documents: []
    });

  } catch (error: any) {
    console.error('Get tenant documents error:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Reset tenant password (for property owners/managers)
router.post('/:id/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const role = req.user?.role;

    console.log('🔐 Reset password request - User role:', role, 'Tenant ID:', id);

    // Check if user is admin (Super Admin has elevated access)
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isOwner = role === 'owner' || role === 'property owner' || role === 'property_owner';
    const isManager = role === 'property_manager' || role === 'manager';

    if (!isAdmin && !isOwner && !isManager) {
      console.log('❌ Access denied - Invalid role:', role);
      return res.status(403).json({ error: 'Access denied. Only property owners and managers can reset tenant passwords.' });
    }

    // Find the tenant user
    const tenant = await prisma.users.findUnique({
      where: { id },
      include: {
        leases: {
          include: {
            properties: {
              select: {
                ownerId: true,
                property_managers: {
                  where: {
                    managerId: currentUserId,
                    isActive: true
                  },
                  select: {
                    managerId: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Verify the tenant has role 'tenant'
    if (tenant.role !== 'tenant') {
      return res.status(400).json({ error: 'User is not a tenant' });
    }

    // For property owners/managers (non-admins), verify they own/manage a property where this tenant has a lease
    if (!isAdmin) {
      const hasAccess = tenant.leases.some(lease => {
        // Check if user is the property owner
        if (lease.properties.ownerId === currentUserId) {
          return true;
        }
        // Check if user is an assigned manager for this property
        if (isManager && lease.properties.property_managers.length > 0) {
          return true;
        }
        return false;
      });

      if (!hasAccess) {
        console.log('❌ Access denied - User does not own/manage tenant properties');
        return res.status(403).json({ error: 'Access denied. You do not manage this tenant.' });
      }
    }

    // Generate a new temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

    // Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update tenant's password in the database
    await prisma.users.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    });

    console.log('✅ Password reset for tenant:', tenant.email);

    // Log activity
    if (tenant.customerId) {
      await prisma.activity_logs.create({
        data: {
          id: randomUUID(),
          customerId: tenant.customerId,
          userId: currentUserId,
          action: 'update',
          entity: 'tenant',
          entityId: id,
          description: `Password reset for tenant ${tenant.name}`
        }
      });
    }

    // Return the temporary password (for owner to give to tenant)
    return res.json({
      message: 'Password reset successfully',
      tempPassword: tempPassword,
      tenantEmail: tenant.email,
      tenantName: tenant.name
    });

  } catch (error: any) {
    console.error('❌ Reset tenant password error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return res.status(500).json({
      error: 'Failed to reset tenant password',
      details: error.message
    });
  }
});

// Delete tenant (for property owners/managers)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const role = req.user?.role;

    console.log('🗑️  Delete tenant request - User role:', role, 'Tenant ID:', id);

    // Check if user is admin (Super Admin has elevated access)
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isOwner = role === 'owner' || role === 'property owner' || role === 'property_owner';
    const isManager = role === 'property_manager' || role === 'manager';

    if (!isAdmin && !isOwner && !isManager) {
      console.log('❌ Access denied - Invalid role:', role);
      return res.status(403).json({ error: 'Access denied. Only property owners and managers can delete tenants.' });
    }

    // Find the tenant user with their leases and KYC info
    const tenant = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        customerId: true,
        kycVerificationId: true,
        leases: {
          include: {
            properties: {
              select: {
                ownerId: true,
                customerId: true
              }
            },
            units: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Verify the tenant has role 'tenant'
    if (tenant.role !== 'tenant') {
      return res.status(400).json({ error: 'User is not a tenant' });
    }

    // For property owners/managers (non-admins), verify they own/manage a property where this tenant has a lease
    if (!isAdmin) {
      const hasAccess = tenant.leases.some(
        lease => lease.properties.ownerId === currentUserId
      );

      if (!hasAccess) {
        console.log('❌ Access denied - User does not own/manage tenant properties');
        return res.status(403).json({ error: 'Access denied. You do not manage this tenant.' });
      }
    }

    // Comprehensive deletion of all tenant-related data
    console.log('🗑️  Starting comprehensive tenant deletion for:', tenant.email);

    // 1. Free up all units and delete all leases
    for (const lease of tenant.leases) {
      // Update unit status to vacant
      await prisma.units.update({
        where: { id: lease.units.id },
        data: {
          status: 'vacant',
          updatedAt: new Date()
        }
      });

      // Delete the lease
      await prisma.leases.delete({
        where: { id: lease.id }
      });
    }
    console.log('✅ Deleted', tenant.leases.length, 'leases');

    // 2. Delete payments associated with this tenant
    const deletedPayments = await prisma.payments.deleteMany({
      where: { tenantId: id }
    });
    console.log('✅ Deleted', deletedPayments.count, 'payments');

    // 3. Delete payment methods (should cascade, but let's be explicit)
    const deletedPaymentMethods = await prisma.payment_methods.deleteMany({
      where: { tenantId: id }
    });
    console.log('✅ Deleted', deletedPaymentMethods.count, 'payment methods');

    // 4. Delete maintenance requests reported by this tenant
    const deletedMaintenanceRequests = await prisma.maintenance_requests.deleteMany({
      where: { reportedById: id }
    });
    console.log('✅ Deleted', deletedMaintenanceRequests.count, 'maintenance requests');

    // 5. Delete documents (should cascade, but let's be explicit)
    const deletedDocuments = await prisma.documents.deleteMany({
      where: { tenantId: id }
    });
    console.log('✅ Deleted', deletedDocuments.count, 'documents');

    // 6. Delete any activity logs for this tenant
    const deletedActivityLogs = await prisma.activity_logs.deleteMany({
      where: { userId: id }
    });
    console.log('✅ Deleted', deletedActivityLogs.count, 'activity logs');

    // 7. Delete verification requests if tenant has a kycVerificationId
    if (tenant.kycVerificationId) {
      try {
        // Try to delete from verification service (consolidated)
        const { AdminService } = await import('../services/verification/admin.service');
        const adminService = new AdminService();
        await adminService.deleteRequest(tenant.kycVerificationId);
        console.log('✅ Deleted verification request from verification service');
      } catch (verificationError) {
        console.warn('⚠️ Could not delete verification request:', verificationError);
        // Continue with deletion even if verification service fails
      }
    }

    // Log the deletion activity before deleting the tenant
    if (tenant.customerId) {
      await prisma.activity_logs.create({
        data: {
          id: randomUUID(),
          customerId: tenant.customerId,
          userId: currentUserId,
          action: 'delete',
          entity: 'tenant',
          entityId: id,
          description: `Tenant ${tenant.name} (${tenant.email}) deleted completely`
        }
      });
    }

    // 8. Finally, delete the tenant user record
    await prisma.users.delete({
      where: { id }
    });
    console.log('✅ Deleted tenant user record');

    console.log('✅ Tenant deleted:', tenant.email);

    return res.json({
      message: 'Tenant deleted successfully',
      tenantEmail: tenant.email,
      tenantName: tenant.name
    });

  } catch (error: any) {
    console.error('❌ Delete tenant error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return res.status(500).json({
      error: 'Failed to delete tenant',
      details: error.message
    });
  }
});

// Update tenant information (for property owners/managers)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const role = req.user?.role;
    const { name, email, phone } = req.body;

    console.log('📝 Update tenant request:', { tenantId: id, currentUserId, role, updates: { name, email, phone } });

    // Check if user is owner or manager
    if (role !== 'owner' && role !== 'manager' && role !== 'property_manager' && role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Property owners and managers only.' });
    }

    // Get the tenant
    const tenant = await prisma.users.findUnique({
      where: { id }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Verify the tenant is actually a tenant
    if (tenant.role !== 'tenant') {
      return res.status(400).json({ error: 'User is not a tenant' });
    }

    // Check if the current user has access to this tenant
    // Find tenant's active lease to verify access
    const tenantLease = await prisma.leases.findFirst({
      where: {
        tenantId: id,
        properties: {
          OR: [
            { ownerId: currentUserId },
            { property_managers: { some: { managerId: currentUserId, isActive: true } } }
          ]
        }
      },
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            ownerId: true
          }
        }
      }
    });

    if (!tenantLease && role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({
        error: 'You do not have permission to update this tenant. Tenant must be assigned to your property.'
      });
    }

    console.log('✅ Authorization passed for tenant update');

    // Update tenant information
    const updatedTenant = await prisma.users.update({
      where: { id },
      data: {
        name: name || tenant.name,
        email: email || tenant.email,
        phone: phone || tenant.phone,
        updatedAt: new Date()
      }
    });

    console.log('✅ Tenant updated successfully:', updatedTenant.email);

    // Remove password from response
    const { password, ...tenantWithoutPassword } = updatedTenant;

    return res.json({
      message: 'Tenant updated successfully',
      tenant: tenantWithoutPassword
    });

  } catch (error: any) {
    console.error('❌ Update tenant error:', error);
    return res.status(500).json({
      error: 'Failed to update tenant',
      details: error.message
    });
  }
});

// Get auto-pay settings for tenant
router.get('/autopay/settings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    // Get tenant's active lease
    const lease = await prisma.leases.findFirst({
      where: { tenantId: userId, status: 'active' },
      select: {
        id: true,
        monthlyRent: true,
        currency: true,
        specialClauses: true,
        units: {
          select: {
            features: true
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'No active lease found' });
    }

    // Get auto-pay settings from lease's specialClauses
    const clauses = lease.specialClauses as any || {};
    const autopaySettings = clauses.autopay || null;

    // Get default payment method
    const customerId = req.user?.customerId;
    const defaultPaymentMethod = await prisma.payment_methods.findFirst({
      where: {
        customerId,
        tenantId: userId,
        isDefault: true,
        isActive: true
      },
      select: {
        id: true,
        cardBrand: true,
        cardLast4: true,
        cardExpMonth: true,
        cardExpYear: true
      }
    });

    // Get rent frequency
    const unitFeatures = lease.units?.features as any;
    const rentFrequency = unitFeatures?.nigeria?.rentFrequency || unitFeatures?.rentFrequency || 'monthly';

    return res.json({
      enabled: autopaySettings?.enabled || false,
      paymentMethodId: autopaySettings?.paymentMethodId || defaultPaymentMethod?.id || null,
      paymentMethod: defaultPaymentMethod,
      dayOfMonth: autopaySettings?.dayOfMonth || 1,
      amount: lease.monthlyRent,
      currency: lease.currency || 'NGN',
      rentFrequency,
      leaseId: lease.id
    });
  } catch (error: any) {
    console.error('Get autopay settings error:', error);
    return res.status(500).json({ error: 'Failed to get auto-pay settings' });
  }
});

// Update auto-pay settings for tenant
router.post('/autopay/settings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const customerId = req.user?.customerId;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied. Tenant access only.' });
    }

    const { enabled, paymentMethodId, dayOfMonth = 1 } = req.body;

    // Validate day of month
    const day = Math.min(28, Math.max(1, parseInt(dayOfMonth) || 1));

    // Get tenant's active lease
    const lease = await prisma.leases.findFirst({
      where: { tenantId: userId, status: 'active' }
    });

    if (!lease) {
      return res.status(404).json({ error: 'No active lease found' });
    }

    // If enabling, validate payment method exists and belongs to tenant
    if (enabled && paymentMethodId) {
      const paymentMethod = await prisma.payment_methods.findFirst({
        where: {
          id: paymentMethodId,
          customerId,
          tenantId: userId,
          isActive: true
        }
      });

      if (!paymentMethod) {
        return res.status(400).json({ error: 'Invalid payment method' });
      }
    }

    // Update lease's specialClauses with autopay settings
    const currentClauses = (lease.specialClauses as any) || {};
    const updatedClauses = {
      ...currentClauses,
      autopay: {
        enabled: !!enabled,
        paymentMethodId: enabled ? paymentMethodId : null,
        dayOfMonth: day,
        updatedAt: new Date().toISOString()
      }
    };

    await prisma.leases.update({
      where: { id: lease.id },
      data: {
        specialClauses: updatedClauses,
        updatedAt: new Date()
      }
    });

    // If enabling and no scheduled payment exists, create one
    if (enabled && paymentMethodId) {
      // Check if there's already a scheduled payment
      const existingScheduled = await prisma.payments.findFirst({
        where: {
          leaseId: lease.id,
          status: 'scheduled',
          type: 'rent'
        }
      });

      if (!existingScheduled) {
        // Calculate next payment date
        const today = new Date();
        let nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), day);

        // If the day has passed this month, schedule for next month
        if (nextPaymentDate <= today) {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }

        // Get rent frequency
        const leaseWithUnit = await prisma.leases.findUnique({
          where: { id: lease.id },
          include: { units: { select: { features: true } } }
        });
        const unitFeatures = leaseWithUnit?.units?.features as any;
        const rentFrequency = unitFeatures?.nigeria?.rentFrequency || unitFeatures?.rentFrequency || 'monthly';

        // Create scheduled payment
        await prisma.payments.create({
          data: {
            id: randomUUID(),
            customerId: customerId!,
            propertyId: lease.propertyId,
            unitId: lease.unitId,
            leaseId: lease.id,
            tenantId: userId,
            amount: lease.monthlyRent,
            currency: lease.currency || 'NGN',
            status: 'scheduled',
            type: 'rent',
            provider: 'paystack',
            providerReference: `SCH-AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            paymentMethodId,
            metadata: {
              scheduledDate: nextPaymentDate.toISOString(),
              rentFrequency,
              autopay: true
            } as any,
            updatedAt: new Date()
          }
        });
      }
    }

    return res.json({
      success: true,
      message: enabled ? 'Auto-pay enabled successfully' : 'Auto-pay disabled',
      settings: {
        enabled: !!enabled,
        paymentMethodId: enabled ? paymentMethodId : null,
        dayOfMonth: day
      }
    });
  } catch (error: any) {
    console.error('Update autopay settings error:', error);
    return res.status(500).json({ error: 'Failed to update auto-pay settings' });
  }
});

// Process auto-payments (called by cron job or manually)
router.post('/autopay/process', async (req: AuthRequest, res: Response) => {
  try {
    // This endpoint should be called by a cron job or admin
    // For security, we'll allow tenant to trigger their own payment manually
    const userId = req.user?.id;
    const role = req.user?.role;
    const customerId = req.user?.customerId;

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get tenant's scheduled payment that's due
    const today = new Date();
    const scheduledPayment = await prisma.payments.findFirst({
      where: {
        tenantId: userId,
        status: 'scheduled',
        type: 'rent',
        paymentMethodId: { not: null }
      },
      include: {
        payment_methods: true,
        leases: {
          include: {
            properties: { select: { customerId: true } }
          }
        }
      }
    });

    if (!scheduledPayment) {
      return res.status(404).json({ error: 'No scheduled payment found' });
    }

    // Check if payment is due
    const metadata = scheduledPayment.metadata as any;
    const scheduledDate = metadata?.scheduledDate ? new Date(metadata.scheduledDate) : null;

    if (scheduledDate && scheduledDate > today) {
      return res.status(400).json({
        error: 'Payment not yet due',
        scheduledDate: scheduledDate.toISOString()
      });
    }

    // Get owner's Paystack settings
    const ownerCustomerId = scheduledPayment.leases?.properties?.customerId;
    if (!ownerCustomerId) {
      return res.status(400).json({ error: 'Property owner not found' });
    }

    const settings = await prisma.payment_settings.findFirst({
      where: { customerId: ownerCustomerId, provider: 'paystack', isEnabled: true }
    });

    if (!settings?.secretKey) {
      return res.status(400).json({ error: 'Owner has not configured Paystack' });
    }

    // Get payment method authorization code
    const authCode = scheduledPayment.payment_methods?.authorizationCode;
    if (!authCode) {
      return res.status(400).json({ error: 'Payment method not properly configured' });
    }

    // Charge the card using Paystack
    const chargeResponse = await fetch('https://api.paystack.co/transaction/charge_authorization', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        authorization_code: authCode,
        email: req.user?.email || `tenant-${userId}@autopay.local`,
        amount: Math.round(scheduledPayment.amount * 100),
        currency: scheduledPayment.currency || 'NGN',
        reference: `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        metadata: {
          leaseId: scheduledPayment.leaseId,
          tenantId: userId,
          type: 'autopay_rent',
          scheduledPaymentId: scheduledPayment.id
        }
      })
    });

    const chargeData = await chargeResponse.json();

    if (!chargeResponse.ok || !chargeData.status || chargeData.data?.status !== 'success') {
      console.error('Auto-pay charge failed:', chargeData);

      // Update scheduled payment to failed
      await prisma.payments.update({
        where: { id: scheduledPayment.id },
        data: {
          status: 'failed',
          metadata: {
            ...metadata,
            failedAt: new Date().toISOString(),
            failureReason: chargeData.message || 'Charge failed'
          } as any,
          updatedAt: new Date()
        }
      });

      return res.status(400).json({
        error: 'Auto-pay charge failed',
        message: chargeData.message || 'Payment was declined'
      });
    }

    // Payment successful - update the scheduled payment
    await prisma.payments.update({
      where: { id: scheduledPayment.id },
      data: {
        status: 'success',
        providerReference: chargeData.data.reference,
        paidAt: new Date(),
        metadata: {
          ...metadata,
          paidViaAutopay: true,
          paystackReference: chargeData.data.reference
        } as any,
        updatedAt: new Date()
      }
    });

    // Create next scheduled payment
    const rentFrequency = metadata?.rentFrequency || 'monthly';
    const isAnnual = rentFrequency === 'annual';

    let nextPaymentDate = new Date();
    if (isAnnual) {
      nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
    } else {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }

    // Get autopay day from lease
    const lease = await prisma.leases.findUnique({
      where: { id: scheduledPayment.leaseId! }
    });
    const clauses = (lease?.specialClauses as any) || {};
    const autopayDay = clauses.autopay?.dayOfMonth || 1;
    nextPaymentDate.setDate(autopayDay);

    await prisma.payments.create({
      data: {
        id: randomUUID(),
        customerId: scheduledPayment.customerId,
        propertyId: scheduledPayment.propertyId,
        unitId: scheduledPayment.unitId,
        leaseId: scheduledPayment.leaseId,
        tenantId: scheduledPayment.tenantId,
        amount: scheduledPayment.amount,
        currency: scheduledPayment.currency,
        status: 'scheduled',
        type: 'rent',
        provider: 'paystack',
        providerReference: `SCH-AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        paymentMethodId: scheduledPayment.paymentMethodId,
        metadata: {
          scheduledDate: nextPaymentDate.toISOString(),
          rentFrequency,
          autopay: true
        } as any,
        updatedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Auto-pay processed successfully',
      payment: {
        amount: scheduledPayment.amount,
        currency: scheduledPayment.currency,
        reference: chargeData.data.reference,
        nextPaymentDate: nextPaymentDate.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Process autopay error:', error);
    return res.status(500).json({ error: 'Failed to process auto-pay' });
  }
});

export default router;


