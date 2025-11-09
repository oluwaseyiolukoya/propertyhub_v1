import { apiClient } from '../api-client';

export interface SubscriptionStatus {
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  trialStartsAt?: string;
  trialEndsAt?: string;
  daysRemaining: number;
  inGracePeriod: boolean;
  gracePeriodEndsAt?: string;
  graceDaysRemaining: number;
  suspendedAt?: string;
  suspensionReason?: string;
  hasPaymentMethod: boolean;
  canUpgrade: boolean;
  nextBillingDate?: string;
  plan?: {
    id: string;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
  };
  billingCycle: string;
  mrr: number;
}

export interface SubscriptionEvent {
  id: string;
  customerId: string;
  eventType: string;
  previousStatus?: string;
  newStatus?: string;
  metadata?: any;
  triggeredBy: string;
  createdAt: string;
}

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const response = await apiClient.get<SubscriptionStatus>('/api/subscription/status');

    if (response.error) {
      throw new Error(response.error.message || 'Failed to get subscription status');
    }

    return response.data;
  } catch (error: any) {
    console.error('[Subscription API] Get status error:', error);
    throw error;
  }
}

/**
 * Upgrade subscription from trial to paid
 */
export async function upgradeSubscription(data: {
  planId: string;
  billingCycle: 'monthly' | 'annual';
  paymentMethodId?: string;
  paymentReference?: string;
  savePaymentMethod?: boolean;
}): Promise<{
  success: boolean;
  subscriptionId: string;
  status: string;
  nextBillingDate: string;
  message: string;
}> {
  try {
    // Suppress auth redirect so we can surface the exact backend error to the UI
    const response = await apiClient.post('/api/subscription/upgrade', data, { suppressAuthRedirect: true });

    if (response.error) {
      const backendMessage =
        response.error.message ||
        (response as any)?.error?.details ||
        (response as any)?.error?.error ||
        'Failed to upgrade subscription';
      const code = (response as any)?.error?.code;
      const composed = code ? `${backendMessage} (code: ${code})` : backendMessage;
      throw new Error(composed);
    }

    return response.data;
  } catch (error: any) {
    console.error('[Subscription API] Upgrade error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    throw error;
  }
}

/**
 * Reactivate suspended account
 */
export async function reactivateAccount(paymentMethodId?: string): Promise<{
  success: boolean;
  status: string;
  message: string;
}> {
  try {
    const response = await apiClient.post('/api/subscription/reactivate', {
      paymentMethodId,
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to reactivate account');
    }

    return response.data;
  } catch (error: any) {
    console.error('[Subscription API] Reactivate error:', error);
    throw error;
  }
}

/**
 * Get subscription event history
 */
export async function getSubscriptionHistory(): Promise<SubscriptionEvent[]> {
  try {
    const response = await apiClient.get<{ events: SubscriptionEvent[] }>('/api/subscription/history');

    if (response.error) {
      throw new Error(response.error.message || 'Failed to get subscription history');
    }

    return response.data.events;
  } catch (error: any) {
    console.error('[Subscription API] Get history error:', error);
    throw error;
  }
}

