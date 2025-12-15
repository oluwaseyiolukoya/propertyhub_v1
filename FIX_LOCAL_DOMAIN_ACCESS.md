# Fix Local Domain Access (contrezz.local)

## Root Cause Analysis

### Issues Found:

1. ❌ **`/etc/hosts` entry missing** - `contrezz.local` not in hosts file
2. ⚠️ **Vite server config** - Missing `host: true` to accept custom hostnames
3. ✅ **Domain detection** - Code already supports `contrezz.local`
4. ✅ **Frontend server** - Running and accessible on `localhost:5173`

## Complete Solution (Best Practice)

### Step 1: Add to /etc/hosts

```bash
sudo nano /etc/hosts
```

Add these lines at the end:

```
# Contrezz local development
127.0.0.1    contrezz.local
127.0.0.1    app.contrezz.local
```

**Important:** Use tabs or spaces between IP and domain. Save and exit.

### Step 2: Flush DNS Cache (macOS)

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

### Step 3: Verify DNS Resolution

```bash
ping -c 1 contrezz.local
```

**Expected output:**

```
PING contrezz.local (127.0.0.1): 56 data bytes
64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.xxx ms
```

If this fails, the `/etc/hosts` entry wasn't saved correctly.

### Step 4: Update Vite Config

✅ **Already fixed:** Added `host: true` to `vite.config.ts` to allow custom hostnames.

### Step 5: Restart Frontend Dev Server

After updating Vite config, restart the dev server:

```bash
# Stop current server (Ctrl+C)
npm run dev
```

**Expected output:**

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  ➜  Network: http://contrezz.local:5173/  ← Should appear
```

### Step 6: Test Access

```bash
# Test with curl
curl -I http://contrezz.local:5173

# Should return HTTP 200
```

Then open in browser:

```
http://contrezz.local:5173
```

---

## Verification Checklist

- [ ] `/etc/hosts` has `127.0.0.1    contrezz.local`
- [ ] DNS cache flushed
- [ ] `ping contrezz.local` resolves to `127.0.0.1`
- [ ] Vite config has `host: true`
- [ ] Frontend server restarted
- [ ] `curl http://contrezz.local:5173` returns HTML
- [ ] Browser can access `http://contrezz.local:5173`

---

## Troubleshooting

### Issue: Still Getting DNS Error

**Check 1: Verify hosts file entry**

```bash
cat /etc/hosts | grep contrezz
```

Should show: `127.0.0.1    contrezz.local`

**Check 2: Verify DNS resolution**

```bash
getent hosts contrezz.local
# or
dscacheutil -q host -a name contrezz.local
```

Should return: `127.0.0.1`

**Check 3: Check for typos**

- Ensure exactly `127.0.0.1` (not `127.0.0.1.1`)
- Ensure tab or spaces between IP and domain
- Ensure no trailing spaces or dots

**Check 4: Flush DNS again**

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Check 5: Restart browser completely**

- Quit browser (not just close window)
- Reopen browser
- Try again

### Issue: Vite Server Not Accepting Connection

**Check 1: Verify Vite config**

```bash
cat vite.config.ts | grep -A 5 "server:"
```

Should show `host: true`

**Check 2: Check if server is listening on all interfaces**

```bash
lsof -i :5173
```

Should show the process listening on `*:5173` or `0.0.0.0:5173`

**Check 3: Restart Vite server**
After changing `vite.config.ts`, you MUST restart the dev server.

### Issue: Browser Shows Wrong Page

**Check domain detection:**
Open browser console and check:

```javascript
console.log("Hostname:", window.location.hostname);
console.log("Is Public Domain:", window.location.hostname === "contrezz.local");
```

Should show:

- Hostname: `contrezz.local`
- Is Public Domain: `true`

---

## Best Practice: Complete Setup Script

Create a setup script for easy setup:

```bash
#!/bin/bash
# setup-local-domain.sh

echo "🔧 Setting up local domain for Contrezz development..."

# Check if entry already exists
if grep -q "contrezz.local" /etc/hosts; then
  echo "✅ contrezz.local already in /etc/hosts"
else
  echo "📝 Adding contrezz.local to /etc/hosts..."
  echo "127.0.0.1    contrezz.local" | sudo tee -a /etc/hosts
  echo "127.0.0.1    app.contrezz.local" | sudo tee -a /etc/hosts
  echo "✅ Added to /etc/hosts"
fi

# Flush DNS cache
echo "🔄 Flushing DNS cache..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Verify
echo "🧪 Testing DNS resolution..."
if ping -c 1 contrezz.local &> /dev/null; then
  echo "✅ DNS resolution working!"
  echo ""
  echo "🌐 Access public landing page at:"
  echo "   http://contrezz.local:5173"
  echo ""
  echo "🔐 Access app/login page at:"
  echo "   http://localhost:5173"
else
  echo "❌ DNS resolution failed. Check /etc/hosts entry."
fi
```

---

## Alternative: Use Query Parameter (No Setup)

If you don't want to edit `/etc/hosts`, use:

```
http://localhost:5173?public=true
```

This forces the public landing page to show.

---

## Summary

**Root Causes:**

1. Missing `/etc/hosts` entry
2. Vite not configured for custom hostnames

**Fixes Applied:**

1. ✅ Added `host: true` to Vite config
2. 📝 Need to add `/etc/hosts` entry manually
3. ✅ Domain detection already supports `contrezz.local`

**Next Steps:**

1. Add `127.0.0.1    contrezz.local` to `/etc/hosts`
2. Flush DNS cache
3. Restart Vite dev server
4. Access `http://contrezz.local:5173`

---

**Status:** Vite config fixed, needs `/etc/hosts` entry
