# 📊 How to Add Budget and Actual Data - Complete Guide

## 🎯 **Understanding Budget vs Actual**

### **Budget (Planned Amount):**
- **What it is:** The amount you **plan to spend** on a category
- **Database:** `budget_line_items` table → `plannedAmount` field
- **Example:** "We plan to spend ₦300,000,000 on labor"
- **When to set:** At project start or when planning expenses

### **Actual (Spent Amount):**
- **What it is:** The amount you **actually spent** (real money paid out)
- **Database:** `project_expenses` table → `totalAmount` field (only **paid** expenses)
- **Example:** "We actually spent ₦250,000,000 on labor"
- **When it updates:** Automatically when you mark expenses as "paid"

---

## 🔄 **How They Work Together**

```
1. Set Budget (Planned)
   └─ Create budget line items
   └─ Example: Labor = ₦300M planned

2. Track Actual (Spent)
   └─ Create expenses
   └─ Mark expenses as "paid"
   └─ System automatically sums paid expenses
   └─ Example: Labor = ₦250M actual (from paid expenses)

3. Compare
   └─ Budget vs Actual chart shows both lines
   └─ Variance = Actual - Budget
   └─ If actual > budget = Over budget ⚠️
   └─ If actual < budget = Under budget ✅
```

---

## 📍 **Where to Add Budget in Frontend**

### **Option 1: Budget Management Page (Recommended)**

The Developer Dashboard already has a **Budget Management Page** where you can add budget line items!

#### **How to Access:**
1. Login as developer
2. Click on your project (e.g., "Victoria Island Commercial Complex")
3. Look at the **left sidebar**
4. Click **"Budgets"** (💰 icon)
5. Budget Management page opens

#### **What You Can Do:**
- ✅ Add new budget line items
- ✅ Set planned amounts by category
- ✅ View budget vs actual comparison
- ✅ Edit existing budget items
- ✅ Track variance (over/under budget)

---

## 🎨 **Adding Budget - Step by Step**

### **Step 1: Navigate to Budget Page**
```
Developer Dashboard
  └─ Select Project
     └─ Click "Budgets" in sidebar
        └─ Budget Management Page opens
```

### **Step 2: Click "Add Budget Line"**
- Look for the **"+ Add Budget Line"** button (usually top-right)
- Click it to open the Add Budget dialog

### **Step 3: Fill in Budget Details**

**Required Fields:**
1. **Category** (dropdown)
   - Labor
   - Materials
   - Equipment
   - Permits
   - Professional Fees
   - Contingency
   - Utilities
   - Insurance
   - Other

2. **Planned Amount** (number)
   - Enter the amount you plan to spend
   - Example: `300000000` (₦300M)

3. **Description** (text)
   - What this budget is for
   - Example: "Labor costs for construction phase"

**Optional Fields:**
4. **Phase** (dropdown)
   - Planning
   - Design
   - Pre-construction
   - Construction
   - Completion

5. **Start Date** (date picker)
   - When this budget period starts

6. **End Date** (date picker)
   - When this budget period ends

7. **Notes** (textarea)
   - Any additional information

### **Step 4: Save**
- Click **"Create Budget Line"** or **"Save"**
- Budget line is added to the table
- Chart updates automatically!

---

## 💰 **Adding Actual (Expenses) - Step by Step**

**Actual spend** is tracked through **Expenses**. When you mark an expense as "paid", it automatically counts toward actual spend!

### **Step 1: Navigate to Expense Management**
```
Developer Dashboard
  └─ Select Project
     └─ Click "Expenses" in sidebar
        └─ Expense Management Page opens
```

### **Step 2: Click "Add Expense"**
- Look for the **"+ Add Expense"** button (green, top-right)
- Click it to open the Add Expense modal

### **Step 3: Fill in Expense Details**

**Required Fields:**
1. **Category** (dropdown)
   - Labor
   - Materials
   - Equipment
   - Permits
   - Professional Fees
   - Contingency

2. **Description** (text)
   - What the expense is for
   - Example: "Construction crew - October 2025"

3. **Amount** (number)
   - The expense amount
   - Example: `93500000` (₦93.5M)

4. **Payment Status** (dropdown)
   - **Unpaid** - Not yet paid (doesn't count in actual)
   - **Partial** - Partially paid
   - **Paid** - Fully paid ✅ (counts in actual!)
   - **Overdue** - Payment overdue

**Optional Fields:**
5. **Vendor** (dropdown)
   - Who you're paying

6. **Invoice Number** (text)
   - Invoice reference

7. **Invoice Date** (date)
   - When invoice was issued

8. **Due Date** (date)
   - When payment is due

9. **Paid Date** (date)
   - When payment was made
   - **Important:** This is used for monthly tracking!

10. **Payment Method** (text)
    - Bank transfer, check, etc.

11. **Tax Amount** (number)
    - Tax on the expense

12. **Notes** (textarea)
    - Additional information

### **Step 4: Save**
- Click **"Create Expense"**
- Expense is added to the table
- If marked as **"Paid"**, it counts toward actual spend!
- Charts update automatically!

---

## 📊 **Example: Complete Budget Setup**

### **Scenario: Victoria Island Commercial Complex**

#### **Step 1: Add Budget Line Items**

| Category | Planned Amount | Description |
|----------|----------------|-------------|
| Labor | ₦300,000,000 | Construction labor costs |
| Materials | ₦200,000,000 | Building materials |
| Equipment | ₦100,000,000 | Heavy machinery rental |
| Professional Fees | ₦50,000,000 | Architects & engineers |
| Permits | ₦30,000,000 | Building permits |
| Contingency | ₦20,000,000 | Emergency fund |
| **TOTAL** | **₦700,000,000** | **Total Project Budget** |

#### **Step 2: Add Expenses (As They Occur)**

| Date | Category | Description | Amount | Status |
|------|----------|-------------|--------|--------|
| Oct 1 | Labor | Construction crew | ₦93,500,000 | Paid ✅ |
| Oct 5 | Materials | Steel & concrete | ₦132,000,000 | Pending ⏳ |
| Oct 10 | Equipment | Crane rental | ₦49,500,000 | Paid ✅ |
| Oct 15 | Labor | Electrical work | ₦82,500,000 | Pending ⏳ |
| Oct 20 | Contingency | Site prep | ₦16,500,000 | Paid ✅ |

#### **Step 3: View Results**

**Budget vs Actual Chart Shows:**
- **Budget Line (Blue):** ₦700M total, distributed monthly
- **Actual Line (Teal):** ₦159.5M (only paid expenses)
- **Status:** Under budget ✅ (so far)

**Spend by Category Shows:**
- Labor: ₦93.5M (only paid)
- Equipment: ₦49.5M (only paid)
- Contingency: ₦16.5M (only paid)
- Materials: ₦0 (pending, not counted yet)

---

## 🔄 **Automatic Updates**

### **When Budget Changes:**
1. Add/edit budget line item
2. Total planned budget recalculates
3. Budget vs Actual chart updates
4. Monthly budget distribution updates

### **When Expense is Marked Paid:**
1. Change expense status to "Paid"
2. Set paid date
3. Actual spend increases automatically
4. Budget vs Actual chart updates
5. Spend by Category updates
6. Variance recalculates

---

## 📱 **UI Locations**

### **Budget Management:**
```
Developer Dashboard
  ├─ Portfolio Overview
  ├─ Project Dashboard
  │   └─ Budget vs Actual Chart (view only)
  ├─ Budgets ← ADD BUDGET HERE
  │   ├─ Add Budget Line button
  │   ├─ Budget table
  │   └─ Budget summary
  ├─ Expenses ← ADD EXPENSES HERE
  │   ├─ Add Expense button
  │   ├─ Expense table
  │   └─ Expense summary
  └─ Reports
```

---

## 🎯 **Quick Reference**

### **To Add Budget:**
1. Click **"Budgets"** in sidebar
2. Click **"+ Add Budget Line"**
3. Select **category**
4. Enter **planned amount**
5. Add **description**
6. Click **"Save"**

### **To Track Actual:**
1. Click **"Expenses"** in sidebar
2. Click **"+ Add Expense"**
3. Select **category** (same as budget)
4. Enter **amount**
5. Set **payment status** to **"Paid"**
6. Set **paid date**
7. Click **"Save"**

### **To View Comparison:**
1. Click **"Project Dashboard"**
2. Scroll to **"Budget vs Actual Spend"** chart
3. Blue line = Budget (planned)
4. Teal line = Actual (spent)

---

## 💡 **Best Practices**

### **For Budget:**
1. ✅ Set budget at project start
2. ✅ Break down by category
3. ✅ Include contingency (10-20%)
4. ✅ Review and adjust quarterly
5. ✅ Document assumptions

### **For Actual:**
1. ✅ Record expenses immediately
2. ✅ Only mark as "paid" when actually paid
3. ✅ Set correct paid date
4. ✅ Match categories to budget
5. ✅ Keep receipts/invoices

### **For Tracking:**
1. ✅ Review charts weekly
2. ✅ Compare budget vs actual monthly
3. ✅ Investigate variances > 10%
4. ✅ Adjust future budgets based on actuals
5. ✅ Document reasons for overruns

---

## 🔧 **Troubleshooting**

### **"Budget line not showing in chart"**
- ✅ Check that planned amount > 0
- ✅ Refresh the page
- ✅ Verify budget was saved (check Budgets page)

### **"Actual spend not updating"**
- ✅ Check expense payment status is "Paid"
- ✅ Verify paid date is set
- ✅ Refresh the page
- ✅ Check expense is in correct project

### **"Chart shows no data"**
- ✅ Add at least one budget line item
- ✅ Add at least one paid expense
- ✅ Verify project has start date
- ✅ Check date range (last 6 months)

---

## 📊 **Data Flow Diagram**

```
┌─────────────────────────────────────────────────────────┐
│                    BUDGET (PLANNED)                     │
│                                                         │
│  1. User adds budget line item                         │
│     └─ Category: Labor                                 │
│     └─ Planned: ₦300M                                  │
│                                                         │
│  2. Saved to database                                  │
│     └─ budget_line_items.plannedAmount = 300000000    │
│                                                         │
│  3. Chart calculates                                   │
│     └─ Total budget = sum of all planned amounts      │
│     └─ Monthly budget = total / 6 months              │
│     └─ Cumulative budget shown in chart               │
└─────────────────────────────────────────────────────────┘
                            ↓
                    COMPARE IN CHART
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    ACTUAL (SPENT)                       │
│                                                         │
│  1. User adds expense                                  │
│     └─ Category: Labor                                 │
│     └─ Amount: ₦93.5M                                  │
│     └─ Status: Paid ✅                                 │
│     └─ Paid Date: Oct 1, 2025                         │
│                                                         │
│  2. Saved to database                                  │
│     └─ project_expenses.totalAmount = 93500000        │
│     └─ project_expenses.paymentStatus = 'paid'        │
│                                                         │
│  3. Chart calculates                                   │
│     └─ Total actual = sum of paid expenses            │
│     └─ Grouped by month (paid date)                   │
│     └─ Cumulative actual shown in chart               │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ **Summary**

### **Budget (Planned):**
- **Where:** Budgets page in sidebar
- **Action:** Click "Add Budget Line"
- **Fields:** Category, Planned Amount, Description
- **Result:** Sets spending targets

### **Actual (Spent):**
- **Where:** Expenses page in sidebar
- **Action:** Click "Add Expense"
- **Fields:** Category, Amount, Status = "Paid"
- **Result:** Tracks real spending

### **Comparison:**
- **Where:** Project Dashboard
- **Chart:** Budget vs Actual Spend
- **Blue Line:** Budget (planned)
- **Teal Line:** Actual (spent)
- **Result:** Visual comparison

---

## 🎉 **You're Ready!**

Now you know:
- ✅ What budget and actual mean
- ✅ Where to add them in the frontend
- ✅ How they work together
- ✅ How to track and compare them

**Next Steps:**
1. Go to your project
2. Click "Budgets" → Add budget line items
3. Click "Expenses" → Add expenses (mark as paid)
4. Go to "Project Dashboard" → See the comparison!

---

**Last Updated:** November 15, 2025  
**Guide:** How to Add Budget and Actual Data  
**Status:** ✅ Complete  
**Difficulty:** Easy (5-10 minutes to set up)


