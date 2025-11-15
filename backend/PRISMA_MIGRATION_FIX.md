# Prisma Migration Error Fix

## Problem
```
Error: P3006
Migration `20251108_add_onboarding_applications` failed to apply cleanly to the shadow database.
Error code: P1014
The underlying table for model `admins` does not exist.
```

## Root Cause
The migration references the `admins` table in foreign keys, but Prisma's shadow database (used for validation) doesn't have this table. This happens when:
- Previous migrations weren't applied to shadow database
- Shadow database is out of sync with main database
- Database state doesn't match migration history

## Solution 1: Use `prisma db push` (Recommended for Development)

This bypasses the shadow database and applies schema changes directly:

```bash
cd backend
npx prisma db push
```

**Pros:**
- ✅ Works immediately
- ✅ No shadow database issues
- ✅ Good for development
- ✅ Applies all schema changes

**Cons:**
- ⚠️ Doesn't create migration files
- ⚠️ Not recommended for production

## Solution 2: Mark Migration as Applied (If Already Applied)

If the migration was already applied to your main database:

```bash
cd backend
npx prisma migrate resolve --applied 20251108_add_onboarding_applications
npx prisma migrate dev --name add_purchase_orders
```

## Solution 3: Reset Migrations (⚠️ Use with Caution)

Only use if you can afford to lose data or are in early development:

```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev --name add_purchase_orders
```

**⚠️ WARNING:** This will delete all data!

## Solution 4: Configure Shadow Database (Advanced)

Add to `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL") // Optional: use separate shadow DB
}
```

## Recommended Approach

For development, use **Solution 1** (`prisma db push`):

```bash
cd backend
npx prisma db push
npx prisma generate
```

This will:
1. Apply all schema changes (including purchase orders)
2. Skip shadow database validation
3. Generate Prisma Client
4. Work around the migration issue

Then restart your backend server.

