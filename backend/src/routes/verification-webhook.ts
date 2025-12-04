import express, { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { WebhookService } from '../services/verification/webhook.service';

const webhookService = new WebhookService();

const router = express.Router();

/**
 * Dojah webhook handler
 * POST /webhook/dojah
 */
router.post('/dojah', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-dojah-signature'] as string;

  // Verify webhook signature
  if (!webhookService.verifyDojahSignature(req.body, signature)) {
    console.warn('[WebhookRoutes] Invalid Dojah signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
  await webhookService.handleDojahWebhook(req.body);

  res.json({ received: true });
}));

/**
 * Test webhook endpoint (development only)
 * POST /webhook/test
 */
router.post('/test', asyncHandler(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  console.log('[WebhookRoutes] Test webhook received:', req.body);

  res.json({
    received: true,
    payload: req.body,
  });
}));

export default router;
