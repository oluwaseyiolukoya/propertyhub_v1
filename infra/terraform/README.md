# Contrezz AWS Infrastructure

This Terraform configuration deploys the complete Contrezz infrastructure to AWS.

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with credentials
- Docker Desktop running
- Domain name (using Namecheap DNS)

## Quick Start

### 1. Initialize Terraform

```bash
cd infra/terraform
terraform init
```

### 2. Review the Plan

```bash
terraform plan -var-file=env/dev.tfvars
```

### 3. Deploy Infrastructure

```bash
terraform apply -var-file=env/tfvars
```

### 4. Get Outputs

```bash
terraform output
terraform output -json | jq
```

## Important Outputs

After deployment, you'll get:

- `manual_dns_records` - DNS records to add in Namecheap
- `ecr_repository_url` - Push your backend Docker image here
- `s3_frontend_bucket` - Upload your frontend build here
- `app_fqdn` - Your frontend URL
- `api_fqdn` - Your backend API URL

## Post-Deployment Steps

### 1. Add DNS Records in Namecheap

Get the DNS records:

```bash
terraform output manual_dns_records
```

Add these CNAME records in Namecheap:
- `app.dev` → CloudFront domain
- `api.dev` → ALB domain

Also add the ACM validation records (check AWS Certificate Manager console).

### 2. Build and Push Backend

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $(terraform output -raw ecr_repository_url | cut -d/ -f1)

# Build and push
cd ../../backend
docker build -t ph-backend-dev:latest .
docker tag ph-backend-dev:latest $(cd ../infra/terraform && terraform output -raw ecr_repository_url):latest
docker push $(cd ../infra/terraform && terraform output -raw ecr_repository_url):latest
```

### 3. Deploy Frontend

```bash
# Build frontend
cd ../../
npm run build

# Upload to S3
aws s3 sync dist s3://$(cd infra/terraform && terraform output -raw s3_frontend_bucket) --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $(cd infra/terraform && terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

### 4. Run Database Migrations

```bash
# SSH into ECS task or run locally with DATABASE_URL from Secrets Manager
cd backend
npx prisma migrate deploy
npx prisma db seed
```

## Adding Paystack Keys Later

1. Edit `env/dev.tfvars`:

```hcl
paystack_public_key = "pk_test_xxxxx"
paystack_secret_key = "sk_test_xxxxx"
```

2. Apply changes:

```bash
terraform apply -var-file=env/dev.tfvars
```

3. Restart ECS service to pick up new secrets:

```bash
aws ecs update-service \
  --cluster ph-dev-cluster \
  --service ph-dev-api \
  --force-new-deployment
```

## Cost Optimization

Dev environment estimated costs:
- RDS db.t4g.micro: ~$15/month
- ECS Fargate (512 CPU, 1GB RAM): ~$15/month
- ALB: ~$16/month
- S3 + CloudFront: ~$5/month
- NAT Gateway: ~$32/month (biggest cost)

**Total: ~$83/month**

To reduce costs:
- Use single NAT Gateway instead of 2 (reduces HA)
- Stop RDS when not in use (manual)
- Use Fargate Spot for non-critical workloads

## Production Environment

Copy `env/dev.tfvars` to `env/prod.tfvars` and adjust:

```hcl
env                  = "prod"
db_instance_class    = "db.t4g.small"  # or larger
db_allocated_storage = 100
ecs_task_cpu         = "1024"
ecs_task_memory      = "2048"
ecs_desired_count    = 2  # for HA
```

Deploy:

```bash
terraform apply -var-file=env/prod.tfvars
```

## Cleanup

To destroy all resources:

```bash
terraform destroy -var-file=env/dev.tfvars
```

**Warning:** This will delete everything including the database!

## Troubleshooting

### Certificate Validation Timeout

If Terraform times out waiting for certificate validation:

1. Check AWS Certificate Manager console
2. Add the DNS validation CNAME records in Namecheap
3. Wait 5-10 minutes for DNS propagation
4. Re-run `terraform apply`

### ECS Service Unhealthy

Check logs:

```bash
aws logs tail /ecs/ph-dev-api --follow
```

Common issues:
- Database connection failed (check security groups)
- Missing environment variables (check Secrets Manager)
- Docker image not found (push to ECR first)

### Frontend Not Loading

1. Check CloudFront distribution status (must be "Deployed")
2. Verify DNS records in Namecheap
3. Check S3 bucket has files
4. Try invalidating CloudFront cache

## Support

For issues, check:
- CloudWatch Logs: `/ecs/ph-dev-api`
- ECS Service events in AWS Console
- ALB target group health checks
