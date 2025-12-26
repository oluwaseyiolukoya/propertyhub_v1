# Production DigitalOcean Spaces Setup

## 🚨 Current Issue

The production deployment is failing with `InvalidAccessKeyId` error because DigitalOcean Spaces credentials are not configured in the production environment.

## ✅ Solution: Add Environment Variables in DigitalOcean App Platform

### Step 1: Get Your Spaces Credentials

1. **Log in to DigitalOcean**: https://cloud.digitalocean.com
2. **Navigate to API → Spaces Keys** (in the left sidebar)
3. **Generate New Key** (if you don't have one):
   - Click "Generate New Key"
   - Give it a name: `contrezz-public-backend`
   - Click "Generate Key"
   - **⚠️ IMPORTANT**: Copy both the **Access Key** and **Secret Key** immediately
   - The Secret Key is only shown once!

### Step 2: Add Environment Variables in DigitalOcean App Platform

1. **Go to DigitalOcean App Platform**: https://cloud.digitalocean.com/apps
2. **Select your app**: `contrezz-public-api`
3. **Go to Settings → App-Level Environment Variables**
4. **Add the following variables**:

   | Key | Value | Type |
   |-----|-------|------|
   | `DO_SPACES_ACCESS_KEY_ID` | Your Access Key from Step 1 | **SECRET** |
   | `DO_SPACES_SECRET_ACCESS_KEY` | Your Secret Key from Step 1 | **SECRET** |
   | `DO_SPACES_BUCKET` | `contrezz-uploads` | Plain |
   | `DO_SPACES_REGION` | `nyc3` | Plain |
   | `DO_SPACES_ENDPOINT` | `https://nyc3.digitaloceanspaces.com` | Plain |

### Step 3: Verify Your Space Exists

1. **Go to Spaces** in DigitalOcean dashboard
2. **Verify the Space `contrezz-uploads` exists** in the `nyc3` region
3. If it doesn't exist, create it:
   - Click "Create a Space"
   - Name: `contrezz-uploads`
   - Region: `New York 3 (nyc3)`
   - File listing: Private (recommended)
   - Click "Create a Space"

### Step 4: Redeploy

After adding the environment variables:

1. **Go to your app** in DigitalOcean App Platform
2. **Click "Actions" → "Force Rebuild"** (or wait for next deployment)
3. The app will rebuild with the new environment variables

### Step 5: Verify It Works

After redeployment, check the logs:

1. **Go to Runtime Logs** in your app
2. **Look for**: `✅ Public Storage Service initialized`
3. **Try submitting a job application** from the public careers page
4. **Check logs** - you should see successful uploads instead of `InvalidAccessKeyId` errors

## 🔍 Troubleshooting

### Error: `InvalidAccessKeyId`
- **Cause**: Access Key is incorrect or not set
- **Fix**: Verify `DO_SPACES_ACCESS_KEY_ID` is set correctly in App Platform

### Error: `SignatureDoesNotMatch`
- **Cause**: Secret Key is incorrect
- **Fix**: Verify `DO_SPACES_SECRET_ACCESS_KEY` is set correctly (no extra spaces)

### Error: `NoSuchBucket`
- **Cause**: Bucket doesn't exist or wrong name
- **Fix**: Verify `DO_SPACES_BUCKET=contrezz-uploads` and the Space exists

### Error: `AccessDenied`
- **Cause**: Access Key doesn't have permissions
- **Fix**: Regenerate the Spaces key and ensure it has read/write permissions

## 📋 Quick Checklist

- [ ] Spaces Key generated in DigitalOcean
- [ ] Access Key copied
- [ ] Secret Key copied (shown only once!)
- [ ] `DO_SPACES_ACCESS_KEY_ID` set in App Platform (as SECRET)
- [ ] `DO_SPACES_SECRET_ACCESS_KEY` set in App Platform (as SECRET)
- [ ] `DO_SPACES_BUCKET=contrezz-uploads` set in App Platform
- [ ] `DO_SPACES_REGION=nyc3` set in App Platform
- [ ] `DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com` set in App Platform
- [ ] Space `contrezz-uploads` exists in `nyc3` region
- [ ] App redeployed after adding variables
- [ ] Logs show "✅ Public Storage Service initialized"

## 🔗 Related Files

- Storage service: `public-backend/src/services/storage.service.ts`
- Deployment config: `public-backend/.do/app.yaml`
- Local setup guide: `public-backend/SPACES_CREDENTIALS_SETUP.md`
