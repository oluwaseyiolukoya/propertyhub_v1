import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { getPrisma } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/payment-methods
 * Get all payment methods for the authenticated tenant
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only tenants can access their payment methods
    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can manage payment methods' });
    }

    const prisma = getPrisma();

    const paymentMethods = await prisma.payment_methods.findMany({
      where: {
        tenantId: userId,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        type: true,
        provider: true,
        cardBrand: true,
        cardLast4: true,
        cardExpMonth: true,
        cardExpYear: true,
        bank: true,
        accountName: true,
        isDefault: true,
        createdAt: true,
        // Never expose authorization code or sensitive data
      },
    });

    res.json({ data: paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

/**
 * POST /api/payment-methods
 * Add a new payment method (card) for the tenant
 * Expects Paystack authorization code from frontend
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    if (!userId || !customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can add payment methods' });
    }

    const {
      authorizationCode,
      cardBrand,
      cardLast4,
      cardExpMonth,
      cardExpYear,
      cardBin,
      cardType,
      bank,
      accountName,
      setAsDefault,
    } = req.body;

    if (!authorizationCode || !cardLast4) {
      return res.status(400).json({ error: 'Authorization code and card details are required' });
    }

    const prisma = getPrisma();

    // If setting as default, unset other defaults
    if (setAsDefault) {
      await prisma.payment_methods.updateMany({
        where: {
          tenantId: userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Check if this is the first card (auto-set as default)
    const existingCount = await prisma.payment_methods.count({
      where: {
        tenantId: userId,
        isActive: true,
      },
    });

    const isFirstCard = existingCount === 0;

    // Create the payment method
    const paymentMethod = await prisma.payment_methods.create({
      data: {
        id: uuidv4(),
        tenantId: userId,
        customerId,
        type: 'card',
        provider: 'paystack',
        authorizationCode,
        cardBrand: cardBrand || null,
        cardLast4,
        cardExpMonth: cardExpMonth || null,
        cardExpYear: cardExpYear || null,
        cardBin: cardBin || null,
        cardType: cardType || null,
        bank: bank || null,
        accountName: accountName || null,
        isDefault: setAsDefault || isFirstCard,
        isActive: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        type: true,
        provider: true,
        cardBrand: true,
        cardLast4: true,
        cardExpMonth: true,
        cardExpYear: true,
        bank: true,
        isDefault: true,
        createdAt: true,
      },
    });

    res.status(201).json({ data: paymentMethod });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

/**
 * PUT /api/payment-methods/:id/default
 * Set a payment method as default
 */
router.put('/:id/default', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can manage payment methods' });
    }

    const prisma = getPrisma();

    // Verify the payment method belongs to the tenant
    const paymentMethod = await prisma.payment_methods.findFirst({
      where: {
        id,
        tenantId: userId,
        isActive: true,
      },
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Unset all other defaults
    await prisma.payment_methods.updateMany({
      where: {
        tenantId: userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
        updatedAt: new Date(),
      },
    });

    // Set this one as default
    await prisma.payment_methods.update({
      where: { id },
      data: {
        isDefault: true,
        updatedAt: new Date(),
      },
    });

    res.json({ message: 'Default payment method updated' });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
});

/**
 * DELETE /api/payment-methods/:id
 * Delete (deactivate) a payment method
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can manage payment methods' });
    }

    const prisma = getPrisma();

    // Verify the payment method belongs to the tenant
    const paymentMethod = await prisma.payment_methods.findFirst({
      where: {
        id,
        tenantId: userId,
        isActive: true,
      },
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Soft delete by setting isActive to false
    await prisma.payment_methods.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // If this was the default, set another card as default
    if (paymentMethod.isDefault) {
      const nextCard = await prisma.payment_methods.findFirst({
        where: {
          tenantId: userId,
          isActive: true,
          id: { not: id },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (nextCard) {
        await prisma.payment_methods.update({
          where: { id: nextCard.id },
          data: {
            isDefault: true,
            updatedAt: new Date(),
          },
        });
      }
    }

    res.json({ message: 'Payment method removed' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

/**
 * POST /api/payment-methods/:id/charge
 * Charge a specific payment method (for manual payments or scheduled auto-pay)
 */
router.post('/:id/charge', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;
    const { id } = req.params;
    const { amount, leaseId, type = 'rent' } = req.body;

    if (!userId || !customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can charge payment methods' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const prisma = getPrisma();

    // Get the payment method
    const paymentMethod = await prisma.payment_methods.findFirst({
      where: {
        id,
        tenantId: userId,
        isActive: true,
      },
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    if (!paymentMethod.authorizationCode) {
      return res.status(400).json({ error: 'Payment method not configured for charging' });
    }

    // Get owner's Paystack settings
    const paymentSettings = await prisma.payment_settings.findFirst({
      where: {
        customerId,
        provider: 'paystack',
        isEnabled: true,
      },
    });

    if (!paymentSettings || !paymentSettings.secretKey) {
      return res.status(400).json({ error: 'Payment gateway not configured' });
    }

    // Get lease details if provided
    let lease = null;
    let propertyId = null;
    let unitId = null;

    if (leaseId) {
      lease = await prisma.leases.findFirst({
        where: {
          id: leaseId,
          tenantId: userId,
        },
      });

      if (lease) {
        propertyId = lease.propertyId;
        unitId = lease.unitId;
      }
    }

    // Charge the card using Paystack
    const paystackUrl = 'https://api.paystack.co/transaction/charge_authorization';
    const paystackResponse = await fetch(paystackUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paymentSettings.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorization_code: paymentMethod.authorizationCode,
        email: req.user?.email,
        amount: Math.round(amount * 100), // Convert to kobo
        currency: 'NGN',
        metadata: {
          tenant_id: userId,
          lease_id: leaseId,
          type,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return res.status(400).json({
        error: paystackData.message || 'Payment failed',
        details: paystackData,
      });
    }

    // Create payment record
    const payment = await prisma.payments.create({
      data: {
        id: uuidv4(),
        customerId,
        propertyId,
        unitId,
        leaseId,
        tenantId: userId,
        paymentMethodId: id,
        amount,
        currency: 'NGN',
        status: 'success',
        type,
        paymentMethod: 'card',
        provider: 'paystack',
        providerReference: paystackData.data.reference,
        providerFee: paystackData.data.fees ? paystackData.data.fees / 100 : null,
        paidAt: new Date(),
        metadata: {
          authorization_code: paymentMethod.authorizationCode,
          card_last4: paymentMethod.cardLast4,
          card_brand: paymentMethod.cardBrand,
        },
        updatedAt: new Date(),
      },
    });

    res.json({
      message: 'Payment successful',
      data: {
        payment,
        transaction: paystackData.data,
      },
    });
  } catch (error) {
    console.error('Error charging payment method:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default router;

