# 💰 Project Funding - Complete Guide

## 📋 **Overview**

This guide explains how to add and track project funding in the Developer Dashboard system. The backend API is fully implemented, but the UI component needs to be created.

---

## 🎯 **Current Status**

### ✅ **Backend (Fully Implemented)**

- Database table: `project_funding`
- API endpoints: Create, Read, Update (CRUD operations)
- Cash flow integration: Funding data feeds into cash flow analysis

### ⚠️ **Frontend (Needs Implementation)**

- No UI component exists yet for adding funding
- Need to create: `AddFundingModal.tsx`
- Need to add: Funding management page/section

---

## 🗄️ **Database Schema**

### **`project_funding` Table**

```typescript
{
  id: string; // UUID
  projectId: string; // Project reference
  customerId: string; // Customer reference
  amount: number; // Funding amount
  currency: string; // Default: "NGN"
  fundingType: string; // See types below
  fundingSource: string; // Bank name, investor, client name
  expectedDate: Date; // When funding is expected
  receivedDate: Date; // When funding was actually received
  status: string; // pending, received, partial, cancelled
  referenceNumber: string; // Unique reference (optional)
  description: string; // Description of funding
  notes: string; // Additional notes
  attachments: JSON; // File attachments (optional)
  metadata: JSON; // Additional metadata (optional)
  createdBy: string; // User who created the record
  approvedBy: string; // User who approved (optional)
  approvedAt: Date; // Approval timestamp (optional)
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

---

## 📊 **Funding Types**

The system supports multiple funding types:

1. **`client_payment`** - Payments from clients/customers
2. **`bank_loan`** - Bank loans and financing
3. **`equity_investment`** - Equity investments from investors
4. **`grant`** - Government or private grants
5. **`internal_budget`** - Internal budget allocations
6. **`advance_payment`** - Advance payments from clients

---

## 🔌 **API Endpoints**

### **1. Get All Funding Records**

```http
GET /api/developer-dashboard/projects/:projectId/funding
Authorization: Bearer {token}
```

**Response:**

```json
[
  {
    "id": "uuid",
    "projectId": "project-uuid",
    "amount": 5000000,
    "currency": "NGN",
    "fundingType": "client_payment",
    "fundingSource": "ABC Construction Ltd",
    "expectedDate": "2025-01-15T00:00:00Z",
    "receivedDate": "2025-01-15T00:00:00Z",
    "status": "received",
    "referenceNumber": "REF-2025-001",
    "description": "Phase 1 payment",
    "notes": "Payment received on time",
    "createdAt": "2025-01-10T10:00:00Z",
    "updatedAt": "2025-01-15T14:00:00Z",
    "creator": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

---

### **2. Create New Funding Record**

```http
POST /api/developer-dashboard/projects/:projectId/funding
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "amount": 5000000,
  "currency": "NGN",
  "fundingType": "client_payment",
  "fundingSource": "ABC Construction Ltd",
  "expectedDate": "2025-01-15",
  "receivedDate": "2025-01-15",
  "status": "received",
  "referenceNumber": "REF-2025-001",
  "description": "Phase 1 payment received",
  "notes": "Payment received via bank transfer"
}
```

**Required Fields:**

- `amount` (number)
- `fundingType` (string)

**Optional Fields:**

- `currency` (default: "NGN")
- `fundingSource`
- `expectedDate`
- `receivedDate`
- `status` (default: "pending")
- `referenceNumber`
- `description`
- `notes`

**Response:**

```json
{
  "id": "uuid",
  "projectId": "project-uuid",
  "customerId": "customer-uuid",
  "amount": 5000000,
  "currency": "NGN",
  "fundingType": "client_payment",
  "fundingSource": "ABC Construction Ltd",
  "status": "received",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

## 🎨 **UI Component Needed: AddFundingModal**

Here's the implementation for the funding modal component:

### **File:** `src/modules/developer-dashboard/components/AddFundingModal.tsx`

```typescript
import React, { useState } from "react";
import { DollarSign, AlertCircle, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { toast } from "sonner";

const FUNDING_TYPES = [
  {
    value: "client_payment",
    label: "Client Payment",
    icon: "💰",
    description: "Payment from client/customer",
  },
  {
    value: "bank_loan",
    label: "Bank Loan",
    icon: "🏦",
    description: "Loan from financial institution",
  },
  {
    value: "equity_investment",
    label: "Equity Investment",
    icon: "📈",
    description: "Investment from investors",
  },
  {
    value: "grant",
    label: "Grant",
    icon: "🎁",
    description: "Government or private grant",
  },
  {
    value: "internal_budget",
    label: "Internal Budget",
    icon: "🏢",
    description: "Internal company budget",
  },
  {
    value: "advance_payment",
    label: "Advance Payment",
    icon: "⚡",
    description: "Advance from client",
  },
];

const FUNDING_STATUSES = [
  { value: "pending", label: "Pending", color: "text-yellow-600" },
  { value: "received", label: "Received", color: "text-green-600" },
  { value: "partial", label: "Partial", color: "text-blue-600" },
  { value: "cancelled", label: "Cancelled", color: "text-red-600" },
];

interface AddFundingModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectCurrency?: string;
  onSuccess: () => void;
}

export function AddFundingModal({
  open,
  onClose,
  projectId,
  projectCurrency = "NGN",
  onSuccess,
}: AddFundingModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fundingType: "",
    fundingSource: "",
    amount: "",
    expectedDate: "",
    receivedDate: "",
    status: "pending",
    referenceNumber: "",
    description: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      NGN: "₦",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    return symbols[currency] || currency;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fundingType) {
      newErrors.fundingType = "Please select a funding type";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Please enter a description";
    }

    // If status is 'received', receivedDate is required
    if (formData.status === "received" && !formData.receivedDate) {
      newErrors.receivedDate =
        "Received date is required when status is 'Received'";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const payload = {
        amount: parseFloat(formData.amount),
        currency: projectCurrency,
        fundingType: formData.fundingType,
        fundingSource: formData.fundingSource || undefined,
        expectedDate: formData.expectedDate || undefined,
        receivedDate: formData.receivedDate || undefined,
        status: formData.status,
        referenceNumber: formData.referenceNumber || undefined,
        description: formData.description,
        notes: formData.notes || undefined,
      };

      const response = await fetch(
        `/api/developer-dashboard/projects/${projectId}/funding`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create funding record");
      }

      toast.success("Funding record created successfully!");
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        fundingType: "",
        fundingSource: "",
        amount: "",
        expectedDate: "",
        receivedDate: "",
        status: "pending",
        referenceNumber: "",
        description: "",
        notes: "",
      });
    } catch (error: any) {
      console.error("Error creating funding:", error);
      toast.error(error.message || "Failed to create funding record");
    } finally {
      setLoading(false);
    }
  };

  const selectedFundingType = FUNDING_TYPES.find(
    (type) => type.value === formData.fundingType
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Add Project Funding</span>
          </DialogTitle>
          <DialogDescription>
            Record new funding received or expected for this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Funding Type */}
          <div className="space-y-2">
            <Label htmlFor="fundingType">
              Funding Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.fundingType}
              onValueChange={(value) => {
                setFormData({ ...formData, fundingType: value });
                setErrors({ ...errors, fundingType: "" });
              }}
            >
              <SelectTrigger
                className={errors.fundingType ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select funding type" />
              </SelectTrigger>
              <SelectContent>
                {FUNDING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <span>{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fundingType && (
              <p className="text-xs text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.fundingType}</span>
              </p>
            )}
            {selectedFundingType && (
              <p className="text-xs text-gray-500">
                {selectedFundingType.description}
              </p>
            )}
          </div>

          {/* Funding Source */}
          <div className="space-y-2">
            <Label htmlFor="fundingSource">Funding Source</Label>
            <Input
              id="fundingSource"
              value={formData.fundingSource}
              onChange={(e) =>
                setFormData({ ...formData, fundingSource: e.target.value })
              }
              placeholder="e.g., ABC Bank, John Investor, XYZ Client"
            />
            <p className="text-xs text-gray-500">
              Name of bank, investor, client, or funding source
            </p>
          </div>

          {/* Amount and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount ({getCurrencySymbol(projectCurrency)}){" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                  setErrors({ ...errors, amount: "" });
                }}
                placeholder="0.00"
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && (
                <p className="text-xs text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.amount}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <span className={status.color}>{status.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedDate">Expected Date</Label>
              <Input
                id="expectedDate"
                type="date"
                value={formData.expectedDate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receivedDate">
                Received Date
                {formData.status === "received" && (
                  <span className="text-red-500"> *</span>
                )}
              </Label>
              <Input
                id="receivedDate"
                type="date"
                value={formData.receivedDate}
                onChange={(e) => {
                  setFormData({ ...formData, receivedDate: e.target.value });
                  setErrors({ ...errors, receivedDate: "" });
                }}
                className={errors.receivedDate ? "border-red-500" : ""}
              />
              {errors.receivedDate && (
                <p className="text-xs text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.receivedDate}</span>
                </p>
              )}
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              value={formData.referenceNumber}
              onChange={(e) =>
                setFormData({ ...formData, referenceNumber: e.target.value })
              }
              placeholder="e.g., REF-2025-001, TXN-123456"
            />
            <p className="text-xs text-gray-500">
              Transaction reference, invoice number, or tracking ID
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setErrors({ ...errors, description: "" });
              }}
              placeholder="Describe the funding source and purpose..."
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-xs text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any additional information or notes..."
              rows={2}
            />
          </div>

          {/* Summary */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Funding Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {getCurrencySymbol(projectCurrency)}
                  {parseFloat(formData.amount || "0").toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-300" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Funding
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddFundingModal;
```

---

## 🎯 **How to Use the Component**

### **1. Import the Component**

```typescript
import { AddFundingModal } from "./components/AddFundingModal";
```

### **2. Add State Management**

```typescript
const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
```

### **3. Add Button to Open Modal**

```typescript
<Button onClick={() => setIsFundingModalOpen(true)}>
  <Plus className="h-4 w-4 mr-2" />
  Add Funding
</Button>
```

### **4. Render the Modal**

```typescript
<AddFundingModal
  open={isFundingModalOpen}
  onClose={() => setIsFundingModalOpen(false)}
  projectId={projectId}
  projectCurrency="NGN"
  onSuccess={() => {
    // Refresh funding list or cash flow data
    refetchFunding();
  }}
/>
```

---

## 📊 **Integration Points**

### **1. Project Dashboard**

Add funding button in the Project Dashboard header:

```typescript
// In ProjectDashboard.tsx
<Button
  className="gap-2 bg-green-600 hover:bg-green-700"
  onClick={() => setIsFundingModalOpen(true)}
>
  <DollarSign className="w-4 h-4" />
  Add Funding
</Button>
```

### **2. Cash Flow Chart**

The funding data automatically appears in the Cash Flow Chart once added (status = 'received').

### **3. Budget Management**

Consider showing total funding vs total budget comparison.

---

## 📈 **Tracking Funding**

### **View Funding Records**

Create a funding list component to display all funding records:

```typescript
// FundingList.tsx
const [fundingRecords, setFundingRecords] = useState([]);

useEffect(() => {
  fetchFunding();
}, [projectId]);

const fetchFunding = async () => {
  const response = await fetch(
    `/api/developer-dashboard/projects/${projectId}/funding`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  setFundingRecords(data);
};
```

### **Display Funding Summary**

```typescript
const totalFunding = fundingRecords
  .filter((f) => f.status === "received")
  .reduce((sum, f) => sum + f.amount, 0);

const pendingFunding = fundingRecords
  .filter((f) => f.status === "pending")
  .reduce((sum, f) => sum + f.amount, 0);
```

---

## 🔄 **Workflow**

### **Typical Funding Flow:**

1. **Expected Funding:**

   - Create funding record with `status: "pending"`
   - Set `expectedDate`
   - No `receivedDate` yet

2. **Funding Received:**

   - Update status to `"received"`
   - Set `receivedDate`
   - Funding now appears in cash flow inflow

3. **Partial Funding:**

   - Set status to `"partial"`
   - Create another record for remaining amount

4. **Cancelled Funding:**
   - Update status to `"cancelled"`
   - Does not count in cash flow

---

## 📋 **Best Practices**

### **1. Data Entry:**

- ✅ Always enter amount accurately
- ✅ Use clear, descriptive descriptions
- ✅ Add reference numbers for tracking
- ✅ Set received date when status is "received"

### **2. Status Management:**

- Use "pending" for expected funding
- Use "received" only when money is in account
- Use "partial" for installment payments
- Use "cancelled" for funding that won't come

### **3. Documentation:**

- Add notes about payment terms
- Record bank transfer details
- Note any conditions or requirements

---

## 🧪 **Testing**

### **1. Create Test Funding:**

```bash
curl -X POST http://localhost:5000/api/developer-dashboard/projects/PROJECT_ID/funding \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000000,
    "fundingType": "client_payment",
    "fundingSource": "Test Client",
    "receivedDate": "2025-01-15",
    "status": "received",
    "description": "Test funding"
  }'
```

### **2. Verify in Cash Flow:**

- Open Project Dashboard
- Check Cash Flow Analysis
- Should see funding in inflow

### **3. Check Database:**

```bash
cd backend
npx prisma studio
# Navigate to project_funding table
```

---

## 📚 **Related Documentation**

- `CASH_FLOW_ANALYSIS_SUMMARY.md` - How funding affects cash flow
- `EXPENSE_CREATION_UI_GUIDE.md` - Similar pattern for expenses
- `CASHFLOW_IMPLEMENTATION_SUMMARY.md` - Complete cash flow system

---

## ✅ **Summary**

### **To Add Funding:**

1. Create `AddFundingModal.tsx` component (code provided above)
2. Add button in Project Dashboard
3. Use the modal to enter funding details
4. Submit to API
5. Funding appears in cash flow automatically

### **To Track Funding:**

1. Fetch funding records from API
2. Display in a list/table
3. Show totals by status
4. Integrate with cash flow charts

### **Key Points:**

- ✅ Backend API is ready
- ✅ Database table exists
- ✅ Cash flow integration works
- ⚠️ Need to create UI component
- ⚠️ Need to add to Project Dashboard

---

**Status:** Backend Complete, Frontend Needs Implementation  
**Priority:** High (Required for accurate cash flow)  
**Estimated Time:** 2-3 hours for full implementation

