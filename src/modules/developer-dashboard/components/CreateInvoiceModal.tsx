import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Calendar } from '../../../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';
import type { CreateInvoiceRequest } from '../types';

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId?: string;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  open,
  onClose,
  onSuccess,
  projectId,
}) => {
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    invoiceNumber: '',
    description: '',
    category: 'materials',
    amount: 0,
    vendorId: undefined,
    dueDate: undefined,
    notes: undefined,
  });
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Mock data - will be replaced with API calls
  const projects = [
    { id: 'proj-1', name: 'Lekki Heights Residential' },
    { id: 'proj-2', name: 'Victoria Island Tower' },
    { id: 'proj-3', name: 'Ikoyi Gardens Estate' },
  ];

  const vendors = [
    { id: 'vendor-1', name: 'BuildRight Steel Ltd' },
    { id: 'vendor-2', name: 'PowerTech Solutions' },
    { id: 'vendor-3', name: 'Concrete Masters' },
    { id: 'vendor-4', name: 'Design Studio Pro' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const isValid = () => {
    return (
      selectedProject &&
      formData.invoiceNumber &&
      formData.description &&
      formData.amount > 0
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Add a new invoice for project expenses and vendor payments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Selection */}
          {!projectId && (
            <div className="space-y-2">
              <Label htmlFor="project">
                Project <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Invoice Number */}
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">
              Invoice Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="invoiceNumber"
              placeholder="e.g., INV-2025-001"
              value={formData.invoiceNumber}
              onChange={(e) =>
                setFormData({ ...formData, invoiceNumber: e.target.value })
              }
            />
          </div>

          {/* Vendor */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Select
              value={formData.vendorId}
              onValueChange={(value) =>
                setFormData({ ...formData, vendorId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor (optional)" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the invoice items or services..."
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Category and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="permits">Permits</SelectItem>
                  <SelectItem value="professional-fees">Professional Fees</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="contingency">Contingency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount (₦) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setFormData({
                      ...formData,
                      dueDate: date?.toISOString(),
                    });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information or notes..."
              rows={2}
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid() || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceModal;

