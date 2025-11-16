#!/bin/bash

echo "🔧 Fixing Git Push Issues"
echo "========================="
echo ""

CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Step 1: Commit any uncommitted changes
echo "1️⃣  Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
    echo "   ⚠️  Found uncommitted changes"
    echo "   ➕ Staging changes..."
    git add -A

    echo "   💾 Committing changes..."
    git commit -m "fix: Admin customer plan selection - show plans without category

- Fixed plan filtering to show uncategorized plans for all customer types
- Added backward compatibility for plans without category field
- Preserved null categories instead of defaulting to property_management
- Added debug logging for plan loading and filtering
- Ensures admin can always see and select plans when creating customers"

    if [ $? -eq 0 ]; then
        echo "   ✅ Changes committed"
    else
        echo "   ℹ️  No new changes to commit"
    fi
else
    echo "   ✅ No uncommitted changes"
fi
echo ""

# Step 2: Fetch latest from remote
echo "2️⃣  Fetching latest from remote..."
git fetch origin
echo "   ✅ Fetched"
echo ""

# Step 3: Check if branch exists on remote
echo "3️⃣  Checking if branch exists on remote..."
if git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q "$CURRENT_BRANCH"; then
    echo "   ✅ Branch exists on remote"
    BRANCH_EXISTS=true
else
    echo "   ⚠️  Branch does NOT exist on remote (new branch)"
    BRANCH_EXISTS=false
fi
echo ""

# Step 4: Check divergence
echo "4️⃣  Checking branch divergence..."
LOCAL_COMMITS=$(git rev-list --count origin/$CURRENT_BRANCH..HEAD 2>/dev/null || echo "0")
REMOTE_COMMITS=$(git rev-list --count HEAD..origin/$CURRENT_BRANCH 2>/dev/null || echo "0")

echo "   📤 Local commits ahead: $LOCAL_COMMITS"
echo "   📥 Remote commits ahead: $REMOTE_COMMITS"
echo ""

# Step 5: Handle divergence
if [ "$BRANCH_EXISTS" = true ] && [ "$REMOTE_COMMITS" -gt 0 ]; then
    echo "5️⃣  Syncing with remote (divergent branches)..."
    echo "   🔄 Pulling with rebase..."

    git pull origin "$CURRENT_BRANCH" --rebase

    if [ $? -ne 0 ]; then
        echo ""
        echo "   ❌ Rebase failed - conflicts detected!"
        echo ""
        echo "   🔧 Manual steps required:"
        echo "   1. Resolve conflicts in the files shown above"
        echo "   2. Run: git add ."
        echo "   3. Run: git rebase --continue"
        echo "   4. Then run this script again"
        exit 1
    fi

    echo "   ✅ Synced with remote"
    echo ""
elif [ "$BRANCH_EXISTS" = false ]; then
    echo "5️⃣  New branch - no sync needed"
    echo ""
fi

# Step 6: Push to remote
echo "6️⃣  Pushing to remote..."
if [ "$BRANCH_EXISTS" = false ]; then
    echo "   🚀 Pushing new branch with upstream..."
    git push -u origin "$CURRENT_BRANCH"
else
    echo "   🚀 Pushing to existing branch..."
    git push origin "$CURRENT_BRANCH"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "   ✅ Successfully pushed to remote!"
    echo ""
    echo "   🎉 Your changes are now on GitHub!"
    echo ""
    echo "   📋 Next steps:"
    echo "   1. Go to: https://github.com/oluwaseyiolukoya/propertyhub_v1"
    echo "   2. You'll see a banner: 'Compare & pull request'"
    echo "   3. Click it to create a PR from $CURRENT_BRANCH to main"
    echo "   4. Review and merge the PR"
else
    echo ""
    echo "   ❌ Push failed!"
    echo ""
    echo "   🔧 Try these solutions:"
    echo ""
    echo "   Option 1: Force push (⚠️  use with caution)"
    echo "   git push -f origin $CURRENT_BRANCH"
    echo ""
    echo "   Option 2: Check what's blocking"
    echo "   git log origin/$CURRENT_BRANCH..HEAD"
    echo "   git log HEAD..origin/$CURRENT_BRANCH"
    exit 1
fi
echo ""

# Step 7: Check Prisma
echo "7️⃣  Checking Prisma status..."
cd backend

if git diff HEAD~1 --name-only 2>/dev/null | grep -q "prisma/schema.prisma"; then
    echo "   ✅ Prisma schema changed"
    echo "   🔄 Running migration..."

    npx prisma generate
    echo ""

    npx prisma db push
    echo ""

    echo "   ✅ Prisma migration complete"
else
    echo "   ℹ️  No Prisma schema changes"
fi

cd ..
echo ""

echo "========================="
echo "✅ All Done!"
echo "========================="
echo ""
echo "Summary:"
echo "  ✅ Changes committed"
echo "  ✅ Synced with remote"
echo "  ✅ Pushed to GitHub"
if [ "$BRANCH_EXISTS" = false ]; then
    echo "  ✅ Created new branch on remote"
fi
echo ""

