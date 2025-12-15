# Setup Local Domain for Public Landing Page

## Problem

Accessing `http://contrezz.local:5173/` gives DNS error because `contrezz.local` isn't in your `/etc/hosts` file.

## Solution: Add to /etc/hosts

### Step 1: Edit /etc/hosts File

```bash
sudo nano /etc/hosts
```

**OR use your preferred editor:**

```bash
sudo vim /etc/hosts
# or
sudo code /etc/hosts  # if you have VS Code
```

### Step 2: Add the Entry

Add this line at the end of the file:

```
127.0.0.1    contrezz.local
```

**Full example of what it should look like:**

```
##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1	localhost
255.255.255.255	broadcasthost
::1             localhost

# Contrezz local development
127.0.0.1    contrezz.local
127.0.0.1    app.contrezz.local
```

### Step 3: Save and Exit

- **nano:** Press `Ctrl+X`, then `Y`, then `Enter`
- **vim:** Press `Esc`, type `:wq`, then `Enter`
- **VS Code:** Just save (Cmd+S)

### Step 4: Flush DNS Cache (if needed)

**macOS:**

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

**Linux:**

```bash
sudo systemd-resolve --flush-caches
# or
sudo service network-manager restart
```

**Windows:**

```cmd
ipconfig /flushdns
```

### Step 5: Verify It Works

```bash
ping contrezz.local
```

Should return:

```
PING contrezz.local (127.0.0.1): 56 data bytes
```

### Step 6: Access the Landing Page

1. **Start your frontend:**

   ```bash
   npm run dev
   ```

2. **Open in browser:**

   ```
   http://contrezz.local:5173
   ```

   Should show the public landing page! ✅

---

## Alternative: Use Query Parameter (No Setup Required)

If you don't want to edit `/etc/hosts`, you can use the query parameter:

```
http://localhost:5173?public=true
```

This also shows the public landing page.

---

## Troubleshooting

### Still Getting DNS Error?

1. **Check the entry was saved:**

   ```bash
   cat /etc/hosts | grep contrezz
   ```

   Should show: `127.0.0.1    contrezz.local`

2. **Check for typos:**

   - Make sure it's `127.0.0.1` (not `127.0.0.1.1` or `127.0.01`)
   - Make sure there's a tab or spaces between IP and domain
   - Make sure it's `contrezz.local` (not `contrezz.local.`)

3. **Flush DNS cache again:**

   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

4. **Restart browser:**

   - Close all browser windows
   - Reopen browser
   - Try again

5. **Try in incognito/private mode:**
   - Sometimes browsers cache DNS aggressively

### Browser Still Can't Resolve?

Try accessing with explicit port:

```
http://contrezz.local:5173
```

Or check if Vite is configured to accept the hostname:

```typescript
// vite.config.ts
server: {
  host: true, // Allow access from network
  port: 5173,
  // ...
}
```

---

## Quick Test

After adding to `/etc/hosts`, test with:

```bash
curl http://contrezz.local:5173
```

Should return HTML (not DNS error).

---

**Status:** Ready to use after adding to `/etc/hosts`
