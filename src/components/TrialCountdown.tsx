import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Clock, Zap, AlertCircle } from 'lucide-react';
import { getSubscriptionStatus, SubscriptionStatus } from '../lib/api/subscription';

interface TrialCountdownProps {
  onUpgradeClick: () => void;
}

export function TrialCountdown({ onUpgradeClick }: TrialCountdownProps) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    // Refresh every 5 minutes
    const interval = setInterval(loadStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await getSubscriptionStatus();
      setStatus(data);
    } catch (error) {
      console.error('[TrialCountdown] Error loading status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) {
    return null;
  }

  // Don't show for active subscriptions
  if (status.status === 'active') {
    return null;
  }

  // Suspended account
  if (status.status === 'suspended') {
    return (
      <button
        onClick={onUpgradeClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
      >
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Account Suspended</span>
        <Badge variant="destructive" className="ml-1">Reactivate</Badge>
      </button>
    );
  }

  // Grace period
  if (status.inGracePeriod) {
    const graceDays = status.graceDaysRemaining;
    return (
      <button
        onClick={onUpgradeClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg transition-colors animate-pulse"
      >
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">
          Grace Period: {graceDays} {graceDays === 1 ? 'day' : 'days'} left
        </span>
        <Badge variant="secondary" className="ml-1 bg-orange-200">Upgrade</Badge>
      </button>
    );
  }

  // Trial
  if (status.status === 'trial') {
    const daysLeft = status.daysRemaining;

    // Determine urgency
    let bgColor = 'bg-blue-100 hover:bg-blue-200';
    let textColor = 'text-blue-800';
    let icon = <Clock className="h-4 w-4" />;
    let animate = '';

    if (daysLeft <= 1) {
      bgColor = 'bg-red-100 hover:bg-red-200';
      textColor = 'text-red-800';
      icon = <AlertCircle className="h-4 w-4" />;
      animate = 'animate-pulse';
    } else if (daysLeft <= 3) {
      bgColor = 'bg-orange-100 hover:bg-orange-200';
      textColor = 'text-orange-800';
      icon = <AlertCircle className="h-4 w-4" />;
    }

    return (
      <button
        onClick={onUpgradeClick}
        className={`flex items-center gap-2 px-3 py-1.5 ${bgColor} ${textColor} rounded-lg transition-colors ${animate}`}
      >
        {icon}
        <span className="text-sm font-medium">
          {daysLeft === 0
            ? 'Trial ends today'
            : `Trial: ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
        </span>
        <Badge variant="secondary" className="ml-1">
          <Zap className="h-3 w-3 mr-1" />
          Upgrade
        </Badge>
      </button>
    );
  }

  return null;
}

