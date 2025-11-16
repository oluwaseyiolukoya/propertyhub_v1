#!/bin/bash

# Simple script to push Prisma schema fix to production
# No SSH needed - DigitalOcean App Platform handles deployment automatically!

set -e

echo "🚀 Deploying Prisma Schema Fix to Production"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Show what will be deployed
echo -e "${BLUE}📦 Files to be deployed:${NC}"
echo "  - backend/prisma/schema.prisma (FIXED)"
echo "  - CUSTOMER_CREATION_500_FIX.md"
echo "  - SIMPLE_DEPLOYMENT_GUIDE.md"
echo ""

# Step 2: Stage files
echo -e "${YELLOW}📋 Staging files...${NC}"
git add backend/prisma/schema.prisma \
        CUSTOMER_CREATION_500_FIX.md \
        MANUAL_DEPLOYMENT_INSTRUCTIONS.md \
        SIMPLE_DEPLOYMENT_GUIDE.md \
        PUSH_TO_PRODUCTION.sh

echo -e "${GREEN}✅ Files staged${NC}"
echo ""

# Step 3: Commit
echo -e "${YELLOW}💾 Committing changes...${NC}"
git commit -m "fix: add missing fields to Prisma schema for customer creation

- Added planCategory, projectLimit, projectsCount to customers model
- Added category, projectLimit to plans model
- Made propertyLimit nullable in plans model
- Fixes 500 error when creating customers in production
- Schema now matches the migration that was already applied

This fix resolves the schema drift issue where the migration was applied
to the database but the schema.prisma file was not updated, causing
Prisma Client to be generated without knowledge of these fields."

echo -e "${GREEN}✅ Changes committed${NC}"
echo ""

# Step 4: Push
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
git push origin main

echo -e "${GREEN}✅ Pushed to GitHub!${NC}"
echo ""

# Step 5: Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ Deployment Started!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}🔄 DigitalOcean App Platform is now:${NC}"
echo "  1. Detecting your push to main branch"
echo "  2. Pulling latest code"
echo "  3. Running: npm ci"
echo "  4. Running: npx prisma generate (FIXES THE ISSUE!)"
echo "  5. Running: npm run build"
echo "  6. Deploying and restarting backend"
echo ""
echo -e "${YELLOW}⏱️  This takes about 5-10 minutes${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Monitor Deployment:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: DigitalOcean Dashboard"
echo "  → https://cloud.digitalocean.com/apps"
echo "  → Click your app → Deployments tab"
echo ""
echo "Option 2: Command Line (if you have doctl)"
echo "  → doctl apps list"
echo "  → doctl apps logs <app-id> --follow"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}✅ Test After Deployment:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Check backend health:"
echo "   curl https://api.contrezz.com/health"
echo ""
echo "2. Test customer creation:"
echo "   → Go to https://contrezz.com/admin"
echo "   → Login to admin dashboard"
echo "   → Click 'Add Customer'"
echo "   → Fill in details and select a plan"
echo "   → Click 'Send Invitation'"
echo "   → Expected: ✅ Customer created successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Deployment initiated successfully!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

