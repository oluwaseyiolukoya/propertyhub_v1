#!/bin/bash

# Contrezz Backend Deployment Script
# This script ensures Prisma is always synced after deployment

set -e  # Exit on any error

echo "🚀 Starting Contrezz backend deployment..."
echo "================================================"

# Step 1: Pull latest code
echo ""
echo "📥 Step 1/6: Pulling latest code from GitHub..."
git pull origin main

# Step 2: Install dependencies
echo ""
echo "📦 Step 2/6: Installing dependencies..."
npm install

# Step 3: Generate Prisma Client
echo ""
echo "🔨 Step 3/6: Generating Prisma Client..."
npx prisma generate

# Step 4: Deploy database migrations (PROPER WAY)
echo ""
echo "🗄️ Step 4/6: Deploying database migrations..."
npx prisma migrate deploy

# Step 5: Build application
echo ""
echo "🏗️ Step 5/6: Building application..."
npm run build

# Step 6: Restart service
echo ""
echo "🔄 Step 6/6: Restarting backend service..."

if command -v pm2 &> /dev/null; then
    echo "   Using PM2..."
    pm2 restart backend
    echo "   ✅ Backend restarted with PM2"
elif systemctl is-active --quiet backend 2>/dev/null; then
    echo "   Using systemd..."
    sudo systemctl restart backend
    echo "   ✅ Backend restarted with systemd"
elif command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "   Using Docker Compose..."
    docker-compose restart backend
    echo "   ✅ Backend restarted with Docker Compose"
else
    echo "   ⚠️  Could not detect process manager"
    echo "   Please restart your backend service manually"
fi

# Summary
echo ""
echo "================================================"
echo "✅ Deployment complete!"
echo ""
echo "📊 Next steps:"
echo "   - Check logs: pm2 logs backend"
echo "   - Verify API: curl http://localhost:5000/health"
echo "   - Test forms: Visit your contact page"
echo ""
echo "🎉 Happy deploying!"

