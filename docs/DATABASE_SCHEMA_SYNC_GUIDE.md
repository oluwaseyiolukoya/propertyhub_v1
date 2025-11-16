# Database Schema Synchronization - Best Practices Guide

**Purpose**: Ensure production database schema always matches the codebase to prevent schema mismatch errors

---

## The Problem We Just Experienced

The 500 error occurred because:
1. The code expected a `name` field in the `customers` table
2. The actual schema has a `company` field instead
3. This mismatch wasn't caught until production runtime

**Root Cause**: No automated schema validation between code and database

---

## ✅ Best Practices Solution

### 1. **Use Prisma Migrations (RECOMMENDED)**

Prisma migrations create versioned, trackable database changes that can be applied consistently across all environments.

#### How It Works

```
Development → Create Migration → Commit to Git → Deploy to Production
```

#### Setup Instructions

**A. In Development (Local)**

When you change `schema.prisma`:

```bash
# 1. Make your schema changes in backend/prisma/schema.prisma
# Example: Add a new field, rename a field, etc.

# 2. Create a migration
cd backend
npx prisma migrate dev --name describe_your_change

# This creates:
# - backend/prisma/migrations/20251116_describe_your_change/migration.sql
# - Updates your local database
# - Regenerates Prisma Client
```

**B. In Production**

Your deployment process should automatically run:

```bash
# Apply all pending migrations
npx prisma migrate deploy

# Regenerate Prisma Client (already in package.json postinstall)
npx prisma generate
```

---

### 2. **DigitalOcean Deployment Configuration**

#### Update Your Build Command

**File**: `.do/app.yaml` or DigitalOcean Dashboard

**Current build process** (check your current setup):
```yaml
build_command: npm install && npm run build
```

**Recommended build process**:
```yaml
build_command: npm install && npx prisma generate && npm run build
```

**Recommended start/run command**:
```bash
# Before starting the server, run migrations
npx prisma migrate deploy && npm start
```

#### In DigitalOcean Dashboard

1. Go to **App Settings** → **Components** → **Backend**
2. Edit **Run Command**:
   ```bash
   npx prisma migrate deploy && npm start
   ```

This ensures migrations run automatically on every deployment.

---

### 3. **Package.json Scripts** (RECOMMENDED)

Add these scripts to `backend/package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "npx swc src -d dist --copy-files",
    "start": "node dist/index.js",
    "postinstall": "prisma generate",
    
    // ✅ ADD THESE:
    "migrate:deploy": "prisma migrate deploy",
    "migrate:dev": "prisma migrate dev",
    "migrate:status": "prisma migrate status",
    "db:push": "prisma db push",
    "db:pull": "prisma db pull",
    "db:validate": "prisma validate",
    "deploy": "npm run migrate:deploy && npm start"
  }
}
```

**Then update your DigitalOcean run command to**:
```bash
npm run deploy
```

---

### 4. **Pre-Deployment Validation** (CI/CD)

Add a validation step before deployment to catch schema issues early.

#### GitHub Actions Workflow

Create: `.github/workflows/validate-schema.yml`

```yaml
name: Validate Database Schema

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: backend
        run: npm install
        
      - name: Generate Prisma Client
        working-directory: backend
        run: npx prisma generate
        
      - name: Validate Schema
        working-directory: backend
        run: npx prisma validate
        
      - name: Check Migrations
        working-directory: backend
        run: npx prisma migrate status --schema=./prisma/schema.prisma || true
        
      - name: Build Backend
        working-directory: backend
        run: npm run build
```

This will:
- ✅ Validate schema syntax
- ✅ Ensure Prisma Client can be generated
- ✅ Check migration status
- ✅ Verify the code compiles with the schema

---

### 5. **Migration Workflow** (Team Process)

#### For Schema Changes

```bash
# Developer makes schema change
# ================================

# 1. Edit schema.prisma
vim backend/prisma/schema.prisma

# 2. Create migration
cd backend
npx prisma migrate dev --name add_user_role_field

# 3. Review generated SQL
cat prisma/migrations/20251116_add_user_role_field/migration.sql

# 4. Test locally
npm run dev

# 5. Commit to git
git add .
git commit -m "feat: Add user role field to schema"
git push origin main

# Production deployment happens automatically
# ============================================

# DigitalOcean/CI runs:
# npx prisma migrate deploy  ← Applies new migration
# npm start                  ← Starts server
```

---

### 6. **Schema Validation in Code** (Runtime Safety)

Add runtime validation to catch schema mismatches early.

#### Create a Schema Validator

**File**: `backend/src/lib/schema-validator.ts`

```typescript
import prisma from './db';

/**
 * Validates that the database schema matches Prisma schema
 * Run this on application startup
 */
export async function validateDatabaseSchema() {
  try {
    console.log('🔍 Validating database schema...');
    
    // Test critical tables exist and have expected fields
    const tests = [
      // Test customers table
      async () => {
        await prisma.customers.findFirst({
          select: { 
            id: true, 
            company: true,  // ✅ Correct field
            email: true 
          }
        });
      },
      
      // Test users table
      async () => {
        await prisma.users.findFirst({
          select: { 
            id: true, 
            email: true, 
            customerId: true 
          }
        });
      },
      
      // Test developer_projects table
      async () => {
        await prisma.developer_projects.findFirst({
          select: { 
            id: true, 
            customerId: true, 
            developerId: true 
          }
        });
      },
    ];
    
    // Run all validation tests
    await Promise.all(tests.map(test => test()));
    
    console.log('✅ Database schema validation passed');
    return true;
  } catch (error: any) {
    console.error('❌ Database schema validation failed:', error.message);
    console.error('💡 Run: npx prisma migrate deploy');
    
    if (process.env.NODE_ENV === 'production') {
      // In production, fail fast if schema is wrong
      throw new Error('Database schema mismatch. Deployment aborted.');
    }
    
    return false;
  }
}
```

#### Use in Server Startup

**File**: `backend/src/index.ts`

```typescript
import { validateDatabaseSchema } from './lib/schema-validator';

// Before starting the server
async function startServer() {
  try {
    // Validate schema on startup
    await validateDatabaseSchema();
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

---

### 7. **Environment-Specific Migration Strategy**

#### Development
```bash
npx prisma migrate dev --name change_description
# - Creates migration
# - Applies to local DB
# - Regenerates Prisma Client
```

#### Staging/Production
```bash
npx prisma migrate deploy
# - Applies pending migrations only
# - No interactive prompts
# - Safe for CI/CD
```

#### Emergency Schema Sync (Use Carefully!)
```bash
# Pull schema from production database
npx prisma db pull

# Push schema to production database (DANGEROUS - skips migrations)
npx prisma db push --accept-data-loss
```

**⚠️ Warning**: `db push` is for prototyping only. Always use migrations in production!

---

### 8. **Documentation Strategy**

#### Track Schema Changes

Create: `backend/prisma/SCHEMA_CHANGELOG.md`

```markdown
# Schema Changelog

## 2025-11-16 - Fix Developer Dashboard
- **Migration**: 20251116_fix_developer_dashboard
- **Changes**: None (code fix only)
- **Impact**: None
- **Reason**: Code was using wrong field name

## 2025-11-15 - Add Project Stages
- **Migration**: 20251115_add_project_stages
- **Changes**: 
  - Added `project_stages` table
  - Added `stage_templates` table
- **Impact**: New feature
- **Reason**: Track project stage completion
```

---

### 9. **Monitoring and Alerts**

#### Add Schema Version Endpoint

**File**: `backend/src/routes/health.ts`

```typescript
router.get('/schema-version', async (req, res) => {
  try {
    // Get applied migrations
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM "_prisma_migrations" 
      ORDER BY finished_at DESC 
      LIMIT 5
    `;
    
    res.json({
      status: 'ok',
      latestMigrations: migrations,
      prismaVersion: require('@prisma/client/package.json').version
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});
```

Access: `https://api.contrezz.com/health/schema-version`

---

### 10. **Rollback Strategy**

If a migration causes issues in production:

```bash
# View migration history
npx prisma migrate status

# Rollback approach (manual)
# 1. Revert the migration SQL manually in database
# 2. Delete migration from _prisma_migrations table
# 3. Delete migration folder from prisma/migrations/

# Better: Use database backups
# DigitalOcean provides automatic daily backups
# Restore from backup if needed
```

---

## 🎯 Recommended Implementation Plan

### Phase 1: Immediate (Today)
- [ ] Update DigitalOcean run command to include `npx prisma migrate deploy`
- [ ] Test the deployment process
- [ ] Verify migrations run automatically

### Phase 2: This Week
- [ ] Add schema validation scripts to package.json
- [ ] Add runtime schema validator
- [ ] Document current schema state

### Phase 3: Next Sprint
- [ ] Set up GitHub Actions for schema validation
- [ ] Create migration workflow documentation for team
- [ ] Add schema version monitoring endpoint

---

## 🔧 Quick Start Implementation

### Step 1: Update DigitalOcean

1. Go to **DigitalOcean Dashboard** → Your App → **Settings**
2. Find **Backend Component**
3. Edit **Run Command**:
   ```bash
   npx prisma migrate deploy && npm start
   ```
4. Save and redeploy

### Step 2: Update package.json

```bash
cd backend
```

Add these scripts:
```json
{
  "scripts": {
    "deploy": "npx prisma migrate deploy && npm start",
    "migrate:status": "npx prisma migrate status",
    "db:validate": "npx prisma validate"
  }
}
```

### Step 3: Test Locally

```bash
# Validate your schema
npx prisma validate

# Check migration status
npx prisma migrate status

# If you have pending migrations, apply them
npx prisma migrate deploy
```

### Step 4: Document Process

Add to your team documentation:
- How to create migrations
- When to use `migrate dev` vs `migrate deploy`
- What to do if migrations fail

---

## 📊 Benefits of This Approach

✅ **Automatic Schema Sync**: Production always matches your code  
✅ **Version Control**: All schema changes tracked in Git  
✅ **Rollback Capability**: Can revert problematic migrations  
✅ **Team Collaboration**: Everyone follows same process  
✅ **Early Error Detection**: Catch issues before production  
✅ **Documentation**: Migration history is self-documenting  
✅ **Type Safety**: Prisma Client regenerates with schema changes  

---

## 🚨 Common Pitfalls to Avoid

❌ **Don't use `db push` in production** - It skips migration history  
❌ **Don't modify migrations after they're committed** - Creates inconsistencies  
❌ **Don't delete migrations** - Breaks migration history  
❌ **Don't skip `prisma generate`** - Leads to type mismatches  
❌ **Don't assume local = production** - Always validate

---

## 📞 Support

If you encounter schema issues:

1. Check migration status: `npx prisma migrate status`
2. Validate schema: `npx prisma validate`
3. Check Prisma logs in production
4. Review recent schema changes in Git history
5. Check DigitalOcean deployment logs

---

## 🔗 Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Database Migration Patterns](https://martinfowler.com/articles/evodb.html)

---

**Status**: Ready to implement  
**Priority**: High  
**Effort**: 2-4 hours initial setup, ongoing benefit

This guide ensures your production database schema will always match your code, preventing the type of error we just encountered.

