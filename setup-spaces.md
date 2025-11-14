# Quick Setup Guide: DigitalOcean Spaces for Platform Logo

## 🎯 Goal
Fix the 404 error for platform logo in production by setting up persistent storage.

## ⏱️ Time Required
15-20 minutes

---

## Step 1: Create DigitalOcean Space (5 minutes)

1. **Go to**: https://cloud.digitalocean.com/spaces

2. **Click "Create a Space"**

3. **Configure**:
   - **Region**: NYC3 (or closest to your users)
   - **Name**: `contrezz-uploads`
   - **Enable CDN**: ✅ Yes
   - **File Listing**: Private
   - **Click**: "Create Space"

4. **Note the URL**: `https://contrezz-uploads.nyc3.digitaloceanspaces.com`

---

## Step 2: Generate API Keys (3 minutes)

1. **Go to**: https://cloud.digitalocean.com/account/api/spaces

2. **Click "Generate New Key"**

3. **Name it**: `Contrezz Backend`

4. **Copy and save** (you'll only see this once!):
   ```
   Access Key: DO00XXXXXXXXXXXXX (20 chars)
   Secret Key: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (40 chars)
   ```

5. **Store securely** in your password manager

---

## Step 3: Configure App Platform (5 minutes)

1. **Go to**: https://cloud.digitalocean.com/apps

2. **Select**: `clownfish-app` (your backend)

3. **Click**: "Settings" → "App-Level Environment Variables"

4. **Add these variables** (click "Add Variable" for each):

   ```bash
   USE_CLOUD_STORAGE = true
   ```

   ```bash
   SPACES_ENDPOINT = https://nyc3.digitaloceanspaces.com
   ```

   ```bash
   SPACES_REGION = nyc3
   ```

   ```bash
   SPACES_ACCESS_KEY_ID = [paste your Access Key here]
   ```

   ```bash
   SPACES_SECRET_ACCESS_KEY = [paste your Secret Key here]
   ```

   ```bash
   SPACES_BUCKET = contrezz-uploads
   ```

   ```bash
   SPACES_CDN_ENDPOINT = https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com
   ```

5. **Click "Save"**

6. **Wait for auto-redeploy** (3-5 minutes)

---

## Step 4: Set CORS Permissions (2 minutes)

1. **Go to**: https://cloud.digitalocean.com/spaces/contrezz-uploads

2. **Click**: "Settings" → "CORS Configurations"

3. **Add CORS Rule**:
   ```json
   {
     "AllowedOrigins": ["https://contrezz.com", "https://www.contrezz.com"],
     "AllowedMethods": ["GET", "HEAD"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3600
   }
   ```

4. **Click "Save"**

---

## Step 5: Test (5 minutes)

1. **Wait for deployment** to finish (check App Platform logs)

2. **Look for this in logs**:
   ```
   ✅ Cloud storage (DigitalOcean Spaces) initialized
   ```

3. **Go to**: https://contrezz.com

4. **Login as admin**

5. **Go to**: Platform Settings

6. **Upload a new logo**

7. **Verify**:
   - ✅ Logo appears immediately
   - ✅ Logo URL starts with `https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com/`
   - ✅ Logo persists after page refresh
   - ✅ Logo shows in all dashboards (Admin, Owner, Manager, Developer, Tenant)

8. **Test persistence**:
   - Go to App Platform
   - Click "Actions" → "Force Rebuild and Deploy"
   - Wait for deployment
   - Check if logo still shows ✅

---

## ✅ Success Checklist

- [ ] DigitalOcean Space created (`contrezz-uploads`)
- [ ] API keys generated and saved
- [ ] 7 environment variables added to App Platform
- [ ] App redeployed successfully
- [ ] CORS configured
- [ ] Logo uploaded successfully
- [ ] Logo URL starts with CDN endpoint
- [ ] Logo persists after refresh
- [ ] Logo shows in all dashboards
- [ ] Logo persists after force redeploy

---

## 💰 Cost

**$5/month** for DigitalOcean Spaces
- Includes 250 GB storage
- Includes 1 TB bandwidth
- Includes CDN delivery
- No surprise charges!

---

## 🆘 Troubleshooting

### Logo still shows 404

**Check environment variables**:
```bash
# In App Platform → Settings → Environment Variables
# Verify all 7 variables are set correctly
```

**Check logs**:
```bash
# In App Platform → Runtime Logs
# Look for: "✅ Cloud storage (DigitalOcean Spaces) initialized"
# If you see: "⚠️ Cloud storage enabled but credentials missing"
# → Double-check your API keys
```

### Logo uploads but doesn't display

**Check the URL in database**:
- Should start with: `https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com/`
- NOT: `/uploads/logos/...`

**Check CORS**:
- Go to Spaces → Settings → CORS
- Ensure `contrezz.com` is in AllowedOrigins

### Credentials not working

**Regenerate keys**:
1. Go to: https://cloud.digitalocean.com/account/api/spaces
2. Delete old key
3. Generate new key
4. Update environment variables in App Platform
5. Wait for redeploy

---

## 📞 Need Help?

1. **Check logs**: App Platform → Runtime Logs
2. **Check Space**: Verify files are being uploaded
3. **Check CORS**: Ensure proper configuration
4. **Review docs**: `PLATFORM_LOGO_PRODUCTION_FIX.md`

---

## 🎉 Done!

Your platform logo will now persist across deployments and be delivered via CDN for fast loading worldwide!

**Next**: Upload your logo and test it across all dashboards.

