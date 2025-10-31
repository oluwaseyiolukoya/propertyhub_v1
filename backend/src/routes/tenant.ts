import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const router = express.Router();

router.use(authMiddleware);

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

    // Calculate days until rent due (assuming rent due on 1st of month)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysUntilDue = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // TODO: payments, maintenance_requests, notifications tables don't exist yet
    // These will be added in future migrations
    const lastPayment = null;
    const daysSinceLastPayment = 0;
    const isOverdue = false;
    const totalPaidThisYear = { _sum: { amount: 0 } };
    const pendingMaintenance = 0;
    const recentMaintenance: any[] = [];
    const recentPayments: any[] = [];
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
        isExpiringSoon: daysUntilLeaseEnd <= 60
      },
      property: activeLease.properties,
      unit: activeLease.units,
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

    // Find the tenant user with their leases
    const tenant = await prisma.users.findUnique({
      where: { id },
      include: {
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

    // First, free up all units and delete all leases
    for (const lease of tenant.leases) {
      // Update unit status to vacant
      await prisma.units.update({
        where: { id: lease.units.id },
        data: { 
          status: 'vacant',
          updatedAt: new Date()
        }
      });

      // Delete the lease (we can't just terminate it because of foreign key constraints)
      await prisma.leases.delete({
        where: { id: lease.id }
      });
    }

    // Delete any activity logs for this tenant to avoid foreign key constraint issues
    await prisma.activity_logs.deleteMany({
      where: { userId: id }
    });

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
          description: `Tenant ${tenant.name} (${tenant.email}) deleted`
        }
      });
    }

    // Delete the tenant user
    await prisma.users.delete({
      where: { id }
    });

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

export default router;


