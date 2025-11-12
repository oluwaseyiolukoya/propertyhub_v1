import React from 'react';
import {
  X,
  Download,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  FileText,
  User,
  Building2,
  Tag,
  Clock,
  Paperclip,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Separator } from '../../../components/ui/separator';
import type { ProjectInvoice, InvoiceStatus } from '../types';

interface InvoiceDetailModalProps {
  invoice: ProjectInvoice;
  open: boolean;
  onClose: () => void;
  onApprove: (invoiceId: string) => void;
  onReject: (invoiceId: string) => void;
  onMarkAsPaid: (invoiceId: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  open,
  onClose,
  onApprove,
  onReject,
  onMarkAsPaid,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: invoice.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants = {
      pending: { variant: 'outline' as const, icon: Clock, color: 'text-amber-600 border-amber-600', label: 'Pending Approval' },
      approved: { variant: 'outline' as const, icon: CheckCircle, color: 'text-blue-600 border-blue-600', label: 'Approved' },
      paid: { variant: 'default' as const, icon: CheckCircle, color: 'text-white', bg: 'bg-green-600 hover:bg-green-700', label: 'Paid' },
      rejected: { variant: 'destructive' as const, icon: XCircle, color: 'text-white', label: 'Rejected' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`gap-1 ${config.bg || config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </Badge>
    );
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download invoice:', invoice.id);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Invoice Details</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Created on {formatDate(invoice.createdAt)}
              </p>
            </div>
            {getStatusBadge(invoice.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                <p className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(invoice.amount)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Category</p>
                <Badge variant="outline" className="capitalize">
                  {invoice.category.replace('-', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Due Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{formatDate(invoice.dueDate)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vendor Information */}
          {invoice.vendor && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Vendor Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vendor Name</p>
                    <p className="text-gray-900 font-medium">{invoice.vendor.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vendor Type</p>
                    <p className="text-gray-900 capitalize">{invoice.vendor.vendorType}</p>
                  </div>
                  {invoice.vendor.email && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="text-gray-900">{invoice.vendor.email}</p>
                    </div>
                  )}
                  {invoice.vendor.phone && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone</p>
                      <p className="text-gray-900">{invoice.vendor.phone}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Description
            </h3>
            <p className="text-gray-700 leading-relaxed">{invoice.description}</p>
          </div>

          {/* Payment Information */}
          {(invoice.status === 'paid' || invoice.status === 'approved') && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {invoice.approvedBy && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Approved By</p>
                      <p className="text-gray-900">User #{invoice.approvedBy.slice(0, 8)}</p>
                    </div>
                  )}
                  {invoice.approvedAt && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Approved On</p>
                      <p className="text-gray-900">{formatDate(invoice.approvedAt)}</p>
                    </div>
                  )}
                  {invoice.paidDate && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Paid On</p>
                      <p className="text-gray-900">{formatDate(invoice.paidDate)}</p>
                    </div>
                  )}
                  {invoice.paymentMethod && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                      <p className="text-gray-900">{invoice.paymentMethod}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Notes</h3>
                <p className="text-gray-700 leading-relaxed">{invoice.notes}</p>
              </div>
            </>
          )}

          {/* Attachments */}
          {invoice.attachments && invoice.attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Attachments
                </h3>
                <div className="space-y-2">
                  {invoice.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900">Attachment {index + 1}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Timeline */}
          <Separator />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <div>
                  <p className="text-gray-900 font-medium">Invoice Created</p>
                  <p className="text-sm text-gray-500">{formatDate(invoice.createdAt)}</p>
                </div>
              </div>
              {invoice.approvedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                  <div>
                    <p className="text-gray-900 font-medium">Invoice Approved</p>
                    <p className="text-sm text-gray-500">{formatDate(invoice.approvedAt)}</p>
                  </div>
                </div>
              )}
              {invoice.paidDate && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                  <div>
                    <p className="text-gray-900 font-medium">Payment Completed</p>
                    <p className="text-sm text-gray-500">{formatDate(invoice.paidDate)}</p>
                  </div>
                </div>
              )}
              {invoice.status === 'rejected' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-600 mt-2"></div>
                  <div>
                    <p className="text-gray-900 font-medium">Invoice Rejected</p>
                    <p className="text-sm text-gray-500">{formatDate(invoice.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>

          <div className="flex gap-2">
            {invoice.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    onReject(invoice.id);
                    onClose();
                  }}
                  className="gap-2 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    onApprove(invoice.id);
                    onClose();
                  }}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
              </>
            )}
            {invoice.status === 'approved' && (
              <Button
                onClick={() => {
                  onMarkAsPaid(invoice.id);
                  onClose();
                }}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Paid
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailModal;

