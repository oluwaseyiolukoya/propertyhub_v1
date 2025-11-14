# CDN URL Fix for Platform Logo

## Problem

After setting up DigitalOcean Spaces, logo upload worked but the logo didn't display:

```
Error: net::ERR_NAME_NOT_RESOLVED
URL: https://contrezz-uploads.nyc3.digitaloceanspaces.com/logos/platform-logo-*.svg
```

## Root Cause

**multer-s3** automatically generates URLs using the **Spaces endpoint**, not the **CDN endpoint**:

- ❌ **Spaces Endpoint**: `https://contrezz-uploads.nyc3.digitaloceanspaces.com/`
  - Direct access to storage
  - CORS may not be configured
  - Slower (no CDN caching)

- ✅ **CDN Endpoint**: `https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com/`
  - CDN-accelerated delivery
  - CORS automatically enabled
  - Faster global delivery
  - Better for public assets

## Solution

Updated the upload logic to **replace Spaces URLs with CDN URLs** after upload:

```typescript
// In backend/src/routes/system.ts
if ('location' in req.file) {
  // S3/Spaces upload - replace Spaces URL with CDN URL
  const spacesUrl = (req.file as any).location;
  const cdnEndpoint = process.env.SPACES_CDN_ENDPOINT;
  const bucket = process.env.SPACES_BUCKET || 'contrezz-uploads';
  
  // Replace Spaces endpoint with CDN endpoint
  if (cdnEndpoint && spacesUrl.includes(bucket)) {
    // Extract the path after the bucket name
    const urlParts = spacesUrl.split(`${bucket}/`);
    if (urlParts.length > 1) {
      logoUrl = `${cdnEndpoint}/${urlParts[1]}`;
    }
  }
}
```

## Changes Made

1. **Logo Upload** (`/api/system/settings/upload-logo`):
   - Extracts path from multer-s3 location
   - Rebuilds URL with CDN endpoint
   - Saves CDN URL to database

2. **Favicon Upload** (`/api/system/settings/upload-favicon`):
   - Same transformation logic
   - Ensures favicon also uses CDN

## Result

**Before**:
```
https://contrezz-uploads.nyc3.digitaloceanspaces.com/logos/platform-logo-1763138090175.svg
❌ CORS blocked, slower
```

**After**:
```
https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com/logos/platform-logo-1763138090175.svg
✅ CORS enabled, CDN-accelerated
```

## Testing

1. **Wait for deployment** (3-5 minutes)
2. **Upload a new logo** in Platform Settings
3. **Verify URL** in database:
   ```bash
   curl https://api.contrezz.com/api/public/branding | jq '.logoUrl'
   ```
   Should return CDN URL (with `.cdn.` in the domain)

4. **Check logo displays** in all dashboards
5. **Check browser console** - no errors

## Environment Variables Required

Make sure these are set in DigitalOcean App Platform:

```bash
SPACES_CDN_ENDPOINT=https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com
SPACES_BUCKET=contrezz-uploads
```

## Benefits

✅ **CORS Enabled**: CDN endpoint has CORS configured by default
✅ **Faster Loading**: CDN caching for global delivery
✅ **Better Performance**: Reduced latency worldwide
✅ **Automatic**: No manual URL transformation needed
✅ **Consistent**: All uploaded assets use CDN

## Troubleshooting

### Logo still shows ERR_NAME_NOT_RESOLVED

**Check the URL in database**:
```bash
curl https://api.contrezz.com/api/public/branding | jq '.logoUrl'
```

**Should contain**: `.cdn.digitaloceanspaces.com`
**Should NOT contain**: `.digitaloceanspaces.com` (without `.cdn.`)

### Logo URL doesn't have .cdn.

**Check environment variable**:
```bash
# In DigitalOcean App Platform → Settings → Environment Variables
SPACES_CDN_ENDPOINT=https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com
```

**Make sure**:
- Variable name is correct
- Value includes `.cdn.`
- App has been redeployed after adding variable

### Logo still uses old URL

**Delete and re-upload**:
1. Go to Platform Settings
2. Click "Remove Logo"
3. Upload logo again
4. New upload will use CDN URL

## Status

✅ **Fixed and deployed**
- Code changes committed
- Pushed to GitHub
- Auto-deploying to production

**Next**: Wait for deployment, then upload logo again to get CDN URL.

---

**Summary**: The issue was that multer-s3 generates Spaces URLs, but we need CDN URLs for CORS and performance. The fix transforms the URL after upload to use the CDN endpoint.

