# DigitalOcean Spaces Setup Guide for KYC Document Storage

## Overview

DigitalOcean Spaces is an S3-compatible object storage service. This guide walks you through setting up a Spaces bucket for storing KYC verification documents.

---

## Prerequisites

- ✅ DigitalOcean account (https://cloud.digitalocean.com)
- ✅ Credit card or payment method added to account
- ✅ Existing Contrezz application deployed on DigitalOcean (optional, but recommended for same-region deployment)

---

## Step 1: Create a DigitalOcean Spaces Bucket

### 1.1 Log in to DigitalOcean

1. Go to https://cloud.digitalocean.com
2. Log in with your credentials
3. You'll see the main dashboard

### 1.2 Navigate to Spaces

1. Click on **"Create"** button (top right, green button)
2. Select **"Spaces Object Storage"** from the dropdown

   OR

3. Click on **"Manage"** in the left sidebar
4. Select **"Spaces"**
5. Click **"Create a Space"** button

### 1.3 Configure Your Space

**Choose a datacenter region:**

- Select the **same region** as your existing application for best performance
- Recommended regions:
  - **NYC3** (New York) - Best for US East Coast
  - **SFO3** (San Francisco) - Best for US West Coast
  - **AMS3** (Amsterdam) - Best for Europe
  - **SGP1** (Singapore) - Best for Asia

**Example:** If your Contrezz backend is in `NYC3`, choose `NYC3` for Spaces.

**Enable CDN (Optional):**

- ✅ **Check "Enable CDN"** if you want faster global access (recommended for production)
- ❌ **Uncheck** for development/testing to save costs

**Choose a unique name:**

- Enter: `contrezz-verification-docs` (or your preferred name)
- Must be globally unique across all DigitalOcean users
- Use lowercase letters, numbers, and hyphens only
- No spaces or special characters

**Select a project:**

- Choose your existing project (e.g., "Contrezz Production")
- Or select "First Project" if you don't have one

**Pricing:**

- **$5/month** for 250 GB storage + 1 TB outbound transfer
- Additional storage: $0.02/GB/month
- Additional transfer: $0.01/GB

### 1.4 Create the Space

1. Review your settings:
   - Region: `NYC3` (or your chosen region)
   - Name: `contrezz-verification-docs`
   - CDN: Enabled (optional)
2. Click **"Create a Space"** button

3. Wait 10-30 seconds for the Space to be created

4. You'll be redirected to the Space dashboard

---

## Step 2: Configure Space Settings

### 2.1 Set File Listing to Private

**IMPORTANT:** By default, Spaces are public. We need to make it private for security.

1. In your Space dashboard, click on **"Settings"** tab
2. Scroll to **"File Listing"** section
3. Select **"Restricted"** (not "Public")
4. Click **"Save"**

**What this does:**

- Files are NOT publicly accessible via direct URL
- Files can only be accessed with proper authentication
- Pre-signed URLs will still work (time-limited access)

### 2.2 Configure CORS (Cross-Origin Resource Sharing)

**Why?** Allows your frontend to upload files directly to Spaces (if needed in the future).

1. In your Space dashboard, click on **"Settings"** tab
2. Scroll to **"CORS Configurations"** section
3. Click **"Add"**
4. Enter the following:

**CORS Configuration:**

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://contrezz.com",
        "https://www.contrezz.com",
        "http://localhost:5173",
        "http://localhost:5000"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

**Explanation:**

- `AllowedOrigins`: Your frontend domains (production + local development)
- `AllowedMethods`: HTTP methods allowed
- `AllowedHeaders`: All headers allowed (for flexibility)
- `MaxAgeSeconds`: Browser caches CORS preflight for 3000 seconds

5. Click **"Save CORS Configuration"**

---

## Step 3: Generate API Keys (Access Keys)

### 3.1 Navigate to API Section

1. In the left sidebar, click on **"API"**
2. Scroll down to **"Spaces access keys"** section

### 3.2 Generate New Key

1. Click **"Generate New Key"** button
2. Enter a name: `verification-service-key` (or any descriptive name)
3. Click **"Generate Key"**

### 3.3 Save Your Keys

**CRITICAL:** You'll see two keys:

1. **Access Key ID** (looks like: `DO00ABCDEFGHIJK1234`)
2. **Secret Access Key** (looks like: `abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG`)

**⚠️ IMPORTANT:**

- The **Secret Access Key** is shown **ONLY ONCE**
- Copy both keys immediately and save them securely
- Store them in a password manager (1Password, LastPass, etc.)
- **NEVER** commit these keys to git

**Example:**

```
Access Key ID: DO00ABCDEFGHIJK1234
Secret Access Key: abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG
```

---

## Step 4: Test Your Space (Optional but Recommended)

### 4.1 Upload a Test File via Web Interface

1. Go back to your Space dashboard (click on "Spaces" in sidebar, then your space name)
2. Click **"Upload Files"** button
3. Select a test file (e.g., a small image or PDF)
4. Click **"Upload"**
5. You should see the file appear in the file list

### 4.2 Test File Access

1. Click on the uploaded file
2. You'll see the file details
3. Note the **"File URL"** (e.g., `https://contrezz-verification-docs.nyc3.digitaloceanspaces.com/test.pdf`)
4. Try opening the URL in a new browser tab
5. **Expected:** You should see an "Access Denied" error (because the Space is private)
6. **This is correct!** Files should NOT be publicly accessible

### 4.3 Generate Pre-Signed URL (Optional)

Pre-signed URLs allow temporary access to private files.

**Using AWS CLI (if installed):**

```bash
# Install AWS CLI if not installed
brew install awscli  # macOS
# or
sudo apt install awscli  # Linux

# Configure AWS CLI for DigitalOcean Spaces
aws configure
# AWS Access Key ID: <your_access_key_id>
# AWS Secret Access Key: <your_secret_access_key>
# Default region name: nyc3 (or your region)
# Default output format: json

# Generate pre-signed URL (valid for 1 hour)
aws s3 presign s3://contrezz-verification-docs/test.pdf \
  --endpoint-url https://nyc3.digitaloceanspaces.com \
  --expires-in 3600
```

**Expected Output:**

```
https://contrezz-verification-docs.nyc3.digitaloceanspaces.com/test.pdf?AWSAccessKeyId=DO00...&Signature=...&Expires=1732567890
```

Open this URL in a browser - you should now see the file!

---

## Step 5: Configure Environment Variables

### 5.1 Verification Service Environment Variables

Add these to your `verification-service/.env` file:

```bash
# DigitalOcean Spaces Configuration
SPACES_ACCESS_KEY_ID=DO00ABCDEFGHIJK1234
SPACES_SECRET_ACCESS_KEY=abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG
SPACES_REGION=nyc3
SPACES_BUCKET=contrezz-verification-docs
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

**Replace:**

- `DO00ABCDEFGHIJK1234` → Your actual Access Key ID
- `abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG` → Your actual Secret Access Key
- `nyc3` → Your chosen region (if different)
- `contrezz-verification-docs` → Your bucket name (if different)
- `https://nyc3.digitaloceanspaces.com` → Your region endpoint (if different)

**Region Endpoints:**

- NYC3: `https://nyc3.digitaloceanspaces.com`
- SFO3: `https://sfo3.digitaloceanspaces.com`
- AMS3: `https://ams3.digitaloceanspaces.com`
- SGP1: `https://sgp1.digitaloceanspaces.com`

### 5.2 Update `.env.example`

Update `verification-service/.env.example` with the same variables (without actual values):

```bash
# DigitalOcean Spaces Configuration
SPACES_ACCESS_KEY_ID=your_access_key_id_here
SPACES_SECRET_ACCESS_KEY=your_secret_access_key_here
SPACES_REGION=nyc3
SPACES_BUCKET=contrezz-verification-docs
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

### 5.3 Add to `.gitignore`

Ensure `.env` is in `.gitignore`:

```bash
# In verification-service/.gitignore
.env
.env.local
.env.production
```

---

## Step 6: Update Application Code (Already Done!)

The verification service is already configured to use DigitalOcean Spaces. Here's what's already in place:

### 6.1 Environment Configuration

**File:** `verification-service/src/config/env.ts`

```typescript
export const config = {
  // ... other config ...
  spaces: {
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY!,
    region: process.env.SPACES_REGION || "nyc3",
    bucket: process.env.SPACES_BUCKET!,
    endpoint:
      process.env.SPACES_ENDPOINT || "https://nyc3.digitaloceanspaces.com",
  },
};
```

### 6.2 S3 Client Configuration

**File:** `verification-service/src/services/verification.service.ts`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

constructor() {
  // Configure S3 client for DigitalOcean Spaces
  this.s3Client = new S3Client({
    region: config.spaces.region,
    endpoint: config.spaces.endpoint,
    credentials: {
      accessKeyId: config.spaces.accessKeyId,
      secretAccessKey: config.spaces.secretAccessKey,
    },
    forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
  });
}
```

### 6.3 File Upload Logic

```typescript
async uploadDocument(requestId, file, documentType, documentNumber, metadata) {
  // Generate unique S3 key
  const fileKey = `verification/${requestId}/${documentType}/${Date.now()}-${file.originalname}`;

  // Upload to DigitalOcean Spaces
  const uploadCommand = new PutObjectCommand({
    Bucket: config.spaces.bucket,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    ServerSideEncryption: 'AES256', // Encrypt at rest
  });

  await this.s3Client.send(uploadCommand);

  // Construct file URL
  const fileUrl = `https://${config.spaces.bucket}.${config.spaces.region}.digitaloceanspaces.com/${fileKey}`;

  return fileUrl;
}
```

---

## Step 7: Test the Integration

### 7.1 Start Verification Service

```bash
cd verification-service
npm install
npm run dev
```

**Expected output:**

```
🚀 Verification Service running on port 5001
✅ Database connected
✅ Redis connected
✅ S3 client configured (region: nyc3, bucket: contrezz-verification-docs)
```

### 7.2 Test File Upload via API

**Using cURL:**

```bash
# 1. Get API key from database (run this in verification-service directory)
cd verification-service
npx prisma studio
# Open api_keys table, copy the 'key' value

# 2. Test file upload
curl -X POST http://localhost:5001/api/verification/submit \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -F "customerId=test-customer-123" \
  -F "customerType=developer" \
  -F "documentType=nin" \
  -F "documentNumber=12345678901" \
  -F "file=@/path/to/test-document.pdf"
```

**Expected response:**

```json
{
  "success": true,
  "requestId": "req-abc123-def456",
  "documentId": "doc-xyz789-uvw012",
  "message": "Document uploaded successfully"
}
```

### 7.3 Verify File in DigitalOcean Spaces

1. Go to your Space dashboard in DigitalOcean
2. Navigate to `verification/` folder
3. You should see a new folder with the `requestId`
4. Inside, you'll see the uploaded document

**Example structure:**

```
contrezz-verification-docs/
└── verification/
    └── req-abc123-def456/
        └── nin/
            └── 1732567890123-test-document.pdf
```

### 7.4 Test File Download (Pre-Signed URL)

**Using AWS SDK in Node.js:**

```javascript
// test-presigned-url.js
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: "nyc3",
  endpoint: "https://nyc3.digitaloceanspaces.com",
  credentials: {
    accessKeyId: "YOUR_ACCESS_KEY_ID",
    secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
  },
});

async function generatePresignedUrl() {
  const command = new GetObjectCommand({
    Bucket: "contrezz-verification-docs",
    Key: "verification/req-abc123-def456/nin/1732567890123-test-document.pdf",
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  console.log("Pre-signed URL:", url);
}

generatePresignedUrl();
```

Run:

```bash
node test-presigned-url.js
```

Open the generated URL in a browser - you should see the document!

---

## Step 8: Production Deployment

### 8.1 Add Environment Variables to DigitalOcean App Platform

1. Go to your DigitalOcean App Platform dashboard
2. Select your **verification-service** app
3. Click on **"Settings"** tab
4. Scroll to **"Environment Variables"**
5. Click **"Edit"**
6. Add the following variables:

```
SPACES_ACCESS_KEY_ID=DO00ABCDEFGHIJK1234
SPACES_SECRET_ACCESS_KEY=abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG
SPACES_REGION=nyc3
SPACES_BUCKET=contrezz-verification-docs
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

7. Click **"Encrypt"** for `SPACES_SECRET_ACCESS_KEY` (makes it hidden)
8. Click **"Save"**
9. App will automatically redeploy with new environment variables

### 8.2 Update CORS for Production Domain

1. Go to your Space dashboard
2. Click on **"Settings"** tab
3. Update **CORS Configuration** to include your production domain:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://contrezz.com",
        "https://www.contrezz.com",
        "https://api.contrezz.com"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

4. Click **"Save CORS Configuration"**

### 8.3 Test Production Upload

1. Deploy your application to production
2. Log in to your production app
3. Navigate to KYC verification page
4. Upload a test document
5. Check DigitalOcean Spaces dashboard to verify file was uploaded

---

## Step 9: Monitoring and Maintenance

### 9.1 Monitor Storage Usage

1. Go to your Space dashboard
2. Click on **"Insights"** tab
3. View:
   - **Storage Used:** Total GB stored
   - **Bandwidth Used:** Total GB transferred
   - **Requests:** Number of API calls

### 9.2 Set Up Billing Alerts

1. Click on **"Account"** in top right
2. Select **"Billing"**
3. Click on **"Alerts"**
4. Click **"Create Alert"**
5. Set threshold (e.g., $50/month)
6. Enter email for notifications
7. Click **"Create Alert"**

### 9.3 Backup Strategy

**Option 1: Cross-Region Replication (Recommended for Production)**

DigitalOcean doesn't support automatic replication, but you can:

1. Create a second Space in a different region (e.g., `SFO3` if primary is `NYC3`)
2. Use a cron job to sync files:

```bash
# Install rclone
brew install rclone  # macOS
# or
sudo apt install rclone  # Linux

# Configure rclone for DigitalOcean Spaces
rclone config
# Name: do-spaces-nyc3
# Type: s3
# Provider: DigitalOcean
# Access Key ID: <your_key>
# Secret Access Key: <your_secret>
# Endpoint: nyc3.digitaloceanspaces.com

# Sync to backup Space
rclone sync do-spaces-nyc3:contrezz-verification-docs do-spaces-sfo3:contrezz-verification-docs-backup --progress
```

**Option 2: Local Backup**

```bash
# Download all files to local backup
rclone sync do-spaces-nyc3:contrezz-verification-docs /backup/verification-docs --progress
```

### 9.4 Lifecycle Policy (Auto-Delete Old Files)

DigitalOcean Spaces supports lifecycle policies to automatically delete old files.

**Example: Delete files older than 7 years (compliance requirement)**

1. Go to your Space dashboard
2. Click on **"Settings"** tab
3. Scroll to **"Lifecycle Policy"**
4. Click **"Add Rule"**
5. Configure:
   - **Rule Name:** `delete-old-verification-docs`
   - **Prefix:** `verification/`
   - **Expiration:** `2555 days` (7 years)
6. Click **"Save"**

---

## Troubleshooting

### Issue 1: "Access Denied" when uploading

**Cause:** Incorrect API keys or permissions

**Solution:**

1. Verify API keys are correct in `.env`
2. Regenerate API keys if needed
3. Check Space is not restricted to specific IPs

### Issue 2: "Bucket does not exist"

**Cause:** Incorrect bucket name or region

**Solution:**

1. Verify `SPACES_BUCKET` matches your Space name exactly
2. Verify `SPACES_REGION` matches your Space region
3. Check for typos (case-sensitive)

### Issue 3: CORS errors in browser

**Cause:** CORS not configured or incorrect origins

**Solution:**

1. Add your frontend domain to CORS configuration
2. Include `http://localhost:5173` for local development
3. Wait 5 minutes for CORS changes to propagate

### Issue 4: Files not uploading (timeout)

**Cause:** Network issues or large file size

**Solution:**

1. Check file size (max 10MB in current config)
2. Increase timeout in S3 client configuration:

```typescript
this.s3Client = new S3Client({
  // ... existing config ...
  requestHandler: {
    requestTimeout: 60000, // 60 seconds
  },
});
```

### Issue 5: "SignatureDoesNotMatch" error

**Cause:** Incorrect secret access key or clock skew

**Solution:**

1. Verify secret access key is correct (no extra spaces)
2. Check system time is accurate:
   ```bash
   date
   # If incorrect, sync time:
   sudo ntpdate -s time.nist.gov  # macOS/Linux
   ```

---

## Security Best Practices

### ✅ DO:

- ✅ Keep Space **private** (restricted file listing)
- ✅ Use **pre-signed URLs** for temporary access
- ✅ **Encrypt** secret access key in production environment variables
- ✅ **Rotate** API keys every 90 days
- ✅ Enable **server-side encryption** (AES256)
- ✅ Use **HTTPS** for all requests
- ✅ **Log** all access attempts
- ✅ Set up **billing alerts**

### ❌ DON'T:

- ❌ Make Space **public**
- ❌ Commit API keys to **git**
- ❌ Share API keys via **email** or **Slack**
- ❌ Use same API keys for **development** and **production**
- ❌ Store unencrypted sensitive data
- ❌ Allow unlimited file sizes
- ❌ Skip CORS configuration

---

## Cost Optimization Tips

1. **Enable CDN only if needed:**

   - CDN costs extra for bandwidth
   - Only enable for production if you have global users

2. **Set lifecycle policies:**

   - Auto-delete old verification documents after retention period
   - Reduces storage costs

3. **Compress files before upload:**

   - Use image compression for photos
   - Use PDF compression for documents
   - Can reduce storage by 50-70%

4. **Monitor bandwidth usage:**

   - Set up alerts for unusual spikes
   - Investigate if bandwidth exceeds expected usage

5. **Use same region as app:**
   - Reduces latency
   - Reduces data transfer costs (free within same datacenter)

---

## Summary Checklist

- [ ] Created DigitalOcean Spaces bucket
- [ ] Set file listing to **Restricted**
- [ ] Configured **CORS** for frontend domains
- [ ] Generated **API keys** (Access Key ID + Secret Access Key)
- [ ] Saved API keys securely (password manager)
- [ ] Added environment variables to `verification-service/.env`
- [ ] Updated `.env.example` (without actual values)
- [ ] Tested file upload locally
- [ ] Verified file appears in Spaces dashboard
- [ ] Added environment variables to production (DigitalOcean App Platform)
- [ ] Tested production upload
- [ ] Set up **billing alerts**
- [ ] Configured **lifecycle policy** (optional)
- [ ] Set up **backup strategy** (optional)

---

## Quick Reference

### Environment Variables

```bash
SPACES_ACCESS_KEY_ID=DO00ABCDEFGHIJK1234
SPACES_SECRET_ACCESS_KEY=abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG
SPACES_REGION=nyc3
SPACES_BUCKET=contrezz-verification-docs
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

### Region Endpoints

| Region | Endpoint                              |
| ------ | ------------------------------------- |
| NYC3   | `https://nyc3.digitaloceanspaces.com` |
| SFO3   | `https://sfo3.digitaloceanspaces.com` |
| AMS3   | `https://ams3.digitaloceanspaces.com` |
| SGP1   | `https://sgp1.digitaloceanspaces.com` |

### File URL Format

```
https://{bucket}.{region}.digitaloceanspaces.com/{key}

Example:
https://contrezz-verification-docs.nyc3.digitaloceanspaces.com/verification/req-123/nin/1732567890-nin-card.pdf
```

### Pricing

- **$5/month** for 250 GB storage + 1 TB outbound transfer
- **$0.02/GB/month** for additional storage
- **$0.01/GB** for additional transfer

---

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Test file upload locally
3. ✅ Deploy to production
4. ✅ Test production upload
5. 📚 Read `KYC_DOCUMENT_STORAGE_ARCHITECTURE.md` for full architecture details
6. 📚 Read `VERIFICATION_SERVICE_TESTING_GUIDE.md` for testing procedures

---

**Last Updated:** November 25, 2024  
**Status:** PRODUCTION READY  
**Maintained By:** Contrezz Engineering Team  
**Support:** https://docs.digitalocean.com/products/spaces/
