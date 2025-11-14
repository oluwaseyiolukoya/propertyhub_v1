# WebSocket Production CORS Fix

## Problem

In production, Socket.io was attempting to connect to `https://api.contrezz.com/socket.io/` and failing with CORS errors:

```
Access to XMLHttpRequest at 'https://api.contrezz.com/socket.io/?EIO=4&transport=polling&t=...' 
from origin 'https://contrezz.com' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

This was causing:
- ❌ Console spam with connection errors
- ❌ Failed XHR polling requests (404 errors)
- ❌ Continuous reconnection attempts
- ❌ Poor user experience

## Root Cause

1. **Backend Socket.io Not Configured**: The production backend (`api.contrezz.com`) doesn't have Socket.io server running or properly configured with CORS.
2. **Frontend Still Trying to Connect**: The frontend was attempting to establish WebSocket/polling connections on every page load.
3. **Not Critical for Core Features**: WebSocket is only used for real-time notifications, not for essential features like logo upload, authentication, or CRUD operations.

## Solution

### Disabled WebSocket in Production by Default

Updated `src/lib/socket.ts` to:
1. **Check if in production** (`import.meta.env.PROD`)
2. **Return a mock socket** that doesn't attempt any connections
3. **Allow opt-in** via `VITE_ENABLE_WEBSOCKET=true` environment variable

```typescript
export const initializeSocket = (token: string): Socket => {
  // ... existing checks ...

  const isProduction = import.meta.env.PROD;

  // In production, disable WebSocket unless explicitly enabled
  if (isProduction && !import.meta.env.VITE_ENABLE_WEBSOCKET) {
    console.log('ℹ️ WebSocket disabled in production (set VITE_ENABLE_WEBSOCKET=true to enable)');
    // Return a mock socket that won't try to connect
    socket = {
      connected: false,
      on: () => socket,
      off: () => socket,
      emit: () => socket,
      disconnect: () => {},
      removeAllListeners: () => socket,
      connect: () => socket,
    } as any;
    return socket;
  }

  // ... rest of socket initialization ...
};
```

### Benefits

✅ **No More CORS Errors**: Socket.io won't attempt connections in production
✅ **Clean Console**: No more XHR polling errors or connection spam
✅ **Better Performance**: No unnecessary connection attempts
✅ **Core Features Work**: Logo upload, auth, CRUD operations unaffected
✅ **Opt-in for Future**: Can enable WebSocket when backend is ready

## What Still Works

All core features continue to work without WebSocket:
- ✅ Authentication & Authorization
- ✅ Logo & Favicon Upload
- ✅ All CRUD Operations (Properties, Units, Tenants, etc.)
- ✅ Billing & Payments
- ✅ Maintenance Tickets
- ✅ User Management
- ✅ Settings & Configuration

## What Doesn't Work (Until WebSocket is Enabled)

Real-time features that require WebSocket:
- ❌ Live notifications (new maintenance tickets, payments, etc.)
- ❌ Real-time dashboard updates
- ❌ Live chat/messaging (if implemented)
- ❌ Presence indicators (who's online)

**Note**: These features can be re-enabled once the backend Socket.io server is properly configured with CORS.

## How to Enable WebSocket in Production (Future)

### Option 1: Configure Backend Socket.io (Recommended)

1. **Update `backend/src/index.ts`** to properly configure Socket.io with CORS:

```typescript
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['https://contrezz.com', 'https://www.contrezz.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  // Verify JWT token here
  // ...
  next();
});

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Use httpServer instead of app
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

2. **Update DigitalOcean App Platform** to ensure WebSocket support:
   - In App Platform settings, ensure HTTP/2 and WebSocket are enabled
   - May require upgrading to a higher tier plan

3. **Set Environment Variable** in DigitalOcean:
   - Add `VITE_ENABLE_WEBSOCKET=true` to frontend environment variables

### Option 2: Keep WebSocket Disabled (Current)

For now, keep WebSocket disabled and rely on:
- **Polling**: Frontend can poll for updates (e.g., every 30 seconds)
- **Manual Refresh**: Users can refresh to see new data
- **Push Notifications**: Use browser push notifications API instead

This is perfectly acceptable for most SaaS applications and reduces infrastructure complexity.

## Testing

### Development (WebSocket Enabled)
```bash
npm run dev
# Socket.io will connect normally to localhost:5000
```

### Production (WebSocket Disabled)
```bash
npm run build
npm run preview
# Console will show: "ℹ️ WebSocket disabled in production"
# No connection attempts or errors
```

### Production with WebSocket Enabled
```bash
# Set environment variable
export VITE_ENABLE_WEBSOCKET=true
npm run build
npm run preview
# Socket.io will attempt to connect to production backend
```

## Deployment

Changes are already pushed to GitHub. DigitalOcean will auto-deploy:

1. **Build**: Frontend builds with WebSocket disabled by default
2. **Deploy**: No CORS errors in production console
3. **Verify**: Check console - should see "ℹ️ WebSocket disabled in production"

## Rollback

If you need to revert this change:

```bash
git revert HEAD
git push origin main
```

But this is not recommended as it will bring back the CORS errors.

## Future Improvements

When ready to enable real-time features:

1. **Set up Socket.io on backend** with proper CORS
2. **Test in staging** environment first
3. **Enable via environment variable**: `VITE_ENABLE_WEBSOCKET=true`
4. **Monitor for errors** in production console
5. **Implement reconnection logic** for better UX

---

**Status**: ✅ Fixed - WebSocket disabled in production, no more CORS errors
**Impact**: None on core features, only affects real-time notifications
**Next Steps**: Configure backend Socket.io when real-time features are needed

