import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Switch } from './ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Monitor,
  Smartphone,
  Shield,
  Activity,
  HelpCircle,
  Save,
  X,
  Upload,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  AlertCircle,
  CheckCircle,
  Building2,
  Users,
  Clock,
  Laptop,
  Tablet,
  Settings,
  Key,
  Download,
  FileText,
  MessageSquare,
  DollarSign,
  CreditCard,
  Receipt,
  Briefcase,
  Globe,
  Zap,
  Archive,
  ExternalLink,
  Crown,
  TrendingUp,
  PieChart,
  Plus,
  Copy,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getAccountInfo } from '../lib/api/auth';
import { updateCustomer } from '../lib/api/customers';

interface PropertyOwnerSettingsProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    avatar?: string;
    company?: string;
  };
  onBack: () => void;
  onSave: (updates: any) => void;
  onLogout: () => void;
}

export function PropertyOwnerSettings({ user, onBack, onSave, onLogout }: PropertyOwnerSettingsProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    address: '',
    timezone: 'America/Los_Angeles',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    avatar: user.avatar || null
  });

  // Company state
  const [companyData, setCompanyData] = useState({
    companyName: user.company || '',
    businessType: '',
    taxId: '',
    website: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    yearEstablished: '',
    licenseNumber: '',
    insuranceProvider: '',
    insurancePolicy: '',
    insuranceExpiration: '',
    industry: '',
    companySize: ''
  });

  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState({
    plan: 'Professional',
    status: 'active',
    billingCycle: 'monthly',
    nextBillingDate: '2024-04-01',
    amount: 750,
    properties: 12,
    units: 240,
    managers: 5,
    usageStats: {
      propertiesUsed: 8,
      unitsUsed: 182,
      managersUsed: 3,
      storageUsed: 2.4,
      storageLimit: 50
    }
  });

  // Fetch account data from database
  const fetchAccountData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      
      const response = await getAccountInfo();
      
      if (response.error) {
        if (!silent) toast.error('Failed to load account data');
        return;
      }

      if (response.data) {
        const { user: userData, customer } = response.data;
        setAccountInfo(response.data);

        // Update profile data
        setProfileData({
          name: customer?.owner || userData.name || user.name, // Use customer.owner as the Full Name
          email: customer?.email || userData.email || user.email, // Use customer.email
          phone: customer?.phone || '',
          address: customer ? `${customer.street || ''}, ${customer.city || ''}, ${customer.state || ''} ${customer.zipCode || ''}`.trim() : '',
          timezone: 'America/Los_Angeles',
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          avatar: user.avatar || null
        });

        // Update company data
        if (customer) {
          console.log('🔍 DEBUG - Customer data from API:', {
            taxId: customer.taxId,
            industry: customer.industry,
            company: customer.company
          });
          
          setCompanyData({
            companyName: customer.company || '',
            businessType: customer.industry || '', // Map to industry from customer database
            taxId: customer.taxId || '', // Already correctly mapped
            website: customer.website || '',
            businessAddress: `${customer.street || ''}, ${customer.city || ''}, ${customer.state || ''} ${customer.zipCode || ''}`.trim(),
            businessPhone: customer.phone || '',
            businessEmail: customer.email || '',
            yearEstablished: '',
            licenseNumber: '',
            insuranceProvider: '',
            insurancePolicy: '',
            insuranceExpiration: '',
            industry: customer.industry || '',
            companySize: customer.companySize || ''
          });
          
          console.log('✅ DEBUG - Company data set to:', {
            businessType: customer.industry || '',
            taxId: customer.taxId || ''
          });

          // Update subscription data
          setSubscriptionData({
            plan: customer.plan?.name || 'Professional',
            status: customer.status || 'active',
            billingCycle: customer.billingCycle || 'monthly',
            nextBillingDate: '2024-04-01',
            amount: customer.billingCycle === 'annual' 
              ? customer.plan?.annualPrice || 0 
              : customer.plan?.monthlyPrice || 0,
            properties: customer.propertyLimit || 0,
            units: customer.unitsCount || 0,
            managers: customer.userLimit || 0,
            usageStats: {
              propertiesUsed: customer.propertiesCount || 0,
              unitsUsed: customer.unitsCount || 0,
              managersUsed: 0,
              storageUsed: 0,
              storageLimit: customer.storageLimit || 0
            }
          });

          // Show notification if data was updated (only on silent refresh)
          if (silent && accountInfo && customer) {
            const oldCustomer = accountInfo.customer;
            if (oldCustomer) {
              if (oldCustomer.company !== customer.company) {
                toast.info('Company information has been updated');
              }
              if (oldCustomer.plan?.name !== customer.plan?.name) {
                toast.success(`Your plan has been updated to ${customer.plan?.name}!`);
              }
            }
          }
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('Error fetching account data:', error);
        toast.error('Failed to load account data');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAccountData();
  }, []);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      fetchAccountData(true); // Silent refresh
    }, 30000); // 30 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [accountInfo]);

  // Refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchAccountData(true); // Silent refresh
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [accountInfo]);

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: true,
    sessionTimeout: '60',
    passwordLastChanged: '2024-02-15',
    securityQuestions: true,
    loginAlerts: true,
    ipWhitelist: false
  });

  // Notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: {
      propertyAlerts: true,
      maintenanceRequests: true,
      tenantIssues: true,
      financialReports: true,
      leaseExpirations: true,
      paymentReminders: true,
      managerActivity: true,
      systemUpdates: false,
      weeklyDigest: true,
      monthlyReports: true
    },
    sms: {
      urgentMaintenance: true,
      paymentReceived: true,
      leaseExpirations: true,
      managerActivity: false,
      systemUpdates: false
    },
    push: {
      propertyAlerts: true,
      maintenanceRequests: true,
      tenantIssues: true,
      financialReports: true,
      systemUpdates: true
    }
  });

  // Display preferences
  const [displayPreferences, setDisplayPreferences] = useState({
    theme: 'light',
    compactMode: false,
    showPropertyImages: true,
    defaultView: 'cards',
    itemsPerPage: 25,
    dashboardLayout: 'default',
    chartType: 'line'
  });

  // Billing history
  const [billingHistory] = useState([
    {
      id: 'INV-2024-003',
      date: '2024-03-01',
      description: 'Professional Plan - Monthly',
      amount: 750,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2024-002',
      date: '2024-02-01',
      description: 'Professional Plan - Monthly',
      amount: 750,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2024-001',
      date: '2024-01-01',
      description: 'Professional Plan - Monthly',
      amount: 750,
      status: 'paid',
      downloadUrl: '#'
    }
  ]);

  // Payment methods
  const [paymentMethods] = useState([
    {
      id: 'PM001',
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      expiry: '12/2025',
      isDefault: true
    }
  ]);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Mock sessions data
  const [sessions] = useState([
    {
      id: 'SESSION001',
      device: 'Desktop',
      browser: 'Chrome 122',
      os: 'Windows 11',
      location: 'Metro City, CA',
      ipAddress: '192.168.1.100',
      lastActive: new Date().toISOString(),
      isCurrent: true
    },
    {
      id: 'SESSION002',
      device: 'Mobile',
      browser: 'Safari Mobile',
      os: 'iOS 17.3',
      location: 'Metro City, CA',
      ipAddress: '192.168.1.105',
      lastActive: new Date(Date.now() - 3600000).toISOString(),
      isCurrent: false
    }
  ]);

  // Mock activity log
  const [activityLog] = useState([
    {
      id: 'ACT001',
      action: 'Login',
      description: 'Logged in from Chrome on Windows',
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
      status: 'success'
    },
    {
      id: 'ACT002',
      action: 'Property Added',
      description: 'Added new property: Oak Street Condos',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      ipAddress: '192.168.1.100',
      status: 'success'
    },
    {
      id: 'ACT003',
      action: 'Manager Assigned',
      description: 'Assigned Sarah Johnson to Sunset Apartments',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      ipAddress: '192.168.1.100',
      status: 'success'
    },
    {
      id: 'ACT004',
      action: 'Subscription Updated',
      description: 'Upgraded to Professional plan',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      ipAddress: '192.168.1.100',
      status: 'success'
    }
  ]);

  // Handler functions
  const handleSaveProfile = async () => {
    if (!accountInfo?.customer?.id) {
      toast.error('Customer information not found');
      return;
    }

    try {
      setIsSaving(true);

      // Parse address if changed
      let addressParts = { street: '', city: '', state: '', zipCode: '' };
      if (profileData.address) {
        const parts = profileData.address.split(',').map(p => p.trim());
        addressParts.street = parts[0] || '';
        addressParts.city = parts[1] || '';
        const stateZip = parts[2]?.split(' ') || [];
        addressParts.state = stateZip[0] || '';
        addressParts.zipCode = stateZip[1] || '';
      }

      // Prepare update data based on current tab
      let updateData: any = {};
      
      if (activeTab === 'profile') {
        updateData = {
          owner: profileData.name,
          phone: profileData.phone,
          street: addressParts.street || accountInfo.customer.street,
          city: addressParts.city || accountInfo.customer.city,
          state: addressParts.state || accountInfo.customer.state,
          zipCode: addressParts.zipCode || accountInfo.customer.zipCode,
          country: accountInfo.customer.country || 'Nigeria'
        };
      } else if (activeTab === 'company') {
        // Parse company address if changed
        let companyAddressParts = { street: '', city: '', state: '', zipCode: '' };
        if (companyData.businessAddress) {
          const parts = companyData.businessAddress.split(',').map(p => p.trim());
          companyAddressParts.street = parts[0] || '';
          companyAddressParts.city = parts[1] || '';
          const stateZip = parts[2]?.split(' ') || [];
          companyAddressParts.state = stateZip[0] || '';
          companyAddressParts.zipCode = stateZip[1] || '';
        }

        updateData = {
          company: companyData.companyName,
          taxId: companyData.taxId,
          website: companyData.website,
          industry: companyData.industry,
          companySize: companyData.companySize,
          phone: companyData.businessPhone,
          email: companyData.businessEmail,
          street: companyAddressParts.street || accountInfo.customer.street,
          city: companyAddressParts.city || accountInfo.customer.city,
          state: companyAddressParts.state || accountInfo.customer.state,
          zipCode: companyAddressParts.zipCode || accountInfo.customer.zipCode,
          country: accountInfo.customer.country || 'Nigeria'
        };
      }

      // Call API to update customer
      const response = await updateCustomer(accountInfo.customer.id, updateData);

      if (response.error) {
        throw new Error(response.error.error || 'Failed to update information');
      }

      // Update was successful
      setIsEditing(false);
      setHasUnsavedChanges(false);
      toast.success(activeTab === 'profile' ? 'Profile updated successfully' : 'Company information updated successfully');
      
      // Refresh data from server
      await fetchAccountData(true);
      
      // Also notify parent component
      onSave(activeTab === 'profile' ? profileData : companyData);
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast.error(error.message || 'Failed to update information');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setHasUnsavedChanges(false);
    // Restore original data from accountInfo
    if (accountInfo?.customer) {
      const customer = accountInfo.customer;
      setProfileData({
        name: accountInfo.user?.name || user.name,
        email: accountInfo.user?.email || user.email,
        phone: customer.phone || '',
        address: `${customer.street || ''}, ${customer.city || ''}, ${customer.state || ''} ${customer.zipCode || ''}`.trim(),
        timezone: 'America/Los_Angeles',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        avatar: user.avatar || null
      });
      setCompanyData({
        companyName: customer.company || '',
        businessType: '',
        taxId: customer.taxId || '',
        website: customer.website || '',
        businessAddress: `${customer.street || ''}, ${customer.city || ''}, ${customer.state || ''} ${customer.zipCode || ''}`.trim(),
        businessPhone: customer.phone || '',
        businessEmail: customer.email || '',
        yearEstablished: '',
        licenseNumber: '',
        insuranceProvider: '',
        insurancePolicy: '',
        insuranceExpiration: '',
        industry: customer.industry || '',
        companySize: customer.companySize || ''
      });
    }
    toast.info('Changes discarded');
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setShowPasswordDialog(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast.success('Password changed successfully');
  };

  const handleExportData = () => {
    toast.success('Data export started. You will receive an email when ready.');
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion requested. Please contact support.');
    setShowDeleteDialog(false);
  };

  const getDeviceIcon = (device: string) => {
    if (device === 'Desktop') return Laptop;
    if (device === 'Mobile') return Smartphone;
    return Tablet;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button + Title */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">
                  Manage your account, company, and preferences
                </p>
              </div>
            </div>

            {/* Right: Save/Cancel */}
            {isEditing && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading account information...</p>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('company')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'company'
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                    <span>Company</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('subscription')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'subscription'
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Crown className="h-5 w-5" />
                    <span>Subscription</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('billing')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'billing'
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Billing</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('payment-gateway')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'payment-gateway'
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span>Payment Gateway</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'security'
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Lock className="h-5 w-5" />
                    <span>Security</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'notifications'
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('display')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'display'
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Monitor className="h-5 w-5" />
                    <span>Display</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('sessions')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'sessions'
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Smartphone className="h-5 w-5" />
                    <span>Sessions</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'activity'
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Activity className="h-5 w-5" />
                    <span>Activity</span>
                  </button>

                  <Separator className="my-2" />

                  <button
                    onClick={() => setActiveTab('help')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'help'
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <HelpCircle className="h-5 w-5" />
                    <span>Help & Support</span>
                  </button>
                </nav>
              </CardContent>
            </Card>

            {/* Plan Badge */}
            <Card className="mt-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Crown className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      {subscriptionData.plan} Plan
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      ${subscriptionData.amount}/month
                    </p>
                    <Button variant="link" className="h-auto p-0 text-xs text-blue-600 mt-2">
                      Upgrade Plan →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <ProfileSection 
                profileData={profileData}
                setProfileData={setProfileData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                setHasUnsavedChanges={setHasUnsavedChanges}
                user={user}
              />
            )}

            {activeTab === 'company' && (
              <CompanySection
                companyData={companyData}
                setCompanyData={setCompanyData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                setHasUnsavedChanges={setHasUnsavedChanges}
              />
            )}

            {activeTab === 'subscription' && (
              <SubscriptionSection subscriptionData={subscriptionData} />
            )}

            {activeTab === 'billing' && (
              <BillingSection 
                billingHistory={billingHistory}
                paymentMethods={paymentMethods}
              />
            )}

            {activeTab === 'payment-gateway' && (
              <PaymentGatewaySection />
            )}

            {activeTab === 'security' && (
              <SecuritySection
                securitySettings={securitySettings}
                setSecuritySettings={setSecuritySettings}
                setShowPasswordDialog={setShowPasswordDialog}
                handleExportData={handleExportData}
                setShowDeleteDialog={setShowDeleteDialog}
                formatDate={formatDate}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsSection
                notificationPreferences={notificationPreferences}
                setNotificationPreferences={setNotificationPreferences}
              />
            )}

            {activeTab === 'display' && (
              <DisplaySection
                displayPreferences={displayPreferences}
                setDisplayPreferences={setDisplayPreferences}
              />
            )}

            {activeTab === 'sessions' && (
              <SessionsSection sessions={sessions} getDeviceIcon={getDeviceIcon} formatTime={formatTime} />
            )}

            {activeTab === 'activity' && (
              <ActivitySection activityLog={activityLog} formatTime={formatTime} />
            )}

            {activeTab === 'help' && <HelpSection />}
          </div>
        </div>
        )}
      </main>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords(prev => ({ ...prev, current: !prev.current }))
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords(prev => ({ ...prev, new: !prev.new }))
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange}>
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="mb-1">Warning:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All your properties and units will be deleted</li>
                    <li>All managers and tenants will lose access</li>
                    <li>All financial data will be permanently removed</li>
                    <li>This action cannot be reversed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Profile Section Component
function ProfileSection({ profileData, setProfileData, isEditing, setIsEditing, setHasUnsavedChanges, user }: any) {
  const updateFormData = (field: string, value: any) => {
    setProfileData((prev: any) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileData.avatar} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                {profileData.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Profile Picture</h3>
              <p className="text-sm text-gray-500 mb-3">
                JPG, PNG or GIF. Max size 2MB.
              </p>
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600">
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Profile Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={profileData.timezone}
                onValueChange={(value) => updateFormData('timezone', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={profileData.language}
                onValueChange={(value) => updateFormData('language', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Account Info */}
          <Separator />
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm font-medium text-gray-900">Property Owner</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">January 2024</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Company Section Component
function CompanySection({ companyData, setCompanyData, isEditing, setIsEditing, setHasUnsavedChanges }: any) {
  const updateFormData = (field: string, value: any) => {
    setCompanyData((prev: any) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Manage your business details and documentation
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                Edit Company
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Company Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyData.companyName}
                onChange={(e) => updateFormData('companyName', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                value={companyData.businessType}
                onValueChange={(value) => updateFormData('businessType', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LLC">LLC</SelectItem>
                  <SelectItem value="Corporation">Corporation</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID (EIN)</Label>
              <Input
                id="taxId"
                value={companyData.taxId}
                onChange={(e) => updateFormData('taxId', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearEstablished">Year Established</Label>
              <Input
                id="yearEstablished"
                value={companyData.yearEstablished}
                onChange={(e) => updateFormData('yearEstablished', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  value={companyData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={companyData.licenseNumber}
                onChange={(e) => updateFormData('licenseNumber', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Business Contact</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessPhone"
                    value={companyData.businessPhone}
                    onChange={(e) => updateFormData('businessPhone', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessEmail"
                    value={companyData.businessEmail}
                    onChange={(e) => updateFormData('businessEmail', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="businessAddress">Business Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessAddress"
                    value={companyData.businessAddress}
                    onChange={(e) => updateFormData('businessAddress', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Insurance Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Insurance Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                <Input
                  id="insuranceProvider"
                  value={companyData.insuranceProvider}
                  onChange={(e) => updateFormData('insuranceProvider', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurancePolicy">Policy Number</Label>
                <Input
                  id="insurancePolicy"
                  value={companyData.insurancePolicy}
                  onChange={(e) => updateFormData('insurancePolicy', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceExpiration">Expiration Date</Label>
                <Input
                  id="insuranceExpiration"
                  type="date"
                  value={companyData.insuranceExpiration}
                  onChange={(e) => updateFormData('insuranceExpiration', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Subscription Section Component
function SubscriptionSection({ subscriptionData }: any) {
  return (
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
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                ${subscriptionData.amount}/month • Billed {subscriptionData.billingCycle}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Next billing date: {subscriptionData.nextBillingDate}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button>Upgrade Plan</Button>
              <Button variant="outline">Change Billing</Button>
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
                    {subscriptionData.usageStats.propertiesUsed} / {subscriptionData.properties}
                  </span>
                </div>
                <Progress 
                  value={(subscriptionData.usageStats.propertiesUsed / subscriptionData.properties) * 100} 
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Units</span>
                  <span className="text-gray-900">
                    {subscriptionData.usageStats.unitsUsed} / {subscriptionData.units}
                  </span>
                </div>
                <Progress 
                  value={(subscriptionData.usageStats.unitsUsed / subscriptionData.units) * 100} 
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Property Managers</span>
                  <span className="text-gray-900">
                    {subscriptionData.usageStats.managersUsed} / {subscriptionData.managers}
                  </span>
                </div>
                <Progress 
                  value={(subscriptionData.usageStats.managersUsed / subscriptionData.managers) * 100} 
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Storage</span>
                  <span className="text-gray-900">
                    {subscriptionData.usageStats.storageUsed} GB / {subscriptionData.usageStats.storageLimit} GB
                  </span>
                </div>
                <Progress 
                  value={(subscriptionData.usageStats.storageUsed / subscriptionData.usageStats.storageLimit) * 100} 
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
          <div className="grid md:grid-cols-3 gap-4">
            {/* Starter Plan */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Starter</h4>
              <p className="text-gray-600 text-sm mb-4">For small property owners</p>
              <p className="text-gray-900 text-2xl font-bold mb-4">$299<span className="text-sm font-normal text-gray-600">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Up to 3 properties
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  75 units
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  2 managers
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled>Downgrade</Button>
            </div>

            {/* Professional Plan */}
            <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50 relative">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600">
                Current
              </Badge>
              <h4 className="font-semibold mb-2">Professional</h4>
              <p className="text-gray-600 text-sm mb-4">For growing portfolios</p>
              <p className="text-gray-900 text-2xl font-bold mb-4">$750<span className="text-sm font-normal text-gray-600">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  Up to 12 properties
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  240 units
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  5 managers
                </li>
              </ul>
              <Button className="w-full" disabled>Current Plan</Button>
            </div>

            {/* Enterprise Plan */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Enterprise</h4>
              <p className="text-gray-600 text-sm mb-4">For large portfolios</p>
              <p className="text-gray-900 text-2xl font-bold mb-4">$2,500<span className="text-sm font-normal text-gray-600">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Unlimited properties
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Unlimited units
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Unlimited managers
                </li>
              </ul>
              <Button className="w-full">Upgrade</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Billing Section Component
function BillingSection({ billingHistory, paymentMethods }: any) {
  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethods.map((method: any) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {method.brand} •••• {method.last4}
                    </p>
                    <p className="text-sm text-gray-600">Expires {method.expiry}</p>
                  </div>
                  {method.isDefault && (
                    <Badge variant="outline">Default</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-600">Remove</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View and download your invoices
              </CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingHistory.map((invoice: any) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>${invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Security Section Component
function SecuritySection({ securitySettings, setSecuritySettings, setShowPasswordDialog, handleExportData, setShowDeleteDialog, formatDate }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Manage your password and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Password</h4>
              <p className="text-sm text-gray-600">
                Last changed on {formatDate(securitySettings.passwordLastChanged)}
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </div>

          <Separator />

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={securitySettings.twoFactorEnabled}
              onCheckedChange={(checked) =>
                setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })
              }
            />
          </div>

          <Separator />

          {/* Login Alerts */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Login Alerts</h4>
              <p className="text-sm text-gray-600">
                Get notified about new login attempts
              </p>
            </div>
            <Switch
              checked={securitySettings.loginAlerts}
              onCheckedChange={(checked) =>
                setSecuritySettings({ ...securitySettings, loginAlerts: checked })
              }
            />
          </div>

          <Separator />

          {/* Session Timeout */}
          <div>
            <Label>Session Timeout</Label>
            <Select
              value={securitySettings.sessionTimeout}
              onValueChange={(value) =>
                setSecuritySettings({ ...securitySettings, sessionTimeout: value })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-semibold text-gray-900">Export Your Data</h4>
                <p className="text-sm text-gray-600">Download a copy of your data</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-semibold text-red-900">Delete Account</h4>
                <p className="text-sm text-red-700">Permanently delete your account and data</p>
              </div>
            </div>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Notifications Section Component
function NotificationsSection({ notificationPreferences, setNotificationPreferences }: any) {
  const updatePreference = (channel: string, setting: string, value: boolean) => {
    setNotificationPreferences({
      ...notificationPreferences,
      [channel]: {
        ...notificationPreferences[channel],
        [setting]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <div>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what email updates you want to receive
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notificationPreferences.email).map(([key, value]: [string, any]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={`email-${key}`} className="cursor-pointer">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </Label>
              <Switch
                id={`email-${key}`}
                checked={value}
                onCheckedChange={(checked) => updatePreference('email', key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <div>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>
                Receive important alerts via text message
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notificationPreferences.sms).map(([key, value]: [string, any]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={`sms-${key}`} className="cursor-pointer">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </Label>
              <Switch
                id={`sms-${key}`}
                checked={value}
                onCheckedChange={(checked) => updatePreference('sms', key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <div>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Real-time notifications in your browser
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notificationPreferences.push).map(([key, value]: [string, any]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={`push-${key}`} className="cursor-pointer">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </Label>
              <Switch
                id={`push-${key}`}
                checked={value}
                onCheckedChange={(checked) => updatePreference('push', key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Display Section Component
function DisplaySection({ displayPreferences, setDisplayPreferences }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
          <CardDescription>
            Customize how you view and interact with the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={displayPreferences.theme}
              onValueChange={(value) =>
                setDisplayPreferences({ ...displayPreferences, theme: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto (System)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Default Property View</Label>
            <Select
              value={displayPreferences.defaultView}
              onValueChange={(value) =>
                setDisplayPreferences({ ...displayPreferences, defaultView: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cards">Cards</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Items Per Page</Label>
            <Select
              value={displayPreferences.itemsPerPage.toString()}
              onValueChange={(value) =>
                setDisplayPreferences({ ...displayPreferences, itemsPerPage: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Compact Mode</h4>
              <p className="text-sm text-gray-600">
                Show more content in less space
              </p>
            </div>
            <Switch
              checked={displayPreferences.compactMode}
              onCheckedChange={(checked) =>
                setDisplayPreferences({ ...displayPreferences, compactMode: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Show Property Images</h4>
              <p className="text-sm text-gray-600">
                Display property images in listings
              </p>
            </div>
            <Switch
              checked={displayPreferences.showPropertyImages}
              onCheckedChange={(checked) =>
                setDisplayPreferences({ ...displayPreferences, showPropertyImages: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sessions Section Component
function SessionsSection({ sessions, getDeviceIcon, formatTime }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions and devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session: any) => {
              const DeviceIcon = getDeviceIcon(session.device);
              return (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <DeviceIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{session.device}</p>
                        {session.isCurrent && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {session.browser} • {session.os}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.location} • {session.ipAddress}
                      </p>
                      <p className="text-xs text-gray-400">
                        Last active: {formatTime(session.lastActive)}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button variant="ghost" size="sm" className="text-red-600">
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <Button variant="outline" className="w-full mt-4">
            Revoke All Other Sessions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Activity Section Component
function ActivitySection({ activityLog, formatTime }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Recent activity on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityLog.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{formatTime(activity.timestamp)}</span>
                    <span>IP: {activity.ipAddress}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Payment Gateway Section Component
function PaymentGatewaySection() {
  const [paymentGateways, setPaymentGateways] = useState([
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept credit cards, debit cards, and digital wallets',
      logo: '💳',
      enabled: true,
      connected: true,
      apiKey: 'sk_test_*********************',
      publishableKey: 'pk_test_*********************',
      webhookUrl: 'https://propertyhub.com/webhook/stripe',
      testMode: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Accept PayPal and major credit cards',
      logo: '🅿️',
      enabled: false,
      connected: false,
      clientId: '',
      clientSecret: '',
      webhookUrl: 'https://propertyhub.com/webhook/paypal',
      testMode: false
    },
    {
      id: 'square',
      name: 'Square',
      description: 'Accept payments with Square',
      logo: '🟦',
      enabled: false,
      connected: false,
      applicationId: '',
      accessToken: '',
      webhookUrl: 'https://propertyhub.com/webhook/square',
      testMode: false
    },
    {
      id: 'paystack',
      name: 'Paystack',
      description: 'Accept payments in Nigeria and other African countries',
      logo: '💚',
      enabled: false,
      connected: false,
      publicKey: '',
      secretKey: '',
      webhookUrl: 'https://propertyhub.com/webhook/paystack',
      testMode: false
    }
  ]);

  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState<any>({});

  const handleConnectGateway = (gatewayId: string) => {
    const gateway = paymentGateways.find(g => g.id === gatewayId);
    if (gateway) {
      setSelectedGateway(gatewayId);
      setGatewayConfig(gateway);
      setShowConfigDialog(true);
    }
  };

  const handleSaveGatewayConfig = () => {
    setPaymentGateways(prev =>
      prev.map(g =>
        g.id === selectedGateway
          ? { ...g, ...gatewayConfig, connected: true }
          : g
      )
    );
    setShowConfigDialog(false);
    toast.success(`${gatewayConfig.name} configured successfully`);
  };

  const handleToggleGateway = (gatewayId: string, enabled: boolean) => {
    setPaymentGateways(prev =>
      prev.map(g => (g.id === gatewayId ? { ...g, enabled } : g))
    );
    toast.success(enabled ? 'Payment gateway enabled' : 'Payment gateway disabled');
  };

  const handleDisconnectGateway = (gatewayId: string) => {
    setPaymentGateways(prev =>
      prev.map(g => (g.id === gatewayId ? { ...g, connected: false, enabled: false } : g))
    );
    toast.success('Payment gateway disconnected');
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Payment Gateway Configuration</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure payment gateways to accept rent payments from tenants. These settings apply to all properties you own and will be used by property managers to process payments.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">{paymentGateways.filter(g => g.connected).length} Connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">{paymentGateways.filter(g => g.enabled).length} Active</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateways List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Payment Gateways</CardTitle>
          <CardDescription>
            Connect and configure payment processors for your properties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentGateways.map((gateway) => (
            <div
              key={gateway.id}
              className={`p-4 border rounded-lg ${
                gateway.connected ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-3xl">{gateway.logo}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{gateway.name}</h4>
                      {gateway.connected && (
                        <Badge className="bg-green-100 text-green-700">Connected</Badge>
                      )}
                      {gateway.testMode && gateway.connected && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Test Mode
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{gateway.description}</p>
                    
                    {gateway.connected && (
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <Key className="h-3 w-3" />
                          <span className="font-mono">API Key: {gateway.apiKey || gateway.publicKey || '••••••••'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          <span>Webhook: {gateway.webhookUrl}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {gateway.connected ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${gateway.id}-toggle`} className="text-sm">
                          {gateway.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                          id={`${gateway.id}-toggle`}
                          checked={gateway.enabled}
                          onCheckedChange={(checked) => handleToggleGateway(gateway.id, checked)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnectGateway(gateway.id)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDisconnectGateway(gateway.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button onClick={() => handleConnectGateway(gateway.id)}>
                      <Zap className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Configure general payment preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Auto-capture Payments</h4>
              <p className="text-sm text-gray-600">
                Automatically capture authorized payments
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Send Payment Receipts</h4>
              <p className="text-sm text-gray-600">
                Automatically email receipts to tenants
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Default Currency</Label>
            <Select defaultValue="NGN">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="GBP">British Pound (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Late Payment Fee</Label>
            <div className="flex gap-2">
              <Input type="number" defaultValue="5" className="w-24" />
              <Select defaultValue="percentage">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">% of rent</SelectItem>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">
              Additional fee charged for late payments
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure {gatewayConfig.name}</DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect {gatewayConfig.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedGateway === 'stripe' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="publishableKey">Publishable Key</Label>
                  <Input
                    id="publishableKey"
                    value={gatewayConfig.publishableKey || ''}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, publishableKey: e.target.value })
                    }
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    value={gatewayConfig.apiKey || ''}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, apiKey: e.target.value })
                    }
                    placeholder="sk_test_..."
                  />
                </div>
              </>
            )}

            {selectedGateway === 'paypal' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={gatewayConfig.clientId || ''}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, clientId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={gatewayConfig.clientSecret || ''}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, clientSecret: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {selectedGateway === 'square' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="applicationId">Application ID</Label>
                  <Input
                    id="applicationId"
                    value={gatewayConfig.applicationId || ''}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, applicationId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={gatewayConfig.accessToken || ''}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, accessToken: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {selectedGateway === 'paystack' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="publicKey">Public Key</Label>
                  <Input
                    id="publicKey"
                    value={gatewayConfig.publicKey || ''}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, publicKey: e.target.value })
                    }
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    value={gatewayConfig.secretKey || ''}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, secretKey: e.target.value })
                    }
                    placeholder="sk_test_..."
                  />
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webhookUrl"
                  value={gatewayConfig.webhookUrl || ''}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(gatewayConfig.webhookUrl);
                    toast.success('Webhook URL copied to clipboard');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Add this webhook URL to your {gatewayConfig.name} dashboard
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Test Mode</p>
                  <p className="text-xs text-orange-700">Use test API keys for testing</p>
                </div>
              </div>
              <Switch
                checked={gatewayConfig.testMode || false}
                onCheckedChange={(checked) =>
                  setGatewayConfig({ ...gatewayConfig, testMode: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGatewayConfig}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Help Section Component
function HelpSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
          <CardDescription>
            Get help and learn more about PropertyHub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col items-start">
              <FileText className="h-6 w-6 mb-2" />
              <h4 className="font-semibold mb-1">Documentation</h4>
              <p className="text-xs text-gray-600">Browse our guides and tutorials</p>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col items-start">
              <MessageSquare className="h-6 w-6 mb-2" />
              <h4 className="font-semibold mb-1">Contact Support</h4>
              <p className="text-xs text-gray-600">Get help from our team</p>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col items-start">
              <HelpCircle className="h-6 w-6 mb-2" />
              <h4 className="font-semibold mb-1">FAQ</h4>
              <p className="text-xs text-gray-600">Find answers to common questions</p>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col items-start">
              <ExternalLink className="h-6 w-6 mb-2" />
              <h4 className="font-semibold mb-1">Community Forum</h4>
              <p className="text-xs text-gray-600">Connect with other users</p>
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Quick Links</h4>
            <div className="space-y-2">
              <Button variant="link" className="h-auto p-0 justify-start">
                Getting Started Guide →
              </Button>
              <Button variant="link" className="h-auto p-0 justify-start">
                Video Tutorials →
              </Button>
              <Button variant="link" className="h-auto p-0 justify-start">
                API Documentation →
              </Button>
              <Button variant="link" className="h-auto p-0 justify-start">
                Release Notes →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

