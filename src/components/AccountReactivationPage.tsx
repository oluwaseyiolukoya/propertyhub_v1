import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, CheckCircle2, CreditCard, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getSubscriptionStatus, reactivateAccount, SubscriptionStatus } from '../lib/api/subscription';
import { getPaymentMethods } from '../lib/api/payment-methods';

interface PaymentMethod {
  id: string;
  cardType: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

interface AccountReactivationPageProps {
  onSuccess: () => void;
  onAddPaymentMethod: () => void;
}

export function AccountReactivationPage({ onSuccess, onAddPaymentMethod }: AccountReactivationPageProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [statusData, paymentMethodsData] = await Promise.all([
        getSubscriptionStatus(),
        getPaymentMethods(),
      ]);

      setStatus(statusData);
      setPaymentMethods(paymentMethodsData);

      // Auto-select default payment method
      const defaultPM = paymentMethodsData.find(pm => pm.isDefault);
      if (defaultPM) {
        setSelectedPaymentMethod(defaultPM.id);
      } else if (paymentMethodsData.length > 0) {
        setSelectedPaymentMethod(paymentMethodsData[0].id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load account status');
    } finally {
      setLoadingData(false);
    }
  };

  const handleReactivate = async () => {
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setLoading(true);
      await reactivateAccount(selectedPaymentMethod || undefined);
      toast.success('Account reactivated successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reactivate account');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!status || status.status !== 'suspended') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Account Active
            </CardTitle>
            <CardDescription>
              Your account is active and in good standing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onSuccess} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilDeletion = status.suspendedAt
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(status.suspendedAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 30;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Status Card */}
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="bg-red-50">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-red-900">Account Suspended</CardTitle>
                <CardDescription className="text-red-700 mt-2">
                  {status.suspensionReason || 'Your account has been suspended due to no payment method on file.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-900">Data Retention Period</p>
                  <p className="text-sm text-yellow-700">
                    Your data will be permanently deleted in {daysUntilDeletion} {daysUntilDeletion === 1 ? 'day' : 'days'}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Suspended On</p>
                  <p className="font-semibold">
                    {status.suspendedAt ? new Date(status.suspendedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Account Status</p>
                  <Badge variant="destructive">Suspended</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reactivation Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Reactivate Your Account
            </CardTitle>
            <CardDescription>
              Add a payment method to restore full access to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentMethods.length > 0 ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Payment Method</label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>
                              {pm.cardType} •••• {pm.last4} ({pm.expiryMonth}/{pm.expiryYear})
                            </span>
                            {pm.isDefault && (
                              <Badge variant="secondary" className="ml-2">Default</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleReactivate}
                  disabled={loading || !selectedPaymentMethod}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Reactivating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Reactivate Account
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    No payment method on file. Please add a payment method to reactivate your account.
                  </p>
                </Card>

                <Button
                  onClick={onAddPaymentMethod}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Add Payment Method
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What Happens After Reactivation?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Immediate Access</p>
                  <p className="text-sm text-gray-600">Your account will be reactivated instantly</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">All Data Restored</p>
                  <p className="text-sm text-gray-600">Access all your properties, tenants, and documents</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Billing Resumes</p>
                  <p className="text-sm text-gray-600">Your subscription will be charged according to your plan</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

