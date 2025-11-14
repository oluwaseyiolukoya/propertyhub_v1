# GitHub Actions Setup for DigitalOcean Deployment

## Overview

The GitHub Actions workflow now triggers and monitors DigitalOcean deployments automatically when you push to the `main` branch.

## Required Secret

You need to add a **DigitalOcean Access Token** to your GitHub repository secrets.

### Step 1: Generate DigitalOcean Access Token

1. **Login to DigitalOcean**: https://cloud.digitalocean.com/
2. **Navigate to API**: Click on "API" in the left sidebar
3. **Generate New Token**:
   - Click "Generate New Token"
   - Name: `GitHub Actions Deployment`
   - Scopes: Select **Read & Write**
   - Click "Generate Token"
4. **Copy the token** (you won't see it again!)

### Step 2: Add Secret to GitHub

1. **Go to your GitHub repository**: https://github.com/oluwaseyiolukoya/propertyhub_v1
2. **Navigate to Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**
4. **Add the secret**:
   - Name: `DIGITALOCEAN_ACCESS_TOKEN`
   - Value: Paste the token you copied from DigitalOcean
5. **Click "Add secret"**

### Step 3: Verify Setup

After adding the secret, the next push to `main` will:

1. ✅ Build frontend and backend
2. ✅ Trigger deployment on DigitalOcean
3. ✅ Wait for deployment to complete
4. ✅ Verify backend and frontend are accessible

## Workflow Jobs

### 1. Build & Test
- Installs dependencies
- Builds frontend with production config
- Builds backend
- Validates code compiles without errors

### 2. Deploy to DigitalOcean
- Triggers deployment via DigitalOcean API
- Only runs on `main` branch
- Requires `DIGITALOCEAN_ACCESS_TOKEN` secret

### 3. Verify Deployment
- Waits 60 seconds for deployment
- Checks backend health endpoint
- Checks frontend accessibility
- Reports success or failure

## Monitoring Deployments

### GitHub Actions
- View workflow runs: https://github.com/oluwaseyiolukoya/propertyhub_v1/actions
- See real-time logs for each job
- Get notified of failures

### DigitalOcean Dashboard
- View app status: https://cloud.digitalocean.com/apps
- See detailed deployment logs
- Monitor resource usage

## Troubleshooting

### "Secret not found" Error
- Make sure you added `DIGITALOCEAN_ACCESS_TOKEN` to GitHub secrets
- Check the secret name is exactly: `DIGITALOCEAN_ACCESS_TOKEN`

### Deployment Fails
1. Check DigitalOcean dashboard for detailed logs
2. Verify environment variables are set correctly
3. Check if there are any build errors

### Health Check Fails
- Backend might still be starting (increase wait time)
- Check if environment variables are correct
- Verify database connection

## Alternative: Auto-Deploy Only

If you prefer to let DigitalOcean handle everything automatically (without GitHub Actions):

1. **Keep the webhook**: DigitalOcean → Settings → GitHub Integration
2. **Disable workflow**: Rename `.github/workflows/deploy-dev.yml` to `deploy-dev.yml.disabled`

This way, DigitalOcean will still auto-deploy on every push, but GitHub Actions won't run.

## Current Setup

**With GitHub Actions** (Recommended):
- ✅ Build validation before deployment
- ✅ Deployment status in GitHub
- ✅ Automated health checks
- ✅ Clear deployment logs

**Without GitHub Actions** (Simpler):
- ✅ Automatic deployment via webhook
- ⚠️  No pre-deployment validation
- ⚠️  Check DigitalOcean for status

## Support

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **DigitalOcean App Platform**: https://docs.digitalocean.com/products/app-platform/
- **Workflow File**: `.github/workflows/deploy-dev.yml`

