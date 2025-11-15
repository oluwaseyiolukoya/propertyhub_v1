# 🏗️ Project Funding Integration Architecture

## 📋 Executive Summary

This document outlines the architectural plan for integrating Project Funding into spending calculations across the Project Dashboard. Funding should be used to calculate **Net Spend** (expenses minus funding received), providing a more accurate financial picture.

---

## 🎯 Business Logic

### Current State
- **Actual Spend** = Sum of all paid expenses (`project_expenses` where `paymentStatus = 'paid'`)
- **Funding** = Tracked separately in `project_funding` table
- **Cash Flow** = Already uses funding (inflow) vs expenses (outflow)

### Proposed State
- **Gross Spend** = Total expenses (unchanged)
- **Net Spend** = Gross Spend - Funding Received
- **Available Budget** = Total Budget + Funding Received - Expenses
- **Net Variance** = Net Spend - Total Budget

### Key Metrics to Display

1. **Gross Spend** (Total Expenses)
   - Shows actual money spent regardless of funding
   - Useful for cost tracking

2. **Net Spend** (Expenses - Funding)
   - Shows net cash impact after funding
   - More accurate for budget variance

3. **Funding Received**
   - Total funding with status = 'received'
   - Should be visible in KPI cards

4. **Available Budget**
   - Budget + Funding - Expenses
   - Shows remaining budget capacity

---

## 🏛️ Architecture Plan

### 1. Backend Changes

#### A. Update Dashboard API (`/api/developer-dashboard/projects/:projectId/dashboard`)

**File:** `backend/src/routes/developer-dashboard.ts`

**Current Calculation (Line 456-462):**
```typescript
const actualSpend = expenses.reduce((sum, expense) => {
  const amount = Number(expense.totalAmount) || 0;
  return sum + amount;
}, 0);
```

**Enhanced Calculation:**
```typescript
// 1. Calculate Gross Spend (total expenses)
const grossSpend = expenses.reduce((sum, expense) => {
  const amount = Number(expense.totalAmount) || 0;
  return sum + amount;
}, 0);

// 2. Fetch funding received for this project
const fundingReceived = await prisma.project_funding.aggregate({
  where: {
    projectId,
    status: 'received',
    receivedDate: { not: null }
  },
  _sum: {
    amount: true
  }
});

const totalFundingReceived = fundingReceived._sum.amount || 0;

// 3. Calculate Net Spend (expenses - funding)
const netSpend = grossSpend - totalFundingReceived;

// 4. Calculate Available Budget
const availableBudget = totalBudget + totalFundingReceived - grossSpend;

// 5. Calculate Net Variance (using net spend)
const netVariance = netSpend - totalBudget;
const netVariancePercent = totalBudget > 0 ? (netVariance / totalBudget) * 100 : 0;
```

**Response Enhancement:**
```typescript
res.json({
  project: {
    ...projectWithCalculations,
    totalBudget,
    grossSpend,        // NEW: Total expenses
    netSpend,          // NEW: Expenses - Funding
    totalFundingReceived, // NEW: Total funding received
    availableBudget,   // NEW: Budget + Funding - Expenses
    variance,          // Keep for backward compatibility (gross variance)
    variancePercent,   // Keep for backward compatibility
    netVariance,       // NEW: Net variance
    netVariancePercent, // NEW: Net variance percentage
    forecastedCompletion,
  },
  // ... rest of response
});
```

#### B. Create Funding Aggregation Helper

**File:** `backend/src/services/funding.service.ts` (NEW)

```typescript
import prisma from '../lib/db';

export interface FundingSummary {
  totalReceived: number;
  totalPending: number;
  totalExpected: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export async function getProjectFundingSummary(projectId: string): Promise<FundingSummary> {
  const funding = await prisma.project_funding.findMany({
    where: { projectId }
  });

  const summary: FundingSummary = {
    totalReceived: 0,
    totalPending: 0,
    totalExpected: 0,
    byType: {},
    byStatus: {}
  };

  funding.forEach(fund => {
    // Aggregate by status
    summary.byStatus[fund.status] = (summary.byStatus[fund.status] || 0) + fund.amount;
    
    if (fund.status === 'received') {
      summary.totalReceived += fund.amount;
    } else if (fund.status === 'pending') {
      summary.totalPending += fund.amount;
    }
    
    if (fund.expectedDate) {
      summary.totalExpected += fund.amount;
    }

    // Aggregate by type
    summary.byType[fund.fundingType] = (summary.byType[fund.fundingType] || 0) + fund.amount;
  });

  return summary;
}
```

---

### 2. Frontend Changes

#### A. Update Project Dashboard Component

**File:** `src/modules/developer-dashboard/components/ProjectDashboard.tsx`

**Location:** KPI Cards Section (around line 200-280)

**Current KPI Cards:**
1. Total Budget
2. Actual Spend (Gross)
3. Variance

**Enhanced KPI Cards:**
1. **Total Budget** (unchanged)
2. **Gross Spend** (Total Expenses) - NEW label
3. **Funding Received** - NEW card
4. **Net Spend** - NEW card (Gross Spend - Funding)
5. **Available Budget** - NEW card (Budget + Funding - Expenses)
6. **Net Variance** - Replace or supplement existing variance card

**Implementation:**
```typescript
// After line 96, add funding data to state
const { data, loading, error, refetch } = useProjectDashboard(projectId);

// Extract funding data from project object
const {
  grossSpend = 0,
  netSpend = 0,
  totalFundingReceived = 0,
  availableBudget = 0,
  netVariance = 0,
  netVariancePercent = 0,
} = data?.project || {};

// Update KPI Cards section (around line 200)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Total Budget - Unchanged */}
  <KPICard
    title="Total Budget"
    value={formatCurrency(totalBudget)}
    icon={Target}
    trend={null}
  />

  {/* Gross Spend - Renamed from "Actual Spend" */}
  <KPICard
    title="Gross Spend"
    value={formatCurrency(grossSpend)}
    subtitle="Total Expenses"
    icon={TrendingUp}
    trend={null}
  />

  {/* Funding Received - NEW */}
  <KPICard
    title="Funding Received"
    value={formatCurrency(totalFundingReceived)}
    icon={DollarSign}
    trend={null}
    variant="success"
  />

  {/* Net Spend - NEW */}
  <KPICard
    title="Net Spend"
    value={formatCurrency(Math.abs(netSpend))}
    subtitle={`${netSpend >= 0 ? '+' : ''}${formatCurrency(Math.abs(netSpend))}`}
    icon={netSpend >= 0 ? TrendingUp : TrendingDown}
    trend={netSpend >= 0 ? 'up' : 'down'}
    variant={netSpend >= 0 ? 'warning' : 'success'}
  />
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
  {/* Available Budget - NEW */}
  <KPICard
    title="Available Budget"
    value={formatCurrency(availableBudget)}
    subtitle={`${availableBudget >= 0 ? 'Remaining' : 'Over Budget'}`}
    icon={DollarSign}
    variant={availableBudget >= 0 ? 'success' : 'danger'}
  />

  {/* Net Variance - Enhanced */}
  <KPICard
    title="Net Variance"
    value={`${netVariance >= 0 ? '+' : ''}${formatCurrency(Math.abs(netVariance))}`}
    subtitle={`${netVariancePercent >= 0 ? '+' : ''}${netVariancePercent.toFixed(1)}%`}
    icon={netVariance >= 0 ? AlertTriangle : CheckCircle}
    variant={netVariance >= 0 ? 'danger' : 'success'}
  />
</div>
```

#### B. Update Type Definitions

**File:** `src/modules/developer-dashboard/types/index.ts`

**Add to `DeveloperProject` interface:**
```typescript
export interface DeveloperProject {
  // ... existing fields
  grossSpend?: number;           // Total expenses
  netSpend?: number;              // Expenses - Funding
  totalFundingReceived?: number;  // Total funding received
  availableBudget?: number;       // Budget + Funding - Expenses
  netVariance?: number;           // Net variance
  netVariancePercent?: number;    // Net variance percentage
}
```

#### C. Update Budget vs Actual Chart

**File:** `src/modules/developer-dashboard/components/ProjectDashboard.tsx`

**Location:** Budget vs Actual Chart (around line 300-350)

**Enhancement:** Add a toggle to show:
- **Gross Actual** (current expenses)
- **Net Actual** (expenses - funding)

```typescript
const [showNetSpend, setShowNetSpend] = useState(false);

// In chart data preparation
const chartData = budgetVsActual.map(item => ({
  ...item,
  actual: showNetSpend 
    ? item.actual - (totalFundingReceived / budgetVsActual.length) // Distribute funding across months
    : item.actual
}));
```

---

### 3. Component Placement Strategy

#### Primary Location: Project Dashboard

**Component:** `ProjectDashboard.tsx`
**Section:** KPI Cards (Top of page)

**Why Here:**
- First thing users see
- Critical financial metrics
- Sets context for rest of dashboard

#### Secondary Location: Project Funding Page

**Component:** `ProjectFundingPage.tsx`
**Section:** Summary Cards (Top of page)

**Enhancement:** Add summary showing:
- Total Funding Received
- Impact on Net Spend
- Available Budget after funding

---

### 4. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Project Dashboard API                     │
│  GET /api/developer-dashboard/projects/:projectId/dashboard │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  1. Fetch Expenses (project_expenses) │
        │     - Filter: paymentStatus = 'paid'  │
        │     - Sum: totalAmount                 │
        │     → grossSpend                       │
        └───────────────────────────────────────┘
                            │
        ┌───────────────────────────────────────┐
        │  2. Fetch Funding (project_funding)    │
        │     - Filter: status = 'received'      │
        │     - Sum: amount                      │
        │     → totalFundingReceived             │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  3. Calculate Metrics                 │
        │     - netSpend = grossSpend - funding │
        │     - availableBudget = budget +      │
        │       funding - grossSpend            │
        │     - netVariance = netSpend - budget │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  4. Return Enhanced Response          │
        │     {                                  │
        │       project: {                      │
        │         grossSpend,                    │
        │         netSpend,                      │
        │         totalFundingReceived,          │
        │         availableBudget,               │
        │         netVariance                    │
        │       }                                │
        │     }                                  │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  5. Frontend Display                  │
        │     - KPI Cards (6 cards)             │
        │     - Charts (with net/gross toggle)  │
        │     - Budget vs Actual (enhanced)      │
        └───────────────────────────────────────┘
```

---

### 5. Implementation Priority

#### Phase 1: Backend Foundation (High Priority)
1. ✅ Update dashboard API to calculate funding metrics
2. ✅ Add funding aggregation to response
3. ✅ Test with existing data

#### Phase 2: Frontend KPI Cards (High Priority)
1. ✅ Update ProjectDashboard component
2. ✅ Add new KPI cards for funding metrics
3. ✅ Update type definitions

#### Phase 3: Enhanced Charts (Medium Priority)
1. ⏳ Add net/gross toggle to Budget vs Actual chart
2. ⏳ Update Cash Flow chart to show funding impact
3. ⏳ Add funding breakdown visualization

#### Phase 4: Project Funding Page Integration (Low Priority)
1. ⏳ Add summary cards showing impact
2. ⏳ Add "View Impact on Dashboard" link
3. ⏳ Add funding timeline visualization

---

### 6. Key Considerations

#### A. Funding Status Filtering
- **Only count `status = 'received'`** funding in calculations
- Pending/partial funding should NOT reduce net spend
- Use `receivedDate` for accurate timing

#### B. Currency Handling
- Ensure funding and expenses use same currency
- Handle multi-currency projects (future enhancement)

#### C. Date Alignment
- Funding received date vs expense paid date
- Monthly aggregation should align dates correctly

#### D. Backward Compatibility
- Keep existing `actualSpend` and `variance` fields
- Add new fields alongside, don't break existing code
- Frontend can gradually migrate to new fields

#### E. Performance
- Funding aggregation is lightweight (single query)
- Consider caching if needed
- Use database indexes on `projectId`, `status`, `receivedDate`

---

### 7. Example Calculations

**Scenario:**
- Total Budget: ₦100,000,000
- Expenses Paid: ₦80,000,000
- Funding Received: ₦30,000,000

**Results:**
- Gross Spend: ₦80,000,000
- Net Spend: ₦50,000,000 (80M - 30M)
- Available Budget: ₦50,000,000 (100M + 30M - 80M)
- Net Variance: -₦50,000,000 (50M - 100M)
- Net Variance %: -50%

**Interpretation:**
- Project is ₦50M under budget when considering funding
- Still has ₦50M available budget remaining
- Funding covered ₦30M of expenses

---

### 8. Testing Strategy

#### Unit Tests
- Test funding aggregation logic
- Test net spend calculation
- Test edge cases (no funding, no expenses)

#### Integration Tests
- Test API endpoint with funding data
- Test frontend KPI cards display
- Test chart data with funding

#### User Acceptance
- Verify metrics make business sense
- Verify calculations match expectations
- Verify UI is clear and intuitive

---

## 📝 Summary

**Key Changes:**
1. Backend calculates `netSpend` = expenses - funding
2. Frontend displays 6 KPI cards instead of 3
3. Charts can toggle between gross and net views
4. Funding impact is visible throughout dashboard

**Benefits:**
- More accurate financial picture
- Better budget management
- Clear visibility of funding impact
- Improved decision-making

**Next Steps:**
1. Implement Phase 1 (Backend)
2. Implement Phase 2 (Frontend KPI Cards)
3. Test thoroughly
4. Deploy incrementally

