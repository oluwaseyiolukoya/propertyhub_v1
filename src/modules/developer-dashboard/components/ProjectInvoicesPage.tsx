import React, { useMemo, useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Trash2,
  Calendar,
  FileText,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useProjectInvoices } from '../hooks/useDeveloperDashboardData';
import type { ProjectInvoice, InvoiceStatus } from '../types';
import InvoiceDetailModal from './InvoiceDetailModal';
import CreateInvoiceModal from './CreateInvoiceModal';
import MarkAsPaidModal, { type PaymentDetails } from './MarkAsPaidModal';
import {
  deleteProjectInvoice,
  approveProjectInvoice,
  rejectProjectInvoice,
  markInvoiceAsPaid
} from '../../../lib/api/invoices';

interface ProjectInvoicesPageProps {
  projectId: string;
  canApproveInvoices?: boolean;
}

const statusToBadge = (status: InvoiceStatus) => {
  const variants = {
    pending: { variant: 'default' as const, icon: Clock, label: 'Pending', className: 'bg-amber-500 hover:bg-amber-600 text-white' },
    approved: { variant: 'outline' as const, icon: CheckCircle, label: 'Approved', className: '' },
    paid: { variant: 'default' as const, icon: CheckCircle, label: 'Paid', className: 'bg-green-600 hover:bg-green-700 text-white' },
    rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected', className: '' },
  };
  const cfg = variants[status];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className={`gap-1 ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
};

const formatCurrency = (amount: number, currency: string = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDateShort = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const ProjectInvoicesPage: React.FC<ProjectInvoicesPageProps> = ({ projectId, canApproveInvoices = true }) => {
  const { data, loading, error, refetch } = useProjectInvoices(projectId);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<ProjectInvoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ProjectInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [invoiceToMarkAsPaid, setInvoiceToMarkAsPaid] = useState<ProjectInvoice | null>(null);

  const invoices = data || [];

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        !searchTerm ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.vendor?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === (statusFilter as InvoiceStatus);
      const matchesCategory = categoryFilter === 'all' || invoice.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [invoices, searchTerm, statusFilter, categoryFilter]);

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const paidAmount = filteredInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const handleViewInvoice = (invoice: ProjectInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const handleEditInvoice = (invoice: ProjectInvoice) => {
    setInvoiceToEdit(invoice);
    setShowEditModal(true);
  };

  const handleDeleteInvoice = async (invoice: ProjectInvoice) => {
    if (invoice.status === 'paid' || invoice.status === 'Paid') {
      toast.error('Paid invoices cannot be deleted');
      return;
    }
    const confirmed = window.confirm(`Delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`);
    if (!confirmed) return;
    const resp = await deleteProjectInvoice(invoice.projectId, invoice.id);
    if (resp.error) {
      toast.error(resp.error.message || 'Failed to delete invoice');
      return;
    }
    toast.success('Invoice deleted');
    refetch();
  };

  const handleApproveInvoice = async (invoiceId: string) => {
    if (!selectedInvoice) return;

    const resp = await approveProjectInvoice(projectId, invoiceId);
    if (resp.error) {
      toast.error(resp.error.message || 'Failed to approve invoice');
      return;
    }

    toast.success('Invoice approved successfully');
    refetch();
  };

  const handleRejectInvoice = async (invoiceId: string) => {
    if (!selectedInvoice) return;

    const reason = window.prompt('Enter rejection reason (optional):');

    const resp = await rejectProjectInvoice(projectId, invoiceId, reason || undefined);
    if (resp.error) {
      toast.error(resp.error.message || 'Failed to reject invoice');
      return;
    }

    toast.error('Invoice rejected');
    refetch();
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    // Find the invoice to mark as paid
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      toast.error('Invoice not found');
      return;
    }

    setInvoiceToMarkAsPaid(invoice);
    setShowMarkAsPaidModal(true);
    setShowDetailModal(false); // Close detail modal
  };

  const handleMarkAsPaidSubmit = async (paymentDetails: PaymentDetails) => {
    if (!invoiceToMarkAsPaid) return;

    const resp = await markInvoiceAsPaid(projectId, invoiceToMarkAsPaid.id, paymentDetails);
    if (resp.error) {
      toast.error(resp.error.message || 'Failed to mark invoice as paid');
      throw new Error(resp.error.message);
    }

    toast.success('Invoice marked as paid and expense created automatically');
    setShowMarkAsPaidModal(false);
    setInvoiceToMarkAsPaid(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and track invoices for this project</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{filteredInvoices.length}</p>
              </div>
              <Receipt className="w-6 h-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Paid Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(paidAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalAmount - paidAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by invoice number, description, or vendor..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="professional-fees">Professional Fees</SelectItem>
                <SelectItem value="permits">Permits</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="contingency">Contingency</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600 mb-6">Create your first invoice to get started</p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Project Invoices ({filteredInvoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewInvoice(invoice)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{invoice.vendor?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500 capitalize">{invoice.vendor?.vendorType}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-900 max-w-xs truncate">{invoice.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{invoice.category.replace('-', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-700">
                        <Calendar className="w-3 h-3" />
                        {formatDateShort(invoice.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>{statusToBadge(invoice.status)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteInvoice(invoice)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateInvoiceModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            toast.success('Invoice created successfully');
            refetch();
          }}
          projectId={projectId}
        />
      )}

      {showEditModal && invoiceToEdit && (
        <CreateInvoiceModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setInvoiceToEdit(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setInvoiceToEdit(null);
            toast.success('Invoice updated successfully');
            refetch();
          }}
          projectId={projectId}
          invoiceToEdit={invoiceToEdit}
        />
      )}

      {showDetailModal && selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedInvoice(null);
          }}
          onApprove={handleApproveInvoice}
          onReject={handleRejectInvoice}
          onMarkAsPaid={handleMarkAsPaid}
          canApproveInvoices={canApproveInvoices}
        />
      )}

      {showMarkAsPaidModal && invoiceToMarkAsPaid && (
        <MarkAsPaidModal
          open={showMarkAsPaidModal}
          onClose={() => {
            setShowMarkAsPaidModal(false);
            setInvoiceToMarkAsPaid(null);
          }}
          onSubmit={handleMarkAsPaidSubmit}
          invoiceNumber={invoiceToMarkAsPaid.invoiceNumber}
          amount={invoiceToMarkAsPaid.amount}
          currency={invoiceToMarkAsPaid.currency}
        />
      )}
    </div>
  );
};

export default ProjectInvoicesPage;


