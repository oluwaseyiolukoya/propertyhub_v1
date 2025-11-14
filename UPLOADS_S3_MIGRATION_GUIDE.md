# Uploads Directory & S3 Migration Guide

## Current Setup

The application now stores uploaded files (logos and favicons) locally in the `uploads/` directory:

```
uploads/
├── .gitkeep
├── logos/
│   └── .gitkeep
└── favicons/
    └── .gitkeep
```

### Directory Structure
- **`uploads/logos/`**: Stores platform header logos (SVG, PNG, JPG, JPEG, WEBP)
- **`uploads/favicons/`**: Stores platform favicons (ICO, PNG, SVG)

### Backend Configuration
The backend is already configured to handle file uploads via Multer:
- **Location**: `backend/src/routes/system.ts`
- **Logo Storage**: `uploads/logos/` (max 5MB)
- **Favicon Storage**: `uploads/favicons/` (max 1MB)
- **Static Serving**: Files are served via `/uploads` endpoint in `backend/src/index.ts`

### Git Configuration
The `.gitignore` is configured to:
- ✅ Keep directory structure (`.gitkeep` files)
- ✅ Ignore uploaded files (security & repo size)
- ✅ Allow version control of folder structure

---

## Future: S3 Bucket Migration

When you're ready to migrate to AWS S3 or DigitalOcean Spaces for better scalability and CDN support, follow this guide.

### Why Migrate to S3?
1. **Scalability**: No disk space limits on your server
2. **CDN Integration**: Faster global delivery via CloudFront/CDN
3. **Durability**: 99.999999999% data durability
4. **Backup**: Automatic versioning and backup
5. **Cost**: Pay only for what you use

---

## Migration Steps

### 1. Choose Your Storage Provider

#### Option A: AWS S3
- **Cost**: ~$0.023/GB/month + transfer costs
- **CDN**: CloudFront integration
- **Setup**: AWS Console → S3 → Create Bucket

#### Option B: DigitalOcean Spaces
- **Cost**: $5/month (250GB included + 1TB outbound)
- **CDN**: Built-in CDN included
- **Setup**: DigitalOcean → Spaces → Create Space
- **Recommended**: Since you're already on DigitalOcean

---

### 2. Install Required Dependencies

```bash
npm install aws-sdk multer-s3 @aws-sdk/client-s3 @aws-sdk/lib-storage
```

---

### 3. Set Environment Variables

Add to your `.env` file:

```env
# Storage Configuration
STORAGE_TYPE=s3  # or 'local' for current setup

# AWS S3 / DigitalOcean Spaces Configuration
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com  # or AWS endpoint
S3_REGION=nyc3  # or us-east-1 for AWS
S3_BUCKET=contrezz-uploads
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_PUBLIC_URL=https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com

# Optional: CloudFront/CDN URL
CDN_URL=https://cdn.contrezz.com
```

---

### 4. Update Backend Code

#### Create S3 Storage Configuration

Create `backend/src/config/storage.ts`:

```typescript
import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

const storageType = process.env.STORAGE_TYPE || 'local';

// S3 Client Configuration
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false, // Required for DigitalOcean Spaces
});

// Logo Storage Configuration
export const logoStorage = storageType === 's3'
  ? multerS3({
      s3: s3Client,
      bucket: process.env.S3_BUCKET!,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `logos/logo-${uniqueSuffix}${path.extname(file.originalname)}`);
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/logos/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `logo-${uniqueSuffix}${path.extname(file.originalname)}`);
      },
    });

// Favicon Storage Configuration
export const faviconStorage = storageType === 's3'
  ? multerS3({
      s3: s3Client,
      bucket: process.env.S3_BUCKET!,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `favicons/favicon-${uniqueSuffix}${path.extname(file.originalname)}`);
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/favicons/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `favicon-${uniqueSuffix}${path.extname(file.originalname)}`);
      },
    });

// Get public URL for uploaded file
export const getPublicUrl = (filePath: string): string => {
  if (storageType === 's3') {
    const cdnUrl = process.env.CDN_URL || process.env.S3_PUBLIC_URL;
    return `${cdnUrl}/${filePath}`;
  }
  return `/uploads/${filePath}`;
};

// Delete file from storage
export const deleteFile = async (filePath: string): Promise<void> => {
  if (storageType === 's3') {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const key = filePath.replace(/^\/uploads\//, '');
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    }));
  } else {
    const fs = await import('fs/promises');
    const fullPath = path.join(process.cwd(), filePath);
    await fs.unlink(fullPath);
  }
};
```

#### Update `backend/src/routes/system.ts`

Replace the Multer storage configuration:

```typescript
import { logoStorage, faviconStorage, getPublicUrl, deleteFile } from '../config/storage';

// Replace existing storage configurations with:
const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only SVG, PNG, JPG, JPEG, and WEBP are allowed.'));
    }
  },
});

const uploadFavicon = multer({
  storage: faviconStorage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only ICO, PNG, and SVG are allowed.'));
    }
  },
});

// Update upload routes to use getPublicUrl:
router.post('/settings/upload-logo', adminOnly, uploadLogo.single('logo'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = getPublicUrl(req.file.path || req.file.key);

    // Delete old logo if exists
    const oldSetting = await prisma.system_settings.findUnique({
      where: { key: 'platform_logo_url' }
    });

    if (oldSetting?.value) {
      try {
        await deleteFile(oldSetting.value);
      } catch (err) {
        console.error('Failed to delete old logo:', err);
      }
    }

    // Save new logo URL
    const setting = await prisma.system_settings.upsert({
      where: { key: 'platform_logo_url' },
      update: { value: fileUrl },
      create: {
        key: 'platform_logo_url',
        value: fileUrl,
        category: 'branding',
        description: 'Platform header logo URL'
      }
    });

    return res.json({ url: fileUrl, setting });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return res.status(500).json({ error: 'Failed to upload logo' });
  }
});
```

---

### 5. Migrate Existing Files

Create a migration script `backend/scripts/migrate-to-s3.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

async function migrateFile(localPath: string, s3Key: string) {
  const fileContent = await fs.readFile(localPath);
  const contentType = localPath.endsWith('.svg') ? 'image/svg+xml' 
    : localPath.endsWith('.png') ? 'image/png'
    : localPath.endsWith('.ico') ? 'image/x-icon'
    : 'application/octet-stream';

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: s3Key,
    Body: fileContent,
    ContentType: contentType,
    ACL: 'public-read',
  }));

  console.log(`✅ Migrated: ${localPath} → s3://${process.env.S3_BUCKET}/${s3Key}`);
}

async function main() {
  // Migrate logos
  const logoSetting = await prisma.system_settings.findUnique({
    where: { key: 'platform_logo_url' }
  });

  if (logoSetting?.value && logoSetting.value.startsWith('/uploads/')) {
    const localPath = path.join(process.cwd(), logoSetting.value);
    const s3Key = logoSetting.value.replace('/uploads/', '');
    
    try {
      await migrateFile(localPath, s3Key);
      
      const newUrl = `${process.env.S3_PUBLIC_URL}/${s3Key}`;
      await prisma.system_settings.update({
        where: { key: 'platform_logo_url' },
        data: { value: newUrl }
      });
      
      console.log(`✅ Updated logo URL in database: ${newUrl}`);
    } catch (error) {
      console.error('❌ Failed to migrate logo:', error);
    }
  }

  // Migrate favicon
  const faviconSetting = await prisma.system_settings.findUnique({
    where: { key: 'platform_favicon_url' }
  });

  if (faviconSetting?.value && faviconSetting.value.startsWith('/uploads/')) {
    const localPath = path.join(process.cwd(), faviconSetting.value);
    const s3Key = faviconSetting.value.replace('/uploads/', '');
    
    try {
      await migrateFile(localPath, s3Key);
      
      const newUrl = `${process.env.S3_PUBLIC_URL}/${s3Key}`;
      await prisma.system_settings.update({
        where: { key: 'platform_favicon_url' },
        data: { value: newUrl }
      });
      
      console.log(`✅ Updated favicon URL in database: ${newUrl}`);
    } catch (error) {
      console.error('❌ Failed to migrate favicon:', error);
    }
  }

  console.log('✅ Migration complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the migration:

```bash
cd backend
npx ts-node scripts/migrate-to-s3.ts
```

---

### 6. Update Frontend (if needed)

The frontend should work without changes since it uses the URLs from the backend. However, if you're using CDN, update `VITE_API_URL` to point to your CDN for faster delivery.

---

### 7. Test the Migration

1. Upload a new logo via admin dashboard
2. Verify it appears in S3/Spaces
3. Check the URL in the database
4. Verify the logo displays correctly on all dashboards
5. Test logo removal

---

### 8. Cleanup (Optional)

After successful migration, you can remove local uploads:

```bash
rm -rf uploads/logos/* uploads/favicons/*
```

Keep the `.gitkeep` files to maintain directory structure.

---

## Cost Comparison

### Local Storage (Current)
- **Cost**: Free (uses server disk)
- **Pros**: Simple, no external dependencies
- **Cons**: Limited by server disk, no CDN, no backup

### DigitalOcean Spaces (Recommended)
- **Cost**: $5/month (250GB + 1TB transfer)
- **Pros**: Built-in CDN, automatic backup, scalable
- **Cons**: Monthly cost

### AWS S3 + CloudFront
- **Cost**: ~$1-5/month (depends on usage)
- **Pros**: Pay-as-you-go, highly scalable, global CDN
- **Cons**: More complex setup, variable costs

---

## Rollback Plan

If you need to rollback to local storage:

1. Set `STORAGE_TYPE=local` in `.env`
2. Restart the backend
3. Re-upload logos/favicons via admin dashboard

The system will automatically use local storage again.

---

## Support

For issues or questions:
- DigitalOcean Spaces: https://docs.digitalocean.com/products/spaces/
- AWS S3: https://docs.aws.amazon.com/s3/
- Multer S3: https://github.com/badunk/multer-s3

---

**Status**: ✅ Local storage configured and ready. S3 migration optional for future scalability.

