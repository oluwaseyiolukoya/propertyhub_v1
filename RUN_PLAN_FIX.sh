#!/bin/bash

# Script to deploy and run the plan category fix
set -e

echo "🚀 Deploying Plan Category Fix"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Commit and push
echo -e "${YELLOW}📦 Step 1: Committing and pushing fix script...${NC}"
git add backend/scripts/fix-production-plan-categories.js \
        FIX_DEVELOPER_PLANS_ISSUE.md \
        RUN_PLAN_FIX.sh

git commit -m "fix: add script to fix plan categories for developer plans visibility

- Created fix-production-plan-categories.js script
- Automatically categorizes plans based on name keywords
- Sets category='development' for developer plans
- Sets category='property_management' for property plans
- Fixes issue where developer plans don't show in admin customer creation"

git push origin main

echo -e "${GREEN}✅ Pushed to GitHub${NC}"
echo ""

# Step 2: Wait for deployment
echo -e "${YELLOW}⏱️  Step 2: Waiting for DigitalOcean deployment...${NC}"
echo ""
echo "  DigitalOcean is now:"
echo "  1. Detecting your push"
echo "  2. Pulling latest code"
echo "  3. Running npm ci"
echo "  4. Running npx prisma generate"
echo "  5. Running npm run build"
echo "  6. Deploying"
echo ""
echo -e "${BLUE}  This takes about 5-10 minutes${NC}"
echo ""
echo "  Monitor at: https://cloud.digitalocean.com/apps"
echo ""
read -p "  Press ENTER when deployment is complete..."
echo ""

# Step 3: Instructions to run the script
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Code Deployed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}📋 Step 3: Run the fix script in production${NC}"
echo ""
echo "Choose one of these methods:"
echo ""
echo "─────────────────────────────────────────────────────────"
echo -e "${BLUE}Method A: DigitalOcean Console (Easiest)${NC}"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "1. Go to: https://cloud.digitalocean.com/apps"
echo "2. Click your app"
echo "3. Go to 'Console' tab"
echo "4. Run this command:"
echo ""
echo -e "${GREEN}   node backend/scripts/fix-production-plan-categories.js${NC}"
echo ""
echo "─────────────────────────────────────────────────────────"
echo -e "${BLUE}Method B: Using doctl CLI${NC}"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "1. Get your app ID:"
echo "   doctl apps list"
echo ""
echo "2. Run the script:"
echo "   doctl apps exec <app-id> --command \"node backend/scripts/fix-production-plan-categories.js\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}✅ After running the script:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test customer creation:"
echo "  1. Go to https://contrezz.com/admin"
echo "  2. Click 'Add Customer'"
echo "  3. Select 'Property Developer' as customer type"
echo "  4. Check the Plan dropdown"
echo "  5. Expected: ✅ You should see developer plans!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

