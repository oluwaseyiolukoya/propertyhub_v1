import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all payment methods for a tenant
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only tenants can access their payment methods
    if (role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can access payment methods' });
    }

    const paymentMethods = await prisma.payment_methods.findMany({
      where: {
        tenantId: userId,
        isActive: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Add a new payment method (card tokenization via Paystack)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const customerId = req.user?.customerId;

    if (!userId || role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can add payment methods' });
    }

    const { email, authorizationCode } = req.body;

    if (!authorizationCode) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Determine owner's Paystack secret based on the tenant's active lease (owner-level config)
    const activeLease = await prisma.leases.findFirst({
      where: { tenantId: userId, status: 'active' },
      include: {
        properties: { select: { customerId: true } },
        units: { include: { properties: { select: { customerId: true } } } }
      }
    });

    const ownerCustomerId = activeLease?.properties?.customerId || activeLease?.units?.properties?.customerId;
    if (!ownerCustomerId) {
      return res.status(400).json({ error: 'Property owner not found' });
    }

    const ownerSettings = await prisma.payment_settings.findFirst({
      where: { customerId: ownerCustomerId, provider: 'paystack' }
    });

    if (!ownerSettings?.secretKey) {
      return res.status(400).json({ error: 'Owner has not configured payment gateway' });
    }

    // Fetch authorization details from Paystack using owner's secret key
    const authResponse = await axios.get(
      `https://api.paystack.co/transaction/verify_authorization/${authorizationCode}`,
      {
        headers: {
          Authorization: `Bearer ${ownerSettings.secretKey}`
        }
      }
    );

    const authData = authResponse.data.data;

    if (!authData || !authData.authorization) {
      return res.status(400).json({ error: 'Invalid authorization code' });
    }

    const authorization = authData.authorization;

    // Check if this card already exists
    const existingCard = await prisma.payment_methods.findFirst({
      where: {
        tenantId: userId,
        authorizationCode: authorization.authorization_code,
        isActive: true
      }
    });

    if (existingCard) {
      return res.status(400).json({ error: 'This card has already been added' });
    }

    // If this is the first card, make it default
    const existingCards = await prisma.payment_methods.count({
      where: {
        tenantId: userId,
        isActive: true
      }
    });

    const isFirstCard = existingCards === 0;

    // Create the payment method
    const paymentMethod = await prisma.payment_methods.create({
      data: {
        id: uuidv4(),
        tenantId: userId,
        customerId: customerId || '',
        type: 'card',
        provider: 'paystack',
        authorizationCode: authorization.authorization_code,
        cardBrand: authorization.brand,
        cardLast4: authorization.last4,
        cardExpMonth: authorization.exp_month,
        cardExpYear: authorization.exp_year,
        cardBin: authorization.bin,
        cardType: authorization.card_type,
        bank: authorization.bank,
        accountName: authorization.account_name,
        isDefault: isFirstCard,
        isActive: true,
        metadata: {
          channel: authorization.channel,
          countryCode: authorization.country_code,
          reusable: authorization.reusable
        }
      }
    });

    res.json({
      message: 'Payment method added successfully',
      paymentMethod
    });
  } catch (error: any) {
    console.error('Error adding payment method:', error);

    if (error.response?.data) {
      return res.status(400).json({
        error: error.response.data.message || 'Failed to verify card with payment provider'
      });
    }

    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

// Set a payment method as default
router.put('/:id/set-default', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!userId || role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can manage payment methods' });
    }

    // Verify the payment method belongs to the tenant
    const paymentMethod = await prisma.payment_methods.findFirst({
      where: {
        id,
        tenantId: userId,
        isActive: true
      }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Remove default flag from all other cards
    await prisma.payment_methods.updateMany({
      where: {
        tenantId: userId,
        isActive: true
      },
      data: {
        isDefault: false
      }
    });

    // Set this card as default
    const updatedMethod = await prisma.payment_methods.update({
      where: { id },
      data: { isDefault: true }
    });

    res.json({
      message: 'Default payment method updated',
      paymentMethod: updatedMethod
    });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ error: 'Failed to update default payment method' });
  }
});

// Delete a payment method
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!userId || role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can manage payment methods' });
    }

    // Verify the payment method belongs to the tenant
    const paymentMethod = await prisma.payment_methods.findFirst({
      where: {
        id,
        tenantId: userId,
        isActive: true
      }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Soft delete the payment method
    await prisma.payment_methods.update({
      where: { id },
      data: { isActive: false }
    });

    // If this was the default card, set another card as default
    if (paymentMethod.isDefault) {
      const nextCard = await prisma.payment_methods.findFirst({
        where: {
          tenantId: userId,
          isActive: true,
          id: { not: id }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (nextCard) {
        await prisma.payment_methods.update({
          where: { id: nextCard.id },
          data: { isDefault: true }
        });
      }
    }

    res.json({ message: 'Payment method removed successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Charge a saved card for rent payment
router.post('/charge', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const customerId = req.user?.customerId;

    if (!userId || role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can make payments' });
    }

    const { paymentMethodId, amount, leaseId } = req.body;

    if (!paymentMethodId || !amount || !leaseId) {
      return res.status(400).json({ error: 'Payment method, amount, and lease ID are required' });
    }

    // Get the payment method
    const paymentMethod = await prisma.payment_methods.findFirst({
      where: {
        id: paymentMethodId,
        tenantId: userId,
        isActive: true
      }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Get the lease to verify
    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        tenantId: userId
      },
      include: {
        units: {
          include: {
            properties: true
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Get owner's Paystack settings
    const ownerCustomerId = lease.units?.properties?.customerId;
    if (!ownerCustomerId) {
      return res.status(400).json({ error: 'Property owner not found' });
    }

    const paymentSettings = await prisma.payment_settings.findFirst({
      where: { customerId: ownerCustomerId }
    });

    if (!paymentSettings?.paystackSecretKey) {
      return res.status(400).json({ error: 'Owner has not configured payment gateway' });
    }

    // Charge the card using Paystack
    const chargeResponse = await axios.post(
      'https://api.paystack.co/transaction/charge_authorization',
      {
        authorization_code: paymentMethod.authorizationCode,
        email: req.user?.email,
        amount: Math.round(amount * 100), // Convert to kobo
        metadata: {
          leaseId,
          tenantId: userId,
          customerId: ownerCustomerId,
          paymentMethodId: paymentMethod.id
        }
      },
      {
        headers: {
          Authorization: `Bearer ${paymentSettings.paystackSecretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const chargeData = chargeResponse.data.data;

    if (chargeData.status !== 'success') {
      return res.status(400).json({
        error: chargeData.gateway_response || 'Payment failed'
      });
    }

    // Create payment record
    const payment = await prisma.payments.create({
      data: {
        id: uuidv4(),
        leaseId,
        tenantId: userId,
        customerId: ownerCustomerId,
        amount,
        currency: lease.currency || 'NGN',
        paymentMethod: 'card',
        provider: 'paystack',
        providerReference: chargeData.reference,
        status: 'success',
        type: 'rent',
        paidAt: new Date(),
        paymentMethodId: paymentMethod.id
      }
    });

    res.json({
      message: 'Payment successful',
      payment,
      transaction: {
        reference: chargeData.reference,
        amount: chargeData.amount / 100,
        currency: chargeData.currency,
        status: chargeData.status
      }
    });
  } catch (error: any) {
    console.error('Error charging card:', error);

    if (error.response?.data) {
      return res.status(400).json({
        error: error.response.data.message || 'Payment failed'
      });
    }

    res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default router;
