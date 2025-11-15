# 🚀 Run Migration Now

## Current Directory Issue

If you're getting "No such file or directory", make sure you're in the **backend** directory:

```bash
# Check your current directory
pwd

# Should show: /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend

# If not, navigate there:
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend
```

## ✅ Correct Commands

### Option 1: Using relative path (from backend directory)
```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend
bash ./scripts/migrate-with-backup.sh
```

### Option 2: Using absolute path
```bash
bash /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend/scripts/migrate-with-backup.sh
```

### Option 3: Make executable first, then run
```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend
chmod +x scripts/migrate-with-backup.sh
./scripts/migrate-with-backup.sh
```

## 🔍 Verify Script Exists

```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend
ls -la scripts/migrate-with-backup.sh
```

Should show:
```
-rwxr-xr-x  1 user  staff  ... scripts/migrate-with-backup.sh
```

## 📝 Manual Steps (If Script Still Doesn't Work)

If the script still has issues, run these commands manually:

```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend

# Step 1: Backup
bash scripts/backup-database.sh

# Step 2: Fix migration
npx prisma migrate resolve --applied 20251108_add_onboarding_applications

# Step 3: Create migration
npx prisma migrate dev --name add_purchase_orders

# Step 4: Generate client
npx prisma generate

# Step 5: Verify
npx prisma migrate status
```

## 🎯 Quick Fix

**Copy and paste this entire block:**

```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend && \
chmod +x scripts/*.sh && \
bash scripts/migrate-with-backup.sh
```

This will:
1. Navigate to backend directory
2. Make all scripts executable
3. Run the migration script

