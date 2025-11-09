# 🔧 Fix Paystack Popup CORS Issues in Local Development

## ❌ The Problem

When testing Paystack payment popup locally, you see these errors:

```
Access to script at 'https://s3-eu-west-1.amazonaws.com/pstk-public-files/js/pusher.min.js' 
from origin 'https://checkout.paystack.com' has been blocked by CORS policy: 
Permission was denied for this request to access the `unknown` address space.

Failed to load resource: net::ERR_FAILED
```

**Result:** The Paystack popup appears but is **unresponsive** - you can't click anything.

---

## 🎯 Root Cause

This is a **browser security feature** called **Private Network Access (PNA)** that blocks requests from public domains (like Paystack's checkout) to local/private networks (your `localhost:5173`).

### Why It Happens:

1. Your app runs on `localhost:5173` (private network)
2. Paystack popup loads from `https://checkout.paystack.com` (public network)
3. Browser blocks public → private communication for security
4. Paystack's scripts can't load, popup becomes unresponsive

---

## ✅ Solutions (Choose One)

### **Solution 1: Use Chrome with Disabled Web Security (Quick Test)**

⚠️ **For testing only! Never browse the internet with this flag.**

#### macOS:

```bash
# Close all Chrome windows first
pkill "Google Chrome"

# Start Chrome with security disabled
open -na "Google Chrome" --args \
  --disable-web-security \
  --user-data-dir="/tmp/chrome_dev_test" \
  --disable-features=IsolateOrigins,site-per-process \
  http://localhost:5173
```

#### Windows:

```cmd
# Close all Chrome windows first
taskkill /F /IM chrome.exe

# Start Chrome with security disabled
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --disable-web-security ^
  --user-data-dir="C:\tmp\chrome_dev_test" ^
  --disable-features=IsolateOrigins,site-per-process ^
  http://localhost:5173
```

#### Linux:

```bash
# Close all Chrome windows first
pkill chrome

# Start Chrome with security disabled
google-chrome \
  --disable-web-security \
  --user-data-dir="/tmp/chrome_dev_test" \
  --disable-features=IsolateOrigins,site-per-process \
  http://localhost:5173
```

**After testing, close this Chrome window and reopen Chrome normally.**

---

### **Solution 2: Use ngrok (Recommended for Testing)**

Expose your local server to a public URL that Paystack can access.

#### Step 1: Install ngrok

**macOS:**
```bash
brew install ngrok
```

**Windows/Linux:**
Download from https://ngrok.com/download

#### Step 2: Start Your Servers

```bash
# Terminal 1: Backend
cd backend
PORT=5000 npm run dev

# Terminal 2: Frontend
cd ..
npm run dev
```

#### Step 3: Expose Frontend with ngrok

```bash
# Terminal 3: ngrok
ngrok http 5173
```

You'll see:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5173
```

#### Step 4: Update Frontend Environment

Create or update `.env.local`:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_URL=https://abc123.ngrok.io
```

#### Step 5: Update Paystack Configuration

In your Paystack Dashboard:
1. Go to Settings → API Keys & Webhooks
2. Add `https://abc123.ngrok.io` to allowed domains

#### Step 6: Test Payment

1. Open `https://abc123.ngrok.io` (not localhost)
2. Login and try payment
3. Paystack popup should work perfectly ✅

**Note:** ngrok URLs change each time you restart. For a permanent URL, use ngrok's paid plan or deploy to a staging server.

---

### **Solution 3: Deploy to Staging Environment (Best Practice)**

Deploy your dev environment to AWS (you already have the infrastructure set up).

#### Quick Deploy:

```bash
# Push to GitHub
git add .
git commit -m "Test Paystack integration"
git push origin main

# GitHub Actions will automatically deploy to your dev environment
```

#### Test on Dev Environment:

1. Wait for deployment to complete (~5 minutes)
2. Go to your dev URL (e.g., `https://dev.contrezz.com`)
3. Test Paystack payment
4. No CORS issues! ✅

---

### **Solution 4: Use Firefox (Temporary Workaround)**

Firefox has less strict CORS policies for local development.

#### Steps:

1. Open Firefox
2. Go to `http://localhost:5173`
3. Test Paystack payment
4. Should work better than Chrome

**Note:** This is not guaranteed and may still have issues.

---

## 🎯 **Recommended Workflow**

### For Quick Testing:
```
Solution 1 (Chrome with disabled security)
↓
Test payment flow
↓
Close Chrome and reopen normally
```

### For Thorough Testing:
```
Solution 2 (ngrok)
↓
Get public URL
↓
Test payment with real Paystack environment
↓
More realistic testing
```

### For Production-Like Testing:
```
Solution 3 (Deploy to dev environment)
↓
Test on actual AWS infrastructure
↓
Most realistic testing
```

---

## 🧪 **Test Paystack Payment After Fix**

### Step 1: Apply One of the Solutions Above

### Step 2: Login as Customer

```
Email: demo@contrezz.com
Password: demo123
```

### Step 3: Navigate to Upgrade

1. Click **"Upgrade Now"** in trial banner
2. Or go to Settings → Billing → Upgrade

### Step 4: Select Plan

1. Choose a plan (e.g., "Professional")
2. Select billing cycle (Monthly/Annual)
3. Click **"Continue to Payment"**

### Step 5: Test Paystack Popup

1. Paystack popup should appear
2. **Verify:** You can click inside the popup ✅
3. **Verify:** Form fields are interactive ✅
4. **Verify:** Images and logos load ✅

### Step 6: Test Payment

**For Test Mode:**

Use Paystack test cards:
```
Card Number: 4084 0840 8408 4081
CVV: 408
Expiry: 12/30
PIN: 0000
OTP: 123456
```

**Expected Flow:**
1. Enter card details
2. Click "Pay"
3. Enter PIN (if prompted)
4. Enter OTP (if prompted)
5. Payment success ✅
6. Modal shows success message
7. Account upgraded ✅

---

## 🔍 **Verify Fix Worked**

### Check 1: Browser Console

**Before fix:**
```
❌ ERR_FAILED
❌ CORS policy blocked
❌ Permission denied
```

**After fix:**
```
✅ No CORS errors
✅ Scripts load successfully
✅ Paystack popup functional
```

### Check 2: Paystack Popup

**Before fix:**
```
❌ Popup appears but frozen
❌ Can't click anything
❌ Images don't load
```

**After fix:**
```
✅ Popup fully interactive
✅ Can click buttons and fields
✅ Images and logos load
```

### Check 3: Payment Flow

**Before fix:**
```
❌ Can't enter card details
❌ Payment doesn't process
```

**After fix:**
```
✅ Can enter card details
✅ Payment processes successfully
✅ Account upgrades correctly
```

---

## 📊 **Comparison of Solutions**

| Solution | Setup Time | Reliability | Best For |
|----------|-----------|-------------|----------|
| **Chrome (disabled security)** | 1 minute | ⭐⭐⭐ | Quick one-time test |
| **ngrok** | 5 minutes | ⭐⭐⭐⭐ | Regular testing |
| **Deploy to staging** | 10 minutes | ⭐⭐⭐⭐⭐ | Production-like testing |
| **Firefox** | 0 minutes | ⭐⭐ | Emergency fallback |

---

## ⚠️ **Important Notes**

### 1. Never Disable Security for Regular Browsing

The Chrome security flags are **ONLY** for testing. Always close that Chrome window after testing.

### 2. Test Cards Only Work in Test Mode

Make sure you're using Paystack **test keys**, not live keys:
```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx  ✅
PAYSTACK_SECRET_KEY=sk_test_xxxxx       ✅
```

### 3. ngrok URLs Expire

Free ngrok URLs change every time you restart. For permanent URLs:
- Use ngrok paid plan ($8/month)
- Or deploy to staging environment

### 4. Production Won't Have This Issue

This CORS issue **only happens in local development**. Once deployed to production (with a real domain), Paystack works perfectly.

---

## 🎉 **Quick Start (Recommended)**

### Option A: Chrome with Disabled Security (Fastest)

```bash
# 1. Close all Chrome windows
pkill "Google Chrome"

# 2. Start Chrome with security disabled
open -na "Google Chrome" --args \
  --disable-web-security \
  --user-data-dir="/tmp/chrome_dev_test" \
  http://localhost:5173

# 3. Test payment in this Chrome window

# 4. Close this Chrome window when done

# 5. Reopen Chrome normally
open -a "Google Chrome"
```

### Option B: ngrok (Best for Regular Testing)

```bash
# 1. Install ngrok
brew install ngrok

# 2. Start ngrok
ngrok http 5173

# 3. Copy the https URL (e.g., https://abc123.ngrok.io)

# 4. Open that URL in any browser

# 5. Test payment - works perfectly!
```

---

## 🆘 **Still Having Issues?**

### Issue: Chrome security flags don't work

**Solution:** Make sure ALL Chrome windows are closed before starting with flags.

```bash
# Force close all Chrome processes
pkill -9 "Google Chrome"

# Verify Chrome is closed
ps aux | grep Chrome

# Then start with flags
open -na "Google Chrome" --args --disable-web-security --user-data-dir="/tmp/chrome_dev_test" http://localhost:5173
```

### Issue: ngrok URL shows "Tunnel not found"

**Solution:** Make sure frontend is running on port 5173 before starting ngrok.

```bash
# Check if frontend is running
lsof -i :5173

# If not running, start it
npm run dev

# Then start ngrok
ngrok http 5173
```

### Issue: Payment succeeds but account doesn't upgrade

**Solution:** Check backend logs for errors.

```bash
# Check backend terminal for errors
# Look for "Payment verification" or "Upgrade subscription" logs
```

---

## 📝 **Summary**

**Problem:** Paystack popup unresponsive due to CORS policy in local development

**Quick Fix:** Use Chrome with disabled web security (testing only)

**Best Fix:** Use ngrok or deploy to staging

**Production:** No issues - CORS only affects localhost

**Next Step:** Choose a solution above and test the payment flow! 🚀

