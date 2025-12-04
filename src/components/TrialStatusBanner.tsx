import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { AlertCircle, Clock, CreditCard, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { getSubscriptionStatus, SubscriptionStatus } from '../lib/api/subscription';
import { toast } from 'sonner';

interface TrialStatusBannerProps {
  onUpgradeClick: () => void;
  onAddPaymentMethod: () => void;
}

export function TrialStatusBanner({ onUpgradeClick, onAddPaymentMethod }: TrialStatusBannerProps) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    // Refresh status every 5 minutes
    const interval = setInterval(loadStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await getSubscriptionStatus();
      setStatus(data);
    } catch (error: any) {
      console.error('[TrialStatusBanner] Error loading status:', error);
      // Don't show error toast, just log it
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) {
    return null;
  }

  // Don't show banner for active subscriptions
  if (status.status === 'active') {
    return null;
  }

  // Suspended account banner
  if (status.status === 'suspended') {
    return (
      <Card className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-600 shadow-md">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-red-900">Account Suspended</h3>
                <Badge variant="destructive" className="font-semibold">Action Required</Badge>
              </div>
              <p className="text-red-700 mb-4 font-medium">
                {status.suspensionReason || 'Your account has been suspended due to no payment method on file.'}
              </p>
              <p className="text-sm text-red-600 mb-4">
                Your data is safe for 30 days. Add a payment method to reactivate your account.
              </p>
              <div className="flex flex-wrap gap-3">
                {status.hasPaymentMethod ? (
                  <Button 
                    onClick={onUpgradeClick} 
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                    size="lg"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Reactivate Account
                  </Button>
                ) : (
                  <Button 
                    onClick={onAddPaymentMethod} 
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                    size="lg"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grace period banner
  if (status.inGracePeriod) {
    const graceDays = status.graceDaysRemaining;
    return (
      <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 shadow-md">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-orange-900">Trial Expired - Grace Period</h3>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                  {graceDays} {graceDays === 1 ? 'day' : 'days'} remaining
                </Badge>
              </div>
              <p className="text-orange-700 mb-4 font-medium">
                Your trial has ended. You have {graceDays} {graceDays === 1 ? 'day' : 'days'} to add a payment method before your account is suspended.
              </p>
              <div className="flex flex-wrap gap-3">
                {status.hasPaymentMethod ? (
                  <Button 
                    onClick={onUpgradeClick} 
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                    size="lg"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Activate Subscription
                  </Button>
                ) : (
                  <Button 
                    onClick={onAddPaymentMethod} 
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                    size="lg"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Trial banner
  if (status.status === 'trial') {
    const daysLeft = status.daysRemaining;
    // Calculate total days from trial start and end dates
    const totalDays = status.trialStartsAt && status.trialEndsAt
      ? Math.ceil((new Date(status.trialEndsAt).getTime() - new Date(status.trialStartsAt).getTime()) / (1000 * 60 * 60 * 24))
      : 14; // Fallback to 14 if dates not available
    const progressPercent = ((totalDays - daysLeft) / totalDays) * 100;

    // Determine urgency level with modern gradient colors
    let cardClasses = '';
    let iconBg = '';
    let iconColor = '';
    let titleText = '';
    let subtitleText = '';
    let badgeClasses = '';
    let buttonClasses = '';
    let progressColor = '';

    if (daysLeft <= 1) {
      // Critical - Red gradient
      cardClasses = 'mb-6 border-red-200 bg-gradient-to-r from-red-50 to-pink-50';
      iconBg = 'bg-gradient-to-br from-red-100 to-pink-100';
      iconColor = 'text-red-600';
      titleText = 'text-red-900';
      subtitleText = 'text-red-700';
      badgeClasses = 'bg-red-100 text-red-800 border-red-200';
      buttonClasses = 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white';
      progressColor = 'bg-red-500';
    } else if (daysLeft <= 3) {
      // Urgent - Orange gradient
      cardClasses = 'mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50';
      iconBg = 'bg-gradient-to-br from-orange-100 to-amber-100';
      iconColor = 'text-orange-600';
      titleText = 'text-orange-900';
      subtitleText = 'text-orange-700';
      badgeClasses = 'bg-orange-100 text-orange-800 border-orange-200';
      buttonClasses = 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white';
      progressColor = 'bg-orange-500';
    } else if (daysLeft <= 7) {
      // Warning - Yellow/Amber gradient
      cardClasses = 'mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50';
      iconBg = 'bg-gradient-to-br from-amber-100 to-yellow-100';
      iconColor = 'text-amber-600';
      titleText = 'text-amber-900';
      subtitleText = 'text-amber-700';
      badgeClasses = 'bg-amber-100 text-amber-800 border-amber-200';
      buttonClasses = 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white';
      progressColor = 'bg-amber-500';
    } else {
      // Normal - Purple gradient (matches brand)
      cardClasses = 'mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-md';
      iconBg = 'bg-gradient-to-br from-purple-500 to-indigo-600';
      iconColor = 'text-white';
      titleText = 'text-gray-900';
      subtitleText = 'text-gray-700';
      badgeClasses = 'bg-purple-100 text-purple-800 border-purple-200';
      buttonClasses = 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200';
      progressColor = 'bg-gradient-to-r from-purple-600 to-indigo-600';
    }

    return (
      <Card className={cardClasses}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
                <Clock className={`h-6 w-6 ${iconColor}`} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className={`text-lg font-semibold ${titleText}`}>
                  {daysLeft === 0 ? 'Trial Ends Today!' : `${daysLeft} ${daysLeft === 1 ? 'Day' : 'Days'} Left in Trial`}
                </h3>
                <Badge variant="secondary" className={badgeClasses}>
                  Trial
                </Badge>
              </div>
              <p className={`${subtitleText} mb-4`}>
                {daysLeft === 0
                  ? "Your trial ends today. Upgrade now to continue without interruption!"
                  : daysLeft === 1
                  ? "Your trial ends tomorrow. Don't lose access to your data!"
                  : daysLeft <= 3
                  ? "Your trial is ending soon. Upgrade now to keep all your data and features."
                  : "You're currently on a free trial. Upgrade anytime to unlock full features."}
              </p>

              {/* Progress bar - Brand Styled */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-sm font-medium ${subtitleText}`}>Trial Progress</span>
                  <span className={`text-sm font-semibold ${titleText}`}>{Math.round(progressPercent)}%</span>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className={`h-full ${progressColor} transition-all duration-500 ease-out rounded-full shadow-sm`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>Day {totalDays - daysLeft} of {totalDays}</span>
                  <span>{daysLeft} days remaining</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={onUpgradeClick} 
                  className={`${buttonClasses} font-semibold`}
                  size="lg"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade Now
                </Button>
                {!status.hasPaymentMethod && (
                  <Button 
                    onClick={onAddPaymentMethod} 
                    variant="outline" 
                    className="border-purple-300 hover:bg-purple-50 hover:border-purple-400 text-purple-700 font-medium"
                    size="lg"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}

