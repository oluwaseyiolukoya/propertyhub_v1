#!/bin/bash

echo "🚀 Push to Main & Migrate Script"
echo "=================================="
echo ""

# Step 1: Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Step 2: Check for Prisma schema changes
echo "🔍 Checking for Prisma schema changes..."
cd backend

if git diff --name-only | grep -q "prisma/schema.prisma"; then
    echo "✅ Prisma schema has UNCOMMITTED changes"
    PRISMA_CHANGED=true
elif git diff --cached --name-only | grep -q "prisma/schema.prisma"; then
    echo "✅ Prisma schema has STAGED changes"
    PRISMA_CHANGED=true
else
    echo "ℹ️  No uncommitted Prisma schema changes detected"
    PRISMA_CHANGED=false
fi

cd ..
echo ""

# Step 3: Stage all changes
echo "➕ Staging all changes..."
git add -A
echo "✅ Changes staged"
echo ""

# Step 4: Show what will be committed
echo "📋 Files to be committed:"
git diff --cached --name-status | head -20
TOTAL_FILES=$(git diff --cached --name-status | wc -l)
if [ $TOTAL_FILES -gt 20 ]; then
    echo "... and $((TOTAL_FILES - 20)) more files"
fi
echo ""

# Step 5: Commit changes
echo "💾 Committing changes..."
git commit -m "fix: Admin customer plan selection - show plans without category

- Fixed plan filtering to show uncategorized plans for all customer types
- Added backward compatibility for plans without category field
- Preserved null categories instead of defaulting to property_management
- Added debug logging for plan loading and filtering
- Ensures admin can always see and select plans when creating customers

Changes:
- src/components/AddCustomerPage.tsx: Updated plan filtering logic
- Added ADMIN_CUSTOMER_PLAN_SELECTION_FIX.md documentation

This fixes the issue where no plans were showing in the subscription plan
dropdown when adding new customers from the admin dashboard."

if [ $? -ne 0 ]; then
    echo "ℹ️  No changes to commit (already committed or no changes)"
else
    echo "✅ Changes committed"
fi
echo ""

# Step 6: Merge to main if on a different branch
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🔀 Merging to main..."
    echo "   Current branch: $CURRENT_BRANCH"
    echo "   Target branch: main"
    echo ""

    # Checkout main
    git checkout main

    if [ $? -ne 0 ]; then
        echo "❌ Failed to checkout main branch"
        exit 1
    fi

    # Pull latest
    echo "⬇️  Pulling latest from main..."
    git pull origin main

    # Merge current branch
    echo "🔀 Merging $CURRENT_BRANCH into main..."
    git merge "$CURRENT_BRANCH" --no-edit

    if [ $? -ne 0 ]; then
        echo "❌ Merge failed! Please resolve conflicts manually"
        exit 1
    fi

    echo "✅ Merged to main"
    echo ""
fi

# Step 7: Push to remote
echo "🚀 Pushing to remote (main)..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to remote!"
else
    echo "❌ Push failed!"
    echo ""
    echo "Possible solutions:"
    echo "  1. git pull origin main --rebase"
    echo "  2. git push -f origin main (use with caution!)"
    exit 1
fi
echo ""

# Step 8: Run Prisma migration if schema changed
if [ "$PRISMA_CHANGED" = true ]; then
    echo "🔄 Prisma schema changed - Running migration..."
    echo ""

    cd backend

    # Generate Prisma Client
    echo "🔧 Generating Prisma Client..."
    npx prisma generate

    if [ $? -ne 0 ]; then
        echo "❌ Prisma generate failed!"
        cd ..
        exit 1
    fi

    echo "✅ Prisma Client generated"
    echo ""

    # Push schema changes to database
    echo "📤 Pushing schema changes to database..."
    npx prisma db push

    if [ $? -ne 0 ]; then
        echo "❌ Prisma db push failed!"
        echo ""
        echo "Try running manually:"
        echo "  cd backend"
        echo "  npx prisma db push --accept-data-loss"
        cd ..
        exit 1
    fi

    echo "✅ Database schema updated"
    echo ""

    # Show migration status
    echo "📊 Migration status:"
    npx prisma migrate status

    cd ..
    echo ""
else
    echo "ℹ️  No Prisma schema changes - Skipping migration"
    echo ""
fi

# Step 9: Summary
echo "=================================="
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "Summary:"
echo "  ✅ Changes committed"
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "  ✅ Merged $CURRENT_BRANCH → main"
fi
echo "  ✅ Pushed to remote (main)"
if [ "$PRISMA_CHANGED" = true ]; then
    echo "  ✅ Prisma migration applied"
else
    echo "  ℹ️  No Prisma changes"
fi
echo ""
echo "🎉 All done!"

