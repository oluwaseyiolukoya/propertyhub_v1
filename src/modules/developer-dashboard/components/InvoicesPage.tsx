import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
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
import KPICard from './KPICard';
import CreateInvoiceModal from './CreateInvoiceModal';
import InvoiceDetailModal from './InvoiceDetailModal';
import { useDebounce } from '../hooks/useDeveloperDashboardData';
import type { ProjectInvoice, InvoiceStatus, VendorType, VendorStatus } from '../types';
import { toast } from 'sonner';
import { apiClient } from '../../../lib/api-client';
import { approveProjectInvoice, rejectProjectInvoice, markInvoiceAsPaid } from '../../../lib/api/invoices';
import MarkAsPaidModal, { type PaymentDetails } from './MarkAsPaidModal';
import { getCurrencySymbol } from '../../../lib/currency';

interface InvoicesPageProps {
  onViewProject?: (projectId: string) => void;
  canApproveInvoices?: boolean;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({ onViewProject, canApproveInvoices = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ProjectInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [invoiceToMarkAsPaid, setInvoiceToMarkAsPaid] = useState<ProjectInvoice | null>(null);
  const [invoices, setInvoices] = useState<ProjectInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Fetch invoices from API
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<any>('/api/developer-dashboard/invoices');

      console.log('🔍 [InvoicesPage] API Response:', response);

      if (response.error) {
        console.error('❌ [InvoicesPage] Error fetching invoices:', response.error);
        toast.error('Failed to load invoices');
        setInvoices([]);
      } else if (response.data) {
        // Backend returns: { success: true, data: [...] }
        // apiClient wraps it as: { data: { success: true, data: [...] } }
        const backendResponse = response.data;

        if (backendResponse.success && Array.isArray(backendResponse.data)) {
          // Transform Prisma data to match ProjectInvoice interface
          const transformedInvoices: ProjectInvoice[] = backendResponse.data.map((inv: any) => ({
            id: inv.id,
            projectId: inv.projectId,
            vendorId: inv.vendorId || undefined,
            invoiceNumber: inv.invoiceNumber,
            description: inv.description,
            category: inv.category,
            amount: Number(inv.amount),
            currency: inv.currency || 'NGN',
            status: inv.status as InvoiceStatus,
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : undefined,
            paidDate: inv.paidDate ? new Date(inv.paidDate).toISOString().split('T')[0] : undefined,
            paymentMethod: inv.paymentMethod || undefined,
            approvedBy: inv.approvedBy || undefined,
            approvedAt: inv.approvedAt ? new Date(inv.approvedAt).toISOString() : undefined,
            attachments: Array.isArray(inv.attachments) ? inv.attachments : undefined,
            notes: inv.notes || undefined,
            createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: inv.updatedAt ? new Date(inv.updatedAt).toISOString() : new Date().toISOString(),
            vendor: inv.vendor ? {
              id: inv.vendor.id,
              customerId: inv.vendor.customerId,
              name: inv.vendor.name,
              contactPerson: inv.vendor.contactPerson || undefined,
              email: inv.vendor.email || undefined,
              phone: inv.vendor.phone || undefined,
              address: inv.vendor.address || undefined,
              vendorType: inv.vendor.vendorType as VendorType,
              specialization: inv.vendor.specialization || undefined,
              rating: inv.vendor.rating || undefined,
              totalContracts: inv.vendor.totalContracts || 0,
              totalValue: Number(inv.vendor.totalValue) || 0,
              currency: inv.vendor.currency || 'NGN',
              status: inv.vendor.status as VendorStatus,
              notes: inv.vendor.notes || undefined,
              createdAt: inv.vendor.createdAt ? new Date(inv.vendor.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: inv.vendor.updatedAt ? new Date(inv.vendor.updatedAt).toISOString() : new Date().toISOString(),
            } : undefined,
          }));

          console.log('✅ [InvoicesPage] Transformed invoices:', transformedInvoices);
          setInvoices(transformedInvoices);
        } else {
          console.warn('⚠️ [InvoicesPage] Unexpected response structure:', backendResponse);
          setInvoices([]);
        }
      } else {
        console.warn('⚠️ [InvoicesPage] No data in response');
        setInvoices([]);
      }
    } catch (error: any) {
      console.error('❌ [InvoicesPage] Error fetching invoices:', error);
      toast.error('Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Legacy mock data structure kept for reference (now replaced with API data)
  const _mockInvoices: ProjectInvoice[] = [
    {
      id: '1',
      projectId: 'proj-1',
      vendorId: 'vendor-1',
      invoiceNumber: 'INV-2025-001',
      description: 'Structural steel supply and installation',
      category: 'materials',
      amount: 125000000,
      currency: 'NGN',
      status: 'pending',
      dueDate: '2025-12-15',
      createdAt: '2025-11-01',
      updatedAt: '2025-11-01',
      vendor: {
        id: 'vendor-1',
        customerId: 'cust-1',
        name: 'BuildRight Steel Ltd',
        vendorType: 'supplier',
        totalContracts: 5,
        totalValue: 500000000,
        currency: 'NGN',
        status: 'active',
        createdAt: '2024-01-01',
        updatedAt: '2025-11-01',
      },
    },
    {
      id: '2',
      projectId: 'proj-1',
      vendorId: 'vendor-2',
      invoiceNumber: 'INV-2025-002',
      description: 'Electrical installation - Phase 1',
      category: 'labor',
      amount: 85000000,
      currency: 'NGN',
      status: 'approved',
      dueDate: '2025-12-20',
      approvedBy: 'user-1',
      approvedAt: '2025-11-10',
      createdAt: '2025-11-05',
      updatedAt: '2025-11-10',
      vendor: {
        id: 'vendor-2',
        customerId: 'cust-1',
        name: 'PowerTech Solutions',
        vendorType: 'contractor',
        totalContracts: 8,
        totalValue: 750000000,
        currency: 'NGN',
        status: 'active',
        createdAt: '2024-02-01',
        updatedAt: '2025-11-01',
      },
    },
    {
      id: '3',
      projectId: 'proj-2',
      vendorId: 'vendor-3',
      invoiceNumber: 'INV-2025-003',
      description: 'Concrete supply for foundation',
      category: 'materials',
      amount: 42000000,
      currency: 'NGN',
      status: 'paid',
      dueDate: '2025-11-30',
      paidDate: '2025-11-28',
      paymentMethod: 'Bank Transfer',
      approvedBy: 'user-1',
      approvedAt: '2025-11-15',
      createdAt: '2025-11-08',
      updatedAt: '2025-11-28',
      vendor: {
        id: 'vendor-3',
        customerId: 'cust-1',
        name: 'Concrete Masters',
        vendorType: 'supplier',
        totalContracts: 12,
        totalValue: 1200000000,
        currency: 'NGN',
        status: 'active',
        createdAt: '2023-06-01',
        updatedAt: '2025-11-01',
      },
    },
    {
      id: '4',
      projectId: 'proj-1',
      vendorId: 'vendor-4',
      invoiceNumber: 'INV-2025-004',
      description: 'Architectural design services',
      category: 'professional-fees',
      amount: 15000000,
      currency: 'NGN',
      status: 'rejected',
      dueDate: '2025-12-10',
      notes: 'Pricing does not match agreed contract terms',
      createdAt: '2025-11-12',
      updatedAt: '2025-11-13',
      vendor: {
        id: 'vendor-4',
        customerId: 'cust-1',
        name: 'Design Studio Pro',
        vendorType: 'consultant',
        totalContracts: 3,
        totalValue: 45000000,
        currency: 'NGN',
        status: 'active',
        createdAt: '2024-09-01',
        updatedAt: '2025-11-01',
      },
    },
  ];

  // Calculate summary metrics
  const totalInvoices = invoices.length;
  const pendingInvoices = invoices.filter((inv) => inv.status === 'pending').length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status === 'pending' || inv.status === 'approved')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    // Use centralized currency symbol to avoid "F CFA" issue with Intl.NumberFormat
    const symbol = getCurrencySymbol(currency);
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${symbol}${formatted}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants = {
      pending: { variant: 'outline' as const, icon: Clock, color: 'text-amber-600', label: 'Pending' },
      approved: { variant: 'outline' as const, icon: CheckCircle, color: 'text-blue-600', label: 'Approved' },
      paid: { variant: 'default' as const, icon: CheckCircle, color: 'text-white', bg: 'bg-green-600 hover:bg-green-700', label: 'Paid' },
      rejected: { variant: 'destructive' as const, icon: XCircle, color: 'text-white', label: 'Rejected' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`gap-1 ${config.bg || ''}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      labor: 'bg-blue-100 text-blue-800',
      materials: 'bg-purple-100 text-purple-800',
      equipment: 'bg-orange-100 text-orange-800',
      'professional-fees': 'bg-teal-100 text-teal-800',
      permits: 'bg-green-100 text-green-800',
      utilities: 'bg-yellow-100 text-yellow-800',
      insurance: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge variant="outline" className={colors[category] || colors.other}>
        {category.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  const handleViewInvoice = (invoice: ProjectInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const handleApproveInvoice = async (invoiceId: string) => {
    if (!selectedInvoice) return;

    const resp = await approveProjectInvoice(selectedInvoice.projectId, invoiceId);
    if (resp.error) {
      toast.error(resp.error.message || 'Failed to approve invoice');
      return;
    }

    toast.success('Invoice approved successfully');
    fetchInvoices(); // Refresh the list
  };

  const handleRejectInvoice = async (invoiceId: string) => {
    if (!selectedInvoice) return;

    const reason = window.prompt('Enter rejection reason (optional):');

    const resp = await rejectProjectInvoice(selectedInvoice.projectId, invoiceId, reason || undefined);
    if (resp.error) {
      toast.error(resp.error.message || 'Failed to reject invoice');
      return;
    }

    toast.success('Invoice rejected');
    fetchInvoices(); // Refresh the list
    setShowDetailModal(false);
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

    const resp = await markInvoiceAsPaid(invoiceToMarkAsPaid.projectId, invoiceToMarkAsPaid.id, paymentDetails);
    if (resp.error) {
      toast.error(resp.error.message || 'Failed to mark invoice as paid');
      throw new Error(resp.error.message);
    }

    toast.success('Invoice marked as paid and expense created automatically');
    fetchInvoices(); // Refresh the list
    setShowMarkAsPaidModal(false);
    setInvoiceToMarkAsPaid(null);
    setShowDetailModal(false);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    toast.success('Invoice deleted');
    // TODO: Implement API call
  };

  const handleExportInvoices = () => {
    toast.info('Exporting invoices...');
    // TODO: Implement export functionality
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      !debouncedSearch ||
      invoice.invoiceNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      invoice.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      invoice.vendor?.name.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || invoice.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and track all project invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportInvoices} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Invoices"
          value={totalInvoices.toString()}
          subtitle={`${pendingInvoices} pending approval`}
          icon={Receipt}
          loading={loading}
        />
        <KPICard
          title="Total Amount"
          value={formatCurrency(totalAmount)}
          subtitle="All invoices"
          icon={DollarSign}
          loading={loading}
        />
        <KPICard
          title="Paid Amount"
          value={formatCurrency(paidAmount)}
          subtitle={`${((paidAmount / totalAmount) * 100).toFixed(0)}% of total`}
          icon={CheckCircle}
          loading={loading}
        />
        <KPICard
          title="Pending Payment"
          value={formatCurrency(pendingAmount)}
          subtitle="Awaiting payment"
          icon={Clock}
          trend={
            pendingAmount > 0
              ? { value: ((pendingAmount / totalAmount) * 100), direction: 'neutral' }
              : undefined
          }
          loading={loading}
        />
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
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first invoice to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Invoices ({filteredInvoices.length})</CardTitle>
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
                    <TableCell>{getCategoryBadge(invoice.category)}</TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-700">
                        <Calendar className="w-3 h-3" />
                        {formatDate(invoice.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewInvoice(invoice); }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {invoice.status === 'pending' && canApproveInvoices && (
                            <>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleApproveInvoice(invoice.id); }}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRejectInvoice(invoice.id); }}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {invoice.status === 'approved' && canApproveInvoices && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(invoice.id); }}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice.id); }}>
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
            fetchInvoices(); // Refresh the invoice list
          }}
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

      {/* Note: Project filter will be populated from fetched invoice data */}
    </div>
  );
};

export default InvoicesPage;

