import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Download,
  Printer,
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
  Loader2,
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
import { apiClient } from '../../../lib/api-client';

interface InvoiceDetailModalProps {
  invoice: ProjectInvoice;
  open: boolean;
  onClose: () => void;
  onApprove: (invoiceId: string) => void;
  onReject: (invoiceId: string) => void;
  onMarkAsPaid: (invoiceId: string) => void;
}

interface InvoiceAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  fileType: string;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    email: string;
    name?: string;
  };
  url: string;
  metadata?: any;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  open,
  onClose,
  onApprove,
  onReject,
  onMarkAsPaid,
}) => {
  const [attachments, setAttachments] = useState<InvoiceAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const invoiceContentRef = useRef<HTMLDivElement>(null);

  // Organization data state
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [loadingOrganization, setLoadingOrganization] = useState(false);

  // Fetch organization data
  const fetchOrganizationData = async () => {
    try {
      setLoadingOrganization(true);
      console.log('[InvoiceDetailModal] Fetching organization data...');
      const response = await apiClient.get<any>('/api/auth/account');
      console.log('[InvoiceDetailModal] Account response:', response);

      if (response.data) {
        console.log('[InvoiceDetailModal] Customer data:', response.data.customer);
        setOrganizationData(response.data.customer);
      } else if (response.error) {
        console.error('[InvoiceDetailModal] Error in response:', response.error);
      }
    } catch (error) {
      console.error('[InvoiceDetailModal] Failed to fetch organization data:', error);
    } finally {
      setLoadingOrganization(false);
    }
  };

  // Fetch attachments and organization data when modal opens
  useEffect(() => {
    if (open && invoice.id && invoice.projectId) {
      fetchAttachments();
      fetchOrganizationData();
    }
  }, [open, invoice.id, invoice.projectId]);

  const fetchAttachments = async () => {
    setLoadingAttachments(true);
    setAttachmentError(null);
    try {
      const response = await apiClient.get<any>(
        `/api/developer-dashboard/projects/${invoice.projectId}/invoices/${invoice.id}/attachments`
      );

      if (response.error) {
        console.error('Error fetching attachments:', response.error);
        setAttachmentError(response.error.message || 'Failed to load attachments');
        setAttachments([]);
      } else if (response.data?.success && response.data?.data) {
        setAttachments(response.data.data);
      } else {
        setAttachments([]);
      }
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
      setAttachmentError('Failed to load attachments');
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      // Dynamically import html2canvas and jsPDF
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      if (!invoiceContentRef.current) return;

      // Generate canvas from the invoice content with high quality
      const canvas = await html2canvas(invoiceContentRef.current, {
        scale: 3, // Higher quality for crisp text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Convert canvas to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // A4 dimensions: 210mm x 297mm with margins
      const pdfWidth = 210;
      const marginLeft = 10;
      const marginTop = 10;
      const contentWidth = pdfWidth - (marginLeft * 2); // 190mm content width

      // Calculate scaled height to maintain aspect ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = contentWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      // Add image to PDF with margins
      pdf.addImage(imgData, 'PNG', marginLeft, marginTop, contentWidth, scaledHeight);
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body * {
            visibility: hidden;
          }
          #invoice-content, #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 210mm;
            font-size: 10px !important;
          }
          #invoice-content * {
            font-size: 10px !important;
            line-height: 1.4 !important;
          }
          #invoice-content h1 {
            font-size: 18px !important;
          }
          #invoice-content h2 {
            font-size: 16px !important;
          }
          #invoice-content h3 {
            font-size: 11px !important;
          }
          #invoice-content h4 {
            font-size: 10px !important;
          }
          #invoice-content .invoice-amount {
            font-size: 20px !important;
          }
          #invoice-content .invoice-number {
            font-size: 12px !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>
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

        <div ref={invoiceContentRef} id="invoice-content" className="space-y-4 bg-white p-6">
          {/* Professional Invoice Header */}
          <div className="border-b-2 border-orange-500 pb-3">
            <div className="flex justify-between items-start">
              {/* Company Info */}
              <div>
                {loadingOrganization ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-xs text-gray-500">Loading organization...</p>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">
                      {organizationData?.company || 'CONTREZZ'}
                    </h1>
                    {organizationData?.street && (
                      <p className="text-xs text-gray-600">{organizationData.street}</p>
                    )}
                    {(organizationData?.city || organizationData?.state) && (
                      <p className="text-xs text-gray-600">
                        {[organizationData?.city, organizationData?.state, organizationData?.postalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {organizationData?.phone && (
                      <p className="text-xs text-gray-600">{organizationData.phone}</p>
                    )}
                    {organizationData?.website && (
                      <p className="text-xs text-gray-600">{organizationData.website}</p>
                    )}
                    {organizationData?.email && (
                      <p className="text-xs text-gray-600">{organizationData.email}</p>
                    )}
                    {!loadingOrganization && !organizationData?.company && (
                      <p className="text-xs text-gray-500 italic mt-1">
                        (Update organization details in Settings)
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Invoice Label */}
              <div className="text-right">
                <h2 className="text-2xl font-bold text-orange-500 mb-1">INVOICE</h2>
                <div className="bg-gray-100 px-3 py-1 rounded">
                  <p className="text-xs text-gray-600 mb-0.5">Invoice Number</p>
                  <p className="invoice-number text-sm font-bold text-gray-900">{invoice.invoiceNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column - Dates & Status */}
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Invoice Date</p>
                <p className="text-xs text-gray-900">{formatDate(invoice.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Due Date</p>
                <p className="text-xs text-gray-900 font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Status</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  invoice.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Category</p>
                <p className="text-xs text-gray-900 capitalize">{invoice.category.replace('-', ' ')}</p>
              </div>
            </div>

            {/* Right Column - Amount */}
            <div className="bg-orange-50 p-3 rounded border border-orange-200">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Amount to Pay</p>
              <p className="invoice-amount text-2xl font-bold text-orange-600">{formatCurrency(invoice.amount)}</p>
              <p className="text-xs text-gray-600 mt-1">Currency: {invoice.currency || 'NGN'}</p>
            </div>
          </div>

          {/* Vendor Information - Pay To */}
          {invoice.vendor && (
            <div className="border border-gray-200 rounded p-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b pb-1">
                Pay To
              </h3>
              <div className="space-y-1.5">
                <div>
                  <p className="text-sm font-bold text-gray-900">{invoice.vendor.name}</p>
                  <p className="text-xs text-gray-600 capitalize">{invoice.vendor.vendorType}</p>
                </div>
                {invoice.vendor.email && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 font-semibold w-14">Email:</span>
                    <span className="text-xs text-gray-900">{invoice.vendor.email}</span>
                  </div>
                )}
                {invoice.vendor.phone && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 font-semibold w-14">Phone:</span>
                    <span className="text-xs text-gray-900">{invoice.vendor.phone}</span>
                  </div>
                )}
                {invoice.vendor.contactPerson && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 font-semibold w-14">Contact:</span>
                    <span className="text-xs text-gray-900">{invoice.vendor.contactPerson}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description - Invoice Items */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-1.5 border-b border-gray-300 pb-1">
              Description of Services / Items
            </h3>
            <div className="bg-gray-50 p-2 rounded border border-gray-200">
              <p className="text-xs text-gray-900 leading-relaxed whitespace-pre-wrap">{invoice.description}</p>
            </div>

            {/* Budget Category */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Budget Category:</span>
              <span className="text-xs text-gray-900 capitalize bg-blue-50 px-2 py-1 rounded border border-blue-200">
                {invoice.category.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Amount Breakdown Table */}
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase px-3 py-2">Description</th>
                  <th className="text-right text-xs font-semibold text-gray-600 uppercase px-3 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="px-3 py-2 text-xs text-gray-900">{invoice.category.replace('-', ' ').toUpperCase()}</td>
                  <td className="px-3 py-2 text-xs text-gray-900 text-right font-medium">{formatCurrency(invoice.amount)}</td>
                </tr>
              </tbody>
              <tfoot className="bg-orange-50 border-t border-orange-300">
                <tr>
                  <td className="px-3 py-2 text-xs font-bold text-gray-900 uppercase">Amount to Pay</td>
                  <td className="px-3 py-2 text-right text-sm font-bold text-orange-600">{formatCurrency(invoice.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Information */}
          {(invoice.status === 'paid' || invoice.status === 'approved') && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <h3 className="text-xs font-bold text-green-800 uppercase mb-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {invoice.approver && (
                  <div>
                    <p className="text-xs text-green-700 font-semibold mb-0.5">Approved By</p>
                    <p className="text-xs text-gray-900">{invoice.approver.email}</p>
                    {invoice.approver.name && (
                      <p className="text-xs text-gray-500">{invoice.approver.name}</p>
                    )}
                  </div>
                )}
                {invoice.approvedAt && (
                  <div>
                    <p className="text-xs text-green-700 font-semibold mb-0.5">Approved On</p>
                    <p className="text-xs text-gray-900">{formatDate(invoice.approvedAt)}</p>
                  </div>
                )}
                {invoice.paidDate && (
                  <div>
                    <p className="text-xs text-green-700 font-semibold mb-0.5">Paid On</p>
                    <p className="text-xs text-gray-900 font-bold">{formatDate(invoice.paidDate)}</p>
                  </div>
                )}
                {invoice.paymentMethod && (
                  <div>
                    <p className="text-xs text-green-700 font-semibold mb-0.5">Payment Method</p>
                    <p className="text-xs text-gray-900 capitalize">{invoice.paymentMethod}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="border-l-2 border-blue-500 bg-blue-50 p-2 rounded">
              <h3 className="text-xs font-bold text-blue-800 uppercase mb-1">Additional Notes</h3>
              <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Attachments */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-1.5 border-b border-gray-300 pb-1 flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              Attachments ({attachments.length})
            </h3>
            {loadingAttachments ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading attachments...</span>
              </div>
            ) : attachmentError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{attachmentError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAttachments}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : attachments.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">
                No attachments have been uploaded for this invoice.
              </p>
            ) : (
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {att.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {att.fileSizeFormatted} •{' '}
                          {new Date(att.uploadedAt).toLocaleDateString('en-NG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {att.uploadedBy?.email && ` • ${att.uploadedBy.email}`}
                        </p>
                      </div>
                    </div>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

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

          {/* Footer - Payment Information */}
          <div className="mt-4 pt-3 border-t border-gray-300">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-1">Payment Details</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  This invoice records payment to vendor for services/materials provided to the project. Payment will be deducted from the project budget upon marking as paid.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-1">Questions or Issues?</h4>
                <p className="text-xs text-gray-600">
                  For questions about this payment record:<br />
                  {organizationData?.email && (
                    <>Email: {organizationData.email}<br /></>
                  )}
                  {organizationData?.phone && (
                    <>Phone: {organizationData.phone}</>
                  )}
                  {!organizationData?.email && !organizationData?.phone && (
                    <>
                      Email: accounts@contrezz.com<br />
                      Phone: +234 XXX XXX XXXX
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Footer Bar */}
            <div className="bg-gray-900 text-white px-4 py-2 -mx-6 -mb-6 rounded-b text-center">
              <p className="text-xs">
                Payment Record • Generated on {new Date().toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {organizationData?.company || 'CONTREZZ'} - Property Development Management
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t print-hide">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>

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
    </>
  );
};

export default InvoiceDetailModal;

