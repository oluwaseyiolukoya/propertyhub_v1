import express, { Response } from 'express';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

// Get all system settings
router.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = {};
    if (category) where.category = category as string;

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: { key: 'asc' }
    });

    return res.json(settings);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get single setting
router.get('/settings/:key', async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;

    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    return res.json(setting);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Create or update setting
router.post('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const { key, value, category, description } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, category, description },
      create: {
        key,
        value,
        category: category || 'system',
        description
      }
    });

    return res.json(setting);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to save setting' });
  }
});

// Delete setting
router.delete('/settings/:key', async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;

    await prisma.systemSetting.delete({
      where: { key }
    });

    return res.json({ message: 'Setting deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete setting' });
  }
});

export default router;


