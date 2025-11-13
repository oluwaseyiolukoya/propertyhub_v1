import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import {
  Settings,
  Shield,
  Users,
  Key,
  Bell,
  CreditCard,
  Server,
  FileText,
  Globe,
  Database,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  Zap,
  Building2,
  Network,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
  CheckCircle,
  Info,
  Copy,
  RotateCcw,
  Calendar,
  Clock,
  Target,
  Monitor,
  HardDrive,
  Activity,
  Webhook,
  Crown,
  Banknote,
  Receipt,
  Calculator,
  Filter,
  Archive,
  Scale,
  AlertCircle
} from 'lucide-react';

export function PlatformSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [settings, setSettings] = useState({
    general: {
      platformName: 'Contrezz',
      platformUrl: 'https://contrezz.com',
      supportEmail: 'support@contrezz.com',
      timezone: 'UTC-8',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      language: 'English',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
      logoUrl: null as string | null,
      faviconUrl: null as string | null
    },
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      username: 'noreply@contrezz.com',
      password: '••••••••••••',
      encryption: 'TLS',
      fromEmail: 'noreply@contrezz.com',
      fromName: 'Contrezz',
      isConnected: true
    },
    security: {
      enforceSSL: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      twoFactorAuth: true,
      apiRateLimit: 1000,
      ipWhitelist: '',
      dataRetention: 365
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      maintenanceAlerts: true,
      billingAlerts: true,
      securityAlerts: true,
      systemUpdates: true,
      marketingEmails: false
    },
    billing: {
      paymentProcessor: 'stripe',
      webhookUrl: 'https://api.contrezz.com/webhooks/stripe',
      taxCalculation: true,
      invoiceTemplate: 'default',
      paymentMethods: ['card', 'ach', 'wire'],
      gracePeriod: 7,
      autoSuspend: true,
      prorationEnabled: true
    }
  });

  const integrations = [
    {
      id: 1,
      name: 'Stripe Payment Gateway',
      type: 'payment',
      status: 'connected',
      lastSync: '2024-03-21T14:30:00Z',
      webhookUrl: 'https://api.contrezz.com/webhooks/stripe',
      apiVersion: 'v2024-02-15'
    },
    {
      id: 2,
      name: 'Kisi Access Control',
      type: 'access-control',
      status: 'connected',
      lastSync: '2024-03-21T12:15:00Z',
      webhookUrl: 'https://api.contrezz.com/webhooks/kisi',
      apiVersion: 'v2.0'
    },
    {
      id: 3,
      name: 'Brivo Access Control',
      type: 'access-control',
      status: 'disconnected',
      lastSync: null,
      webhookUrl: '',
      apiVersion: 'v1.0'
    },
    {
      id: 4,
      name: 'SendGrid Email Service',
      type: 'communication',
      status: 'connected',
      lastSync: '2024-03-21T15:45:00Z',
      webhookUrl: 'https://api.contrezz.com/webhooks/sendgrid',
      apiVersion: 'v3'
    },
    {
      id: 5,
      name: 'Twilio SMS Service',
      type: 'communication',
      status: 'pending',
      lastSync: null,
      webhookUrl: 'https://api.contrezz.com/webhooks/twilio',
      apiVersion: 'v2010-04-01'
    }
  ];

  const userRoles = [
    {
      id: 1,
      name: 'Super Admin',
      description: 'Full system access and configuration',
      permissions: ['all'],
      userCount: 2,
      canDelete: false
    },
    {
      id: 2,
      name: 'Property Owner',
      description: 'Manage owned properties and tenants',
      permissions: ['view_properties', 'manage_tenants', 'view_reports', 'manage_payments'],
      userCount: 156,
      canDelete: false
    },
    {
      id: 3,
      name: 'Property Manager',
      description: 'Day-to-day property management operations',
      permissions: ['manage_properties', 'manage_tenants', 'handle_maintenance', 'process_payments'],
      userCount: 89,
      canDelete: false
    },
    {
      id: 4,
      name: 'Tenant',
      description: 'Access to tenant portal and services',
      permissions: ['view_lease', 'make_payments', 'submit_maintenance', 'update_profile'],
      userCount: 2847,
      canDelete: false
    },
    {
      id: 5,
      name: 'Maintenance Staff',
      description: 'Handle maintenance requests and scheduling',
      permissions: ['view_maintenance', 'update_maintenance', 'schedule_appointments'],
      userCount: 45,
      canDelete: true
    }
  ];

  const systemMetrics = {
    uptime: 99.97,
    activeUsers: 2847,
    apiCalls: 45672,
    storageUsed: 2.3,
    bandwidthUsed: 1.8,
    databaseSize: 4.2,
    lastBackup: '2024-03-21T02:00:00Z',
    nextMaintenance: '2024-03-25T02:00:00Z'
  };

  const auditLogs = [
    {
      id: 1,
      action: 'Settings Updated',
      user: 'admin@contrezz.com',
      timestamp: '2024-03-21T14:30:00Z',
      details: 'Updated payment processor configuration',
      ipAddress: '192.168.1.100'
    },
    {
      id: 2,
      action: 'User Role Modified',
      user: 'admin@contrezz.com',
      timestamp: '2024-03-21T13:15:00Z',
      details: 'Added new permission to Property Manager role',
      ipAddress: '192.168.1.100'
    },
    {
      id: 3,
      action: 'Integration Configured',
      user: 'admin@contrezz.com',
      timestamp: '2024-03-21T12:00:00Z',
      details: 'Connected new Stripe webhook endpoint',
      ipAddress: '192.168.1.100'
    }
  ];

  const availablePermissions = [
    { id: 'view_properties', name: 'View Properties', category: 'Properties' },
    { id: 'manage_properties', name: 'Manage Properties', category: 'Properties' },
    { id: 'delete_properties', name: 'Delete Properties', category: 'Properties' },
    { id: 'view_tenants', name: 'View Tenants', category: 'Tenants' },
    { id: 'manage_tenants', name: 'Manage Tenants', category: 'Tenants' },
    { id: 'view_payments', name: 'View Payments', category: 'Payments' },
    { id: 'manage_payments', name: 'Manage Payments', category: 'Payments' },
    { id: 'process_payments', name: 'Process Payments', category: 'Payments' },
    { id: 'view_reports', name: 'View Reports', category: 'Reports' },
    { id: 'generate_reports', name: 'Generate Reports', category: 'Reports' },
    { id: 'view_maintenance', name: 'View Maintenance', category: 'Maintenance' },
    { id: 'handle_maintenance', name: 'Handle Maintenance', category: 'Maintenance' },
    { id: 'manage_users', name: 'Manage Users', category: 'Users' },
    { id: 'manage_roles', name: 'Manage Roles', category: 'Users' },
    { id: 'view_settings', name: 'View Settings', category: 'Settings' },
    { id: 'manage_settings', name: 'Manage Settings', category: 'Settings' }
  ];

  // Load branding on component mount
  React.useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      // Try multiple token sources (auth_token is the correct key used by the app)
      const token = localStorage.getItem('auth_token') ||
                    localStorage.getItem('token') ||
                    localStorage.getItem('admin_token') ||
                    sessionStorage.getItem('auth_token') ||
                    sessionStorage.getItem('token') ||
                    sessionStorage.getItem('admin_token');

      if (!token) {
        console.log('No authentication token found for loading branding');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      // Load logo
      const logoResponse = await fetch('http://localhost:5000/api/system/settings/platform_logo_url', { headers });
      if (logoResponse.ok) {
        const logoData = await logoResponse.json();
        if (logoData.value) {
          setSettings(prev => ({
            ...prev,
            general: { ...prev.general, logoUrl: `http://localhost:5000${logoData.value}` }
          }));
        }
      }

      // Load favicon
      const faviconResponse = await fetch('http://localhost:5000/api/system/settings/platform_favicon_url', { headers });
      if (faviconResponse.ok) {
        const faviconData = await faviconResponse.json();
        if (faviconData.value) {
          setSettings(prev => ({
            ...prev,
            general: { ...prev.general, faviconUrl: `http://localhost:5000${faviconData.value}` }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load branding:', error);
    }
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      // Try multiple token sources (auth_token is the correct key used by the app)
      const token = localStorage.getItem('auth_token') ||
                    localStorage.getItem('token') ||
                    localStorage.getItem('admin_token') ||
                    sessionStorage.getItem('auth_token') ||
                    sessionStorage.getItem('token') ||
                    sessionStorage.getItem('admin_token');

      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      console.log('Uploading logo with token:', token.substring(0, 20) + '...');

      const response = await fetch('http://localhost:5000/api/system/settings/upload-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          general: { ...prev.general, logoUrl: `http://localhost:5000${data.url}` }
        }));
        toast.success('Logo uploaded successfully');
        // Trigger a page reload to update logo across all components
        window.location.reload();
      } else {
        const error = await response.json();
        console.error('Upload error:', error);
        toast.error(error.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    }
  };

  const handleFaviconUpload = async (file: File | undefined) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('favicon', file);

    try {
      // Try multiple token sources (auth_token is the correct key used by the app)
      const token = localStorage.getItem('auth_token') ||
                    localStorage.getItem('token') ||
                    localStorage.getItem('admin_token') ||
                    sessionStorage.getItem('auth_token') ||
                    sessionStorage.getItem('token') ||
                    sessionStorage.getItem('admin_token');

      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/system/settings/upload-favicon', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          general: { ...prev.general, faviconUrl: `http://localhost:5000${data.url}` }
        }));
        toast.success('Favicon uploaded successfully');
        // Update favicon immediately with cache-busting
        updateFavicon(`http://localhost:5000${data.url}?cb=${Date.now()}`);
      } else {
        const error = await response.json();
        console.error('Upload error:', error);
        toast.error(error.error || 'Failed to upload favicon');
      }
    } catch (error) {
      console.error('Favicon upload error:', error);
      toast.error('Failed to upload favicon');
    }
  };

  const handleRemoveLogo = async () => {
    try {
      // Try multiple token sources (auth_token is the correct key used by the app)
      const token = localStorage.getItem('auth_token') ||
                    localStorage.getItem('token') ||
                    localStorage.getItem('admin_token') ||
                    sessionStorage.getItem('auth_token') ||
                    sessionStorage.getItem('token') ||
                    sessionStorage.getItem('admin_token');

      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/system/settings/logo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          general: { ...prev.general, logoUrl: null }
        }));
        toast.success('Logo removed successfully');
        // Trigger a page reload to update logo across all components
        window.location.reload();
      } else {
        const error = await response.json();
        console.error('Remove error:', error);
        toast.error(error.error || 'Failed to remove logo');
      }
    } catch (error) {
      console.error('Logo removal error:', error);
      toast.error('Failed to remove logo');
    }
  };

  const handleRemoveFavicon = async () => {
    try {
      // Try multiple token sources (auth_token is the correct key used by the app)
      const token = localStorage.getItem('auth_token') ||
                    localStorage.getItem('token') ||
                    localStorage.getItem('admin_token') ||
                    sessionStorage.getItem('auth_token') ||
                    sessionStorage.getItem('token') ||
                    sessionStorage.getItem('admin_token');

      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/system/settings/favicon', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          general: { ...prev.general, faviconUrl: null }
        }));
        toast.success('Favicon removed successfully');
        // Reset to default favicon with cache-busting to force refresh
        updateFavicon(`/favicon.ico?cb=${Date.now()}`);
      } else {
        const error = await response.json();
        console.error('Remove error:', error);
        toast.error(error.error || 'Failed to remove favicon');
      }
    } catch (error) {
      console.error('Favicon removal error:', error);
      toast.error('Failed to remove favicon');
    }
  };

  const updateFavicon = (url: string) => {
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());

    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = url;
    document.head.appendChild(link);
  };

  const handleSaveSettings = (category: string) => {
    toast.success(`${category} settings saved successfully`);
  };

  const handleAddRole = () => {
    if (!newRole.name.trim()) {
      toast.error('Please enter a role name');
      return;
    }
    if (!newRole.description.trim()) {
      toast.error('Please enter a role description');
      return;
    }
    if (newRole.permissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    toast.success(`Role "${newRole.name}" created successfully`);
    setShowAddRoleDialog(false);
    setNewRole({ name: '', description: '', permissions: [] });
  };

  const togglePermission = (permissionId: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return 'default';
      case 'disconnected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'access-control':
        return <Key className="h-4 w-4" />;
      case 'communication':
        return <Mail className="h-4 w-4" />;
      default:
        return <Network className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
          <p className="text-gray-600">Configure and manage platform-wide settings</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Config
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Platform Settings</CardTitle>
              <CardDescription>Basic platform configuration and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="platform-name">Platform Name</Label>
                    <Input
                      id="platform-name"
                      value={settings.general.platformName}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, platformName: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="platform-url">Platform URL</Label>
                    <Input
                      id="platform-url"
                      value={settings.general.platformUrl}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, platformUrl: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, supportEmail: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone">Default Timezone</Label>
                    <Select value={settings.general.timezone} onValueChange={(value) =>
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, timezone: value }
                      }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                        <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                        <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                        <SelectItem value="UTC+0">UTC</SelectItem>
                        <SelectItem value="UTC+1">Central European Time (UTC+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select value={settings.general.dateFormat} onValueChange={(value) =>
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, dateFormat: value }
                      }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={settings.general.currency} onValueChange={(value) =>
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, currency: value }
                      }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                        <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                        <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Default Language</Label>
                    <Select value={settings.general.language} onValueChange={(value) =>
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, language: value }
                      }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Platform Branding</h4>
                <p className="text-sm text-gray-600">Customize your platform's logo and favicon</p>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Logo Upload */}
                  <div className="space-y-3">
                    <Label>Platform Logo</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {settings.general.logoUrl ? (
                        <div className="space-y-3">
                          <img
                            src={settings.general.logoUrl}
                            alt="Platform Logo"
                            className="h-16 mx-auto object-contain"
                          />
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/svg+xml,image/png,image/jpeg,image/jpg,image/webp';
                                input.onchange = (e) => handleLogoUpload((e.target as HTMLInputElement).files?.[0]);
                                input.click();
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Change
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveLogo}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="h-12 w-12 mx-auto text-gray-400" />
                          <div>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/svg+xml,image/png,image/jpeg,image/jpg,image/webp';
                                input.onchange = (e) => handleLogoUpload((e.target as HTMLInputElement).files?.[0]);
                                input.click();
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            SVG, PNG, JPG, JPEG, or WEBP (max 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Favicon Upload */}
                  <div className="space-y-3">
                    <Label>Platform Favicon</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {settings.general.faviconUrl ? (
                        <div className="space-y-3">
                          <img
                            src={settings.general.faviconUrl}
                            alt="Platform Favicon"
                            className="h-16 mx-auto object-contain"
                          />
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml';
                                input.onchange = (e) => handleFaviconUpload((e.target as HTMLInputElement).files?.[0]);
                                input.click();
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Change
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveFavicon}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="h-12 w-12 mx-auto text-gray-400" />
                          <div>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml';
                                input.onchange = (e) => handleFaviconUpload((e.target as HTMLInputElement).files?.[0]);
                                input.click();
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Favicon
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            ICO, PNG, or SVG (max 1MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Platform Access</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">Temporarily disable platform access</p>
                    </div>
                    <Switch
                      id="maintenance-mode"
                      checked={settings.general.maintenanceMode}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, maintenanceMode: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-registration">Allow Registration</Label>
                      <p className="text-sm text-gray-600">Allow new user registrations</p>
                    </div>
                    <Switch
                      id="allow-registration"
                      checked={settings.general.allowRegistration}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, allowRegistration: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-verification">Require Email Verification</Label>
                      <p className="text-sm text-gray-600">Users must verify email before access</p>
                    </div>
                    <Switch
                      id="email-verification"
                      checked={settings.general.requireEmailVerification}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, requireEmailVerification: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('General')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Roles Management */}
          <Card>
            <CardHeader>
              <CardTitle>User Roles & Permissions</CardTitle>
              <CardDescription>Manage user roles and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Search roles..." className="w-64" />
                    <Button variant="outline">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={() => setShowAddRoleDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {role.name === 'Super Admin' && <Crown className="h-4 w-4 text-yellow-600" />}
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{role.userCount} users</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 2).map((permission, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {permission.replace('_', ' ')}
                              </Badge>
                            ))}
                            {role.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {role.canDelete && (
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* User Authentication Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication Settings</CardTitle>
              <CardDescription>Configure user authentication and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                    <Input
                      id="max-login-attempts"
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="password-min-length">Minimum Password Length</Label>
                    <Input
                      id="password-min-length"
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, passwordMinLength: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Special Characters</Label>
                      <p className="text-sm text-gray-600">Password must contain special characters</p>
                    </div>
                    <Switch
                      checked={settings.security.requireSpecialChars}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, requireSpecialChars: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Numbers</Label>
                      <p className="text-sm text-gray-600">Password must contain numbers</p>
                    </div>
                    <Switch
                      checked={settings.security.requireNumbers}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, requireNumbers: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">Require 2FA for all users</p>
                    </div>
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, twoFactorAuth: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('User Authentication')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Security Policies */}
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>Configure platform security settings and policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enforce SSL/HTTPS</Label>
                      <p className="text-sm text-gray-600">Require secure connections</p>
                    </div>
                    <Switch
                      checked={settings.security.enforceSSL}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, enforceSSL: checked }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="api-rate-limit">API Rate Limit (requests/hour)</Label>
                    <Input
                      id="api-rate-limit"
                      type="number"
                      value={settings.security.apiRateLimit}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, apiRateLimit: parseInt(e.target.value) }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                    <Textarea
                      id="ip-whitelist"
                      placeholder="Enter IP addresses (one per line)"
                      value={settings.security.ipWhitelist}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, ipWhitelist: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="data-retention">Data Retention (days)</Label>
                    <Input
                      id="data-retention"
                      type="number"
                      value={settings.security.dataRetention}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, dataRetention: parseInt(e.target.value) }
                      }))}
                    />
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Security Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">SSL Certificate</span>
                        <Badge variant="default">Valid</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Firewall Status</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Intrusion Detection</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Keys Management */}
          <Card>
            <CardHeader>
              <CardTitle>API Keys & Webhooks</CardTitle>
              <CardDescription>Manage API access keys and webhook endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Platform API Key</h4>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.success('API key copied to clipboard')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.success('New API key generated')}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded">
                  {showApiKey ? 'pk_live_51234567890abcdef...' : '••••••••••••••••••••••••••••••••'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Webhook Endpoints</h4>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Webhook
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Payment Events</p>
                      <p className="text-sm text-gray-600">https://api.contrezz.com/webhooks/payments</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Active</Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">User Events</p>
                      <p className="text-sm text-gray-600">https://api.contrezz.com/webhooks/users</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Active</Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Logs</CardTitle>
              <CardDescription>Recent security-related activities and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {/* Integration Overview */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{integrations.filter(i => i.status === 'connected').length}</div>
                <p className="text-xs text-muted-foreground">Active integrations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{integrations.filter(i => i.status === 'pending').length}</div>
                <p className="text-xs text-muted-foreground">Awaiting setup</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Network className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Total available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                <RefreshCw className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2m ago</div>
                <p className="text-xs text-muted-foreground">Most recent sync</p>
              </CardContent>
            </Card>
          </div>

          {/* Integrations List */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>Manage connections with external services</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>API Version</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getIntegrationIcon(integration.type)}
                          <span className="font-medium">{integration.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{integration.type.replace('-', ' ')}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(integration.status)}
                          <Badge variant={getStatusBadge(integration.status)}>
                            {integration.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>{integration.apiVersion}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          {integration.status === 'connected' && (
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Integration Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Integration</CardTitle>
              <CardDescription>Connect additional third-party services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">PayPal</h4>
                  <p className="text-sm text-gray-600 mt-1">Alternative payment processing</p>
                  <Button variant="outline" className="mt-3 w-full">Connect</Button>
                </div>

                <div className="p-4 border rounded-lg text-center">
                  <Building2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">Yardi</h4>
                  <p className="text-sm text-gray-600 mt-1">Property management sync</p>
                  <Button variant="outline" className="mt-3 w-full">Connect</Button>
                </div>

                <div className="p-4 border rounded-lg text-center">
                  <Bell className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium">Slack</h4>
                  <p className="text-sm text-gray-600 mt-1">Team notifications</p>
                  <Button variant="outline" className="mt-3 w-full">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure platform-wide notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">Send notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, emailNotifications: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-600">Send notifications via SMS</p>
                  </div>
                  <Switch
                    checked={settings.notifications.smsNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, smsNotifications: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-600">Send push notifications to mobile apps</p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, pushNotifications: checked }
                    }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Alerts</Label>
                      <p className="text-sm text-gray-600">System maintenance notifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.maintenanceAlerts}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, maintenanceAlerts: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Billing Alerts</Label>
                      <p className="text-sm text-gray-600">Payment and billing notifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.billingAlerts}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, billingAlerts: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-gray-600">Security-related notifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.securityAlerts}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, securityAlerts: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>System Updates</Label>
                      <p className="text-sm text-gray-600">Feature updates and announcements</p>
                    </div>
                    <Switch
                      checked={settings.notifications.systemUpdates}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, systemUpdates: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMTP Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>Configure email server settings for sending notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">SMTP Connected</p>
                    <p className="text-sm text-green-700">Email server is configured and working</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={smtpTesting}
                  onClick={() => {
                    setSmtpTesting(true);
                    setTimeout(() => {
                      setSmtpTesting(false);
                      toast.success('Test email sent successfully to ' + settings.smtp.fromEmail);
                    }, 2000);
                  }}
                >
                  {smtpTesting ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
                      placeholder="smtp.gmail.com"
                      value={settings.smtp.host}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smtp: { ...prev.smtp, host: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      placeholder="587"
                      value={settings.smtp.port}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smtp: { ...prev.smtp, port: parseInt(e.target.value) }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtp-username">SMTP Username</Label>
                    <Input
                      id="smtp-username"
                      type="email"
                      placeholder="noreply@contrezz.com"
                      value={settings.smtp.username}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smtp: { ...prev.smtp, username: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtp-password">SMTP Password</Label>
                    <div className="relative">
                      <Input
                        id="smtp-password"
                        type={showSmtpPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={settings.smtp.password}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          smtp: { ...prev.smtp, password: e.target.value }
                        }))}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      >
                        {showSmtpPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="smtp-encryption">Encryption</Label>
                    <Select
                      value={settings.smtp.encryption}
                      onValueChange={(value) =>
                        setSettings(prev => ({
                          ...prev,
                          smtp: { ...prev.smtp, encryption: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TLS">TLS (Recommended)</SelectItem>
                        <SelectItem value="SSL">SSL</SelectItem>
                        <SelectItem value="NONE">None (Not recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="smtp-from-email">From Email Address</Label>
                    <Input
                      id="smtp-from-email"
                      type="email"
                      placeholder="noreply@contrezz.com"
                      value={settings.smtp.fromEmail}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smtp: { ...prev.smtp, fromEmail: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtp-from-name">From Name</Label>
                    <Input
                      id="smtp-from-name"
                      placeholder="Contrezz"
                      value={settings.smtp.fromName}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smtp: { ...prev.smtp, fromName: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium text-blue-900 mb-2">Common SMTP Ports</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <p>• Port 587: TLS (Recommended)</p>
                      <p>• Port 465: SSL</p>
                      <p>• Port 25: Unencrypted</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Popular SMTP Providers</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium mb-1">Gmail</h5>
                    <p className="text-xs text-gray-600">smtp.gmail.com:587</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium mb-1">SendGrid</h5>
                    <p className="text-xs text-gray-600">smtp.sendgrid.net:587</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium mb-1">Mailgun</h5>
                    <p className="text-xs text-gray-600">smtp.mailgun.org:587</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => toast.info('Configuration reset to defaults')}>
                  Reset to Defaults
                </Button>
                <Button onClick={() => handleSaveSettings('SMTP')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save SMTP Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Customize email notification templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Welcome Email</h4>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Sent to new users upon registration</p>
                    <Badge variant="default" className="mt-2">Active</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Password Reset</h4>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Password reset instructions</p>
                    <Badge variant="default" className="mt-2">Active</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Payment Receipt</h4>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Payment confirmation email</p>
                    <Badge variant="default" className="mt-2">Active</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Maintenance Alert</h4>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">System maintenance notifications</p>
                    <Badge variant="default" className="mt-2">Active</Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {/* Payment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Configuration</CardTitle>
              <CardDescription>Configure payment processing and billing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="payment-processor">Payment Processor</Label>
                    <Select value={settings.billing.paymentProcessor} onValueChange={(value) =>
                      setSettings(prev => ({
                        ...prev,
                        billing: { ...prev.billing, paymentProcessor: value }
                      }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      value={settings.billing.webhookUrl}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        billing: { ...prev.billing, webhookUrl: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="grace-period">Grace Period (days)</Label>
                    <Input
                      id="grace-period"
                      type="number"
                      value={settings.billing.gracePeriod}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        billing: { ...prev.billing, gracePeriod: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Tax Calculation</Label>
                      <p className="text-sm text-gray-600">Automatically calculate taxes</p>
                    </div>
                    <Switch
                      checked={settings.billing.taxCalculation}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        billing: { ...prev.billing, taxCalculation: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Suspend</Label>
                      <p className="text-sm text-gray-600">Suspend accounts for non-payment</p>
                    </div>
                    <Switch
                      checked={settings.billing.autoSuspend}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        billing: { ...prev.billing, autoSuspend: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Proration Enabled</Label>
                      <p className="text-sm text-gray-600">Prorate charges for plan changes</p>
                    </div>
                    <Switch
                      checked={settings.billing.prorationEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        billing: { ...prev.billing, prorationEnabled: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Plans section removed; manage plans in Billing & Plans */}

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Configure accepted payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Credit Cards</span>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <Banknote className="h-4 w-4" />
                    <span>ACH/Bank Transfer</span>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <Receipt className="h-4 w-4" />
                    <span>Wire Transfer</span>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {/* System Performance */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.uptime}%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.activeUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <Zap className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.apiCalls.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.storageUsed}TB</div>
                <p className="text-xs text-muted-foreground">Of 10TB allocated</p>
              </CardContent>
            </Card>
          </div>

          {/* System Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Technical system settings and parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="max-file-size">Max File Upload Size (MB)</Label>
                    <Input id="max-file-size" type="number" defaultValue="50" />
                  </div>

                  <div>
                    <Label htmlFor="cache-duration">Cache Duration (hours)</Label>
                    <Input id="cache-duration" type="number" defaultValue="24" />
                  </div>

                  <div>
                    <Label htmlFor="backup-frequency">Backup Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="log-retention">Log Retention (days)</Label>
                    <Input id="log-retention" type="number" defaultValue="90" />
                  </div>

                  <div>
                    <Label htmlFor="concurrent-users">Max Concurrent Users</Label>
                    <Input id="concurrent-users" type="number" defaultValue="5000" />
                  </div>

                  <div>
                    <Label htmlFor="database-pool">Database Connection Pool</Label>
                    <Input id="database-pool" type="number" defaultValue="20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Advanced Analytics</Label>
                      <p className="text-sm text-gray-600">Enable advanced analytics features</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mobile Push Notifications</Label>
                      <p className="text-sm text-gray-600">Enable mobile push notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>AI-Powered Insights</Label>
                      <p className="text-sm text-gray-600">Enable AI features (beta)</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Multi-Language Support</Label>
                      <p className="text-sm text-gray-600">Enable multiple language options</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-gray-600">Enable dark mode interface</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Real-time Chat Support</Label>
                      <p className="text-sm text-gray-600">Enable live chat widget</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
              <CardDescription>Manage system maintenance and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Last Backup</h4>
                    <p className="text-sm text-gray-600">{new Date(systemMetrics.lastBackup).toLocaleString()}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Next Maintenance</h4>
                    <p className="text-sm text-gray-600">{new Date(systemMetrics.nextMaintenance).toLocaleString()}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Database Size: {systemMetrics.databaseSize}GB</h4>
                    <p className="text-sm text-gray-600">Current database storage usage</p>
                  </div>
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Optimize
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {/* Compliance Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GDPR Compliance</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Compliant</div>
                <p className="text-xs text-muted-foreground">Last audit: Mar 1, 2024</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SOC 2 Compliance</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Certified</div>
                <p className="text-xs text-muted-foreground">Valid until Dec 2024</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Retention</CardTitle>
                <Archive className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">365 days</div>
                <p className="text-xs text-muted-foreground">Current policy</p>
              </CardContent>
            </Card>
          </div>

          {/* Legal Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Legal Documents</CardTitle>
              <CardDescription>Manage terms of service, privacy policy, and legal agreements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Terms of Service</h4>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Last updated: March 1, 2024</p>
                    <Badge variant="default" className="mt-2">Version 2.1</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Privacy Policy</h4>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Last updated: February 15, 2024</p>
                    <Badge variant="default" className="mt-2">Version 3.0</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Cookie Policy</h4>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Last updated: January 10, 2024</p>
                    <Badge variant="default" className="mt-2">Version 1.2</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Data Processing Agreement</h4>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Last updated: March 5, 2024</p>
                    <Badge variant="default" className="mt-2">Version 1.0</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Configure data retention, deletion, and export policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="data-retention-period">Data Retention Period (days)</Label>
                    <Input id="data-retention-period" type="number" defaultValue="365" />
                  </div>

                  <div>
                    <Label htmlFor="backup-retention">Backup Retention (days)</Label>
                    <Input id="backup-retention" type="number" defaultValue="90" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-delete Inactive Accounts</Label>
                      <p className="text-sm text-gray-600">Delete accounts inactive for 2+ years</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Data Export</Label>
                      <p className="text-sm text-gray-600">Allow users to export their data</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Anonymize Deleted Data</Label>
                      <p className="text-sm text-gray-600">Anonymize data instead of deletion</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Right to be Forgotten</Label>
                      <p className="text-sm text-gray-600">Enable GDPR deletion requests</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>Generate compliance reports and audit trails</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <Scale className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">GDPR Report</h4>
                  <p className="text-sm text-gray-600 mt-1">Data processing activities</p>
                  <Button variant="outline" className="mt-3 w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>

                <div className="p-4 border rounded-lg text-center">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">SOC 2 Report</h4>
                  <p className="text-sm text-gray-600 mt-1">Security controls audit</p>
                  <Button variant="outline" className="mt-3 w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>

                <div className="p-4 border rounded-lg text-center">
                  <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium">Audit Trail</h4>
                  <p className="text-sm text-gray-600 mt-1">System access and changes</p>
                  <Button variant="outline" className="mt-3 w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Role Dialog */}
      <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new user role with specific permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Role Name <span className="text-red-500">*</span></Label>
                <Input
                  id="role-name"
                  placeholder="e.g., Property Manager, Accountant"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="role-description">Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="role-description"
                  placeholder="Describe the responsibilities and scope of this role"
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-semibold">Permissions <span className="text-red-500">*</span></Label>
              <p className="text-sm text-gray-600 mb-4">Select the permissions this role should have</p>

              <div className="space-y-4">
                {['Properties', 'Tenants', 'Payments', 'Reports', 'Maintenance', 'Users', 'Settings'].map((category) => (
                  <div key={category} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availablePermissions
                        .filter(p => p.category === category)
                        .map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={newRole.permissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <Label
                              htmlFor={permission.id}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {newRole.permissions.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    {newRole.permissions.length} permission{newRole.permissions.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddRoleDialog(false);
                setNewRole({ name: '', description: '', permissions: [] });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddRole}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
