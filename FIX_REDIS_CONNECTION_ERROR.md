# Fix Redis Connection Error in Production

## Problem

Users getting connection error when trying to login:
```
Error: getaddrinfo ENOTFOUND verification-redis-prod-do-user-18499071-0.i.db.ondigitalocean.com
```

This happens because:
1. Production has `REDIS_URL` set to a DigitalOcean Redis instance
2. The instance doesn't exist or isn't accessible
3. Socket.io tries to connect to it during startup and fails

## Solution Options

### Option 1: Remove Redis (Recommended - Fastest)

Since you're running a single instance, Redis isn't needed for horizontal scaling.

#### Steps:

1. **Go to DigitalOcean App Platform:**
   - Navigate to your app: https://cloud.digitalocean.com/apps
   - Click on your backend service
   - Go to **Settings** → **Environment Variables**

2. **Remove or Clear Redis Variables:**
   - Find `REDIS_URL` environment variable
   - Click **Edit** → **Delete** or set value to empty string
   - Save changes

3. **Redeploy:**
   - App Platform will automatically redeploy
   - Or manually trigger deployment

4. **Verify:**
   - Check logs: should see "ℹ️ Redis: Disabled (REDIS_URL not set)"
   - Socket.io will run in single-server mode (no Redis adapter)
   - Login should work normally

---

### Option 2: Use Upstash Redis (If you need Redis)

If you need Redis for job queues or caching:

#### Steps:

1. **Create Upstash Redis:**
   - Follow guide: `UPSTASH_REDIS_SETUP_GUIDE.md`
   - Sign up at https://upstash.com
   - Create database named `verification-redis-prod`
   - Copy connection string (rediss://...)

2. **Update Environment Variables:**
   - In DigitalOcean → Backend service → Environment Variables
   - Remove: `REDIS_URL`
   - Add: `UPSTASH_REDIS_URL` with value: `rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379`

3. **Redeploy:**
   - App Platform will redeploy automatically
   - Check logs for "✅ Redis: Connected and ready"

---

### Option 3: Create DigitalOcean Redis (If you prefer)

If you want to use DigitalOcean managed Redis:

#### Steps:

1. **Create Redis Database:**
   ```bash
   doctl databases create verification-redis-prod \
     --engine redis \
     --version 7 \
     --size db-s-1vcpu-1gb \
     --region nyc3 \
     --num-nodes 1
   ```

2. **Get Connection String:**
   ```bash
   doctl databases connection verification-redis-prod
   ```

3. **Add to Trusted Sources:**
   - In DigitalOcean → Databases → verification-redis-prod
   - Go to **Settings** → **Trusted Sources**
   - Add your App Platform service

4. **Update Environment Variable:**
   - In DigitalOcean → Backend service → Environment Variables
   - Update `REDIS_URL` with the new connection string
   - Format: `redis://user:password@host:port`

5. **Redeploy**

---

## Recommended Approach

**For your current setup:** Choose **Option 1** (Remove Redis)

**Why:**
- ✅ Fastest fix (no setup needed)
- ✅ Works for single-instance deployments
- ✅ Redis is optional in your codebase
- ✅ No additional cost
- ✅ Simplifies architecture

**When to use Redis:**
- Multiple backend instances (horizontal scaling)
- Job queues (verification processing)
- Session storage across instances
- Real-time features with multiple servers

---

## Verification

After implementing the fix:

1. **Check Logs:**
   ```bash
   # In DigitalOcean App Platform:
   # Runtime Logs → backend service
   
   # Should see:
   # ℹ️ Redis: Disabled (REDIS_URL not set)
   # OR
   # ✅ Redis: Connected and ready
   ```

2. **Test Login:**
   - Go to your production site
   - Try logging in
   - Should work without connection errors

3. **Monitor:**
   - Check for any Redis-related errors in logs
   - Verify Socket.io connections work
   - Test real-time features

---

## Quick Commands

```bash
# Check if Redis is running locally
redis-cli ping

# Check Redis connection from backend
node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(console.log).catch(console.error)"

# View DigitalOcean app logs
doctl apps logs <app-id> --follow

# List DigitalOcean databases
doctl databases list
```

---

## Related Files

- `backend/src/lib/redis.ts` - Redis connection setup
- `backend/src/lib/socket.ts` - Socket.io with Redis adapter
- `UPSTASH_REDIS_SETUP_GUIDE.md` - Upstash setup guide
- `app.yaml` - App Platform configuration

---

**Status:** Ready to implement  
**Priority:** HIGH - Blocking user login  
**Estimated Time:** 5 minutes (Option 1), 15 minutes (Option 2/3)

