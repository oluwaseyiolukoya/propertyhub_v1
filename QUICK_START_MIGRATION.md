# Quick Start: Migrate to Digital Ocean

**Fast track guide to migrate from AWS to Digital Ocean in one day.**

## 🎯 Goal
Reduce costs from $98/month (AWS) to $32/month (Digital Ocean) - **67% savings**

## ⏱️ Time Required
- **Total: 4-6 hours**
- Backup: 30 min
- Setup: 1 hour
- Migration: 1 hour
- Testing: 2-3 hours
- Monitoring: 7 days
- AWS Cleanup: 1 hour

---

## 📋 Prerequisites (15 minutes)

### 1. Create Digital Ocean Account
👉 https://www.digitalocean.com/

### 2. Install Tools

**For macOS:**
```bash
brew install doctl terraform postgresql@15
```

**Verify installation:**
```bash
doctl version
terraform version
psql --version
```

**Note:** All three should show version numbers if installed correctly.

### 3. Get API Token
1. Go to: https://cloud.digitalocean.com/account/api/tokens
2. Click "Generate New Token"
3. Name: "Contrezz Migration"
4. Scopes: Read and Write
5. Copy token (you'll need it soon)

### 4. Authenticate
```bash
doctl auth init
# Paste your token when prompted
```

---

## 🚀 Migration Steps

### Step 1: Backup AWS Database (30 min)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Run backup script
./scripts/backup-aws-database.sh

# Verify backup exists
ls -lh backups/
```

**✅ Checkpoint:** You should see a `.sql` file in `backups/` directory

---

### Step 2: Configure Digital Ocean (15 min)

```bash
cd terraform/digitalocean

# Copy config template
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Minimum required:**
```hcl
do_token            = "dop_v1_YOUR_TOKEN_HERE"
jwt_secret          = "copy-from-backend/.env"
paystack_secret_key = "copy-from-backend/.env"
paystack_public_key = "copy-from-backend/.env"
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

### Step 3: Deploy Infrastructure (30 min)

```bash
# Run automated setup
../../scripts/setup-digitalocean.sh
```

**What this does:**
- Creates PostgreSQL database ($15/month)
- Sets up App Platform for backend ($12/month)
- Creates Spaces bucket for frontend ($5/month)
- Configures networking and security

**✅ Checkpoint:** Script should output URLs for backend, frontend, and database

---

### Step 4: Migrate Database (15 min)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Get connection string
DB_URL=$(cd terraform/digitalocean && terraform output -raw database_connection_string)

# Restore backup (find your backup file)
psql "$DB_URL" < backups/contrezz_aws_backup_*.sql

# Verify data
psql "$DB_URL" -c "SELECT COUNT(*) FROM users;"
```

**✅ Checkpoint:** Should see your user count

---

### Step 5: Deploy Backend (30 min)

#### Option A: Auto-deploy from GitHub (Recommended)

```bash
# Update GitHub repo in config
cd backend/.do
nano app.yaml
# Change: YOUR_GITHUB_USERNAME to your actual username

# Get App ID
doctl apps list

# Update app
doctl apps update <app-id> --spec app.yaml

# Push to GitHub (if not already)
cd /Users/oluwaseyio/test_ui_figma_and_cursor
git add .
git commit -m "Configure for Digital Ocean"
git push origin main

# Monitor deployment
doctl apps logs <app-id> --follow
```

#### Option B: Quick manual deploy

```bash
cd backend
doctl apps create --spec .do/app.yaml
```

**✅ Checkpoint:** Backend should respond to health check
```bash
BACKEND_URL=$(cd ../terraform/digitalocean && terraform output -raw backend_url)
curl $BACKEND_URL/health
# Should return: {"status":"ok"}
```

---

### Step 6: Deploy Frontend (30 min)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Get backend URL
BACKEND_URL=$(cd terraform/digitalocean && terraform output -raw backend_url)

# Update frontend config
echo "VITE_API_URL=$BACKEND_URL" > .env.production

# Build
npm run build

# Get bucket name
BUCKET=$(cd terraform/digitalocean && terraform output -raw spaces_bucket_name)

# Upload
doctl spaces upload dist $BUCKET --recursive --acl public-read

# Enable static hosting
doctl spaces bucket update $BUCKET --enable-static-site --index-document index.html --error-document index.html
```

**✅ Checkpoint:** Frontend should be accessible
```bash
FRONTEND_URL=$(cd terraform/digitalocean && terraform output -raw spaces_cdn_endpoint)
open $FRONTEND_URL
```

---

### Step 7: Quick Test (30 min)

```bash
# 1. Test backend health
curl $BACKEND_URL/health

# 2. Open frontend
open $FRONTEND_URL

# 3. Test login with existing user
# - Go to login page
# - Use your existing credentials
# - Should see dashboard

# 4. Test basic operations
# - Create a test property
# - Add a test tenant
# - Verify data saves
```

**✅ Checkpoint:** Can login and perform basic operations

---

### Step 8: Update DNS (Optional, 15 min)

**If you have a custom domain:**

```bash
# Add domain to Digital Ocean
doctl compute domain create contrezz.com

# Add DNS records
doctl compute domain records create contrezz.com \
  --record-type A \
  --record-name @ \
  --record-data <get-from-app-platform>

doctl compute domain records create contrezz.com \
  --record-type CNAME \
  --record-name api \
  --record-data <backend-url>
```

**Then update nameservers at your domain registrar:**
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

**Note:** DNS can take 24-48 hours to propagate

---

## ✅ Verification Checklist

After migration, verify these work:

- [ ] Backend health endpoint responds
- [ ] Frontend loads correctly
- [ ] User login works
- [ ] Dashboard displays data
- [ ] Can create/edit properties
- [ ] Can add/manage tenants
- [ ] Payment processing works (Paystack)
- [ ] Email notifications work
- [ ] Real-time updates work (Socket.io)

---

## 📊 Monitor for 7 Days

**Keep AWS running as backup!**

### Daily checks:
```bash
# Check app status
doctl apps list

# Check logs for errors
doctl apps logs <app-id> --tail 100

# Check database
doctl databases get <db-id>

# Check billing
doctl balance get
```

### Set up alerts:
1. Go to: https://cloud.digitalocean.com/account/billing
2. Set budget alert at $35/month
3. Enable email notifications

---

## 🗑️ Destroy AWS (After 7 Days)

**Only after everything works perfectly on Digital Ocean!**

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Run destruction script
./scripts/destroy-aws.sh

# Follow prompts carefully
# Type "DESTROY AWS" when prompted
```

**Verify in AWS Console:**
- https://console.aws.amazon.com/
- Check all resources are deleted
- Verify billing drops to $0

---

## 💰 Cost Savings

### Before (AWS)
```
ECS Fargate:        $30/month
RDS PostgreSQL:     $15/month
Load Balancer:      $16/month
NAT Gateway:        $32/month
S3 + CloudFront:    $ 5/month
─────────────────────────────
Total:              $98/month
```

### After (Digital Ocean)
```
App Platform:       $12/month
PostgreSQL:         $15/month
Spaces + CDN:       $ 5/month
─────────────────────────────
Total:              $32/month

Monthly Savings:    $66/month
Annual Savings:     $792/year
```

---

## 🆘 Quick Troubleshooting

### Backend won't start
```bash
# Check logs
doctl apps logs <app-id> --follow

# Common fixes:
# 1. Verify DATABASE_URL is set
# 2. Check all env vars in .do/app.yaml
# 3. Verify Prisma schema is generated
```

### Frontend shows errors
```bash
# Check if files uploaded
doctl spaces list-objects <bucket-name>

# Re-upload if needed
doctl spaces upload dist <bucket-name> --recursive --acl public-read
```

### Database connection fails
```bash
# Test connection
psql "$(cd terraform/digitalocean && terraform output -raw database_connection_string)" -c "SELECT 1"

# Check firewall
doctl databases firewalls list <db-id>
```

### Can't login
```bash
# Check if users table has data
psql "$DB_URL" -c "SELECT email FROM users LIMIT 5;"

# Check backend logs
doctl apps logs <app-id> --follow
```

---

## 📞 Need Help?

1. **Check full guide:** `DIGITALOCEAN_MIGRATION_GUIDE.md`
2. **Digital Ocean Community:** https://www.digitalocean.com/community
3. **Support:** Available on all Digital Ocean plans

---

## 🎉 Success!

Once everything works:

✅ Application running on Digital Ocean  
✅ Costs reduced by 67%  
✅ Simpler infrastructure  
✅ Predictable billing  
✅ AWS resources destroyed  

**Congratulations on a successful migration! 🚀**

---

## 📝 Quick Reference

### Useful Commands

```bash
# Check app status
doctl apps list

# View logs
doctl apps logs <app-id> --follow

# Check database
doctl databases get <db-id>

# Check billing
doctl balance get

# List all resources
doctl compute droplet list
doctl databases list
doctl apps list
doctl spaces list

# Get connection strings
cd terraform/digitalocean
terraform output database_connection_string
terraform output backend_url
terraform output spaces_cdn_endpoint
```

### Important URLs

- **Digital Ocean Dashboard:** https://cloud.digitalocean.com/
- **Billing:** https://cloud.digitalocean.com/billing
- **API Tokens:** https://cloud.digitalocean.com/account/api/tokens
- **Support:** https://cloud.digitalocean.com/support
- **Documentation:** https://docs.digitalocean.com/

---

**Time to migrate:** ~4-6 hours  
**Savings:** $66/month ($792/year)  
**Complexity reduction:** Massive  

**Let's do this! 🚀**

