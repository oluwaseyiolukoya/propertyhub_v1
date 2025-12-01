# Using Existing DigitalOcean Space for KYC Verification

## Overview

This guide shows how to use your **existing** DigitalOcean Space for KYC verification documents instead of creating a new one.

---

## Step 1: Find Your Existing Space Credentials

### 1.1 Get Space Name and Region

1. Log in to DigitalOcean: https://cloud.digitalocean.com
2. Click **"Manage"** → **"Spaces"**
3. Note down:
   - **Space Name:** (e.g., `contrezz-storage`)
   - **Region:** (e.g., `NYC3`)
   - **Endpoint:** (e.g., `https://nyc3.digitaloceanspaces.com`)

### 1.2 Get or Generate API Keys

**Option A: Use Existing API Keys**

If you already have API keys for your Space:
1. Find them in your secure storage (password manager, `.env` file, etc.)
2. You'll need:
   - Access Key ID (e.g., `DO00ABCDEFGHIJK1234`)
   - Secret Access Key (e.g., `abcdefghijklmnopqrstuvwxyz...`)

**Option B: Generate New API Keys (Recommended for Security)**

1. Go to **"API"** in left sidebar
2. Scroll to **"Spaces access keys"**
3. Click **"Generate New Key"**
4. Name: `verification-service-key`
5. **Save both keys immediately** (secret shown only once)

**Why generate new keys?**
- Separate access for verification service
- Can revoke without affecting property management
- Better security audit trail

---

## Step 2: Update Verification Service Environment Variables

### 2.1 Edit `verification-service/.env`

```bash
# DigitalOcean Spaces Configuration
# Use your EXISTING Space credentials
SPACES_ACCESS_KEY_ID=DO00ABCDEFGHIJK1234
SPACES_SECRET_ACCESS_KEY=abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG
SPACES_REGION=nyc3                    # ← Your existing region
SPACES_BUCKET=contrezz-storage        # ← Your existing bucket name
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com  # ← Your existing endpoint
```

**Replace:**
- `DO00ABCDEFGHIJK1234` → Your actual Access Key ID
- `abcdefghijklmnopqrstuvwxyz...` → Your actual Secret Access Key
- `nyc3` → Your actual region
- `contrezz-storage` → Your actual bucket name
- `https://nyc3.digitaloceanspaces.com` → Your actual endpoint

### 2.2 Verify Other Required Variables

Ensure these are also set in `verification-service/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/verification_db

# Redis
REDIS_URL=redis://localhost:6379

# Dojah API
DOJAH_API_KEY=your_dojah_api_key
DOJAH_APP_ID=your_dojah_app_id
DOJAH_BASE_URL=https://api.dojah.io

# Security
ENCRYPTION_KEY=<64_char_hex_string>
API_KEY_MAIN_DASHBOARD=<64_char_hex_string>

# Main Dashboard
MAIN_DASHBOARD_URL=http://localhost:5000
```

---

## Step 3: Verify CORS Configuration

### 3.1 Check Existing CORS Settings

1. Go to your Space in DigitalOcean dashboard
2. Click **"Settings"** tab
3. Scroll to **"CORS Configurations"**
4. Check if your verification service domain is included

### 3.2 Update CORS (if needed)

If your CORS doesn't include all necessary domains, update it:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://contrezz.com",
        "https://www.contrezz.com",
        "https://api.contrezz.com",
        "http://localhost:5173",
        "http://localhost:5000",
        "http://localhost:5001"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

**What to include:**
- ✅ Production frontend domain
- ✅ Production backend domain
- ✅ Verification service domain (if separate)
- ✅ Local development URLs

---

## Step 4: Test the Integration

### 4.1 Start Verification Service

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
✅ S3 client configured (region: nyc3, bucket: contrezz-storage)
```

**Look for:** The bucket name should match your existing Space!

### 4.2 Test File Upload

**Using cURL:**

```bash
# Get API key from database
cd verification-service
npx prisma studio
# Open api_keys table, copy the 'key' value

# Test upload
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

### 4.3 Verify File in Space

1. Go to your Space dashboard in DigitalOcean
2. You should see a **NEW folder** called `verification/`
3. Inside: `verification/req-abc123-def456/nin/1732567890-test-document.pdf`

**Folder structure:**

```
contrezz-storage/                    # ← Your existing Space
├── properties/                      # ← Existing files (unchanged)
│   └── ...
├── projects/                        # ← Existing files (unchanged)
│   └── ...
└── verification/                    # ← NEW folder (auto-created)
    └── req-abc123-def456/
        └── nin/
            └── 1732567890-test-document.pdf
```

✅ **Success!** Your existing Space now stores KYC documents in a separate folder.

---

## Step 5: Production Deployment

### 5.1 Add Environment Variables to DigitalOcean App Platform

1. Go to your verification service app in DigitalOcean App Platform
2. Click **"Settings"** → **"Environment Variables"**
3. Add/update:

```
SPACES_ACCESS_KEY_ID=<your_existing_key>
SPACES_SECRET_ACCESS_KEY=<your_existing_secret>
SPACES_REGION=nyc3
SPACES_BUCKET=contrezz-storage
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

4. **Encrypt** `SPACES_SECRET_ACCESS_KEY`
5. Click **"Save"**
6. App will redeploy automatically

### 5.2 Test Production Upload

1. Log in to your production app
2. Navigate to KYC verification page
3. Upload a test document
4. Check Space dashboard to verify upload

---

## Security Considerations

### ✅ Recommended Security Practices

1. **Use Separate API Keys:**
   - Generate new API keys specifically for verification service
   - Don't reuse keys from property management
   - Easier to revoke if compromised

2. **Monitor Access Logs:**
   - DigitalOcean Spaces → Insights → Access Logs
   - Watch for unusual access patterns

3. **Set File Permissions:**
   - Ensure Space is **"Restricted"** (not public)
   - Files only accessible via pre-signed URLs

4. **Implement Lifecycle Policies:**
   - Auto-delete old verification documents (e.g., after 7 years)
   - Reduces storage costs and compliance risk

### ⚠️ Potential Risks (and Mitigations)

| Risk | Mitigation |
|------|------------|
| **Shared API keys** | Generate separate keys for verification service |
| **Mixed data** | Use clear folder structure (`verification/` prefix) |
| **Storage quota** | Monitor usage, upgrade plan if needed (250GB → 500GB) |
| **Access control** | Implement application-level checks (already done) |

---

## Monitoring and Maintenance

### Monitor Storage Usage

1. Go to Space dashboard → **"Insights"**
2. Check:
   - **Storage Used:** Total GB (should stay under 250GB on basic plan)
   - **Bandwidth Used:** Total GB transferred
   - **Requests:** Number of API calls

### Set Up Alerts

1. DigitalOcean → **"Account"** → **"Billing"** → **"Alerts"**
2. Create alert for storage threshold (e.g., 200GB = 80% of 250GB)
3. Get notified before hitting quota

### Estimate Storage Growth

**Example calculation:**
- Average document size: 2MB
- Documents per customer: 3 (NIN + Passport + Utility Bill)
- Total per customer: 6MB

**Capacity:**
- 250GB ÷ 6MB = ~41,000 customers
- If you have 1,000 customers: 6GB used (only 2.4% of quota)

**Recommendation:** Monitor monthly growth and upgrade if approaching 200GB.

---

## When to Migrate to Separate Space

Consider creating a separate Space when:

1. **Storage approaching limit:**
   - Combined usage > 200GB (80% of 250GB)
   - Frequent "quota exceeded" warnings

2. **Compliance requirements:**
   - Need separate data retention policies
   - Auditors require isolated KYC storage

3. **Security concerns:**
   - Want to restrict verification service access
   - Need different access controls for KYC vs. property files

4. **Performance issues:**
   - High bandwidth usage affecting other services
   - Need CDN for KYC documents (separate from property files)

### Migration Steps (when ready)

1. Create new Space: `contrezz-verification-docs`
2. Generate new API keys
3. Update verification service environment variables
4. Copy existing `verification/` folder to new Space:
   ```bash
   rclone copy old-space:contrezz-storage/verification/ new-space:contrezz-verification-docs/verification/
   ```
5. Test uploads to new Space
6. Delete `verification/` folder from old Space (after confirming migration)

---

## Troubleshooting

### Issue: "Bucket does not exist"

**Cause:** Incorrect bucket name in environment variables

**Solution:**
1. Check Space name in DigitalOcean dashboard
2. Verify `SPACES_BUCKET` matches exactly (case-sensitive)
3. Restart verification service

### Issue: "Access Denied"

**Cause:** Incorrect API keys or permissions

**Solution:**
1. Verify API keys are correct (no extra spaces)
2. Check keys have write permissions
3. Regenerate keys if needed

### Issue: Files uploading to wrong location

**Cause:** Verification service using different bucket

**Solution:**
1. Check `SPACES_BUCKET` in `.env`
2. Restart service after changing environment variables
3. Verify logs show correct bucket name on startup

### Issue: CORS errors in browser

**Cause:** CORS not configured for verification service domain

**Solution:**
1. Add verification service domain to CORS configuration
2. Include `http://localhost:5001` for local development
3. Wait 5 minutes for changes to propagate

---

## Summary

### What You Did

✅ Used existing DigitalOcean Space (no new Space created)  
✅ Added `verification/` folder for KYC documents  
✅ Updated verification service environment variables  
✅ Verified CORS configuration  
✅ Tested file upload locally  
✅ Deployed to production  

### File Structure

```
contrezz-storage/                    # ← Your existing Space
├── properties/                      # ← Property management files
├── projects/                        # ← Developer project files
└── verification/                    # ← NEW: KYC verification documents
    ├── req-abc123/
    │   ├── nin/
    │   ├── passport/
    │   └── utility_bill/
    └── req-xyz789/
        └── ...
```

### Cost

**No additional cost!** Still $5/month for your existing Space.

### Next Steps

1. ✅ Complete this setup
2. ✅ Test KYC flow end-to-end
3. 📊 Monitor storage usage
4. 🔒 Review security practices
5. 📚 Read `KYC_DOCUMENT_STORAGE_ARCHITECTURE.md` for full details

---

**Last Updated:** November 25, 2024  
**Status:** PRODUCTION READY  
**Maintained By:** Contrezz Engineering Team

