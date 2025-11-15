# 💰 Add Project Funding - Quick Start

## 🎯 **Quick Answer**

### **Backend:** ✅ Ready to Use
### **Frontend:** ⚠️ Needs UI Component

---

## 🚀 **How to Add Funding (Right Now)**

### **Option 1: Using API Directly**

```bash
curl -X POST http://localhost:5000/api/developer-dashboard/projects/YOUR_PROJECT_ID/funding \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000000,
    "fundingType": "client_payment",
    "fundingSource": "ABC Client",
    "receivedDate": "2025-01-15",
    "status": "received",
    "description": "Phase 1 payment received"
  }'
```

### **Option 2: Using Prisma Studio**

```bash
cd backend
npx prisma studio
```

1. Navigate to `project_funding` table
2. Click "Add record"
3. Fill in the fields
4. Save

---

## 📋 **Required Fields**

### **Minimum Required:**
- `amount` - Funding amount (number)
- `fundingType` - Type of funding (see types below)
- `description` - What is this funding for

### **Recommended:**
- `fundingSource` - Who is providing the funding
- `receivedDate` - When was it received
- `status` - Current status (default: "pending")

---

## 🎨 **Funding Types**

Choose one:
- `client_payment` - Payment from client
- `bank_loan` - Bank loan
- `equity_investment` - Investor funding
- `grant` - Grant funding
- `internal_budget` - Internal budget
- `advance_payment` - Advance from client

---

## 📊 **Funding Status**

- **`pending`** - Expected but not received yet
- **`received`** - Money is in the account ✅ (Shows in cash flow)
- **`partial`** - Partially received
- **`cancelled`** - Funding cancelled

---

## 🔍 **View Funding Records**

### **API Call:**
```bash
curl http://localhost:5000/api/developer-dashboard/projects/YOUR_PROJECT_ID/funding \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### **Response:**
```json
[
  {
    "id": "uuid",
    "amount": 5000000,
    "fundingType": "client_payment",
    "fundingSource": "ABC Client",
    "status": "received",
    "receivedDate": "2025-01-15T00:00:00Z",
    "description": "Phase 1 payment"
  }
]
```

---

## 💡 **Example: Add Client Payment**

```json
{
  "amount": 10000000,
  "currency": "NGN",
  "fundingType": "client_payment",
  "fundingSource": "XYZ Construction Ltd",
  "expectedDate": "2025-02-01",
  "receivedDate": "2025-02-01",
  "status": "received",
  "referenceNumber": "PAY-2025-001",
  "description": "Initial project funding - 50% upfront payment",
  "notes": "Received via bank transfer to account ending in 1234"
}
```

---

## 💡 **Example: Add Bank Loan**

```json
{
  "amount": 20000000,
  "currency": "NGN",
  "fundingType": "bank_loan",
  "fundingSource": "First Bank of Nigeria",
  "expectedDate": "2025-03-01",
  "status": "pending",
  "referenceNumber": "LOAN-2025-456",
  "description": "Construction loan for Phase 2",
  "notes": "Loan approval pending, expected disbursement March 1st"
}
```

---

## 💡 **Example: Add Equity Investment**

```json
{
  "amount": 50000000,
  "currency": "NGN",
  "fundingType": "equity_investment",
  "fundingSource": "ABC Ventures",
  "receivedDate": "2025-01-10",
  "status": "received",
  "referenceNumber": "INV-2025-789",
  "description": "Series A investment round",
  "notes": "20% equity stake"
}
```

---

## 📈 **How It Affects Cash Flow**

### **When Status = "received":**
- ✅ Appears in Cash Flow Analysis as **INFLOW**
- ✅ Shows in the green "Inflow" line on the chart
- ✅ Included in "Total Inflow" summary card

### **When Status = "pending":**
- ⏳ Does NOT appear in current cash flow
- ⏳ Can be used for forecasting (future feature)

---

## 🎨 **Create UI Component (Next Step)**

### **File to Create:**
`src/modules/developer-dashboard/components/AddFundingModal.tsx`

**Full code provided in:** `PROJECT_FUNDING_GUIDE.md`

### **Quick Integration:**

1. **Create the component** (copy code from guide)
2. **Add to Project Dashboard:**
```typescript
import { AddFundingModal } from './AddFundingModal';

// Add button
<Button onClick={() => setIsFundingModalOpen(true)}>
  <DollarSign className="h-4 w-4 mr-2" />
  Add Funding
</Button>

// Add modal
<AddFundingModal
  open={isFundingModalOpen}
  onClose={() => setIsFundingModalOpen(false)}
  projectId={projectId}
  projectCurrency="NGN"
  onSuccess={refetchData}
/>
```

---

## ✅ **Verification Checklist**

After adding funding, verify:

### **1. Check Database:**
```bash
cd backend
npx prisma studio
# Check project_funding table
```

### **2. Check API Response:**
```bash
curl http://localhost:5000/api/developer-dashboard/projects/PROJECT_ID/funding \
  -H "Authorization: Bearer TOKEN"
```

### **3. Check Cash Flow:**
- Open Project Dashboard
- Look at Cash Flow Analysis
- Should see funding in inflow (if status = "received")

---

## 🚨 **Common Issues**

### **Funding Not Showing in Cash Flow?**
- ✅ Check status is "received" (not "pending")
- ✅ Check receivedDate is set
- ✅ Check date is within the selected date range
- ✅ Refresh the page

### **API Error: "Project not found"?**
- ✅ Verify projectId is correct
- ✅ Verify user owns the project
- ✅ Check authentication token

### **Validation Error?**
- ✅ Amount must be > 0
- ✅ fundingType is required
- ✅ description is required

---

## 📚 **Full Documentation**

For complete details, see:
- **`PROJECT_FUNDING_GUIDE.md`** - Complete guide with UI component code
- **`CASH_FLOW_ANALYSIS_SUMMARY.md`** - How funding affects cash flow

---

## 🎯 **Summary**

### **To Add Funding Now:**
1. Use API directly (curl command above)
2. Or use Prisma Studio
3. Set status to "received" to see in cash flow

### **To Add Funding via UI:**
1. Create `AddFundingModal.tsx` component
2. Add button to Project Dashboard
3. Users can add funding through the UI

### **Key Points:**
- ✅ Backend is fully functional
- ✅ API endpoints work
- ✅ Cash flow integration works
- ⚠️ Just need to create UI component

---

**Status:** Backend Ready, UI Pending  
**Time to Implement UI:** 2-3 hours  
**Priority:** High (for accurate cash flow tracking)


