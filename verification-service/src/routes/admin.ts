import express, { Request, Response } from 'express';
import { authenticateApiKey, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { adminService } from '../services/admin.service';

const router = express.Router();

/**
 * List all verification requests
 * GET /api/admin/requests
 * Query params: status, page, limit, email
 */
router.get('/requests', authenticateApiKey, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { status, page = '1', limit = '20', email } = req.query;

  const result = await adminService.listRequests(
    status as string,
    parseInt(page as string, 10),
    parseInt(limit as string, 10),
    email as string
  );

  res.json(result);
}));

/**
 * Get request details
 * GET /api/admin/requests/:requestId
 */
router.get('/requests/:requestId', authenticateApiKey, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const request = await adminService.getRequestDetails(requestId);
  res.json(request);
}));

/**
 * Approve verification
 * POST /api/admin/requests/:requestId/approve
 */
router.post('/requests/:requestId/approve', authenticateApiKey, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { adminUserId } = req.body;

  if (!adminUserId) {
    return res.status(400).json({ error: 'adminUserId is required' });
  }

  const result = await adminService.approveRequest(requestId, adminUserId);
  res.json(result);
}));

/**
 * Reject verification
 * POST /api/admin/requests/:requestId/reject
 */
router.post('/requests/:requestId/reject', authenticateApiKey, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { adminUserId, reason } = req.body;

  if (!adminUserId) {
    return res.status(400).json({ error: 'adminUserId is required' });
  }

  if (!reason) {
    return res.status(400).json({ error: 'reason is required' });
  }

  const result = await adminService.rejectRequest(requestId, adminUserId, reason);
  res.json(result);
}));

/**
 * Get analytics
 * GET /api/admin/analytics
 */
router.get('/analytics', authenticateApiKey, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const analytics = await adminService.getAnalytics();
  res.json(analytics);
}));

/**
 * Get provider logs
 * GET /api/admin/provider-logs
 */
router.get('/provider-logs', authenticateApiKey, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { provider, limit = '50' } = req.query;

  const logs = await adminService.getProviderLogs(
    provider as string,
    parseInt(limit as string, 10)
  );

  res.json({ logs });
}));

/**
 * Get document download URL (pre-signed)
 * GET /api/admin/documents/:documentId/download
 */
router.get('/documents/:documentId/download', authenticateApiKey, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const { expiresIn = '3600' } = req.query; // Default: 1 hour

  const result = await adminService.getDocumentDownloadUrl(
    documentId,
    parseInt(expiresIn as string, 10)
  );

  res.json(result);
}));

export default router;
