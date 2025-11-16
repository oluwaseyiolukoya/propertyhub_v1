# 🔧 Fix Login Issue - Backend Not Running

## The Problem

The error **"Failed to execute 'json' on 'Response': Unexpected end of JSON input"** occurs because:

❌ **The backend server is NOT running on port 5000**

When the frontend tries to login, it gets:
- `net::ERR_CONNECTION_REFUSED` - Can't connect to backend
- Empty response body - Nothing to parse as JSON
- JSON parse error - Can't parse empty response

## The Solution

**Start the backend server!**

---

## Step-by-Step Fix

### Step 1: Check PostgreSQL is Running

The backend needs PostgreSQL to be running:

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# If not running, start it:
brew services start postgresql@14
# OR
brew services start postgresql
```

### Step 2: Start Backend Server

Open a **new terminal window** and run:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npm run dev
```

**Expected output:**
```
🚀 Server running on port 5000
📝 Environment: development
🌐 CORS enabled for: http://localhost:5173
🔌 Socket.io real-time updates enabled
✅ Cron jobs initialized:
   - Monthly MRR Snapshot: 1st of every month at 00:05 AM
   - Daily MRR Update: Every day at 00:10 AM
   - Trial Expiration Checker: Every day at 02:00 AM UTC
   - Trial Notification Sender: Every day at 10:00 AM UTC
   - Suspended Account Cleanup: Every day at 03:00 AM UTC
```

**If you see errors:**

#### Error: "Cannot find module"
```bash
cd backend
npm install
npm run dev
```

#### Error: "Prisma Client not generated"
```bash
cd backend
npx prisma generate
npm run dev
```

#### Error: "Can't reach database"
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# If not running:
brew services start postgresql@14

# Check database exists:
psql -l | grep contrezz

# If not exists, create it:
createdb contrezz_dev

# Run migrations:
cd backend
npx prisma migrate dev
npm run dev
```

#### Error: "Port 5000 already in use"
```bash
# Find what's using port 5000
lsof -ti:5000

# Kill the process (replace PID with actual number)
kill -9 <PID>

# Or use a different port:
PORT=5001 npm run dev
# Then update frontend: VITE_API_URL=http://localhost:5001 npm run dev
```

### Step 3: Verify Backend is Running

In another terminal:

```bash
curl http://localhost:5000/health
```

**Expected output:**
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "uptime": 123.456
}
```

✅ If you see this JSON, backend is working!

### Step 4: Start Frontend Server

In another **new terminal window**:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 5: Test Login

1. Open browser: http://localhost:5173
2. Hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
3. Try logging in:
   - Admin: `admin@contrezz.com` / `admin123`
   - Customer: `demo@contrezz.com` / (your password)

✅ Login should work now!

---

## Quick Checklist

Before trying to login, verify:

- [ ] PostgreSQL is running (`brew services list`)
- [ ] Backend is running (`curl http://localhost:5000/health`)
- [ ] Frontend is running (browser shows Vite dev server)
- [ ] No CORS errors in browser console
- [ ] Backend terminal shows "Server running on port 5000"

---

## Common Issues

### Issue 1: Backend Starts Then Crashes

**Symptom**: Backend starts but immediately exits

**Check backend terminal for errors:**
```bash
cd backend
npm run dev
# Read the error messages
```

**Common causes:**
- Database connection failed
- Missing environment variables
- Port already in use
- Prisma client not generated

### Issue 2: Frontend Can't Connect to Backend

**Symptom**: `net::ERR_CONNECTION_REFUSED`

**Solutions:**
1. Verify backend is running: `curl http://localhost:5000/health`
2. Check backend is on port 5000 (look at terminal output)
3. Check firewall isn't blocking localhost connections
4. Try restarting both servers

### Issue 3: CORS Errors

**Symptom**: "Not allowed by CORS" in browser console

**Solution:**
Backend already allows `http://localhost:5173`. If you're using a different port:

```bash
# Backend .env.local
FRONTEND_URL=http://localhost:YOUR_PORT
```

Then restart backend.

### Issue 4: "Invalid credentials" After Login Form Submits

**Symptom**: Backend responds but login fails

**This is different from connection refused!** This means:
- ✅ Backend is running
- ✅ Connection works
- ❌ Email/password is wrong

**Solutions:**
1. Check you're using correct credentials
2. Reset password in Prisma Studio:
   ```bash
   cd backend
   npx prisma studio
   ```
   Go to http://localhost:5555, find user, update password

---

## Best Practice: Use Multiple Terminals

**Terminal 1: Backend**
```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npm run dev
# Keep this running
```

**Terminal 2: Frontend**
```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor
npm run dev
# Keep this running
```

**Terminal 3: Commands**
```bash
# Use this for other commands like:
# - curl tests
# - prisma studio
# - git commands
# - etc.
```

---

## Environment Variables Check

### Frontend `.env.local` (optional in dev)
```bash
# Only needed if backend is NOT on port 5000
VITE_API_URL=http://localhost:5000

# Paystack keys (for payment)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
```

### Backend `backend/.env.local` (required)
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/contrezz_dev"

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

---

## Still Not Working?

### Debug Steps

1. **Check all processes:**
   ```bash
   # Backend
   lsof -ti:5000
   
   # Frontend
   lsof -ti:5173
   
   # PostgreSQL
   brew services list | grep postgresql
   ```

2. **Check backend logs:**
   - Look at the terminal where you ran `npm run dev`
   - Any red error messages?
   - Does it say "Server running on port 5000"?

3. **Check browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Any errors?
   - Go to Network tab
   - Try login
   - Click on `/api/auth/login` request
   - What's the status code?
   - What's the response?

4. **Test backend directly:**
   ```bash
   # Health check
   curl http://localhost:5000/health
   
   # Login test
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@contrezz.com","password":"admin123"}'
   ```

   Should return JSON with token.

---

## Summary

The fix is simple:

1. ✅ Start PostgreSQL: `brew services start postgresql@14`
2. ✅ Start Backend: `cd backend && npm run dev`
3. ✅ Verify: `curl http://localhost:5000/health`
4. ✅ Start Frontend: `npm run dev`
5. ✅ Login: http://localhost:5173

**The backend MUST be running for login to work!**

---

## Need More Help?

If you're still stuck:

1. Share the backend terminal output
2. Share any error messages
3. Share the browser console errors
4. Share the Network tab response for `/api/auth/login`

This will help diagnose the exact issue.

