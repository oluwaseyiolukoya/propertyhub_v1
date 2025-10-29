import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { emitToCustomer } from '../lib/socket';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user settings (including permissions)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    console.log('🔍 GET /settings called for user:', userId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch user from database
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        baseCurrency: true,
        phone: true,
        department: true,
        company: true,
        isActive: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Settings retrieved for user:', userId, 'Permissions:', user.permissions);

    return res.json({
      ...user,
      permissions: user.permissions || {}
    });
  } catch (error: any) {
    console.error('❌ Get settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update manager permissions (Owner only)
router.put('/manager-permissions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only owners can set manager permissions
    if (userRole !== 'owner' && userRole !== 'property_owner' && userRole !== 'property owner') {
      return res.status(403).json({ error: 'Only property owners can set manager permissions' });
    }

    const {
      managerCanViewUnits,
      managerCanCreateUnits,
      managerCanEditUnits,
      managerCanDeleteUnits,
      managerCanViewProperties,
      managerCanEditProperty,
      managerCanViewTenants,
      managerCanCreateTenants,
      managerCanEditTenants,
      managerCanDeleteTenants,
      managerCanViewFinancials
    } = req.body;

    console.log('💾 Received permissions update request:', { userId, userRole, body: req.body });

    // Build permissions object
    const permissions = {
      // Units permissions
      managerCanViewUnits: managerCanViewUnits !== undefined ? managerCanViewUnits : true,
      managerCanCreateUnits: managerCanCreateUnits !== undefined ? managerCanCreateUnits : true,
      managerCanEditUnits: managerCanEditUnits !== undefined ? managerCanEditUnits : true,
      managerCanDeleteUnits: managerCanDeleteUnits !== undefined ? managerCanDeleteUnits : false,
      // Properties permissions
      managerCanViewProperties: managerCanViewProperties !== undefined ? managerCanViewProperties : true,
      managerCanEditProperty: managerCanEditProperty !== undefined ? managerCanEditProperty : false,
      // Tenants permissions
      managerCanViewTenants: managerCanViewTenants !== undefined ? managerCanViewTenants : true,
      managerCanCreateTenants: managerCanCreateTenants !== undefined ? managerCanCreateTenants : true,
      managerCanEditTenants: managerCanEditTenants !== undefined ? managerCanEditTenants : true,
      managerCanDeleteTenants: managerCanDeleteTenants !== undefined ? managerCanDeleteTenants : false,
      // Financial permissions
      managerCanViewFinancials: managerCanViewFinancials !== undefined ? managerCanViewFinancials : true
    };

    console.log('📝 Built permissions object:', permissions);

    // Update user's permissions in database
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        permissions: permissions as any,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true
      }
    });

    console.log('✅ Manager permissions updated for user:', userId, 'New permissions:', updatedUser.permissions);

    // Emit realtime event to all users under this customer (managers will react)
    try {
      const ownerRecord = await prisma.users.findUnique({
        where: { id: userId },
        select: { customerId: true }
      });
      if (ownerRecord?.customerId) {
        emitToCustomer(ownerRecord.customerId, 'permissions:updated', {
          customerId: ownerRecord.customerId,
          permissions
        });
        console.log('📡 Emitted permissions:updated for customer:', ownerRecord.customerId);
      }
    } catch (e) {
      console.warn('⚠️ Failed to emit permissions update event:', (e as any)?.message || e);
    }

    return res.json({
      message: 'Manager permissions updated successfully',
      permissions: updatedUser.permissions
    });
  } catch (error: any) {
    console.error('❌ Update manager permissions error:', error);
    return res.status(500).json({ error: 'Failed to update manager permissions' });
  }
});

// Update user profile settings
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name,
      phone,
      baseCurrency,
      department,
      company
    } = req.body;

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (baseCurrency !== undefined) updateData.baseCurrency = baseCurrency;
    if (department !== undefined) updateData.department = department;
    if (company !== undefined) updateData.company = company;

    // Update user in database
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        baseCurrency: true,
        department: true,
        company: true,
        permissions: true,
        isActive: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('✅ Profile updated for user:', userId);

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('❌ Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Payment gateway settings (Owner-level)
// Get current customer's payment gateway config (paystack)
router.get('/payment-gateway', async (req: AuthRequest, res: Response) => {
  try {
    // Guard: ensure real DB with payment_settings table
    const hasPaymentSettings = (prisma as any)?.payment_settings?.findFirst;
    if (!hasPaymentSettings) {
      return res.status(503).json({
        error: 'Database not configured for payment settings. Set DATABASE_URL and run Prisma migrations.',
        action: 'Create backend/.env with DATABASE_URL, then: cd backend && npx prisma generate && npx prisma migrate dev',
      });
    }

    const userId = req.user?.id;
    const role = (req.user?.role || '').toLowerCase();
    const customerId = req.user?.customerId;

    if (!userId || !customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['owner', 'property_owner', 'property owner', 'admin', 'super_admin'].includes(role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const settings = await prisma.payment_settings.findFirst({
      where: { customerId, provider: 'paystack' }
    });

    // Never return secret key to clients; indicate if it's configured
    if (settings) {
      const { secretKey, ...safe } = settings as any;
      return res.json({ ...safe, secretConfigured: !!secretKey });
    }
    return res.json(null);
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.code === 'P2022') {
      console.error('❌ Payment settings table missing or out of date:', error?.meta || error);
      return res.status(503).json({
        error: 'Database not migrated for payment settings. Please run prisma migrate.',
        action: 'Execute: cd backend && npx prisma migrate dev',
      });
    }
    console.error('❌ Get payment gateway settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment gateway settings' });
  }
});

// Public (read-only) payment gateway settings for tenant/manager visibility
// Returns only non-sensitive fields like isEnabled and bankTransferTemplate
router.get('/payment-gateway/public', async (req: AuthRequest, res: Response) => {
  try {
    const hasPaymentSettings = (prisma as any)?.payment_settings?.findFirst;
    if (!hasPaymentSettings) {
      return res.status(503).json({
        error: 'Database not configured for payment settings. Please run Prisma migrations.',
      });
    }

    const userId = req.user?.id;
    const role = (req.user?.role || '').toLowerCase();
    const customerId = req.user?.customerId;

    if (!userId || !customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Allow all customer users (owner, manager, tenant) to read non-sensitive settings
    if (!['owner', 'property_owner', 'property owner', 'manager', 'tenant', 'admin', 'super_admin'].includes(role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const settings = await prisma.payment_settings.findFirst({
      where: { customerId, provider: 'paystack' },
      select: {
        isEnabled: true,
        testMode: true,
        bankTransferTemplate: true,
        updatedAt: true,
      }
    });

    return res.json(settings || null);
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.code === 'P2022') {
      return res.status(503).json({
        error: 'Database not migrated for payment settings. Please run prisma migrate.',
      });
    }
    console.error('❌ Get public payment settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

// Save/Update payment gateway config (paystack)
router.put('/payment-gateway', async (req: AuthRequest, res: Response) => {
  try {
    // Guard: ensure real DB with payment_settings table
    const hasPaymentSettings = (prisma as any)?.payment_settings?.upsert;
    if (!hasPaymentSettings) {
      return res.status(503).json({
        error: 'Database not configured for payment settings. Set DATABASE_URL and run Prisma migrations.',
        action: 'Create backend/.env with DATABASE_URL, then: cd backend && npx prisma generate && npx prisma migrate dev',
      });
    }

    const userId = req.user?.id;
    const role = (req.user?.role || '').toLowerCase();
    const customerId = req.user?.customerId;

    if (!userId || !customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['owner', 'property_owner', 'property owner', 'admin', 'super_admin'].includes(role)) {
      return res.status(403).json({ error: 'Only owner or admin can configure payment gateway' });
    }

    const { publicKey, secretKey, testMode, isEnabled, bankTransferTemplate } = req.body || {};

    // Check if a record exists for this customer/provider
    const existing = await prisma.payment_settings.findFirst({
      where: { customerId, provider: 'paystack' },
    });

    // If no existing config and keys are missing, block creation
    if (!existing && (!publicKey || !secretKey)) {
      return res.status(400).json({ error: 'Public key and secret key are required to create Paystack configuration' });
    }

    // Build partial update payload; do not overwrite keys unless provided
    const updateData: any = { updatedAt: new Date() };
    if (publicKey !== undefined) updateData.publicKey = publicKey;
    if (secretKey !== undefined) updateData.secretKey = secretKey;
    if (testMode !== undefined) updateData.testMode = !!testMode;
    if (isEnabled !== undefined) updateData.isEnabled = !!isEnabled;
    if (bankTransferTemplate !== undefined) updateData.bankTransferTemplate = bankTransferTemplate;

    const upserted = await prisma.payment_settings.upsert({
      where: {
        customerId_provider: {
          customerId,
          provider: 'paystack'
        }
      },
      create: {
        customerId,
        provider: 'paystack',
        publicKey: publicKey!,
        secretKey: secretKey!,
        testMode: !!testMode,
        isEnabled: !!isEnabled,
        bankTransferTemplate: bankTransferTemplate || null
      },
      update: {
        ...updateData
      }
    });

    const { secretKey: _, ...safe } = upserted as any;
    return res.json({ message: 'Payment gateway updated', settings: safe });
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.code === 'P2022') {
      console.error('❌ Payment settings table missing or out of date:', error?.meta || error);
      return res.status(503).json({
        error: 'Database not migrated for payment settings. Please run prisma migrate.',
        action: 'Execute: cd backend && npx prisma migrate dev',
      });
    }
    console.error('❌ Update payment gateway settings error:', error);
    return res.status(500).json({ error: 'Failed to update payment gateway settings' });
  }
});

export default router;

