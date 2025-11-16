# Sync Production Data to Local - Complete Guide

## 🎯 Goal

Pull your production database to local environment so you can work with real data.

---

## 📋 Prerequisites

1. ✅ Production database URL
2. ✅ Local PostgreSQL running
3. ✅ `pg_dump` and `psql` installed

---

## 🚀 Step-by-Step Guide

### Step 1: Get Production Database URL

#### Option A: From DigitalOcean Dashboard

1. Go to https://cloud.digitalocean.com/apps
2. Click your app
3. Go to **Settings** → **Environment Variables**
4. Find and copy `DATABASE_URL`

#### Option B: From DigitalOcean Console

```bash
echo $DATABASE_URL
```

**Format:**
```
postgresql://username:password@host:port/database?sslmode=require
```

---

### Step 2: Backup Production Database

On your local machine:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Create backups directory if it doesn't exist
mkdir -p backups

# Set production database URL (replace with your actual URL)
export PROD_DB_URL="postgresql://username:password@host:port/database?sslmode=require"

# Create backup with timestamp
pg_dump "$PROD_DB_URL" > backups/production_backup_$(date +%Y%m%d_%H%M%S).sql

# Or create a compressed backup (recommended for large databases)
pg_dump "$PROD_DB_URL" | gzip > backups/production_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Expected output:**
```
✅ Backup created: backups/production_backup_20250116_143022.sql
```

---

### Step 3: Prepare Local Database

```bash
# Stop your local backend if running
# (In another terminal, Ctrl+C to stop)

# Connect to local PostgreSQL
psql postgres

# In psql, drop and recreate your local database
DROP DATABASE IF EXISTS contrezz_local;
CREATE DATABASE contrezz_local;

# Exit psql
\q
```

---

### Step 4: Restore Production Data to Local

```bash
# Get your local database URL from .env
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
cat .env | grep DATABASE_URL

# Or use default local URL
export LOCAL_DB_URL="postgresql://postgres:postgres@localhost:5432/contrezz_local"

# Restore from backup (uncompressed)
psql "$LOCAL_DB_URL" < backups/production_backup_20250116_143022.sql

# OR restore from compressed backup
gunzip -c backups/production_backup_20250116_143022.sql.gz | psql "$LOCAL_DB_URL"
```

**Expected output:**
```
SET
SET
CREATE TABLE
CREATE TABLE
...
COPY 150
COPY 3
COPY 6
...
✅ Database restored successfully
```

---

### Step 5: Update Local Environment

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# Update your .env file with local database URL
# Make sure DATABASE_URL points to your local database
nano .env
```

**Ensure your `.env` has:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/contrezz_local"
NODE_ENV=development
PORT=5000
JWT_SECRET=your-local-jwt-secret
FRONTEND_URL=http://localhost:5173
```

---

### Step 6: Run Prisma Migrations (if needed)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# Generate Prisma Client
npx prisma generate

# Check if migrations are needed
npx prisma migrate status

# If migrations are pending, apply them
npx prisma migrate deploy
```

---

### Step 7: Start Local Development

```bash
# Terminal 1: Start backend
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npm run dev

# Terminal 2: Start frontend
cd /Users/oluwaseyio/test_ui_figma_and_cursor
npm run dev
```

---

### Step 8: Verify Data

Open http://localhost:5173 and check:

1. ✅ Login with production credentials
2. ✅ See production customers
3. ✅ See all 6 plans (3 developer + 3 property)
4. ✅ See production properties/projects
5. ✅ All data matches production

---

## 🔄 Quick Sync Script

I'll create a script to automate this process:

```bash
#!/bin/bash
# sync-production-to-local.sh

set -e

echo "🔄 Syncing Production Data to Local"
echo "===================================="
echo ""

# Check if PROD_DB_URL is set
if [ -z "$PROD_DB_URL" ]; then
  echo "❌ Error: PROD_DB_URL not set"
  echo ""
  echo "Please set it first:"
  echo "  export PROD_DB_URL='postgresql://user:pass@host:port/db?sslmode=require'"
  exit 1
fi

# Create backups directory
mkdir -p backups

# Backup production
BACKUP_FILE="backups/production_backup_$(date +%Y%m%d_%H%M%S).sql"
echo "📦 Creating backup: $BACKUP_FILE"
pg_dump "$PROD_DB_URL" > "$BACKUP_FILE"
echo "✅ Backup created"
echo ""

# Drop and recreate local database
echo "🗑️  Dropping local database..."
psql postgres -c "DROP DATABASE IF EXISTS contrezz_local;"
psql postgres -c "CREATE DATABASE contrezz_local;"
echo "✅ Local database recreated"
echo ""

# Restore to local
LOCAL_DB_URL="postgresql://postgres:postgres@localhost:5432/contrezz_local"
echo "📥 Restoring to local database..."
psql "$LOCAL_DB_URL" < "$BACKUP_FILE"
echo "✅ Data restored"
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
cd backend
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "✅ Production data synced to local successfully!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📋 Next steps:"
echo "  1. Start backend: cd backend && npm run dev"
echo "  2. Start frontend: npm run dev"
echo "  3. Open: http://localhost:5173"
echo ""
```

---

## 🛡️ Security Best Practices

### 1. Never Commit Production Data

Add to `.gitignore`:
```
backups/
*.sql
*.sql.gz
```

### 2. Sanitize Sensitive Data (Optional)

If you want to remove sensitive data from local:

```sql
-- Connect to local database
psql postgresql://postgres:postgres@localhost:5432/contrezz_local

-- Anonymize emails (optional)
UPDATE users SET email = 'user' || id || '@example.com';
UPDATE customers SET email = 'customer' || id || '@example.com';

-- Reset passwords (optional)
UPDATE users SET password = '$2b$10$hashedpassword';

-- Clear sensitive notes
UPDATE customers SET notes = NULL WHERE notes IS NOT NULL;
```

### 3. Use Environment-Specific Credentials

Keep production credentials separate from local:

**Production `.env`:**
```env
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host/prod-db
SMTP_USER=info@contrezz.com
SMTP_PASS=production-password
```

**Local `.env`:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/contrezz_local
SMTP_USER=test@example.com
SMTP_PASS=test-password
```

---

## 🔍 Verify Sync

### Check Tables

```bash
psql postgresql://postgres:postgres@localhost:5432/contrezz_local

# List all tables
\dt

# Check record counts
SELECT 'customers' as table_name, COUNT(*) FROM customers
UNION ALL
SELECT 'plans', COUNT(*) FROM plans
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'developer_projects', COUNT(*) FROM developer_projects;
```

**Expected output:**
```
  table_name       | count
-------------------+-------
 customers         |   150
 plans             |     6
 users             |   200
 properties        |    50
 developer_projects|    10
```

---

## 🆘 Troubleshooting

### Issue 1: pg_dump not found

**Solution:**
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Verify
pg_dump --version
```

### Issue 2: Connection timeout

**Error:** `could not connect to server: Connection timed out`

**Solution:**
- Check if production database allows external connections
- Verify your IP is whitelisted in DigitalOcean
- Check firewall settings

### Issue 3: SSL connection required

**Error:** `SSL connection is required`

**Solution:**
Add `?sslmode=require` to database URL:
```
postgresql://user:pass@host:port/db?sslmode=require
```

### Issue 4: Permission denied

**Error:** `permission denied for database`

**Solution:**
Make sure you're using the correct database credentials with proper permissions.

### Issue 5: Local database already exists

**Error:** `database "contrezz_local" already exists`

**Solution:**
```bash
psql postgres -c "DROP DATABASE contrezz_local;"
psql postgres -c "CREATE DATABASE contrezz_local;"
```

---

## 📊 What Gets Synced

✅ All tables and data:
- customers (with all 150+ records)
- plans (all 6 plans including new developer plans)
- users (all user accounts)
- properties (all properties)
- developer_projects (all projects)
- expenses, invoices, payments, etc.

✅ Database schema:
- All table structures
- Indexes
- Constraints
- Relationships

❌ What doesn't sync:
- Environment variables (you set these locally)
- Uploaded files/images (stored in file system or S3)
- Background jobs/cron schedules

---

## 🔄 Regular Sync Workflow

For ongoing development:

```bash
# 1. Sync production data (weekly or as needed)
export PROD_DB_URL="your-production-url"
./sync-production-to-local.sh

# 2. Work on your local environment
cd backend && npm run dev

# 3. Test changes locally
# Make your design changes, test features, etc.

# 4. When ready, deploy to production
git add .
git commit -m "feat: your changes"
git push origin main
```

---

## ✨ Summary

**Steps:**
1. Get production DATABASE_URL
2. Create backup: `pg_dump $PROD_DB_URL > backup.sql`
3. Drop local database
4. Restore: `psql $LOCAL_DB_URL < backup.sql`
5. Generate Prisma Client
6. Start development servers

**Result:**
✅ Local environment has exact production data  
✅ Can work with real customers, plans, and projects  
✅ Safe to experiment without affecting production

---

## 📞 Quick Reference

**Backup production:**
```bash
pg_dump "$PROD_DB_URL" > backups/prod_$(date +%Y%m%d).sql
```

**Restore to local:**
```bash
psql "$LOCAL_DB_URL" < backups/prod_20250116.sql
```

**Start development:**
```bash
cd backend && npm run dev
npm run dev
```

🚀 **Ready to work with production data locally!**

