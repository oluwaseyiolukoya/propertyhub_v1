#!/bin/bash

echo "🔍 Investigating Git Worktree Setup"
echo "===================================="
echo ""

# 1. Check if we're in a worktree
echo "1️⃣  Worktree Detection:"
if git rev-parse --git-dir | grep -q "worktrees"; then
    echo "   ✅ Confirmed: You're in a Git worktree"
    GIT_DIR=$(git rev-parse --git-dir)
    MAIN_REPO=$(echo "$GIT_DIR" | sed 's|/\.git/worktrees/.*||')
    echo "   📁 Worktree path: $(pwd)"
    echo "   📁 Main repo path: $MAIN_REPO"
else
    echo "   ℹ️  Not in a worktree"
    MAIN_REPO=$(pwd)
fi
echo ""

# 2. List all worktrees
echo "2️⃣  All Worktrees:"
git worktree list 2>/dev/null || echo "   ⚠️  'git worktree list' not available (older git version)"
echo ""

# 3. Check what branch is checked out in main repo
echo "3️⃣  Main Repository Status:"
if [ -d "$MAIN_REPO/.git" ]; then
    cd "$MAIN_REPO"
    MAIN_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    echo "   📍 Main repo branch: $MAIN_BRANCH"
    echo "   📁 Main repo path: $MAIN_REPO"

    # Check if main is checked out
    if [ "$MAIN_BRANCH" = "main" ]; then
        echo "   ⚠️  'main' branch IS checked out in main repo"
        echo "   ❌ This prevents checking out 'main' in worktree"
    else
        echo "   ✅ 'main' branch is NOT checked out in main repo"
        echo "   ✅ You CAN checkout 'main' in worktree"
    fi
    cd - > /dev/null
else
    echo "   ⚠️  Cannot access main repo"
fi
echo ""

# 4. Current branch
echo "4️⃣  Current Worktree Branch:"
CURRENT_BRANCH=$(git branch --show-current)
echo "   📍 Branch: $CURRENT_BRANCH"
echo ""

# 5. Check remote main status
echo "5️⃣  Remote Main Branch Status:"
git fetch origin main --dry-run 2>&1 | head -3
LOCAL_MAIN=$(git rev-parse refs/heads/main 2>/dev/null || echo "none")
REMOTE_MAIN=$(git rev-parse refs/remotes/origin/main 2>/dev/null || echo "none")
echo "   📍 Local main: ${LOCAL_MAIN:0:8}..."
echo "   📍 Remote main: ${REMOTE_MAIN:0:8}..."
echo ""

# 6. Check if we can push to main
echo "6️⃣  Push Permissions Check:"
if git ls-remote --heads origin main | grep -q "main"; then
    echo "   ✅ Remote 'main' branch exists"

    # Check if we're ahead/behind
    git fetch origin main 2>/dev/null
    LOCAL_AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
    REMOTE_AHEAD=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")

    echo "   📤 Local commits ahead: $LOCAL_AHEAD"
    echo "   📥 Remote commits ahead: $REMOTE_AHEAD"

    if [ "$REMOTE_AHEAD" -gt 0 ]; then
        echo "   ⚠️  Remote main is ahead - need to sync first"
    fi
else
    echo "   ⚠️  Remote 'main' branch doesn't exist"
fi
echo ""

# 7. Git config check
echo "7️⃣  Git Configuration:"
echo "   User: $(git config user.name)"
echo "   Email: $(git config user.email)"
echo "   Remote URL: $(git config --get remote.origin.url)"
echo ""

# 8. Recommendations
echo "===================================="
echo "💡 Solutions to Push Directly to Main"
echo "===================================="
echo ""

if [ "$MAIN_BRANCH" = "main" ]; then
    echo "🔧 SOLUTION 1: Switch Main Repo to Different Branch"
    echo "   cd $MAIN_REPO"
    echo "   git checkout -b temp-branch  # or any other branch"
    echo "   cd $(pwd)"
    echo "   git checkout main"
    echo "   git pull origin main"
    echo "   git merge $CURRENT_BRANCH"
    echo "   git push origin main"
    echo ""

    echo "🔧 SOLUTION 2: Push from Worktree Branch to Main (Recommended)"
    echo "   # Stay in worktree, push your branch"
    echo "   git push origin $CURRENT_BRANCH"
    echo "   # Then merge via GitHub PR or:"
    echo "   git push origin $CURRENT_BRANCH:main"
    echo ""

    echo "🔧 SOLUTION 3: Remove Worktree, Work in Main Repo"
    echo "   cd $MAIN_REPO"
    echo "   git worktree remove $(pwd)"
    echo "   git checkout main"
    echo "   git merge $CURRENT_BRANCH"
    echo "   git push origin main"
    echo ""
else
    echo "✅ SOLUTION: You can checkout main directly!"
    echo "   git checkout main"
    echo "   git pull origin main"
    echo "   git merge $CURRENT_BRANCH"
    echo "   git push origin main"
    echo ""
fi

echo "===================================="

