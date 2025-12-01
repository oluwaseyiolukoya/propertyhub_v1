# 📋 Database Change Checklist

**Print this and keep it visible!**

---

## ✅ Before Making ANY Database Change

- [ ] I have read `QUICK_START_DATABASE_WORKFLOW.md`
- [ ] I understand why manual SQL is forbidden
- [ ] I have run `bash scripts/check-migration-health.sh`
- [ ] Health check passed with no errors

---

## ✅ Making the Change

- [ ] I edited `backend/prisma/schema.prisma` FIRST
- [ ] I did NOT use `psql` to create/alter tables
- [ ] I did NOT use `prisma db push`
- [ ] I ran `bash scripts/create-migration.sh "my_change"`
- [ ] Migration was created successfully
- [ ] I reviewed the generated SQL in `prisma/migrations/`

---

## ✅ Testing

- [ ] I ran `npm run dev` locally
- [ ] Application starts without errors
- [ ] I tested the affected features
- [ ] Everything works as expected
- [ ] No console errors related to database

---

## ✅ Committing

- [ ] I ran `git status` to see changes
- [ ] Migration files are in `prisma/migrations/`
- [ ] I ran `git add prisma/migrations/ prisma/schema.prisma`
- [ ] I ran `git commit -m "migration: describe_my_change"`
- [ ] I did NOT edit the migration files
- [ ] I did NOT delete any migration files

---

## ✅ Before Deploying

- [ ] I ran `bash scripts/check-migration-health.sh` again
- [ ] All checks passed
- [ ] I pushed to git: `git push origin main`
- [ ] I verified migrations are in the repository
- [ ] I have a database backup (production only)

---

## ✅ After Deploying

- [ ] Deployment completed successfully
- [ ] I checked application logs
- [ ] No migration errors in logs
- [ ] Application is running normally
- [ ] I verified the change in production

---

## 🚨 RED FLAGS (STOP if you see these!)

- [ ] ❌ Someone suggests using `psql` to create tables
- [ ] ❌ Someone suggests using `ALTER TABLE` directly
- [ ] ❌ Someone suggests using `prisma db push`
- [ ] ❌ Someone suggests editing migration files
- [ ] ❌ Someone suggests deleting migration files
- [ ] ❌ Health check fails but you want to proceed anyway
- [ ] ❌ Migration files are not committed to git

**If you see ANY of these, STOP and consult:**
- `docs/WHY_DATABASE_BREAKS_AND_PERMANENT_SOLUTION.md`
- Ask Cursor AI for guidance (it will follow the rules)

---

## 🎯 The Golden Rules

### ✅ ALWAYS DO:
1. Edit `schema.prisma` first
2. Use `bash scripts/create-migration.sh`
3. Test locally
4. Commit immediately
5. Run health check before deploying

### ❌ NEVER DO:
1. Manual SQL for schema changes
2. `prisma db push` with existing migrations
3. Edit migration files after creation
4. Delete migration files
5. Skip committing migrations

---

## 📞 Need Help?

**Quick Reference:**
```bash
# Check health
cd backend && bash scripts/check-migration-health.sh

# Create migration
cd backend && bash scripts/create-migration.sh "name"

# Check status
cd backend && npx prisma migrate status
```

**Documentation:**
- Quick Start: `QUICK_START_DATABASE_WORKFLOW.md`
- Full Guide: `MIGRATION_WORKFLOW.md`
- Why It Matters: `docs/WHY_DATABASE_BREAKS_AND_PERMANENT_SOLUTION.md`

**Ask Cursor AI:**
- It follows strict rules to prevent mistakes
- It will guide you through the proper workflow
- It will refuse to suggest dangerous commands

---

## 🎉 Success!

**You followed the proper workflow when:**
- ✅ All checkboxes above are checked
- ✅ Health check passes
- ✅ Application works
- ✅ Changes are committed
- ✅ No manual SQL was used

**Congratulations! Your database change is safe and properly tracked!** 🎊

---

**Print Date:** _______________  
**Last Updated:** November 23, 2025  
**Version:** 1.0




