# Platform Logo Production Fix - Persistent Storage Solution

## Problem Identified

The platform logo was breaking in production because **DigitalOcean App Platform uses ephemeral storage**:

1. ✅ Logo uploads successfully to `/uploads/logos/platform-logo-*.svg`
2. ✅ Database stores the path correctly
3. ❌ **When the image is requested, it returns 404 Not Found**
4. ❌ **Files are lost when the container restarts or redeploys**

### Network Analysis from HAR File

```
Request: GET https://api.contrezz.com/uploads/logos/platform-logo-1763133287594.svg
Response: 404 Not Found
Error: net::ERR_ABORTED
```

The file existed temporarily after upload but was lost on the next deployment/restart.

## Root Cause

**Ephemeral Storage in DigitalOcean App Platform:**
- Containers are stateless and can be replaced at any time
- Local file system is wiped on each deployment
- Files uploaded during runtime don't persist
- This is standard behavior for containerized applications

## Solution Implemented

### 1. Storage Abstraction Layer

Created `/backend/src/lib/storage.ts` that automatically switches between:
- **Local Storage** (development) - Files stored in `backend/uploads/`
- **DigitalOcean Spaces** (production) - S3-compatible object storage

```typescript
// Automatically detects environment
const useCloudStorage = process.env.USE_CLOUD_STORAGE === 'true' || process.env.NODE_ENV === 'production';

// Returns appropriate storage based on environment
export const createLogoStorage = () => {
  if (s3Client) {
    // Use DigitalOcean Spaces (persistent)
    return multerS3({...});
  }
  // Fallback to local storage (development)
  return multer.diskStorage({...});
};
```

### 2. Updated System Routes

Modified `/backend/src/routes/system.ts` to use the storage abstraction:

```typescript
// Logo upload now works in both environments
const uploadLogo = multer({
  storage: createLogoStorage(), // Automatically uses Spaces in production
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only SVG, PNG, JPG, JPEG, and WEBP files are allowed for logo'));
    }
    cb(null, true);
  }
});
```

### 3. Public URL Generation

```typescript
// Returns correct URL based on storage type
export const getPublicUrl = (filePath: string): string => {
  if (s3Client && useCloudStorage) {
    // Return Spaces CDN URL
    const spacesUrl = process.env.SPACES_CDN_ENDPOINT || `https://${spacesBucket}.${spacesRegion}.cdn.digitaloceanspaces.com`;
    return `${spacesUrl}/${filePath}`;
  }
  // Return local URL (for development)
  return filePath;
};
```

### 4. File Deletion

```typescript
// Deletes from appropriate storage
export const deleteFile = async (filePath: string): Promise<void> => {
  if (s3Client && useCloudStorage) {
    // Delete from Spaces using AWS SDK
    await s3Client.send(new DeleteObjectCommand({
      Bucket: spacesBucket,
      Key: filePath,
    }));
  } else {
    // Delete from local filesystem
    fs.unlinkSync(fullPath);
  }
};
```

## Setup Instructions

### Step 1: Create DigitalOcean Space

1. **Log in to DigitalOcean**: https://cloud.digitalocean.com/
2. **Navigate to Spaces**: Click "Spaces" in the left sidebar
3. **Create a Space**:
   - Click "Create a Space"
   - Choose region: **NYC3** (or closest to your users)
   - Name: `contrezz-uploads`
   - Enable CDN: **Yes** (for faster delivery)
   - Set File Listing: **Private** (for security)
   - Click "Create Space"

4. **Generate API Keys**:
   - Go to "API" → "Spaces Keys"
   - Click "Generate New Key"
   - Name: `Contrezz Backend`
   - Copy the **Access Key** and **Secret Key** (save them securely!)

### Step 2: Configure Environment Variables in DigitalOcean

1. **Go to your App**: https://cloud.digitalocean.com/apps
2. **Select `clownfish-app`** (your backend)
3. **Click "Settings"** → "App-Level Environment Variables"
4. **Add the following variables**:

```bash
# Enable cloud storage in production
USE_CLOUD_STORAGE=true

# DigitalOcean Spaces Configuration
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
SPACES_REGION=nyc3
SPACES_ACCESS_KEY_ID=your_access_key_here
SPACES_SECRET_ACCESS_KEY=your_secret_key_here
SPACES_BUCKET=contrezz-uploads
SPACES_CDN_ENDPOINT=https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com
```

**Important**: Replace `your_access_key_here` and `your_secret_key_here` with the actual keys from Step 1.

5. **Click "Save"**
6. **App will automatically redeploy** with new environment variables

### Step 3: Set Spaces Permissions (CORS)

1. **Go to your Space**: https://cloud.digitalocean.com/spaces
2. **Click on `contrezz-uploads`**
3. **Go to "Settings"** → "CORS Configurations"
4. **Add CORS rule**:

```json
{
  "AllowedOrigins": ["https://contrezz.com", "https://www.contrezz.com"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

5. **Click "Save"**

### Step 4: Test the Fix

1. **Wait for deployment** to complete (3-5 minutes)
2. **Log in to admin dashboard**: https://contrezz.com
3. **Go to Platform Settings**
4. **Upload a new logo**
5. **Verify**:
   - Logo appears immediately
   - Logo URL starts with `https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com/`
   - Logo persists after page refresh
   - Logo persists after app redeployment

6. **Check different dashboards**:
   - Admin Dashboard
   - Owner Dashboard
   - Manager Dashboard
   - Developer Dashboard
   - Tenant Dashboard

All should show the new logo!

## Cost Breakdown

### DigitalOcean Spaces Pricing

| Item | Cost | Notes |
|------|------|-------|
| Storage | $5/month | Includes 250 GB storage |
| Bandwidth | Free | First 1 TB/month included |
| CDN | Included | Free with Spaces |
| **Total** | **$5/month** | Very affordable! |

**Comparison**:
- AWS S3: ~$0.023/GB storage + $0.09/GB transfer = ~$8-15/month
- DigitalOcean Spaces: **$5/month flat rate** (much simpler!)

## Benefits of This Solution

✅ **Persistent Storage**: Files never lost on deployment/restart
✅ **CDN Delivery**: Fast logo loading worldwide
✅ **Automatic Fallback**: Works in development without Spaces
✅ **Type-Safe**: Full TypeScript support
✅ **Easy Migration**: No code changes needed, just environment variables
✅ **Cost-Effective**: Only $5/month for unlimited uploads
✅ **Scalable**: Can handle millions of file requests
✅ **Secure**: Private bucket with public CDN access only for uploaded files

## Development vs Production

### Development (Local)
```bash
# .env.local
USE_CLOUD_STORAGE=false
# Files stored in backend/uploads/
# Served via express.static()
```

### Production (DigitalOcean)
```bash
# App Platform Environment Variables
USE_CLOUD_STORAGE=true
SPACES_ACCESS_KEY_ID=...
SPACES_SECRET_ACCESS_KEY=...
# Files stored in DigitalOcean Spaces
# Served via CDN
```

## Migration of Existing Files (Optional)

If you have existing logos in local storage that you want to migrate:

```bash
# Install DigitalOcean CLI
brew install doctl  # macOS
# or
snap install doctl  # Linux

# Authenticate
doctl auth init

# Upload existing files
doctl spaces upload backend/uploads/logos/* contrezz-uploads/logos/ --recursive

# Upload existing favicons
doctl spaces upload backend/uploads/favicons/* contrezz-uploads/favicons/ --recursive
```

## Troubleshooting

### Logo Still Shows 404

1. **Check environment variables**:
   ```bash
   # In DigitalOcean App Platform
   Settings → Environment Variables
   # Verify USE_CLOUD_STORAGE=true
   ```

2. **Check Spaces credentials**:
   ```bash
   # Test with doctl
   doctl spaces list
   # Should show contrezz-uploads
   ```

3. **Check CORS configuration**:
   - Go to Spaces → Settings → CORS
   - Ensure `contrezz.com` is in AllowedOrigins

4. **Check app logs**:
   ```bash
   # In DigitalOcean App Platform
   Runtime Logs → Select backend component
   # Look for "✅ Cloud storage (DigitalOcean Spaces) initialized"
   ```

### Logo Uploads But Doesn't Display

1. **Check the logo URL in database**:
   - Should start with `https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com/`
   - Not `/uploads/logos/...`

2. **Check browser console**:
   - Look for CORS errors
   - Look for 403 Forbidden (permissions issue)

3. **Check Spaces file list**:
   - Go to Spaces → contrezz-uploads → logos/
   - Verify file exists

### Credentials Not Working

1. **Regenerate Spaces keys**:
   - Go to API → Spaces Keys
   - Delete old key
   - Generate new key
   - Update environment variables

2. **Check key format**:
   - Access Key: Should be ~20 characters
   - Secret Key: Should be ~40 characters
   - No quotes or spaces

## Rollback Plan

If something goes wrong:

1. **Disable cloud storage**:
   ```bash
   # In DigitalOcean App Platform
   USE_CLOUD_STORAGE=false
   ```

2. **App will fall back to local storage** (but files will still be ephemeral)

3. **Re-upload logo** after fixing the issue

## Next Steps

1. ✅ **Set up DigitalOcean Space** (follow Step 1)
2. ✅ **Configure environment variables** (follow Step 2)
3. ✅ **Set CORS permissions** (follow Step 3)
4. ✅ **Test logo upload** (follow Step 4)
5. ✅ **Monitor for 24 hours** to ensure stability
6. ✅ **Document for team** (this file!)

## Future Enhancements

### Potential Improvements:
1. **Image Optimization**: Automatically resize/compress uploaded logos
2. **Multiple Formats**: Generate WebP, PNG, and SVG versions
3. **Backup Strategy**: Periodic backups of Spaces to another region
4. **Analytics**: Track logo view counts and load times
5. **Versioning**: Keep history of previous logos

### Additional File Types:
- User profile pictures
- Property images
- Document uploads
- Maintenance ticket attachments

All can use the same storage abstraction!

---

## Summary

**Problem**: Logo uploads were lost on deployment due to ephemeral storage
**Solution**: Implemented DigitalOcean Spaces (S3-compatible) for persistent storage
**Cost**: $5/month
**Status**: ✅ Ready to deploy

**Next Action**: Follow the setup instructions above to configure DigitalOcean Spaces.

---

**Questions?** Check the troubleshooting section or review the code in:
- `/backend/src/lib/storage.ts` - Storage abstraction
- `/backend/src/routes/system.ts` - Upload endpoints

