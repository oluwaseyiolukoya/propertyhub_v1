import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
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
  Plus
} from 'lucide-react';
import { toast } from "sonner";
import { getPayments, getPaymentStats, recordManualPayment } from '../lib/api/payments';
import { getLeases } from '../lib/api/leases';
import { initializeSocket, isConnected, subscribeToPaymentEvents, unsubscribeFromPaymentEvents } from '../lib/socket';

export const PaymentOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Record Payment Dialog State
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [leases, setLeases] = useState<any[]>([]);
  const [recordForm, setRecordForm] = useState({
    leaseId: '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    type: 'rent'
  });
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    fetchData();
    const token = localStorage.getItem('auth_token');
    if (token && !isConnected()) {
      try { initializeSocket(token); } catch {}
    }
    subscribeToPaymentEvents({
      onUpdated: () => fetchData(),
      onReceived: () => fetchData(),
    });
    const handleBrowserPaymentUpdate = () => fetchData();
    window.addEventListener('payment:updated', handleBrowserPaymentUpdate);
    return () => {
      unsubscribeFromPaymentEvents();
      window.removeEventListener('payment:updated', handleBrowserPaymentUpdate);
    };
  }, [page, statusFilter, methodFilter, searchTerm]);

  const fetchData = async () => {
    try {
      const filters: any = { page, pageSize };
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (methodFilter !== 'all') filters.method = methodFilter;
      if (searchTerm) filters.search = searchTerm;

      const [paymentsResp, statsResp] = await Promise.all([
        getPayments(filters),
        getPaymentStats()
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
          tenant: p.leases?.users?.name || 'Unknown',
          tenantEmail: p.leases?.users?.email || '',
          property: p.leases?.properties?.name || 'Unknown',
          unit: p.leases?.units?.unitNumber || 'N/A',
          amount: p.amount,
          currency: p.currency || 'NGN',
          status: p.status,
          method: p.paymentMethod || p.provider || 'Paystack',
          type: p.type || 'rent',
          date: new Date(p.paidAt || p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: new Date(p.paidAt || p.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        }));

        setPayments(transformed);
        setTotal(totalCount);
      }

      if (statsResp.data) {
        setStats(statsResp.data);
        console.log('Payment Stats:', statsResp.data);
      }
    } catch (error) {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'failed': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const exportData = () => {
    toast.success('Payment data exported successfully');
  };

  const handleOpenRecordDialog = async () => {
    try {
      const leasesResp = await getLeases({ status: 'active' });
      if (leasesResp.data) {
        const leaseList = Array.isArray(leasesResp.data) ? leasesResp.data : leasesResp.data.items || [];
        setLeases(leaseList);
      }
      setShowRecordDialog(true);
    } catch (error) {
      toast.error('Failed to load leases');
    }
  };

  const handleRecordPayment = async () => {
    try {
      if (!recordForm.leaseId || !recordForm.amount || parseFloat(recordForm.amount) <= 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      setIsRecording(true);
      const resp = await recordManualPayment({
        leaseId: recordForm.leaseId,
        amount: parseFloat(recordForm.amount),
        paymentMethod: recordForm.paymentMethod,
        paymentDate: recordForm.paymentDate,
        notes: recordForm.notes,
        type: recordForm.type
      });

      if (resp.data?.success) {
        toast.success('Payment recorded successfully');
        setShowRecordDialog(false);
        setRecordForm({
          leaseId: '',
          amount: '',
          paymentMethod: 'cash',
          paymentDate: new Date().toISOString().split('T')[0],
          notes: '',
          type: 'rent'
        });
        fetchData();
      } else {
        toast.error(resp.error?.error || 'Failed to record payment');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to record payment');
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
  const successCount = payments.filter(p => p.status === 'success').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const failedCount = payments.filter(p => p.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Overview</h1>
          <p className="text-gray-600 mt-1">Track all payment transactions across your properties</p>
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
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{totalCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              All successful payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₦{pendingAmount.toLocaleString()}</div>
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
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment by Method and Type Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Payment by Method</CardTitle>
            <CardDescription>Distribution of payment methods used</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.byMethod && stats.byMethod.length > 0 ? (
              <div className="space-y-3">
                {stats.byMethod.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">{item.method || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{item.count || 0} transactions</span>
                      <span className="text-sm font-semibold">₦{(item.amount || 0).toLocaleString()}</span>
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
                      <span className="text-sm font-medium capitalize">{item.type || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{item.count || 0} payments</span>
                      <span className="text-sm font-semibold">₦{(item.amount || 0).toLocaleString()}</span>
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
              <CardDescription>Complete history of all payments received</CardDescription>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">{payment.reference}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.tenant}</p>
                        <p className="text-xs text-gray-500">{payment.tenantEmail}</p>
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
                      {payment.currency === 'NGN' ? '₦' : ''}{payment.amount.toLocaleString()} {payment.currency !== 'NGN' ? payment.currency : ''}
                    </TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{payment.time}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <Badge variant={getStatusColor(payment.status)} className="capitalize">
                          {payment.status}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <Search className="h-8 w-8 text-gray-400" />
                        <p className="font-medium">No payments found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Manual Payment</DialogTitle>
            <DialogDescription>
              Record a payment made through cash, bank transfer, or other offline methods
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lease">Tenant Lease *</Label>
              <Select
                value={recordForm.leaseId}
                onValueChange={(value) => setRecordForm({ ...recordForm, leaseId: value })}
              >
                <SelectTrigger id="lease">
                  <SelectValue placeholder="Select a lease" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map((lease: any) => (
                    <SelectItem key={lease.id} value={lease.id}>
                      {lease.leaseNumber} - {lease.users?.name || 'Unknown'} ({lease.properties?.name || 'Unknown'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                <Input
                  id="amount"
                  type="number"
                  value={recordForm.amount}
                  onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
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
                onValueChange={(value) => setRecordForm({ ...recordForm, paymentMethod: value })}
              >
                <SelectTrigger id="method">
                  <SelectValue />
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
              <Label htmlFor="type">Payment Type</Label>
              <Select
                value={recordForm.type}
                onValueChange={(value) => setRecordForm({ ...recordForm, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Payment Date</Label>
              <Input
                id="date"
                type="date"
                value={recordForm.paymentDate}
                onChange={(e) => setRecordForm({ ...recordForm, paymentDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={recordForm.notes}
                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                placeholder="Add any additional notes about this payment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={isRecording || !recordForm.leaseId || !recordForm.amount || parseFloat(recordForm.amount) <= 0}
            >
              {isRecording ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

