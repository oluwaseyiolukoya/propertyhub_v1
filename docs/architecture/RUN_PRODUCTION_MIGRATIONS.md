# Run Production Migrations for Public Backend

## Problem

You're getting:
```
ERROR: relation "public_admins" does not exist
```

This means the database migrations haven't been run on the production database.

## Solution: Run Migrations

### Step 1: Check Migration Status

**In DigitalOcean Console:**

```bash
cd /workspace/public-backend
npm run migrate:status
```

This will show which migrations have been applied.

### Step 2: Run Migrations

**In DigitalOcean Console:**

```bash
cd /workspace/public-backend
npm run migrate:deploy
```

This will apply all pending migrations to the production database.

**What this does:**
- Connects to production database (using `PUBLIC_DATABASE_URL` from environment)
- Runs all migration files in `prisma/migrations/`
- Creates all tables including `public_admins`

### Step 3: Verify Tables Created

**In PostgreSQL:**

```sql
-- List all tables
\dt

-- Or check specific table
SELECT * FROM public_admins;
```

You should see the `public_admins` table listed.

### Step 4: Create Admin User

After migrations are complete, run the INSERT:

```sql
INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@contrezz.com',
  'Admin User',
  '$2b$10$CofG4lgetxncuwtjj3ykYOerNqiPvwIeuj2XDtzKFgbbRCZb3QDJi',
  'admin',
  true,
  NOW(),
  NOW()
);
```

---

## Alternative: Run Migrations from Local Machine

If you can't run migrations in DigitalOcean console:

### Step 1: Get Production Database URL

**From DigitalOcean:**
1. Go to Databases → `contrezz-public-db`
2. Click "Connection Details"
3. Copy the connection string

### Step 2: Set Environment Variable

**On your local machine:**

```bash
export PUBLIC_DATABASE_URL="postgresql://user:password@host:port/database"
```

### Step 3: Run Migrations

```bash
cd public-backend
npm run migrate:deploy
```

This will apply migrations to production database.

---

## Verify Migration Success

**Check tables exist:**

```sql
-- In PostgreSQL
\dt

-- Should show:
-- public_admins
-- landing_pages
-- career_postings
-- (and other tables)
```

**Check migration history:**

```bash
cd /workspace/public-backend
npm run migrate:status
```

Should show all migrations as "Applied".

---

## Troubleshooting

### Error: "Cannot connect to database"

**Solution:**
1. Verify `PUBLIC_DATABASE_URL` is set in DigitalOcean environment variables
2. Check database is running
3. Verify connection string is correct

### Error: "Migration already applied"

**Solution:**
- This is fine - migrations are idempotent
- Just proceed to create admin user

### Error: "No migrations found"

**Solution:**
1. Check `prisma/migrations/` directory exists
2. Verify migrations are committed to git
3. Pull latest code: `git pull origin main`

---

## Quick Reference

**Run Migrations (DigitalOcean Console):**
```bash
cd /workspace/public-backend
npm run migrate:deploy
```

**Check Status:**
```bash
npm run migrate:status
```

**Verify Tables:**
```sql
\dt
```

**Then Create Admin:**
```sql
INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@contrezz.com',
  'Admin User',
  '$2b$10$CofG4lgetxncuwtjj3ykYOerNqiPvwIeuj2XDtzKFgbbRCZb3QDJi',
  'admin',
  true,
  NOW(),
  NOW()
);
```

---

**Last Updated:** December 15, 2025  
**Status:** Production migration guide

