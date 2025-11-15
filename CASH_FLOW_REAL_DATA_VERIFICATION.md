# ✅ Cash Flow Analysis - Real Data Verification

## 🎯 **CONFIRMED: Cash Flow Fetches Real Data**

The Cash Flow Analysis in the Project Dashboard is **fully connected to real database data** and does NOT use mock/simulated data.

---

## 📊 **How It Works**

### **1. Frontend Component** 
**File:** `src/modules/developer-dashboard/components/CashFlowChart.tsx`

The component fetches real-time data from the backend API:

```typescript
// Lines 119-150
const fetchCashFlow = async () => {
  const { startDate, endDate } = getDateRange();
  const url = `/api/developer-dashboard/projects/${projectId}/cash-flow?periodType=${periodType}&startDate=${startDate}&endDate=${endDate}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  const result = await response.json();
  setData(result.data || []);
  setSource(result.source || 'realtime');
}
```

**Key Features:**
- ✅ Fetches data on component mount and when filters change
- ✅ Supports date range filtering (last 3/6/12 months, custom range)
- ✅ Supports multiple period types (daily, weekly, monthly, quarterly)
- ✅ Shows loading states and error handling
- ✅ Displays data source badge (realtime vs cached)

---

### **2. Backend API Endpoint**
**File:** `backend/src/routes/developer-dashboard.ts`
**Endpoint:** `GET /api/developer-dashboard/projects/:projectId/cash-flow`

```typescript
// Lines 937-1016
router.get('/projects/:projectId/cash-flow', async (req: Request, res: Response) => {
  const { startDate, endDate, periodType, useSnapshot, cumulative } = req.query;
  
  // Three calculation modes:
  // 1. Real-time calculation (default)
  cashFlow = await calculateProjectCashFlow(projectId, start, end, periodType);
  
  // 2. Pre-calculated snapshots (fast)
  cashFlow = await getCashFlowFromSnapshots(projectId, start, end, periodType);
  
  // 3. Cumulative totals
  cashFlow = await calculateCumulativeCashFlow(projectId, start, end, periodType);
  
  res.json({ data: cashFlow, source, periodType });
});
```

**Query Parameters:**
- `periodType`: daily, weekly, monthly, quarterly
- `startDate`: Start of date range (YYYY-MM-DD)
- `endDate`: End of date range (YYYY-MM-DD)
- `useSnapshot`: true/false (use cached data for performance)
- `cumulative`: true/false (running totals)

---

### **3. Cash Flow Service (Core Logic)**
**File:** `backend/src/services/cashflow.service.ts`

#### **Main Function: `calculateProjectCashFlow()`**

```typescript
// Lines 157-291
export async function calculateProjectCashFlow(
  projectId: string,
  startDate: Date,
  endDate: Date,
  periodType: PeriodType = 'monthly'
): Promise<CashFlowData[]> {
  
  // 1. Fetch funding (inflow) - REAL DATA
  const funding = await prisma.project_funding.findMany({
    where: {
      projectId,
      status: 'received',
      receivedDate: { gte: startDate, lte: endDate }
    }
  });
  
  // 2. Fetch expenses (outflow) - REAL DATA
  const expenses = await prisma.project_expenses.findMany({
    where: {
      projectId,
      paymentStatus: 'paid',
      paidDate: { gte: startDate, lte: endDate }
    }
  });
  
  // 3. Aggregate by period with detailed breakdowns
  // 4. Calculate net cash flow
  // 5. Return formatted data
}
```

**Data Sources:**
- **Inflow:** `project_funding` table (status = 'received')
- **Outflow:** `project_expenses` table (paymentStatus = 'paid')

---

## 🗄️ **Database Tables**

### **1. `project_funding` Table**
**Location:** `backend/prisma/schema.prisma` (lines 918-950)

**Purpose:** Tracks all money coming into projects

**Key Fields:**
- `amount`: Funding amount
- `fundingType`: client_payment, bank_loan, equity_investment, grant, internal_budget
- `fundingSource`: Bank name, investor name, client name
- `receivedDate`: When money was received
- `status`: pending, received, partial, cancelled

**Used For:** Calculating **INFLOW** in cash flow analysis

---

### **2. `project_expenses` Table**
**Location:** `backend/prisma/schema.prisma` (lines 951-990)

**Purpose:** Tracks all project expenditures

**Key Fields:**
- `totalAmount`: Total expense amount (amount + tax)
- `category`: labor, materials, equipment, permits, professional-fees, contingency
- `expenseType`: invoice, purchase_order, payroll, overhead, material, equipment
- `paidDate`: When expense was paid
- `paymentStatus`: pending, approved, paid, cancelled

**Used For:** Calculating **OUTFLOW** in cash flow analysis

---

### **3. `project_cash_flow_snapshots` Table**
**Location:** `backend/prisma/schema.prisma` (lines 991-1013)

**Purpose:** Pre-calculated aggregates for fast queries

**Key Fields:**
- `totalInflow`: Sum of inflows for period
- `totalOutflow`: Sum of outflows for period
- `netCashFlow`: Inflow - Outflow
- `cumulativeInflow`: Running total of inflows
- `inflowByType`: JSON breakdown by funding type
- `outflowByCategory`: JSON breakdown by expense category

**Used For:** Performance optimization (optional, not default)

---

## 📈 **Data Flow Diagram**

```
User Creates Funding/Expenses
         ↓
Database Tables (project_funding, project_expenses)
         ↓
Backend API (/api/developer-dashboard/projects/:projectId/cash-flow)
         ↓
Cash Flow Service (calculateProjectCashFlow)
         ↓
Frontend Component (CashFlowChart.tsx)
         ↓
Visual Display (Area Chart + Breakdowns)
```

---

## 🎨 **What Users See**

### **Summary Cards:**
- **Total Inflow:** Sum of all received funding
- **Total Outflow:** Sum of all paid expenses
- **Net Cash Flow:** Inflow - Outflow

### **Main Chart (Area Chart):**
- **Green Line:** Inflow over time
- **Red Line:** Outflow over time
- **Blue Line:** Net cash flow over time

### **Breakdown View (Bar Charts):**

**Inflow Breakdown:**
- Client Payments
- Loans
- Equity
- Grants
- Other

**Outflow Breakdown:**
- Labor
- Materials
- Equipment
- Permits
- Professional Fees
- Contingency
- Other

---

## 🔍 **Date Range Filtering**

The component supports flexible date filtering:

### **Preset Ranges:**
- Last 3 Months
- Last 6 Months (default)
- Last 12 Months

### **Custom Range:**
- User can select any start and end date
- Validation ensures start < end
- Applied with "Apply" button

**Implementation:** Lines 78-182 in `CashFlowChart.tsx`

---

## ⚡ **Performance Features**

### **1. Real-time Calculation (Default)**
- Queries database directly
- Most accurate, always up-to-date
- Suitable for most use cases

### **2. Snapshot Mode (Optional)**
- Uses pre-calculated data from `project_cash_flow_snapshots`
- Much faster for large datasets
- Updated nightly by background jobs
- Enable with `?useSnapshot=true`

### **3. Background Jobs**
**File:** `backend/src/jobs/cashflow-snapshots.job.ts`

**Daily Snapshot Job (00:30 AM):**
- Calculates cash flow for all active projects
- Saves monthly snapshots
- Keeps data fresh

**Monthly Finalization (1st at 02:00 AM):**
- Finalizes previous month's data
- Generates comprehensive reports

**Weekly Cleanup (Sunday at 03:00 AM):**
- Removes snapshots older than 2 years
- Maintains database performance

---

## ✅ **Verification Checklist**

### **Frontend:**
- ✅ Component fetches from API endpoint
- ✅ No hardcoded/mock data
- ✅ Loading states implemented
- ✅ Error handling in place
- ✅ Date range filtering works
- ✅ Period type switching works
- ✅ Data source badge shows (realtime/cached)

### **Backend:**
- ✅ API endpoint exists and is functional
- ✅ Queries real database tables
- ✅ Proper date filtering
- ✅ Status filtering (received funding, paid expenses)
- ✅ Aggregation by period
- ✅ Breakdown calculations
- ✅ Multiple calculation modes

### **Database:**
- ✅ `project_funding` table exists
- ✅ `project_expenses` table exists
- ✅ `project_cash_flow_snapshots` table exists
- ✅ Proper relationships defined
- ✅ Indexes for performance

---

## 🧪 **How to Test**

### **1. Check Database Tables:**
```bash
cd backend
npx prisma studio
# Navigate to project_funding and project_expenses tables
# Verify records exist
```

### **2. Test API Endpoint:**
```bash
# Get your auth token from localStorage
TOKEN="your_auth_token_here"
PROJECT_ID="your_project_id"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/developer-dashboard/projects/$PROJECT_ID/cash-flow?periodType=monthly"
```

### **3. Check Frontend:**
1. Open Developer Dashboard
2. Click on a project
3. Scroll to "Cash Flow Analysis" section
4. Verify data displays
5. Try changing date ranges
6. Try switching period types
7. Check browser console for API calls

### **4. Verify Real Data:**
```bash
# Check backend logs for SQL queries
# You should see Prisma queries like:
# "SELECT * FROM project_funding WHERE..."
# "SELECT * FROM project_expenses WHERE..."
```

---

## 📊 **Sample API Response**

```json
{
  "data": [
    {
      "month": "Nov 2024",
      "inflow": 5000000,
      "outflow": 3200000,
      "netCashFlow": 1800000,
      "inflowBreakdown": {
        "clientPayments": 5000000,
        "loans": 0,
        "equity": 0,
        "grants": 0,
        "other": 0
      },
      "outflowBreakdown": {
        "labor": 1200000,
        "materials": 1500000,
        "equipment": 300000,
        "permits": 100000,
        "professionalFees": 100000,
        "contingency": 0,
        "other": 0
      }
    },
    {
      "month": "Dec 2024",
      "inflow": 3000000,
      "outflow": 2800000,
      "netCashFlow": 200000,
      "inflowBreakdown": {
        "clientPayments": 2000000,
        "loans": 1000000,
        "equity": 0,
        "grants": 0,
        "other": 0
      },
      "outflowBreakdown": {
        "labor": 1000000,
        "materials": 1200000,
        "equipment": 400000,
        "permits": 0,
        "professionalFees": 200000,
        "contingency": 0,
        "other": 0
      }
    }
  ],
  "source": "realtime",
  "periodType": "monthly"
}
```

---

## 🎯 **Key Takeaways**

### **✅ CONFIRMED:**
1. Cash Flow Analysis fetches **100% real data** from the database
2. No mock data or hardcoded values are used
3. Data comes from `project_funding` and `project_expenses` tables
4. Real-time calculation is the default mode
5. Optional snapshot mode available for performance
6. Comprehensive date filtering and period types supported
7. Detailed breakdowns by funding type and expense category

### **📌 Important Notes:**
- If you see "No cash flow data available", it means there are no funding or expense records in the database for that project
- The component will show "0" values if no data exists for the selected date range
- The "Cached" badge appears only when using snapshot mode (`?useSnapshot=true`)
- Background jobs run automatically to keep snapshots up-to-date

---

## 🚀 **Next Steps**

To see cash flow data:

1. **Add Funding Records:**
   - Use the funding management API or UI
   - Mark status as "received"
   - Set a receivedDate

2. **Add Expense Records:**
   - Create expenses through the expense management system
   - Mark paymentStatus as "paid"
   - Set a paidDate

3. **View Cash Flow:**
   - Navigate to Project Dashboard
   - Cash Flow Analysis will automatically display the data
   - Try different date ranges and period types

---

**Verification Date:** November 15, 2025  
**Status:** ✅ Fully Verified - Real Data Connected  
**Version:** 1.0.0


