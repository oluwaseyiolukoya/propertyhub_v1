import React, { useState } from "react";
import { DollarSign, AlertCircle } from "lucide-react";
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


