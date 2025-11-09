# Digital Ocean Migration Guide

Complete step-by-step guide to migrate Contrezz from AWS to Digital Ocean.

## 🎯 Why Migrate?

### Cost Comparison

| Service | AWS | Digital Ocean | Savings |
|---------|-----|---------------|---------|
| Container Service | ECS Fargate ~$30 | App Platform $12 | **-$18** |
| Database | RDS ~$15 | Managed PostgreSQL $15 | $0 |
| Load Balancer | ALB ~$16 | Included | **-$16** |
| NAT Gateway | ~$32 | Not needed | **-$32** |
| Storage | S3 ~$5 | Spaces $5 | $0 |
| **Total** | **~$98/month** | **~$32/month** | **-$66/month** |

**Annual Savings: $792/year (67% reduction)**

### Additional Benefits

✅ **Simpler Architecture** - No VPC, NAT Gateway, or complex networking  
✅ **Predictable Pricing** - No surprise charges  
✅ **Better UI** - Easier to manage and monitor  
✅ **Faster Deployment** - Simpler CI/CD  
✅ **Included Features** - Load balancing, SSL, CDN included  

---

## 📋 Prerequisites

### 1. Digital Ocean Account
- Sign up: https://www.digitalocean.com/
- Add payment method
- Generate API token: https://cloud.digitalocean.com/account/api/tokens

### 2. Install Tools

**For macOS:**
```bash
brew install doctl terraform postgresql@15
```

**For Linux (Ubuntu/Debian):**
```bash
# Install doctl
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.98.1/doctl-1.98.1-linux-amd64.tar.gz
tar xf doctl-1.98.1-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Install terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Install PostgreSQL client
sudo apt-get update
sudo apt-get install postgresql-client
```

**Verify installation:**
```bash
doctl version
terraform version
psql --version
```

### 3. Authenticate with Digital Ocean

```bash
# Initialize doctl
doctl auth init

# Paste your API token when prompted

# Verify authentication
doctl account get
```

---

## 🚀 Migration Steps

### Phase 1: Backup AWS Database (30 minutes)

**CRITICAL: Do this first!**

```bash
# Navigate to project
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Make script executable
chmod +x scripts/backup-aws-database.sh

# Run backup
./scripts/backup-aws-database.sh
```

This will:
- Export your entire AWS RDS database
- Create a compressed backup
- Save metadata for restore

**Verify backup:**
```bash
# Check backup file exists and has content
ls -lh backups/
head -n 20 backups/contrezz_aws_backup_*.sql
```

---

### Phase 2: Set Up Digital Ocean Infrastructure (1 hour)

#### Step 1: Configure Terraform Variables

```bash
cd terraform/digitalocean

# Copy example config
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required variables:**
```hcl
# Get from: https://cloud.digitalocean.com/account/api/tokens
do_token = "dop_v1_your_actual_token_here"

# Application secrets (copy from your current .env files)
jwt_secret          = "your-jwt-secret"
paystack_secret_key = "sk_test_your_key"
paystack_public_key = "pk_test_your_key"

# Optional: Your domain
domain_name = "contrezz.com"  # or leave empty

# Region (choose closest to your users)
region = "nyc3"  # Options: nyc1, nyc3, sfo3, sgp1, lon1, fra1, tor1, blr1, ams3
```

#### Step 2: Deploy Infrastructure

```bash
# Make script executable
chmod +x ../../scripts/setup-digitalocean.sh

# Run setup
../../scripts/setup-digitalocean.sh
```

This will:
- Create PostgreSQL database
- Set up App Platform for backend
- Create Spaces bucket for frontend
- Configure networking and security

**Expected output:**
```
✅ Digital Ocean Infrastructure Created!

Backend URL:  https://contrezz-backend-xxxxx.ondigitalocean.app
Frontend URL: https://contrezz-frontend.nyc3.digitaloceanspaces.com
Database:     contrezz-db-xxxxx.db.ondigitalocean.com
```

---

### Phase 3: Migrate Database (30 minutes)

#### Step 1: Get Database Connection String

```bash
cd terraform/digitalocean

# Get connection string
terraform output -raw database_connection_string
```

#### Step 2: Restore Backup

```bash
# Navigate back to project root
cd ../..

# Restore database
psql "$(cd terraform/digitalocean && terraform output -raw database_connection_string)" < backups/contrezz_aws_backup_*.sql
```

#### Step 3: Verify Data

```bash
# Connect to database
psql "$(cd terraform/digitalocean && terraform output -raw database_connection_string)"

# Check tables
\dt

# Check record counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'properties', COUNT(*) FROM properties;

# Exit
\q
```

---

### Phase 4: Deploy Backend (1 hour)

#### Option A: GitHub Auto-Deploy (Recommended)

1. **Connect GitHub Repository:**
   ```bash
   # Get App ID
   doctl apps list
   
   # Update app with GitHub repo
   # Edit backend/.do/app.yaml with your GitHub username
   doctl apps update <app-id> --spec backend/.do/app.yaml
   ```

2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Configure for Digital Ocean"
   git push origin main
   ```

3. **Monitor Deployment:**
   ```bash
   # Watch deployment
   doctl apps list
   
   # View logs
   doctl apps logs <app-id> --follow
   ```

#### Option B: Manual Deploy

```bash
cd backend

# Build
npm ci
npx prisma generate
npm run build

# Deploy
doctl apps create --spec .do/app.yaml
```

#### Step 4: Configure Environment Variables

```bash
# Get App ID
APP_ID=$(doctl apps list --format ID --no-header)

# Update environment variables
doctl apps update $APP_ID --spec .do/app.yaml
```

#### Step 5: Test Backend

```bash
# Get backend URL
BACKEND_URL=$(cd terraform/digitalocean && terraform output -raw backend_url)

# Test health endpoint
curl $BACKEND_URL/health

# Expected: {"status":"ok","timestamp":"..."}
```

---

### Phase 5: Deploy Frontend (30 minutes)

#### Step 1: Build Frontend

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Update API URL in frontend
echo "VITE_API_URL=$(cd terraform/digitalocean && terraform output -raw backend_url)" > .env.production

# Build
npm run build
```

#### Step 2: Upload to Spaces

```bash
# Get Spaces bucket name
BUCKET_NAME=$(cd terraform/digitalocean && terraform output -raw spaces_bucket_name)

# Upload files
doctl compute cdn create --origin ${BUCKET_NAME}.nyc3.digitaloceanspaces.com
doctl spaces upload dist $BUCKET_NAME --recursive

# Set correct content types
doctl spaces upload dist $BUCKET_NAME --recursive --acl public-read
```

#### Step 3: Configure Spaces for Static Hosting

```bash
# Enable static site hosting
doctl spaces bucket update $BUCKET_NAME --enable-static-site --index-document index.html --error-document index.html
```

#### Step 4: Test Frontend

```bash
# Get frontend URL
FRONTEND_URL=$(cd terraform/digitalocean && terraform output -raw spaces_cdn_endpoint)

# Open in browser
open $FRONTEND_URL
```

---

### Phase 6: Configure DNS (30 minutes)

#### Option A: Use Digital Ocean DNS (Recommended)

```bash
# Add domain to Digital Ocean
doctl compute domain create contrezz.com

# Add A record for main site
doctl compute domain records create contrezz.com \
  --record-type A \
  --record-name @ \
  --record-data <app-platform-ip>

# Add CNAME for API
doctl compute domain records create contrezz.com \
  --record-type CNAME \
  --record-name api \
  --record-data <backend-url>

# Add CNAME for www
doctl compute domain records create contrezz.com \
  --record-type CNAME \
  --record-name www \
  --record-data @
```

**Update nameservers at your domain registrar:**
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

#### Option B: Keep Current DNS Provider

Update these records at your DNS provider:

```
Type    Name    Value
A       @       <app-platform-ip>
CNAME   api     <backend-url>
CNAME   www     @
```

---

### Phase 7: Testing (2-3 hours)

#### Comprehensive Test Checklist

```bash
# 1. Backend Health
curl https://api.contrezz.com/health

# 2. Frontend Loading
open https://contrezz.com

# 3. User Login
# - Test with existing user credentials
# - Verify dashboard loads

# 4. Database Operations
# - Create a test property
# - Add a test tenant
# - Update records

# 5. Payment Integration
# - Test Paystack payment flow
# - Verify webhook delivery

# 6. Real-time Features
# - Test Socket.io connections
# - Verify notifications

# 7. Email Notifications
# - Test password reset
# - Test welcome emails

# 8. Performance
# - Check page load times
# - Monitor API response times
```

#### Monitor Logs

```bash
# Backend logs
doctl apps logs <app-id> --follow

# Database metrics
doctl databases get <db-id>

# App Platform metrics
doctl apps get <app-id>
```

---

### Phase 8: Monitor for 7 Days

**Keep AWS running as backup for 7 days while you verify everything works.**

#### Daily Checklist

- [ ] Check application uptime
- [ ] Monitor error logs
- [ ] Verify user logins work
- [ ] Test critical features
- [ ] Check payment processing
- [ ] Monitor database performance
- [ ] Review Digital Ocean billing

#### Set Up Monitoring

```bash
# Enable monitoring in Digital Ocean
doctl monitoring alert-policy create \
  --type v1/insights/droplet/cpu \
  --description "High CPU usage" \
  --compare GreaterThan \
  --value 80 \
  --window 5m \
  --entities <app-id>
```

---

### Phase 9: Destroy AWS Resources (1 hour)

**Only after 7 days of successful operation!**

```bash
# Navigate to project
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Make script executable
chmod +x scripts/destroy-aws.sh

# Run destruction script
./scripts/destroy-aws.sh
```

This will:
- Perform safety checks
- Destroy all AWS resources
- Clean up terraform state

#### Manual Verification

1. **Check AWS Console:**
   - https://console.aws.amazon.com/
   - Verify no running resources

2. **Check AWS Billing:**
   - https://console.aws.amazon.com/billing/
   - Should drop to near $0

3. **Optional: Close AWS Account:**
   - https://console.aws.amazon.com/billing/home#/account

---

## 🎯 Post-Migration Checklist

### Immediate (Day 1)

- [ ] Database migrated successfully
- [ ] Backend deployed and responding
- [ ] Frontend accessible
- [ ] DNS configured
- [ ] SSL certificates active
- [ ] Basic functionality working

### Short-term (Week 1)

- [ ] All features tested
- [ ] Payment processing verified
- [ ] Email notifications working
- [ ] Real-time features operational
- [ ] Performance acceptable
- [ ] No critical errors in logs

### Long-term (Week 2+)

- [ ] AWS resources destroyed
- [ ] AWS billing stopped
- [ ] Documentation updated
- [ ] Team trained on Digital Ocean
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured

---

## 🔧 Troubleshooting

### Backend Won't Start

```bash
# Check logs
doctl apps logs <app-id> --follow

# Common issues:
# 1. Database connection - verify DATABASE_URL
# 2. Missing env vars - check .do/app.yaml
# 3. Build errors - check Node.js version
```

### Database Connection Issues

```bash
# Test connection
psql "$(cd terraform/digitalocean && terraform output -raw database_connection_string)" -c "SELECT 1"

# Check firewall rules
doctl databases firewalls list <db-id>

# Add your IP if needed
doctl databases firewalls append <db-id> --rule ip_addr:<your-ip>
```

### Frontend Not Loading

```bash
# Check Spaces bucket
doctl spaces list

# Verify files uploaded
doctl spaces list-objects <bucket-name>

# Check CORS settings
doctl spaces bucket get <bucket-name>
```

### DNS Not Resolving

```bash
# Check DNS propagation
dig contrezz.com
dig api.contrezz.com

# Check Digital Ocean DNS
doctl compute domain records list contrezz.com

# DNS can take 24-48 hours to fully propagate
```

---

## 📊 Cost Monitoring

### Digital Ocean Billing

```bash
# Check current usage
doctl balance get

# View invoices
doctl invoice list

# Get current month estimate
doctl invoice get <invoice-id>
```

### Set Budget Alerts

1. Go to: https://cloud.digitalocean.com/billing
2. Click "Billing Alerts"
3. Set alert at $35/month (buffer above $32 target)

### Expected Monthly Breakdown

```
App Platform (Backend):  $12.00
PostgreSQL Database:     $15.00
Spaces (Frontend):       $ 5.00
Bandwidth (1TB free):    $ 0.00
─────────────────────────────
Total:                   $32.00
```

---

## 🔄 Rollback Plan

If something goes wrong during migration:

### Immediate Rollback (Day 1-7)

```bash
# 1. Update DNS back to AWS
# Point A records to AWS Load Balancer

# 2. AWS is still running as backup
# No data loss, immediate rollback

# 3. Debug Digital Ocean issue
# Fix and try again
```

### Database Rollback

```bash
# Restore from AWS backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier contrezz-restored \
  --db-snapshot-identifier contrezz-final-backup-YYYYMMDD
```

---

## 📚 Additional Resources

### Digital Ocean Documentation
- App Platform: https://docs.digitalocean.com/products/app-platform/
- Managed Databases: https://docs.digitalocean.com/products/databases/
- Spaces: https://docs.digitalocean.com/products/spaces/

### Support
- Community: https://www.digitalocean.com/community
- Tutorials: https://www.digitalocean.com/community/tutorials
- Support Tickets: Available on all plans

### Terraform
- DO Provider: https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs
- Examples: https://github.com/digitalocean/terraform-provider-digitalocean/tree/main/examples

---

## 🎉 Success Metrics

After migration, you should see:

✅ **Cost Reduction**: ~$66/month savings  
✅ **Simpler Management**: Fewer services to maintain  
✅ **Better Performance**: Equal or better than AWS  
✅ **Predictable Billing**: No surprise charges  
✅ **Faster Deployments**: Simpler CI/CD pipeline  

---

## 📞 Need Help?

If you encounter issues during migration:

1. **Check logs first:**
   ```bash
   doctl apps logs <app-id> --follow
   ```

2. **Review this guide's troubleshooting section**

3. **Check Digital Ocean Community:**
   - https://www.digitalocean.com/community/questions

4. **Contact Digital Ocean Support:**
   - Available on all plans
   - Usually responds within 24 hours

---

**Good luck with your migration! 🚀**

Remember: Take it slow, test thoroughly, and keep AWS as backup for at least 7 days.

