#!/bin/bash

# Production SMTP Fix Deployment Script
# This script deploys the SMTP error handling fix to production

set -e  # Exit on error

echo "🚀 Deploying SMTP Fix to Production"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if we're on the right branch
echo "📋 Step 1: Checking git status..."
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  Warning: You're on branch '$BRANCH', not 'main'${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Step 2: Check for uncommitted changes
echo ""
echo "📋 Step 2: Checking for uncommitted changes..."
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
    git status -s
    echo ""
    read -p "Commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "💾 Committing changes..."
        git add backend/src/lib/email.ts
        git commit -m "fix: SMTP error handling - return false instead of throwing errors

- Changed sendCustomerInvitation() to return false on error instead of throwing
- Changed sendTenantInvitation() to return false on error instead of throwing
- Added better logging for SMTP configuration issues
- Added credential check in getTransporter()
- Prevents 500 errors when email sending fails
- Enables graceful degradation when SMTP is not configured"
        echo -e "${GREEN}✅ Changes committed${NC}"
    fi
fi

# Step 3: Push to remote
echo ""
echo "📋 Step 3: Pushing to remote..."
read -p "Push to origin/$BRANCH? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing to origin/$BRANCH..."
    git push origin $BRANCH
    echo -e "${GREEN}✅ Pushed to remote${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping push. Remember to push manually!${NC}"
fi

# Step 4: Production deployment instructions
echo ""
echo "📋 Step 4: Production Deployment"
echo "================================"
echo ""
echo -e "${YELLOW}Now, SSH into your production server and run:${NC}"
echo ""
echo "  cd /path/to/your/app"
echo "  git pull origin main"
echo "  pm2 restart backend"
echo ""
echo -e "${YELLOW}OR if using systemd:${NC}"
echo ""
echo "  cd /path/to/your/app"
echo "  git pull origin main"
echo "  sudo systemctl restart backend"
echo ""

# Step 5: Verify SMTP configuration
echo "📋 Step 5: Verify SMTP Configuration"
echo "====================================="
echo ""
echo -e "${YELLOW}Make sure your production .env has:${NC}"
echo ""
echo "  SMTP_HOST=mail.privateemail.com"
echo "  SMTP_PORT=465"
echo "  SMTP_SECURE=true"
echo "  SMTP_USER=info@contrezz.com"
echo "  SMTP_PASS=Korede@198800"
echo "  SMTP_FROM=info@contrezz.com"
echo "  FRONTEND_URL=https://contrezz.com"
echo ""

# Step 6: Testing
echo "📋 Step 6: Testing"
echo "=================="
echo ""
echo -e "${YELLOW}After deployment, test:${NC}"
echo ""
echo "  1. Create a customer WITHOUT 'Send Invitation' checked"
echo "     Expected: ✅ Customer created successfully"
echo ""
echo "  2. Create a customer WITH 'Send Invitation' checked"
echo "     Expected: ✅ Customer created successfully"
echo "     Expected: ✅ Email sent (if SMTP configured)"
echo "     Expected: ⚠️  Email not sent but customer created (if SMTP not configured)"
echo ""
echo "  3. Check backend logs:"
echo "     pm2 logs backend --lines 50"
echo ""
echo "     Look for:"
echo "     - '📧 Initializing email transporter' - Shows SMTP config"
echo "     - '✅ Customer invitation email sent successfully!' - Email sent"
echo "     - '❌ Failed to send customer invitation email' - Email failed"
echo "     - '❌ SMTP credentials not configured!' - Need to set env vars"
echo ""

# Step 7: Monitoring
echo "📋 Step 7: Monitoring"
echo "===================="
echo ""
echo -e "${YELLOW}Monitor for email failures:${NC}"
echo ""
echo "  # Check recent email attempts"
echo "  pm2 logs backend | grep 'invitation email'"
echo ""
echo "  # Check SMTP configuration"
echo "  pm2 logs backend | grep 'Initializing email transporter'"
echo ""

echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo "📚 For more details, see:"
echo "  - PRODUCTION_SMTP_FIX_SUMMARY.md"
echo "  - PRODUCTION_SMTP_INVESTIGATION.md"
echo ""


