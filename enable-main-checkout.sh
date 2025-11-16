#!/bin/bash

echo "🔧 Enabling Main Checkout in Worktree"
echo "======================================"
echo ""

# Detect main repo path
GIT_DIR=$(git rev-parse --git-dir)
if echo "$GIT_DIR" | grep -q "worktrees"; then
    MAIN_REPO=$(echo "$GIT_DIR" | sed 's|/\.git/worktrees/.*||')
    echo "📍 Main repo detected: $MAIN_REPO"
else
    echo "❌ Not in a worktree - this script is for worktrees only"
    exit 1
fi

# Check current branch in main repo
cd "$MAIN_REPO"
MAIN_REPO_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "📍 Main repo current branch: $MAIN_REPO_BRANCH"
echo ""

if [ "$MAIN_REPO_BRANCH" = "main" ]; then
    echo "⚠️  Main repo has 'main' checked out"
    echo "   This prevents checking out 'main' in worktree"
    echo ""

    echo "🔧 Solution: Switch main repo to a different branch"
    echo ""

    # Check if there are uncommitted changes in main repo
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  Main repo has uncommitted changes!"
        echo ""
        echo "Options:"
        echo "  1. Stash changes: git stash"
        echo "  2. Commit changes: git add . && git commit -m '...'"
        echo "  3. Discard changes: git reset --hard"
        echo ""
        read -p "What would you like to do? (stash/commit/discard/skip): " action

        case $action in
            stash)
                git stash
                echo "✅ Changes stashed"
                ;;
            commit)
                git add -A
                git commit -m "chore: temporary commit to switch branch"
                echo "✅ Changes committed"
                ;;
            discard)
                git reset --hard
                echo "✅ Changes discarded"
                ;;
            skip)
                echo "⚠️  Skipping - you'll need to handle this manually"
                exit 1
                ;;
            *)
                echo "❌ Invalid option"
                exit 1
                ;;
        esac
        echo ""
    fi

    # Switch main repo to a temporary branch
    echo "🔄 Switching main repo to temporary branch..."

    # Check if temp branch exists
    if git rev-parse --verify temp-main-switch 2>/dev/null; then
        git checkout temp-main-switch
    else
        git checkout -b temp-main-switch
    fi

    if [ $? -eq 0 ]; then
        echo "✅ Main repo switched to 'temp-main-switch'"
        echo ""

        # Go back to worktree
        cd - > /dev/null

        echo "✅ Now you can checkout 'main' in this worktree!"
        echo ""
        echo "Next steps:"
        echo "  1. git checkout main"
        echo "  2. git pull origin main"
        echo "  3. git merge $CURRENT_BRANCH"
        echo "  4. git push origin main"
        echo ""
    else
        echo "❌ Failed to switch branch in main repo"
        exit 1
    fi
else
    echo "✅ Main repo is NOT on 'main' branch"
    echo "✅ You can checkout 'main' in this worktree!"
    echo ""
    echo "Run:"
    echo "  git checkout main"
    echo ""
fi

