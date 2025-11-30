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
  AlertCircle,
  Banknote,
  Building2
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { getPayments, initializeTenantPayment, getScheduledPayments, verifyPayment, getAutopaySettings, updateAutopaySettings, AutoPaySettings } from '../lib/api/payments';
import { getPublicPaymentGatewaySettings, getTenantPublicPaymentGateway } from '../lib/api/settings';
import { initializeSocket, isConnected, subscribeToPaymentEvents, unsubscribeFromPaymentEvents } from '../lib/socket';
import {
  getPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  removePaymentMethod,
  PaymentMethod,
} from '../lib/api/payment-methods';

interface TenantPaymentsPageProps {
  dashboardData: any;
}

const TenantPaymentsPage: React.FC<TenantPaymentsPageProps> = ({ dashboardData }) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState<'full' | 'custom'>('full');
  const [autopaySettings, setAutopaySettings] = useState<AutoPaySettings | null>(null);
  const [autopayLoading, setAutopayLoading] = useState(false);
  const [selectedAutopayCard, setSelectedAutopayCard] = useState<string>('');
  const [autopayDay, setAutopayDay] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankTransferTemplate, setBankTransferTemplate] = useState<string>('');
  const [ownerPublicKey, setOwnerPublicKey] = useState<string | null>(null);

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
    autopayEnabled: autopaySettings?.enabled || false
  };

  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadPaymentHistory = async (opts?: { resetPage?: boolean }) => {
    const nextPage = opts?.resetPage ? 1 : page;
    const resp = await getPayments({ page: nextPage, pageSize });
    if ((resp as any).data && Array.isArray((resp as any).data)) {
      const list = (resp as any).data.map((p: any) => ({
        id: p.id,
        date: new Date(p.paidAt || p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: new Date(p.paidAt || p.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        amount: p.amount,
        currency: p.currency || 'NGN',
        status: p.status,
        method: p.paymentMethod || p.provider || 'Paystack',
        type: p.type || 'rent',
        confirmation: p.providerReference || p.id,
      }));
      setPaymentHistory(list);
      // When data is array (legacy), we cannot know total; fallback
      setTotal(list.length);
    } else if ((resp as any).data && (resp as any).data.items) {
      const payload = (resp as any).data;
      const list = payload.items.map((p: any) => ({
        id: p.id,
        date: new Date(p.paidAt || p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: new Date(p.paidAt || p.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        amount: p.amount,
        currency: p.currency || 'NGN',
        status: p.status,
        method: p.paymentMethod || p.provider || 'Paystack',
        type: p.type || 'rent',
        confirmation: p.providerReference || p.id,
      }));
      setPaymentHistory(list);
      setTotal(payload.total || 0);
      setPage(payload.page || 1);
      setPageSize(payload.pageSize || 10);
    }
  };

  React.useEffect(() => {
    loadPaymentHistory();
    const token = localStorage.getItem('auth_token');
    if (token && !isConnected()) {
      try { initializeSocket(token); } catch {}
    }
    subscribeToPaymentEvents({
      onUpdated: () => loadPaymentHistory(),
      onReceived: () => loadPaymentHistory(),
    });
    const handleBrowserPaymentUpdate = () => loadPaymentHistory();
    window.addEventListener('payment:updated', handleBrowserPaymentUpdate);

    // Fetch public bank transfer template (tenant-safe)
    (async () => {
      const resp = await getPublicPaymentGatewaySettings();
      if (!resp.error && resp.data?.bankTransferTemplate) {
        setBankTransferTemplate(resp.data.bankTransferTemplate);
      }
    })();

    // Fetch owner's Paystack public key for card addition (tenant-safe)
    (async () => {
      const resp = await getTenantPublicPaymentGateway();
      if (!resp.error) {
        setOwnerPublicKey(resp.data?.publicKey ?? null);
      }
    })();

    return () => {
      unsubscribeFromPaymentEvents();
      window.removeEventListener('payment:updated', handleBrowserPaymentUpdate);
    };
  }, []);

  const [scheduledPayments, setScheduledPayments] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [addingCard, setAddingCard] = useState(false);

  // Load payment methods
  const loadPaymentMethods = async () => {
    try {
      setLoadingMethods(true);
      const response = await getPaymentMethods();
      console.log('[Payment Methods] Response:', response);
      if (response.error) {
        console.error('Failed to load payment methods:', response.error);
      } else if (response.data) {
        // Backend returns { success: true, data: [...] }
        // So we need to extract response.data.data
        const responseData = response.data as any;
        const list = Array.isArray(responseData.data)
          ? responseData.data
          : Array.isArray(responseData)
            ? responseData
            : responseData.paymentMethods || [];
        console.log('[Payment Methods] Extracted list:', list);
        setPaymentMethods(list);
      }
    } catch (error) {
      console.error('Load payment methods error:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  // Load payment methods on mount
  React.useEffect(() => {
    loadPaymentMethods();
  }, []);

  // Load scheduled payments
  const loadScheduledPayments = async () => {
    try {
      setLoadingScheduled(true);
      const response = await getScheduledPayments();
      if (!response.error && response.data) {
        setScheduledPayments(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to load scheduled payments:', error);
    } finally {
      setLoadingScheduled(false);
    }
  };

  // Load scheduled payments on mount
  React.useEffect(() => {
    loadScheduledPayments();
  }, []);

  // Handle payment callback from Paystack redirect
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentRef = urlParams.get('payment_ref') || urlParams.get('reference');
    const trxref = urlParams.get('trxref');

    const reference = paymentRef || trxref;

    if (reference) {
      // Verify the payment
      const verifyAndUpdate = async () => {
        toast.info('Verifying payment...');
        try {
          const response = await verifyPayment(reference);
          if (!response.error && response.data) {
            if (response.data.status === 'success') {
              toast.success('Payment successful! Your next payment has been scheduled.');
              // Reload payment history and scheduled payments
              loadPaymentHistory({ resetPage: true });
              loadScheduledPayments();
              // Dispatch event to refresh dashboard data
              window.dispatchEvent(new CustomEvent('payment:success'));
            } else if (response.data.status === 'failed') {
              toast.error('Payment failed. Please try again.');
            } else {
              toast.info('Payment is being processed...');
            }
          } else {
            toast.error('Failed to verify payment');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          toast.error('Failed to verify payment');
        }

        // Clean up URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete('payment_ref');
        url.searchParams.delete('reference');
        url.searchParams.delete('trxref');
        window.history.replaceState({}, '', url.toString());
      };

      verifyAndUpdate();
    }
  }, []);

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

  const handleMakePayment = async () => {
    try {
      if (!dashboardData?.lease?.id) {
        toast.error('Lease not found');
        return;
      }
      const amountNum = parseFloat(paymentAmount || '0');
      if (!amountNum || amountNum <= 0) {
        toast.error('Enter a valid amount');
        return;
      }

      // For non-Paystack methods, show instructions
      if (paymentMethod !== 'paystack') {
        const methodName = paymentMethod === 'cash' ? 'Cash' : 'Bank Transfer';
        toast.info(`${methodName} payment selected. Please contact your property manager to record the payment after completion.`, {
          duration: 8000
        });
        setShowPaymentDialog(false);
        return;
      }

      // Paystack payment flow
      setIsSubmitting(true);
      const resp = await initializeTenantPayment({
        leaseId: dashboardData.lease.id,
        amount: selectedPaymentType === 'full' ? currentRent.amount : amountNum,
        currency: dashboardData?.lease?.currency || undefined
      });
      setIsSubmitting(false);
      if ((resp as any).error) {
        const msg = (resp as any).error?.error || 'Failed to initialize payment';
        toast.error(msg);
        return;
      }
      const { authorizationUrl } = (resp as any).data || {};
      if (!authorizationUrl) {
        toast.error('Failed to start payment');
        return;
      }
      // Redirect to Paystack checkout
      window.location.href = authorizationUrl;
    } catch (e: any) {
      setIsSubmitting(false);
      toast.error('Payment initialization failed');
      console.error(e);
    }
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

  const handleAddCard = async () => {
    try {
      if (!dashboardData?.user?.email) {
        toast.error('User email not found');
        return;
      }

      // Validate owner's Paystack public key before initializing Inline
      const paystackPublicKey = ownerPublicKey || undefined;
      const isValidKey = typeof paystackPublicKey === 'string' && /^pk_(test|live)_/.test(paystackPublicKey) && paystackPublicKey.length > 12;
      if (!isValidKey) {
        toast.error('We could not start this transaction, please enter a valid key.');
        return;
      }

      // Validate Paystack library availability
      const PaystackPop = (window as any)?.PaystackPop;
      if (!PaystackPop || typeof PaystackPop.setup !== 'function') {
        toast.error('Payment provider unavailable. Please refresh and try again.');
        return;
      }

      // Use Paystack Inline to tokenize the card with a ₦50 verification charge
      const handler = PaystackPop.setup({
        key: paystackPublicKey,
        email: dashboardData.user.email,
        amount: 5000, // ₦50 in kobo (minimum for card verification)
        currency: 'NGN',
        ref: `card_verify_${Date.now()}`,
        metadata: {
          custom_fields: [
            {
              display_name: 'Purpose',
              variable_name: 'purpose',
              value: 'Card Verification'
            }
          ]
        },
        callback: function(response: any) {
          // Card successfully charged, now save the authorization using the reference
          const reference = response.reference;

          // Call backend to save the payment method using the reference
          addPaymentMethod(reference, makeDefault).then((result) => {
            if (result.error) {
              toast.error(result.error.error || 'Failed to save card');
              return;
            }

            toast.success('Card added successfully! The ₦50 verification charge will be refunded.');
            setShowAddCardDialog(false);
            loadPaymentMethods(); // Reload the payment methods list

            // Reset form
            setCardNumber('');
            setCardName('');
            setCardExpiry('');
            setCardCVV('');
            setMakeDefault(false);
          }).catch((error) => {
            console.error('Error saving card:', error);
            toast.error('Failed to save card details');
          });
        },
        onClose: function() {
          toast.info('Card addition cancelled');
        }
      });

      // Close dialog before opening Paystack to avoid overlay/focus traps
      setShowAddCardDialog(false);
      // Defer opening to allow DOM update
      setTimeout(() => {
        handler.openIframe();
      }, 50);
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Failed to initialize card addition');
    }
  };

  // Load auto-pay settings
  const loadAutopaySettings = async () => {
    try {
      setAutopayLoading(true);
      const response = await getAutopaySettings();
      if (!response.error && response.data) {
        setAutopaySettings(response.data);
        setSelectedAutopayCard(response.data.paymentMethodId || '');
        setAutopayDay(response.data.dayOfMonth || 1);
      }
    } catch (error) {
      console.error('Failed to load autopay settings:', error);
    } finally {
      setAutopayLoading(false);
    }
  };

  // Load auto-pay settings on mount
  React.useEffect(() => {
    loadAutopaySettings();
  }, []);

  const handleToggleAutoPay = async () => {
    const newStatus = !autopaySettings?.enabled;

    // If enabling, require a payment method
    if (newStatus && !selectedAutopayCard && paymentMethods.length === 0) {
      toast.error('Please add a payment method first before enabling auto-pay');
      return;
    }

    // If enabling and no card selected, use default
    const cardToUse = selectedAutopayCard || paymentMethods.find(m => m.isDefault)?.id || paymentMethods[0]?.id;

    if (newStatus && !cardToUse) {
      toast.error('Please select a payment method for auto-pay');
      return;
    }

    try {
      setAutopayLoading(true);
      const response = await updateAutopaySettings({
        enabled: newStatus,
        paymentMethodId: newStatus ? cardToUse : null,
        dayOfMonth: autopayDay
      });

      if (response.error) {
        toast.error(response.error.error || 'Failed to update auto-pay settings');
        return;
      }

      // Reload settings
      await loadAutopaySettings();
      await loadScheduledPayments();

      if (newStatus) {
        toast.success(`Auto-pay enabled! Your rent will be automatically charged on day ${autopayDay} of each month.`);
      } else {
        toast.success('Auto-pay has been disabled. You will need to manually pay your rent.');
      }
    } catch (error) {
      console.error('Failed to toggle autopay:', error);
      toast.error('Failed to update auto-pay settings');
    } finally {
      setAutopayLoading(false);
    }
  };

  const handleUpdateAutopayCard = async (cardId: string) => {
    setSelectedAutopayCard(cardId);

    if (autopaySettings?.enabled) {
      try {
        const response = await updateAutopaySettings({
          enabled: true,
          paymentMethodId: cardId,
          dayOfMonth: autopayDay
        });

        if (response.error) {
          toast.error('Failed to update payment method');
          return;
        }

        await loadAutopaySettings();
        toast.success('Auto-pay card updated');
      } catch (error) {
        toast.error('Failed to update auto-pay card');
      }
    }
  };

  const handleUpdateAutopayDay = async (day: number) => {
    setAutopayDay(day);

    if (autopaySettings?.enabled) {
      try {
        const response = await updateAutopaySettings({
          enabled: true,
          paymentMethodId: selectedAutopayCard,
          dayOfMonth: day
        });

        if (response.error) {
          toast.error('Failed to update payment day');
          return;
        }

        await loadAutopaySettings();
        await loadScheduledPayments();
        toast.success(`Auto-pay day updated to ${day}`);
      } catch (error) {
        toast.error('Failed to update auto-pay day');
      }
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
              <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Time</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap">Method</TableHead>
                      <TableHead className="whitespace-nowrap">Confirmation</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="whitespace-nowrap">{payment.date}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{payment.timestamp}</TableCell>
                        <TableCell className="whitespace-nowrap">{payment.type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{payment.method}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{payment.confirmation}</TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">{payment.currency === 'NGN' ? '₦' : ''}{payment.amount.toLocaleString()} {payment.currency !== 'NGN' ? payment.currency : ''}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} • {total} items
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(p => Math.max(1, p - 1)); setTimeout(() => loadPaymentHistory(), 0); }}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setTimeout(() => loadPaymentHistory(), 0); }}>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Payments */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Payments</CardTitle>
              <CardDescription>Upcoming rent payments</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingScheduled ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading scheduled payments...</p>
                  </div>
                </div>
              ) : scheduledPayments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No scheduled payments</p>
                  <p className="text-sm text-muted-foreground mt-1">Your next payment will appear here after you make a payment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledPayments.map((payment) => {
                    const scheduledDate = payment.scheduledDate
                      ? new Date(payment.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'TBD';
                    const daysUntil = payment.scheduledDate
                      ? Math.ceil((new Date(payment.scheduledDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;

                    return (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">
                              {payment.currency || '₦'}{payment.amount?.toLocaleString()}
                              <span className="text-sm font-normal text-blue-700 ml-2">
                                ({payment.rentFrequency === 'annual' ? 'Annual' : 'Monthly'} Rent)
                              </span>
                            </p>
                            <p className="text-sm text-blue-700">
                              Due: {scheduledDate}
                              {daysUntil !== null && daysUntil > 0 && (
                                <span className="ml-2">({daysUntil} days remaining)</span>
                              )}
                            </p>
                            {payment.lease && (
                              <p className="text-xs text-blue-600 mt-1">
                                {payment.lease.properties?.name} - Unit {payment.lease.units?.unitNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                          Scheduled
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
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
              {loadingMethods ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading payment methods...</p>
                  </div>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No payment methods saved</p>
                  <p className="text-sm text-muted-foreground mt-1">Add a card to enable quick payments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{method.cardBrand} •••• {method.cardLast4}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.cardExpMonth}/{method.cardExpYear}
                          </p>
                          {method.bank && (
                            <p className="text-xs text-muted-foreground">{method.bank}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {method.isDefault && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Default
                          </Badge>
                        )}
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const result = await setDefaultPaymentMethod(method.id);
                              if (result.error) {
                                toast.error('Failed to set default card');
                              } else {
                                toast.success('Default card updated');
                                loadPaymentMethods();
                              }
                            }}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={async () => {
                            if (confirm('Are you sure you want to remove this card?')) {
                              const result = await removePaymentMethod(method.id);
                              if (result.error) {
                                toast.error('Failed to remove card');
                              } else {
                                toast.success('Card removed successfully');
                                loadPaymentMethods();
                              }
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto-Pay Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Auto-Pay Settings</CardTitle>
              <CardDescription>Automatically pay rent each {autopaySettings?.rentFrequency === 'annual' ? 'year' : 'month'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Auto-Pay</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically charge your selected payment method on your chosen day
                  </p>
                </div>
                <Button
                  variant={autopaySettings?.enabled ? "destructive" : "default"}
                  onClick={handleToggleAutoPay}
                  disabled={autopayLoading}
                >
                  {autopayLoading ? 'Updating...' : autopaySettings?.enabled ? "Disable" : "Enable"}
                </Button>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Card</Label>
                {paymentMethods.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 border rounded-lg bg-muted/50">
                    <p>No payment methods added yet.</p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary"
                      onClick={() => setShowAddCardDialog(true)}
                    >
                      Add a card to enable auto-pay
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={selectedAutopayCard}
                    onValueChange={handleUpdateAutopayCard}
                    disabled={!autopaySettings?.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a card for auto-pay" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>{method.cardBrand || 'Card'} •••• {method.cardLast4}</span>
                            {method.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Payment Day Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Day</Label>
                <Select
                  value={autopayDay.toString()}
                  onValueChange={(val) => handleUpdateAutopayDay(parseInt(val))}
                  disabled={!autopaySettings?.enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day of month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        Day {day} of each {autopaySettings?.rentFrequency === 'annual' ? 'year' : 'month'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  We limit to day 28 to ensure consistent payments across all months
                </p>
              </div>

              {/* Status Alert */}
              {autopaySettings?.enabled && selectedAutopayCard && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Auto-pay is enabled. Your {autopaySettings?.rentFrequency === 'annual' ? 'annual' : 'monthly'} rent of{' '}
                    <strong>₦{(autopaySettings?.amount || 0).toLocaleString()}</strong> will be automatically charged to{' '}
                    <strong>
                      {paymentMethods.find(m => m.id === selectedAutopayCard)?.cardBrand || 'Card'} ••••{' '}
                      {paymentMethods.find(m => m.id === selectedAutopayCard)?.cardLast4}
                    </strong>{' '}
                    on day {autopayDay} of each {autopaySettings?.rentFrequency === 'annual' ? 'year' : 'month'}.
                  </AlertDescription>
                </Alert>
              )}

              {!autopaySettings?.enabled && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Auto-pay is disabled. You will need to manually pay your rent each {autopaySettings?.rentFrequency === 'annual' ? 'year' : 'month'}.
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
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="paystack" id="method-paystack" />
                  <Label htmlFor="method-paystack" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Paystack (Card/Bank)</p>
                        <p className="text-xs text-muted-foreground">Pay online with card or bank transfer</p>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="bank_transfer" id="method-bank" />
                  <Label htmlFor="method-bank" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">Bank Transfer</p>
                        <p className="text-xs text-muted-foreground">Transfer directly to property account</p>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="cash" id="method-cash" />
                  <Label htmlFor="method-cash" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-medium">Cash</p>
                        <p className="text-xs text-muted-foreground">Pay in person at property office</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Alert>
              {paymentMethod === 'paystack' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    You'll be redirected to Paystack to complete your payment. A receipt will be emailed after confirmation.
                  </AlertDescription>
                </>
              ) : paymentMethod === 'bank_transfer' && bankTransferTemplate ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Bank Transfer Instructions:</p>
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border">{bankTransferTemplate}</pre>
                      <p className="text-xs text-muted-foreground mt-2">After completing the transfer, contact your property manager to record the transaction.</p>
                    </div>
                  </AlertDescription>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {paymentMethod === 'cash'
                      ? 'After making cash payment, contact your property manager to record the transaction.'
                      : 'After completing bank transfer, contact your property manager to record the transaction.'}
                  </AlertDescription>
                </>
              )}
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMakePayment}
              disabled={isSubmitting || !paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              {isSubmitting
                ? 'Processing…'
                : paymentMethod === 'paystack'
                  ? `Pay ₦${paymentAmount ? parseFloat(paymentAmount).toLocaleString() : '0.00'}`
                  : 'Confirm'}
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
              Securely add a credit or debit card via Paystack
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>A secure Paystack payment window will open</li>
                  <li>Enter your card details securely</li>
                  <li>A ₦50 verification charge will be made</li>
                  <li>Your card will be saved for future payments</li>
                  <li>The ₦50 will be refunded within 24 hours</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Your card information is processed securely by Paystack. We never see or store your full card details.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCardDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCard}>
              <CreditCard className="h-4 w-4 mr-2" />
              Continue to Paystack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantPaymentsPage;

