# 📊 Spend by Category - Complete Guide

## 🎯 **What is Spend by Category?**

"Spend by Category" is a financial analysis feature that shows how project money is being spent across different expense categories. It helps project managers:

- Track where money is going
- Identify the biggest cost areas
- Compare planned vs actual spending
- Make informed budget decisions

---

## 💾 **Data Source**

### **Database Table: `project_expenses`**

All expense data comes from the `project_expenses` table in the database.

**Key Fields:**

```typescript
{
  id: string; // Unique expense ID
  projectId: string; // Which project this belongs to
  category: string; // ⭐ THIS IS THE KEY FIELD
  totalAmount: number; // Amount including tax
  paymentStatus: string; // paid, unpaid, partial
  paidDate: Date; // When it was paid
  description: string; // What the expense is for
}
```

### **Available Categories:**

| Category            | Description                           | Examples                                  |
| ------------------- | ------------------------------------- | ----------------------------------------- |
| `labor`             | Labor costs, payroll, workers         | Construction crew, electricians, plumbers |
| `materials`         | Construction materials, supplies      | Steel, concrete, wood, paint              |
| `equipment`         | Tools, machinery, equipment rental    | Cranes, excavators, tools                 |
| `permits`           | Building permits, licenses, approvals | Building permits, environmental approvals |
| `professional-fees` | Architects, engineers, consultants    | Design fees, engineering services         |
| `contingency`       | Emergency funds, unexpected costs     | Site issues, weather delays               |
| `other`             | Miscellaneous expenses                | Utilities, insurance, misc                |

---

## 🔄 **How It Works**

### **Step 1: Data Collection**

```sql
SELECT category, SUM(totalAmount) as total
FROM project_expenses
WHERE projectId = 'your-project-id'
  AND paymentStatus = 'paid'
GROUP BY category
ORDER BY total DESC;
```

### **Step 2: Calculation**

```typescript
// Group expenses by category
const categoryTotals = {};

expenses.forEach((expense) => {
  if (!categoryTotals[expense.category]) {
    categoryTotals[expense.category] = 0;
  }
  categoryTotals[expense.category] += expense.totalAmount;
});

// Calculate percentages
const grandTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

const spendByCategory = Object.entries(categoryTotals).map(
  ([category, amount]) => ({
    category,
    amount,
    percentage: (amount / grandTotal) * 100,
  })
);
```

### **Step 3: Visualization**

Display as:

- **Bar Chart** - Horizontal bars showing spend per category
- **Pie Chart** - Percentage breakdown
- **Table** - Detailed list with amounts and percentages

---

## 📊 **Current Data (Victoria Island Commercial Complex)**

### **Spend Breakdown:**

```
┌──────────────────────┬─────────────────┬────────────┐
│ Category             │ Amount          │ Percentage │
├──────────────────────┼─────────────────┼────────────┤
│ Labor                │ ₦176,000,000    │ 34.0%      │
│ Materials            │ ₦170,500,000    │ 33.0%      │
│ Equipment            │ ₦71,500,000     │ 13.8%      │
│ Professional Fees    │ ₦49,500,000     │ 9.6%       │
│ Permits              │ ₦33,000,000     │ 6.4%       │
│ Contingency          │ ₦16,500,000     │ 3.2%       │
├──────────────────────┼─────────────────┼────────────┤
│ TOTAL                │ ₦517,000,000    │ 100%       │
└──────────────────────┴─────────────────┴────────────┘
```

### **Detailed Breakdown:**

**1. Labor (₦176M - 34%)**

- Construction crew - October 2025: ₦93,500,000
- Electrical subcontractor - Phase 1: ₦82,500,000

**2. Materials (₦170.5M - 33%)**

- Steel and concrete - Phase 2: ₦132,000,000
- Construction materials - Phase 1: ₦38,500,000

**3. Equipment (₦71.5M - 13.8%)**

- Crane and heavy machinery rental: ₦49,500,000
- Site survey equipment: ₦22,000,000

**4. Professional Fees (₦49.5M - 9.6%)**

- Architectural and engineering design: ₦49,500,000

**5. Permits (₦33M - 6.4%)**

- Building permits and approvals: ₦33,000,000

**6. Contingency (₦16.5M - 3.2%)**

- Unexpected site preparation costs: ₦16,500,000

---

## 🔌 **API Endpoints**

### **Get All Expenses**

```bash
GET /api/developer-dashboard/projects/:projectId/expenses

Response:
[
  {
    "id": "expense-1",
    "category": "labor",
    "totalAmount": 93500000,
    "description": "Construction crew - October 2025",
    "paidDate": "2025-10-18",
    "paymentStatus": "paid"
  },
  ...
]
```

### **Get Expenses by Category**

```bash
# Frontend can filter by category
GET /api/developer-dashboard/projects/:projectId/expenses?category=labor
```

---

## 💻 **Frontend Implementation**

### **Example React Component:**

```typescript
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface SpendData {
  category: string;
  amount: number;
  percentage: number;
}

export function SpendByCategoryChart({ projectId }: { projectId: string }) {
  const [data, setData] = useState<SpendData[]>([]);

  useEffect(() => {
    fetchSpendData();
  }, [projectId]);

  const fetchSpendData = async () => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(
      `/api/developer-dashboard/projects/${projectId}/expenses`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const expenses = await response.json();

    // Group by category
    const categoryTotals: Record<string, number> = {};
    expenses
      .filter((e: any) => e.paymentStatus === "paid")
      .forEach((expense: any) => {
        if (!categoryTotals[expense.category]) {
          categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.totalAmount;
      });

    // Calculate percentages
    const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    const chartData = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category: category.replace("-", " ").toUpperCase(),
        amount,
        percentage: (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    setData(chartData);
  };

  return (
    <div>
      <h3>Spend by Category</h3>
      <BarChart width={600} height={300} data={data}>
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
        <Bar dataKey="amount" fill="#3b82f6" />
      </BarChart>
    </div>
  );
}
```

---

## ➕ **How to Add New Expenses**

### **Method 1: Via API**

```bash
POST /api/developer-dashboard/projects/:projectId/expenses
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "amount": 50000000,
  "taxAmount": 5000000,
  "currency": "NGN",
  "expenseType": "invoice",
  "category": "labor",              // ⭐ Choose from available categories
  "description": "Plumbing work - Phase 2",
  "paidDate": "2025-11-01",
  "paymentStatus": "paid",
  "status": "paid"
}
```

### **Method 2: Via Database Script**

```javascript
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

await prisma.project_expenses.create({
  data: {
    projectId: "your-project-id",
    amount: 50000000,
    taxAmount: 5000000,
    totalAmount: 55000000,
    currency: "NGN",
    expenseType: "invoice",
    category: "labor", // ⭐ Category field
    description: "Plumbing work - Phase 2",
    paidDate: new Date("2025-11-01"),
    paymentStatus: "paid",
    status: "paid",
  },
});
```

### **Method 3: Via UI (Future Feature)**

In the Project Dashboard, there will be an "Add Expense" button that opens a form:

1. Select Category (dropdown)
2. Enter Amount
3. Enter Description
4. Select Payment Date
5. Click "Save"

---

## 📈 **Use Cases**

### **1. Budget Monitoring**

Compare actual spend vs budget by category:

```typescript
const budgetVsActual = categories.map((cat) => ({
  category: cat,
  budget: budgetLineItems[cat].plannedAmount,
  actual: expenses[cat].totalAmount,
  variance: budgetLineItems[cat].plannedAmount - expenses[cat].totalAmount,
}));
```

### **2. Cost Optimization**

Identify categories with highest spend:

```typescript
const topSpenders = spendByCategory
  .sort((a, b) => b.amount - a.amount)
  .slice(0, 3);

console.log("Top 3 cost areas:", topSpenders);
// Focus optimization efforts here
```

### **3. Trend Analysis**

Track category spend over time:

```typescript
const monthlySpend = expenses
  .filter((e) => e.category === "labor")
  .reduce((acc, e) => {
    const month = e.paidDate.toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + e.totalAmount;
    return acc;
  }, {});
```

### **4. Forecasting**

Predict future spend based on current trends:

```typescript
const avgMonthlySpend = totalSpend / monthsElapsed;
const projectedTotal = avgMonthlySpend * totalProjectMonths;
const remainingBudget = totalBudget - totalSpend;
```

---

## 🎨 **Visualization Options**

### **1. Horizontal Bar Chart** (Recommended)

```
Labor           ████████████████████ ₦176M (34%)
Materials       ███████████████████  ₦170.5M (33%)
Equipment       ███████              ₦71.5M (13.8%)
Professional    █████                ₦49.5M (9.6%)
Permits         ███                  ₦33M (6.4%)
Contingency     ██                   ₦16.5M (3.2%)
```

### **2. Pie Chart**

Shows percentage breakdown visually

### **3. Donut Chart**

Like pie chart but with center space for total

### **4. Table with Progress Bars**

Combines numbers with visual bars

---

## 🔮 **Future Enhancements**

### **Planned Features:**

1. **Budget Comparison**

   - Show planned vs actual side-by-side
   - Highlight overruns in red

2. **Drill-Down**

   - Click category to see individual expenses
   - Filter by date range

3. **Export**

   - Download as CSV/Excel
   - Generate PDF reports

4. **Alerts**

   - Notify when category exceeds budget
   - Warn about unusual spending patterns

5. **Forecasting**
   - Predict future spend by category
   - Estimate completion costs

---

## ✅ **Summary**

**Spend by Category:**

- ✅ Shows where project money is going
- ✅ Groups expenses into meaningful categories
- ✅ Calculates totals and percentages
- ✅ Helps identify cost optimization opportunities
- ✅ Supports budget monitoring and forecasting

**Data Flow:**

```
Create Expense → project_expenses table → API Endpoint →
Frontend Groups by Category → Calculate Totals → Display Chart
```

**Current Status:**

- ✅ Database table created
- ✅ Sample data added (₦517M across 6 categories)
- ✅ API endpoint available
- ✅ Ready for frontend visualization

---

**Last Updated:** November 15, 2025  
**Sample Data:** Victoria Island Commercial Complex  
**Total Spend:** ₦517,000,000 across 6 categories




