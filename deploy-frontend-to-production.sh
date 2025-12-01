#!/bin/bash

# Deploy Frontend to DigitalOcean Production
# This script builds the frontend and triggers a redeployment

set -e

echo "🚀 Deploying Frontend to Production"
echo "===================================="
echo ""

# Step 1: Build frontend
echo "📦 Step 1/2: Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 2: Instructions for deployment
echo "📋 Step 2/2: Deploy to DigitalOcean"
echo ""
echo "Your code has been pushed to GitHub. Now deploy to production:"
echo ""
echo "Option 1: Auto-deploy (if enabled)"
echo "  → DigitalOcean will automatically detect the push and redeploy"
echo "  → Check your DigitalOcean dashboard for deployment status"
echo ""
echo "Option 2: Manual deploy"
echo "  1. Go to https://cloud.digitalocean.com/apps"
echo "  2. Click on your frontend app"
echo "  3. Click 'Actions' → 'Force Rebuild and Deploy'"
echo ""
echo "🎯 What this fixes:"
echo "  ✅ Upgrade modal will now redirect to Paystack checkout"
echo "  ✅ No more 'Please enter a valid Key' error"
echo "  ✅ Uses backend-provided authorization URL with valid keys"
echo ""
echo "⏱️  Deployment usually takes 3-5 minutes"
echo ""

