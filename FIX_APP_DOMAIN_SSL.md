# Fix app.contrezz.com SSL Error

## Error: `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`

This error means:

- DNS is pointing somewhere, but SSL certificate isn't configured
- OR DNS is pointing to a server that doesn't support HTTPS
- OR Domain isn't added in DigitalOcean yet

## Step-by-Step Fix

### Step 1: Check DNS Configuration

```bash
dig app.contrezz.com +short
```

**Expected results:**

- If DNS is configured: Should return an IP or CNAME target
- If not configured: Returns nothing

### Step 2: Find Your Default Domain

1. **Go to your frontend app:**

   - https://cloud.digitalocean.com/apps
   - Click on your frontend app (the one with the static site component)

2. **Find the default domain:**

   - **Method A (Overview):** Look at the **top of the Overview page**, just below the app name
   - The default domain appears as a **clickable link**: `https://<app-name>-<unique-id>.ondigitalocean.app`
   - Example: `https://propertyhub-v1-abc123.ondigitalocean.app`
   - **Method B (Settings):** Click **Settings** → Scroll to **Domains** section
   - You'll see the default domain listed there (cannot be disabled, always available)

3. **Copy the default domain** (you'll need it for DNS configuration)

### Step 3: Add Domain in DigitalOcean

1. **In your app dashboard:**

   - Click **Settings** in the left sidebar
   - Scroll down to the **Domains** section
   - Click **"Edit"** button next to Domains (or "Add Domain" if visible)

2. **Add the custom domain:**

   - Click **"Add Domain"** button
   - Enter: `app.contrezz.com`
   - Choose DNS management option:
     - **External DNS Provider** (since you're using Namecheap)
   - Click **"Add Domain"** to proceed

3. **Wait for SSL:**
   - DigitalOcean will automatically provision an SSL certificate
   - This takes **5-10 minutes**
   - Status will show as "Configuring" then change to "Active" when ready

### Step 4: Configure DNS Record

After adding the domain in DigitalOcean:

1. **DigitalOcean will provide DNS instructions:**

   - In the Domains section, you'll see instructions for `app.contrezz.com`
   - It will show either:
     - **CNAME record**: Point to your default domain (e.g., `your-app-abc123.ondigitalocean.app`)
     - **A record**: An IP address (less common for static sites)

2. **Add the DNS record in Namecheap:**

   - Go to: https://www.namecheap.com/myaccount/login/
   - Domain List → Manage next to `contrezz.com`
   - Advanced DNS tab
   - Find the existing `app` CNAME record (if it exists) or click "Add New Record"
   - Configure:
     - **Type:** CNAME (or A if DigitalOcean specifies)
     - **Host:** `app`
     - **Value:** The default domain from Step 2 (e.g., `your-app-abc123.ondigitalocean.app`)
     - **TTL:** Automatic (or 300)
   - Click the checkmark to save

3. **Wait for DNS propagation:**
   - 5-30 minutes for DNS to propagate
   - SSL certificate will be issued after DNS resolves correctly
   - Check status in DigitalOcean: Settings → Domains → Status should change to "Active"

### Step 5: Verify It's Working (After DNS & SSL)

```bash
# Check DNS
dig app.contrezz.com +short

# Test HTTPS (after SSL is issued)
curl -I https://app.contrezz.com
```

## Common Issues

### Issue 1: DNS Not Configured

**Symptom:** `dig app.contrezz.com` returns nothing

**Fix:**

1. Add domain in DigitalOcean first
2. Copy the DNS record from DigitalOcean
3. Add it in Namecheap
4. Wait for propagation

### Issue 2: DNS Points to Wrong Place

**Symptom:** DNS resolves but SSL error persists

**Fix:**

1. Check what DNS points to: `dig app.contrezz.com +short`
2. Make sure it points to your DigitalOcean app domain
3. If wrong, update DNS in Namecheap

### Issue 3: Domain Not Added in DigitalOcean

**Symptom:** DNS resolves but no SSL certificate

**Fix:**

1. Add domain in DigitalOcean app settings
2. Wait 5-10 minutes for SSL certificate
3. Verify in DigitalOcean dashboard that SSL is "Active"

### Issue 4: SSL Certificate Pending

**Symptom:** Domain added but SSL still pending

**Fix:**

1. Wait 5-10 minutes (can take up to 15 minutes)
2. Check DigitalOcean dashboard for SSL status
3. Make sure DNS is correctly configured
4. SSL won't issue until DNS resolves correctly

## Quick Checklist

- [ ] Domain added in DigitalOcean app settings
- [ ] DNS record added in Namecheap
- [ ] DNS resolves correctly (`dig app.contrezz.com`)
- [ ] SSL certificate status is "Active" in DigitalOcean
- [ ] Waited 5-10 minutes after adding domain
- [ ] Tested with `curl -I https://app.contrezz.com`

## Expected Timeline

1. **Add domain in DigitalOcean:** Immediate
2. **Add DNS in Namecheap:** Immediate
3. **DNS propagation:** 5-30 minutes
4. **SSL certificate issuance:** 5-10 minutes after DNS resolves
5. **Total:** 10-40 minutes

## Verification Commands

```bash
# Check DNS
dig app.contrezz.com +short

# Check if HTTPS works (after SSL is issued)
curl -I https://app.contrezz.com 2>&1 | head -5

# Should see: HTTP/2 200 or similar
```

## If Still Not Working

1. **Check DigitalOcean dashboard:**

   - Settings → Domains
   - Is `app.contrezz.com` listed?
   - What's the SSL status?

2. **Check DNS:**

   - What does `dig app.contrezz.com +short` return?
   - Does it match what DigitalOcean expects?

3. **Wait longer:**

   - SSL certificates can take up to 15 minutes
   - DNS can take up to 30 minutes

4. **Contact support:**
   - If still not working after 1 hour, check DigitalOcean support

---

**Last Updated:** December 14, 2025
