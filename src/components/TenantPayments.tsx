import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter,
  Download,
  Send,
  Eye,
  Calendar as CalendarIcon,
  Search,
  CreditCard,
  Building
} from 'lucide-react';
import { toast } from "sonner";

interface TenantPaymentsProps {
  properties: any[];
  user: any;
}

export function TenantPayments({ properties, user }: TenantPaymentsProps) {
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<any>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Mock tenant payment data
  const [tenantPayments] = useState([
    {
      id: 'PAY001',
      tenantName: 'Sarah Johnson',
      unit: 'A101',
      propertyId: 1,
      propertyName: 'Sunset Apartments',
      rentAmount: 1250,
      dueDate: '2024-01-01',
      paidDate: '2023-12-28',
      status: 'paid',
      paymentMethod: 'ACH',
      lateFees: 0,
      totalAmount: 1250,
      leaseStart: '2023-08-01',
      leaseEnd: '2024-07-31',
      phone: '(555) 123-4567',
      email: 'sarah.j@email.com'
    },
    {
      id: 'PAY002',
      tenantName: 'Michael Brown',
      unit: 'A201',
      propertyId: 1,
      propertyName: 'Sunset Apartments',
      rentAmount: 1300,
      dueDate: '2024-01-01',
      paidDate: null,
      status: 'overdue',
      paymentMethod: 'Credit Card',
      lateFees: 65,
      totalAmount: 1365,
      leaseStart: '2023-06-15',
      leaseEnd: '2024-06-14',
      phone: '(555) 987-6543',
      email: 'mbrown@email.com',
      daysPastDue: 22
    },
    {
      id: 'PAY003',
      tenantName: 'Lisa Wilson',
      unit: 'A202',
      propertyId: 1,
      propertyName: 'Sunset Apartments',
      rentAmount: 1200,
      dueDate: '2024-01-01',
      paidDate: '2024-01-03',
      status: 'paid',
      paymentMethod: 'ACH',
      lateFees: 0,
      totalAmount: 1200,
      leaseStart: '2023-09-01',
      leaseEnd: '2024-08-31',
      phone: '(555) 456-7890',
      email: 'lisa.wilson@email.com'
    },
    {
      id: 'PAY004',
      tenantName: 'David Chen',
      unit: 'B301',
      propertyId: 2,
      propertyName: 'Riverside Complex',
      rentAmount: 950,
      dueDate: '2024-01-01',
      paidDate: null,
      status: 'pending',
      paymentMethod: 'ACH',
      lateFees: 0,
      totalAmount: 950,
      leaseStart: '2023-11-01',
      leaseEnd: '2024-10-31',
      phone: '(555) 321-0987',
      email: 'dchen@email.com',
      daysPastDue: 0
    },
    {
      id: 'PAY005',
      tenantName: 'Emma Rodriguez',
      unit: 'B205',
      propertyId: 2,
      propertyName: 'Riverside Complex',
      rentAmount: 1100,
      dueDate: '2024-01-05',
      paidDate: '2024-01-04',
      status: 'paid',
      paymentMethod: 'Credit Card',
      lateFees: 0,
      totalAmount: 1100,
      leaseStart: '2023-07-01',
      leaseEnd: '2024-06-30',
      phone: '(555) 654-3210',
      email: 'emma.r@email.com'
    },
    {
      id: 'PAY006',
      tenantName: 'James Anderson',
      unit: 'C401',
      propertyId: 3,
      propertyName: 'Park View Towers',
      rentAmount: 1800,
      dueDate: '2024-01-15',
      paidDate: null,
      status: 'due_soon',
      paymentMethod: 'ACH',
      lateFees: 0,
      totalAmount: 1800,
      leaseStart: '2023-05-15',
      leaseEnd: '2024-05-14',
      phone: '(555) 789-0123',
      email: 'j.anderson@email.com',
      daysUntilDue: 3
    },
    {
      id: 'PAY007',
      tenantName: 'Maria Garcia',
      unit: 'TH-08',
      propertyId: 4,
      propertyName: 'Garden Homes',
      rentAmount: 1650,
      dueDate: '2024-01-01',
      paidDate: null,
      status: 'overdue',
      paymentMethod: 'Check',
      lateFees: 82.50,
      totalAmount: 1732.50,
      leaseStart: '2023-03-01',
      leaseEnd: '2024-02-28',
      phone: '(555) 234-5678',
      email: 'maria.garcia@email.com',
      daysPastDue: 15
    }
  ]);

  // Filter payments based on selected criteria
  const filteredPayments = useMemo(() => {
    return tenantPayments.filter(payment => {
      const matchesProperty = selectedProperty === 'all' || payment.propertyId.toString() === selectedProperty;
      const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
      const matchesSearch = !searchTerm || 
        payment.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.propertyName.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDateRange = true;
      if (dateRange.from && dateRange.to) {
        const dueDate = new Date(payment.dueDate);
        matchesDateRange = dueDate >= dateRange.from && dueDate <= dateRange.to;
      }

      return matchesProperty && matchesStatus && matchesSearch && matchesDateRange;
    });
  }, [tenantPayments, selectedProperty, selectedStatus, searchTerm, dateRange]);

  // Calculate summary statistics
  const paymentStats = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    const collected = filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.totalAmount, 0);
    const outstanding = filteredPayments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.totalAmount, 0);
    const overdue = filteredPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.totalAmount, 0);
    
    return {
      totalRent: total,
      collected,
      outstanding,
      overdue,
      collectionRate: total > 0 ? ((collected / total) * 100) : 0,
      overdueCount: filteredPayments.filter(p => p.status === 'overdue').length,
      paidCount: filteredPayments.filter(p => p.status === 'paid').length,
      pendingCount: filteredPayments.filter(p => p.status === 'pending' || p.status === 'due_soon').length
    };
  }, [filteredPayments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'due_soon': return 'outline';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'due_soon': return 'Due Soon';
      case 'overdue': return 'Overdue';
      default: return status;
    }
  };

  const handleSendReminder = (paymentId: string) => {
    const payment = tenantPayments.find(p => p.id === paymentId);
    toast.success(`Reminder sent to ${payment?.tenantName}`);
  };

  const handleRecordPayment = (paymentId: string) => {
    toast.success('Payment recorded successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Tenant Payments</h2>
          <p className="text-gray-600 mt-1">Track rent payments and manage collections across all properties</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => toast.success('Exporting report...')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rent Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">${paymentStats.totalRent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPayments.length} total payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">${paymentStats.collected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {paymentStats.collectionRate.toFixed(1)}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-600">${paymentStats.outstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {paymentStats.pendingCount} pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">${paymentStats.overdue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {paymentStats.overdueCount} overdue payments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payment Overview</TabsTrigger>
          <TabsTrigger value="collection">Collection Reports</TabsTrigger>
          <TabsTrigger value="trends">Payment Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="due_soon">Due Soon</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tenant or unit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Due Date Range</Label>
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from && dateRange.to ? (
                          `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                        ) : (
                          "Select dates"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range: any) => setDateRange(range || {})}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSelectedProperty('all');
                      setSelectedStatus('all');
                      setSearchTerm('');
                      setDateRange({});
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Showing {filteredPayments.length} payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Rent Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Total Due</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.tenantName}</p>
                            <p className="text-sm text-gray-500">{payment.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{payment.propertyName}</span>
                          </div>
                        </TableCell>
                        <TableCell>${payment.rentAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div>
                            <p>{payment.dueDate}</p>
                            {payment.status === 'overdue' && payment.daysPastDue && (
                              <p className="text-xs text-red-500">{payment.daysPastDue} days overdue</p>
                            )}
                            {payment.status === 'due_soon' && payment.daysUntilDue && (
                              <p className="text-xs text-yellow-600">Due in {payment.daysUntilDue} days</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(payment.status)}>
                            {getStatusLabel(payment.status)}
                          </Badge>
                          {payment.paidDate && (
                            <p className="text-xs text-gray-500 mt-1">Paid: {payment.paidDate}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{payment.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">${payment.totalAmount.toLocaleString()}</p>
                            {payment.lateFees > 0 && (
                              <p className="text-xs text-red-500">+${payment.lateFees} late fee</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Payment Details</DialogTitle>
                                  <DialogDescription>
                                    {payment.tenantName} - {payment.unit}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="font-medium">Rent Amount:</p>
                                      <p>${payment.rentAmount}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium">Late Fees:</p>
                                      <p>${payment.lateFees}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium">Total Due:</p>
                                      <p className="font-semibold">${payment.totalAmount}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium">Due Date:</p>
                                      <p>{payment.dueDate}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium">Contact:</p>
                                      <p>{payment.phone}</p>
                                      <p className="text-xs text-gray-500">{payment.email}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium">Lease:</p>
                                      <p className="text-xs">{payment.leaseStart} to {payment.leaseEnd}</p>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            {payment.status !== 'paid' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleSendReminder(payment.id)}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleRecordPayment(payment.id)}
                                >
                                  Record Payment
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collection Reports</CardTitle>
              <CardDescription>Detailed payment collection analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Collection Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Rent Collected:</span>
                      <span className="font-semibold text-green-600">${paymentStats.collected.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding Amount:</span>
                      <span className="font-semibold text-yellow-600">${paymentStats.outstanding.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overdue Amount:</span>
                      <span className="font-semibold text-red-600">${paymentStats.overdue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Collection Rate:</span>
                      <span className="font-semibold">{paymentStats.collectionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Payment Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Paid on Time:</span>
                      <span>{paymentStats.paidCount} payments</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending/Due Soon:</span>
                      <span>{paymentStats.pendingCount} payments</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overdue:</span>
                      <span>{paymentStats.overdueCount} payments</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Trends</CardTitle>
              <CardDescription>Historical payment patterns and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Payment trend charts coming soon</p>
                <p className="text-sm">This will show monthly collection rates, late payment trends, and seasonal patterns</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


