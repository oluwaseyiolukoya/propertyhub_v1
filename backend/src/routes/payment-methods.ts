import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../lib/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = Router();

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * GET /api/payment-methods
 * List all payment methods for the authenticated customer
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = (req.user as any)?.customerId;

    if (!customerId) {
      return res.status(403).json({ error: 'Customer account required' });
    }

    console.log('[Payment Methods] Fetching payment methods for customer:', customerId);

    const paymentMethods = await prisma.payment_methods.findMany({
      where: {
        customerId,
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
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('[Payment Methods] Found', paymentMethods.length, 'active payment methods');

    res.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error: any) {
    console.error('[Payment Methods] Error fetching payment methods:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch payment methods' });
  }
});

/**
 * POST /api/payment-methods/add
 * Add a new payment method using Paystack authorization
 */
router.post('/add', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = (req.user as any)?.customerId;
    const { reference, setAsDefault = true } = req.body;

    if (!customerId) {
      return res.status(403).json({ error: 'Customer account required' });
    }

    if (!reference) {
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    console.log('[Payment Methods] Adding payment method for customer:', customerId);
    console.log('[Payment Methods] Paystack reference:', reference);

    // Verify the transaction with Paystack
    const verifyResponse = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!verifyResponse.data.status) {
      return res.status(400).json({ error: 'Failed to verify payment with Paystack' });
    }

    const transactionData = verifyResponse.data.data;

    // Check if transaction was successful
    if (transactionData.status !== 'success') {
      return res.status(400).json({ error: 'Transaction was not successful' });
    }

    // Extract authorization data
    const authorization = transactionData.authorization;
    if (!authorization || !authorization.authorization_code) {
      return res.status(400).json({ error: 'No authorization code found in transaction' });
    }

    console.log('[Payment Methods] Authorization code:', authorization.authorization_code);
    console.log('[Payment Methods] Card details:', {
      brand: authorization.brand,
      last4: authorization.last4,
      exp_month: authorization.exp_month,
      exp_year: authorization.exp_year,
    });

    // Check if this authorization code already exists
    const existingMethod = await prisma.payment_methods.findFirst({
      where: {
        customerId,
        authorizationCode: authorization.authorization_code,
        isActive: true,
      },
    });

    // If method already exists, treat this as a no-op (idempotent) and optionally update default flag
    if (existingMethod) {
      console.log('[Payment Methods] Payment method already exists:', existingMethod.id);

      // If caller wants this card as default, update defaults
      if (setAsDefault && !existingMethod.isDefault) {
        await prisma.payment_methods.updateMany({
          where: {
            customerId,
            isDefault: true,
          },
          data: {
            isDefault: false,
            updatedAt: new Date(),
          },
        });

        await prisma.payment_methods.update({
          where: { id: existingMethod.id },
          data: {
            isDefault: true,
            updatedAt: new Date(),
          },
        });
      }

      return res.json({
        success: true,
        message: 'Payment method already exists',
        data: {
          id: existingMethod.id,
          type: existingMethod.type,
          provider: existingMethod.provider,
          cardBrand: existingMethod.cardBrand,
          cardLast4: existingMethod.cardLast4,
          cardExpMonth: existingMethod.cardExpMonth,
          cardExpYear: existingMethod.cardExpYear,
          bank: existingMethod.bank,
          accountName: existingMethod.accountName,
          isDefault: setAsDefault ? true : existingMethod.isDefault,
          createdAt: existingMethod.createdAt,
        },
      });
    }

    // If setting as default, unset all other defaults
    if (setAsDefault) {
      await prisma.payment_methods.updateMany({
        where: {
          customerId,
          isDefault: true,
        },
        data: {
          isDefault: false,
          updatedAt: new Date(),
        },
      });
    }

    // Create the payment method
    const paymentMethod = await prisma.payment_methods.create({
      data: {
        id: randomUUID(),
        tenantId: userId!,
        customerId,
        type: 'card',
        provider: 'paystack',
        authorizationCode: authorization.authorization_code,
        cardBrand: authorization.brand || authorization.card_type,
        cardLast4: authorization.last4,
        cardExpMonth: authorization.exp_month,
        cardExpYear: authorization.exp_year,
        cardBin: authorization.bin,
        cardType: authorization.card_type,
        bank: authorization.bank,
        accountName: authorization.account_name,
        isDefault: setAsDefault,
        isActive: true,
        metadata: {
          channel: authorization.channel,
          reusable: authorization.reusable,
          signature: authorization.signature,
        },
      },
    });

    console.log('[Payment Methods] Payment method created:', paymentMethod.id);

    res.json({
      success: true,
      message: 'Payment method added successfully',
      data: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        provider: paymentMethod.provider,
        cardBrand: paymentMethod.cardBrand,
        cardLast4: paymentMethod.cardLast4,
        cardExpMonth: paymentMethod.cardExpMonth,
        cardExpYear: paymentMethod.cardExpYear,
        bank: paymentMethod.bank,
        accountName: paymentMethod.accountName,
        isDefault: paymentMethod.isDefault,
        createdAt: paymentMethod.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Payment Methods] Error adding payment method:', error);
    res.status(500).json({
      error: error.response?.data?.message || error.message || 'Failed to add payment method'
    });
  }
});

/**
 * POST /api/payment-methods/:id/set-default
 * Set a payment method as the default
 */
router.post('/:id/set-default', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = (req.user as any)?.customerId;
    const { id } = req.params;

    if (!customerId) {
      return res.status(403).json({ error: 'Customer account required' });
    }

    console.log('[Payment Methods] Setting default payment method:', id);

    // Verify the payment method belongs to this customer
    const paymentMethod = await prisma.payment_methods.findFirst({
      where: {
        id,
        customerId,
        isActive: true,
      },
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Unset all other defaults
    await prisma.payment_methods.updateMany({
      where: {
        customerId,
        isDefault: true,
      },
      data: {
        isDefault: false,
        updatedAt: new Date(),
      },
    });

    // Set this one as default
    const updatedMethod = await prisma.payment_methods.update({
      where: { id },
      data: {
        isDefault: true,
        updatedAt: new Date(),
      },
    });

    console.log('[Payment Methods] Default payment method updated:', id);

    res.json({
      success: true,
      message: 'Default payment method updated',
      data: {
        id: updatedMethod.id,
        isDefault: updatedMethod.isDefault,
      },
    });
  } catch (error: any) {
    console.error('[Payment Methods] Error setting default payment method:', error);
    res.status(500).json({ error: error.message || 'Failed to set default payment method' });
  }
});

/**
 * DELETE /api/payment-methods/:id
 * Remove a payment method (soft delete)
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = (req.user as any)?.customerId;
    const { id } = req.params;

    if (!customerId) {
      return res.status(403).json({ error: 'Customer account required' });
    }

    console.log('[Payment Methods] Removing payment method:', id);

    // Verify the payment method belongs to this customer
    const paymentMethod = await prisma.payment_methods.findFirst({
      where: {
        id,
        customerId,
        isActive: true,
      },
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Soft delete the payment method
    await prisma.payment_methods.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // If this was the default, set another one as default
    if (paymentMethod.isDefault) {
      const nextMethod = await prisma.payment_methods.findFirst({
        where: {
          customerId,
          isActive: true,
          id: { not: id },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (nextMethod) {
        await prisma.payment_methods.update({
          where: { id: nextMethod.id },
          data: {
            isDefault: true,
            updatedAt: new Date(),
          },
        });
        console.log('[Payment Methods] Set new default payment method:', nextMethod.id);
      }
    }

    console.log('[Payment Methods] Payment method removed:', id);

    res.json({
      success: true,
      message: 'Payment method removed successfully',
    });
  } catch (error: any) {
    console.error('[Payment Methods] Error removing payment method:', error);
    res.status(500).json({ error: error.message || 'Failed to remove payment method' });
  }
});

/**
 * POST /api/payment-methods/initialize-authorization
 * Initialize a Paystack transaction for card authorization (no charge)
 */
router.post('/initialize-authorization', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = (req.user as any)?.customerId;

    if (!customerId) {
      return res.status(403).json({ error: 'Customer account required' });
    }

    // Get customer details
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: {
        email: true,
        company: true,
        owner: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    console.log('[Payment Methods] Initializing card authorization for:', customer.email);

    // Initialize a ₦100 (10000 kobo) authorization transaction with Paystack
    const initResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: customer.email,
        amount: 10000, // ₦100 in kobo (minimum for authorization)
        currency: 'NGN',
        channels: ['card'],
        metadata: {
          custom_fields: [
            {
              display_name: 'Customer',
              variable_name: 'customer',
              value: customer.company || customer.owner || customer.email,
            },
            {
              display_name: 'Purpose',
              variable_name: 'purpose',
              value: 'Card Authorization',
            },
          ],
          customer_id: customerId,
          user_id: userId,
          authorization_only: true,
        },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?payment_callback=payment_method`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!initResponse.data.status) {
      return res.status(400).json({ error: 'Failed to initialize card authorization' });
    }

    const { authorization_url, access_code, reference } = initResponse.data.data;

    console.log('[Payment Methods] Authorization initialized:', reference);

    res.json({
      success: true,
      data: {
        authorizationUrl: authorization_url,
        accessCode: access_code,
        reference,
        email: customer.email,
      },
    });
  } catch (error: any) {
    console.error('[Payment Methods] Error initializing authorization:', error);
    res.status(500).json({
      error: error.response?.data?.message || error.message || 'Failed to initialize card authorization'
    });
  }
});

export default router;
