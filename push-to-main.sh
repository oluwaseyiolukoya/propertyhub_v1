#!/bin/bash

echo "🚀 Push Directly to Main"
echo "========================"
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

# Step 2: Fetch latest
echo "2️⃣  Fetching latest from remote..."
git fetch origin main
git fetch origin "$CURRENT_BRANCH" 2>/dev/null || true
echo "   ✅ Fetched"
echo ""

# Step 3: Check if remote main is ahead
echo "3️⃣  Checking remote main status..."
REMOTE_AHEAD=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
LOCAL_AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")

echo "   📤 Your commits ahead of main: $LOCAL_AHEAD"
echo "   📥 Remote main commits ahead: $REMOTE_AHEAD"
echo ""

if [ "$REMOTE_AHEAD" -gt 0 ]; then
    echo "   ⚠️  Remote main has $REMOTE_AHEAD new commits"
    echo "   🔄 Merging remote main into your branch..."

    # Merge remote main into current branch
    git merge origin/main --no-edit

    if [ $? -ne 0 ]; then
        echo ""
        echo "   ❌ Merge failed - conflicts detected!"
        echo ""
        echo "   🔧 Manual steps required:"
        echo "   1. Resolve conflicts in the files shown above"
        echo "   2. Run: git add ."
        echo "   3. Run: git commit"
        echo "   4. Then run this script again"
        exit 1
    fi

    echo "   ✅ Merged remote main"
    echo ""
fi

# Step 4: Push current branch to remote (for backup)
echo "4️⃣  Pushing current branch to remote..."
if git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q "$CURRENT_BRANCH"; then
    git push origin "$CURRENT_BRANCH"
else
    git push -u origin "$CURRENT_BRANCH"
fi
echo "   ✅ Branch pushed"
echo ""

# Step 5: Push directly to main using refspec
echo "5️⃣  Pushing directly to main..."
echo "   🚀 Pushing $CURRENT_BRANCH -> origin/main"

# Use refspec to push current branch to main
git push origin "$CURRENT_BRANCH:main"

if [ $? -eq 0 ]; then
    echo ""
    echo "   ✅ Successfully pushed to main!"
    echo ""
    echo "   🎉 Your changes are now on main branch!"
    echo ""
    echo "   📋 Summary:"
    echo "   - ✅ Committed: All changes"
    echo "   - ✅ Synced: Merged remote main"
    echo "   - ✅ Pushed: Branch to remote"
    echo "   - ✅ Pushed: Directly to main"
    echo ""
else
    echo ""
    echo "   ❌ Push to main failed!"
    echo ""
    echo "   🔧 Possible reasons:"
    echo "   1. Protected branch (need admin permissions)"
    echo "   2. Force push required (if main was force-pushed)"
    echo ""
    echo "   💡 Try force push (⚠️  use with caution):"
    echo "   git push -f origin $CURRENT_BRANCH:main"
    echo ""
    exit 1
fi

# Step 6: Update local main reference
echo "6️⃣  Updating local main reference..."
git fetch origin main
echo "   ✅ Updated"
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

echo "========================"
echo "✅ All Done!"
echo "========================"
echo ""
echo "Your changes are now on main branch!"
echo "Check: https://github.com/oluwaseyiolukoya/propertyhub_v1/tree/main"
echo ""

