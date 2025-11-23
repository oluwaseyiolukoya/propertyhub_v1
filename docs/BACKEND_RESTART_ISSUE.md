# Backend Auto-Restart Issue During Development

## Problem

When testing payment methods (or any feature), if you save a backend file while the backend is running with `tsx watch`, the following happens:

1. `tsx watch` detects the file change
2. Attempts to restart the backend server
3. Old process doesn't shut down cleanly (Redis socket error)
4. New process tries to start but port 5000 is still in use
5. Backend crashes with `EADDRINUSE` error
6. Frontend loses connection and users get logged out

### Error Symptoms

**Backend logs:**
```
SIGTERM received, shutting down gracefully...
❌ Error during socket cleanup: ClientClosedError: The client is closed
Server closed
Error: listen EADDRINUSE: address already in use :::5000
```

**Frontend errors:**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED (port 5000)
Failed to load resource: 500 (Internal Server Error) (/api/auth/verify)
```

**User experience:**
- Payment succeeds in Paystack
- Page redirects back
- Backend is down
- API calls fail
- User gets logged out
- Payment method is NOT saved

## Root Cause

1. **tsx watch** auto-restarts on file changes
2. **Redis socket cleanup** fails during shutdown
3. **Port conflict** prevents new instance from starting
4. **No graceful degradation** - frontend assumes backend failure means invalid auth

## Solutions

### Solution 1: Don't Save Backend Files During Testing (Recommended)

**Workflow:**
1. Make all backend code changes
2. Save files and let backend restart
3. Wait for backend to be fully running (check logs)
4. THEN start testing payment flows
5. Don't save any backend files while testing

### Solution 2: Use nodemon with Proper Delays

Update `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon --watch src --ext ts --exec tsx src/index.ts --delay 2000ms"
  }
}
```

This adds a 2-second delay before restart, giving the old process time to shut down.

### Solution 3: Manual Restart Script

Create a script to safely restart:

```bash
#!/bin/bash
# restart-backend.sh

echo "Stopping backend..."
pkill -9 -f "tsx.*src/index.ts"
sleep 3

echo "Starting backend..."
cd backend
npm run dev > /tmp/backend.log 2>&1 &

sleep 5
echo "Backend restarted. Checking status..."
curl -s http://localhost:5000/api/public/plans > /dev/null && echo "✅ Backend is running" || echo "❌ Backend failed to start"
```

### Solution 4: Disable Auto-Restart for Specific Files

Create `tsx.config.json`:

```json
{
  "watch": {
    "ignore": [
      "src/routes/payment-methods.ts",
      "src/services/recurring-billing.service.ts"
    ]
  }
}
```

Then manually restart when needed.

## Quick Recovery Steps

If the backend crashes during testing:

```bash
# 1. Kill all backend processes
pkill -9 -f "tsx.*src/index.ts"

# 2. Wait a moment
sleep 2

# 3. Restart backend
cd backend
npm run dev > /tmp/backend.log 2>&1 &

# 4. Wait for startup
sleep 8

# 5. Verify it's running
curl http://localhost:5000/api/public/plans

# 6. Refresh frontend
# Go to browser and refresh the page (Cmd+R or Ctrl+R)
```

## Prevention Best Practices

1. **Separate Development Phases:**
   - Phase 1: Write code, save files, let backend restart
   - Phase 2: Test features (don't save backend files)

2. **Use Git Branches:**
   - Make changes in a branch
   - Commit changes
   - Checkout branch to test
   - Backend restarts once
   - Test without further saves

3. **Test in Production Mode:**
   ```bash
   npm run build
   npm start
   ```
   Production mode doesn't auto-restart.

4. **Use Docker:**
   - Backend runs in container
   - File changes don't affect running container
   - Rebuild container when ready to test changes

## Why This Happens

### tsx watch Behavior
- Monitors file changes with `chokidar`
- Sends `SIGTERM` to current process
- Waits briefly for shutdown
- Starts new process
- If old process hasn't released port → crash

### Redis Socket Cleanup
- Socket.io uses Redis adapter
- On shutdown, tries to close Redis connection
- If Redis is already disconnected → error
- Error doesn't prevent shutdown, but slows it down
- New process starts before old one fully exits

### Port Binding
- Node.js binds to port 5000
- OS doesn't release port immediately
- New process tries to bind → `EADDRINUSE`
- Crash loop until port is released

## Long-Term Fix

Improve graceful shutdown in `backend/src/index.ts`:

```typescript
// Better shutdown handler
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received, shutting down gracefully...`);

  // 1. Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });

  // 2. Close socket.io (with timeout)
  try {
    await Promise.race([
      cleanupSocket(),
      new Promise((resolve) => setTimeout(resolve, 3000))
    ]);
  } catch (error) {
    console.error('Socket cleanup error (ignored):', error);
  }

  // 3. Close database connections
  await prisma.$disconnect();

  // 4. Exit
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

## Current Status

✅ **Backend is running** on port 5000  
✅ **Payment methods API** is functional  
⚠️ **Auto-restart** can cause crashes  

**Recommendation:** Follow Solution 1 (don't save backend files during testing) until we implement the long-term fix.

---

**Last Updated:** November 23, 2025  
**Status:** Documented - Workaround in place

