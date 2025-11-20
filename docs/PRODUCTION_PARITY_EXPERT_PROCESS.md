# Production Parity - Expert Process 🎯

## Overview

This document describes the **expert, sustainable process** for ensuring your local development environment and production are **always in perfect sync** for:

- ✅ Database schema
- ✅ System data (roles, templates, etc.)
- ✅ Application code
- ✅ Environment configuration

---

## 🎯 Core Principle

**Single Source of Truth → Git → All Environments**

Everything flows in one direction:

```
Local Development
    ↓ (commit + push)
Git Repository (main branch)
    ↓ (auto-deploy)
Production
```

No manual changes in production. Ever.

---

## 🚀 Quick Start (Run This Now)

### In Production Console:

```bash
cd /workspace/backend

# Step 1: Run full sync (brings production to 100% parity)
bash scripts/production-full-sync.sh

# Step 2: Verify everything is correct
bash scripts/verify-production-parity.sh
```

That's it! Production is now in perfect sync.

---

## 📋 What the Scripts Do

### `production-full-sync.sh`

**Phases:**

1. **Pre-flight checks**
   - Verifies DATABASE_URL, Prisma CLI, Node.js

2. **Schema migrations**
   - Runs `npx prisma migrate deploy`
   - Regenerates Prisma Client

3. **Notification system setup**
   - Applies `create_notification_system.sql`
   - Fixes notification triggers
   - Adds team invitation template

4. **System data seeding**
   - Seeds 5 system roles (Owner, Finance Manager, etc.)
   - Uses upsert (safe to run multiple times)

5. **Verification**
   - Checks role count
   - Checks notification templates
   - Verifies SMTP configuration

6. **Summary**
   - Reports what was done
   - Provides next steps

### `verify-production-parity.sh`

**Checks:**

- ✅ All required tables exist
- ✅ System roles are present (5 roles)
- ✅ Notification templates exist
- ✅ SMTP environment variables are set
- ✅ Prisma migration status

**Exit codes:**
- `0` = All checks passed
- `1` = Errors found (run sync script)

---

## 🔄 Ongoing Workflow

### When You Make Changes Locally:

#### 1. **Schema Changes**

```bash
cd backend

# Edit prisma/schema.prisma
# Then create migration:
npx prisma migrate dev --name describe_your_change

# Test locally
npm run dev
```

#### 2. **System Data Changes** (roles, templates, etc.)

Add to a migration file or create a new `.sql` file in `backend/migrations/`:

```sql
-- Example: Add new notification template
INSERT INTO notification_templates (type, subject, body_html, created_at, updated_at)
VALUES (
  'new_template_type',
  'Subject Here',
  '<html>Body here</html>',
  NOW(),
  NOW()
)
ON CONFLICT (type) DO NOTHING;
```

#### 3. **Code Changes**

Just edit the code. No special steps.

#### 4. **Commit and Push**

```bash
git add .
git commit -m "feat: describe your change"
git push origin main
```

#### 5. **Production Deployment**

DigitalOcean automatically:
- Pulls latest code
- Runs `npm ci`
- Runs `npx prisma migrate deploy` (via `.do/app.yaml`)
- Runs `npm run build`
- Deploys

#### 6. **Verify in Production** (optional but recommended)

```bash
# In production console
cd /workspace/backend
bash scripts/verify-production-parity.sh
```

---

## 🛠️ How It Works

### Schema Parity

**Source of truth:** `backend/prisma/schema.prisma` + `backend/prisma/migrations/**`

**Local:**
```bash
npx prisma migrate dev
```

**Production:**
```bash
npx prisma migrate deploy  # Runs automatically on deploy
```

### System Data Parity

**Source of truth:** SQL files in `backend/migrations/*.sql` + inline seeds in sync script

**Files:**
- `create_notification_system.sql` - Creates notification tables
- `fix_notification_preferences_trigger.sql` - Fixes trigger bug
- `add_team_invitation_template.sql` - Adds team invitation template
- System roles - Seeded via inline script (idempotent)

**Application:**
- Local: Run manually or via seed script
- Production: Run via `production-full-sync.sh`

### Code Parity

**Source of truth:** Git `main` branch

**Deployment:**
- DigitalOcean App Platform auto-deploys from `main`
- Every push triggers a new deployment

### Environment Parity

**Source of truth:** 
- Local: `backend/.env`
- Production: DigitalOcean App Platform environment variables

**Critical variables:**
- `DATABASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `JWT_SECRET`

---

## 🔍 Troubleshooting

### Issue: "No pending migrations to apply"

**Cause:** Production already has all migrations in the deployed commit.

**Solution:** 
- If you just created a migration locally, commit and push it first.
- Then deployment will apply it automatically.

### Issue: "System roles count: 0"

**Cause:** Roles were never seeded.

**Solution:**
```bash
cd /workspace/backend
bash scripts/production-full-sync.sh
```

### Issue: "notification_templates table may not exist"

**Cause:** Notification system migration was never applied.

**Solution:**
```bash
cd /workspace/backend
bash scripts/production-full-sync.sh
```

### Issue: "Team invitation email not sent"

**Possible causes:**
1. Missing notification templates
2. SMTP env vars not set
3. Email queue not processing

**Solution:**
```bash
# 1. Run full sync
bash scripts/production-full-sync.sh

# 2. Check SMTP vars
echo $SMTP_FROM
echo $SMTP_HOST

# 3. Check email queue
node -e 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.email_queue.findMany({orderBy:{created_at:"desc"},take:10}).then(r=>console.log(r)).finally(()=>p.$disconnect());'

# 4. Manually process queue
curl -X POST "https://your-domain/api/notifications/process-queue"
```

### Issue: Local `migrate dev` fails with shadow DB error

**Cause:** Local database is out of sync or corrupted.

**Solution:**
```bash
cd backend

# Option 1: Reset local database (DESTRUCTIVE)
npx prisma migrate reset

# Option 2: Drop and recreate local database manually
# Then run:
npx prisma migrate dev
```

---

## 📊 Verification Checklist

After running the sync script, verify:

- [ ] **Prisma migrations status**
  ```bash
  npx prisma migrate status
  # Should show: "Database schema is up to date!"
  ```

- [ ] **System roles (5)**
  ```bash
  node -e 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.team_roles.findMany({where:{is_system_role:true},select:{name:true}}).then(r=>{console.log("Count:",r.length);r.forEach(x=>console.log("-",x.name))}).finally(()=>p.$disconnect());'
  ```

- [ ] **Notification templates**
  ```bash
  node -e 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.notification_templates.findMany({select:{type:true}}).then(r=>{console.log("Count:",r.length);r.forEach(x=>console.log("-",x.type))}).finally(()=>p.$disconnect());'
  ```

- [ ] **SMTP configuration**
  ```bash
  echo "SMTP_FROM: $SMTP_FROM"
  echo "SMTP_HOST: $SMTP_HOST"
  ```

- [ ] **UI Tests**
  - Settings → Team → Invite Team Member → Role dropdown shows 5 roles
  - Invite a test user → Email is received
  - Create a project → No errors
  - Upload an invoice attachment → Storage quota updates

---

## 🎯 Best Practices

### DO ✅

- **Always** use Prisma migrations for schema changes
- **Always** commit migrations to Git
- **Always** test locally before pushing
- **Always** use idempotent SQL (`ON CONFLICT DO NOTHING`, `IF NOT EXISTS`)
- **Always** run verification script after major changes
- **Always** keep SMTP env vars in sync

### DON'T ❌

- **Never** use `npx prisma db push` in production
- **Never** use `--accept-data-loss` flag
- **Never** manually edit production database
- **Never** commit `.env` files
- **Never** skip migrations
- **Never** make schema changes directly in production

---

## 📝 File Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Schema definition
│   └── migrations/                # Prisma migrations
│       ├── 20251108_*/
│       ├── 20251109_*/
│       └── ...
├── migrations/                    # Raw SQL migrations
│   ├── create_notification_system.sql
│   ├── fix_notification_preferences_trigger.sql
│   └── add_team_invitation_template.sql
└── scripts/
    ├── production-full-sync.sh    # Master sync script
    └── verify-production-parity.sh # Verification script
```

---

## 🚀 Summary

**To reach 100% parity right now:**

```bash
# In production console
cd /workspace/backend
bash scripts/production-full-sync.sh
bash scripts/verify-production-parity.sh
```

**To maintain parity going forward:**

1. Make changes locally
2. Create migrations (`npx prisma migrate dev`)
3. Test locally
4. Commit and push
5. DigitalOcean auto-deploys
6. Verify with `verify-production-parity.sh`

**That's it!** No more one-off fixes. Everything is automated, versioned, and reproducible.

---

## 🆘 Need Help?

If verification fails or you encounter issues:

1. Check the error message
2. Look in the Troubleshooting section above
3. Run `production-full-sync.sh` again (it's idempotent)
4. Check DigitalOcean runtime logs for errors

---

**Last Updated:** 2025-11-20  
**Status:** ✅ Production-Ready

