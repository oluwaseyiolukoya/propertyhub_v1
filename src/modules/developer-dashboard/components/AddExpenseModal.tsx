import React, { useState } from "react";
import { DollarSign, AlertCircle, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  { value: "labor", label: "Labor & Payroll", icon: "👷", description: "Construction crew, electricians, plumbers" },
  { value: "materials", label: "Materials & Supplies", icon: "🏗️", description: "Steel, concrete, wood, paint" },
  { value: "equipment", label: "Equipment & Machinery", icon: "🔧", description: "Cranes, excavators, tools" },
  { value: "permits", label: "Permits & Licenses", icon: "📋", description: "Building permits, approvals" },
  { value: "professional-fees", label: "Professional Fees", icon: "👨‍💼", description: "Architects, engineers, consultants" },
  { value: "contingency", label: "Contingency", icon: "⚠️", description: "Unexpected costs, emergencies" },
  { value: "other", label: "Other Expenses", icon: "📦", description: "Miscellaneous items" },
];

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectCurrency?: string;
  onSuccess: () => void;
}

export function AddExpenseModal({
  open,
  onClose,
  projectId,
  projectCurrency = "NGN",
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalAmount =
    parseFloat(formData.amount || "0") + parseFloat(formData.taxAmount || "0");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Please enter a description";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (parseFloat(formData.taxAmount || "0") < 0) {
      newErrors.taxAmount = "Tax amount cannot be negative";
    }

    if (!formData.paidDate) {
      newErrors.paidDate = "Please select a payment date";
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
        toast.error("Authentication required", {
          description: "Please log in again.",
        });
        return;
      }

      console.log("[AddExpense] Creating expense:", {
        projectId,
        category: formData.category,
        amount: parseFloat(formData.amount),
      });

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
            currency: projectCurrency,
            expenseType: "invoice",
            paidDate: formData.paidDate,
            paymentStatus: formData.paymentStatus,
            status: formData.paymentStatus === "paid" ? "paid" : "pending",
            notes: formData.notes || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create expense");
      }

      const newExpense = await response.json();
      console.log("[AddExpense] Expense created successfully:", newExpense.id);

      // Update project progress automatically
      try {
        await fetch(`/api/developer-dashboard/projects/${projectId}/progress/update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log("[AddExpense] Project progress updated automatically");
      } catch (progressError) {
        console.warn("[AddExpense] Failed to update progress:", progressError);
        // Don't fail the whole operation if progress update fails
      }

      toast.success("Expense Created Successfully!", {
        description: `${formData.description} has been added to the project.`,
      });

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
      setErrors({});

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("[AddExpense] Error creating expense:", error);
      toast.error("Failed to Create Expense", {
        description: error.message || "Please try again or contact support.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        category: "",
        description: "",
        amount: "",
        taxAmount: "0",
        paidDate: new Date().toISOString().split("T")[0],
        paymentStatus: "paid",
        notes: "",
      });
      setErrors({});
      onClose();
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      NGN: "₦",
      XOF: "CFA",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    return symbols[currency] || currency;
  };

  const selectedCategory = EXPENSE_CATEGORIES.find(
    (cat) => cat.value === formData.category
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-white" />
            <span>Add New Expense</span>
          </DialogTitle>
          <DialogDescription className="text-purple-100 mt-2">
            Add a new expense to track project costs and payments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 pl-8">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => {
                setFormData({ ...formData, category: value });
                setErrors({ ...errors, category: "" });
              }}
            >
              <SelectTrigger className={`h-11 ${errors.category ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Select expense category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">{cat.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-medium">{cat.label}</span>
                        <span className="text-xs text-gray-500">
                          {cat.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.category}</span>
              </p>
            )}
            {selectedCategory && (
              <p className="text-xs text-gray-500">
                {selectedCategory.icon} {selectedCategory.description}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Description <span className="text-red-500">*</span>
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setErrors({ ...errors, description: "" });
              }}
              placeholder="e.g., Construction crew - Phase 2"
              className={`h-11 ${errors.description ? "border-red-500" : ""}`}
            />
            {errors.description && (
              <p className="text-xs text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.description}</span>
              </p>
            )}
            <p className="text-xs text-gray-500">
              Be specific about what this expense is for
            </p>
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">
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
                className={`h-11 ${errors.amount ? "border-red-500" : ""}`}
              />
              {errors.amount && (
                <p className="text-xs text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.amount}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxAmount" className="text-sm font-semibold text-gray-700">
                Tax Amount ({getCurrencySymbol(projectCurrency)})
              </Label>
              <Input
                id="taxAmount"
                type="number"
                step="0.01"
                min="0"
                value={formData.taxAmount}
                onChange={(e) => {
                  setFormData({ ...formData, taxAmount: e.target.value });
                  setErrors({ ...errors, taxAmount: "" });
                }}
                placeholder="0.00"
                className={`h-11 ${errors.taxAmount ? "border-red-500" : ""}`}
              />
              {errors.taxAmount && (
                <p className="text-xs text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.taxAmount}</span>
                </p>
              )}
            </div>
          </div>

          {/* Total Display */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  Total Amount:
                </span>
              </div>
              <span className="text-2xl font-bold text-[#7C3AED]">
                {getCurrencySymbol(projectCurrency)}
                {totalAmount.toLocaleString()}
              </span>
            </div>
            {parseFloat(formData.taxAmount || "0") > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200 text-xs text-gray-600">
                Base: {getCurrencySymbol(projectCurrency)}
                {parseFloat(formData.amount || "0").toLocaleString()} + Tax:{" "}
                {getCurrencySymbol(projectCurrency)}
                {parseFloat(formData.taxAmount || "0").toLocaleString()}
              </div>
            )}
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paidDate" className="text-sm font-semibold text-gray-700">
              Payment Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paidDate"
              type="date"
              value={formData.paidDate}
              onChange={(e) => {
                setFormData({ ...formData, paidDate: e.target.value });
                setErrors({ ...errors, paidDate: "" });
              }}
              className={`h-11 ${errors.paidDate ? "border-red-500" : ""}`}
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.paidDate && (
              <p className="text-xs text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.paidDate}</span>
              </p>
            )}
            <p className="text-xs text-gray-500">
              When was this expense paid or due?
            </p>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Payment Status <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={formData.paymentStatus}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentStatus: value })
              }
              className="flex space-x-4"
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
            <p className="text-xs text-gray-500">
              {formData.paymentStatus === "paid"
                ? "This expense will be included in cash flow calculations"
                : formData.paymentStatus === "partial"
                ? "Partially paid expenses are tracked separately"
                : "Pending expenses won't affect cash flow until marked as paid"}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes, invoice numbers, or details..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Add any additional information about this expense
            </p>
          </div>

        </form>
        <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as any);
            }}
            disabled={loading}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Expense
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}





