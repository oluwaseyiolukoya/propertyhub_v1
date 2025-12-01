import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import type { Plan } from '../lib/api/subscriptions';

interface SubscriptionManagementProps {
  subscriptionData: any;
  availablePlans: Plan[];
  loadingPlans: boolean;
  showChangePlanDialog: boolean;
  setShowChangePlanDialog: (show: boolean) => void;
  showChangeBillingDialog: boolean;
  setShowChangeBillingDialog: (show: boolean) => void;
  showCancelDialog: boolean;
  setShowCancelDialog: (show: boolean) => void;
  selectedPlan: Plan | null;
  setSelectedPlan: (plan: Plan | null) => void;
  newBillingCycle: 'monthly' | 'annual';
  setNewBillingCycle: (cycle: 'monthly' | 'annual') => void;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  cancelConfirmation: string;
  setCancelConfirmation: (confirmation: string) => void;
  isProcessing: boolean;
  onChangePlan: () => void;
  onChangeBillingCycle: () => void;
  onCancelSubscription: () => void;
}

export function SubscriptionManagement({
  subscriptionData,
  availablePlans,
  loadingPlans,
  showChangePlanDialog,
  setShowChangePlanDialog,
  showChangeBillingDialog,
  setShowChangeBillingDialog,
  showCancelDialog,
  setShowCancelDialog,
  selectedPlan,
  setSelectedPlan,
  newBillingCycle,
  setNewBillingCycle,
  cancelReason,
  setCancelReason,
  cancelConfirmation,
  setCancelConfirmation,
  isProcessing,
  onChangePlan,
  onChangeBillingCycle,
  onCancelSubscription,
}: SubscriptionManagementProps) {
  const currencyCode = subscriptionData.currency || 'USD';
  const formatMoney = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value || 0);
  const formatLimitValue = (limit?: number) => (limit && limit > 0 ? limit : 'Unlimited');
  const getUsagePercent = (used: number, limit?: number) =>
    limit && limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <>
      <div className="space-y-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{subscriptionData.plan} Plan</h3>
                  <Badge className={subscriptionData.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {subscriptionData.status === 'cancelled' ? 'Cancelled' : 'Active'}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  {formatMoney(subscriptionData.amount)} • Billed {subscriptionData.billingCycle}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Next billing date: {subscriptionData.nextBillingDate}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setShowChangePlanDialog(true)} disabled={subscriptionData.status === 'cancelled'}>
                  Change Plan
                </Button>
                <Button variant="outline" onClick={() => setShowChangeBillingDialog(true)} disabled={subscriptionData.status === 'cancelled'}>
                  Change Billing
                </Button>
                {subscriptionData.status !== 'cancelled' && (
                  <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Usage Stats */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Usage & Limits</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Properties</span>
                    <span className="text-gray-900">
                    {subscriptionData.usageStats.propertiesUsed} / {formatLimitValue(subscriptionData.properties)}
                    </span>
                  </div>
                  <Progress
                  value={getUsagePercent(subscriptionData.usageStats.propertiesUsed, subscriptionData.properties)}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Units</span>
                    <span className="text-gray-900">
                    {subscriptionData.usageStats.unitsUsed} / {formatLimitValue(subscriptionData.units)}
                    </span>
                  </div>
                  <Progress
                  value={getUsagePercent(subscriptionData.usageStats.unitsUsed, subscriptionData.units)}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Property Managers</span>
                    <span className="text-gray-900">
                    {subscriptionData.usageStats.managersUsed} / {formatLimitValue(subscriptionData.managers)}
                    </span>
                  </div>
                  <Progress
                  value={getUsagePercent(subscriptionData.usageStats.managersUsed, subscriptionData.managers)}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Storage</span>
                    <span className="text-gray-900">
                    {subscriptionData.usageStats.storageUsed} GB / {formatLimitValue(subscriptionData.usageStats.storageLimit)} GB
                    </span>
                  </div>
                  <Progress
                  value={getUsagePercent(subscriptionData.usageStats.storageUsed, subscriptionData.usageStats.storageLimit)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Compare plans and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPlans ? (
              <div className="text-center py-8 text-gray-500">Loading plans...</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {availablePlans.map((plan) => {
                  const isCurrent = plan.id === subscriptionData.planId || plan.name === subscriptionData.plan;
                  return (
                    <div
                      key={plan.id}
                      className={`p-4 border rounded-lg relative ${
                        isCurrent ? 'border-2 border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      {isCurrent && (
                        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600">
                          Current
                        </Badge>
                      )}
                      <h4 className="font-semibold mb-2">{plan.name}</h4>
                      <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                      <p className="text-gray-900 text-2xl font-bold mb-4">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: plan.currency || currencyCode,
                          maximumFractionDigits: 2,
                        }).format(plan.monthlyPrice)}
                        <span className="text-sm font-normal text-gray-600">/mo</span>
                      </p>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Up to {plan.propertyLimit} properties
                        </li>
                        {plan.unitLimit && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {plan.unitLimit} units
                          </li>
                        )}
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {plan.userLimit} users
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {plan.storageLimit} MB storage
                        </li>
                      </ul>
                      <Button
                        className="w-full"
                        disabled={isCurrent || subscriptionData.status === 'cancelled'}
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowChangePlanDialog(true);
                        }}
                      >
                        {isCurrent ? 'Current Plan' : 'Select Plan'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Plan Dialog */}
      <Dialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upgrade Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a higher plan to upgrade your account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {loadingPlans ? (
              <p className="text-center py-4">Loading plans...</p>
            ) : (() => {
              // Get current plan price
              const currentPlanPrice = subscriptionData.planMonthlyPrice || subscriptionData.amount || 0;

              // Sort plans by price
              const sortedPlans = [...availablePlans].sort(
                (a, b) => a.monthlyPrice - b.monthlyPrice
              );

              // Filter to show only current plan and higher-tier plans
              const visiblePlans = sortedPlans.filter(
                (plan) => plan.monthlyPrice >= currentPlanPrice
              );

              // Get current plan
              const currentPlan = availablePlans.find(
                (plan) => plan.id === subscriptionData.planId
              );

              // Separate current and upgrade plans
              const upgradePlans = visiblePlans.filter(
                (plan) => plan.id !== subscriptionData.planId
              );

              return (
                <div className="space-y-3">
                  {/* Show current plan (highlighted as active) */}
                  {currentPlan && (
                    <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {currentPlan.name}
                            </h4>
                            <Badge className="bg-green-600 text-white text-xs">
                              Active Plan
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {currentPlan.projectLimit || currentPlan.propertyLimit}{' '}
                            {currentPlan.projectLimit ? 'projects' : 'properties'} •{' '}
                            {currentPlan.userLimit} users •{' '}
                            {currentPlan.storageLimit}MB storage
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatMoney(currentPlan.monthlyPrice)}
                          </p>
                          <p className="text-sm text-gray-600">/month</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show upgrade plans */}
                  {upgradePlans.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 font-medium">
                        You're on the highest plan! 🎉
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        There are no higher plans available to upgrade to.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="pt-2">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Available Upgrades
                        </p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {upgradePlans.map((plan) => {
                          const isSelected = selectedPlan?.id === plan.id;
                          return (
                            <div
                              key={plan.id}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                              }`}
                              onClick={() => setSelectedPlan(plan)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                                {plan.isPopular && (
                                  <Badge className="bg-blue-600 text-white text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                              <p className="text-gray-900 text-2xl font-bold mb-3">
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: plan.currency || currencyCode,
                                  maximumFractionDigits: 2,
                                }).format(plan.monthlyPrice)}
                                <span className="text-sm font-normal text-gray-600">/mo</span>
                              </p>
                              <ul className="space-y-1 text-sm text-gray-600">
                                {plan.category === 'property_management' && plan.propertyLimit && (
                                  <li>• Up to {plan.propertyLimit} properties</li>
                                )}
                                {plan.category === 'development' && plan.projectLimit && (
                                  <li>• Up to {plan.projectLimit} projects</li>
                                )}
                                {plan.category === 'property_management' && plan.unitLimit && (
                                  <li>• {plan.unitLimit} units</li>
                                )}
                                <li>• {plan.userLimit} users</li>
                                <li>• {plan.storageLimit} MB storage</li>
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePlanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={onChangePlan} disabled={!selectedPlan || isProcessing}>
              {isProcessing ? 'Processing...' : 'Upgrade Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Billing Cycle Dialog */}
      <Dialog open={showChangeBillingDialog} onOpenChange={setShowChangeBillingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Billing Cycle</DialogTitle>
            <DialogDescription>
              Switch between monthly and annual billing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div
              className={`p-4 border rounded-lg cursor-pointer ${
                newBillingCycle === 'monthly' ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setNewBillingCycle('monthly')}
            >
              <h4 className="font-semibold">Monthly Billing</h4>
              <p className="text-sm text-gray-600">Pay month-to-month</p>
            </div>

            <div
              className={`p-4 border rounded-lg cursor-pointer ${
                newBillingCycle === 'annual' ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setNewBillingCycle('annual')}
            >
              <h4 className="font-semibold">Annual Billing</h4>
              <p className="text-sm text-gray-600">Save 20% with annual billing</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeBillingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={onChangeBillingCycle} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Change Billing Cycle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Cancel Subscription</DialogTitle>
            <DialogDescription>
              This action cannot be undone
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning Box */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">
                    Warning: Data Loss and Account Deactivation
                  </h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Your account will be immediately deactivated</li>
                    <li>• All managers and tenants will lose access</li>
                    <li>• Your data may be permanently deleted after 30 days</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Help us improve by telling us why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Confirmation */}
            <div>
              <Label htmlFor="cancel-confirmation">
                Type <strong>CANCEL_SUBSCRIPTION</strong> to confirm
              </Label>
              <Input
                id="cancel-confirmation"
                placeholder="CANCEL_SUBSCRIPTION"
                value={cancelConfirmation}
                onChange={(e) => setCancelConfirmation(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={onCancelSubscription}
              disabled={cancelConfirmation !== 'CANCEL_SUBSCRIPTION' || isProcessing}
            >
              {isProcessing ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



