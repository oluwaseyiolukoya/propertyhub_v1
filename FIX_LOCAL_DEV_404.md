# Fix 404 Errors in Local Development

## Problem

Getting 404 errors for API routes in local development:

- `:5173/api/properties` - 404
- `:5173/api/units` - 404
- `:5173/api/payments` - 404
- `:5173/api/maintenance` - 404
- `:5173/api/expenses` - 404

## Root Causes

1. **Vite proxy configuration issue** - Proxy was using `VITE_API_URL` which might point to production
2. **Backend not running** - Local backend server might not be started
3. **Wrong proxy target** - Proxy should always use `localhost:5000` in dev

## Fixes Applied

### ✅ Fix 1: Correct Vite Proxy Configuration

**Changed:** `vite.config.ts`

**Before:**

```typescript
proxy: {
  '/api': {
    target: process.env.VITE_API_URL || 'http://localhost:5000',
    changeOrigin: true,
  },
}
```

**After:**

```typescript
proxy: {
  '/api': {
    // In development, always proxy to local backend
    // VITE_API_URL is for production builds, not dev proxy
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,
  },
}
```

**Why:** In development, the proxy should always point to `localhost:5000` regardless of `VITE_API_URL` (which is for production builds).

## Next Steps

### 1. Start the Backend Server

The backend must be running on `localhost:5000` for the proxy to work:

```bash
# Navigate to backend directory
cd backend

# Start the backend server
npm run dev
```

**Expected output:**

```
🚀 Server running on port 5000
✅ Environment variables validated successfully
```

### 2. Restart the Frontend Dev Server

After fixing `vite.config.ts`, restart the frontend:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### 3. Verify It's Working

1. **Check backend is running:**

   ```bash
   curl http://localhost:5000/api/health
   ```

   Should return: `{"status":"ok"}`

2. **Check frontend proxy:**

   - Open browser: `http://localhost:5173`
   - Open DevTools → Network tab
   - Make an API call (e.g., load dashboard)
   - Check that requests to `/api/*` are proxied to `localhost:5000`

3. **Test in browser console:**
   ```javascript
   fetch("/api/health")
     .then((r) => r.json())
     .then(console.log);
   ```
   Should return: `{status: "ok"}`

## Quick Start Script

You can use the existing start script:

```bash
# From project root
./start-local-dev.sh
```

Or manually:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

## Troubleshooting

### Issue: Still Getting 404

**Check 1: Backend is running**

```bash
lsof -ti:5000
# Should return a process ID
```

**Check 2: Backend is responding**

```bash
curl http://localhost:5000/api/health
# Should return JSON
```

**Check 3: Vite proxy is configured**

- Check `vite.config.ts` has the proxy configuration
- Restart Vite dev server after changes

**Check 4: No conflicting env vars**

```bash
# Check .env file
cat .env | grep VITE_API_URL

# In dev, VITE_API_URL shouldn't affect proxy
# But if it's set to production URL, make sure backend is running locally
```

### Issue: CORS Errors

If you see CORS errors, check backend CORS configuration:

**Backend should allow:**

```typescript
// backend/src/index.ts
const allowedOrigins = [
  "http://localhost:5173", // ✅ Frontend dev server
  "http://localhost:5174", // ✅ Alternative port
  // ... other origins
];
```

### Issue: Backend Won't Start

**Check database:**

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

**Check environment variables:**

```bash
cd backend
cat .env.local  # or .env
# Should have DATABASE_URL, JWT_SECRET, etc.
```

**Check port availability:**

```bash
lsof -ti:5000
# If something is using port 5000, kill it or change PORT in .env
```

## Expected Behavior

After fixes:

1. ✅ Backend runs on `http://localhost:5000`
2. ✅ Frontend runs on `http://localhost:5173`
3. ✅ Frontend requests to `/api/*` are proxied to `localhost:5000`
4. ✅ API calls work correctly
5. ✅ No 404 errors

## Summary

- **Fixed:** Vite proxy now always uses `localhost:5000` in dev
- **Action Required:** Start backend server with `cd backend && npm run dev`
- **Restart:** Frontend dev server after config change

---

**Status:** ✅ Configuration fixed, needs backend running
**Time to Fix:** 1-2 minutes (start backend)
