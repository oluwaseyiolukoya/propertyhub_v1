#!/bin/bash

echo "🚀 Push Worktree Branch to Remote"
echo "=================================="
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Stage and commit any remaining changes
echo "➕ Staging changes..."
git add -A

echo "💾 Committing changes..."
git commit -m "fix: Admin customer plan selection - show plans without category

- Fixed plan filtering to show uncategorized plans for all customer types
- Added backward compatibility for plans without category field
- Preserved null categories instead of defaulting to property_management
- Added debug logging for plan loading and filtering
- Ensures admin can always see and select plans when creating customers"

if [ $? -ne 0 ]; then
    echo "ℹ️  No new changes to commit"
fi
echo ""

# Pull latest from remote branch (with rebase to avoid divergent branches)
echo "⬇️  Pulling latest from remote..."
git pull origin "$CURRENT_BRANCH" --rebase

if [ $? -ne 0 ]; then
    echo "⚠️  Pull failed or conflicts detected"
    echo "Please resolve conflicts and run: git rebase --continue"
    exit 1
fi
echo ""

# Push current branch to remote
echo "🚀 Pushing $CURRENT_BRANCH to remote..."
git push origin "$CURRENT_BRANCH"

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to remote!"
    echo ""
    echo "🔗 Your changes are on branch: $CURRENT_BRANCH"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Go to GitHub: https://github.com/oluwaseyiolukoya/propertyhub_v1"
    echo "   2. Create a Pull Request from $CURRENT_BRANCH to main"
    echo "   3. Review and merge the PR"
else
    echo "❌ Push failed!"
    exit 1
fi
echo ""

# Check for Prisma changes
echo "🔍 Checking Prisma status..."
cd backend

if git diff HEAD~1 --name-only | grep -q "prisma/schema.prisma"; then
    echo "✅ Prisma schema changed in last commit"
    echo ""
    echo "🔄 Running Prisma migration..."

    npx prisma generate
    echo ""

    npx prisma db push
    echo ""

    echo "✅ Prisma migration complete"
else
    echo "ℹ️  No Prisma schema changes detected"
    echo "✅ Database is in sync"
fi

cd ..
echo ""

echo "=================================="
echo "✅ Done!"
echo "=================================="

