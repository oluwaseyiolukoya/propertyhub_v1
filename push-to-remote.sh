#!/bin/bash

echo "🔍 Checking Git Status..."
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Check remote
echo "🌐 Remote repositories:"
git remote -v
echo ""

# Check if there are unpushed commits
echo "📊 Commit status:"
git status
echo ""

# Get the remote branch name
REMOTE_BRANCH=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)

if [ -z "$REMOTE_BRANCH" ]; then
    echo "⚠️  No upstream branch set for '$CURRENT_BRANCH'"
    echo ""
    echo "Setting upstream and pushing..."
    git push -u origin "$CURRENT_BRANCH"
else
    echo "✅ Upstream branch: $REMOTE_BRANCH"
    echo ""
    echo "🚀 Pushing to remote..."
    git push origin "$CURRENT_BRANCH"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to remote!"
    echo ""
    echo "🔗 Your changes are on branch: $CURRENT_BRANCH"
    echo ""
    echo "To view on GitHub/GitLab:"
    REMOTE_URL=$(git config --get remote.origin.url)
    echo "   $REMOTE_URL"
    echo ""
    echo "💡 If you want to merge to main, create a Pull Request"
else
    echo ""
    echo "❌ Push failed!"
    echo ""
    echo "Possible reasons:"
    echo "  1. Remote branch doesn't exist yet"
    echo "  2. Need to pull first: git pull origin $CURRENT_BRANCH"
    echo "  3. Authentication issues"
    echo ""
fi

