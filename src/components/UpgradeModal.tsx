import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Check, Zap, CreditCard, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { upgradeSubscription, getSubscriptionStatus } from '../lib/api/subscription';
import { getAvailablePlans } from '../lib/api/plans';
import { getUserData } from '../lib/api';
import { initializeUpgrade } from '../lib/api/subscriptions';

interface Plan {
  id: string;
  name: string;
  description?: string;
  category?: string; // 'property_management' | 'development'
  monthlyPrice: number;
  annualPrice?: number;
  currency: string;
  features: any;
  isActive?: boolean;
  isPopular?: boolean;
  propertyLimit?: number;
  projectLimit?: number;
  userLimit?: number;
  storageLimit?: number;
}

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpgradeModal({ open, onClose, onSuccess }: UpgradeModalProps) {
  const [step, setStep] = useState<'select-plan' | 'payment' | 'save-card'>('select-plan');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loadingData, setLoadingData] = useState(true);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [saveCard, setSaveCard] = useState(true);
  const userData = getUserData();

  useEffect(() => {
    if (open) {
      loadData();
      setStep('select-plan');
      setPaymentReference('');
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoadingData(true);

      // 1) Load available plans for this user (already filtered by category on backend)
      const plansResponse = await getAvailablePlans();
      const allPlans = (plansResponse.data || []).filter((p: Plan) => p.isActive);
      console.log('[UpgradeModal] All available plans:', allPlans.map(p => ({ id: p.id, name: p.name, price: p.monthlyPrice })));

      // 2) Load current subscription status to know current plan and price
      let currentPlanId: string | null = null;
      let currentPlanPrice = 0;
      try {
        const status = await getSubscriptionStatus();
        console.log('[UpgradeModal] Current subscription status:', status);
        if (status?.plan) {
          currentPlanId = status.plan.id;
          currentPlanPrice = status.plan.monthlyPrice || 0;
          console.log('[UpgradeModal] Current plan:', { id: currentPlanId, price: currentPlanPrice });
        }
      } catch (statusErr) {
        console.warn('[UpgradeModal] Failed to load current subscription status for filtering:', statusErr);
      }

      // 3) Filter out the current plan and any cheaper/equal plans
      let upgradePlans: Plan[] = allPlans;
      if (currentPlanPrice > 0) {
        upgradePlans = allPlans
          .filter((plan) => {
            const isUpgrade = plan.monthlyPrice > currentPlanPrice;
            console.log(`[UpgradeModal] Plan ${plan.name} (${plan.monthlyPrice}) > current (${currentPlanPrice})?`, isUpgrade);
            return isUpgrade;
          })
          .sort((a, b) => a.monthlyPrice - b.monthlyPrice);
      }

      console.log('[UpgradeModal] Filtered upgrade plans:', upgradePlans.map(p => ({ id: p.id, name: p.name, price: p.monthlyPrice })));
      setPlans(upgradePlans);

      // Auto-select first upgrade plan, if any
      if (upgradePlans.length > 0) {
        setSelectedPlan(upgradePlans[0].id);
      } else {
        setSelectedPlan('');
        console.warn('[UpgradeModal] No upgrade plans available - user may be on highest plan');
      }
    } catch (error: any) {
      console.error('[UpgradeModal] Failed to load plans:', error);
      toast.error(error.message || 'Failed to load plans');
    } finally {
      setLoadingData(false);
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const price = selectedPlanData
    ? (billingCycle === 'annual' ? (selectedPlanData.annualPrice || selectedPlanData.monthlyPrice * 12) : selectedPlanData.monthlyPrice)
    : 0;
  const annualSavings = selectedPlanData && selectedPlanData.annualPrice
    ? (selectedPlanData.monthlyPrice * 12 - selectedPlanData.annualPrice)
    : 0;

  const handleProceedToPayment = () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!selectedPlanData || !userData) {
      toast.error('Missing required information');
      return;
    }

    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    try {
      setLoading(true);
      console.log('[UpgradeModal] Initializing payment for plan:', selectedPlan);

      // Initialize payment with backend - this will return authorization URL
      const response = await initializeUpgrade(selectedPlan);
      console.log('[UpgradeModal] Response:', response);

      if (response.data?.authorizationUrl) {
        // Store reference for verification on callback
        sessionStorage.setItem('upgrade_reference', response.data.reference);
        sessionStorage.setItem('upgrade_plan_id', selectedPlan);

        toast.info('Redirecting to payment gateway...');

        // Redirect to Paystack payment page
        setTimeout(() => {
          window.location.href = response.data.authorizationUrl;
        }, 1000);
      } else {
        console.error('[UpgradeModal] No authorization URL in response:', response);
        const errorMessage =
          response.data?.error ||
          response.error?.error ||
          'Failed to initialize payment';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('[UpgradeModal] Failed to initialize upgrade:', error);
      console.error('[UpgradeModal] Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data,
      });
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Failed to initialize upgrade payment';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      setPaymentReference(reference);

      // Verify auth token is still valid before proceeding
      const token = localStorage.getItem('auth_token');
      console.log('[UpgradeModal] Checking auth token:', token ? 'Present' : 'Missing');

      if (!token) {
        console.error('[UpgradeModal] Auth token lost during payment flow');
        toast.error('Session expired. Please login again and retry.');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      // Auto-complete upgrade immediately after successful Paystack payment
      setLoading(true);
      toast.info('Payment confirmed. Finalizing your subscription...');

      console.log('[UpgradeModal] Calling upgradeSubscription with:', {
        planId: selectedPlan,
        billingCycle,
        paymentReference: reference,
        savePaymentMethod: true,
      });

      await upgradeSubscription({
        planId: selectedPlan,
        billingCycle,
        paymentReference: reference,
        savePaymentMethod: true, // Default to saving card for better renewal UX
      });

      toast.success('🎉 Subscription activated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      // If auto-complete fails, fall back to manual confirm step
      console.error('[UpgradeModal] Auto-upgrade failed:', error);
      console.error('[UpgradeModal] Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });

      // Check if it's an auth error
      if (error.message?.includes('Unauthorized') || error.message?.includes('401') || error.message?.includes('No token')) {
        console.error('[UpgradeModal] Authentication error during upgrade');
        toast.error('Session expired. Please login again and retry.');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      // Try to detect if backend already flipped the account to active
      try {
        const status = await getSubscriptionStatus();
        if (status?.status === 'active') {
          toast.success('🎉 Subscription activated!');
          onSuccess();
          onClose();
          return;
        }
      } catch {}
      toast.error(error?.message || 'Upgrade verification failed. Please confirm to finish.');
      setStep('save-card');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteUpgrade = async (shouldSaveCard: boolean) => {
    if (!selectedPlan || !paymentReference) {
      toast.error('Missing payment information');
      return;
    }

    try {
      setLoading(true);

      // Complete the upgrade with payment reference
      await upgradeSubscription({
        planId: selectedPlan,
        billingCycle,
        paymentReference,
        savePaymentMethod: shouldSaveCard,
      });

      toast.success('🎉 Subscription activated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate subscription');
    } finally {
      setLoading(false);
    }
  };

  const renderPlanSelection = () => (
    <div className="space-y-6">
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
        <Label className="text-sm font-medium">Billing Cycle:</Label>
        <RadioGroup
          value={billingCycle}
          onValueChange={(value: 'monthly' | 'annual') => setBillingCycle(value)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="monthly" id="monthly" />
            <Label htmlFor="monthly" className="cursor-pointer">Monthly</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="annual" id="annual" />
            <Label htmlFor="annual" className="cursor-pointer">
              Annual {annualSavings > 0 && <span className="text-green-600">(Save {selectedPlanData?.currency} {annualSavings.toFixed(2)})</span>}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Plans Grid */}
      <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const planPrice = billingCycle === 'annual' ? (plan.annualPrice || plan.monthlyPrice * 12) : plan.monthlyPrice;
            const isSelected = selectedPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`p-6 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-2 border-blue-600 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50'
                    : 'border border-gray-200 hover:border-blue-300 hover:shadow-md'
                } ${plan.isPopular ? 'ring-2 ring-purple-400' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.isPopular && (
                  <Badge className="mb-2 bg-gradient-to-r from-purple-600 to-pink-600">
                    Most Popular
                  </Badge>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    )}
                  </div>
                  <RadioGroupItem value={plan.id} id={plan.id} />
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {plan.currency} {planPrice.toFixed(2)}
                    </span>
                    <span className="text-gray-600">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {Array.isArray(plan.features) ? (
                    plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))
                  ) : plan.features && typeof plan.features === 'object' ? (
                    Object.entries(plan.features).map(([key, value], index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{String(value)}</span>
                      </li>
                    ))
                  ) : null}

                  {/* Show limits based on plan category */}
                  {plan.category === 'property_management' && plan.propertyLimit && (
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Up to {plan.propertyLimit} properties</span>
                    </li>
                  )}
                  {plan.category === 'development' && plan.projectLimit && (
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Up to {plan.projectLimit} projects</span>
                    </li>
                  )}
                  {plan.userLimit && (
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Up to {plan.userLimit} users</span>
                    </li>
                  )}
                  {plan.storageLimit && (
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{plan.storageLimit} MB storage</span>
                    </li>
                  )}
                </ul>
              </Card>
            );
          })}
        </div>
      </RadioGroup>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No plans available at the moment.</p>
          <p className="text-sm text-gray-500 mt-2">Please contact support for assistance.</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleProceedToPayment}
          disabled={!selectedPlan}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          Proceed to Payment
          <Zap className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium">{selectedPlanData?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Billing Cycle:</span>
            <span className="font-medium capitalize">{billingCycle}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-3">
            <span>Total Amount:</span>
            <span className="text-blue-600">
              {selectedPlanData?.currency} {price.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Secure Payment with Paystack</p>
            <p className="text-xs text-blue-700 mt-1">
              Your payment information is encrypted and secure. You'll be redirected to Paystack to complete the payment.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={() => setStep('select-plan')}>
          Back
        </Button>
        <Button
          onClick={handlePayment}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Pay {selectedPlanData?.currency} {price.toFixed(2)}
        </Button>
      </div>
    </div>
  );

  const renderSaveCard = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">Your payment has been processed successfully.</p>
      </div>

      <Card className="p-6 border-2 border-green-200 bg-green-50">
        <div className="flex items-start gap-3">
          <Checkbox
            id="save-card"
            checked={saveCard}
            onCheckedChange={(checked) => setSaveCard(checked as boolean)}
            className="mt-1"
          />
          <div className="flex-1">
            <Label htmlFor="save-card" className="text-base font-medium text-gray-900 cursor-pointer">
              Save payment method for future billing
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Store your payment details securely for automatic renewals. You can manage or remove this payment method anytime from your settings.
            </p>
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Next Steps:</strong> Your subscription will be activated immediately.
          {saveCard
            ? ' Your card will be charged automatically on your next billing date.'
            : ' You will need to make a manual payment for your next billing cycle.'}
        </p>
      </div>

      <div className="flex justify-end items-center pt-4 border-t">
        <Button
          onClick={() => handleCompleteUpgrade(saveCard)}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Activating...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Activate Subscription
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 'select-plan' && 'Choose Your Plan'}
            {step === 'payment' && 'Complete Payment'}
            {step === 'save-card' && 'Save Payment Method'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-plan' && 'Select a plan that best fits your needs'}
            {step === 'payment' && 'Review your order and proceed to payment'}
            {step === 'save-card' && 'Would you like to save your payment method for future billing?'}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="mt-4">
            {step === 'select-plan' && renderPlanSelection()}
            {step === 'payment' && renderPayment()}
            {step === 'save-card' && renderSaveCard()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
