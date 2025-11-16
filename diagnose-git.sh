#!/bin/bash

echo "🔍 Git Push Issue Diagnostic"
echo "=============================="
echo ""

# 1. Check if we're in a worktree
echo "1️⃣  Checking Git Worktree Status..."
if git rev-parse --git-dir | grep -q "worktrees"; then
    echo "   ✅ You're in a Git worktree"
    WORKTREE_PATH=$(git rev-parse --git-dir | sed 's|\.git.*|.git|')
    echo "   📁 Worktree path: $(pwd)"
    echo "   📁 Main repo: $WORKTREE_PATH"
else
    echo "   ℹ️  Not in a worktree (normal repo)"
fi
echo ""

# 2. Current branch
echo "2️⃣  Current Branch:"
CURRENT_BRANCH=$(git branch --show-current)
echo "   📍 Branch: $CURRENT_BRANCH"
echo ""

# 3. Check remote tracking
echo "3️⃣  Remote Tracking:"
git branch -vv | grep "$CURRENT_BRANCH"
echo ""

# 4. Check remote status
echo "4️⃣  Remote Status:"
git fetch origin --dry-run 2>&1 | head -5
echo ""

# 5. Check divergence
echo "5️⃣  Branch Divergence Check:"
LOCAL_COMMITS=$(git rev-list --count origin/$CURRENT_BRANCH..HEAD 2>/dev/null || echo "0")
REMOTE_COMMITS=$(git rev-list --count HEAD..origin/$CURRENT_BRANCH 2>/dev/null || echo "0")

if [ "$LOCAL_COMMITS" -gt 0 ] && [ "$REMOTE_COMMITS" -gt 0 ]; then
    echo "   ⚠️  DIVERGENT BRANCHES DETECTED!"
    echo "   📤 Local commits ahead: $LOCAL_COMMITS"
    echo "   📥 Remote commits ahead: $REMOTE_COMMITS"
    echo ""
    echo "   This means:"
    echo "   - You have commits not on remote"
    echo "   - Remote has commits you don't have"
    echo "   - Need to sync before pushing"
elif [ "$LOCAL_COMMITS" -gt 0 ]; then
    echo "   ✅ Local is ahead by $LOCAL_COMMITS commits"
    echo "   ✅ Safe to push"
elif [ "$REMOTE_COMMITS" -gt 0 ]; then
    echo "   ⚠️  Remote is ahead by $REMOTE_COMMITS commits"
    echo "   ⚠️  Need to pull first"
else
    echo "   ✅ Branches are in sync"
fi
echo ""

# 6. Check if branch exists on remote
echo "6️⃣  Remote Branch Check:"
if git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q "$CURRENT_BRANCH"; then
    echo "   ✅ Branch '$CURRENT_BRANCH' exists on remote"
else
    echo "   ⚠️  Branch '$CURRENT_BRANCH' does NOT exist on remote"
    echo "   💡 This is a new branch - can push with: git push -u origin $CURRENT_BRANCH"
fi
echo ""

# 7. Show recent commits
echo "7️⃣  Recent Commits:"
git log --oneline -5
echo ""

# 8. Show uncommitted changes
echo "8️⃣  Uncommitted Changes:"
if [ -n "$(git status --porcelain)" ]; then
    echo "   ⚠️  You have uncommitted changes:"
    git status --short | head -10
else
    echo "   ✅ No uncommitted changes"
fi
echo ""

# 9. Recommendations
echo "=============================="
echo "💡 Recommendations:"
echo "=============================="

if [ "$REMOTE_COMMITS" -gt 0 ]; then
    echo ""
    echo "🔧 FIX: Pull with rebase first"
    echo "   git pull origin $CURRENT_BRANCH --rebase"
    echo ""
fi

if ! git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q "$CURRENT_BRANCH"; then
    echo ""
    echo "🔧 FIX: Push new branch"
    echo "   git push -u origin $CURRENT_BRANCH"
    echo ""
fi

if [ "$LOCAL_COMMITS" -gt 0 ] && [ "$REMOTE_COMMITS" -eq 0 ]; then
    echo ""
    echo "🔧 FIX: Push your commits"
    echo "   git push origin $CURRENT_BRANCH"
    echo ""
fi

if [ "$LOCAL_COMMITS" -gt 0 ] && [ "$REMOTE_COMMITS" -gt 0 ]; then
    echo ""
    echo "🔧 FIX: Sync divergent branches"
    echo "   1. git pull origin $CURRENT_BRANCH --rebase"
    echo "   2. Resolve any conflicts"
    echo "   3. git push origin $CURRENT_BRANCH"
    echo ""
fi

echo "=============================="

