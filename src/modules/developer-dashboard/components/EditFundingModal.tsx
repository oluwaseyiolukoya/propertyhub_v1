import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FundingRecord {
  id: string;
  amount: number;
  currency: string;
  fundingType: string;
  fundingSource: string | null;
  expectedDate: string | null;
  receivedDate: string | null;
  status: string;
  referenceNumber: string | null;
  description: string | null;
  notes: string | null;
}

interface EditFundingModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectCurrency: string;
  funding: FundingRecord;
  onSuccess: () => void;
}

export const EditFundingModal: React.FC<EditFundingModalProps> = ({
  open,
  onClose,
  projectId,
  projectCurrency,
  funding,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: funding.amount.toString(),
    fundingType: funding.fundingType,
    fundingSource: funding.fundingSource || "",
    expectedDate: funding.expectedDate
      ? new Date(funding.expectedDate).toISOString().split("T")[0]
      : "",
    receivedDate: funding.receivedDate
      ? new Date(funding.receivedDate).toISOString().split("T")[0]
      : "",
    status: funding.status,
    referenceNumber: funding.referenceNumber || "",
    description: funding.description || "",
    notes: funding.notes || "",
  });

  // Update form data when funding prop changes
  useEffect(() => {
    setFormData({
      amount: funding.amount.toString(),
      fundingType: funding.fundingType,
      fundingSource: funding.fundingSource || "",
      expectedDate: funding.expectedDate
        ? new Date(funding.expectedDate).toISOString().split("T")[0]
        : "",
      receivedDate: funding.receivedDate
        ? new Date(funding.receivedDate).toISOString().split("T")[0]
        : "",
      status: funding.status,
      referenceNumber: funding.referenceNumber || "",
      description: funding.description || "",
      notes: funding.notes || "",
    });
  }, [funding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!formData.fundingType) {
      toast.error("Please select a funding type");
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
        `/api/developer-dashboard/projects/${projectId}/funding/${funding.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: parseFloat(formData.amount),
            fundingType: formData.fundingType,
            fundingSource: formData.fundingSource || null,
            expectedDate: formData.expectedDate || null,
            receivedDate: formData.receivedDate || null,
            status: formData.status,
            referenceNumber: formData.referenceNumber || null,
            description: formData.description || null,
            notes: formData.notes || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update funding");
      }

      toast.success("Funding updated successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating funding:", error);
      toast.error(error.message || "Failed to update funding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Funding</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount ({projectCurrency}) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>

          {/* Funding Type */}
          <div className="space-y-2">
            <Label htmlFor="fundingType">
              Funding Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.fundingType}
              onValueChange={(value) =>
                setFormData({ ...formData, fundingType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select funding type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client_payment">Client Payment</SelectItem>
                <SelectItem value="bank_loan">Bank Loan</SelectItem>
                <SelectItem value="equity_investment">
                  Equity Investment
                </SelectItem>
                <SelectItem value="grant">Grant</SelectItem>
                <SelectItem value="internal_budget">Internal Budget</SelectItem>
                <SelectItem value="advance_payment">Advance Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Funding Source */}
          <div className="space-y-2">
            <Label htmlFor="fundingSource">Funding Source</Label>
            <Input
              id="fundingSource"
              placeholder="e.g., ABC Bank, Client Name"
              value={formData.fundingSource}
              onChange={(e) =>
                setFormData({ ...formData, fundingSource: e.target.value })
              }
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
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
              <Label htmlFor="receivedDate">Received Date</Label>
              <Input
                id="receivedDate"
                type="date"
                value={formData.receivedDate}
                onChange={(e) =>
                  setFormData({ ...formData, receivedDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              placeholder="e.g., TXN-12345"
              value={formData.referenceNumber}
              onChange={(e) =>
                setFormData({ ...formData, referenceNumber: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the funding"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes (internal use only)"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Funding
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

