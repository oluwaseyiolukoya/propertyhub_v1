import { Router, Response } from 'express';
import { authMiddleware, AuthRequest, adminOnly } from '../middleware/auth';
import { processRecurringBilling, processAllRecurringBilling } from '../services/recurring-billing.service';

const router = Router();

/**
 * POST /api/admin/billing/process-recurring
 * Manually trigger recurring billing for all customers
 * Admin only
 */
router.post('/process-recurring', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[Admin Billing] Manually triggering recurring billing...');

    const results = await processAllRecurringBilling();

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      message: 'Recurring billing process completed',
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results: results.map(r => ({
          customerId: r.customerId,
          success: r.success,
          amount: r.amount,
          reference: r.reference,
          error: r.error,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Admin Billing] Error processing recurring billing:', error);
    res.status(500).json({ error: error.message || 'Failed to process recurring billing' });
  }
});

/**
 * POST /api/admin/billing/process-customer/:customerId
 * Manually trigger recurring billing for a specific customer
 * Admin only
 */
router.post('/process-customer/:customerId', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.params;

    console.log('[Admin Billing] Manually triggering recurring billing for customer:', customerId);

    const result = await processRecurringBilling(customerId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Recurring billing processed successfully',
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to process recurring billing',
        data: result,
      });
    }
  } catch (error: any) {
    console.error('[Admin Billing] Error processing recurring billing:', error);
    res.status(500).json({ error: error.message || 'Failed to process recurring billing' });
  }
});

export default router;

