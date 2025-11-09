# Migration from AWS to Digital Ocean

## Overview
Migrating Contrezz application from AWS to Digital Ocean to reduce costs from ~$98/month to ~$32/month.

## Cost Comparison

### AWS (Current)
- ECS Fargate: ~$30/month
- RDS PostgreSQL: ~$15/month
- Application Load Balancer: ~$16/month
- NAT Gateway: ~$32/month
- S3 + CloudFront: ~$5/month
- **Total: ~$98/month**

### Digital Ocean (Target)
- App Platform (Backend): $12/month
- Managed PostgreSQL: $15/month
- Spaces + CDN (Frontend): $5/month
- **Total: ~$32/month**
- **Savings: $66/month (67%)**

## Migration Timeline

### Day 1: Backup & Setup (2-3 hours)
- [x] Backup AWS RDS database
- [ ] Create Digital Ocean account
- [ ] Set up Terraform for Digital Ocean
- [ ] Create infrastructure

### Day 2: Deploy & Migrate (3-4 hours)
- [ ] Deploy backend to App Platform
- [ ] Restore database to DO PostgreSQL
- [ ] Deploy frontend to Spaces
- [ ] Configure environment variables

### Day 3: Test & Switch (2-3 hours)
- [ ] Test all functionality
- [ ] Update DNS records
- [ ] Monitor for issues
- [ ] Keep AWS running as backup

### Day 4: Cleanup (1 hour)
- [ ] Verify everything works on DO
- [ ] Destroy AWS resources
- [ ] Cancel AWS services

## Architecture

### Digital Ocean Setup

```
┌─────────────────────────────────────────────────────┐
│              Digital Ocean Cloud                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │         App Platform (Backend)               │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │  contrezz-backend                      │  │  │
│  │  │  - Node.js 20.x                        │  │  │
│  │  │  - Port 5000                           │  │  │
│  │  │  - Auto SSL                            │  │  │
│  │  │  - Auto deploy from GitHub             │  │  │
│  │  │  - Health checks                       │  │  │
│  │  │  - $12/month (Basic plan)              │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │      Managed PostgreSQL Database             │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │  contrezz-db                           │  │  │
│  │  │  - PostgreSQL 15                       │  │  │
│  │  │  - 1 GB RAM / 10 GB Disk               │  │  │
│  │  │  - Automated daily backups             │  │  │
│  │  │  - Connection pooling                  │  │  │
│  │  │  - $15/month                           │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │         Spaces (Object Storage + CDN)        │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │  contrezz-frontend                     │  │  │
│  │  │  - Static site hosting                 │  │  │
│  │  │  - Global CDN                          │  │  │
│  │  │  - Custom domain support               │  │  │
│  │  │  - $5/month (250GB storage + 1TB BW)   │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Total: $32/month                                  │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Digital Ocean Account**
   - Sign up at: https://www.digitalocean.com/
   - Add payment method
   - Generate API token

2. **Backup AWS Data**
   - Export RDS database
   - Download any S3 files
   - Export environment variables

3. **Tools Needed**
   - Terraform installed
   - doctl (Digital Ocean CLI)
   - PostgreSQL client (psql)

## Step-by-Step Migration

### Step 1: Backup AWS Database

```bash
# Connect to your AWS RDS and export
pg_dump -h <aws-rds-endpoint> -U <username> -d contrezz_prod > contrezz_backup.sql

# Or use AWS RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier contrezz-prod \
  --db-snapshot-identifier contrezz-final-backup-$(date +%Y%m%d)
```

### Step 2: Set Up Digital Ocean

```bash
# Install doctl
brew install doctl  # macOS
# or
snap install doctl  # Linux

# Authenticate
doctl auth init

# Verify
doctl account get
```

### Step 3: Create Digital Ocean Resources with Terraform

See `terraform/digitalocean/` directory for configs.

### Step 4: Deploy Backend

```bash
# Build and deploy backend
cd backend
doctl apps create --spec .do/app.yaml

# Or use App Platform UI
```

### Step 5: Restore Database

```bash
# Get database connection string from Digital Ocean
doctl databases connection <database-id> --format ConnectionString

# Restore backup
psql "<connection-string>" < contrezz_backup.sql
```

### Step 6: Deploy Frontend

```bash
# Build frontend
cd frontend
npm run build

# Upload to Spaces
doctl spaces upload dist contrezz-frontend --recursive
```

### Step 7: Configure DNS

```bash
# Update your domain DNS records
# Point to Digital Ocean nameservers or add A/CNAME records
```

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:pass@db-host:25060/contrezz?sslmode=require
FRONTEND_URL=https://contrezz.com
JWT_SECRET=<your-secret>
PAYSTACK_SECRET_KEY=<your-key>
PAYSTACK_PUBLIC_KEY=<your-key>
```

### Frontend (.env)
```bash
VITE_API_URL=https://api.contrezz.com
```

## Testing Checklist

- [ ] Backend health check responds
- [ ] Database connection works
- [ ] Frontend loads correctly
- [ ] User login works
- [ ] API calls work
- [ ] Payment integration works
- [ ] Email notifications work
- [ ] Real-time features work (Socket.io)

## DNS Configuration

### Option 1: Use Digital Ocean DNS (Recommended)
```
# Add domain to Digital Ocean
doctl compute domain create contrezz.com

# Add records
A     @              <app-platform-ip>
CNAME www            @
CNAME api            <backend-url>
```

### Option 2: Keep Current DNS Provider
```
# Update A records to point to Digital Ocean
A     @              <app-platform-ip>
CNAME api            <backend-url>
```

## Rollback Plan

If something goes wrong:
1. Keep AWS resources running for 7 days
2. Can quickly switch DNS back to AWS
3. Database backup available for restore

## Cost Monitoring

### Digital Ocean Billing
- Check daily: https://cloud.digitalocean.com/billing
- Set up billing alerts
- Monitor bandwidth usage

### Expected Monthly Costs
- App Platform: $12
- Database: $15
- Spaces: $5
- **Total: $32**

## AWS Cleanup (After Successful Migration)

### Step 1: Stop Services (Day 3)
```bash
cd terraform/aws
terraform destroy --target=module.ecs
terraform destroy --target=module.rds
```

### Step 2: Full Cleanup (Day 7)
```bash
# Destroy everything
terraform destroy

# Verify in AWS Console
# - No running EC2 instances
# - No RDS databases
# - No load balancers
# - No NAT gateways
# - Empty S3 buckets
```

### Step 3: Cancel AWS Account (Optional)
- Close AWS account if not needed
- Or keep for future use

## Support & Troubleshooting

### Digital Ocean Support
- Community: https://www.digitalocean.com/community
- Docs: https://docs.digitalocean.com/
- Support tickets: Available on all plans

### Common Issues

**Database Connection Issues**
- Check firewall rules
- Verify connection string
- Check SSL mode

**App Platform Build Fails**
- Check build logs
- Verify Node.js version
- Check dependencies

**Frontend Not Loading**
- Verify Spaces bucket is public
- Check CDN configuration
- Verify CORS settings

## Next Steps

1. Create Digital Ocean account
2. Generate API token
3. Run Terraform to create infrastructure
4. Deploy application
5. Test thoroughly
6. Switch DNS
7. Monitor for 7 days
8. Destroy AWS resources

## Success Metrics

- [ ] Application fully functional on Digital Ocean
- [ ] All users can access the platform
- [ ] Monthly cost under $35
- [ ] No AWS charges after cleanup
- [ ] Performance equal or better than AWS

