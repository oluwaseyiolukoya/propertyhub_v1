import React, { useMemo, useState, useEffect } from "react";
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
  Loader2,
  DollarSign,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { toast } from "sonner";
import { useProjectInvoices } from "../hooks/useDeveloperDashboardData";
import type { ProjectInvoice, InvoiceStatus } from "../types";
import InvoiceDetailModal from "./InvoiceDetailModal";
import CreateInvoiceModal from "./CreateInvoiceModal";
import MarkAsPaidModal, { type PaymentDetails } from "./MarkAsPaidModal";
import {
  deleteProjectInvoice,
  approveProjectInvoice,
  rejectProjectInvoice,
  markInvoiceAsPaid,
} from "../../../lib/api/invoices";
import { getProjectById } from "../services/developerDashboard.api";
import { getCurrencySymbol as getCurrencySymbolFromLib } from "../../../lib/currency";

interface ProjectInvoicesPageProps {
  projectId: string;
  canApproveInvoices?: boolean;
}

const statusToBadge = (status: InvoiceStatus) => {
  const variants = {
    pending: {
      variant: "default" as const,
      icon: Clock,
      label: "Pending",
      className: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    approved: {
      variant: "outline" as const,
      icon: CheckCircle,
      label: "Approved",
      className: "",
    },
    paid: {
      variant: "default" as const,
      icon: CheckCircle,
      label: "Paid",
      className: "bg-green-600 hover:bg-green-700 text-white",
    },
    rejected: {
      variant: "destructive" as const,
      icon: XCircle,
      label: "Rejected",
      className: "",
    },
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

const formatCurrency = (amount: number, currency: string = "NGN") => {
  // Use centralized currency symbol to avoid "F CFA" issue with Intl.NumberFormat
  const symbol = getCurrencySymbolFromLib(currency);
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${symbol}${formatted}`;
};

const formatDateShort = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const ProjectInvoicesPage: React.FC<ProjectInvoicesPageProps> = ({
  projectId,
  canApproveInvoices = true,
}) => {
  const { data, loading, error, refetch } = useProjectInvoices(projectId);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<ProjectInvoice | null>(
    null
  );
  const [selectedInvoice, setSelectedInvoice] = useState<ProjectInvoice | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [invoiceToMarkAsPaid, setInvoiceToMarkAsPaid] =
    useState<ProjectInvoice | null>(null);
  const [projectCurrency, setProjectCurrency] = useState<string>("NGN");

  const invoices = data || [];

  // Fetch project currency
  useEffect(() => {
    const fetchProjectCurrency = async () => {
      try {
        const response = await getProjectById(projectId);
        if (response.success && response.data) {
          setProjectCurrency(response.data.currency || "NGN");
        }
      } catch (error) {
        console.error("Failed to fetch project currency:", error);
        // Keep default 'NGN' if fetch fails
      }
    };

    if (projectId) {
      fetchProjectCurrency();
    }
  }, [projectId]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        !searchTerm ||
        invoice.invoiceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (invoice.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (invoice.vendor?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        invoice.status === (statusFilter as InvoiceStatus);
      const matchesCategory =
        categoryFilter === "all" || invoice.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [invoices, searchTerm, statusFilter, categoryFilter]);

  const totalAmount = filteredInvoices.reduce(
    (sum, inv) => sum + (inv.amount || 0),
    0
  );
  const paidAmount = filteredInvoices
    .filter((inv) => inv.status === "paid")
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
    if (invoice.status === "paid" || invoice.status === "Paid") {
      toast.error("Paid invoices cannot be deleted");
      return;
    }
    const confirmed = window.confirm(
      `Delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`
    );
    if (!confirmed) return;
    const resp = await deleteProjectInvoice(invoice.projectId, invoice.id);
    if (resp.error) {
      toast.error(resp.error.message || "Failed to delete invoice");
      return;
    }
    toast.success("Invoice deleted");
    refetch();
  };

  const handleApproveInvoice = async (invoiceId: string) => {
    if (!selectedInvoice) return;

    const resp = await approveProjectInvoice(projectId, invoiceId);
    if (resp.error) {
      toast.error(resp.error.message || "Failed to approve invoice");
      return;
    }

    toast.success("Invoice approved successfully");
    refetch();
  };

  const handleRejectInvoice = async (invoiceId: string) => {
    if (!selectedInvoice) return;

    const reason = window.prompt("Enter rejection reason (optional):");

    const resp = await rejectProjectInvoice(
      projectId,
      invoiceId,
      reason || undefined
    );
    if (resp.error) {
      toast.error(resp.error.message || "Failed to reject invoice");
      return;
    }

    toast.error("Invoice rejected");
    refetch();
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    // Find the invoice to mark as paid
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) {
      toast.error("Invoice not found");
      return;
    }

    setInvoiceToMarkAsPaid(invoice);
    setShowMarkAsPaidModal(true);
    setShowDetailModal(false); // Close detail modal
  };

  const handleMarkAsPaidSubmit = async (paymentDetails: PaymentDetails) => {
    if (!invoiceToMarkAsPaid) return;

    const resp = await markInvoiceAsPaid(
      projectId,
      invoiceToMarkAsPaid.id,
      paymentDetails
    );
    if (resp.error) {
      toast.error(resp.error.message || "Failed to mark invoice as paid");
      throw new Error(resp.error.message);
    }

    toast.success("Invoice marked as paid and expense created automatically");
    setShowMarkAsPaidModal(false);
    setInvoiceToMarkAsPaid(null);
    refetch();
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] p-6 md:p-8 shadow-xl animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Receipt className="h-8 w-8 text-white" />
              Invoices
            </h1>
            <p className="text-white/80 font-medium">
              Manage and track invoices for this project
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-white hover:bg-gray-50 text-[#7C3AED] font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300"
          style={{ animationDelay: "0ms" }}
        >
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">
                Total Invoices
              </CardTitle>
              <Receipt className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {filteredInvoices.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300"
          style={{ animationDelay: "50ms" }}
        >
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">
                Total Amount
              </CardTitle>
              <DollarSign className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalAmount, projectCurrency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300"
          style={{ animationDelay: "100ms" }}
        >
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">
                Paid Amount
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(paidAmount, projectCurrency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300"
          style={{ animationDelay: "150ms" }}
        >
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">
                Pending
              </CardTitle>
              <Clock className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalAmount - paidAmount, projectCurrency)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card
        className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700"
        style={{ animationDelay: "200ms" }}
      >
        <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
          <CardTitle className="text-white font-bold">Filters</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by invoice number, description, or vendor..."
                className="pl-10 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-11">
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
              <SelectTrigger className="w-40 h-11">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="professional-fees">
                  Professional Fees
                </SelectItem>
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
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardContent className="p-12">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 animate-pulse rounded"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in duration-500">
          <CardContent className="p-16 text-center">
            <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Receipt className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No invoices found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters to see more results"
                : "Create your first invoice to get started"}
            </p>
            {!searchTerm &&
              statusFilter === "all" &&
              categoryFilter === "all" && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create Invoice
                </Button>
              )}
          </CardContent>
        </Card>
      ) : (
        <Card
          className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "250ms" }}
        >
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
            <CardTitle className="text-white font-bold">
              Project Invoices ({filteredInvoices.length})
            </CardTitle>
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
                {filteredInvoices.map((invoice, index) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors duration-200 animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => handleViewInvoice(invoice)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {invoice.vendor?.name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {invoice.vendor?.vendorType}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-900 max-w-xs truncate">
                        {invoice.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {invoice.category.replace("-", " ")}
                      </Badge>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] transition-colors duration-200"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditInvoice(invoice)}
                          >
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
            toast.success("Invoice created successfully");
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
            toast.success("Invoice updated successfully");
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
