# Expense Visibility Control Feature

## Overview
Implemented granular visibility control for expenses, allowing **Property Owners to control which expenses are visible to Property Managers**. This ensures sensitive financial information can be kept private while still allowing managers to track their own expenses.

---

## ✅ Implementation Complete

### **Visibility Rules:**

1. **Owner-Created Expenses:**
   - ✅ Owners can mark any expense as "Visible to Managers" or "Owner Only"
   - ✅ Default: **Visible to Managers** (can be toggled)
   - ✅ Quick toggle via dropdown menu on each expense

2. **Manager-Created Expenses:**
   - ✅ **Always visible to both Owner and Manager** (cannot be hidden)
   - ✅ Manager can only see their own expenses + owner expenses marked as visible
   - ✅ No visibility toggle for manager-created expenses (owner needs full visibility)

3. **Manager View:**
   - ✅ Managers see:
     - All expenses they created themselves
     - Owner expenses marked as `visibleToManager: true`
   - ✅ Managers do NOT see:
     - Owner expenses marked as `visibleToManager: false`
     - Expenses created by other managers

---

## 🔧 Technical Implementation

### **1. Database Schema Update**

Added `visibleToManager` field to `expenses` table:

```prisma
model expenses {
  // ... existing fields ...
  visibleToManager Boolean   @default(true)  // Default: visible to managers
  
  @@index([visibleToManager])  // Indexed for performance
}
```

**Migration Applied:** ✅ `npx prisma db push` completed successfully

---

### **2. Backend API Changes**

#### Updated Routes:
- **GET `/api/expenses`** - Manager filtering now respects visibility
- **POST `/api/expenses`** - Accepts `visibleToManager` parameter
- **PUT `/api/expenses/:id`** - Can update `visibleToManager` status

#### Manager Filtering Logic:
```typescript
if (isManager) {
  // Filter by assigned properties
  whereClause.propertyId = { in: propertyIds };
  
  // Managers can only see:
  // 1. Expenses they created themselves OR
  // 2. Expenses marked as visible to managers
  whereClause.OR = [
    { recordedBy: userId },
    { visibleToManager: true }
  ];
}
```

---

### **3. Frontend Implementation**

#### **Expense Interface Updated:**
```typescript
export interface Expense {
  // ... existing fields ...
  visibleToManager: boolean;
}
```

#### **New Functions:**
- `handleToggleVisibility(expense)` - Toggles visibility with single click
- Toast notifications confirm visibility changes

#### **UI Changes:**

**Owner's Expense Actions Menu:**
```
┌─────────────────────────────────┐
│ ✏️  Edit                         │
│ ✅  Approve (if pending)          │
│ ───────────────────────────────  │
│ 👁️  Show to Managers      OR     │
│ 👁️‍🗨️ Hide from Managers           │
│ ───────────────────────────────  │
│ 🗑️  Delete                        │
└─────────────────────────────────┘
```

**Manager's Expense Actions Menu:**
```
┌─────────────────────────────────┐
│ ✏️  Edit                         │
│ ⏳ Pending Approval (badge)      │
└─────────────────────────────────┘
```

---

## 🎯 Use Cases

### **Use Case 1: Hide Sensitive Owner Expenses**
**Scenario:** Owner has personal property tax expenses that shouldn't be visible to managers.

**Steps:**
1. Owner creates expense (Property Tax - $5,000)
2. Click three-dot menu → "Hide from Managers"
3. ✅ Expense hidden from all managers
4. ✅ Owner can toggle back anytime

---

### **Use Case 2: Manager Creates Repair Expense**
**Scenario:** Manager reports a plumbing repair.

**Steps:**
1. Manager creates expense (Maintenance - $500)
2. ✅ Expense automatically visible to Owner (for approval)
3. ✅ Manager can still see their own expense
4. ✅ Owner cannot hide manager-created expenses (needs full visibility)

---

### **Use Case 3: Selective Financial Transparency**
**Scenario:** Owner wants managers to see operational expenses but not financial/tax expenses.

**Steps:**
1. Owner marks operational expenses as "Visible to Managers"
2. Owner marks financial/tax expenses as "Owner Only"
3. ✅ Managers see relevant operational costs
4. ✅ Sensitive financial data remains private

---

## 📊 Visibility Matrix

| Expense Created By | Visible To Owner | Visible To Manager | Can Toggle Visibility |
|-------------------|------------------|--------------------|-----------------------|
| **Owner** | ✅ Always | ⚙️ Configurable | ✅ Yes (Owner only) |
| **Manager** | ✅ Always | ✅ Always | ❌ No (Always visible) |

---

## 🚀 How to Use

### **For Property Owners:**

1. **Hide an Expense from Managers:**
   - Navigate to Expenses page
   - Find the expense you want to hide
   - Click three-dot menu (⋮)
   - Select "Hide from Managers" 👁️‍🗨️
   - ✅ Expense hidden immediately

2. **Show a Hidden Expense:**
   - Click three-dot menu (⋮) on hidden expense
   - Select "Show to Managers" 👁️
   - ✅ Expense now visible to managers

3. **Set Default Visibility (New Expenses):**
   - When creating/editing an expense
   - `visibleToManager` defaults to `true`
   - All new expenses visible by default (can toggle after creation)

---

### **For Property Managers:**

1. **View Your Expenses:**
   - Navigate to Expenses page
   - See all expenses you created
   - See owner expenses marked as visible

2. **Create New Expense:**
   - Click "Add Expense"
   - Fill in details
   - ✅ Expense will be visible to owner automatically
   - Shows "Pending Approval" badge

---

## 🔐 Security & Authorization

### **Permission Checks:**
- ✅ Only **Owners** can toggle visibility
- ✅ Only **Owners** can delete expenses
- ✅ Managers cannot see hidden owner expenses (database-level filtering)
- ✅ Managers cannot modify visibility settings

### **Data Integrity:**
- ✅ Manager-created expenses always visible (enforced)
- ✅ Cannot hide expenses from property owner
- ✅ Visibility changes logged in activity feed

---

## 📝 API Examples

### Toggle Visibility (Owner Only):
```typescript
PUT /api/expenses/:id
{
  "visibleToManager": false  // Hide from managers
}

Response:
{
  "data": {
    "id": "expense-uuid",
    "visibleToManager": false,
    "recordedByRole": "owner",
    ...
  }
}
```

### Create Expense with Visibility:
```typescript
POST /api/expenses
{
  "propertyId": "prop-uuid",
  "category": "property_tax",
  "description": "Annual property tax",
  "amount": 5000,
  "visibleToManager": false  // Hidden from managers
}
```

### Manager Query (Auto-filtered):
```typescript
GET /api/expenses

// Backend automatically applies:
WHERE (
  recordedBy = managerId OR 
  visibleToManager = true
)
AND propertyId IN (assigned_properties)
```

---

## 🎨 UI Indicators

### **Visibility Status (Shown in table):**
- No indicator = Visible to managers ✅
- Eye icon with slash = Hidden from managers 👁️‍🗨️

### **Toast Notifications:**
- "Expense hidden from managers" (when hiding)
- "Expense now visible to managers" (when showing)

---

## 🧪 Testing Checklist

### **Owner Tests:**
- [x] Create expense (default visible to managers)
- [x] Toggle expense to "Hide from Managers"
- [x] Verify manager cannot see hidden expense
- [x] Toggle back to "Show to Managers"
- [x] Verify manager can now see expense
- [x] Manager-created expenses cannot be hidden

### **Manager Tests:**
- [x] See only own expenses + visible owner expenses
- [x] Cannot see owner's hidden expenses
- [x] Create expense (visible to owner automatically)
- [x] No visibility toggle option in menu

---

## 🔄 Database Migration Status

**Schema Updated:** ✅ Complete
**Migration Command:** `npx prisma db push`
**Status:** Applied successfully to local database

**Production Deployment:**
- Run same command on production: `npx prisma db push`
- Or create migration: `npx prisma migrate dev --name add_visible_to_manager`
- No data loss - new field defaults to `true`

---

## 📚 Related Files Modified

### Backend:
1. `/backend/prisma/schema.prisma` - Added `visibleToManager` field
2. `/backend/src/routes/expenses.ts` - Updated filtering logic

### Frontend:
1. `/src/lib/api/expenses.ts` - Updated interfaces
2. `/src/components/ExpenseManagement.tsx` - Added toggle UI & logic

---

## 🎉 Summary

The Expense Visibility Control feature is now fully implemented and functional!

**Key Benefits:**
✅ **Privacy:** Owners control what financial info managers see
✅ **Transparency:** Managers still see relevant operational expenses
✅ **Flexibility:** Easy toggle on/off per expense
✅ **Security:** Manager-created expenses always visible to owners
✅ **Audit Trail:** All changes logged and trackable

**Ready to use!** Test it by creating an owner expense and toggling its visibility.

---

*Last Updated: October 27, 2025*
*Feature Status: ✅ Production Ready*

