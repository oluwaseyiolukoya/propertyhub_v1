# How to Check Deployment in Digital Ocean Console 🖥️

## 📋 Quick Guide to Monitor Your Deployment

---

## 🌐 Step 1: Access Digital Ocean Dashboard

### **Option A: Direct Link**
```
https://cloud.digitalocean.com/apps
```

### **Option B: Via Main Dashboard**
1. Go to: https://cloud.digitalocean.com/
2. Click on "Apps" in the left sidebar
3. Find your app (likely named "contrezz-backend" or similar)

---

## 📊 Step 2: View Deployment Status

### **In the Apps Dashboard:**

1. **Click on your app name**
   - You'll see the app overview page

2. **Look at the top banner:**
   - 🟢 **Green "Live"** = Deployment successful, app running
   - 🟡 **Yellow "Deploying"** = Currently deploying
   - 🔴 **Red "Failed"** = Deployment failed
   - 🟠 **Orange "Building"** = Currently building

3. **Click on "Deployments" tab** (near the top)
   - This shows all deployment history
   - Most recent deployment is at the top

---

## 🔍 Step 3: Check Build Logs

### **View Real-Time Build Logs:**

1. **In the Deployments tab:**
   - Find the most recent deployment (top of the list)
   - Status will show: "Building", "Deploying", "Active", or "Failed"

2. **Click on the deployment row**
   - This opens the detailed deployment view

3. **Click "View Logs" or "Build Logs"**
   - You'll see real-time output of the build process

### **What to Look For in Build Logs:**

```bash
# ✅ GOOD - Look for these success messages:

-----> Installing dependencies
       npm ci
       ✓ Dependencies installed

-----> Running build command
       npm run build
       
       > prisma generate
       ✓ Prisma Client generated successfully
       
       > npx swc src -d dist --copy-files
       ✓ Build completed

-----> Creating deployment
       ✓ Deployment created successfully
```

```bash
# ❌ BAD - If you see these, there's still an issue:

waiting on pid 121: ... EOF
# OR
Error: Command failed with exit code 1
# OR
Build failed
```

---

## 📱 Step 4: Check Runtime Logs

### **View Application Logs:**

1. **In your app dashboard:**
   - Click on "Runtime Logs" tab (or "Logs")

2. **Select your backend component:**
   - Usually named "backend" or "web"

3. **View live logs:**
   - Shows real-time output from your running application

### **What to Look For in Runtime Logs:**

```bash
# ✅ GOOD - Application started successfully:

Server running on port 5000
Database connected successfully
✓ All services initialized

# ❌ BAD - If you see errors:

Error: Cannot find module '.prisma/client'
# OR
ECONNREFUSED: Database connection failed
# OR
Application crashed
```

---

## 🎯 Step 5: Test Your Application

### **Quick Health Check:**

1. **Find your app URL:**
   - In the app overview, look for "Live App" URL
   - Example: `https://your-app-name.ondigitalocean.app`

2. **Test the health endpoint:**
   ```bash
   # In your terminal (local machine)
   curl https://your-app-name.ondigitalocean.app/health
   
   # Expected response:
   {"status":"ok","timestamp":"2025-11-19T..."}
   ```

3. **Or open in browser:**
   - Navigate to: `https://your-app-name.ondigitalocean.app/health`
   - Should see JSON response

---

## 📸 Visual Guide

### **1. Apps Dashboard View:**

```
┌─────────────────────────────────────────────────┐
│ Digital Ocean Dashboard                         │
├─────────────────────────────────────────────────┤
│ ☰ Menu                                          │
│   • Droplets                                    │
│   • Apps           ← Click here                 │
│   • Databases                                   │
│   • Spaces                                      │
└─────────────────────────────────────────────────┘
```

### **2. App Overview:**

```
┌─────────────────────────────────────────────────┐
│ contrezz-backend                    🟢 Live     │
├─────────────────────────────────────────────────┤
│ Tabs:                                           │
│ [Overview] [Deployments] [Runtime Logs] [...]   │
│                                                 │
│ Live App: https://your-app.ondigitalocean.app   │
│                                                 │
│ Components:                                     │
│ • backend (Professional XS) - Running           │
│ • contrezz-db-prod - Connected                  │
└─────────────────────────────────────────────────┘
```

### **3. Deployments Tab:**

```
┌─────────────────────────────────────────────────┐
│ Deployments                                     │
├─────────────────────────────────────────────────┤
│ Commit          Status      Time       Actions  │
├─────────────────────────────────────────────────┤
│ 412297e         🟡 Building  2m ago    [View]   │ ← Current
│ fix: generate...                                │
│                                                 │
│ 5e68286         🟢 Active    1h ago    [View]   │ ← Previous
│ feat: implement...                              │
└─────────────────────────────────────────────────┘
```

### **4. Build Logs View:**

```
┌─────────────────────────────────────────────────┐
│ Build Logs - Deployment 412297e                 │
├─────────────────────────────────────────────────┤
│ [Auto-refresh: ON]                   [Download] │
├─────────────────────────────────────────────────┤
│ -----> Installing dependencies                  │
│        npm ci                                   │
│        added 234 packages in 45s                │
│                                                 │
│ -----> Running build command                    │
│        npm run build                            │
│        > prisma generate                        │
│        ✓ Generated Prisma Client                │
│        > npx swc src -d dist                    │
│        Successfully compiled 42 files           │
│                                                 │
│ -----> Build completed successfully             │
│        Creating deployment...                   │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Common Scenarios

### **Scenario 1: Deployment is Building**

**What you see:**
- Status: 🟡 "Building"
- Build logs showing progress

**What to do:**
- ✅ Wait patiently (5-7 minutes)
- ✅ Watch the build logs
- ✅ Look for "Prisma Client generated successfully"

---

### **Scenario 2: Build Failed**

**What you see:**
- Status: 🔴 "Failed"
- Error messages in build logs

**What to do:**
1. **Read the error message carefully**
2. **Common issues:**
   - Missing environment variables
   - Database connection error
   - Syntax error in code
3. **Check the specific error and fix**
4. **Push fix and redeploy**

---

### **Scenario 3: Build Succeeded, App Crashed**

**What you see:**
- Build logs: ✅ Success
- Runtime logs: ❌ Errors

**What to do:**
1. **Check Runtime Logs tab**
2. **Look for error messages**
3. **Common issues:**
   - Missing environment variables at runtime
   - Database connection issues
   - Port binding problems
4. **Fix and redeploy**

---

### **Scenario 4: Everything Green**

**What you see:**
- Status: 🟢 "Live"
- Build logs: All success
- Runtime logs: "Server running on port 5000"

**What to do:**
- 🎉 **Success!** Your app is running
- ✅ Test your endpoints
- ✅ Monitor for any issues

---

## 📱 Mobile App (Optional)

Digital Ocean has a mobile app for iOS and Android:

1. **Download:** Search "Digital Ocean" in App Store or Google Play
2. **Login:** Use your Digital Ocean credentials
3. **View Apps:** Navigate to Apps section
4. **Monitor:** Check deployment status on the go

---

## 🔔 Set Up Alerts (Recommended)

### **Get Notified of Deployment Status:**

1. **In your app dashboard:**
   - Click "Settings" tab
   - Scroll to "Alerts"

2. **Configure alerts:**
   - ✅ Deployment failed
   - ✅ App crashed
   - ✅ High resource usage

3. **Choose notification method:**
   - Email
   - Slack
   - PagerDuty

---

## 🎯 Quick Checklist

After pushing your code, check these in order:

- [ ] **Apps Dashboard** - Is deployment triggered?
- [ ] **Deployments Tab** - Is it building?
- [ ] **Build Logs** - Is Prisma generating successfully?
- [ ] **Build Status** - Did build complete?
- [ ] **Runtime Logs** - Is app starting?
- [ ] **App Status** - Is it showing "Live"?
- [ ] **Health Endpoint** - Does it respond?
- [ ] **API Endpoints** - Are they working?

---

## 🆘 Troubleshooting Commands

### **If you need to SSH into the container:**

```bash
# Digital Ocean doesn't provide direct SSH to App Platform containers
# But you can use the console feature:

1. Go to your app in Digital Ocean
2. Click on "Console" tab
3. Select your backend component
4. Click "Launch Console"

# Then you can run commands like:
ls -la
cat package.json
node --version
npm --version
```

---

## 📞 Need Help?

### **If deployment fails:**

1. **Screenshot the error** from build logs
2. **Copy the full error message**
3. **Check environment variables** are set correctly
4. **Review recent code changes**
5. **Contact support** if needed

### **Digital Ocean Support:**

- **Documentation:** https://docs.digitalocean.com/products/app-platform/
- **Community:** https://www.digitalocean.com/community/
- **Support Tickets:** Available in dashboard

---

## ✅ Summary

**To check your deployment:**

1. Go to: https://cloud.digitalocean.com/apps
2. Click your app
3. Check "Deployments" tab
4. View "Build Logs" for current deployment
5. Check "Runtime Logs" once deployed
6. Test your app URL

**Expected timeline:**
- Build: 3-5 minutes
- Deploy: 1-2 minutes
- Total: ~5-7 minutes

**Success indicators:**
- 🟢 Status: "Live"
- ✅ Build logs: "Prisma Client generated successfully"
- ✅ Runtime logs: "Server running on port 5000"
- ✅ Health endpoint responds

---

**Your deployment should be visible in the console within 1-2 minutes of pushing to GitHub!** 🚀

