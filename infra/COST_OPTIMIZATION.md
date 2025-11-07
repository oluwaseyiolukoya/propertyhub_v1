# Cost Optimization Guide

This guide explains how to keep your AWS costs under $40/month while maintaining a professional development environment.

---

## 💰 Cost Breakdown (Optimized)

### Always-On Costs (~$18/month)

These resources run 24/7 but are essential:

| Resource        | Monthly Cost  | Notes                                            |
| --------------- | ------------- | ------------------------------------------------ |
| NAT Gateway     | $16/month     | Required for ECS to pull images, access internet |
| S3 + CloudFront | $2/month      | Static hosting, very cheap                       |
| **Subtotal**    | **$18/month** | **Fixed costs**                                  |

### Variable Costs (When Running)

These costs depend on how much you use the dev environment:

| Resource                           | Cost When Running | Cost When Stopped       |
| ---------------------------------- | ----------------- | ----------------------- |
| RDS db.t4g.micro                   | $15/month         | $2/month (storage only) |
| ECS Fargate Spot (256 CPU, 512 MB) | $4/month          | $0                      |
| ALB                                | $16/month         | $16/month               |
| **Subtotal**                       | **$35/month**     | **$18/month**           |

### Total Monthly Cost Scenarios

| Scenario                             | Monthly Cost               |
| ------------------------------------ | -------------------------- |
| **Always On**                        | $53/month ⚠️ (over budget) |
| **Running 12 hrs/day (work hours)**  | $36/month ✅               |
| **Running 8 hrs/day + weekends off** | $30/month ✅               |
| **Stopped (nights/weekends)**        | $20/month ✅               |

---

## ✅ Optimizations Implemented

### 1. Fargate Spot (70% savings)

- **Before**: Fargate on-demand = $15/month
- **After**: Fargate Spot = $4/month
- **Savings**: $11/month
- **Trade-off**: Can be interrupted (rare, AWS gives 2-min warning)

### 2. Reduced Task Size

- **Before**: 512 CPU, 1024 MB RAM
- **After**: 256 CPU, 512 MB RAM
- **Savings**: ~$7/month
- **Trade-off**: Slightly slower (fine for dev)

### 3. Single NAT Gateway

- **Before**: 2 NAT Gateways (high availability)
- **After**: 1 NAT Gateway
- **Savings**: $32/month
- **Trade-off**: No redundancy (acceptable for dev)

### 4. Stop/Start Script

- Automatically stop dev environment when not coding
- **Savings**: Up to $15/month
- **Trade-off**: 2-3 min startup time

---

## 🛠️ How to Use the Stop/Start Script

### Stop Dev Environment (Save Money)

```bash
cd infra/scripts
./dev-control.sh stop
```

**What it does:**

- Stops ECS service (backend API goes offline)
- Stops RDS database
- **Saves**: ~$0.50/hour = $12/day if stopped 24 hours

### Start Dev Environment (Resume Work)

```bash
cd infra/scripts
./dev-control.sh start
```

**What it does:**

- Starts RDS database (waits for it to be ready)
- Starts ECS service (backend comes online)
- **Takes**: 2-3 minutes

### Check Status

```bash
cd infra/scripts
./dev-control.sh status
```

---

## 📅 Recommended Usage Pattern

### Option A: Manual Control (Most Savings)

```bash
# Morning (start work)
./dev-control.sh start

# Evening (end work)
./dev-control.sh stop
```

**Monthly cost**: ~$28-32/month ✅

### Option B: Weekday Schedule

- **Mon-Fri 9am-6pm**: Running
- **Nights + Weekends**: Stopped

**Monthly cost**: ~$30-35/month ✅

### Option C: Always On (Convenience)

- Leave it running 24/7
- **Monthly cost**: ~$53/month ⚠️ (over budget)

---

## 🚀 Future Cost Optimizations (When Scaling)

### When You Have More Budget:

1. **Add 2nd NAT Gateway** ($32/month)

   - High availability across AZs
   - No downtime if one AZ fails

2. **Upgrade to Fargate On-Demand** (+$11/month)

   - No interruptions
   - More reliable

3. **Larger Task Size** (+$7/month)

   - Faster API responses
   - Handle more concurrent requests

4. **Multi-AZ RDS** (+$15/month)
   - Automatic failover
   - Better uptime

### When You Launch Production:

- Keep dev environment small (current setup)
- Scale production based on actual traffic
- Use RDS read replicas for heavy read workloads
- Consider Aurora Serverless for variable traffic

---

## 💡 Additional Cost-Saving Tips

### 1. Clean Up Unused Resources

```bash
# Delete old ECR images (keep last 10)
aws ecr list-images --repository-name ph-dev-backend \
  --query 'imageIds[10:]' --output json | \
  jq -r '.[] | .imageDigest' | \
  xargs -I {} aws ecr batch-delete-image \
    --repository-name ph-dev-backend \
    --image-ids imageDigest={}
```

### 2. Monitor Costs Daily

- Set up AWS Budget alerts
- Get notified if costs exceed $40/month
- Review AWS Cost Explorer weekly

### 3. Use CloudWatch Logs Insights (Not Datadog)

- CloudWatch Logs: $0.50/GB ingested
- Datadog: $15/month minimum
- **Savings**: $14/month

### 4. Optimize Database

- Use connection pooling (already in code)
- Run VACUUM and ANALYZE weekly
- Monitor slow queries

---

## 📊 Cost Monitoring

### Set Up AWS Budget Alert

```bash
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json
```

**budget.json:**

```json
{
  "BudgetName": "PropertyHub-Dev-Monthly",
  "BudgetLimit": {
    "Amount": "40",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {
    "TagKeyValue": ["user:Environment$dev"]
  }
}
```

### View Current Costs

```bash
# This month's costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Environment
```

---

## 🎯 Target: $40/month Budget

### Breakdown to Stay Under Budget:

- **Fixed costs**: $18/month (NAT + S3 + CloudFront)
- **Variable costs**: $22/month budget
- **Strategy**: Stop dev environment when not coding

### Realistic Usage:

- **8 hours/day, 5 days/week**: ~$30-35/month ✅
- **12 hours/day, 7 days/week**: ~$45/month ⚠️ (slightly over)
- **24/7 always on**: ~$53/month ❌ (over budget)

---

## 🔄 Next Steps

1. **Apply Terraform changes** (enable Fargate Spot)
2. **Test stop/start script**
3. **Set up AWS Budget alert**
4. **Establish daily routine** (start in morning, stop at night)
5. **Monitor costs weekly**

**With these optimizations, you'll stay comfortably under $40/month! 🎉**
