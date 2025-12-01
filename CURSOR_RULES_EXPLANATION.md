# Cursor AI Rules for Database Migration - Explanation

## 🎯 Purpose

The `.cursorrules` file contains strict guidelines that Cursor AI will follow to prevent database schema breakage. These rules were created after resolving a critical issue where manual database changes caused widespread "table does not exist" errors.

---

## 📋 What the Rules Do

### 1. **Prevent Manual Schema Changes**
The AI will **refuse** to suggest or generate:
- Manual `CREATE TABLE` commands
- Manual `ALTER TABLE` commands  
- Raw SQL for schema modifications
- `prisma db push` when migrations exist

### 2. **Enforce Proper Workflow**
The AI will **always** suggest:
- Editing `schema.prisma` first
- Using `bash scripts/create-migration.sh`
- Committing migrations to git immediately
- Running health checks before changes

### 3. **Provide Correct Guidance**
When you ask for database changes, the AI will:
- Guide you through the proper migration workflow
- Reference the documentation we created
- Explain why manual changes are dangerous
- Suggest the helper scripts we built

---

## 🎓 How to Use These Rules

### **Scenario 1: You Ask "Create a new table called users"**

**Without Rules (Bad):**
```bash
# AI might suggest:
psql -U user database <<EOF
CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT);
EOF
```
❌ This breaks Prisma's migration tracking!

**With Rules (Good):**
```typescript
// AI will suggest:
// 1. Edit backend/prisma/schema.prisma
model users {
  id   String @id @default(uuid())
  name String
}

// 2. Run migration script
// cd backend && bash scripts/create-migration.sh "add_users_table"

// 3. Commit to git
// git add prisma/migrations/ prisma/schema.prisma
// git commit -m "migration: add users table"
```
✅ This properly tracks the change!

---

### **Scenario 2: You Ask "Add an email column to users"**

**Without Rules (Bad):**
```bash
# AI might suggest:
psql -U user database -c "ALTER TABLE users ADD COLUMN email TEXT;"
```
❌ Prisma doesn't know about this change!

**With Rules (Good):**
```typescript
// AI will suggest:
// 1. Edit backend/prisma/schema.prisma
model users {
  id    String @id @default(uuid())
  name  String
  email String? // Add this
}

// 2. Run migration script
// cd backend && bash scripts/create-migration.sh "add_email_to_users"

// 3. Test and commit
```
✅ Change is properly tracked and versioned!

---

### **Scenario 3: You Ask "Fix the database schema"**

**Without Rules (Bad):**
```bash
# AI might suggest:
npx prisma db push
```
❌ This bypasses migration history!

**With Rules (Good):**
```bash
# AI will suggest:
# 1. Check what's wrong
cd backend && bash scripts/check-migration-health.sh

# 2. Create a sync migration if needed
cd backend && bash scripts/create-migration.sh "sync_schema"

# 3. Review and commit
```
✅ Maintains migration history!

---

## 🚨 What Happens If You Ignore the Rules

### **If You Manually Change the Database:**

1. **Immediate Impact:**
   - Prisma's migration history becomes out of sync
   - Other developers get different schema
   - Production might have different schema than local

2. **Errors You'll See:**
   ```
   Invalid `prisma.table_name.findMany()` invocation
   The table `public.table_name` does not exist in the current database.
   ```

3. **Time Wasted:**
   - Hours debugging "table does not exist" errors
   - Confusion about what schema is "correct"
   - Potential production downtime

### **If You Follow the Rules:**

1. **Benefits:**
   - ✅ Everyone has the same schema
   - ✅ All changes tracked in git
   - ✅ Can rollback if needed
   - ✅ No surprises in production
   - ✅ Clear history of all changes

2. **Time Saved:**
   - Zero debugging time
   - No production issues
   - Clear documentation
   - Happy team

---

## 🛠️ How Cursor Enforces These Rules

### **The AI Will:**

1. **Refuse Bad Suggestions**
   - If you ask for manual SQL, it will redirect you to migrations
   - If you ask for `db push`, it will suggest `migrate dev` instead

2. **Provide Correct Alternatives**
   - Always suggest the proper workflow
   - Reference the documentation we created
   - Explain why the proper way is better

3. **Remind You of Best Practices**
   - Commit migrations immediately
   - Run health checks before deploying
   - Test locally before pushing

4. **Reference Documentation**
   - Point you to the right guide
   - Explain the reasoning
   - Show examples

---

## 📚 Documentation Hierarchy

The rules reference these documents in order of detail:

1. **`QUICK_START_DATABASE_WORKFLOW.md`**
   - Quick reference for daily use
   - 4 commands you need
   - Common scenarios

2. **`MIGRATION_WORKFLOW.md`**
   - Complete step-by-step guide
   - All scenarios covered
   - Troubleshooting section

3. **`docs/WHY_DATABASE_BREAKS_AND_PERMANENT_SOLUTION.md`**
   - Deep dive into the problem
   - Root cause analysis
   - Emergency procedures

4. **`backend/scripts/README.md`**
   - How to use the helper scripts
   - What each script does
   - When to use them

---

## 🎯 Key Principles Enforced

### **1. Single Source of Truth**
- `schema.prisma` is the ONLY place to define schema
- Database should always match schema.prisma
- Never modify database to match schema manually

### **2. Migration History is Sacred**
- Never edit migration files after creation
- Never delete migration files
- Always commit migrations immediately

### **3. Proper Workflow Always**
- Edit schema.prisma first
- Create migration second
- Test third
- Commit fourth

### **4. No Shortcuts**
- Never use manual SQL for schema
- Never use `db push` with existing migrations
- Never skip the workflow steps

---

## ✅ Verification

### **To Test If Rules Are Working:**

1. Ask Cursor: "Create a table called products"
   - ✅ Should suggest editing schema.prisma
   - ❌ Should NOT suggest manual SQL

2. Ask Cursor: "Add a column to users"
   - ✅ Should suggest migration workflow
   - ❌ Should NOT suggest ALTER TABLE

3. Ask Cursor: "Fix the database"
   - ✅ Should suggest health check first
   - ❌ Should NOT suggest db push

---

## 🚀 Benefits of These Rules

### **For You:**
- ✅ Never waste time debugging schema issues
- ✅ Clear workflow to follow
- ✅ Confidence in database changes
- ✅ No production surprises

### **For Your Team:**
- ✅ Everyone follows same process
- ✅ No confusion about "correct" schema
- ✅ Easy onboarding for new developers
- ✅ Clear history of all changes

### **For Production:**
- ✅ Consistent schema across environments
- ✅ Safe deployments
- ✅ Ability to rollback
- ✅ No downtime from schema issues

---

## 🎓 Learning Resources

**If you want to understand WHY these rules exist:**
1. Read `docs/WHY_DATABASE_BREAKS_AND_PERMANENT_SOLUTION.md`
2. Review the git history of schema changes
3. Look at the migration files in `prisma/migrations/`

**If you want to learn HOW to follow the rules:**
1. Read `QUICK_START_DATABASE_WORKFLOW.md`
2. Practice with a test table
3. Use the helper scripts

**If you need help:**
1. Run `bash scripts/check-migration-health.sh`
2. Check `MIGRATION_WORKFLOW.md` for your scenario
3. Ask Cursor - it will guide you correctly!

---

## 🎉 Summary

**These Cursor rules ensure:**
- ✅ You always follow the proper workflow
- ✅ Database schema never breaks
- ✅ All changes are properly tracked
- ✅ Team stays in sync
- ✅ Production stays stable

**By enforcing these rules, Cursor AI becomes your:**
- 🛡️ **Guard** against bad practices
- 🎓 **Teacher** of proper workflow  
- 📚 **Reference** to documentation
- 🚀 **Guide** to success

---

**Remember:** These rules were created after fixing a critical production issue. They represent hard-won knowledge about what works and what breaks. Trust them, follow them, and your database will never break like that again! 🎊

---

**Created:** November 23, 2025  
**Purpose:** Prevent database schema breakage  
**Status:** Active & Enforced ✅




