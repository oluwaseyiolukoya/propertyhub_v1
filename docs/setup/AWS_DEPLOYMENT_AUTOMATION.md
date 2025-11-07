# AWS Deployment Guide (Dev + Prod) — Efficient and Automated

This guide explains a cost-conscious, reliable deployment for this app on AWS with separate test (dev) and production environments and full CI/CD.

## Architecture (lean, scalable)

- Frontend (Vite/React)
  - S3 static hosting per env → CloudFront CDN per env
  - Domains (Route 53): `app.dev.yourdomain.com`, `app.yourdomain.com`
- Backend API (Node/Express)
  - ECS Fargate service per env (1 task to start)
  - Application Load Balancer (ALB) per env
  - ECR for Docker images
  - CloudWatch Logs
- Database (PostgreSQL/Prisma)
  - RDS PostgreSQL t4g.micro (dev), t4g.small (prod)
- File uploads (avatars, docs)
  - S3 bucket per env (e.g., `ph-uploads-dev`, `ph-uploads-prod`) + optional CloudFront
- Secrets
  - AWS Secrets Manager (`/ph/dev/*`, `/ph/prod/*`)
- Scheduled jobs (MRR snapshots & nightly reconciliation)
  - EventBridge (CloudWatch) scheduled ECS tasks running the backend container with a job flag

Notes

- Start without Redis/ElastiCache (Socket.io runs single-server). Add later if needed.
- Keep everything minimal (1 task/env, single-AZ RDS) and scale when traffic grows.

---

## Prerequisites

- AWS account & admin access
- Domain in Route 53 (or external registrar, but Route 53 recommended)
- GitHub (or your CI provider) with repository access
- Docker installed locally
- AWS CLI configured locally

---

## Environment naming

We’ll use two environments:

- Dev: `dev`
- Prod: `prod`

Name resources with suffixes (e.g., `ph-frontend-dev`, `ph-backend-prod`).

---

## 1) One-time AWS setup (per environment)

### 1.1 ECR (image registry)

```bash
aws ecr create-repository --repository-name ph-backend-dev
aws ecr create-repository --repository-name ph-backend-prod
```

### 1.2 S3 buckets

```bash
# Frontend
aws s3 mb s3://ph-frontend-dev
aws s3 mb s3://ph-frontend-prod

# Uploads
aws s3 mb s3://ph-uploads-dev
aws s3 mb s3://ph-uploads-prod
```

### 1.3 CloudFront

- Create a distribution per frontend bucket (dev + prod)
- (Optional) Create a distribution per uploads bucket
- Attach ACM certificates (in us-east-1) for your subdomains

### 1.4 RDS PostgreSQL

- Dev: t4g.micro, single-AZ, storage 20–50GB
- Prod: t4g.small (or start with micro), backups enabled
- Capture the connection string as a secret (below)

### 1.5 Secrets Manager

Create secrets per env:

- `/ph/dev/DATABASE_URL`
- `/ph/dev/JWT_SECRET`
- `/ph/dev/PAYSTACK_PUBLIC_KEY`
- `/ph/dev/PAYSTACK_SECRET_KEY`
- `/ph/dev/FRONTEND_URL` (e.g., `https://app.dev.yourdomain.com`)
- (Similarly `/ph/prod/*`)

### 1.6 ECS + ALB

- Create an ECS Cluster per env
- Create a Task Definition per env:
  - Container image from ECR
  - CPU/Memory: 0.25 vCPU / 512MB
  - Env vars from Secrets Manager via task definition secrets
- Create an ALB per env
  - Listener 443 (HTTPS) → Target group → ECS service
- Create an ECS Service per env with desiredCount=1

### 1.7 Route 53 DNS

- `app.dev.yourdomain.com` → CloudFront (frontend)
- `api.dev.yourdomain.com` → ALB (backend)
- Repeat for prod

---

## 2) Application configuration

Backend env (via Secrets Manager / task definition):

- DATABASE_URL
- NODE_ENV (dev/prod)
- PORT (5000)
- FRONTEND_URL (per env)
- JWT_SECRET
- PAYSTACK_PUBLIC_KEY / PAYSTACK_SECRET_KEY
- S3_BUCKET_UPLOADS (e.g., `ph-uploads-dev`)
- S3_UPLOADS_CDN_URL (CloudFront URL if used)

Frontend env (Vite):

- VITE_API_BASE_URL (e.g., `https://api.dev.yourdomain.com`)
- VITE_UPLOADS_CDN_URL (optional)

Uploads

- Ensure backend uses S3 PutObject for avatars/documents (not local filesystem)

Migrations

- Use `prisma migrate deploy` as a one-off ECS task during the backend deploy

---

## 3) CI/CD with GitHub Actions

### 3.1 Backend (build, push, deploy to ECS)

Create `.github/workflows/backend.yml`:

```yaml
name: Backend Deploy

on:
  push:
    branches: ["develop", "main"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    env:
      AWS_REGION: us-east-1
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Set env name
        id: env
        run: |
          if [[ "${GITHUB_REF_NAME}" == "main" ]]; then
            echo "env=prod" >> $GITHUB_OUTPUT
          else
            echo "env=dev" >> $GITHUB_OUTPUT
          fi

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push image
        run: |
          REPO=ph-backend-${{ steps.env.outputs.env }}
          ECR_URI=$(aws ecr describe-repositories --repository-names $REPO --query 'repositories[0].repositoryUri' --output text)
          docker build -t $REPO:latest -f backend/Dockerfile .
          docker tag $REPO:latest $ECR_URI:latest
          docker push $ECR_URI:latest

      - name: Run DB migrations (one-off task)
        run: |
          CLUSTER=ph-${{ steps.env.outputs.env }}
          TASK_DEF=ph-backend-${{ steps.env.outputs.env }}
          SUBNETS="subnet-xxxx,subnet-yyyy" # replace
          SECURITY_GROUPS="sg-zzzzzz"      # replace
          # Override command to run prisma migrate deploy
          aws ecs run-task \
            --cluster $CLUSTER \
            --launch-type FARGATE \
            --task-definition $TASK_DEF \
            --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUPS],assignPublicIp=ENABLED}" \
            --overrides '{
              "containerOverrides": [{
                "name": "backend",
                "command": ["npx","prisma","migrate","deploy"],
                "environment": []
              }]
            }'

      - name: Force new ECS deployment
        run: |
          CLUSTER=ph-${{ steps.env.outputs.env }}
          SERVICE=ph-backend-${{ steps.env.outputs.env }}
          aws ecs update-service --cluster $CLUSTER --service $SERVICE --force-new-deployment
```

### 3.2 Frontend (build, upload to S3, invalidate CloudFront)

Create `.github/workflows/frontend.yml`:

```yaml
name: Frontend Deploy

on:
  push:
    branches: ["develop", "main"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    env:
      AWS_REGION: us-east-1
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Set env name
        id: env
        run: |
          if [[ "${GITHUB_REF_NAME}" == "main" ]]; then
            echo "env=prod" >> $GITHUB_OUTPUT
          else
            echo "env=dev" >> $GITHUB_OUTPUT
          fi

      - name: Install & build
        working-directory: frontend
        run: |
          npm ci
          npm run build

      - name: Sync to S3
        run: |
          BUCKET=ph-frontend-${{ steps.env.outputs.env }}
          aws s3 sync ./dist s3://$BUCKET --delete --cache-control max-age=31536000,public

      - name: Invalidate CloudFront
        run: |
          DISTRIBUTION_ID=${{ secrets.CF_DIST_ID_FRONTEND_DEV }}
          if [[ "${{ steps.env.outputs.env }}" == "prod" ]]; then
            DISTRIBUTION_ID=${{ secrets.CF_DIST_ID_FRONTEND_PROD }}
          fi
          aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

Notes

- Use OIDC to avoid long-lived AWS keys. Set `AWS_ROLE_ARN` in repo secrets.
- Replace subnet/SG IDs and distribution IDs with your values.
- You can split repos for frontend/backend if desired.

---

## 4) Scheduled jobs (EventBridge → ECS)

Create EventBridge rules for:

- Monthly MRR snapshot (1st 00:05): runs ECS task with command `node dist/index.js --job=monthly-snapshot`
- Daily current-month update (00:10): `--job=daily-snapshot`
- Nightly MRR reconciliation (00:20): `--job=reconcile-mrr`

Each rule targets your ECS cluster/service task definition with an overrides `command` for the container.

---

## 5) Observability & Ops

- CloudWatch Logs (ECS task logs)
- Alarms: ALB 5xx, ECS task unhealthy, RDS CPU/Connections
- Backups: RDS automated backups + snapshots
- S3 lifecycle policies for uploads/logs
- Rollbacks: keep last image in ECR; `aws ecs update-service --force-new-deployment --task-definition <previous>`

---

## 6) Cost controls

- Start with 1 ECS task/env & single-AZ RDS
- Avoid NAT Gateways initially (use public subnets + strict SGs)
- Turn off ElastiCache until needed
- Right-size RDS, enable storage autoscaling
- Use CloudFront caching & gzip/brotli

---

## 7) Cutover checklist

- [ ] DNS records point to CloudFront/ALB
- [ ] ACM certs valid
- [ ] Secrets populated per env
- [ ] RDS accessible from ECS SG
- [ ] Migrations ran successfully
- [ ] Test uploads to S3
- [ ] Verify cron tasks executed (logs)

---

## 8) Local → Cloud parity

- Use the same Docker image everywhere
- Store non-sensitive config in env vars
- Keep DB schema migrations in CI step

---

## 9) FAQ

- Q: Can I share the same cluster for dev and prod?
  - A: Yes, but separate services, task defs, ALBs, security groups and namespaces. Separate clusters keep blast radius lower.
- Q: How to do zero-downtime deploys?
  - A: ECS rolling updates with minHealthyPercent=100, desiredCount≥1 keep the endpoint up.
- Q: Where to keep Paystack keys?
  - A: Secrets Manager per env, loaded as task definition secrets.

---

This setup gives you automated, repeatable deployments with a low monthly cost. Scale up only the pieces you need as traffic grows.
