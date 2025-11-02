import express, { Response } from 'express';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

// Multer storage for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const logosDir = path.resolve(__dirname, '../../uploads/logos');
    fs.mkdirSync(logosDir, { recursive: true });
    cb(null, logosDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `platform-logo${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// Get all system settings
router.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = {};
    if (category) where.category = category as string;

    const settings = await prisma.system_settings.findMany({
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

    // Try exact key first
    let setting = await prisma.system_settings.findUnique({ where: { key } });

    // If not found, try alias (platform_logo_url <-> brand_logo_url)
    if (!setting && (key === 'brand_logo_url' || key === 'platform_logo_url')) {
      const aliasKey = key === 'brand_logo_url' ? 'platform_logo_url' : 'brand_logo_url';
      setting = await prisma.system_settings.findUnique({ where: { key: aliasKey } });
      if (setting) {
        // Return using the requested key but with alias value
        return res.json({ ...setting, key });
      }
    }

    // If still not found, return a graceful 200 with null value
    if (!setting) {
      return res.json({ key, value: null, category: 'branding', description: null });
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

    const setting = await prisma.system_settings.upsert({
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

    await prisma.system_settings.delete({
      where: { key }
    });

    return res.json({ message: 'Setting deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete setting' });
  }
});

export default router;

// Upload platform logo
router.post('/settings/upload-logo', upload.single('logo'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Build public URL for the uploaded logo
    const relativePath = path.join('uploads', 'logos', req.file.filename).replace(/\\/g, '/');
    const logoUrl = `/` + relativePath;

    // Save to system settings
    const setting = await prisma.system_settings.upsert({
      where: { key: 'platform_logo_url' },
      update: { value: logoUrl, category: 'branding', description: 'Platform logo URL' },
      create: { key: 'platform_logo_url', value: logoUrl, category: 'branding', description: 'Platform logo URL' }
    });

    return res.json({ url: logoUrl, setting });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to upload logo' });
  }
});


