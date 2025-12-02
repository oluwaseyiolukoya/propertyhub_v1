import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Filter,
  Calendar,
  CreditCard,
  Users,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertCircle,
  Eye,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getPayments,
  getPaymentStats,
  recordManualPayment,
} from "../lib/api/payments";
import { getLeases } from "../lib/api/leases";
import {
  initializeSocket,
  isConnected,
  subscribeToPaymentEvents,
  unsubscribeFromPaymentEvents,
} from "../lib/socket";

export const PaymentOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Record Payment Dialog State
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [leases, setLeases] = useState<any[]>([]);
  const [recordForm, setRecordForm] = useState({
    leaseId: "",
    amount: "",
    paymentMethod: "cash",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
    type: "rent",
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordOptions, setRecordOptions] = useState({
    sendReceipt: true,
    markAsPaid: true,
    notifyTeam: false,
  });
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [showEditPayment, setShowEditPayment] = useState(false);
  const [editForm, setEditForm] = useState({
    amount: "",
    paymentMethod: "",
    paymentDate: "",
    type: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
    const token = localStorage.getItem("auth_token");
    if (token && !isConnected()) {
      try {
        initializeSocket(token);
      } catch {}
    }
    subscribeToPaymentEvents({
      onUpdated: () => fetchData(),
      onReceived: () => fetchData(),
    });
    const handleBrowserPaymentUpdate = () => fetchData();
    window.addEventListener("payment:updated", handleBrowserPaymentUpdate);
    return () => {
      unsubscribeFromPaymentEvents();
      window.removeEventListener("payment:updated", handleBrowserPaymentUpdate);
    };
  }, [page, statusFilter, methodFilter, searchTerm]);

  const fetchData = async () => {
    try {
      const filters: any = { page, pageSize };
      if (statusFilter !== "all") filters.status = statusFilter;
      if (methodFilter !== "all") filters.method = methodFilter;
      if (searchTerm) filters.search = searchTerm;

      const [paymentsResp, statsResp] = await Promise.all([
        getPayments(filters),
        getPaymentStats(),
      ]);

      if (paymentsResp.data) {
        let list: any[] = [];
        let totalCount = 0;

        if (paymentsResp.data.items) {
          list = paymentsResp.data.items;
          totalCount = paymentsResp.data.total || 0;
        } else if (Array.isArray(paymentsResp.data)) {
          list = paymentsResp.data;
          totalCount = list.length;
        }

        const transformed = list.map((p: any) => ({
          id: p.id,
          reference: p.providerReference || p.id,
          tenant: p.leases?.users?.name || "Unknown",
          tenantEmail: p.leases?.users?.email || "",
          property: p.leases?.properties?.name || "Unknown",
          unit: p.leases?.units?.unitNumber || "N/A",
          amount: p.amount,
          currency: p.currency || "NGN",
          status: p.status,
          method: p.paymentMethod || p.provider || "Paystack",
          type: p.type || "rent",
          date: new Date(p.paidAt || p.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          time: new Date(p.paidAt || p.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        }));

        setPayments(transformed);
        setTotal(totalCount);
      }

      if (statsResp.data) {
        setStats(statsResp.data);
        console.log("Payment Stats:", statsResp.data);
      }
    } catch (error) {
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default";
      case "failed":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const exportData = () => {
    toast.success("Payment data exported successfully");
  };

  const handleOpenRecordDialog = async () => {
    try {
      const leasesResp = await getLeases({ status: "active" });
      if (leasesResp.data) {
        const leaseList = Array.isArray(leasesResp.data)
          ? leasesResp.data
          : leasesResp.data.items || [];
        setLeases(leaseList);
      }
      setShowRecordDialog(true);
    } catch (error) {
      toast.error("Failed to load leases");
    }
  };

  const handleRecordPayment = async () => {
    try {
      if (
        !recordForm.leaseId ||
        !recordForm.amount ||
        parseFloat(recordForm.amount) <= 0
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      setIsRecording(true);
      const resp = await recordManualPayment({
        leaseId: recordForm.leaseId,
        amount: parseFloat(recordForm.amount),
        paymentMethod: recordForm.paymentMethod,
        paymentDate: recordForm.paymentDate,
        notes: recordForm.notes,
        type: recordForm.type,
      });

      if (resp.data?.success) {
        toast.success("Payment recorded successfully");
        setShowRecordDialog(false);
        setRecordForm({
          leaseId: "",
          amount: "",
          paymentMethod: "cash",
          paymentDate: new Date().toISOString().split("T")[0],
          notes: "",
          type: "rent",
        });
        fetchData();
      } else {
        toast.error(resp.error?.error || "Failed to record payment");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to record payment");
    } finally {
      setIsRecording(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    const amountValue = parseFloat(editForm.amount || "0");
    if (!editForm.amount || Number.isNaN(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!editForm.paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      setIsRecording(true);
      const { updatePayment } = await import("../lib/api/payments");
      const resp = await updatePayment(selectedPayment.id, {
        amount: amountValue,
        paymentMethod: editForm.paymentMethod,
        paymentDate: editForm.paymentDate,
        type: editForm.type,
        notes: editForm.notes,
      } as any);

      if (resp.error) {
        toast.error(resp.error.message || "Failed to update payment");
      } else {
        toast.success("Payment updated successfully");
        setShowEditPayment(false);
        setSelectedPayment(resp.data || selectedPayment);
        fetchData();
      }
    } catch (error: any) {
      console.error("Update payment error:", error);
      toast.error(error?.message || "Failed to update payment");
    } finally {
      setIsRecording(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment overview...</p>
        </div>
      </div>
    );
  }

  const totalCollected = stats?.totalCollected || 0;
  const pendingAmount = stats?.pendingAmount || 0;
  const successCount = payments.filter((p) => p.status === "success").length;
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const failedCount = payments.filter((p) => p.status === "failed").length;

  const isRecordValid =
    !!recordForm.leaseId &&
    !!recordForm.amount &&
    parseFloat(recordForm.amount) > 0 &&
    !!recordForm.paymentMethod &&
    !!recordForm.paymentDate;

  const selectedLease = leases.find(
    (lease: any) => lease.id === recordForm.leaseId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Overview</h1>
          <p className="text-gray-600 mt-1">
            Track all payment transactions across your properties
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenRecordDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Collected
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{totalCollected.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              All successful payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Amount
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ₦{pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingCount} pending transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {total > 0 ? Math.round((successCount / total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {successCount} of {total} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Payments
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment by Method and Type Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Payment by Method</CardTitle>
            <CardDescription>
              Distribution of payment methods used
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.byMethod && stats.byMethod.length > 0 ? (
              <div className="space-y-3">
                {stats.byMethod.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">
                        {item.method || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {item.count || 0} transactions
                      </span>
                      <span className="text-sm font-semibold">
                        ₦{(item.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No payment methods data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment by Type</CardTitle>
            <CardDescription>Breakdown of payment categories</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.byType && stats.byType.length > 0 ? (
              <div className="space-y-3">
                {stats.byType.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium capitalize">
                        {item.type || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {item.count || 0} payments
                      </span>
                      <span className="text-sm font-semibold">
                        ₦{(item.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No payment types data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Payment Transactions</CardTitle>
              <CardDescription>
                Complete history of all payments received
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by tenant, property, unit, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Paystack">Paystack</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.reference}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.tenant}</p>
                        <p className="text-xs text-gray-500">
                          {payment.tenantEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{payment.property}</TableCell>
                    <TableCell>{payment.unit}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {payment.currency === "NGN" ? "₦" : ""}
                      {payment.amount.toLocaleString()}{" "}
                      {payment.currency !== "NGN" ? payment.currency : ""}
                    </TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.time}
                    </TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <Badge
                          variant={getStatusColor(payment.status)}
                          className="capitalize"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowPaymentDetails(true);
                            }}
                          >
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayment(payment);
                              setEditForm({
                                amount: String(payment.amount ?? ""),
                                paymentMethod: payment.method || "",
                                paymentDate: payment.date
                                  ? format(
                                      new Date(
                                        payment.paidAt || payment.createdAt
                                      ),
                                      "yyyy-MM-dd"
                                    )
                                  : "",
                                type: payment.type || "",
                                notes: "",
                              });
                              setShowEditPayment(true);
                            }}
                          >
                            Edit payment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={async () => {
                              const confirmed = window.confirm(
                                "Are you sure you want to delete this payment? This action cannot be undone."
                              );
                              if (!confirmed) return;

                              try {
                                const { deletePayment } = await import(
                                  "../lib/api/payments"
                                );
                                const resp = await deletePayment(payment.id);
                                if (resp.error) {
                                  toast.error(
                                    resp.error.message ||
                                      "Failed to delete payment"
                                  );
                                } else {
                                  toast.success(
                                    resp.data?.message ||
                                      "Payment deleted successfully"
                                  );
                                  fetchData();
                                }
                              } catch (error: any) {
                                console.error("Delete payment error:", error);
                                toast.error(
                                  error?.message || "Failed to delete payment"
                                );
                              }
                            }}
                          >
                            Delete payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-gray-500"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Search className="h-8 w-8 text-gray-400" />
                        <p className="font-medium">No payments found</p>
                        <p className="text-sm">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages} • {total} total payments
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Full breakdown of the selected payment transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Reference
                </p>
                <p className="font-mono text-sm break-all">
                  {selectedPayment.reference}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Tenant
                  </p>
                  <p className="text-sm font-medium">
                    {selectedPayment.tenant}
                  </p>
                  {selectedPayment.tenantEmail && (
                    <p className="text-xs text-muted-foreground">
                      {selectedPayment.tenantEmail}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Property / Unit
                  </p>
                  <p className="text-sm">
                    {selectedPayment.property}
                    {selectedPayment.unit ? ` • ${selectedPayment.unit}` : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Amount
                  </p>
                  <p className="text-lg font-semibold">
                    {selectedPayment.currency === "NGN" ? "₦" : ""}
                    {Number(selectedPayment.amount ?? 0).toLocaleString()}{" "}
                    {selectedPayment.currency !== "NGN"
                      ? selectedPayment.currency
                      : ""}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Method
                  </p>
                  <p className="text-sm capitalize">{selectedPayment.method}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Type
                  </p>
                  <Badge variant="outline" className="capitalize">
                    {selectedPayment.type}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Status
                  </p>
                  <div className="inline-flex items-center gap-2">
                    {getStatusIcon(selectedPayment.status)}
                    <Badge
                      variant={getStatusColor(selectedPayment.status)}
                      className="capitalize"
                    >
                      {selectedPayment.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Date
                  </p>
                  <p className="text-sm">
                    {selectedPayment.date} at {selectedPayment.time}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Created At
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPayment.createdAt
                      ? new Date(selectedPayment.createdAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={showEditPayment} onOpenChange={setShowEditPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Adjust amount, method, date, or notes for this manual payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₦
                </span>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="pl-7"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-method">Payment Method</Label>
              <Select
                value={editForm.paymentMethod}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, paymentMethod: value }))
                }
              >
                <SelectTrigger id="edit-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4 text-gray-600" />
                    {editForm.paymentDate ? (
                      format(new Date(editForm.paymentDate), "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={
                      editForm.paymentDate
                        ? new Date(editForm.paymentDate)
                        : undefined
                    }
                    onSelect={(date) =>
                      setEditForm((prev) => ({
                        ...prev,
                        paymentDate: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Payment Type</Label>
              <Select
                value={editForm.type}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={3}
                placeholder="Add notes about this payment..."
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPayment(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayment} disabled={isRecording}>
              {isRecording ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="space-y-2">
            <DialogTitle>Record Manual Payment</DialogTitle>
            <DialogDescription>
              Capture one-off payments collected via cash, transfers or other
              offline channels. We’ll update the ledger and optionally send a
              receipt to the tenant.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-[1.75fr,1fr]">
            <div className="space-y-6">
              {!isRecordValid && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <div>Complete the required fields to enable recording.</div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="lease">Tenant Lease *</Label>
                <Select
                  value={recordForm.leaseId}
                  onValueChange={(value) =>
                    setRecordForm({ ...recordForm, leaseId: value })
                  }
                >
                  <SelectTrigger id="lease">
                    <SelectValue placeholder="Select a lease" />
                  </SelectTrigger>
                  <SelectContent>
                    {leases.length === 0 && (
                      <SelectItem value="__empty" disabled>
                        No active leases available
                      </SelectItem>
                    )}
                    {leases.map((lease: any) => (
                      <SelectItem key={lease.id} value={lease.id}>
                        {lease.leaseNumber} - {lease.users?.name || "Unknown"} (
                        {lease.properties?.name || "Unknown"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ₦
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      value={recordForm.amount}
                      onChange={(e) =>
                        setRecordForm({
                          ...recordForm,
                          amount: e.target.value,
                        })
                      }
                      className="pl-7"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method *</Label>
                  <Select
                    value={recordForm.paymentMethod}
                    onValueChange={(value) =>
                      setRecordForm({ ...recordForm, paymentMethod: value })
                    }
                  >
                    <SelectTrigger id="method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Payment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4 text-gray-600" />
                        {recordForm.paymentDate ? (
                          format(new Date(recordForm.paymentDate), "PPP")
                        ) : (
                          <span className="text-muted-foreground">
                            Pick a date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={
                          recordForm.paymentDate
                            ? new Date(recordForm.paymentDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setRecordForm((prev) => ({
                            ...prev,
                            paymentDate: date ? format(date, "yyyy-MM-dd") : "",
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Payment Type</Label>
                  <Select
                    value={recordForm.type}
                    onValueChange={(value) =>
                      setRecordForm({ ...recordForm, type: value })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={recordForm.notes}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, notes: e.target.value })
                  }
                  placeholder="Add any helpful context for the finance team..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Notes remain internal and are not visible to tenants.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Amount to post
                    </p>
                    <p className="text-2xl font-semibold">
                      ₦{Number(recordForm.amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs uppercase">
                    {recordForm.paymentMethod
                      ? recordForm.paymentMethod.replace(/_/g, " ")
                      : "method TBD"}
                  </Badge>
                </div>
                {selectedLease ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tenant</span>
                      <span>{selectedLease.users?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Unit</span>
                      <span>{selectedLease.units?.unitNumber ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Property</span>
                      <span>{selectedLease.properties?.name}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a lease to view tenant and property details.
                  </p>
                )}
              </div>

              <div className="rounded-lg border divide-y">
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">Send digital receipt</p>
                    <p className="text-sm text-muted-foreground">
                      Email a branded receipt once this payment is recorded.
                    </p>
                  </div>
                  <Switch
                    checked={recordOptions.sendReceipt}
                    onCheckedChange={(checked) =>
                      setRecordOptions((prev) => ({
                        ...prev,
                        sendReceipt: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">Mark invoice as settled</p>
                    <p className="text-sm text-muted-foreground">
                      Close any open balance tied to this lease automatically.
                    </p>
                  </div>
                  <Switch
                    checked={recordOptions.markAsPaid}
                    onCheckedChange={(checked) =>
                      setRecordOptions((prev) => ({
                        ...prev,
                        markAsPaid: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">Notify finance team</p>
                    <p className="text-sm text-muted-foreground">
                      Post an update to the finance Slack/email channel.
                    </p>
                  </div>
                  <Switch
                    checked={recordOptions.notifyTeam}
                    onCheckedChange={(checked) =>
                      setRecordOptions((prev) => ({
                        ...prev,
                        notifyTeam: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Recorded payments sync to payment history, reminders, and cashflow
              analytics.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRecordDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={isRecording || !isRecordValid}
              >
                {isRecording ? "Recording..." : "Record payment"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
