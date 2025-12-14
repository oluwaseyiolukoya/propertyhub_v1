# DNS Configuration Guide for Split Architecture

Complete DNS setup for contrezz.com and app.contrezz.com

## 🎯 Overview

This guide shows you exactly how to configure DNS for the split architecture where:

- `contrezz.com` → Public site
- `api.contrezz.com` → Public API
- `app.contrezz.com` → Application
- `api.app.contrezz.com` → Application API

## 📋 DNS Records Table

### Required Records

| Type  | Name    | Value                              | TTL | Purpose      |
| ----- | ------- | ---------------------------------- | --- | ------------ |
| A     | @       | `[PUBLIC_FRONTEND_IP]`             | 300 | Main website |
| CNAME | www     | contrezz.com                       | 300 | WWW redirect |
| CNAME | api     | `[PUBLIC_APP].ondigitalocean.app`  | 300 | Public API   |
| A     | app     | `[APP_FRONTEND_IP]`                | 300 | Application  |
| CNAME | api.app | `[APP_BACKEND].ondigitalocean.app` | 300 | App API      |

### Optional Records

| Type | Name    | Value                   | Purpose             |
| ---- | ------- | ----------------------- | ------------------- |
| MX   | @       | Your email provider     | Email               |
| TXT  | @       | Your verification codes | Domain verification |
| TXT  | \_dmarc | `v=DMARC1; p=none`      | Email security      |

## 🔧 Step-by-Step Configuration

### Step 1: Get Your Values

**Public Frontend IP (if self-hosting):**

```bash
# If using Vercel/Netlify, skip - use CNAME
# If self-hosting:
doctl compute droplet list
```

**Public Backend Domain:**

```bash
doctl apps list
# Find contrezz-public-api
# Copy the default domain: xxxxxx.ondigitalocean.app
```

**App Frontend IP:**

```bash
# Same as above - get from hosting provider
```

**App Backend Domain:**

```bash
doctl apps list
# Find contrezz-app-backend
# Copy the default domain: yyyyyy.ondigitalocean.app
```

### Step 2: Configure at Domain Registrar

#### Using Namecheap

1. Go to Domain List → Manage → Advanced DNS
2. Delete default records
3. Add records from table above

#### Using Cloudflare

1. Go to DNS → Records
2. Add records from table above
3. Set Proxy status:
   - @ (root): Proxied ☁️
   - www: Proxied ☁️
   - api: DNS only (no proxy)
   - app: Proxied ☁️
   - api.app: DNS only (no proxy)

**Why no proxy for API?**

- DigitalOcean provides SSL
- Direct connection is faster
- Avoids double SSL encryption

#### Using Route 53 (AWS)

1. Go to Hosted Zones → Your Domain
2. Create Record Set for each record
3. Record types match table above

### Step 3: Verify DNS Propagation

```bash
# Check @ record
dig contrezz.com +short

# Check www redirect
dig www.contrezz.com +short

# Check public API
dig api.contrezz.com +short

# Check app
dig app.contrezz.com +short

# Check app API
dig api.app.contrezz.com +short
```

**Expected outputs:**

```bash
$ dig api.contrezz.com +short
xxxxxx.ondigitalocean.app.
[IP_ADDRESS]
```

### Step 4: Add Custom Domains in DigitalOcean

**For Public Backend:**

```bash
# Get app ID
APP_ID=$(doctl apps list --format ID,Spec.Name | grep contrezz-public-api | awk '{print $1}')

# Add domain
doctl apps create-domain $APP_ID --domain api.contrezz.com
```

**For App Backend:**

```bash
# Get app ID
APP_ID=$(doctl apps list --format ID,Spec.Name | grep contrezz-app | awk '{print $1}')

# Add domain
doctl apps create-domain $APP_ID --domain api.app.contrezz.com
```

**Via Web Console:**

1. Go to Apps → Your App
2. Settings → Domains
3. Click "Add Domain"
4. Enter domain name
5. Wait for SSL certificate (automatic)

### Step 5: Verify SSL Certificates

```bash
# Check public API SSL
curl -I https://api.contrezz.com/health

# Check app API SSL
curl -I https://api.app.contrezz.com/health
```

Expected: `200 OK` with valid certificate

## 🌐 Full Domain Map

```
contrezz.com (Root Domain)
├── @ (root)                    → Public landing page
├── www.contrezz.com           → Redirect to root
├── api.contrezz.com           → Public API (careers, blog)
├── app.contrezz.com           → Application dashboard
└── api.app.contrezz.com       → Application API

Additional subdomains (optional):
├── blog.contrezz.com          → Blog (if separate)
├── docs.contrezz.com          → Documentation
└── status.contrezz.com        → Status page
```

## 🔒 SSL/TLS Configuration

### DigitalOcean (Automatic)

DigitalOcean automatically provisions Let's Encrypt certificates for:

- api.contrezz.com
- api.app.contrezz.com

**Verification:**

```bash
# Check certificate
echo | openssl s_client -servername api.contrezz.com -connect api.contrezz.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Cloudflare (if using)

If using Cloudflare:

1. SSL/TLS → Overview
2. Set to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Enable "Automatic HTTPS Rewrites"

## 📊 DNS Record Examples

### Example 1: Vercel Frontend + DigitalOcean Backend

```
# Public Frontend (Vercel)
Type: CNAME
Name: @
Value: cname.vercel-dns.com

# Public API (DigitalOcean)
Type: CNAME
Name: api
Value: your-app.ondigitalocean.app

# App Frontend (Vercel)
Type: CNAME
Name: app
Value: cname.vercel-dns.com

# App API (DigitalOcean)
Type: CNAME
Name: api.app
Value: your-app-2.ondigitalocean.app
```

### Example 2: All on DigitalOcean

```
# Public Frontend (App Platform Static Site)
Type: CNAME
Name: @
Value: your-static-app.ondigitalocean.app

# Public API (App Platform)
Type: CNAME
Name: api
Value: your-api-app.ondigitalocean.app

# App Frontend (App Platform Static Site)
Type: CNAME
Name: app
Value: your-app-static.ondigitalocean.app

# App API (App Platform)
Type: CNAME
Name: api.app
Value: your-app-api.ondigitalocean.app
```

## ⏱️ Propagation Times

| Change          | Typical Time |
| --------------- | ------------ |
| New record      | 5-30 minutes |
| Update existing | 1-60 minutes |
| Delete record   | 1-24 hours   |

**Force refresh:**

```bash
# Clear local DNS cache
# macOS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches

# Windows
ipconfig /flushdns
```

## ✅ Verification Checklist

After DNS is configured:

- [ ] `contrezz.com` loads (public site)
- [ ] `www.contrezz.com` redirects to root
- [ ] `api.contrezz.com/health` returns 200
- [ ] `app.contrezz.com` loads (app dashboard)
- [ ] `api.app.contrezz.com/health` returns 200
- [ ] All domains have valid SSL (🔒 in browser)
- [ ] No mixed content warnings
- [ ] CORS works from frontend to API

## 🔧 Troubleshooting

### "DNS_PROBE_FINISHED_NXDOMAIN"

**Cause:** Domain not found

**Fix:**

```bash
# Verify record exists
dig yourdomain.com

# Check nameservers
dig yourdomain.com NS

# Wait for propagation (up to 24 hours)
```

### "Certificate Invalid"

**Cause:** SSL not ready or misconfigured

**Fix:**

1. Wait 15 minutes for DigitalOcean to provision
2. Check domain is added in App Platform
3. Verify DNS points to correct app

### "CORS Error"

**Cause:** Frontend domain not in ALLOWED_ORIGINS

**Fix:**

```bash
# In DigitalOcean App Platform
# Environment Variables → ALLOWED_ORIGINS
# Add your frontend domain
```

### "504 Gateway Timeout"

**Cause:** Backend not responding

**Fix:**

```bash
# Check app status
doctl apps get <app-id>

# Check logs
doctl apps logs <app-id> --follow

# Verify health endpoint
curl https://api.contrezz.com/health
```

## 🌍 Testing from Different Locations

```bash
# Use online tools
https://dnschecker.org
https://www.whatsmydns.net

# Or use different DNS servers
dig @8.8.8.8 api.contrezz.com         # Google
dig @1.1.1.1 api.contrezz.com         # Cloudflare
dig @208.67.222.222 api.contrezz.com  # OpenDNS
```

## 📱 Mobile Testing

After DNS is configured:

1. Test on mobile browser
2. Test on mobile app (if applicable)
3. Clear mobile browser cache
4. Test on cellular (not WiFi)

## 🔐 Security Headers

Add these DNS records for security:

```
# CAA Records (restrict certificate issuance)
Type: CAA
Name: @
Value: 0 issue "letsencrypt.org"

# DNSSEC (if supported by registrar)
Enable DNSSEC in registrar settings
```

## 📚 Additional Resources

- [DigitalOcean Custom Domains](https://docs.digitalocean.com/products/app-platform/how-to/manage-domains/)
- [DNS Propagation Checker](https://dnschecker.org)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [CORS Test](https://cors-test.codehappy.dev/)

---

**Last Updated:** December 2024  
**Status:** Production Ready
