# Deployment Quick Reference

Quick commands and links for managing your Contrezz deployment.

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| **Frontend** | https://app.dev.contrezz.com |
| **Backend API** | https://api.dev.contrezz.com |
| **GitHub Actions** | https://github.com/oluwaseyiolukoya/contrezz_v1/actions |
| **AWS Console** | https://console.aws.amazon.com/ |

---

## 🚀 Deployment

### Automatic Deployment (Best Practice)
```bash
# Just push to main branch
git add .
git commit -m "Your changes"
git push origin main

# GitHub Actions automatically:
# - Builds backend Docker image
# - Pushes to ECR
# - Deploys to ECS
# - Builds and deploys frontend
```

### Monitor Deployment
```bash
# Watch GitHub Actions
open https://github.com/oluwaseyiolukoya/contrezz_v1/actions

# Or check ECS logs
aws logs tail /ecs/ph-dev-api --follow
```

---

## 💰 Cost Management

### Stop Dev Environment (Save Money)
```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/scripts
./dev-control.sh stop
```
**Saves**: ~$0.50/hour = $12/day if stopped 24 hours

### Start Dev Environment
```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/scripts
./dev-control.sh start
```
**Takes**: 2-3 minutes

### Check Status
```bash
./dev-control.sh status
```

### View Current Costs
```bash
# This month's costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost
```

---

## 🧪 Testing

### Test Backend API
```bash
# Health check
curl https://api.dev.contrezz.com/health

# Should return: {"status":"healthy"}
```

### Test Frontend
```bash
# Open in browser
open https://app.dev.contrezz.com
```

### Test Full Application
1. Open https://app.dev.contrezz.com
2. Login with your credentials
3. Navigate to Analytics page
4. Verify data loads correctly

---

## 🔍 Troubleshooting

### View Backend Logs
```bash
# Real-time logs
aws logs tail /ecs/ph-dev-api --follow

# Last 100 lines
aws logs tail /ecs/ph-dev-api --since 10m
```

### Check ECS Service Status
```bash
aws ecs describe-services \
  --cluster ph-dev-cluster \
  --services ph-dev-api \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Events:events[:5]}'
```

### Check RDS Status
```bash
aws rds describe-db-instances \
  --db-instance-identifier ph-dev-db \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}'
```

### Invalidate CloudFront Cache
```bash
aws cloudfront create-invalidation \
  --distribution-id E2PEMOC7P57ZD9 \
  --paths "/*"
```

### Restart Backend Service
```bash
# Force new deployment (pulls latest image)
aws ecs update-service \
  --cluster ph-dev-cluster \
  --service ph-dev-api \
  --force-new-deployment
```

---

## 📊 Infrastructure Info

### Dev Environment Resources

| Resource | Identifier | Cost |
|----------|-----------|------|
| **ECS Cluster** | `ph-dev-cluster` | $4/month (Spot) |
| **ECS Service** | `ph-dev-api` | - |
| **RDS Database** | `ph-dev-db` | $15/month (running) |
| **ALB** | `ph-dev-api-alb` | $16/month |
| **S3 Frontend** | `ph-frontend-dev-679763318339` | $1/month |
| **S3 Uploads** | `ph-uploads-dev-679763318339` | $1/month |
| **CloudFront** | `E2PEMOC7P57ZD9` | $1/month |
| **ECR Repository** | `ph-backend-dev` | Free |
| **NAT Gateway** | - | $16/month |

**Total (running)**: ~$53/month  
**Total (8hrs/day)**: ~$30-36/month ✅

---

## 🛠️ Common Tasks

### Deploy a Hotfix
```bash
# Make your changes
git add .
git commit -m "Hotfix: description"
git push origin main

# GitHub Actions deploys automatically in 5-8 minutes
```

### Rollback Deployment
```bash
# Find previous task definition
aws ecs list-task-definitions --family-prefix ph-dev-api

# Update service to previous version
aws ecs update-service \
  --cluster ph-dev-cluster \
  --service ph-dev-api \
  --task-definition ph-dev-api:PREVIOUS_REVISION
```

### Update Environment Variables
```bash
# Update secrets in AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id ph-dev-app-secrets \
  --secret-string '{"DATABASE_URL":"...","JWT_SECRET":"..."}'

# Force new deployment to pick up changes
aws ecs update-service \
  --cluster ph-dev-cluster \
  --service ph-dev-api \
  --force-new-deployment
```

### Scale Backend
```bash
# Increase to 2 tasks
aws ecs update-service \
  --cluster ph-dev-cluster \
  --service ph-dev-api \
  --desired-count 2

# Scale back to 1
aws ecs update-service \
  --cluster ph-dev-cluster \
  --service ph-dev-api \
  --desired-count 1
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `NEXT_STEPS.md` | Complete setup guide |
| `DEPLOYMENT_STATUS.md` | Current deployment status |
| `infra/BEST_PRACTICE_DEPLOYMENT_SUMMARY.md` | Overview |
| `infra/GITHUB_ACTIONS_SETUP.md` | CI/CD setup |
| `infra/COST_OPTIMIZATION.md` | Cost tips |
| `infra/DNS_SETUP_NAMECHEAP.md` | DNS configuration |

---

## 🎯 Daily Workflow

### Morning (Start Work)
```bash
# 1. Start dev environment
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/scripts
./dev-control.sh start

# 2. Wait 2-3 minutes

# 3. Verify backend is running
curl https://api.dev.contrezz.com/health

# 4. Start coding!
```

### During Day (Deploy Changes)
```bash
# Make changes, commit, push
git add .
git commit -m "Your changes"
git push origin main

# GitHub Actions deploys automatically
# Check progress: https://github.com/oluwaseyiolukoya/contrezz_v1/actions
```

### Evening (Stop Work)
```bash
# Stop dev environment to save money
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/scripts
./dev-control.sh stop

# Saves ~$0.50/hour
```

---

## 💡 Pro Tips

1. **Always stop dev environment when not coding** - Saves $12-15/day
2. **Monitor GitHub Actions** - Catch deployment issues early
3. **Check CloudWatch Logs** - Debug backend issues quickly
4. **Use git tags for releases** - Easy to track versions
5. **Set up AWS Budget alerts** - Never go over budget

---

## 🆘 Emergency Commands

### Backend is Down
```bash
# Check service status
aws ecs describe-services --cluster ph-dev-cluster --services ph-dev-api

# Check logs
aws logs tail /ecs/ph-dev-api --follow

# Restart service
aws ecs update-service --cluster ph-dev-cluster --service ph-dev-api --force-new-deployment
```

### Frontend Not Loading
```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E2PEMOC7P57ZD9 --paths "/*"

# Re-deploy frontend
cd /Users/oluwaseyio/test_ui_figma_and_cursor
npm run build
aws s3 sync dist/ s3://ph-frontend-dev-679763318339 --delete
```

### Database Connection Issues
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier ph-dev-db

# Restart database (takes 5-10 minutes)
aws rds reboot-db-instance --db-instance-identifier ph-dev-db
```

---

**Keep this file handy for quick reference!** 📌

