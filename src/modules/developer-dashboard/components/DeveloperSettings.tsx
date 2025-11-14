import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import { Separator } from "../../../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Progress } from "../../../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Users,
  Mail,
  Save,
  Upload,
  Globe,
  Crown,
  TrendingUp
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";
import { getAccountInfo } from '../../../lib/api/auth';
import { getSubscriptionStatus } from '../../../lib/api/subscription';
import { formatCurrency as formatCurrencyUtil } from '../../../lib/currency';
import { getSubscriptionPlans, changePlan, changeBillingCycle, cancelSubscription, getBillingHistory, initializeUpgrade, verifyUpgrade, type Plan, type Invoice } from '../../../lib/api/subscriptions';

interface DeveloperSettingsProps {
  user?: any;
}

export function DeveloperSettings({ user }: DeveloperSettingsProps) {
  // Get active tab from URL and store in state
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'profile';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [billingHistory, setBillingHistory] = useState<Invoice[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [showChangeBillingDialog, setShowChangeBillingDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [newBillingCycle, setNewBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirmation, setCancelConfirmation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchAccountData();
    fetchPlans();
    fetchBillingHistory();

    // Check for payment callback
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference') || sessionStorage.getItem('upgrade_reference');

    if (reference && window.location.pathname.includes('/upgrade/callback')) {
      handlePaymentCallback(reference);
    }

    // Handle browser back/forward navigation
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab') || 'profile';
      console.log('[DeveloperSettings] Browser navigation detected, switching to tab:', tab);
      setActiveTab(tab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handlePaymentCallback = async (reference: string) => {
    try {
      console.log('[DeveloperSettings] Verifying payment with reference:', reference);
      toast.info('Verifying payment...');

      const response = await verifyUpgrade(reference);
      console.log('[DeveloperSettings] Verification response:', response.data);

      if (response.data?.success) {
        // Clear stored reference
        sessionStorage.removeItem('upgrade_reference');
        sessionStorage.removeItem('upgrade_plan_id');

        const customer = response.data.customer;
        const limits = customer.limits;

        console.log('[DeveloperSettings] Upgrade successful! New limits:', limits);

        // Show success message with new plan details
        toast.success(
          `Plan upgraded successfully! You now have ${limits.projects || limits.properties || 0} ${limits.projects ? 'projects' : 'properties'} and ${limits.users} users.`
        );

        // Refresh data and stay on billing tab
        setTimeout(async () => {
          console.log('[DeveloperSettings] Refreshing data...');
          setActiveTab('billing');
          const url = new URL(window.location.href);
          url.searchParams.set('tab', 'billing');
          url.searchParams.delete('reference'); // Remove reference from URL
          window.history.replaceState({}, '', url.toString());

          // Refresh all data
          await fetchAccountData();
          await fetchPlans();
          await fetchBillingHistory();
        }, 2000);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error: any) {
      console.error('[DeveloperSettings] Payment verification error:', error);
      toast.error(error.response?.data?.error || 'Failed to verify payment');

      // Redirect back to settings
      setTimeout(() => {
        window.location.href = '/developer/settings?tab=billing';
      }, 3000);
    }
  };

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const [acctResponse, subResponse] = await Promise.all([
        getAccountInfo(),
        getSubscriptionStatus()
      ]);

      if (acctResponse.data) {
        console.log('[DeveloperSettings] Account info loaded:', {
          plan: acctResponse.data.customer?.plan?.name,
          projectLimit: acctResponse.data.customer?.projectLimit,
          userLimit: acctResponse.data.customer?.plan?.userLimit
        });
        setAccountInfo(acctResponse.data);
      }

      if (subResponse.data) {
        console.log('[DeveloperSettings] Subscription loaded:', {
          plan: subResponse.data.plan?.name,
          status: subResponse.data.status
        });
        setSubscription(subResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch account data:', error);
      toast.error('Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await getSubscriptionPlans();
      if (response.data?.plans) {
        setAvailablePlans(response.data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await getBillingHistory();
      if (response.data?.invoices) {
        setBillingHistory(response.data.invoices);
      }
    } catch (error) {
      console.error('Failed to fetch billing history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    try {
      setIsProcessing(true);

      // Initialize payment
      console.log('[Upgrade] Initializing payment for plan:', selectedPlan);
      const response = await initializeUpgrade(selectedPlan);
      console.log('[Upgrade] Response:', response);

      if (response.data?.authorizationUrl) {
        // Store reference for verification
        sessionStorage.setItem('upgrade_reference', response.data.reference);
        sessionStorage.setItem('upgrade_plan_id', selectedPlan);

        toast.info('Redirecting to payment gateway...');

        // Redirect to Paystack payment page
        setTimeout(() => {
          window.location.href = response.data.authorizationUrl;
        }, 1000);
      } else {
        console.error('[Upgrade] No authorization URL in response:', response);
        const errorMessage = response.data?.error || response.error?.error || 'Failed to initialize payment';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('[Upgrade] Failed to initialize upgrade:', error);
      console.error('[Upgrade] Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to initialize upgrade payment';
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleChangeBillingCycle = async () => {
    try {
      setIsProcessing(true);
      const response = await changeBillingCycle(newBillingCycle);
      if (response.error) {
        toast.error(response.error.error || 'Failed to change billing cycle');
      } else {
        toast.success('Billing cycle changed successfully!');
        setShowChangeBillingDialog(false);
        fetchAccountData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to change billing cycle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (cancelConfirmation !== 'CANCEL_SUBSCRIPTION') {
      toast.error('Please type CANCEL_SUBSCRIPTION to confirm');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await cancelSubscription({
        reason: cancelReason,
        confirmation: cancelConfirmation
      });

      if (response.error) {
        toast.error(response.error.error || 'Failed to cancel subscription');
      } else {
        toast.success('Subscription cancelled successfully. Logging you out...');
        setShowCancelDialog(false);

        // Clear all authentication data immediately
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userType');

        // Wait a moment then redirect to login
        setTimeout(() => {
          window.location.href = '/login?message=account_cancelled';
        }, 1500);
      }
    } catch (error: any) {
      console.error('[DeveloperSettings] Cancel subscription error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to cancel subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'PD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const subscriptionData = subscription ? {
    plan: subscription.plan?.name || accountInfo?.customer?.plan?.name || 'Free',
    status: subscription.status || 'active',
    billingCycle: subscription.billingCycle || accountInfo?.customer?.billingCycle || 'monthly',
    nextBillingDate: subscription.nextBillingDate,
    mrr: subscription.mrr || accountInfo?.customer?.mrr || 0,
    currency: subscription.plan?.currency || accountInfo?.customer?.plan?.currency || 'NGN',
    projects: accountInfo?.customer?.projectLimit || 3,
    users: accountInfo?.customer?.userLimit || 3,
    storage: accountInfo?.customer?.storageLimit || 1000,
    usageStats: {
      projectsUsed: accountInfo?.customer?.projectsCount || 0,
      usersUsed: 1, // TODO: Get actual user count
      storageUsed: 0 // TODO: Get actual storage used
    }
  } : null;

  const handleTabChange = (value: string) => {
    console.log('[DeveloperSettings] Tab changed to:', value);
    // Update state
    setActiveTab(value);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and project preferences</p>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="w-4 h-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-blue-600 text-white text-2xl">
                    {getInitials(user?.name || accountInfo?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF (max. 2MB)</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    defaultValue={user?.name?.split(' ')[0] || accountInfo?.user?.name?.split(' ')[0] || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    defaultValue={user?.name?.split(' ').slice(1).join(' ') || accountInfo?.user?.name?.split(' ').slice(1).join(' ') || ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || accountInfo?.user?.email || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  defaultValue={accountInfo?.customer?.phone || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  defaultValue="Property Developer"
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a bit about yourself..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button className="gap-2" onClick={() => toast.success('Profile updated successfully!')}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Manage your organization information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  defaultValue={accountInfo?.customer?.company || user?.company || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-type">Organization Type</Label>
                <Select defaultValue="developer">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developer">Property Developer</SelectItem>
                    <SelectItem value="contractor">General Contractor</SelectItem>
                    <SelectItem value="consultant">Construction Consultant</SelectItem>
                    <SelectItem value="investor">Real Estate Investor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID / EIN</Label>
                  <Input
                    id="tax-id"
                    defaultValue={accountInfo?.customer?.taxId || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">License Number</Label>
                  <Input id="license" placeholder="LIC-2025-XXXX" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  defaultValue={accountInfo?.customer?.street || ''}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    defaultValue={accountInfo?.customer?.city || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    defaultValue={accountInfo?.customer?.state || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    defaultValue={accountInfo?.customer?.postalCode || ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <Input
                    id="website"
                    defaultValue={accountInfo?.customer?.website || ''}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="gap-2" onClick={() => toast.success('Organization details updated!')}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Budget Alerts</p>
                  <p className="text-sm text-gray-500">Notify when budget lines exceed thresholds</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Invoice Approvals</p>
                  <p className="text-sm text-gray-500">Notifications for pending invoice approvals</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Purchase Orders</p>
                  <p className="text-sm text-gray-500">Updates on purchase order status changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Weekly Reports</p>
                  <p className="text-sm text-gray-500">Receive weekly project summary reports</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Forecast Updates</p>
                  <p className="text-sm text-gray-500">AI-generated forecast and insight notifications</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>In-App Notifications</CardTitle>
              <CardDescription>
                Configure in-app notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Desktop Notifications</p>
                  <p className="text-sm text-gray-500">Show desktop notifications for important alerts</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Sound Alerts</p>
                  <p className="text-sm text-gray-500">Play sound when receiving notifications</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password & Authentication</CardTitle>
              <CardDescription>
                Manage your password and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>

              <Button onClick={() => toast.success('Password updated successfully!')}>
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Require authentication code when signing in</p>
                </div>
                <Badge variant="outline">Not Enabled</Badge>
              </div>
              <Button variant="outline" onClick={() => toast.info('2FA setup coming soon!')}>
                Enable 2FA
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active sessions across devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">Current Device - Browser</p>
                  <Badge className="bg-green-500">Current Session</Badge>
                </div>
                <p className="text-sm text-gray-500">Last active: Now</p>
              </div>

              <Button variant="outline" onClick={() => toast.info('Session management coming soon!')}>
                Revoke All Other Sessions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading subscription details...</p>
                </div>
              ) : (
                <>
                  <div className="p-6 border-2 border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {subscription?.plan?.name || accountInfo?.customer?.plan?.name || 'Free Plan'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {accountInfo?.customer?.projectLimit || subscription?.projectLimit || 3} projects •
                          {' '}{accountInfo?.customer?.plan?.userLimit || subscription?.plan?.userLimit || 5} users •
                          Advanced analytics • Priority support
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-gray-900">
                          {formatCurrencyUtil(
                            accountInfo?.customer?.plan?.monthlyPrice || subscription?.plan?.monthlyPrice || 0,
                            accountInfo?.customer?.plan?.currency || subscription?.plan?.currency || 'NGN'
                          )}/month
                        </p>
                        <p className="text-sm text-gray-500">
                          Billed {subscription?.billingCycle || 'monthly'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowChangePlanDialog(true)}
                      >
                        Change Plan
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-semibold text-gray-900 mb-4">Billing Information</p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Next billing date: {subscription?.nextBillingDate
                          ? new Date(subscription.nextBillingDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Payment method: •••• •••• •••• 4242
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" onClick={() => toast.info('Payment method update coming soon!')}>
                    Update Payment Method
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View and download your billing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading billing history...</p>
                </div>
              ) : billingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No billing history yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Your invoices will appear here once you have billing activity
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {billingHistory.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(invoice.paidAt || invoice.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrencyUtil(invoice.amount, invoice.currency)}
                        </p>
                        {invoice.description && (
                          <p className="text-xs text-gray-400 mt-1">{invoice.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            invoice.status === 'paid'
                              ? 'bg-green-500'
                              : invoice.status === 'pending'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info('Invoice download coming soon!')}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Plan Dialog */}
          {showChangePlanDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Upgrade Subscription Plan</CardTitle>
                  <CardDescription>
                    Select a higher plan to upgrade your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingPlans ? (
                    <p className="text-center py-4">Loading plans...</p>
                  ) : (() => {
                    const currentPlanId = accountInfo?.customer?.planId || subscription?.planId;
                    const currentPlanPrice = accountInfo?.customer?.plan?.monthlyPrice || subscription?.plan?.monthlyPrice || 0;

                    // Filter to show only upgrade plans (higher price than current)
                    const upgradePlans = availablePlans.filter(plan => plan.monthlyPrice > currentPlanPrice);

                    // Get current plan for display
                    const currentPlan = availablePlans.find(plan => plan.id === currentPlanId);

                    return (
                      <div className="space-y-3">
                        {/* Show current plan (faded) */}
                        {currentPlan && (
                          <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50 opacity-60 cursor-not-allowed">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-700">{currentPlan.name}</h4>
                                  <Badge variant="outline" className="text-xs">Current Plan</Badge>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {currentPlan.projectLimit} projects • {currentPlan.userLimit} users • {currentPlan.storageLimit}MB storage
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-gray-700">
                                  {formatCurrencyUtil(currentPlan.monthlyPrice, currentPlan.currency)}
                                </p>
                                <p className="text-sm text-gray-500">/month</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show upgrade plans */}
                        {upgradePlans.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-600 font-medium">You're on the highest plan! 🎉</p>
                            <p className="text-sm text-gray-500 mt-2">
                              There are no higher plans available to upgrade to.
                            </p>
                          </div>
                        ) : (
                          upgradePlans.map((plan) => {
                            const isCurrentPlan = plan.id === currentPlanId;
                            return (
                              <div
                                key={plan.id}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                  isCurrentPlan
                                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                    : selectedPlan === plan.id
                                    ? 'border-blue-500 bg-blue-50 cursor-pointer'
                                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                                }`}
                                onClick={() => !isCurrentPlan && setSelectedPlan(plan.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className={`font-semibold ${isCurrentPlan ? 'text-gray-700' : 'text-gray-900'}`}>
                                        {plan.name}
                                      </h4>
                                      {plan.isPopular && !isCurrentPlan && (
                                        <Badge className="bg-green-500 text-xs">Popular</Badge>
                                      )}
                                    </div>
                                    <p className={`text-sm mt-1 ${isCurrentPlan ? 'text-gray-500' : 'text-gray-600'}`}>
                                      {plan.projectLimit} projects • {plan.userLimit} users • {plan.storageLimit}MB storage
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-lg font-semibold ${isCurrentPlan ? 'text-gray-700' : 'text-gray-900'}`}>
                                      {formatCurrencyUtil(plan.monthlyPrice, plan.currency)}
                                    </p>
                                    <p className="text-sm text-gray-500">/month</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
                <div className="p-6 border-t flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowChangePlanDialog(false);
                      setSelectedPlan('');
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChangePlan}
                    disabled={isProcessing || !selectedPlan}
                  >
                    {isProcessing ? 'Processing...' : 'Upgrade Plan'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Cancel Subscription Dialog */}
          {showCancelDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Cancel Subscription</CardTitle>
                  <CardDescription>
                    Are you sure you want to cancel your subscription?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
                    <Textarea
                      id="cancel-reason"
                      placeholder="Tell us why you're leaving..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cancel-confirm">
                      Type <strong>CANCEL_SUBSCRIPTION</strong> to confirm
                    </Label>
                    <Input
                      id="cancel-confirm"
                      placeholder="CANCEL_SUBSCRIPTION"
                      value={cancelConfirmation}
                      onChange={(e) => setCancelConfirmation(e.target.value)}
                    />
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      Your subscription will be cancelled immediately and you will lose access to all features.
                    </p>
                  </div>
                </CardContent>
                <div className="p-6 border-t flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCancelDialog(false);
                      setCancelReason('');
                      setCancelConfirmation('');
                    }}
                    disabled={isProcessing}
                  >
                    Keep Subscription
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={isProcessing || cancelConfirmation !== 'CANCEL_SUBSCRIPTION'}
                  >
                    {isProcessing ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Team Settings */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage your team members and their permissions
                  </CardDescription>
                </div>
                <Button className="gap-2" onClick={() => toast.info('Team invitation coming soon!')}>
                  <Users className="w-4 h-4" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getInitials(user?.name || accountInfo?.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{user?.name || accountInfo?.user?.name || 'Developer'}</p>
                      <p className="text-sm text-gray-500">{user?.email || accountInfo?.user?.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>Admin</Badge>
                    <span className="text-sm text-gray-500">You</span>
                  </div>
                </div>

                <div className="p-8 text-center border-2 border-dashed rounded-lg">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No team members yet</p>
                  <p className="text-sm text-gray-500 mb-4">Invite team members to collaborate on projects</p>
                  <Button variant="outline" onClick={() => toast.info('Team invitation coming soon!')}>
                    Invite Team Member
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

