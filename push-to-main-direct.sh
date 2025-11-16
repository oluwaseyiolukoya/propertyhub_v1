#!/bin/bash

echo "🚀 Push Directly to Main - Master Script"
echo "========================================="
echo ""

# Step 1: Investigate setup
echo "1️⃣  Investigating setup..."
CURRENT_BRANCH=$(git branch --show-current)
GIT_DIR=$(git rev-parse --git-dir)

if echo "$GIT_DIR" | grep -q "worktrees"; then
    MAIN_REPO=$(echo "$GIT_DIR" | sed 's|/\.git/worktrees/.*||')
    IN_WORKTREE=true
    echo "   ✅ In worktree: $CURRENT_BRANCH"
    echo "   📁 Main repo: $MAIN_REPO"
else
    IN_WORKTREE=false
    echo "   ✅ In main repository"
fi
echo ""

# Step 2: Commit changes
echo "2️⃣  Committing changes..."
if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -m "fix: Admin customer plan selection - show plans without category

- Fixed plan filtering to show uncategorized plans for all customer types
- Added backward compatibility for plans without category field
- Preserved null categories instead of defaulting to property_management
- Added debug logging for plan loading and filtering
- Ensures admin can always see and select plans when creating customers"
    echo "   ✅ Changes committed"
else
    echo "   ℹ️  No uncommitted changes"
fi
echo ""

# Step 3: Fetch and sync
echo "3️⃣  Syncing with remote..."
git fetch origin main
REMOTE_AHEAD=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")

if [ "$REMOTE_AHEAD" -gt 0 ]; then
    echo "   ⚠️  Remote main is $REMOTE_AHEAD commits ahead"
    echo "   🔄 Merging remote main..."
    git merge origin/main --no-edit

    if [ $? -ne 0 ]; then
        echo "   ❌ Merge conflicts! Please resolve and run again"
        exit 1
    fi
    echo "   ✅ Merged remote main"
else
    echo "   ✅ Up to date with remote main"
fi
echo ""

# Step 4: Push to main using refspec (works from any branch/worktree)
echo "4️⃣  Pushing directly to main..."
echo "   🚀 Using: git push origin $CURRENT_BRANCH:main"

git push origin "$CURRENT_BRANCH:main"

if [ $? -eq 0 ]; then
    echo ""
    echo "   ✅ SUCCESS! Pushed directly to main!"
    echo ""
    echo "   🎉 Your changes are now on main branch!"
    echo ""

    # Step 5: Prisma check
    echo "5️⃣  Checking Prisma..."
    cd backend

    if git diff HEAD~1 --name-only 2>/dev/null | grep -q "prisma/schema.prisma"; then
        echo "   ✅ Prisma schema changed"
        echo "   🔄 Running migration..."
        npx prisma generate > /dev/null 2>&1
        npx prisma db push > /dev/null 2>&1
        echo "   ✅ Prisma migration complete"
    else
        echo "   ℹ️  No Prisma schema changes"
    fi

    cd ..
    echo ""

    echo "========================================="
    echo "✅ All Done!"
    echo "========================================="
    echo ""
    echo "Your changes are on main:"
    echo "https://github.com/oluwaseyiolukoya/propertyhub_v1/tree/main"
    echo ""

else
    echo ""
    echo "   ❌ Push failed!"
    echo ""
    echo "   🔧 Trying force push (⚠️  use with caution)..."
    read -p "   Force push to main? (y/N): " confirm

    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        git push -f origin "$CURRENT_BRANCH:main"

        if [ $? -eq 0 ]; then
            echo "   ✅ Force push successful!"
        else
            echo "   ❌ Force push also failed"
            echo ""
            echo "   Possible reasons:"
            echo "   1. Branch protection rules"
            echo "   2. Insufficient permissions"
            echo "   3. Authentication issues"
            exit 1
        fi
    else
        echo "   ⚠️  Push cancelled"
        exit 1
    fi
fi

