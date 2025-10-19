import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { 
  CreditCard, 
  Calendar, 
  Download,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';

interface TenantPaymentsPageProps {
  dashboardData: any;
}

const TenantPaymentsPage: React.FC<TenantPaymentsPageProps> = ({ dashboardData }) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('1');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState<'full' | 'custom'>('full');
  const [autopayEnabled, setAutopayEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);

  const monthlyRent = dashboardData?.lease?.monthlyRent || 0;
  
  React.useEffect(() => {
    setPaymentAmount(monthlyRent.toString());
  }, [monthlyRent]);

  // Format data from API
  const currentRent = {
    amount: monthlyRent,
    dueDate: dashboardData?.rent?.nextPaymentDue 
      ? new Date(dashboardData.rent.nextPaymentDue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : "N/A",
    daysUntilDue: dashboardData?.rent?.daysUntilDue || 0,
    balance: 0,
    autopayEnabled: autopayEnabled
  };

  const paymentHistory = dashboardData?.payments?.recent?.map((payment: any) => ({
    id: payment.id,
    date: new Date(payment.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    amount: payment.amount,
    status: payment.status === 'completed' ? 'paid' : payment.status,
    method: payment.paymentMethod,
    type: payment.type || 'Rent',
    confirmation: payment.confirmationNumber || payment.transactionId
  })) || [];

  const scheduledPayments: any[] = []; // This would come from API if auto-pay is enabled

  const paymentMethods: any[] = []; // This would come from payment provider API

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMakePayment = () => {
    setShowPaymentDialog(false);
    const selectedMethod = paymentMethods.find(m => m.id.toString() === paymentMethod);
    toast.success(`Payment of ₦${parseFloat(paymentAmount).toLocaleString()} processed successfully via ${selectedMethod?.brand} •••• ${selectedMethod?.last4}!`);
  };

  const handleOpenPaymentDialog = (type: 'full' | 'custom' = 'full') => {
    setSelectedPaymentType(type);
    if (type === 'full') {
      setPaymentAmount(currentRent.amount.toString());
    } else {
      setPaymentAmount('');
    }
    setShowPaymentDialog(true);
  };

  const handleAddCard = () => {
    if (!cardNumber || !cardName || !cardExpiry || !cardCVV) {
      toast.error('Please fill in all card details');
      return;
    }
    
    // Simulate adding a card
    setShowAddCardDialog(false);
    toast.success(`Card ending in ${cardNumber.slice(-4)} added successfully!`);
    
    // Reset form
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCVV('');
    setMakeDefault(false);
  };

  const handleToggleAutoPay = () => {
    const newStatus = !autopayEnabled;
    setAutopayEnabled(newStatus);
    
    if (newStatus) {
      toast.success('Auto-pay has been enabled! Your rent will be automatically charged on the 1st of each month.');
    } else {
      toast.success('Auto-pay has been disabled. You will need to manually pay your rent each month.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Payments</h1>
          <p className="text-muted-foreground">Manage your rent payments and view history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleOpenPaymentDialog('custom')}>
            <DollarSign className="h-4 w-4 mr-2" />
            Custom Payment
          </Button>
          <Button onClick={() => handleOpenPaymentDialog('full')}>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Rent
          </Button>
        </div>
      </div>

      {/* Current Rent Status */}
      {currentRent.balance === 0 && currentRent.daysUntilDue <= 15 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Calendar className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 flex items-center justify-between">
            <span>Your rent payment of ₦{currentRent.amount.toLocaleString()} is due on {currentRent.dueDate} ({currentRent.daysUntilDue} days remaining)</span>
            <Button size="sm" onClick={() => handleOpenPaymentDialog('full')}>
              Pay Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {currentRent.balance > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900 flex items-center justify-between">
            <span>You have an outstanding balance of ₦{currentRent.balance.toLocaleString()}</span>
            <Button size="sm" variant="destructive" onClick={() => handleOpenPaymentDialog('custom')}>
              Pay Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{currentRent.amount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Due {currentRent.dueDate}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{currentRent.balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {currentRent.balance === 0 ? 'All paid up!' : 'Outstanding'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Pay</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentRent.autopayEnabled ? 'Enabled' : 'Disabled'}</div>
            <p className="text-xs text-muted-foreground">
              Payment method on file
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMethods.length}</div>
            <p className="text-xs text-muted-foreground">
              Cards on file
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Payments</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>

        {/* Payment History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All your past payments and transactions</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Confirmation</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{payment.method}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{payment.confirmation}</TableCell>
                      <TableCell className="text-right font-medium">₦{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Payments */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Payments</CardTitle>
              <CardDescription>Upcoming automatic payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">₦{payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{payment.date} • {payment.method}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Manage your saved payment methods</CardDescription>
                </div>
                <Button onClick={() => setShowAddCardDialog(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{method.brand} •••• {method.last4}</p>
                        <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          Default
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Auto-Pay Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Auto-Pay Settings</CardTitle>
              <CardDescription>Automatically pay rent each month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Auto-Pay</p>
                  <p className="text-sm text-muted-foreground">Automatically charge your default payment method on the 1st of each month</p>
                </div>
                <Button 
                  variant={currentRent.autopayEnabled ? "destructive" : "default"}
                  onClick={handleToggleAutoPay}
                >
                  {currentRent.autopayEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
              {currentRent.autopayEnabled && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Auto-pay is enabled. Your rent will be automatically charged to Visa •••• 4242 on the 1st of each month.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Make Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make a Payment</DialogTitle>
            <DialogDescription>
              {selectedPaymentType === 'full' 
                ? 'Pay your rent securely online' 
                : 'Make a custom payment amount'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPaymentType === 'custom' && (
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={paymentAmount === currentRent.amount.toString() ? 'default' : 'outline'}
                    onClick={() => setPaymentAmount(currentRent.amount.toString())}
                    type="button"
                  >
                    Full Rent (₦{currentRent.amount.toLocaleString()})
                  </Button>
                  <Button 
                    variant={paymentAmount !== currentRent.amount.toString() ? 'default' : 'outline'}
                    onClick={() => setPaymentAmount('')}
                    type="button"
                  >
                    Partial/Other
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                <Input 
                  id="amount"
                  type="number" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  readOnly={selectedPaymentType === 'full'}
                  className="pl-7"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {selectedPaymentType === 'custom' && currentRent.balance > 0 && (
                <p className="text-sm text-muted-foreground">
                  Outstanding balance: ₦{currentRent.balance.toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value={method.id.toString()} id={`method-${method.id}`} />
                    <Label htmlFor={`method-${method.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span>{method.brand} •••• {method.last4}</span>
                        {method.isDefault && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 ml-2">
                            Default
                          </Badge>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Your payment will be processed immediately and a confirmation email will be sent to your registered email address.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMakePayment}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              Pay ₦{paymentAmount ? parseFloat(paymentAmount).toLocaleString() : '0.00'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Card Dialog */}
      <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new credit or debit card to your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => {
                  // Format card number with spaces
                  const value = e.target.value.replace(/\s/g, '');
                  const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                  setCardNumber(formatted);
                }}
                maxLength={19}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardExpiry">Expiry Date</Label>
                <Input
                  id="cardExpiry"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    let formatted = value;
                    if (value.length >= 2) {
                      formatted = value.slice(0, 2) + '/' + value.slice(2, 4);
                    }
                    setCardExpiry(formatted);
                  }}
                  maxLength={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardCVV">CVV</Label>
                <Input
                  id="cardCVV"
                  type="password"
                  placeholder="123"
                  value={cardCVV}
                  onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="makeDefault"
                checked={makeDefault}
                onCheckedChange={(checked) => setMakeDefault(checked as boolean)}
              />
              <Label
                htmlFor="makeDefault"
                className="text-sm font-normal cursor-pointer"
              >
                Set as default payment method
              </Label>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Your card information is securely encrypted and stored. We never share your payment details.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCardDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCard}>
              Add Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantPaymentsPage;

