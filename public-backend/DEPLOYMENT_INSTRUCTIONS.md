# Deployment Instructions for Public Backend

Quick reference for deploying the public backend to DigitalOcean.

## 🚀 First Time Deployment

### 1. Prerequisites

```bash
# Install doctl
brew install doctl

# Authenticate
doctl auth init

# Verify
doctl account get
```

### 2. Create Database

```bash
# Create database
doctl databases create contrezz-public-db \
  --engine pg \
  --version 15 \
  --region nyc3 \
  --size db-s-1vcpu-1gb \
  --num-nodes 1

# Get connection string
doctl databases connection contrezz-public-db --format DSN

# Save this as PUBLIC_DATABASE_URL
```

### 3. Deploy App

```bash
# From project root
cd public-backend

# Deploy using spec file
doctl apps create --spec .do/app.yaml

# Get app ID
APP_ID=$(doctl apps list --format ID --no-header | grep contrezz-public)

# Watch deployment
doctl apps logs $APP_ID --follow
```

### 4. Configure Environment

In DigitalOcean Dashboard:

1. Go to Apps → contrezz-public-api
2. Settings → Environment Variables
3. Add variables:
   - `PUBLIC_DATABASE_URL` → (from step 2)
   - `ALLOWED_ORIGINS` → `https://contrezz.com,https://www.contrezz.com`
   - `NODE_ENV` → `production`
   - `PORT` → `8080`

### 5. Add Custom Domain

```bash
# Add domain
doctl apps create-domain $APP_ID --domain api.contrezz.com

# Or via web console:
# Apps → Your App → Settings → Domains → Add Domain
```

### 6. Configure DNS

Add CNAME record at your domain registrar:

```
Type: CNAME
Name: api
Value: <your-app>.ondigitalocean.app
TTL: 300
```

### 7. Verify Deployment

```bash
# Test health endpoint
curl https://api.contrezz.com/health

# Test careers endpoint
curl https://api.contrezz.com/api/careers
```

## 🔄 Subsequent Deployments

### Automatic Deployments

Deployments trigger automatically on push to main branch:

```bash
git add .
git commit -m "Update public backend"
git push origin main

# Monitor deployment
doctl apps logs $APP_ID --follow
```

### Manual Deployment

```bash
# Trigger manual deployment
doctl apps create-deployment $APP_ID

# Check status
doctl apps get $APP_ID
```

## 🗄️ Database Migrations

### Development

```bash
# Create new migration
npx prisma migrate dev --name add_feature

# Generates migration in prisma/migrations/
# Automatically applies to dev database
```

### Production

```bash
# Apply migrations to production
npx prisma migrate deploy

# Or configure in build command:
# build_command: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

## 🔧 Configuration Changes

### Update Environment Variables

```bash
# Via CLI
doctl apps update $APP_ID --env KEY=VALUE

# Or via web console:
# Apps → Your App → Settings → Environment Variables
```

### Update Resources

Edit `.do/app.yaml` and redeploy:

```yaml
services:
  - name: public-api
    instance_size_slug: basic-xs # Upgrade from basic-xxs
    instance_count: 2 # Scale to 2 instances
```

```bash
# Apply changes
doctl apps update $APP_ID --spec .do/app.yaml
```

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
doctl apps logs $APP_ID --follow

# Build logs
doctl apps logs $APP_ID --type build

# Deploy logs
doctl apps logs $APP_ID --type deploy

# Last 100 lines
doctl apps logs $APP_ID --tail 100
```

### Check Status

```bash
# App status
doctl apps get $APP_ID

# List deployments
doctl apps list-deployments $APP_ID

# Metrics in web console:
# Apps → Your App → Insights
```

### Health Checks

```bash
# Health endpoint
curl https://api.contrezz.com/health

# Expected response:
# {
#   "status": "ok",
#   "service": "contrezz-public-api",
#   "timestamp": "...",
#   "uptime": 12345
# }
```

## 🛠️ Troubleshooting

### Build Failures

```bash
# Check build logs
doctl apps logs $APP_ID --type build

# Common issues:
# - Node version mismatch → Check .node-version
# - Missing dependencies → Check package.json
# - Prisma generate failed → Add to build command
```

### Runtime Errors

```bash
# Check runtime logs
doctl apps logs $APP_ID --follow

# Common issues:
# - Database connection → Check PUBLIC_DATABASE_URL
# - CORS errors → Check ALLOWED_ORIGINS
# - Port mismatch → Should be 8080 in production
```

### Database Connection Issues

```bash
# Test connection
psql $PUBLIC_DATABASE_URL -c "SELECT version();"

# Check firewall
doctl databases firewalls list <db-id>

# Add app to firewall (automatic when linked)
```

### SSL Issues

```bash
# Check certificate
echo | openssl s_client -servername api.contrezz.com \
  -connect api.contrezz.com:443 2>/dev/null \
  | openssl x509 -noout -dates

# If invalid:
# - Wait 15 minutes for provisioning
# - Verify DNS points to correct app
# - Check domain added in App Platform
```

## 🔄 Rollback

### Rollback to Previous Deployment

```bash
# List deployments
doctl apps list-deployments $APP_ID

# Get previous deployment ID
PREV_DEPLOYMENT_ID=$(doctl apps list-deployments $APP_ID --format ID --no-header | sed -n '2p')

# Rollback
doctl apps create-deployment $APP_ID --deployment-id $PREV_DEPLOYMENT_ID
```

### Rollback Database Migration

```bash
# Resolve migration as rolled back
npx prisma migrate resolve --rolled-back "migration_name"

# Manually revert database changes
psql $PUBLIC_DATABASE_URL < rollback.sql
```

## 🔐 Security

### Rotate Database Credentials

```bash
# In DigitalOcean Dashboard:
# Databases → Your DB → Users → Reset Password

# Update app environment variable
doctl apps update $APP_ID --env PUBLIC_DATABASE_URL="new-connection-string"
```

### Update Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Manual updates
npm update

# Deploy changes
git push origin main
```

## 📈 Scaling

### Vertical Scaling (Increase Resources)

```yaml
# .do/app.yaml
services:
  - name: public-api
    instance_size_slug: basic-xs # Upgrade from basic-xxs
    # Options: basic-xxs, basic-xs, basic-s, basic-m
    #          professional-xs, professional-s, professional-m
```

### Horizontal Scaling (Add Instances)

```yaml
# .do/app.yaml
services:
  - name: public-api
    instance_count: 3 # Scale to 3 instances
```

Apply changes:

```bash
doctl apps update $APP_ID --spec .do/app.yaml
```

## 💰 Cost Management

### Current Costs

```bash
# View current configuration
doctl apps get $APP_ID --format Spec

# Cost per month:
# basic-xxs: $5
# basic-xs: $12
# basic-s: $24
# basic-m: $48
# professional-xs: $24
# professional-s: $48
# professional-m: $96
```

### Optimize Costs

```bash
# Scale down during low traffic
doctl apps update $APP_ID --spec .do/app-low-traffic.yaml

# Scale up for high traffic
doctl apps update $APP_ID --spec .do/app-high-traffic.yaml
```

## 📚 Quick Reference

```bash
# Common Commands
doctl apps list                           # List all apps
doctl apps get $APP_ID                    # Get app details
doctl apps logs $APP_ID --follow          # Stream logs
doctl apps create-deployment $APP_ID      # Trigger deployment
doctl databases list                      # List databases
doctl databases connection <db-id>        # Get connection info

# URLs
# Production: https://api.contrezz.com
# App Platform: https://cloud.digitalocean.com/apps
# Database: https://cloud.digitalocean.com/databases
```

## 🆘 Support

- **Documentation:** https://docs.digitalocean.com/products/app-platform/
- **Status:** https://status.digitalocean.com
- **Support:** https://cloud.digitalocean.com/support
- **Community:** https://www.digitalocean.com/community

---

**Last Updated:** December 2024  
**Maintained By:** DevOps Team
