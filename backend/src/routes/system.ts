import express, { Response } from 'express';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import multer from 'multer';
import { createLogoStorage, createFaviconStorage, getPublicUrl, deleteFile } from '../lib/storage';

const router = express.Router();

router.use(authMiddleware);
// Note: Read-only endpoints are available to all authenticated users.
// Write endpoints (create/update/delete/upload) require adminOnly middleware per-route.

// Create multer instances with storage abstraction
const uploadLogo = multer({
  storage: createLogoStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only SVG, PNG, JPG, JPEG, and WEBP files are allowed for logo'));
    }
    cb(null, true);
  }
});

const uploadFavicon = multer({
  storage: createFaviconStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only ICO, PNG, and SVG files are allowed for favicon'));
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
router.post('/settings', adminOnly, async (req: AuthRequest, res: Response) => {
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
router.delete('/settings/:key', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    let { key } = req.params;
    // Normalize aliases to real keys
    const aliasMap: Record<string, string> = {
      logo: 'platform_logo_url',
      favicon: 'platform_favicon_url',
      brand_logo_url: 'platform_logo_url',
    };
    const normalizedKey = aliasMap[key] || key;

    // If deleting logo or favicon, attempt file cleanup first
    if (normalizedKey === 'platform_logo_url' || normalizedKey === 'platform_favicon_url') {
      try {
        const existing = await prisma.system_settings.findUnique({ where: { key: normalizedKey } });
        if (existing && existing.value && typeof existing.value === 'string') {
          await deleteFile(existing.value);
        }
      } catch (fileErr) {
        // Non-fatal; continue with DB delete
        console.error(`[DELETE ${normalizedKey}] File cleanup error:`, fileErr);
      }
    }

    await prisma.system_settings.delete({
      where: { key: normalizedKey }
    });

    return res.json({ message: 'Setting deleted successfully', key: normalizedKey });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete setting', details: error?.message });
  }
});

// Upload platform logo
router.post('/settings/upload-logo', adminOnly, uploadLogo.single('logo'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old logo file if exists
    try {
      const oldSetting = await prisma.system_settings.findUnique({ where: { key: 'platform_logo_url' } });
      if (oldSetting && oldSetting.value) {
        await deleteFile(oldSetting.value as string);
      }
    } catch (err) {
      console.error('Error deleting old logo:', err);
    }

    // Get the public URL for the uploaded file
    // For S3/Spaces, req.file will have a 'location' property from multer-s3
    // But we need to replace the Spaces endpoint with CDN endpoint
    let logoUrl: string;
    if ('location' in req.file) {
      // S3/Spaces upload - replace Spaces URL with CDN URL
      const spacesUrl = (req.file as any).location;
      const bucket = process.env.SPACES_BUCKET || 'contrezz-uploads';
      const region = process.env.SPACES_REGION || 'nyc3';

      // Build CDN endpoint (use env var or construct from region/bucket)
      const cdnEndpoint = process.env.SPACES_CDN_ENDPOINT ||
                         `https://${bucket}.${region}.cdn.digitaloceanspaces.com`;

      // Replace Spaces endpoint with CDN endpoint
      if (spacesUrl.includes(bucket)) {
        // Extract the path after the bucket name
        const urlParts = spacesUrl.split(`${bucket}/`);
        if (urlParts.length > 1) {
          logoUrl = `${cdnEndpoint}/${urlParts[1]}`;
        } else {
          logoUrl = spacesUrl;
        }
      } else {
        logoUrl = spacesUrl;
      }
    } else {
      // Local storage - build relative path
      const relativePath = `logos/${req.file.filename}`;
      logoUrl = getPublicUrl(`/${relativePath}`);
    }

    // Save to system settings
    const setting = await prisma.system_settings.upsert({
      where: { key: 'platform_logo_url' },
      update: {
        value: logoUrl,
        category: 'branding',
        description: 'Platform logo URL',
        updatedAt: new Date()
      },
      create: {
        id: `setting-logo-${Date.now()}`,
        key: 'platform_logo_url',
        value: logoUrl,
        category: 'branding',
        description: 'Platform logo URL',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return res.json({ url: logoUrl, setting });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload logo' });
  }
});

// Upload platform favicon
router.post('/settings/upload-favicon', adminOnly, uploadFavicon.single('favicon'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old favicon file if exists
    try {
      const oldSetting = await prisma.system_settings.findUnique({ where: { key: 'platform_favicon_url' } });
      if (oldSetting && oldSetting.value) {
        await deleteFile(oldSetting.value as string);
      }
    } catch (err) {
      console.error('Error deleting old favicon:', err);
    }

    // Get the public URL for the uploaded file
    let faviconUrl: string;
    if ('location' in req.file) {
      // S3/Spaces upload - replace Spaces URL with CDN URL
      const spacesUrl = (req.file as any).location;
      const bucket = process.env.SPACES_BUCKET || 'contrezz-uploads';
      const region = process.env.SPACES_REGION || 'nyc3';

      // Build CDN endpoint (use env var or construct from region/bucket)
      const cdnEndpoint = process.env.SPACES_CDN_ENDPOINT ||
                         `https://${bucket}.${region}.cdn.digitaloceanspaces.com`;

      // Replace Spaces endpoint with CDN endpoint
      if (spacesUrl.includes(bucket)) {
        // Extract the path after the bucket name
        const urlParts = spacesUrl.split(`${bucket}/`);
        if (urlParts.length > 1) {
          faviconUrl = `${cdnEndpoint}/${urlParts[1]}`;
        } else {
          faviconUrl = spacesUrl;
        }
      } else {
        faviconUrl = spacesUrl;
      }
    } else {
      // Local storage - build relative path
      const relativePath = `favicons/${req.file.filename}`;
      faviconUrl = getPublicUrl(`/${relativePath}`);
    }

    // Save to system settings
    const setting = await prisma.system_settings.upsert({
      where: { key: 'platform_favicon_url' },
      update: {
        value: faviconUrl,
        category: 'branding',
        description: 'Platform favicon URL',
        updatedAt: new Date()
      },
      create: {
        id: `setting-favicon-${Date.now()}`,
        key: 'platform_favicon_url',
        value: faviconUrl,
        category: 'branding',
        description: 'Platform favicon URL',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return res.json({ url: faviconUrl, setting });
  } catch (error: any) {
    console.error('Favicon upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload favicon' });
  }
});

// Delete platform logo (reset to default)
router.delete('/settings/logo', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[DELETE LOGO] Starting logo deletion...');

    // Find the setting
    const setting = await prisma.system_settings.findUnique({
      where: { key: 'platform_logo_url' }
    });

    if (!setting) {
      console.log('[DELETE LOGO] No logo setting found');
      return res.json({ message: 'Logo deleted successfully' });
    }

    console.log('[DELETE LOGO] Found setting:', setting);

    // Delete the file first (non-critical)
    if (setting.value && typeof setting.value === 'string') {
      try {
        const filePath = path.resolve(__dirname, '../..', setting.value.substring(1));
        console.log('[DELETE LOGO] Attempting to delete file:', filePath);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('[DELETE LOGO] File deleted successfully');
        } else {
          console.log('[DELETE LOGO] File does not exist');
        }
      } catch (fileError) {
        console.error('[DELETE LOGO] File deletion error (continuing anyway):', fileError);
      }
    }

    // Delete the database record using the unique key
    console.log('[DELETE LOGO] Deleting database record with key: platform_logo_url');
    await prisma.system_settings.delete({
      where: { key: 'platform_logo_url' }
    });
    console.log('[DELETE LOGO] Database record deleted successfully');

    return res.json({ message: 'Logo deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE LOGO] Unexpected error:', error);
    console.error('[DELETE LOGO] Error stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to delete logo',
      details: error.message,
      code: error.code
    });
  }
});

// Delete platform favicon (reset to default)
router.delete('/settings/favicon', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[DELETE FAVICON] Starting favicon deletion...');
    const key = 'platform_favicon_url';
    const setting = await prisma.system_settings.findUnique({ where: { key } });

    if (!setting) {
      console.log('[DELETE FAVICON] No favicon setting found');
      return res.json({ message: 'Favicon deleted successfully' });
    }

    console.log('[DELETE FAVICON] Found setting:', setting);

    // Attempt to delete file if value contains a path string
    try {
      const value = setting.value as any;
      const pathStr = typeof value === 'string' ? value : null;
      if (pathStr) {
        const filePath = path.resolve(__dirname, '../..', pathStr.substring(1));
        console.log('[DELETE FAVICON] Attempting to delete file:', filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('[DELETE FAVICON] File deleted successfully');
        } else {
          console.log('[DELETE FAVICON] File does not exist, skipping');
        }
      } else {
        console.log('[DELETE FAVICON] Setting value not a string path, skipping file deletion');
      }
    } catch (fileErr) {
      console.error('[DELETE FAVICON] File deletion error (continuing anyway):', fileErr);
    }

    // Always delete the DB record
    await prisma.system_settings.delete({ where: { key } });
    console.log('[DELETE FAVICON] Database record deleted successfully');

    return res.json({ message: 'Favicon deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE FAVICON] Error:', error);
    return res.status(500).json({ error: 'Failed to delete favicon', details: error?.message, code: error?.code });
  }
});

// ============================================
// Admin Payment Gateway Configuration
// Platform-level payment gateway settings (for subscription payments)
// Stored in system_settings, separate from owner-level payment_settings
// ============================================

// Get platform payment gateway configuration
router.get('/admin/payment-gateway', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { provider = 'monicredit' } = req.query;

    if (!['paystack', 'monicredit'].includes(provider as string)) {
      return res.status(400).json({ error: 'Invalid provider. Supported: paystack, monicredit' });
    }

    const key = `payments.${provider}`;
    const setting = await prisma.system_settings.findUnique({ where: { key } });

    if (!setting) {
      return res.json({
        provider,
        isEnabled: false,
        testMode: false,
        publicKey: null,
        secretKey: null,
        privateKey: null,
        merchantId: null,
        verifyToken: null,
      });
    }

    const value = setting.value as any;
    const response: any = {
      provider,
      isEnabled: value?.isEnabled || false,
      testMode: value?.testMode || false,
      publicKey: value?.publicKey || null,
      // Don't expose secret keys in GET - only show if enabled
      secretKey: value?.isEnabled ? (value?.secretKey || null) : null,
      privateKey: value?.isEnabled ? (value?.privateKey || null) : null,
      merchantId: value?.merchantId || null,
      verifyToken: value?.verifyToken || null,
      metadata: value?.metadata || {},
    };

    return res.json(response);
  } catch (error: any) {
    console.error('[Admin Payment Gateway] Get error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment gateway configuration' });
  }
});

// Save/Update platform payment gateway configuration
router.post('/admin/payment-gateway', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { provider = 'monicredit', publicKey, secretKey, privateKey, merchantId, testMode, isEnabled } = req.body;

    if (!['paystack', 'monicredit'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider. Supported: paystack, monicredit' });
    }

    // Validate required fields
    if (isEnabled) {
      if (provider === 'monicredit') {
        if (!publicKey || !privateKey) {
          return res.status(400).json({
            error: 'Public key and private key are required for Monicredit',
          });
        }
      } else if (provider === 'paystack') {
        if (!publicKey || !secretKey) {
          return res.status(400).json({
            error: 'Public key and secret key are required for Paystack',
          });
        }
      }
    }

    const key = `payments.${provider}`;
    
    // Get existing setting to preserve verifyToken if it exists
    const existing = await prisma.system_settings.findUnique({ where: { key } });
    let verifyToken = (existing?.value as any)?.verifyToken;

    // Generate verify token for Monicredit if it doesn't exist
    if (provider === 'monicredit' && !verifyToken) {
      const crypto = require('crypto');
      verifyToken = crypto.randomBytes(32).toString('hex');
    }

    // Prepare value object
    const value: any = {
      isEnabled: isEnabled || false,
      testMode: testMode || false,
      publicKey: publicKey || null,
      updatedAt: new Date().toISOString(),
    };

    if (provider === 'monicredit') {
      value.privateKey = privateKey || null;
      value.merchantId = merchantId || null;
      value.verifyToken = verifyToken;
    } else if (provider === 'paystack') {
      value.secretKey = secretKey || null;
    }

    // Upsert system setting
    const setting = await prisma.system_settings.upsert({
      where: { key },
      update: {
        value,
        category: 'payments',
        description: `Platform-level ${provider} payment gateway configuration for subscription payments`,
        updatedAt: new Date(),
      },
      create: {
        id: require('crypto').randomUUID(),
        key,
        value,
        category: 'payments',
        description: `Platform-level ${provider} payment gateway configuration for subscription payments`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Return response (don't expose full secret keys)
    const response: any = {
      provider,
      isEnabled: value.isEnabled,
      testMode: value.testMode,
      publicKey: value.publicKey,
      merchantId: value.merchantId || null,
      verifyToken: value.verifyToken || null,
      message: `${provider} configuration saved successfully`,
    };

    console.log(`[Admin Payment Gateway] ${provider} configuration saved`);

    return res.json(response);
  } catch (error: any) {
    console.error('[Admin Payment Gateway] Save error:', error);
    return res.status(500).json({ error: 'Failed to save payment gateway configuration' });
  }
});

export default router;

