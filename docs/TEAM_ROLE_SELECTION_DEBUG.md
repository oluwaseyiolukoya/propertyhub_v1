# Team Role Selection Issue - Debug & Fix 🔧

## 🔴 Problem

In production, when creating a team member in the Developer Owner dashboard, it's not possible to select defined roles from the dropdown.

---

## 🔍 Diagnostic Steps

### **Step 1: Check if Roles are Loading**

Open browser console (F12) when on the Team Management page and check:

```javascript
// In browser console, check the Network tab
// Look for: GET /api/team/roles
// Status should be: 200 OK
// Response should contain array of roles

// Or run this in console:
fetch('/api/team/roles', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(d => console.log('Roles:', d))
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "role-owner",
      "name": "Owner",
      "description": "Full system control",
      "isSystemRole": true,
      "canApproveInvoices": true,
      "approvalLimit": null,
      "permissions": {"all": true},
      "memberCount": 0
    },
    {
      "id": "role-finance-manager",
      "name": "Finance Manager",
      "description": "Financial oversight & approval",
      "isSystemRole": true,
      "canApproveInvoices": true,
      "approvalLimit": 50000,
      "permissions": {...},
      "memberCount": 1
    },
    // ... more roles
  ]
}
```

---

### **Step 2: Check Frontend State**

In browser console, check if roles are in component state:

```javascript
// When the "Invite Team Member" modal is open
// Check the React DevTools or add console.log

// The roles should be populated in the Select component
```

---

### **Step 3: Check Database**

In production database, verify roles exist:

```sql
-- Check if system roles exist
SELECT id, name, is_system_role, customer_id 
FROM team_roles 
WHERE is_system_role = true;

-- Expected: 5 system roles
-- Owner, Finance Manager, Project Manager, Accountant, Viewer
```

---

## 🎯 Possible Causes & Solutions

### **Cause 1: Roles Not Created in Production Database**

**Symptom:**
- API returns empty array
- No roles visible in dropdown

**Solution:**

```bash
# SSH into production or use console
cd /workspace/backend

# Run the team management migration
PGPASSWORD=your_password psql -h your_db_host -U your_db_user -d contrezz -f migrations/create_team_management_system.sql

# This will create the 5 default system roles
```

**Or manually insert roles:**

```sql
-- Insert default system roles
INSERT INTO team_roles (id, name, description, is_system_role, permissions, can_approve_invoices, approval_limit) VALUES
('role-owner', 'Owner', 'Full system control and access to all features', true, '{"all": true}', true, NULL),
('role-finance-manager', 'Finance Manager', 'Financial oversight and invoice approval', true, '{"reports": "view", "expenses": "manage", "invoices": "approve", "projects": "view"}', true, 50000),
('role-project-manager', 'Project Manager', 'Project operations and management', true, '{"reports": "view", "invoices": "create", "projects": "manage"}', false, NULL),
('role-accountant', 'Accountant', 'Financial records and reporting', true, '{"reports": "view", "invoices": "view", "payments": "record"}', false, NULL),
('role-viewer', 'Viewer', 'Read-only access to projects and reports', true, '{"invoices": "view", "projects": "view"}', false, NULL)
ON CONFLICT (id) DO NOTHING;
```

---

### **Cause 2: API Authentication Issue**

**Symptom:**
- API returns 401 Unauthorized
- Network tab shows failed request

**Solution:**

Check if user is authenticated:

```javascript
// In browser console
console.log('Token:', localStorage.getItem('token'));

// If null or undefined, user needs to log in again
```

---

### **Cause 3: Customer ID Mismatch**

**Symptom:**
- API returns empty array
- Roles exist but not for this customer

**Solution:**

The backend query filters by customer_id OR is_system_role:

```typescript
// backend/src/routes/team.ts
const roles = await prisma.team_roles.findMany({
  where: {
    OR: [
      { customer_id: customerId },  // Customer-specific roles
      { is_system_role: true },     // System roles (should always show)
    ],
  },
});
```

System roles should ALWAYS appear because `is_system_role: true` doesn't require customer_id match.

---

### **Cause 4: Frontend Select Component Issue**

**Symptom:**
- Roles are loaded (check Network tab)
- But dropdown is empty or not clickable

**Solution:**

Check if the Select component is rendering correctly:

```typescript
// In TeamManagementTab.tsx
<Select value={memberForm.roleId} onValueChange={(value) => setMemberForm({ ...memberForm, roleId: value })}>
  <SelectTrigger>
    <SelectValue placeholder="Select a role" />
  </SelectTrigger>
  <SelectContent>
    {roles.map(role => (
      <SelectItem key={role.id} value={role.id}>
        {role.name} {role.isSystemRole && '(System)'}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

Add debug logging:

```typescript
// Add this before the Select component
{console.log('Roles available:', roles)}
{console.log('Current roleId:', memberForm.roleId)}
```

---

### **Cause 5: CSS/Z-Index Issue**

**Symptom:**
- Dropdown appears but is behind other elements
- Can't click on dropdown items

**Solution:**

Check if SelectContent has proper z-index:

```typescript
// Try adding a higher z-index
<SelectContent className="z-[9999]">
  {roles.map(role => (
    <SelectItem key={role.id} value={role.id}>
      {role.name}
    </SelectItem>
  ))}
</SelectContent>
```

---

## 🔧 Quick Fix Script

Run this in your production console to verify and fix:

```bash
#!/bin/bash
echo "=== Team Roles Diagnostic ==="
echo ""

# 1. Check if roles table exists
echo "1. Checking if team_roles table exists..."
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -U $DATABASE_USER -d contrezz -c "\dt team_roles" 2>&1 | grep -q "team_roles" && echo "✅ Table exists" || echo "❌ Table missing"
echo ""

# 2. Count system roles
echo "2. Counting system roles..."
ROLE_COUNT=$(PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -U $DATABASE_USER -d contrezz -t -c "SELECT COUNT(*) FROM team_roles WHERE is_system_role = true;")
echo "System roles found: $ROLE_COUNT"
if [ "$ROLE_COUNT" -eq 5 ]; then
    echo "✅ All 5 system roles exist"
else
    echo "❌ Missing system roles (expected 5, found $ROLE_COUNT)"
fi
echo ""

# 3. List all roles
echo "3. Listing all roles..."
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -U $DATABASE_USER -d contrezz -c "SELECT id, name, is_system_role FROM team_roles ORDER BY is_system_role DESC, name;"
echo ""

echo "=== Diagnostic Complete ==="
```

---

## 🚀 Immediate Fix

### **Option 1: Verify Roles Exist (Recommended)**

```bash
# In production console or SSH
cd /workspace/backend

# Check roles
npx prisma studio
# Navigate to team_roles table
# Verify 5 system roles exist

# Or use psql
echo $DATABASE_URL | sed 's/.*@//' | sed 's/\/.*//' # Get DB host
psql $DATABASE_URL -c "SELECT id, name FROM team_roles WHERE is_system_role = true;"
```

---

### **Option 2: Re-run Migration**

```bash
# In production
cd /workspace/backend

# Re-run the team management migration
npx prisma db push --accept-data-loss

# Then manually insert roles if needed
```

---

### **Option 3: Frontend Debug Mode**

Add temporary debug logging to see what's happening:

```typescript
// In TeamManagementTab.tsx, in loadData function
const loadData = async () => {
  setLoading(true);
  try {
    const [membersRes, rolesRes] = await Promise.all([
      getTeamMembers(),
      getTeamRoles(),
    ]);

    console.log('🔍 Roles Response:', rolesRes); // ADD THIS
    console.log('🔍 Roles Data:', rolesRes.data); // ADD THIS

    if (rolesRes.data) {
      console.log('✅ Setting roles:', rolesRes.data); // ADD THIS
      setRoles(rolesRes.data);
    } else {
      console.error('❌ No roles data'); // ADD THIS
    }
    
    // ... rest of code
  }
};
```

Commit and deploy this debug version, then check browser console.

---

## 📊 Verification Checklist

After applying fixes, verify:

- [ ] Database has 5 system roles
- [ ] API `/api/team/roles` returns roles (check Network tab)
- [ ] Browser console shows roles loaded
- [ ] Dropdown shows role options
- [ ] Can select a role
- [ ] Selected role appears in form
- [ ] Can submit form with selected role

---

## 🎯 Most Likely Issue

Based on the symptoms, the most likely causes are:

1. **System roles not created in production database** (80% likely)
   - Migration wasn't run in production
   - Solution: Run migration or manually insert roles

2. **API authentication issue** (15% likely)
   - Token expired or invalid
   - Solution: Re-login

3. **Frontend state issue** (5% likely)
   - Roles loaded but not set in state
   - Solution: Add debug logging

---

## 📞 Next Steps

1. **Check browser console** for errors
2. **Check Network tab** for `/api/team/roles` response
3. **Verify database** has system roles
4. **Run migration** if roles are missing
5. **Test** role selection after fix

---

## 🔗 Related Files

- Frontend: `src/modules/developer-dashboard/components/TeamManagementTab.tsx`
- API Client: `src/lib/api/team.ts`
- Backend: `backend/src/routes/team.ts`
- Migration: `backend/migrations/create_team_management_system.sql`
- Database: `team_roles` table

---

**Status:** Diagnostic guide created. Follow steps above to identify and fix the issue.

