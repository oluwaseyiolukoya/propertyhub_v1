# Quick Deploy to DigitalOcean - 15 Minutes

This is a streamlined guide to get your app running on DigitalOcean as fast as possible.

## Prerequisites (5 minutes)

1. **DigitalOcean Account:** Sign up at https://digitalocean.com
2. **Git Repository:** Your code must be on GitHub or GitLab
3. **Generate JWT Secret:** Run this command and save the output:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

## Step 1: Create Database (3 minutes)

1. Go to https://cloud.digitalocean.com/databases
2. Click **"Create Database Cluster"**
3. Choose:
   - **Engine:** PostgreSQL 15
   - **Plan:** Basic ($15/month)
   - **Region:** Closest to your users
   - **Name:** `contrezz-db`
4. Click **"Create Database Cluster"**
5. Wait 3-5 minutes for provisioning
6. Go to **"Connection Details"** → Copy the **"Connection String"**
7. Go to **"Settings"** → **"Trusted Sources"** → Add **"All App Platform Apps"**

## Step 2: Deploy Backend (4 minutes)

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. **Connect Repository:**
   - Choose GitHub/GitLab
   - Select your repository
   - Choose branch: `main`
4. **Configure Backend:**
   - Click **"Edit"** on the detected service
   - **Name:** `backend`
   - **Type:** Web Service
   - **Source Directory:** `/backend`
   - **Build Command:** `npm install && npm run build`
   - **Run Command:** `npm start`
   - **HTTP Port:** `5000`
   - **Instance Size:** Basic ($5/month)
5. **Add Environment Variables:**
   Click **"Environment Variables"** → Add these:
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=<paste-your-generated-secret>
   JWT_EXPIRES_IN=7d
   MAX_FILE_SIZE=5242880
   UPLOAD_DIR=./uploads
   ```
6. **Link Database:**
   - Scroll to **"Database"**
   - Click **"Attach Database"**
   - Select `contrezz-db`
   - This auto-creates `DATABASE_URL`
7. Click **"Next"** → **"Next"** → **"Create Resources"**
8. Wait 5-7 minutes for deployment
9. **Copy Backend URL** (looks like: `https://backend-xxxxx.ondigitalocean.app`)

## Step 3: Deploy Frontend (3 minutes)

1. In your app, click **"Create"** → **"Component"** → **"Static Site"**
2. **Configure Frontend:**
   - **Name:** `frontend`
   - **Source Directory:** `/`
   - **Build Command:** `npm install && npm run build`
   - **Output Directory:** `dist`
3. **Add Environment Variable:**
   ```
   VITE_API_URL=<paste-your-backend-url>
   ```
4. Click **"Create Component"**
5. Wait 3-5 minutes for deployment
6. **Copy Frontend URL** (looks like: `https://frontend-xxxxx.ondigitalocean.app`)

## Step 4: Update Backend CORS (1 minute)

1. Go to **Backend Service** → **"Settings"** → **"Environment Variables"**
2. Add:
   ```
   FRONTEND_URL=<paste-your-frontend-url>
   ```
3. Click **"Save"**
4. Backend will automatically redeploy

## Step 5: Initialize Database (2 minutes)

1. Go to **Backend Service** → **"Console"** tab
2. Click **"Launch Console"**
3. Run these commands:
   ```bash
   npx prisma generate
   npx prisma db push --accept-data-loss
   npm run prisma:seed
   ```
4. Wait for completion (you'll see "Seeding complete" message)

## Step 6: Test Your App (2 minutes)

1. Open your **Frontend URL** in a browser
2. Login with default credentials:
   ```
   Email: admin@contrezz.com
   Password: Admin123!@#
   ```
3. **Change the password immediately!**
4. Test creating a property owner, property, and tenant

## Done! 🎉

Your app is now live at:
- **Frontend:** `https://frontend-xxxxx.ondigitalocean.app`
- **Backend:** `https://backend-xxxxx.ondigitalocean.app`

---

## Optional: Add Custom Domain (5 minutes)

### For Frontend (app.yourdomain.com):

1. Go to **Frontend Service** → **"Settings"** → **"Domains"**
2. Click **"Add Domain"** → Enter: `app.yourdomain.com`
3. In your DNS provider, add:
   ```
   Type: CNAME
   Name: app
   Value: frontend-xxxxx.ondigitalocean.app
   TTL: 3600
   ```
4. Wait 5-10 minutes for SSL to activate

### For Backend (api.yourdomain.com):

1. Go to **Backend Service** → **"Settings"** → **"Domains"**
2. Click **"Add Domain"** → Enter: `api.yourdomain.com`
3. In your DNS provider, add:
   ```
   Type: CNAME
   Name: api
   Value: backend-xxxxx.ondigitalocean.app
   TTL: 3600
   ```
4. Update environment variables:
   - Backend: `FRONTEND_URL=https://app.yourdomain.com`
   - Frontend: `VITE_API_URL=https://api.yourdomain.com`
5. Both services will redeploy automatically

---

## Optional: Add Paystack (for Payments)

If you want to enable payment processing:

1. Get your Paystack keys from: https://dashboard.paystack.com/#/settings/developers
2. Go to **Backend Service** → **"Settings"** → **"Environment Variables"**
3. Add:
   ```
   PAYSTACK_SECRET_KEY=sk_live_xxxxx
   PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
   PAYSTACK_TEST_SECRET_KEY=sk_test_xxxxx
   PAYSTACK_TEST_PUBLIC_KEY=pk_test_xxxxx
   ```
4. Save (backend will redeploy)

---

## Troubleshooting

### Backend won't start?
- Check **Runtime Logs** for errors
- Verify `DATABASE_URL` is set (should be auto-injected)
- Verify `JWT_SECRET` is set

### Frontend shows blank page?
- Check **Build Logs** for errors
- Verify `VITE_API_URL` is correct
- Open browser console for errors

### Can't login?
- Verify you ran `npm run prisma:seed` in backend console
- Check backend logs for database errors

### CORS errors?
- Verify `FRONTEND_URL` in backend matches your frontend URL exactly
- No trailing slash in URLs

### Database connection fails?
- Go to Database → Settings → Trusted Sources
- Ensure "All App Platform Apps" is added

---

## Next Steps

1. **Change default password** (admin@contrezz.com)
2. **Create your first property owner**
3. **Set up monitoring** (DigitalOcean provides built-in monitoring)
4. **Add custom domain** (optional but recommended)
5. **Enable payments** (add Paystack keys)
6. **Invite your team**

---

## Cost Breakdown

```
Backend (Basic):        $5/month
Frontend (Static):      $3/month
Database (Basic):      $15/month
Bandwidth (1TB):       Included
─────────────────────────────────
Total:                ~$23/month
```

---

## Support

- **Full Guide:** See `docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md`
- **Checklist:** See `docs/DEPLOYMENT_CHECKLIST.md`
- **DigitalOcean Docs:** https://docs.digitalocean.com/products/app-platform/

---

**Deployment Time:** ~15 minutes
**Last Updated:** October 31, 2025

