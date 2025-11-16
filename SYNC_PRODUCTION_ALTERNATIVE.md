# Sync Production Data - Alternative Methods

## 🔴 Issue

Direct `pg_dump` from your local machine is failing because:
1. Your local IP is not whitelisted in DigitalOcean database firewall
2. DigitalOcean databases require trusted sources

---

## ✅ Solution: Use DigitalOcean Database Backup Feature

### Method 1: DigitalOcean Database Backups (Recommended)

DigitalOcean automatically creates daily backups of your database.

#### Step 1: Access Database Backups

1. Go to https://cloud.digitalocean.com/databases
2. Click on your database cluster: **contrezz-db-prod**
3. Go to **"Backups"** tab
4. Click **"Restore"** on the most recent backup
5. Choose **"Download Backup"** instead of restoring

#### Step 2: Download and Restore

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Create backups directory
mkdir -p backups

# Download the backup file from DigitalOcean
# (The download link will be provided in the DigitalOcean interface)

# Unzip if compressed
gunzip backups/downloaded_backup.sql.gz

# Drop and recreate local database
psql postgres -c "DROP DATABASE IF EXISTS contrezz_local;"
psql postgres -c "CREATE DATABASE contrezz_local;"

# Restore to local
psql "postgresql://postgres:postgres@localhost:5432/contrezz_local" < backups/downloaded_backup.sql

# Generate Prisma Client
cd backend
npx prisma generate

# Start development
npm run dev
```

---

## Method 2: Create Backup via Production Console (Simpler)

Since you have access to the production console, create the backup there:

### Step 1: Create Backup in Production Console

1. Go to https://cloud.digitalocean.com/apps
2. Click your app
3. Click **"Console"** tab
4. Run:

```bash
cd /tmp
pg_dump "$DATABASE_URL" > production_backup.sql
ls -lh production_backup.sql
```

### Step 2: Copy Backup Content

```bash
# In production console, display the backup
cat production_backup.sql
```

Then:
1. Copy the entire output
2. Save it locally to: `/Users/oluwaseyio/test_ui_figma_and_cursor/backups/production_backup.sql`

### Step 3: Restore Locally

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Drop and recreate local database
psql postgres -c "DROP DATABASE IF EXISTS contrezz_local;"
psql postgres -c "CREATE DATABASE contrezz_local;"

# Restore
psql "postgresql://postgres:postgres@localhost:5432/contrezz_local" < backups/production_backup.sql

# Generate Prisma Client
cd backend
npx prisma generate
```

---

## Method 3: Whitelist Your IP (Best Long-term Solution)

### Step 1: Get Your Public IP

```bash
curl ifconfig.me
```

Or visit: https://whatismyipaddress.com/

### Step 2: Add to Database Trusted Sources

1. Go to https://cloud.digitalocean.com/databases
2. Click your database: **contrezz-db-prod**
3. Go to **"Settings"** tab
4. Scroll to **"Trusted Sources"**
5. Click **"Edit"**
6. Add your IP address
7. Click **"Save"**

### Step 3: Try Original Script Again

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

export PROD_DB_URL="postgresql://contrezz_user:YOUR_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require"

./sync-production-to-local.sh
```

---

## Method 4: Use Prisma Studio to Export/Import (For Small Datasets)

If you have a small amount of data:

### Step 1: Connect Prisma Studio to Production

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# Temporarily set production URL
DATABASE_URL="postgresql://contrezz_user:YOUR_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require" npx prisma studio
```

**⚠️ Warning:** This will also fail if your IP isn't whitelisted.

---

## Method 5: Create Script to Copy Data via API

Create a script that fetches data through your production API:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Create sync script
cat > sync-via-api.js << 'EOF'
// This would fetch data via your production API
// and insert it into local database
// More complex but works around firewall issues
EOF
```

---

## 🎯 Recommended Approach

**For immediate sync:**
1. Use **Method 2** (Create backup in production console)
2. It's the simplest and works right now

**For long-term:**
1. Use **Method 3** (Whitelist your IP)
2. Then you can use the automated script anytime

---

## 📋 Quick Fix: Whitelist Your IP Now

This is the fastest solution:

```bash
# 1. Get your IP
curl ifconfig.me

# 2. Go to DigitalOcean:
#    https://cloud.digitalocean.com/databases
#    → contrezz-db-prod
#    → Settings
#    → Trusted Sources
#    → Add your IP

# 3. Run sync script again
./sync-production-to-local.sh
```

---

## 🆘 Troubleshooting

### Error: "connection refused"

**Cause:** Your IP is not whitelisted

**Solution:** Add your IP to trusted sources (Method 3)

### Error: "timeout"

**Cause:** Network/firewall issue

**Solution:** 
1. Check your internet connection
2. Try from a different network
3. Use Method 2 (console backup)

### Error: "authentication failed"

**Cause:** Wrong credentials

**Solution:** Double-check the DATABASE_URL from DigitalOcean

---

## ✨ Summary

**Problem:** Can't connect to production database from local machine  
**Cause:** IP not whitelisted in DigitalOcean database firewall  
**Quick Fix:** Whitelist your IP in DigitalOcean database settings  
**Alternative:** Create backup in production console, copy content locally

**Recommended Steps:**
1. Get your IP: `curl ifconfig.me`
2. Add to DigitalOcean database trusted sources
3. Run sync script again

🚀 **This will enable seamless syncing going forward!**

