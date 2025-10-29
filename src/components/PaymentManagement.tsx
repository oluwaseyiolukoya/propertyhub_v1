import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Switch } from "./ui/switch";
import { CreditCard, DollarSign, AlertTriangle, Clock, CheckCircle, Plus, Send, Settings, Search, Filter, Mail, AlertCircle } from 'lucide-react';
import { toast } from "sonner";
import { getPayments, createPayment, getPaymentStats, getOverduePayments } from '../lib/api';
import { initializeSocket, isConnected, subscribeToPaymentEvents, unsubscribeFromPaymentEvents } from '../lib/socket';

interface PaymentManagementProps {
  properties?: any[];
}

export const PaymentManagement: React.FC<PaymentManagementProps> = ({ properties = [] }) => {
  // Search and filter state
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentStatusFilter, setCurrentStatusFilter] = useState('all');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyMethodFilter, setHistoryMethodFilter] = useState('all');
  const [autopaySearchTerm, setAutopaySearchTerm] = useState('');

  const [payments, setPayments] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Fetch payments and stats and setup realtime
  useEffect(() => {
    fetchPaymentsData();
    const token = localStorage.getItem('auth_token');
    if (token && !isConnected()) {
      try { initializeSocket(token); } catch {}
    }
    subscribeToPaymentEvents({
      onUpdated: () => fetchPaymentsData(),
      onReceived: () => fetchPaymentsData(),
    });
    const handleBrowserPaymentUpdate = () => fetchPaymentsData();
    window.addEventListener('payment:updated', handleBrowserPaymentUpdate);
    return () => {
      unsubscribeFromPaymentEvents();
      window.removeEventListener('payment:updated', handleBrowserPaymentUpdate);
    };
  }, [currentStatusFilter, historyMethodFilter, page]);

  const fetchPaymentsData = async () => {
    try {
      const filters: any = { page, pageSize };
      if (currentStatusFilter !== 'all') filters.status = currentStatusFilter.toLowerCase();
      if (historyMethodFilter !== 'all') filters.method = historyMethodFilter.toLowerCase();
      if (currentSearchTerm) filters.search = currentSearchTerm;

      const [paymentsResponse, statsResponse] = await Promise.all([
        getPayments(filters),
        getPaymentStats()
      ]);

      if (paymentsResponse.error) {
        toast.error(paymentsResponse.error.error || 'Failed to load payments');
      } else if (paymentsResponse.data) {
        let list: any[] = [];
        let totalCount = 0;

        // Handle paginated response
        if (paymentsResponse.data.items) {
          list = paymentsResponse.data.items;
          totalCount = paymentsResponse.data.total || 0;
          setPage(paymentsResponse.data.page || 1);
          setPageSize(paymentsResponse.data.pageSize || 10);
        } else if (Array.isArray(paymentsResponse.data)) {
          // Legacy array response
          list = paymentsResponse.data;
          totalCount = list.length;
        }

        // Transform API data
        const transformedPayments = list.map((payment: any) => ({
          id: payment.providerReference || payment.id,
          tenantName: payment.leases?.users?.name || 'Unknown',
          tenantEmail: payment.leases?.users?.email || '',
          unit: payment.leases?.units?.unitNumber || 'N/A',
          property: payment.leases?.properties?.name || 'Unknown',
          amount: payment.amount,
          currency: payment.currency || 'NGN',
          dueDate: new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          paidDate: payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
          timestamp: new Date(payment.paidAt || payment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: payment.status,
          method: payment.paymentMethod || payment.provider || 'Paystack',
          late: false,
          lateFee: 0,
          transactionId: payment.providerReference || payment.id,
          type: payment.type || 'rent',
        }));
        setPayments(transformedPayments);
        setTotal(totalCount);
      }

      if (statsResponse.data) {
        setPaymentStats(statsResponse.data);
      }
    } catch (error) {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (paymentData: any) => {
    setIsSubmitting(true);
    try {
      const response = await createPayment({
        leaseId: paymentData.leaseId,
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        paymentDate: new Date().toISOString(),
        type: 'rent',
        notes: paymentData.notes
      });

      if (response.error) {
        toast.error(response.error.error || 'Failed to record payment');
      } else {
        toast.success('Payment recorded successfully');
        setShowRecordPayment(false);
        fetchPaymentsData();
      }
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  // Reminder settings state
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    firstReminder: {
      enabled: true,
      days: 7,
      time: '09:00'
    },
    secondReminder: {
      enabled: true,
      days: 3,
      time: '09:00'
    },
    dueDateReminder: {
      enabled: true,
      time: '09:00'
    },
    overdueReminder: {
      enabled: true,
      days: 1,
      frequency: '3'
    },
    channels: {
      email: true,
      sms: false
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'completed': return 'default';
      case 'Overdue': return 'destructive';
      case 'Due Soon': return 'secondary';
      case 'Pending':
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  const sendReminder = (payment: any) => {
    toast.success(`Payment reminder sent to ${payment.tenantName}`);
  };

  const totalDue = payments.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + p.amount + ((p as any).lateFee || 0), 0);
  const overduePayments = payments.filter(p => p.status === 'Overdue');
  const duesSoonPayments = payments.filter(p => p.status === 'Due Soon');

  // Filtered payments for Current Payments tab
  const currentPayments = payments.filter(p => p.status !== 'Paid');
  const filteredCurrentPayments = currentPayments.filter(payment => {
    const matchesSearch = 
      payment.tenantName.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      payment.unit.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(currentSearchTerm.toLowerCase());
    
    const matchesStatus = currentStatusFilter === 'all' || payment.status === currentStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filtered payments for Payment History tab
  const historyPayments = payments.filter(p => p.status === 'Paid');
  const filteredHistoryPayments = historyPayments.filter(payment => {
    const matchesSearch = 
      payment.tenantName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      payment.unit.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(historySearchTerm.toLowerCase());
    
    const matchesMethod = historyMethodFilter === 'all' || payment.method === historyMethodFilter;
    
    return matchesSearch && matchesMethod;
  });

  // Mock autopay data
  const autopayTenants = [
    { id: 'TEN001', name: 'Sarah Johnson', unit: 'A101', enabled: true, method: 'Card ending in 1234' },
    { id: 'TEN002', name: 'Michael Brown', unit: 'A201', enabled: false, method: 'Not set up' },
    { id: 'TEN003', name: 'Lisa Wilson', unit: 'A202', enabled: true, method: 'Bank transfer' }
  ];

  // Filtered autopay tenants
  const filteredAutopayTenants = autopayTenants.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(autopaySearchTerm.toLowerCase()) ||
      tenant.unit.toLowerCase().includes(autopaySearchTerm.toLowerCase()) ||
      tenant.id.toLowerCase().includes(autopaySearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Payment Management</h2>
          <p className="text-gray-600 mt-1">Track rent payments, late fees, and automated reminders</p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={showReminderSettings} onOpenChange={setShowReminderSettings}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Reminder Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Payment Reminder Settings</DialogTitle>
                <DialogDescription>
                  Configure automatic payment reminders for tenants
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4 pr-2">
                {/* Enable Reminders */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable Automatic Reminders</Label>
                    <p className="text-sm text-gray-500">Send automated payment reminders to tenants</p>
                  </div>
                  <Switch 
                    checked={reminderSettings.enabled}
                    onCheckedChange={(checked) => setReminderSettings({...reminderSettings, enabled: checked})}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base">Reminder Schedule</Label>
                  
                  {/* First Reminder */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">First Reminder</h4>
                        <p className="text-sm text-gray-500">Initial payment reminder</p>
                      </div>
                      <Switch 
                        checked={reminderSettings.firstReminder.enabled}
                        onCheckedChange={(checked) => setReminderSettings({
                          ...reminderSettings,
                          firstReminder: {...reminderSettings.firstReminder, enabled: checked}
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-days">Days Before Due Date</Label>
                        <Input 
                          id="first-days" 
                          type="number" 
                          value={reminderSettings.firstReminder.days}
                          onChange={(e) => setReminderSettings({
                            ...reminderSettings,
                            firstReminder: {...reminderSettings.firstReminder, days: parseInt(e.target.value) || 0}
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="first-time">Send Time</Label>
                        <Select 
                          value={reminderSettings.firstReminder.time}
                          onValueChange={(value) => setReminderSettings({
                            ...reminderSettings,
                            firstReminder: {...reminderSettings.firstReminder, time: value}
                          })}
                        >
                          <SelectTrigger id="first-time">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="09:00">9:00 AM</SelectItem>
                            <SelectItem value="12:00">12:00 PM</SelectItem>
                            <SelectItem value="15:00">3:00 PM</SelectItem>
                            <SelectItem value="18:00">6:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>

                  {/* Second Reminder */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Second Reminder</h4>
                        <p className="text-sm text-gray-500">Follow-up reminder</p>
                      </div>
                      <Switch 
                        checked={reminderSettings.secondReminder.enabled}
                        onCheckedChange={(checked) => setReminderSettings({
                          ...reminderSettings,
                          secondReminder: {...reminderSettings.secondReminder, enabled: checked}
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="second-days">Days Before Due Date</Label>
                        <Input 
                          id="second-days" 
                          type="number" 
                          value={reminderSettings.secondReminder.days}
                          onChange={(e) => setReminderSettings({
                            ...reminderSettings,
                            secondReminder: {...reminderSettings.secondReminder, days: parseInt(e.target.value) || 0}
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="second-time">Send Time</Label>
                        <Select 
                          value={reminderSettings.secondReminder.time}
                          onValueChange={(value) => setReminderSettings({
                            ...reminderSettings,
                            secondReminder: {...reminderSettings.secondReminder, time: value}
                          })}
                        >
                          <SelectTrigger id="second-time">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="09:00">9:00 AM</SelectItem>
                            <SelectItem value="12:00">12:00 PM</SelectItem>
                            <SelectItem value="15:00">3:00 PM</SelectItem>
                            <SelectItem value="18:00">6:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>

                  {/* Due Date Reminder */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Due Date Reminder</h4>
                        <p className="text-sm text-gray-500">Reminder on the due date</p>
                      </div>
                      <Switch 
                        checked={reminderSettings.dueDateReminder.enabled}
                        onCheckedChange={(checked) => setReminderSettings({
                          ...reminderSettings,
                          dueDateReminder: {...reminderSettings.dueDateReminder, enabled: checked}
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due-time">Send Time</Label>
                      <Select 
                        value={reminderSettings.dueDateReminder.time}
                        onValueChange={(value) => setReminderSettings({
                          ...reminderSettings,
                          dueDateReminder: {...reminderSettings.dueDateReminder, time: value}
                        })}
                      >
                        <SelectTrigger id="due-time">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="18:00">6:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>

                  {/* Overdue Reminder */}
                  <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-red-900">Overdue Reminder</h4>
                        <p className="text-sm text-red-700">Reminder after due date has passed</p>
                      </div>
                      <Switch 
                        checked={reminderSettings.overdueReminder.enabled}
                        onCheckedChange={(checked) => setReminderSettings({
                          ...reminderSettings,
                          overdueReminder: {...reminderSettings.overdueReminder, enabled: checked}
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="overdue-days" className="text-red-900">Days After Due Date</Label>
                        <Input 
                          id="overdue-days" 
                          type="number" 
                          value={reminderSettings.overdueReminder.days}
                          onChange={(e) => setReminderSettings({
                            ...reminderSettings,
                            overdueReminder: {...reminderSettings.overdueReminder, days: parseInt(e.target.value) || 0}
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="overdue-frequency" className="text-red-900">Repeat Every</Label>
                        <Select 
                          value={reminderSettings.overdueReminder.frequency}
                          onValueChange={(value) => setReminderSettings({
                            ...reminderSettings,
                            overdueReminder: {...reminderSettings.overdueReminder, frequency: value}
                          })}
                        >
                          <SelectTrigger id="overdue-frequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="7">1 week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Notification Channels */}
                <div className="space-y-4">
                  <Label className="text-base">Notification Channels</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-sm text-gray-500">Send reminders via email</p>
                        </div>
                      </div>
                      <Switch 
                        checked={reminderSettings.channels.email}
                        onCheckedChange={(checked) => setReminderSettings({
                          ...reminderSettings,
                          channels: {...reminderSettings.channels, email: checked}
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Send className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">SMS</p>
                          <p className="text-sm text-gray-500">Send reminders via text message</p>
                        </div>
                      </div>
                      <Switch 
                        checked={reminderSettings.channels.sms}
                        onCheckedChange={(checked) => setReminderSettings({
                          ...reminderSettings,
                          channels: {...reminderSettings.channels, sms: checked}
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowReminderSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast.success('Reminder settings saved successfully');
                  setShowReminderSettings(false);
                }}>
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showRecordPayment} onOpenChange={setShowRecordPayment}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">₦{totalDue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {payments.filter(p => p.status !== 'Paid').length} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{overduePayments.length}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-600">{duesSoonPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              Within next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">85%</div>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Payments</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="autopay">Auto-Pay Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by tenant name, unit, or payment ID..."
                    value={currentSearchTerm}
                    onChange={(e) => setCurrentSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={currentStatusFilter} onValueChange={setCurrentStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Due Soon">Due Soon</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Payment Status ({filteredCurrentPayments.length})</CardTitle>
              <CardDescription>
                Track outstanding and upcoming rent payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Late Fee</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCurrentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.tenantName}</TableCell>
                        <TableCell>{payment.unit}</TableCell>
                        <TableCell>₦{payment.amount}</TableCell>
                        <TableCell>{payment.dueDate}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(payment as any).lateFee ? (
                            <span className="text-red-600">₦{(payment as any).lateFee}</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendReminder(payment)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Remind
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCurrentPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by tenant name, unit, or payment ID..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={historyMethodFilter} onValueChange={setHistoryMethodFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History ({filteredHistoryPayments.length})</CardTitle>
              <CardDescription>
                View all completed payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistoryPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                        <TableCell>{payment.tenantName}</TableCell>
                        <TableCell>{payment.property}</TableCell>
                        <TableCell>{payment.unit}</TableCell>
                        <TableCell>{payment.currency === 'NGN' ? '₦' : ''}{payment.amount.toLocaleString()} {payment.currency !== 'NGN' ? payment.currency : ''}</TableCell>
                        <TableCell>{payment.paidDate || payment.dueDate}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.timestamp}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredHistoryPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <Search className="h-8 w-8 text-gray-400" />
                            <p className="font-medium">No payment history found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} • {total} items
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(p => Math.max(1, p - 1)); }}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage(p => Math.min(totalPages, p + 1)); }}>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="autopay" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Pay Configuration</CardTitle>
              <CardDescription>
                Manage automatic payment processing for tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable Auto-Pay Processing</Label>
                    <p className="text-sm text-gray-500">Automatically charge saved payment methods on due date</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Payment Gateway Configuration</p>
                      <p>Payment gateways are configured by the Property Owner in their Settings. Contact the property owner if you need to change payment processing settings.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base">Late Fee Configuration</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Grace Period (days)</Label>
                      <Input type="number" defaultValue="3" />
                    </div>
                    <div className="space-y-2">
                      <Label>Late Fee Amount</Label>
                      <Input type="number" defaultValue="75" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Bar for Tenant Auto-Pay Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by tenant name, unit, or tenant ID..."
                    value={autopaySearchTerm}
                    onChange={(e) => setAutopaySearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tenant Auto-Pay Status */}
          <Card>
            <CardHeader>
              <CardTitle>Tenant Auto-Pay Status ({filteredAutopayTenants.length})</CardTitle>
              <CardDescription>
                Manage auto-pay settings for individual tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Auto-Pay Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAutopayTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-gray-500">{tenant.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>{tenant.unit}</TableCell>
                        <TableCell>{tenant.method}</TableCell>
                        <TableCell>
                          <Badge variant={tenant.enabled ? 'default' : 'secondary'}>
                            {tenant.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            {tenant.enabled ? 'Disable' : 'Enable'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAutopayTenants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <Search className="h-8 w-8 text-gray-400" />
                            <p className="font-medium">No tenants found</p>
                            <p className="text-sm">Try adjusting your search</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={showRecordPayment} onOpenChange={setShowRecordPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Manual Payment</DialogTitle>
            <DialogDescription>
              Record a payment received outside the system
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tenant">Select Tenant</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarah">Sarah Johnson (A101)</SelectItem>
                  <SelectItem value="michael">Michael Brown (A201)</SelectItem>
                  <SelectItem value="lisa">Lisa Wilson (A202)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1200"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRecordPayment(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>
              Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
