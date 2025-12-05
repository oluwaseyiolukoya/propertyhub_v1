# Production Database Backup Guide

## Issue: pg_dump Hanging (Waiting for Password)

When you run `pg_dump` without providing the password, it will wait for you to enter it interactively. This is what's happening.

## Solutions

### Option 1: Use PGPASSWORD Environment Variable (Recommended)

```bash
# Set password as environment variable (replace YOUR_PASSWORD)
export PGPASSWORD='your_database_password'

# Run pg_dump
pg_dump -h contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com \
  -U contrezz_user \
  -d contrezz-db-prod \
  -F c -b -v \
  -f "backup_$(date +%Y%m%d_%H%M%S).dump"

# Unset password for security
unset PGPASSWORD
```

### Option 2: Use .pgpass File (Most Secure)

```bash
# Create .pgpass file in home directory
cat > ~/.pgpass <<EOF
contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060:contrezz-db-prod:contrezz_user:YOUR_PASSWORD
EOF

# Set proper permissions (REQUIRED)
chmod 600 ~/.pgpass

# Now pg_dump will work without password prompt
pg_dump -h contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com \
  -U contrezz_user \
  -d contrezz-db-prod \
  -F c -b -v \
  -f "backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Option 3: Use DigitalOcean Database Backups (Easiest)

DigitalOcean automatically backs up your database. You can:

1. **Go to DigitalOcean Console** → Databases → Your Database
2. **Click on "Backups" tab**
3. **Download or restore from automatic backups**

This is the safest option as DigitalOcean maintains these automatically!

### Option 4: Simple SQL Backup (Alternative)

```bash
# Get password from environment or DigitalOcean console
export PGPASSWORD='your_password'

# Create simple SQL backup
pg_dump -h contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com \
  -U contrezz_user \
  -d contrezz-db-prod \
  -F p \
  --no-owner \
  --no-acl \
  > "backup_$(date +%Y%m%d_%H%M%S).sql"

unset PGPASSWORD
```

## Where to Find Database Password

### DigitalOcean Console:
1. Go to **Databases** → Your Database
2. Click **"Connection Details"**
3. Copy the password

### From Your Backend .env File:
```bash
# On production server
cat /path/to/backend/.env | grep DATABASE_URL

# The password is in the connection string:
# postgresql://user:PASSWORD@host:port/database
```

## Complete Backup Command (Copy & Paste Ready)

```bash
#!/bin/bash

# Set your database password here
read -sp "Enter database password: " DB_PASSWORD
echo ""

export PGPASSWORD="$DB_PASSWORD"

# Create backup
echo "Creating backup..."
pg_dump -h contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com \
  -U contrezz_user \
  -d contrezz-db-prod \
  -p 25060 \
  -F c -b -v \
  -f "backup_$(date +%Y%m%d_%H%M%S).dump"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully!"
    ls -lh backup_*.dump | tail -1
else
    echo "❌ Backup failed!"
fi

# Unset password
unset PGPASSWORD
```

## Verify Backup Was Created

```bash
# List backups
ls -lh backup_*.dump

# Check backup size (should not be 0 bytes)
du -h backup_*.dump

# Test backup integrity
pg_restore --list backup_YYYYMMDD_HHMMSS.dump | head -20
```

## If You're Inside a Docker/Kubernetes Pod

```bash
# Install pg_dump if not available
apt-get update && apt-get install -y postgresql-client

# Or use DigitalOcean's built-in backup instead
# Exit the pod and use DigitalOcean console
```

## Recommended: Use DigitalOcean Automatic Backups

**Before running manual migrations, check:**

1. Go to DigitalOcean Console
2. Navigate to your database cluster
3. Check "Backups" tab
4. Verify daily backups are enabled
5. Note the latest backup time

**This is safer than manual backups!**

## Current Command Fix

If your command is hanging, press `Ctrl+C` to cancel, then run:

```bash
# Method 1: Provide password inline
PGPASSWORD='your_password' pg_dump \
  -h contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com \
  -U contrezz_user \
  -d contrezz-db-prod \
  -F c -b -v \
  -f "backup_$(date +%Y%m%d_%H%M%S).dump"

# Method 2: Let it prompt for password
pg_dump -W \
  -h contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com \
  -U contrezz_user \
  -d contrezz-db-prod \
  -F c -b -v \
  -f "backup_$(date +%Y%m%d_%H%M%S).dump"
# Then type your password when prompted
```

## Security Notes

⚠️ **Never commit passwords to git!**
⚠️ **Use environment variables or .pgpass file**
⚠️ **Delete backup files after migration is complete**
⚠️ **Store backups in secure location only**

## After Backup is Complete

```bash
# Verify backup size
ls -lh backup_*.dump

# Should show something like:
# -rw-r--r-- 1 user user 15M Dec 4 23:30 backup_20251204_233045.dump

# If size is > 0, backup is likely good!
```

## Next Steps

1. ✅ Create backup (using one of the methods above)
2. ✅ Verify backup was created and has size > 0
3. ✅ Run migration: `npx prisma migrate deploy`
4. ✅ Test application
5. ✅ Keep backup for 7 days minimum

---

**Need Help?** Check DigitalOcean database connection details or ask for assistance!

