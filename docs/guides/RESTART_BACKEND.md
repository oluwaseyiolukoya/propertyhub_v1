# Restart Backend to Apply Changes

## The Issue
The backend is running **old compiled code** from before the Paystack fallback fix. You need to restart it to load the new code.

## Quick Restart

### Option 1: If Backend is Running in Terminal

1. **Find the terminal where backend is running**
2. **Press `Ctrl+C`** to stop it
3. **Restart:**
```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npm run dev
```

### Option 2: Kill All Backend Processes

```bash
# Kill all backend processes
pkill -f "tsx watch src/index.ts"
pkill -f "npm run dev"

# Wait 2 seconds
sleep 2

# Start fresh
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npm run dev
```

### Option 3: Restart Script

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor
./backend/start.sh
```

## Verify It's Working

After restart, check the logs:

```bash
tail -f backend/backend-dev.log
```

**Look for:**
```
[Upgrade] Resolving Paystack configuration...
[Upgrade] Paystack keys resolved: { hasSecretKey: true, hasPublicKey: true, source: 'env' }
```

## Test the Upgrade

1. **Login as developer**
2. **Go to Settings → Billing**
3. **Click "Change Plan"**
4. **Select upgrade plan**
5. **Click "Upgrade Plan"**

**Expected:**
- ✅ Backend logs show: `[Upgrade] Paystack initialized successfully`
- ✅ Redirected to Paystack payment page
- ✅ Can complete payment

## If Still Not Working

Check backend logs for the actual error:

```bash
# Watch backend logs in real-time
tail -f backend/backend-dev.log

# Or check last 50 lines
tail -50 backend/backend-dev.log
```

Look for lines starting with `[Upgrade]` to see what's happening.

## Common Issues

### Issue 1: "Payment gateway not configured"
**Cause:** Backend not restarted after adding keys
**Fix:** Restart backend (see above)

### Issue 2: "Invalid API key"
**Cause:** Wrong Paystack keys
**Fix:** Check keys in `.env` file match your Paystack dashboard

### Issue 3: Backend won't start
**Cause:** Port already in use
**Fix:** Kill all processes and restart:
```bash
pkill -f "tsx watch"
pkill -f "npm run dev"
cd backend && npm run dev
```

## Quick Check

Run this to verify everything:

```bash
cd backend
node -e "
require('dotenv').config();
console.log('Keys set:', {
  secret: !!process.env.PAYSTACK_SECRET_KEY,
  public: !!process.env.PAYSTACK_PUBLIC_KEY
});
"
```

Should show: `{ secret: true, public: true }`

That's it! Just restart the backend and it will work. 🚀

