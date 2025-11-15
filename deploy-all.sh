#!/bin/bash

# Master Deployment Script
# This script will run Prisma migrations and push to git

echo "🚀 Starting Full Deployment Process"
echo "===================================="
echo ""

# Step 1: Run Prisma Migrations
echo "STEP 1: Prisma Migration"
echo "------------------------"
bash /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/migrate-prisma.sh

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Prisma migration had issues. Continue with git push? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

echo ""
echo ""

# Step 2: Git Push
echo "STEP 2: Git Commit & Push"
echo "-------------------------"
bash /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/git-push.sh

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Git push failed"
    exit 1
fi

echo ""
echo "===================================="
echo "✅ Full Deployment Complete!"
echo "===================================="
echo ""
echo "Summary:"
echo "  ✅ Prisma migrations applied"
echo "  ✅ Changes committed to git"
echo "  ✅ Changes pushed to remote"
echo ""

