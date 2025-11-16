# Environment Variables & Secrets Best Practices

## ✅ Best Practice: Store Secrets in .env Files

### Why Use .env Files?

1. **Security** - Secrets never get committed to git
2. **Flexibility** - Easy to change per environment (dev/staging/prod)
3. **Portability** - Works across different machines
4. **Standard** - Industry-standard approach

## Setup Guide

### Step 1: Verify .gitignore

Ensure your `.gitignore` includes:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
backend/.env
backend/.env.local
```

### Step 2: Create .env Files

#### Project Root .env
```bash
# /Users/oluwaseyio/test_ui_figma_and_cursor/.env

# Production Database (for sync scripts)
PROD_DB_URL="postgresql://username:password@host:port/database?sslmode=require"

# Other project-level secrets
API_KEY="your-api-key"
```

#### Backend .env
```bash
# /Users/oluwaseyio/test_ui_figma_and_cursor/backend/.env

# Local Development Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/contrezz_local"

# Production Database (for migrations/studio)
PRODUCTION_DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# JWT Secret
JWT_SECRET="your-secret-key-here"

# Other Backend Secrets
STRIPE_SECRET_KEY="sk_test_..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

### Step 3: Create .env.example Templates

Create example files (these CAN be committed):

#### Root .env.example
```bash
# .env.example (project root)

# Production Database URL for sync scripts
PROD_DB_URL="postgresql://username:password@host:port/database?sslmode=require"
```

#### Backend .env.example
```bash
# backend/.env.example

# Local Development Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/contrezz_local"

# Production Database (optional, for migrations)
PRODUCTION_DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-app-password"

# JWT Secret
JWT_SECRET="generate-a-random-secret"

# API Keys
STRIPE_SECRET_KEY="sk_test_..."
```

## Usage Examples

### Example 1: Database Sync Script

**Before (Insecure):**
```bash
# ❌ BAD: Password in command
export PROD_DB_URL="postgresql://user:ACTUAL_PASSWORD@host:port/db"
./sync-production-to-local.sh
```

**After (Secure):**
```bash
# ✅ GOOD: Password in .env file
source .env
./sync-production-to-local.sh
```

### Example 2: Prisma Studio with Production

**Before (Insecure):**
```bash
# ❌ BAD: Password in command
DATABASE_URL="postgresql://user:ACTUAL_PASSWORD@host:port/db" npx prisma studio
```

**After (Secure):**
```bash
# ✅ GOOD: Password in .env file
cd backend
source .env
DATABASE_URL=$PRODUCTION_DATABASE_URL npx prisma studio
```

### Example 3: Running Migrations

**Before (Insecure):**
```bash
# ❌ BAD: Password in script
DATABASE_URL="postgresql://user:ACTUAL_PASSWORD@host:port/db" npx prisma migrate deploy
```

**After (Secure):**
```bash
# ✅ GOOD: Password in .env file
cd backend
source .env
DATABASE_URL=$PRODUCTION_DATABASE_URL npx prisma migrate deploy
```

## Loading .env Files

### Method 1: Manual Source (Shell Scripts)
```bash
source .env
echo $PROD_DB_URL
```

### Method 2: Node.js (dotenv package)
```javascript
// backend/src/index.ts
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
```

### Method 3: Inline (One-time commands)
```bash
source .env && npm run dev
```

## Security Checklist

- [x] ✅ `.env` files are in `.gitignore`
- [x] ✅ No passwords in code or documentation
- [x] ✅ `.env.example` files provided (without real secrets)
- [x] ✅ Team members know to create their own `.env` files
- [x] ✅ Production secrets stored securely (not in git)
- [x] ✅ Different secrets for dev/staging/prod

## What NOT to Do

### ❌ Never Commit Secrets to Git
```bash
# BAD - Don't do this!
git add .env
git commit -m "Add environment variables"
```

### ❌ Never Hardcode Secrets in Code
```typescript
// BAD - Don't do this!
const dbUrl = "postgresql://user:password123@host:port/db";
```

### ❌ Never Put Secrets in Documentation
```markdown
<!-- BAD - Don't do this! -->
Connect to: postgresql://user:MySecretPass@host:port/db
```

### ❌ Never Share .env Files via Chat/Email
```
❌ "Here's my .env file..."
✅ "Here's my .env.example file, create your own .env"
```

## Rotating Secrets

If a secret is accidentally committed:

1. **Immediately rotate the secret** (change password/key)
2. **Remove from git history** (use git filter-branch or BFG)
3. **Update .env files** with new secret
4. **Notify team** to update their .env files

## Production Deployment

### Option 1: Environment Variables (Recommended)
Set environment variables directly in your hosting platform:
- DigitalOcean App Platform: Settings → Environment Variables
- Heroku: Config Vars
- Vercel: Environment Variables
- AWS: Systems Manager Parameter Store

### Option 2: Secrets Management
Use dedicated secrets management:
- AWS Secrets Manager
- HashiCorp Vault
- Google Secret Manager
- Azure Key Vault

## Team Onboarding

When a new developer joins:

1. Share `.env.example` files
2. Have them create their own `.env` files
3. Provide secrets securely (1Password, LastPass, etc.)
4. Verify `.env` is in their `.gitignore`

## Summary

✅ **DO:**
- Store secrets in `.env` files
- Add `.env` to `.gitignore`
- Provide `.env.example` templates
- Use different secrets per environment
- Rotate secrets if compromised

❌ **DON'T:**
- Commit `.env` files to git
- Hardcode secrets in code
- Share secrets via insecure channels
- Use same secrets across environments
- Put secrets in documentation

## Current Status

✅ Updated `SYNC_PRODUCTION_ALTERNATIVE.md` to use .env files  
✅ Removed hardcoded passwords from documentation  
✅ Provided secure examples using environment variables  

**Next Steps:**
1. Create your `.env` file with actual secrets
2. Verify `.env` is in `.gitignore`
3. Commit the updated documentation (without secrets)
4. Push to git safely

