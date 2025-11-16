# 📋 View and Edit Expenses - Complete Guide

## 🎉 **Feature Complete!**

You can now **view**, **search**, **filter**, and **edit** all your project expenses in the Developer Dashboard.

---

## 📍 **Where to See Your Expenses**

### **Location:** Project Dashboard → Scroll down to "Project Expenses" section

```
┌─────────────────────────────────────────────────────────────┐
│  Project Dashboard                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                              │
│  [KPI Cards]                                                 │
│  [Charts]                                                    │
│  [Recent Activity]                                           │
│                                                              │
│  ↓ SCROLL DOWN ↓                                            │
│                                                              │
│  💸 Project Expenses                       [Refresh]        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Total: ₦517M  │  Paid: ₦517M  │  Pending: ₦0         │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ [Search] [Category Filter] [Status Filter]             │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Date    │ Description  │ Category │ Amount │ [Edit]   │ │
│  │ Oct 18  │ Construction │ Labor    │ ₦93.5M │ [✏️]    │ │
│  │ Oct 28  │ Materials    │ Materials│ ₦38.5M │ [✏️]    │ │
│  │ ...     │ ...          │ ...      │ ...    │ ...      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 **Features**

### **1. Summary Cards**
At the top of the expenses list, you'll see three summary cards:

- **Total Expenses** - Sum of all expenses (filtered)
- **Paid** - Sum of paid expenses
- **Pending** - Sum of pending expenses

### **2. Search & Filters**

#### **Search Bar:**
- Search by description or category
- Real-time filtering as you type
- Example: Search "construction" to find all construction-related expenses

#### **Category Filter:**
- Filter by specific category (Labor, Materials, Equipment, etc.)
- Or select "All Categories" to see everything

#### **Status Filter:**
- Filter by payment status (Paid, Pending, Partial)
- Or select "All Status" to see everything

### **3. Expenses Table**

The table shows:
- **Date** - When the expense was paid
- **Description** - What the expense is for
- **Category** - Expense category with icon
- **Amount** - Total amount (with tax breakdown)
- **Status** - Payment status badge
- **Actions** - Edit button

---

## ✏️ **How to Edit an Expense**

### **Step-by-Step:**

1. **Navigate to Project Dashboard**
   - Click on a project from Portfolio Overview

2. **Scroll down to "Project Expenses"**
   - Located below the charts and recent activity

3. **Find the expense you want to edit**
   - Use search or filters to find it quickly

4. **Click the Edit button (✏️)**
   - Located in the "Actions" column on the right

5. **Edit Expense Modal opens**
   - All fields are pre-filled with current values

6. **Make your changes:**
   - Change category
   - Update description
   - Modify amount or tax
   - Change payment date
   - Update payment status
   - Add/edit notes

7. **Click "Update Expense"**
   - Expense is saved
   - Dashboard refreshes automatically
   - Charts update (Spend by Category, Cash Flow)

8. **Success!**
   - Toast notification confirms update
   - Modal closes
   - See updated expense in the list

---

## 📊 **What You Can Edit**

| Field | Can Edit | Notes |
|-------|----------|-------|
| Category | ✅ Yes | Select from predefined categories |
| Description | ✅ Yes | Update expense description |
| Amount | ✅ Yes | Change base amount |
| Tax Amount | ✅ Yes | Update tax amount |
| Payment Date | ✅ Yes | Change when it was paid |
| Payment Status | ✅ Yes | Change to Paid/Pending/Partial |
| Notes | ✅ Yes | Add or update notes |
| Currency | ❌ No | Set at project level |
| Created Date | ❌ No | Automatically tracked |

---

## 🎯 **Use Cases**

### **1. Fix Incorrect Amount**
```
Scenario: You entered ₦93,500,000 but it should be ₦95,000,000

Steps:
1. Find the expense in the list
2. Click Edit button
3. Change amount from 93,500,000 to 95,000,000
4. Click "Update Expense"
5. Done! Charts update automatically
```

### **2. Change Payment Status**
```
Scenario: Expense was marked as "Pending" but has now been paid

Steps:
1. Find the expense in the list
2. Click Edit button
3. Change status from "Pending" to "Paid"
4. Update payment date to today
5. Click "Update Expense"
6. Done! Now appears in Cash Flow chart
```

### **3. Recategorize Expense**
```
Scenario: Expense was categorized as "Other" but should be "Labor"

Steps:
1. Find the expense in the list
2. Click Edit button
3. Change category from "Other" to "Labor & Payroll"
4. Click "Update Expense"
5. Done! Spend by Category chart updates
```

### **4. Add Missing Details**
```
Scenario: You want to add notes or invoice numbers

Steps:
1. Find the expense in the list
2. Click Edit button
3. Scroll to "Notes" field
4. Add details (e.g., "Invoice #INV-2025-001")
5. Click "Update Expense"
6. Done! Notes are saved and visible in the table
```

---

## 🔄 **Automatic Updates After Editing**

When you edit an expense, these update automatically:

✅ **Expenses List** - Shows updated values immediately  
✅ **Summary Cards** - Totals recalculate  
✅ **Spend by Category Chart** - Updates if category changed  
✅ **Cash Flow Chart** - Updates if amount or status changed  
✅ **Budget Tracking** - Actual spend updates  
✅ **KPI Cards** - Project totals update  

---

## 💡 **Tips & Best Practices**

### **For Searching:**
- Use partial words (e.g., "const" finds "Construction")
- Search is case-insensitive
- Searches both description and category

### **For Filtering:**
- Combine search + category + status for precise results
- Use "Pending" filter to see what needs to be paid
- Use category filter to analyze spend in specific areas

### **For Editing:**
- Always double-check amounts before saving
- Add notes for future reference
- Update payment status when payments are made
- Keep payment dates accurate for cash flow tracking

### **For Organization:**
- Use consistent naming in descriptions
- Add invoice numbers in notes
- Update status promptly when paid
- Review expenses regularly

---

## 📈 **Sample Workflow**

### **Weekly Expense Review:**

```
Monday Morning:
1. Open Project Dashboard
2. Scroll to Project Expenses
3. Filter by "Pending" status
4. Review all pending expenses
5. For each paid expense:
   - Click Edit
   - Change status to "Paid"
   - Update payment date
   - Save
6. Check updated Cash Flow chart
7. Export report if needed
```

---

## 🐛 **Troubleshooting**

### **Can't see expenses?**
- Check you're on the correct project
- Scroll down to "Project Expenses" section
- Check filters (might be filtering out expenses)
- Click "Refresh" button

### **Edit button not working?**
- Check you have permission to edit
- Refresh the page
- Check browser console for errors

### **Changes not saving?**
- Check all required fields are filled
- Check for validation errors (red borders)
- Check network connection
- Try again or refresh page

### **Charts not updating?**
- Wait a few seconds for refresh
- Click "Refresh" button manually
- Hard refresh page (Cmd+Shift+R)

---

## 🆕 **What's New**

### **Just Implemented:**

✅ **Expenses List View**
- Beautiful table with all expenses
- Summary cards showing totals
- Search and filter functionality
- Responsive design

✅ **Edit Expense Modal**
- Pre-filled with current values
- Real-time validation
- Currency-aware display
- Success notifications

✅ **Backend API**
- PATCH endpoint for updates
- Ownership verification
- Partial updates supported
- Error handling

✅ **Automatic Refresh**
- Dashboard updates after edit
- Charts recalculate automatically
- No manual refresh needed

---

## 🚀 **Coming Soon**

### **Phase 2 Features:**

🔜 **Delete Expense**
- Delete button in table
- Confirmation dialog
- Soft delete option

🔜 **Bulk Actions**
- Select multiple expenses
- Bulk status update
- Bulk delete

🔜 **Export**
- Export to CSV
- Export to Excel
- PDF reports

🔜 **Advanced Filters**
- Date range filter
- Amount range filter
- Multiple category selection

🔜 **Expense Details View**
- Click row to see full details
- View history of changes
- Attach files/receipts

---

## ✅ **Summary**

### **Where to View:**
📍 **Project Dashboard → Scroll down → "Project Expenses" section**

### **How to Edit:**
1. Find expense in list
2. Click Edit button (✏️)
3. Make changes
4. Click "Update Expense"
5. Done!

### **What Updates:**
- ✅ Expenses list
- ✅ Summary cards
- ✅ Spend by Category chart
- ✅ Cash Flow chart
- ✅ Budget tracking
- ✅ KPI cards

### **Key Features:**
- ✅ Search expenses
- ✅ Filter by category
- ✅ Filter by status
- ✅ Edit any field
- ✅ Auto-refresh
- ✅ Real-time validation

---

**Last Updated:** November 15, 2025  
**Status:** ✅ Complete and Ready to Use  
**Files Created:** 3 (ExpensesList.tsx, EditExpenseModal.tsx, + backend endpoint)


