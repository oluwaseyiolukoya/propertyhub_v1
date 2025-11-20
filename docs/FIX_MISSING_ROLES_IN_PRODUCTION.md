# Fix Missing Roles in Production 🔧

## 🎯 Problem
Project creation works, but role dropdown is empty in production.

## ⚠️ IMPORTANT: Do NOT Use `db push` in Production!

**NEVER run this in production:**
```bash
❌ npx prisma db push --accept-data-loss  # DANGEROUS!
```

**Why?**
- Can cause **data loss**
- Bypasses migration history
- Can break existing data
- Not reversible
- Against best practices

---

## ✅ Safe Solution: Run the Script

### **Step 1: Check if Migration Ran**

In production console:

```bash
cd /workspace/backend

# Check migration status
npx prisma migrate status
```

**Expected output:**
```
Database schema is up to date!
```

If you see "pending migrations", run:
```bash
npx prisma migrate deploy
```

---

### **Step 2: Check if Roles Exist**

```bash
cd /workspace/backend

# Quick check
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.team_roles.count({where:{is_system_role:true}}).then(c=>console.log('System roles:',c)).finally(()=>p.\$disconnect());"
```

**If output is `0`**, roles are missing. Continue to Step 3.

---

### **Step 3: Run the Safe Insertion Script**

```bash
cd /workspace/backend

# Run the script
node scripts/insert-system-roles-safe.js
```

**Expected output:**
```
🚀 Starting system roles insertion...

1️⃣ Checking if team_roles table exists...
✅ team_roles table exists

2️⃣ Checking existing system roles...
   Found 0 existing system roles

3️⃣ Inserting/updating system roles...

   ✅ Inserted: Owner
   ✅ Inserted: Finance Manager
   ✅ Inserted: Project Manager
   ✅ Inserted: Accountant
   ✅ Inserted: Viewer

4️⃣ Summary:
   ✅ Inserted: 5
   🔄 Updated: 0
   ⏭️  Skipped: 0
   📊 Total: 5

5️⃣ Verifying...

✅ SUCCESS! 5 system roles in database:

   1. Owner
      ID: role-owner
      Description: Full access to all features

   2. Finance Manager
      ID: role-finance-manager
      Description: Approve invoices and manage finances

   3. Project Manager
      ID: role-project-manager
      Description: Create invoices and manage projects

   4. Accountant
      ID: role-accountant
      Description: Record payments and view reports

   5. Viewer
      ID: role-viewer
      Description: View-only access

🎉 System roles are ready!
```

---

### **Step 4: Verify in UI**

1. Go to your production app
2. Log in as Developer Owner
3. Go to **Settings → Team**
4. Click **"Invite Team Member"**
5. Check the **Role dropdown**
6. Should show **5 options**! ✅

---

## 🔍 Troubleshooting

### **Issue 1: Table doesn't exist**

**Error:**
```
❌ ERROR: team_roles table does not exist!
```

**Solution:**
```bash
# Run migrations first
npx prisma migrate deploy

# Then run the script again
node scripts/insert-system-roles-safe.js
```

---

### **Issue 2: Script file not found**

**Error:**
```
Error: Cannot find module 'scripts/insert-system-roles-safe.js'
```

**Solution:**
The script is in the latest commit. You need to:

```bash
# Pull latest code
cd /workspace
git pull origin main

# Navigate to backend
cd backend

# Run the script
node scripts/insert-system-roles-safe.js
```

---

### **Issue 3: Prisma Client not found**

**Error:**
```
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
# Regenerate Prisma Client
cd /workspace/backend
npx prisma generate

# Run the script again
node scripts/insert-system-roles-safe.js
```

---

## 📊 Why Roles Might Be Missing

### **Possible Causes:**

1. **Migration didn't run:**
   - Build command might have failed
   - Migration file wasn't in the deployment
   - Database connection issue during build

2. **INSERT statements didn't execute:**
   - SQL syntax error in migration
   - Constraint violation
   - Transaction rollback

3. **Wrong database:**
   - Script ran against local DB instead of production
   - Environment variable misconfigured

---

## ✅ Best Practice: Why This Approach is Safe

### **Our Approach:**
```javascript
// 1. Check if table exists
// 2. Check existing roles
// 3. Upsert (insert or update)
// 4. Verify final state
```

**Benefits:**
- ✅ **Safe:** Won't delete existing data
- ✅ **Idempotent:** Can run multiple times safely
- ✅ **Verbose:** Shows exactly what's happening
- ✅ **Verifiable:** Confirms success at the end
- ✅ **Reversible:** Can be undone if needed

### **vs. `db push --accept-data-loss`:**
```bash
npx prisma db push --accept-data-loss
```

**Risks:**
- ❌ Can drop tables
- ❌ Can lose data
- ❌ No migration history
- ❌ No rollback
- ❌ Can break production

---

## 🚀 Alternative: Commit Script and Redeploy

If you prefer automation:

### **Step 1: Commit the Script**

```bash
# On your local machine
git add backend/scripts/insert-system-roles-safe.js
git commit -m "feat: add safe system roles insertion script"
git push origin main
```

### **Step 2: Update Build Command**

Edit `.do/app.yaml`:

```yaml
services:
  - name: backend
    build_command: |
      npm ci && 
      npx prisma migrate deploy && 
      node scripts/insert-system-roles-safe.js && 
      npm run build
```

This will automatically insert roles on every deployment.

---

## 📝 Summary

### **DO:**
- ✅ Use `npx prisma migrate deploy`
- ✅ Run safe insertion scripts
- ✅ Verify before and after
- ✅ Check migration status
- ✅ Use upsert operations

### **DON'T:**
- ❌ Use `db push` in production
- ❌ Use `--accept-data-loss` flag
- ❌ Run untested SQL directly
- ❌ Skip verification steps
- ❌ Bypass migration system

---

## 🎯 Quick Command Reference

```bash
# Check migration status
npx prisma migrate status

# Run pending migrations
npx prisma migrate deploy

# Check role count
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.team_roles.count({where:{is_system_role:true}}).then(c=>console.log('Roles:',c)).finally(()=>p.\$disconnect());"

# Insert roles safely
node scripts/insert-system-roles-safe.js

# Verify roles
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.team_roles.findMany({where:{is_system_role:true},select:{name:true}}).then(r=>r.forEach(x=>console.log('-',x.name))).finally(()=>p.\$disconnect());"
```

---

## ✅ Expected Final State

After running the script:

```bash
# In production console
cd /workspace/backend
node scripts/insert-system-roles-safe.js

# Output should show:
✅ SUCCESS! 5 system roles in database
```

Then in the UI:
- Role dropdown shows 5 options
- Can invite team members
- Can assign roles
- Everything works! 🎉

---

## 🆘 If Nothing Works

Contact me with:
1. Output of `npx prisma migrate status`
2. Output of the insertion script
3. Any error messages
4. Screenshot of the role dropdown

I'll help debug further!

