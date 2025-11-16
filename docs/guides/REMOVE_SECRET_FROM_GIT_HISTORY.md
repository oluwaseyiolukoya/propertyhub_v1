# Complete Guide: Remove Secret from Git History & Use .env

## Overview

We need to:
1. Remove the hardcoded password from git history
2. Store it securely in `.env` file
3. Push clean code to GitHub

## Step 1: Create .env File with Your Secrets

### Create Root .env File

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Create .env file
cat > .env << 'EOF'
# Production Database URL (replace YOUR_ACTUAL_PASSWORD with real password)
PROD_DB_URL="postgresql://contrezz_user:YOUR_ACTUAL_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require"
EOF
```

**⚠️ Important:** Replace `YOUR_ACTUAL_PASSWORD` with your actual database password!

### Verify .env is Ignored

```bash
# Check if .env is in .gitignore
grep "^\.env" .gitignore

# If not found, add it
echo ".env" >> .gitignore
```

## Step 2: Remove Secret from Git History

We'll use `git filter-branch` to rewrite history and remove the secret.

### Option A: Using git filter-branch (Recommended)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Backup your current branch
git branch backup-before-cleanup

# Remove the secret from the specific file in history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch SYNC_PRODUCTION_ALTERNATIVE.md || true" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Option B: Using BFG Repo-Cleaner (Faster, Easier)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Install BFG (if not installed)
brew install bfg

# Create a passwords.txt file with the secret to remove
echo "[YOUR_ACTUAL_PASSWORD_HERE]" > passwords.txt

# Run BFG to remove the password
bfg --replace-text passwords.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Remove the passwords file
rm passwords.txt
```

## Step 3: Re-add the File with Placeholders

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Stage the cleaned file
git add SYNC_PRODUCTION_ALTERNATIVE.md

# Commit
git commit -m "docs: remove hardcoded secrets, use .env instead"
```

## Step 4: Force Push to GitHub

```bash
# Force push to overwrite remote history
git push origin main --force

# If you have other branches, clean them too
git push origin --force --all
```

## Step 5: Verify Secret is Gone

```bash
# Search git history for the password
git log -p -S "[YOUR_ACTUAL_PASSWORD_HERE]"

# Should return nothing if successful
```

## Step 6: Update Documentation to Use .env

The documentation is already updated to use `.env` files. Verify:

```bash
# Check that SYNC_PRODUCTION_ALTERNATIVE.md uses .env
grep -A 5 "PROD_DB_URL" SYNC_PRODUCTION_ALTERNATIVE.md
```

Should show:
```bash
PROD_DB_URL="postgresql://contrezz_user:YOUR_PASSWORD@..."
```

## Step 7: Test Your Setup

```bash
# Load .env file
source .env

# Verify variable is loaded
echo $PROD_DB_URL

# Should show your database URL with actual password
```

## Complete Script (All-in-One)

Here's a complete script to do everything:

```bash
#!/bin/bash

cd /Users/oluwaseyio/test_ui_figma_and_cursor

echo "Step 1: Creating backup branch..."
git branch backup-before-cleanup

echo "Step 2: Removing secret from git history..."
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch SYNC_PRODUCTION_ALTERNATIVE.md || true" \
  --prune-empty --tag-name-filter cat -- 18c22a87bd9e89e777b90ecc5283d75be7ced2c8..HEAD

echo "Step 3: Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "Step 4: Re-adding file with placeholders..."
git add SYNC_PRODUCTION_ALTERNATIVE.md
git commit -m "docs: remove hardcoded secrets, use .env instead"

echo "Step 5: Ready to force push!"
echo "Run: git push origin main --force"
```

## Alternative: Simpler Approach (Recommended for You)

Since the secret is only in one old commit, we can use interactive rebase:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Start interactive rebase from before the problematic commit
git rebase -i c122a99

# In the editor that opens:
# 1. Find the line with commit 18c22a8
# 2. Change "pick" to "edit"
# 3. Save and close

# Now you're at that commit
# Edit the file to remove the password
nano SYNC_PRODUCTION_ALTERNATIVE.md
# (Replace password with YOUR_PASSWORD)

# Stage the changes
git add SYNC_PRODUCTION_ALTERNATIVE.md

# Amend the commit
git commit --amend --no-edit

# Continue the rebase
git rebase --continue

# Force push
git push origin main --force
```

## What Each Method Does

### Method 1: filter-branch
- Removes the file from history
- Re-adds it clean
- Most thorough

### Method 2: BFG Repo-Cleaner
- Replaces the password everywhere
- Fastest method
- Requires BFG installation

### Method 3: Interactive Rebase
- Edits the specific commit
- Most control
- Easiest to understand

## After Cleanup Checklist

- [ ] Secret removed from git history
- [ ] `.env` file created with actual password
- [ ] `.env` is in `.gitignore`
- [ ] Documentation uses `.env` placeholders
- [ ] Forced pushed to GitHub
- [ ] Verified secret is gone: `git log -p -S "[password_string]"`
- [ ] Team members notified to pull latest changes

## Security Best Practices Going Forward

1. **Always use .env files** for secrets
2. **Never commit .env files** to git
3. **Use .env.example** for templates
4. **Rotate passwords** if accidentally committed
5. **Use git hooks** to prevent committing secrets

## Create a Git Hook to Prevent Future Secrets

```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Check for potential secrets
if git diff --cached | grep -E "(password|secret|api_key|token).*=.*['\"].*['\"]"; then
    echo "⚠️  WARNING: Potential secret detected in commit!"
    echo "Please use environment variables instead."
    exit 1
fi
EOF

# Make it executable
chmod +x .git/hooks/pre-commit
```

## Need Help?

If you encounter issues:

1. **Backup failed?** 
   ```bash
   git branch -D backup-before-cleanup
   git branch backup-before-cleanup
   ```

2. **Rebase conflicts?**
   ```bash
   git rebase --abort
   # Start over
   ```

3. **Want to start fresh?**
   ```bash
   git reset --hard backup-before-cleanup
   # Try a different method
   ```

## Summary

✅ **Before:** Password hardcoded in git history  
✅ **After:** Password in `.env`, placeholders in git  
✅ **Result:** Clean git history, secure secrets  

Choose the method that works best for you. I recommend **Method 3 (Interactive Rebase)** as it's the most straightforward!

