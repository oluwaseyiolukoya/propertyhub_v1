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
      <Card className="mb-6 border-red-200 bg-red-50">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-red-900">Account Suspended</h3>
                <Badge variant="destructive">Action Required</Badge>
              </div>
              <p className="text-red-700 mb-4">
                {status.suspensionReason || 'Your account has been suspended due to no payment method on file.'}
              </p>
              <p className="text-sm text-red-600 mb-4">
                Your data is safe for 30 days. Add a payment method to reactivate your account.
              </p>
              <div className="flex gap-3">
                {status.hasPaymentMethod ? (
                  <Button onClick={onUpgradeClick} className="bg-red-600 hover:bg-red-700">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Reactivate Account
                  </Button>
                ) : (
                  <Button onClick={onAddPaymentMethod} className="bg-red-600 hover:bg-red-700">
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
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-orange-900">Trial Expired - Grace Period</h3>
                <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                  {graceDays} {graceDays === 1 ? 'day' : 'days'} remaining
                </Badge>
              </div>
              <p className="text-orange-700 mb-4">
                Your trial has ended. You have {graceDays} {graceDays === 1 ? 'day' : 'days'} to add a payment method before your account is suspended.
              </p>
              <div className="flex gap-3">
                {status.hasPaymentMethod ? (
                  <Button onClick={onUpgradeClick} className="bg-orange-600 hover:bg-orange-700">
                    <Zap className="mr-2 h-4 w-4" />
                    Activate Subscription
                  </Button>
                ) : (
                  <Button onClick={onAddPaymentMethod} className="bg-orange-600 hover:bg-orange-700">
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
      // Normal - Blue to Purple gradient (matches your design)
      cardClasses = 'mb-6 border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50';
      iconBg = 'bg-gradient-to-br from-blue-100 to-purple-100';
      iconColor = 'text-blue-600';
      titleText = 'text-gray-900';
      subtitleText = 'text-gray-700';
      badgeClasses = 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200';
      buttonClasses = 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white';
      progressColor = 'bg-gradient-to-r from-blue-500 to-purple-500';
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

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className={subtitleText}>Trial Progress</span>
                  <span className={subtitleText}>{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${progressColor} transition-all duration-500 ease-out`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={onUpgradeClick} className={buttonClasses}>
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade Now
                </Button>
                {!status.hasPaymentMethod && (
                  <Button onClick={onAddPaymentMethod} variant="outline" className="border-gray-300 hover:bg-gray-50">
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

