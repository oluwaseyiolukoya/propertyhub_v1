# Development Workflow Guide

## 🎯 How to Work Locally and Deploy to Production Safely

This guide explains how to continue developing locally while preserving your production database.

---

## 🚨 IMPORTANT: Update Your Render Build Command

**RIGHT NOW**, you need to update your Render build command to use migrations instead of `db push` to preserve your production database.

### Current Build Command (UNSAFE - will wipe data):
```bash
npm install && npx prisma generate && npx prisma db push --accept-data-loss && npx tsx prisma/seed.ts && npm run build
```

### Updated Build Command (SAFE - preserves data):
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

### How to Update on Render:
1. Go to **Render Dashboard** → **Your Backend Service**
2. Click **Settings** (left sidebar)
3. Scroll to **Build Command**
4. Replace with the **SAFE** command above
5. Click **Save Changes**

**Why this matters:**
- `prisma db push --accept-data-loss` ⚠️ **WIPES YOUR DATABASE** on every deploy
- `prisma migrate deploy` ✅ **PRESERVES YOUR DATA** and applies only new changes

---

## 📁 Environment Setup

### 1. Local Development Environment

Create a `.env` file in your `backend/` folder for local development:

```bash
# backend/.env (Local Development)
DATABASE_URL="postgresql://postgres:your_local_password@localhost:5432/contrezz_local"
JWT_SECRET="your-local-jwt-secret-key-change-this"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
PORT=5000
```

**Key Points:**
- ✅ Use a **separate local database** (different from production)
- ✅ This keeps your local experiments separate from production
- ✅ The `.env` file is already in `.gitignore`, so it won't be pushed to GitHub

### 2. Production Environment (Render)

Your production environment variables are already set in Render:
- `DATABASE_URL` → Your Render PostgreSQL connection string
- `JWT_SECRET` → Your production secret
- `FRONTEND_URL` → `https://contrezz-v1.vercel.app`
- `NODE_ENV` → `production`
- `PORT` → `5000`

---

## 🔄 Development Workflow

### Step 1: Work Locally

```bash
# Navigate to your project
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Start backend (in one terminal)
cd backend
npm run dev

# Start frontend (in another terminal)
cd ..
npm run dev

# Open Prisma Studio to view local database (optional, in third terminal)
cd backend
npm run prisma:studio
```

### Step 2: Make Schema Changes (if needed)

When you need to modify your database schema:

```bash
cd backend

# 1. Edit your schema in prisma/schema.prisma
# Example: Add a new field to a model

# 2. Create a migration (this preserves existing data)
npx prisma migrate dev --name describe_your_change

# Examples:
# npx prisma migrate dev --name add_user_avatar_field
# npx prisma migrate dev --name add_property_images_table
```

**What this does:**
- ✅ Creates a migration file in `prisma/migrations/`
- ✅ Applies the change to your local database
- ✅ Preserves all existing data
- ✅ Generates updated Prisma Client

### Step 3: Test Your Changes Locally

```bash
# Run your app locally and test thoroughly
npm run dev

# Test all features that might be affected
# Check that existing data is preserved
# Create test data to verify new features work
```

### Step 4: Deploy to Production

```bash
# 1. Commit your changes (including migration files)
git add .
git commit -m "Add new feature: describe what you built"

# 2. Push to GitHub
git push origin main

# 3. Render will automatically:
#    - Pull the latest code
#    - Run: npm install
#    - Run: npx prisma generate
#    - Run: npx prisma migrate deploy  ← Applies migrations safely
#    - Run: npm run build
#    - Restart the server
#    - ✅ Your production database is PRESERVED with all existing data
```

---

## 🗃️ Database Migration Commands Explained

| Command | When to Use | What It Does |
|---------|-------------|--------------|
| `npx prisma migrate dev` | **Local development** | Creates and applies migrations to local DB |
| `npx prisma migrate deploy` | **Production** | Applies pending migrations without prompts |
| `npx prisma db push` | **Prototyping only** | Syncs schema without migrations (can lose data) |
| `npx prisma migrate reset` | **Local dev only** | ⚠️ Wipes DB and reapplies all migrations + seed |

---

## 🎯 Common Scenarios

### Scenario 1: Adding a New Feature (No DB Changes)

```bash
# 1. Code your feature locally
# 2. Test it
# 3. Commit and push
git add .
git commit -m "Add feature: user profile page"
git push origin main

# ✅ Production database is unaffected
```

### Scenario 2: Adding a New Database Field

```bash
# 1. Edit backend/prisma/schema.prisma
# Example: Add 'avatar' field to 'users' model

model users {
  id        String   @id
  name      String
  email     String   @unique
  avatar    String?  // ← New field
  // ... other fields
}

# 2. Create migration
cd backend
npx prisma migrate dev --name add_user_avatar

# 3. Test locally with your local database
npm run dev

# 4. Once everything works, commit and push
git add .
git commit -m "Add user avatar field"
git push origin main

# ✅ Production will apply the migration safely
# ✅ All existing users will have avatar=null (safe default)
```

### Scenario 3: Adding a New Table

```bash
# 1. Add new model to backend/prisma/schema.prisma
model notifications {
  id        String   @id
  userId    String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  users     users    @relation(fields: [userId], references: [id])
}

# 2. Create migration
cd backend
npx prisma migrate dev --name add_notifications_table

# 3. Update your code to use the new table
# 4. Test locally
# 5. Commit and push
git add .
git commit -m "Add notifications feature"
git push origin main

# ✅ Production will create the new table
# ✅ All existing data in other tables is preserved
```

### Scenario 4: Renaming a Field (CAREFUL!)

```bash
# ⚠️ Renaming can be tricky - Prisma might drop and recreate the column

# SAFER APPROACH: Create a new field, copy data, then remove old field

# Step 1: Add new field
# Step 2: Write a data migration script to copy data
# Step 3: Remove old field

# OR use a manual migration:
cd backend
npx prisma migrate dev --create-only --name rename_user_phone_to_mobile

# Then edit the generated migration file to use SQL RENAME instead of DROP/CREATE
# Example: ALTER TABLE users RENAME COLUMN phone TO mobile;

# Apply it
npx prisma migrate dev
```

---

## 🔒 Production Database Backup (Recommended)

### Option 1: Render Automatic Backups

Render PostgreSQL includes automatic daily backups:
1. Go to **Render Dashboard** → **Your Database**
2. Click **Backups** tab
3. View available backups and restore options

### Option 2: Manual Backup Before Major Changes

```bash
# Connect to your production database
# (Get the PSQL Command from Render Database page)

# Example:
PGPASSWORD=your_password pg_dump -h hostname -U username -d database_name > backup_$(date +%Y%m%d).sql

# To restore if needed:
PGPASSWORD=your_password psql -h hostname -U username -d database_name < backup_20250124.sql
```

---

## 📝 Best Practices Checklist

### Before Every Deploy:

- [ ] Test all changes locally with your local database
- [ ] Review migration files to ensure they're safe
- [ ] Make sure your Render build command uses `prisma migrate deploy` (not `db push`)
- [ ] Commit migration files to Git
- [ ] Consider backing up production DB before major schema changes

### Database Changes:

- [ ] Always use `prisma migrate dev` for schema changes (never edit database directly)
- [ ] Test migrations locally first
- [ ] Use optional fields (`field?: String?`) for new columns to avoid issues with existing data
- [ ] Write data migrations for complex transformations

### Version Control:

- [ ] Always commit migration files in `prisma/migrations/`
- [ ] Write clear commit messages describing what changed
- [ ] Never modify old migration files (create new ones instead)

---

## 🚀 Quick Reference Commands

### Local Development:
```bash
# Start backend dev server
cd backend && npm run dev

# Start frontend dev server
npm run dev

# Create new migration
cd backend && npx prisma migrate dev --name your_change_name

# View local database
cd backend && npm run prisma:studio

# Reset local database (⚠️ wipes local data)
cd backend && npx prisma migrate reset
```

### Deploy to Production:
```bash
# Commit and push (triggers auto-deploy)
git add .
git commit -m "Description of changes"
git push origin main
```

### Check Production Status:
```bash
# View production logs
# Go to: https://dashboard.render.com → Your Service → Logs

# Check backend health
curl https://contrezz-backend-2suw.onrender.com/health

# Check Vercel frontend
# Go to: https://vercel.com/dashboard → Your Project → Deployments
```

---

## 🆘 Troubleshooting

### Problem: "Migration failed to apply"
**Solution:** Check Render logs for the specific error. Often it's:
- Missing field defaults
- Foreign key constraint issues
- Trying to make a required field non-nullable when nulls exist

### Problem: "Out of sync" errors
**Solution:**
```bash
# Local database out of sync
cd backend
npx prisma migrate reset  # ⚠️ Local only!

# Production - never reset! Check what migrations are pending
# Look at Render logs during deployment
```

### Problem: "Lost data after deploy"
**Prevention:** Make sure you updated your Render build command to use `prisma migrate deploy` instead of `prisma db push --accept-data-loss`

---

## 📚 Additional Resources

- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Render PostgreSQL Docs](https://render.com/docs/databases)
- [Your Login Credentials](./LOGIN_CREDENTIALS.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

## ✅ Summary

**Local Development:**
- Use separate local database
- Use `prisma migrate dev` for schema changes
- Test thoroughly before deploying

**Production Deployment:**
- Update Render build command to use `prisma migrate deploy`
- Commit migration files to Git
- Push to GitHub → Render auto-deploys
- Your production database is preserved ✅

**Key Rule:** Never use `db push --accept-data-loss` in production!

---

*Last updated: January 2025*

