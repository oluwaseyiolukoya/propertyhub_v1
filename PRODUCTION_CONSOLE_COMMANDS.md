# Production Console Commands - Quick Reference

## 🎯 Correct Commands for DigitalOcean Console

### Current Working Directory
When you open the DigitalOcean console, you're in: `/workspace`

The backend code is at: `/workspace/backend/`

---

## ✅ Correct Command to Run the Fix Script

```bash
node /workspace/backend/scripts/fix-production-plan-categories.js
```

**OR** (change directory first):

```bash
cd /workspace/backend
node scripts/fix-production-plan-categories.js
```

---

## 🔍 Useful Commands

### Check Current Directory
```bash
pwd
```

### List Files
```bash
ls -la
```

### Check Backend Directory
```bash
ls -la /workspace/backend/scripts/
```

### Check if Script Exists
```bash
ls -la /workspace/backend/scripts/fix-production-plan-categories.js
```

---

## 📋 Full Step-by-Step

1. **Open Console:**
   - Go to https://cloud.digitalocean.com/apps
   - Click your app
   - Click "Console" tab

2. **Check you're in the right place:**
   ```bash
   pwd
   # Should show: /workspace
   ```

3. **Run the fix script:**
   ```bash
   node /workspace/backend/scripts/fix-production-plan-categories.js
   ```

4. **Watch the output:**
   - You'll see plans being categorized
   - Wait for "✅ Plan categories fixed successfully!"

---

## 🆘 If Script Not Found

### Check if deployment completed:
```bash
ls -la /workspace/backend/scripts/
```

**If you don't see `fix-production-plan-categories.js`:**
- Deployment might not be complete yet
- Wait a few more minutes
- Check deployment status at: https://cloud.digitalocean.com/apps

### Force a new deployment:
```bash
# Trigger rebuild (if needed)
# Go to DigitalOcean dashboard → Your App → Settings → Force Rebuild
```

---

## ✅ Expected Output

```
🔧 Fixing Plan Categories in Production Database
================================================

📋 Step 1: Fetching all plans...
✅ Found 8 plans

📊 Current Plan Categories:
─────────────────────────────────────────────────────────
  Developer Starter:
    Category: NULL
    Property Limit: 5
    Project Limit: NULL

  Developer Pro:
    Category: NULL
    Property Limit: 5
    Project Limit: NULL

🔍 Plans that need fixing:
─────────────────────────────────────────────────────────
  ❌ Developer Starter - Category: NULL → Should be: development
  ❌ Developer Pro - Category: NULL → Should be: development

🔧 Step 2: Updating plan categories...

  Updating: Developer Starter...
    ✅ Updated to category='development', projectLimit=5

  Updating: Developer Pro...
    ✅ Updated to category='development', projectLimit=10

✅ All development plans updated!

📈 Summary:
  🏗️  Development Plans: 3
  🏢 Property Management Plans: 5
  ❓ Uncategorized Plans: 0

✅ Plan categories fixed successfully!
```

---

## 🎉 After Running Successfully

1. **Test customer creation:**
   - Go to https://contrezz.com/admin
   - Click "Add Customer"
   - Select "Property Developer"
   - Check plan dropdown → Should see developer plans! ✅

2. **No need to restart:**
   - Changes are in the database
   - Effective immediately
   - No backend restart needed

---

## 📞 Quick Reference

**Correct command:**
```bash
node /workspace/backend/scripts/fix-production-plan-categories.js
```

**Check deployment:**
https://cloud.digitalocean.com/apps

**Test after:**
https://contrezz.com/admin → Add Customer

