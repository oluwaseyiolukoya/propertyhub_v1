# 💸 Expense Creation UI - Implementation Guide

## 🎯 **Overview**

This guide explains where developers should create expenses and how the category system works.

---

## 📋 **Important: Categories vs Expenses**

### **Categories are PREDEFINED** ✅

Categories are **fixed** in the system and **cannot be created** by users. This ensures:

- Consistent reporting across all projects
- Accurate spend analysis
- Proper budget tracking

**Available Categories:**

```typescript
const EXPENSE_CATEGORIES = [
  { value: "labor", label: "Labor & Payroll" },
  { value: "materials", label: "Materials & Supplies" },
  { value: "equipment", label: "Equipment & Machinery" },
  { value: "permits", label: "Permits & Licenses" },
  { value: "professional-fees", label: "Professional Fees" },
  { value: "contingency", label: "Contingency" },
  { value: "other", label: "Other Expenses" },
];
```

### **Expenses are USER-CREATED** ✅

Developers **create expenses** and **select a category** from the predefined list.

---

## 📍 **Where to Add "Create Expense" UI**

### **Option 1: Project Dashboard (Recommended)**

Add an "Add Expense" button in the Project Dashboard header:

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Portfolio    Victoria Island Commercial Complex   │
│                                                               │
│ [Edit Project] [Generate Report] [➕ Add Expense] [Share]   │
└─────────────────────────────────────────────────────────────┘
```

**Location:** Top right of the Project Dashboard, next to "Edit Project"

### **Option 2: Expenses Tab/Section**

Create a dedicated "Expenses" section with a prominent button:

```
┌─────────────────────────────────────────────────────────────┐
│ 💸 Project Expenses                        [➕ Add Expense] │
├─────────────────────────────────────────────────────────────┤
│ Total Spent: ₦517,000,000                                   │
│                                                               │
│ [Table of all expenses here]                                 │
└─────────────────────────────────────────────────────────────┘
```

### **Option 3: Quick Action Menu**

Add a floating action button (FAB) in the bottom right:

```
                                                    ┌─────────┐
                                                    │    ➕   │
                                                    │   Add   │
                                                    └─────────┘
                                                    (Floating)
```

---

## 🎨 **UI Design: Add Expense Modal**

### **Modal Structure:**

```
┌──────────────────────────────────────────────────────────┐
│ ✕                  Add New Expense                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Category *                                              │
│  [Select Category ▼]                                     │
│    ├─ Labor & Payroll                                    │
│    ├─ Materials & Supplies                               │
│    ├─ Equipment & Machinery                              │
│    ├─ Permits & Licenses                                 │
│    ├─ Professional Fees                                  │
│    ├─ Contingency                                        │
│    └─ Other Expenses                                     │
│                                                          │
│  Description *                                           │
│  [Enter expense description...]                          │
│                                                          │
│  Amount (₦) *                                            │
│  [0.00]                                                  │
│                                                          │
│  Tax Amount (₦)                                          │
│  [0.00]                                                  │
│                                                          │
│  Total: ₦0.00                                            │
│                                                          │
│  Payment Date *                                          │
│  [📅 Select date]                                        │
│                                                          │
│  Payment Status *                                        │
│  ○ Pending  ● Paid  ○ Partial                           │
│                                                          │
│  Vendor (Optional)                                       │
│  [Select or add vendor ▼]                                │
│                                                          │
│  Notes (Optional)                                        │
│  [Additional notes...]                                   │
│                                                          │
│                          [Cancel]  [Create Expense]      │
└──────────────────────────────────────────────────────────┘
```

---

## 💻 **Implementation Code**

### **1. Create the AddExpenseModal Component**

```typescript
// src/modules/developer-dashboard/components/AddExpenseModal.tsx

import React, { useState } from "react";
import { X, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  { value: "labor", label: "Labor & Payroll", icon: "👷" },
  { value: "materials", label: "Materials & Supplies", icon: "🏗️" },
  { value: "equipment", label: "Equipment & Machinery", icon: "🏗️" },
  { value: "permits", label: "Permits & Licenses", icon: "📋" },
  { value: "professional-fees", label: "Professional Fees", icon: "👨‍💼" },
  { value: "contingency", label: "Contingency", icon: "⚠️" },
  { value: "other", label: "Other Expenses", icon: "📦" },
];

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export function AddExpenseModal({
  open,
  onClose,
  projectId,
  onSuccess,
}: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    taxAmount: "0",
    paidDate: new Date().toISOString().split("T")[0],
    paymentStatus: "paid",
    notes: "",
  });

  const totalAmount =
    parseFloat(formData.amount || "0") + parseFloat(formData.taxAmount || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.description || !formData.amount) {
      toast.error("Please fill in all required fields");
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

      const response = await fetch(
        `/api/developer-dashboard/projects/${projectId}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: formData.category,
            description: formData.description,
            amount: parseFloat(formData.amount),
            taxAmount: parseFloat(formData.taxAmount || "0"),
            currency: "NGN",
            expenseType: "invoice",
            paidDate: formData.paidDate,
            paymentStatus: formData.paymentStatus,
            status: formData.paymentStatus === "paid" ? "paid" : "pending",
            notes: formData.notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create expense");
      }

      toast.success("Expense created successfully!");
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        category: "",
        description: "",
        amount: "",
        taxAmount: "0",
        paidDate: new Date().toISOString().split("T")[0],
        paymentStatus: "paid",
        notes: "",
      });
    } catch (error: any) {
      console.error("Error creating expense:", error);
      toast.error("Failed to create expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Add New Expense</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expense category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center space-x-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Choose the category that best describes this expense
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g., Construction crew - Phase 2"
              required
            />
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount (₦) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxAmount">Tax Amount (₦)</Label>
              <Input
                id="taxAmount"
                type="number"
                step="0.01"
                value={formData.taxAmount}
                onChange={(e) =>
                  setFormData({ ...formData, taxAmount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Total Display */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Total Amount:
              </span>
              <span className="text-2xl font-bold text-blue-600">
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paidDate">
              Payment Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paidDate"
              type="date"
              value={formData.paidDate}
              onChange={(e) =>
                setFormData({ ...formData, paidDate: e.target.value })
              }
              required
            />
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label>
              Payment Status <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={formData.paymentStatus}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentStatus: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pending" id="pending" />
                <Label htmlFor="pending" className="font-normal cursor-pointer">
                  Pending
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paid" id="paid" />
                <Label htmlFor="paid" className="font-normal cursor-pointer">
                  Paid
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="font-normal cursor-pointer">
                  Partial
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes or details..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### **2. Add Button to Project Dashboard**

```typescript
// In ProjectDashboard.tsx

import { AddExpenseModal } from "./AddExpenseModal";
import { Plus } from "lucide-react";

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projectId,
  onBack,
  onGenerateReport,
  onEditProject,
}) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const { data, loading, error, refetch } = useProjectDashboard(projectId);

  // ... existing code ...

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portfolio
        </Button>

        <div className="flex items-center space-x-2">
          {onEditProject && (
            <Button onClick={onEditProject} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          )}

          {/* ADD THIS BUTTON */}
          <Button
            onClick={() => setShowAddExpense(true)}
            variant="default"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>

          {onGenerateReport && (
            <Button onClick={onGenerateReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          )}

          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* ADD THIS MODAL */}
      <AddExpenseModal
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        projectId={projectId}
        onSuccess={() => {
          refetch(); // Refresh dashboard data
        }}
      />

      {/* Rest of the dashboard content */}
      {/* ... */}
    </div>
  );
};
```

---

## 🎯 **User Flow**

### **Creating an Expense:**

1. **Click "Add Expense"** button in Project Dashboard
2. **Modal opens** with the expense form
3. **Select Category** from dropdown (required)
4. **Enter Description** (e.g., "Steel beams for Phase 2")
5. **Enter Amount** (e.g., 50000000)
6. **Enter Tax** (optional, e.g., 5000000)
7. **See Total** calculated automatically (55000000)
8. **Select Payment Date** (defaults to today)
9. **Choose Payment Status** (Paid/Pending/Partial)
10. **Add Notes** (optional)
11. **Click "Create Expense"**
12. **Success!** Expense is created and dashboard refreshes

---

## 📊 **After Creation**

Once an expense is created:

1. **Appears in Expenses List** (if you have one)
2. **Updates "Spend by Category"** chart automatically
3. **Updates Cash Flow** chart (if payment status is "paid")
4. **Updates Project Budget** tracking
5. **Visible in Reports** and analytics

---

## 🔐 **Permissions**

Only users with these roles can create expenses:

- ✅ Project Owner (Developer)
- ✅ Project Manager
- ❌ Viewers (read-only access)

---

## 💡 **Best Practices**

### **For Users:**

1. **Choose the right category** - This affects reporting
2. **Be descriptive** - Future you will thank you
3. **Enter accurate amounts** - Include tax separately
4. **Mark payment status correctly** - Affects cash flow
5. **Add vendor info** - Helps with tracking

### **For Developers:**

1. **Validate all inputs** - Especially amounts
2. **Show clear error messages** - Help users fix issues
3. **Auto-calculate totals** - Reduce user errors
4. **Provide category descriptions** - Help users choose
5. **Allow editing** - Mistakes happen

---

## 🚀 **Next Steps**

### **Phase 1: Basic Creation** ✅

- Add Expense button
- Modal with form
- Category dropdown
- Submit to API

### **Phase 2: Enhanced Features**

- Edit existing expenses
- Delete expenses
- Bulk import from CSV
- Attach receipts/invoices

### **Phase 3: Advanced**

- Recurring expenses
- Expense templates
- Approval workflows
- Budget alerts

---

## ✅ **Summary**

**Key Points:**

- ✅ Categories are **predefined** (cannot be created by users)
- ✅ Users **create expenses** and **select a category**
- ✅ Add button in **Project Dashboard** (top right)
- ✅ Modal form with **category dropdown**
- ✅ Auto-updates **Spend by Category** chart
- ✅ Simple, intuitive UI

**Implementation:**

1. Create `AddExpenseModal.tsx` component
2. Add "Add Expense" button to Project Dashboard
3. Connect to `/api/developer-dashboard/projects/:id/expenses` endpoint
4. Refresh dashboard after creation

---

**File to Create:** `src/modules/developer-dashboard/components/AddExpenseModal.tsx`  
**File to Modify:** `src/modules/developer-dashboard/components/ProjectDashboard.tsx`  
**API Endpoint:** `POST /api/developer-dashboard/projects/:projectId/expenses`
