import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getPaymentMethods,
  initializeCardAuthorization,
  addPaymentMethod,
  setDefaultPaymentMethod,
  removePaymentMethod,
  PaymentMethod,
} from '../lib/api/payment-methods';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const PaymentMethodsManager: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCard, setAddingCard] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
    checkForPaymentCallback();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await getPaymentMethods();
      setPaymentMethods(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to load payment methods:', error);
      toast.error(error.response?.data?.error || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const checkForPaymentCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const paymentMethodCallback = urlParams.get('payment_method_callback');

    if (reference && paymentMethodCallback === 'true') {
      console.log('[Payment Methods] Detected payment callback with reference:', reference);
      handlePaymentCallback(reference);
    }
  };

  const handlePaymentCallback = async (reference: string) => {
    try {
      console.log('[Payment Methods] Processing payment callback...');
      toast.loading('Verifying card...', { id: 'verify-card' });

      const response = await addPaymentMethod(reference, true);
      console.log('[Payment Methods] Card added successfully:', response.data);

      toast.success('Payment method added successfully!', { id: 'verify-card' });

      // Reload payment methods so the user can see the new card
      await loadPaymentMethods();

      // Ensure we stay on the Billing tab in Developer Settings
      const url = new URL(window.location.href);
      url.pathname = '/developer/settings';
      url.searchParams.set('tab', 'billing');
      url.searchParams.delete('reference');
      url.searchParams.delete('payment_method_callback');
      window.history.replaceState({}, '', url.toString());
    } catch (error: any) {
      console.error('[Payment Methods] Failed to add payment method:', error);
      toast.error(
        error.response?.data?.error || 'Failed to add payment method',
        { id: 'verify-card' }
      );
    }
  };

  const handleAddCard = async () => {
    try {
      setAddingCard(true);
      console.log('[Payment Methods] Initializing card authorization...');

      const response = await initializeCardAuthorization();
      const { authorizationUrl, reference, email } = response.data.data;

      console.log('[Payment Methods] Authorization initialized:', reference);
      console.log('[Payment Methods] Customer email:', email);

      // Store reference in session storage for callback handling
      sessionStorage.setItem('payment_method_reference', reference);

      // Initialize Paystack popup
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_your_key_here',
        email: email,
        amount: 10000, // ₦100 in kobo
        currency: 'NGN',
        ref: reference,
        onClose: () => {
          console.log('[Payment Methods] Payment popup closed');
          setAddingCard(false);
          sessionStorage.removeItem('payment_method_reference');
        },
        callback: (response: any) => {
          console.log('[Payment Methods] Payment successful:', response.reference);
          // Process the callback without leaving the Billing page
          // Note: This must be a synchronous function for Paystack, so we handle async work separately
          handlePaymentCallback(response.reference)
            .then(() => {
              console.log('[Payment Methods] Card verification completed');
            })
            .catch((error) => {
              console.error('[Payment Methods] Card verification failed:', error);
            })
            .finally(() => {
              setAddingCard(false);
              sessionStorage.removeItem('payment_method_reference');
            });
        },
      });

      handler.openIframe();
    } catch (error: any) {
      console.error('[Payment Methods] Failed to initialize card authorization:', error);
      toast.error(
        error.response?.data?.error || 'Failed to initialize card authorization'
      );
      setAddingCard(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setSettingDefaultId(paymentMethodId);
      await setDefaultPaymentMethod(paymentMethodId);
      toast.success('Default payment method updated');
      await loadPaymentMethods();
    } catch (error: any) {
      console.error('Failed to set default payment method:', error);
      toast.error(error.response?.data?.error || 'Failed to set default payment method');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleRemoveCard = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      setRemovingId(paymentMethodId);
      await removePaymentMethod(paymentMethodId);
      toast.success('Payment method removed');
      await loadPaymentMethods();
    } catch (error: any) {
      console.error('Failed to remove payment method:', error);
      toast.error(error.response?.data?.error || 'Failed to remove payment method');
    } finally {
      setRemovingId(null);
    }
  };

  const getCardBrandIcon = (brand: string | null) => {
    if (!brand) return null;
    const brandLower = brand.toLowerCase();

    if (brandLower.includes('visa')) {
      return '💳 Visa';
    } else if (brandLower.includes('mastercard')) {
      return '💳 Mastercard';
    } else if (brandLower.includes('verve')) {
      return '💳 Verve';
    }
    return `💳 ${brand}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your payment methods for automatic billing
          </p>
        </div>
        <button
          onClick={handleAddCard}
          disabled={addingCard}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          {addingCard ? 'Processing...' : 'Add Card'}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Automatic Billing</p>
          <p className="mt-1">
            Your default payment method will be charged automatically for subscription renewals.
            We'll send you a receipt after each successful payment.
          </p>
        </div>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No payment methods</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add a payment method to enable automatic billing
          </p>
          <button
            onClick={handleAddCard}
            disabled={addingCard}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`relative bg-white border-2 rounded-lg p-6 transition-all ${
                method.isDefault
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Default Badge */}
              {method.isDefault && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Check className="h-3 w-3 mr-1" />
                    Default
                  </span>
                </div>
              )}

              {/* Card Info */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {getCardBrandIcon(method.cardBrand)}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    •••• •••• •••• {method.cardLast4}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Expires {method.cardExpMonth}/{method.cardExpYear}
                  </p>
                  {method.bank && (
                    <p className="text-xs text-gray-500 mt-1">{method.bank}</p>
                  )}
                  {method.accountName && (
                    <p className="text-xs text-gray-500">{method.accountName}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center space-x-3">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    disabled={settingDefaultId === method.id}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    {settingDefaultId === method.id ? 'Setting...' : 'Set as Default'}
                  </button>
                )}
                <button
                  onClick={() => handleRemoveCard(method.id)}
                  disabled={removingId === method.id}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 flex items-center"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {removingId === method.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Note */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-900 mb-1">🔒 Secure Payment Processing</p>
        <p>
          Your payment information is securely stored and processed by Paystack, a PCI-DSS
          compliant payment processor. We never store your full card details on our servers.
        </p>
      </div>
    </div>
  );
};

export default PaymentMethodsManager;

