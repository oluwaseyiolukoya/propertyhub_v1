# 🔍 DEBUG: Plan Names Not Showing

## IMMEDIATE ACTION: Check These Logs

### 1. Open Browser DevTools Console
- Press F12
- Go to **Console** tab
- Navigate to Customers in Admin Dashboard
- **Look for logs with 🔍 prefix** (the debug logs we added)

### Expected Output:
```
🔍 Customers fetched from API: [Array]
🔍 First customer plan data: {id: '...', name: 'Professional', monthlyPrice: 1200}
🔍 First customer full object: {...}
```

### 2. Check Backend Terminal
- Look at the backend logs running `npm run dev`
- **Look for logs with ✅ prefix**

### Expected Output:
```
✅ Customers fetched from database: 7
✅ First customer data: {
  "company": "Test Company",
  "plan": {
    "id": "f484e865-...",
    "name": "Professional",
    "monthlyPrice": 1200
  }
}
```

---

## SCENARIOS & SOLUTIONS

### Scenario A: Plan Data Exists in Console But Not in Table

**Issue**: Browser console shows plan, but table still shows "No Plan"

**Cause**: Frontend rendering bug in SuperAdminDashboard.tsx line 816

**Check**:
```typescript
const planName = customer.plan?.name || 'No Plan';
```

**Fix**: The code should be exactly as above. If different, that's the problem.

---

### Scenario B: Console Shows No Plan Data (undefined/null)

**Issue**: `🔍 First customer plan data: undefined`

**Cause**: Backend is not including the plan relation in the response

**Solution**: Check backend route has:
```typescript
include: {
  plan: true,  // ← MUST be present
  users: {...},
  _count: {...}
}
```

---

### Scenario C: Database Error → Falls Back to Mock Data

**Backend shows**:
```
prisma:error Invalid `prisma.customer.findMany()` invocation
```

**Solution**:
1. Check if DATABASE_URL is set: `cat backend/.env | grep DATABASE_URL`
2. Mock data includes plans, so should work anyway
3. Try: `npm run dev` in backend to restart

---

## CHECKLIST TO REPORT BACK

When you reply, tell me:

- [ ] What does browser console show?
  - Does it show the `🔍` logs?
  - Does it show the plan object?

- [ ] What do backend logs show?
  - Does it show `✅ Customers fetched from database`?
  - Does the plan object include `"name": "Professional"`?

- [ ] What shows in the table Plan column?
  - "Professional" / "Starter" / "Enterprise"?
  - "No Plan"?
  - Empty?
  - Nothing at all?

- [ ] Are there any red errors in the browser console?

---

## QUICK COMMANDS TO RUN

### Check if backend is properly returning plan data:

```bash
curl -H "Authorization: Bearer test" http://localhost:5000/api/customers | jq '.[0].plan'
```

Should show:
```json
{
  "id": "f484e865-...",
  "name": "Professional",
  "monthlyPrice": 1200
}
```

If shows `null` → backend is not including plan

---

**Action**: Check the logs and browser console NOW.  
**Then**: Reply with what you see.  
**Status**: 🔍 Investigation in progress...
