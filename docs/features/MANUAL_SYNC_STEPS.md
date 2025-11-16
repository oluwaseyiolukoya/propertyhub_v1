# Manual Sync - Step by Step Guide

## 🎯 Easiest Method: Create Backup in Production Console

Since direct connection isn't working, we'll create the backup IN production, then restore it locally.

---

## 📋 Step-by-Step Instructions

### **Step 1: Create Backup in Production**

1. Go to: https://cloud.digitalocean.com/apps
2. Click your app
3. Click the **"Console"** tab
4. Run these commands:

```bash
# Navigate to tmp directory
cd /tmp

# Create backup (this will take 1-2 minutes)
pg_dump "$DATABASE_URL" -f production_backup.sql

# Check the file was created
ls -lh production_backup.sql

# Count lines to verify it's complete
wc -l production_backup.sql
```

**Expected output:**
```
-rw-r--r-- 1 root root 2.5M Nov 16 17:30 production_backup.sql
15234 production_backup.sql
```

---

### **Step 2: Display Backup Content**

In the production console, run:

```bash
cat /tmp/production_backup.sql
```

This will display the entire backup. **Keep the console window open.**

---

### **Step 3: Copy Backup to Local Machine**

On your **local machine**, create a new file:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor
mkdir -p backups
nano backups/production_backup.sql
```

Then:
1. Go back to the **production console window**
2. **Select all the output** from the `cat` command (Cmd+A)
3. **Copy it** (Cmd+C)
4. Go back to your **local terminal** (in nano editor)
5. **Paste** (Cmd+V)
6. **Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

---

### **Step 4: Restore to Local Database**

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Drop and recreate local database
psql postgres -c "DROP DATABASE IF EXISTS contrezz_local;"
psql postgres -c "CREATE DATABASE contrezz_local;"

# Restore the backup
psql "postgresql://postgres:postgres@localhost:5432/contrezz_local" < backups/production_backup.sql
```

**Expected output:**
```
SET
SET
CREATE TABLE
CREATE TABLE
...
COPY 150
COPY 6
...
✅ Restore complete
```

---

### **Step 5: Generate Prisma Client**

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npx prisma generate
```

---

### **Step 6: Verify Data**

```bash
# Check what was imported
psql "postgresql://postgres:postgres@localhost:5432/contrezz_local" -c "
SELECT 
  'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'plans', COUNT(*) FROM plans
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'developer_projects', COUNT(*) FROM developer_projects;
"
```

**Expected output:**
```
    table_name     | count
-------------------+-------
 customers         |   150
 plans             |     6
 users             |   200
 properties        |    50
 developer_projects|    10
```

---

### **Step 7: Start Development**

```bash
# Terminal 1: Backend
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npm run dev

# Terminal 2: Frontend
cd /Users/oluwaseyio/test_ui_figma_and_cursor
npm run dev
```

Open: **http://localhost:5173**

---

## 🚀 Alternative: Smaller Chunks (If File is Too Large)

If the backup is too large to copy/paste, split it:

### In Production Console:

```bash
cd /tmp

# Create backup
pg_dump "$DATABASE_URL" -f production_backup.sql

# Split into smaller files (10MB each)
split -b 10m production_backup.sql backup_part_

# List the parts
ls -lh backup_part_*
```

Then display and copy each part:

```bash
cat backup_part_aa
cat backup_part_ab
cat backup_part_ac
# ... etc
```

### On Local Machine:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backups

# Create each part file
nano backup_part_aa  # Paste first part
nano backup_part_ab  # Paste second part
# ... etc

# Combine them
cat backup_part_* > production_backup.sql

# Restore
cd ..
psql "postgresql://postgres:postgres@localhost:5432/contrezz_local" < backups/production_backup.sql
```

---

## 🎯 Even Simpler: Export Specific Tables

If the full backup is too large, export only the tables you need:

### In Production Console:

```bash
cd /tmp

# Export only essential tables
pg_dump "$DATABASE_URL" \
  -t customers \
  -t plans \
  -t users \
  -t properties \
  -t developer_projects \
  -t invoices \
  -t payments \
  -f essential_data.sql

# Display
cat essential_data.sql
```

Then copy and restore as above.

---

## 📊 Summary

**Method:** Create backup in production → Copy content → Restore locally

**Time:** ~10 minutes

**Steps:**
1. ✅ Create backup in production console
2. ✅ Display with `cat`
3. ✅ Copy all content
4. ✅ Paste into local file
5. ✅ Restore to local database
6. ✅ Generate Prisma Client
7. ✅ Start development

**Pros:**
- ✅ Works without IP whitelisting
- ✅ No network issues
- ✅ Complete control

**Cons:**
- ⚠️ Manual copy/paste (one-time effort)
- ⚠️ Large files might need splitting

---

## 🆘 Troubleshooting

### Issue: File too large to copy/paste

**Solution:** Use the split method above, or export only essential tables

### Issue: nano editor slow with large file

**Solution:** Use a text editor instead:
```bash
# Create empty file
touch backups/production_backup.sql

# Open in default editor
open -e backups/production_backup.sql

# Paste content, save
```

### Issue: Restore takes too long

**Solution:** This is normal for large databases. It can take 5-10 minutes.

---

## ✅ Ready to Start?

**Your next command:**

```bash
# In DigitalOcean Console:
cd /tmp && pg_dump "$DATABASE_URL" -f production_backup.sql && cat production_backup.sql
```

Then copy the output and follow steps 3-7 above! 🚀

