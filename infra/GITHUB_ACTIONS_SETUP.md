# GitHub Actions CI/CD Setup Guide

This guide will walk you through setting up automated deployments using GitHub Actions (industry best practice).

---

## 🎯 What This Achieves

**Before (Manual):**
```
You → Build locally → Push to ECR → Deploy to ECS
      ↓
   Platform issues, manual steps, error-prone
```

**After (Automated):**
```
You → Git push → GitHub Actions → Build → Test → Deploy
                      ↓
                 Consistent, automated, professional
```

---

## 📋 Prerequisites

- [x] GitHub repository for your code
- [x] AWS account with infrastructure deployed
- [ ] AWS credentials for GitHub Actions
- [ ] GitHub repository secrets configured

---

## Step 1: Create AWS IAM User for GitHub Actions

### 1.1 Create IAM Policy

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra
```

Create a file `github-actions-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::*:role/ph-dev-ecs-task-execution",
        "arn:aws:iam::*:role/ph-dev-ecs-task-role"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ph-frontend-dev-679763318339",
        "arn:aws:s3:::ph-frontend-dev-679763318339/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/E2PEMOC7P57ZD9"
    }
  ]
}
```

### 1.2 Create IAM User via AWS Console

1. Go to **AWS Console** → **IAM** → **Users** → **Create user**
2. **User name**: `github-actions-contrezz`
3. **Permissions**: Attach policies directly
4. Click **Create policy** → **JSON** → Paste the policy above
5. **Policy name**: `GitHubActionsContrezzPolicy`
6. Click **Create policy**
7. Back to user creation, select the new policy
8. Click **Next** → **Create user**

### 1.3 Create Access Keys

1. Click on the newly created user
2. Go to **Security credentials** tab
3. Scroll to **Access keys** → **Create access key**
4. Select **Application running outside AWS**
5. Click **Next** → **Create access key**
6. **⚠️ IMPORTANT**: Copy the **Access key ID** and **Secret access key**
7. You won't be able to see the secret again!

**Save these securely:**
```
AWS_ACCESS_KEY_ID: AKIA...
AWS_SECRET_ACCESS_KEY: wJalr...
```

---

## Step 2: Add Secrets to GitHub Repository

### 2.1 Navigate to Repository Settings

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/test_ui_figma_and_cursor`
2. Click **Settings** (top right)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 2.2 Add AWS Credentials

**Secret 1:**
- **Name**: `AWS_ACCESS_KEY_ID`
- **Value**: Paste the Access key ID from Step 1.3
- Click **Add secret**

**Secret 2:**
- **Name**: `AWS_SECRET_ACCESS_KEY`
- **Value**: Paste the Secret access key from Step 1.3
- Click **Add secret**

### 2.3 Verify Secrets

You should now see:
- ✅ `AWS_ACCESS_KEY_ID`
- ✅ `AWS_SECRET_ACCESS_KEY`

---

## Step 3: Push GitHub Actions Workflow

The workflow file has already been created at `.github/workflows/deploy-dev.yml`.

### 3.1 Commit and Push

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Add the workflow file
git add .github/workflows/deploy-dev.yml

# Commit
git commit -m "Add GitHub Actions CI/CD workflow for dev environment"

# Push to main branch
git push origin main
```

### 3.2 Watch the Deployment

1. Go to your GitHub repository
2. Click the **Actions** tab
3. You should see a workflow run starting automatically
4. Click on the workflow run to see real-time logs

---

## Step 4: Verify Deployment

### 4.1 Check Workflow Status

The workflow will:
1. ✅ Build backend Docker image (on Linux, no SSL issues!)
2. ✅ Push image to ECR
3. ✅ Update ECS task definition
4. ✅ Deploy to ECS Fargate
5. ✅ Build frontend
6. ✅ Upload to S3
7. ✅ Invalidate CloudFront cache

**Total time**: ~5-8 minutes

### 4.2 Test the Application

Once the workflow completes:

**Frontend:**
```bash
curl -I https://app.dev.contrezz.com
# Should return 200 OK
```

**Backend:**
```bash
curl https://api.dev.contrezz.com/health
# Should return {"status":"healthy"}
```

**Browser:**
- Open https://app.dev.contrezz.com
- Login and verify everything works

---

## 🎉 You're Done! What Happens Now?

### Automatic Deployments

Every time you push to the `main` branch:
1. GitHub Actions automatically triggers
2. Builds and tests your code
3. Deploys to dev environment
4. Notifies you of success/failure

### Example Workflow

```bash
# Make changes to your code
vim src/components/Analytics.tsx

# Commit and push
git add .
git commit -m "Update analytics dashboard"
git push origin main

# GitHub Actions automatically deploys! 🚀
# Check progress: https://github.com/YOUR_USERNAME/test_ui_figma_and_cursor/actions
```

---

## 🔧 Troubleshooting

### Workflow Fails: "Error: Cannot connect to the Docker daemon"

**Solution**: This is expected - it means Docker isn't running on the GitHub Actions runner. The workflow uses GitHub's pre-installed Docker, so this shouldn't happen. If it does, check the workflow logs.

### Workflow Fails: "Error: Task definition not found"

**Cause**: The ECS task definition doesn't exist yet.

**Solution**: We need to create an initial task definition. Run this locally:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/terraform
terraform apply -auto-approve
```

### Workflow Fails: "Error: Unable to locate credentials"

**Cause**: GitHub secrets not set correctly.

**Solution**: 
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` exist
3. Delete and re-create them if needed

### Backend Still Not Working

**Check ECS logs:**
```bash
aws logs tail /ecs/ph-dev-api --follow
```

**Common issues:**
- Database connection string incorrect
- Secrets not set in Secrets Manager
- Security group blocking traffic

---

## 📊 Monitoring Deployments

### View Deployment History

```bash
# List recent deployments
aws ecs list-services --cluster ph-dev-cluster

# View service events
aws ecs describe-services \
  --cluster ph-dev-cluster \
  --services ph-dev-api \
  --query 'services[0].events[:10]'
```

### View Application Logs

```bash
# Backend logs (real-time)
aws logs tail /ecs/ph-dev-api --follow

# CloudFront access logs (if enabled)
aws s3 ls s3://ph-frontend-dev-679763318339/logs/
```

---

## 🚀 Next Steps (Optional)

### 1. Add Automated Tests

Update `.github/workflows/deploy-dev.yml` to run tests before deploying:

```yaml
- name: Run backend tests
  run: |
    cd backend
    npm ci
    npm test

- name: Run frontend tests
  run: |
    npm ci
    npm test
```

### 2. Add Slack Notifications

Get notified when deployments succeed/fail:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 3. Add Production Workflow

Create `.github/workflows/deploy-prod.yml` for production deployments:
- Triggered by Git tags (e.g., `v1.0.0`)
- Requires manual approval
- Runs more extensive tests

---

## 💰 Cost Impact

**GitHub Actions Free Tier:**
- 2,000 minutes/month for private repos
- Unlimited for public repos

**Your Usage:**
- Each deployment: ~8 minutes
- 4 deployments/day = 32 minutes/day
- Monthly: ~960 minutes ✅ (well under limit)

**Cost**: $0/month 🎉

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Deployment Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## ✅ Checklist

- [ ] IAM user created with proper permissions
- [ ] Access keys generated and saved securely
- [ ] GitHub secrets configured
- [ ] Workflow file committed and pushed
- [ ] First deployment successful
- [ ] Frontend accessible at https://app.dev.contrezz.com
- [ ] Backend accessible at https://api.dev.contrezz.com
- [ ] Application works end-to-end

**Once all checked, you have a professional CI/CD pipeline! 🎉**

