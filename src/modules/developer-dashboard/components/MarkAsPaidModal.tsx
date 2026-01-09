import React, { useState } from 'react';
import { CheckCircle, Calendar, CreditCard, FileText, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

interface MarkAsPaidModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (paymentDetails: PaymentDetails) => Promise<void>;
  invoiceNumber: string;
  amount: number;
  currency: string;
}

export interface PaymentDetails {
  paymentMethod: string;
  paymentReference?: string;
  paidDate?: string;
  notes?: string;
}

export const MarkAsPaidModal: React.FC<MarkAsPaidModalProps> = ({
  open,
  onClose,
  onSubmit,
  invoiceNumber,
  amount,
  currency,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PaymentDetails>({
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    paidDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        paymentMethod: 'bank_transfer',
        paymentReference: '',
        paidDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (error) {
      console.error('Error in MarkAsPaidModal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Mark Invoice as Paid
          </DialogTitle>
          <DialogDescription>
            Record payment details for invoice <strong>{invoiceNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="space-y-4 py-4">
            {/* Invoice Amount Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Invoice Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="text-lg font-semibold text-gray-900">{invoiceNumber}</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                required
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Reference */}
            <div className="space-y-2">
              <Label htmlFor="paymentReference" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Payment Reference / Transaction ID
              </Label>
              <Input
                id="paymentReference"
                placeholder="e.g., TRX-123456, Check #789"
                value={formData.paymentReference}
                onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
              />
              <p className="text-xs text-gray-500">Optional: Enter transaction reference or check number</p>
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paidDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Payment Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paidDate"
                type="date"
                value={formData.paidDate}
                onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Payment Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this payment..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Note:</strong> Marking this invoice as paid will automatically:
              </p>
              <ul className="text-sm text-green-700 mt-2 ml-4 space-y-1 list-disc">
                <li>Create an expense record in Project Expenses</li>
                <li>Deduct the amount from your project budget</li>
                <li>Update the invoice status to "Paid"</li>
                <li>Record all payment details for audit trail</li>
              </ul>
            </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MarkAsPaidModal;

