# Upstash Redis Setup Guide for Verification Service

**Date:** November 26, 2025  
**Purpose:** Alternative to DigitalOcean Redis (account not enabled)  
**Cost:** FREE for development/testing, pay-as-you-go for production

---

## 📋 Step-by-Step Setup

### **Step 1: Sign Up for Upstash**

1. **Go to Upstash website:**
   ```
   https://upstash.com/
   ```

2. **Click "Get Started" or "Sign Up"**

3. **Choose sign-up method:**
   - **Option A:** Sign up with GitHub (fastest)
     - Click "Continue with GitHub"
     - Authorize Upstash
   
   - **Option B:** Sign up with Google
     - Click "Continue with Google"
     - Select your Google account
   
   - **Option C:** Sign up with Email
     - Enter your email
     - Create a password
     - Verify your email

4. **Complete registration**
   - You'll be redirected to the Upstash dashboard

---

### **Step 2: Create Redis Database**

1. **In the Upstash Dashboard:**
   - Click **"Create Database"** (big green button)

2. **Configure Database Settings:**

   **Name:**
   ```
   verification-redis-prod
   ```

   **Type:**
   - Select: **"Regional"** (better performance than Global)

   **Region:**
   - Select: **"us-east-1"** (AWS US East - closest to DigitalOcean NYC3)
   - Alternative: **"us-central1"** (if us-east-1 not available)

   **Eviction:**
   - Keep default: **"No Eviction"** (recommended for job queues)

   **TLS:**
   - Keep: **"Enabled"** (secure connection)

3. **Click "Create"**
   - Database will be created in ~30 seconds

---

### **Step 3: Get Connection Details**

After database is created, you'll see the database details page.

#### **Copy These Values:**

1. **Endpoint:**
   ```
   Example: us1-merry-firefly-12345.upstash.io
   ```

2. **Port:**
   ```
   Usually: 6379 (standard Redis port)
   ```

3. **Password:**
   ```
   Click the "eye" icon to reveal
   Example: AXbCD1234567890abcdefghijklmnopqrstuvwxyz
   ```

4. **Connection String (Redis URL):**
   - Scroll down to **"Connect your database"** section
   - Look for **"Node.js"** or **"Redis URL"** tab
   - Copy the full connection string:
   ```
   redis://default:AXbCD1234567890abcdefghijklmnopqrstuvwxyz@us1-merry-firefly-12345.upstash.io:6379
   ```

---

### **Step 4: Test Connection (Optional but Recommended)**

1. **Install Redis CLI locally (if not already installed):**
   ```bash
   # macOS
   brew install redis
   
   # Or use Docker
   docker run -it --rm redis redis-cli
   ```

2. **Test connection:**
   ```bash
   redis-cli -u "redis://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379"
   ```

3. **Run test command:**
   ```bash
   PING
   # Should respond: PONG
   
   SET test "hello"
   # Should respond: OK
   
   GET test
   # Should respond: "hello"
   
   exit
   ```

4. **If it works, you're all set!** ✅

---

### **Step 5: Update Your Environment Variables**

1. **Open your environment variables file:**
   ```bash
   # The file created by deploy-verification-service.sh
   nano verification-service-env-vars.txt
   ```

2. **Update the REDIS_URL:**
   ```bash
   # Replace this line:
   REDIS_URL=redis://user:pass@host:port
   
   # With your Upstash connection string:
   REDIS_URL=redis://default:AXbCD1234567890abcdefghijklmnopqrstuvwxyz@us1-merry-firefly-12345.upstash.io:6379
   ```

3. **Save the file**

---

### **Step 6: Verify Configuration**

Your `verification-service-env-vars.txt` should now look like:

```bash
# Verification Service Environment Variables

NODE_ENV=production
PORT=8080

# Database (from DigitalOcean)
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis (from Upstash) ✅
REDIS_URL=redis://default:AXbCD1234567890abcdefghijklmnopqrstuvwxyz@us1-merry-firefly-12345.upstash.io:6379

# DigitalOcean Spaces
SPACES_ACCESS_KEY_ID=<your-spaces-key>
SPACES_SECRET_ACCESS_KEY=<your-spaces-secret>
SPACES_REGION=nyc3
SPACES_BUCKET=contrezz-uploads
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Dojah API
DOJAH_API_KEY=<your-dojah-key>
DOJAH_APP_ID=<your-dojah-app-id>

# Security
ENCRYPTION_KEY=<generated-by-script>
API_KEY_MAIN_DASHBOARD=<generated-by-script>

# Main Dashboard
MAIN_DASHBOARD_URL=https://your-backend.ondigitalocean.app
```

---

## 🎯 Next Steps

Now that you have Redis configured:

### **1. Continue with Deployment:**

Follow the deployment guide:
```bash
# Open the deployment guide
cat DEPLOYMENT_QUICK_REFERENCE.md
```

### **2. Create App in DigitalOcean:**

- Go to: https://cloud.digitalocean.com/apps
- Create new app
- Use environment variables from `verification-service-env-vars.txt`
- **Important:** Use the Upstash Redis URL for `REDIS_URL`

### **3. Deploy and Test:**

After deployment, verify Redis is working:
```bash
# Check verification service logs
doctl apps logs <your-app-id> --type run

# Look for:
# ✅ Redis connection established
# ✅ BullMQ queue initialized
```

---

## 📊 Upstash Free Tier Limits

**What's Included:**
- ✅ **10,000 commands per day** (resets daily)
- ✅ **256 MB storage**
- ✅ **100 concurrent connections**
- ✅ **TLS encryption**
- ✅ **Daily backups**

**Is This Enough?**

For **development/testing:** Absolutely! ✅

For **production:**
- Low traffic (<500 users/day): Yes ✅
- Medium traffic (500-5000 users/day): Probably need paid tier
- High traffic (>5000 users/day): Definitely need paid tier

**Monitoring Usage:**
- Go to Upstash Dashboard
- Click on your database
- View **"Metrics"** tab
- Monitor daily command count

---

## 💰 Upstash Pricing (If You Exceed Free Tier)

**Pay-as-you-go:**
- $0.20 per 100,000 commands
- No monthly minimum
- Only pay for what you use

**Example Costs:**
- 50,000 commands/day = ~$3/month
- 100,000 commands/day = ~$6/month
- 500,000 commands/day = ~$30/month

**Still cheaper than DigitalOcean Redis ($15/month fixed)** for low-medium traffic!

---

## 🔄 Migrating to DigitalOcean Redis Later

When DigitalOcean enables Redis for your account:

### **Step 1: Create DigitalOcean Redis**
```bash
doctl databases create verification-redis-prod \
  --engine redis \
  --version 7 \
  --size db-s-1vcpu-1gb \
  --region nyc3 \
  --num-nodes 1
```

### **Step 2: Get Connection String**
```bash
doctl databases connection verification-redis-prod
```

### **Step 3: Update Environment Variable**
In DigitalOcean App Platform:
1. Go to your verification service app
2. Settings → Environment Variables
3. Update `REDIS_URL` with new DigitalOcean Redis URL
4. Save and redeploy

### **Step 4: Verify**
```bash
# Check logs
doctl apps logs <app-id> --type run

# Should see: Redis connection established
```

**That's it!** No code changes needed - just update the connection string.

---

## 🆘 Troubleshooting

### **Issue: Can't connect to Upstash Redis**

**Check:**
1. **Connection string format:**
   ```
   redis://default:PASSWORD@ENDPOINT:6379
   ```
   Must start with `redis://` (not `rediss://` unless using TLS)

2. **Password is correct:**
   - Copy from Upstash dashboard
   - No extra spaces
   - Include full password

3. **Endpoint is correct:**
   - Should end with `.upstash.io`
   - Port should be `6379`

4. **Firewall/Network:**
   - Upstash allows connections from anywhere
   - No IP whitelisting needed

### **Issue: "Too many commands" error**

**Solution:**
- You've exceeded 10,000 commands/day
- Upgrade to paid tier ($0.20 per 100K commands)
- Or wait until midnight UTC for reset

### **Issue: Connection timeout**

**Check:**
1. **Region:** Make sure you chose `us-east-1` (closest to DigitalOcean)
2. **Network:** Verify your app can reach external services
3. **TLS:** If using `rediss://` (with TLS), make sure your app supports it

---

## 📞 Support

**Upstash Documentation:**
- https://docs.upstash.com/redis

**Upstash Support:**
- Discord: https://upstash.com/discord
- Email: support@upstash.com

**Need Help?**
- Check Upstash docs
- Review verification service logs
- Test connection with redis-cli

---

## ✅ Checklist

- [ ] Signed up for Upstash
- [ ] Created Redis database (us-east-1, Regional)
- [ ] Copied connection string
- [ ] Tested connection (optional)
- [ ] Updated `verification-service-env-vars.txt`
- [ ] Ready to deploy to DigitalOcean App Platform

---

**Last Updated:** November 26, 2025  
**Setup Time:** ~10 minutes  
**Status:** ✅ READY TO USE

