import React, { useState } from 'react';
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
  Key,
  Download,
  FileText,
  MessageSquare,
  Loader2,
  Copy
} from 'lucide-react';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  initializeTwoFactor,
  verifyTwoFactorSetup,
  disableTwoFactor,
} from '../lib/api/auth';
import apiClient from '../lib/api-client';

interface PropertyManagerSettingsProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    managerId: string;
    managerName: string;
    assignedProperties: string[];
    avatar?: string;
  };
  onBack: () => void;
  onSave: (updates: any) => void;
  onLogout: () => void;
}

export function PropertyManagerSettings({ user, onBack, onSave, onLogout }: PropertyManagerSettingsProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '(555) 123-4567',
    address: '123 Main St, Metro City, CA 90001',
    timezone: 'America/Los_Angeles',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    avatar: user.avatar || null
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
    passwordLastChanged: '2024-02-15',
    securityQuestions: true
  });
  const [updatingSecuritySetting, setUpdatingSecuritySetting] = useState(false);

  // Notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: {
      maintenanceTickets: true,
      taskReminders: true,
      tenantRequests: true,
      accessControlAlerts: true,
      systemUpdates: false,
      weeklyDigest: true
    },
    sms: {
      urgentMaintenance: true,
      taskReminders: false,
      tenantRequests: false,
      accessControlAlerts: true,
      systemUpdates: false
    },
    push: {
      maintenanceTickets: true,
      taskReminders: true,
      tenantRequests: true,
      accessControlAlerts: true,
      systemUpdates: true
    }
  });

  // Display preferences
  const [displayPreferences, setDisplayPreferences] = useState({
    theme: 'light',
    compactMode: false,
    showPropertyImages: true,
    defaultView: 'grouped',
    itemsPerPage: 20
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Two-Factor Authentication state
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
  const [twoFactorDisableDialogOpen, setTwoFactorDisableDialogOpen] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ qrCode?: string; secret?: string; otpauthUrl?: string }>({});
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState('');
  const [twoFactorDisablePassword, setTwoFactorDisablePassword] = useState('');
  const [initializingTwoFactor, setInitializingTwoFactor] = useState(false);
  const [twoFactorDialogLoading, setTwoFactorDialogLoading] = useState(false);
  const [disableTwoFactorLoading, setDisableTwoFactorLoading] = useState(false);

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
      action: 'Profile Update',
      description: 'Updated phone number',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      ipAddress: '192.168.1.100',
      status: 'success'
    },
    {
      id: 'ACT003',
      action: 'Password Change',
      description: 'Changed account password',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      ipAddress: '192.168.1.100',
      status: 'success'
    }
  ]);

  // Handler functions
  const handleSaveProfile = () => {
    onSave(profileData);
    setIsEditing(false);
    setHasUnsavedChanges(false);
    toast.success('Profile updated successfully');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setProfileData({
      name: user.name,
      email: user.email,
      phone: user.phone || '(555) 123-4567',
      address: '123 Main St, Metro City, CA 90001',
      timezone: 'America/Los_Angeles',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      avatar: user.avatar || null
    });
    toast.info('Changes discarded');
  };

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswords({ current: false, new: false, confirm: false });
  };

  const handlePasswordChange = async () => {
    // Basic validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      setIsChangingPassword(true);
      const { changePassword } = await import('../lib/api/auth');
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.error) {
        toast.error(response.error.error || response.error.message || 'Failed to change password');
        return;
      }

    toast.success('Password changed successfully');
      setSecuritySettings((prev: any) => ({
        ...prev,
        passwordLastChanged: new Date().toISOString(),
      }));
      resetPasswordForm();
      setShowPasswordDialog(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 2FA helpers
  const startTwoFactorSetup = async () => {
    try {
      setInitializingTwoFactor(true);
      const response = await initializeTwoFactor();
      if ((response as any).error) {
        toast.error((response as any).error?.error || 'Failed to start 2FA setup');
        return;
      }

      const secret = (response as any).data?.secret;
      const otpauthUrl = (response as any).data?.otpauthUrl;
      if (!secret || !otpauthUrl) {
        toast.error('Invalid response from server');
        return;
      }

      const qrCode = await QRCode.toDataURL(otpauthUrl);
      setTwoFactorSetup({ secret, otpauthUrl, qrCode });
      setTwoFactorCodeInput('');
      setTwoFactorDialogOpen(true);
    } catch (error: any) {
      console.error('2FA init error', error);
      toast.error(error?.message || 'Failed to start 2FA setup');
    } finally {
      setInitializingTwoFactor(false);
    }
  };

  const confirmTwoFactorSetup = async () => {
    if (!twoFactorCodeInput) {
      toast.error('Enter the 6-digit code from your authenticator app');
      return;
    }
    try {
      setTwoFactorDialogLoading(true);
      const response = await verifyTwoFactorSetup(twoFactorCodeInput);
      if ((response as any).error) {
        toast.error((response as any).error?.error || 'Invalid code, try again');
        return;
      }
      toast.success('Two-factor authentication enabled');
      setSecuritySettings((prev: any) => ({ ...prev, twoFactorEnabled: true }));
      setTwoFactorDialogOpen(false);
      setTwoFactorCodeInput('');
      setTwoFactorSetup({});
    } catch (error: any) {
      console.error('2FA verify error', error);
      toast.error(error?.message || 'Failed to enable 2FA');
    } finally {
      setTwoFactorDialogLoading(false);
    }
  };

  const copyTwoFactorSecret = async () => {
    if (!twoFactorSetup.secret) return;
    try {
      await navigator.clipboard.writeText(twoFactorSetup.secret);
      toast.success('Secret copied to clipboard');
    } catch {
      toast.error('Could not copy secret');
    }
  };

  const confirmDisableTwoFactor = async () => {
    if (!twoFactorDisablePassword) {
      toast.error('Enter your password to disable 2FA');
      return;
    }
    try {
      setDisableTwoFactorLoading(true);
      const response = await disableTwoFactor(twoFactorDisablePassword);
      if ((response as any).error) {
        toast.error((response as any).error?.error || 'Failed to disable 2FA');
        return;
      }
      toast.success('Two-factor authentication disabled');
      setSecuritySettings((prev: any) => ({ ...prev, twoFactorEnabled: false }));
      setTwoFactorDisableDialogOpen(false);
      setTwoFactorDisablePassword('');
    } catch (error: any) {
      console.error('2FA disable error', error);
      toast.error(error?.message || 'Failed to disable 2FA');
    } finally {
      setDisableTwoFactorLoading(false);
    }
  };

  // Security settings updates (login alerts / session timeout)
  const handleSecuritySettingChange = async (setting: 'sessionTimeout', value: any) => {
    try {
      setUpdatingSecuritySetting(true);
      const payload: any = {};

      if (setting === 'sessionTimeout') {
        payload.sessionTimeout = value === '1440' ? 1440 : parseInt(value, 10);
      }

      const response = await apiClient.put('/api/auth/security-settings', payload);
      if ((response as any).error) {
        throw new Error((response as any).error?.error || 'Failed to update security setting');
      }

      setSecuritySettings((prev: any) => ({
        ...prev,
        sessionTimeout: setting === 'sessionTimeout' ? value : prev.sessionTimeout,
      }));

      toast.success('Security setting updated');
    } catch (error: any) {
      console.error('Security setting update error:', error);
      toast.error(error?.message || 'Failed to update security setting');
    } finally {
      setUpdatingSecuritySetting(false);
    }
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

  const updateFormData = (field: string, value: any) => {
    setProfileData((prev: any) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const getNotificationDescription = (key: string) => {
    const descriptions: { [key: string]: string } = {
      maintenanceTickets: 'New maintenance requests and updates',
      taskReminders: 'Upcoming tasks and deadlines',
      tenantRequests: 'New requests from tenants',
      accessControlAlerts: 'Access control issues and expirations',
      systemUpdates: 'Platform updates and announcements',
      weeklyDigest: 'Weekly summary of activities',
      urgentMaintenance: 'Critical maintenance issues only'
    };
    return descriptions[key] || '';
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
                  Manage your account and preferences
                </p>
              </div>
            </div>

            {/* Right: Save/Cancel or Logout */}
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
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
                    <span className="font-medium">Profile</span>
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
                    <span className="font-medium">Security</span>
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
                    <span className="font-medium">Notifications</span>
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
                    <span className="font-medium">Display</span>
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
                    <span className="font-medium">Sessions</span>
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
                    <span className="font-medium">Activity</span>
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
                    <span className="font-medium">Help & Support</span>
                  </button>
                </nav>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-4 bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Your account is secure
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Last security check: Today
                    </p>
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
                updateFormData={updateFormData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                user={user}
              />
            )}

            {activeTab === 'security' && (
              <SecuritySection
                securitySettings={securitySettings}
                setSecuritySettings={setSecuritySettings}
                setShowPasswordDialog={setShowPasswordDialog}
                handleExportData={handleExportData}
                setShowDeleteDialog={setShowDeleteDialog}
                initializingTwoFactor={initializingTwoFactor}
                twoFactorDialogLoading={twoFactorDialogLoading}
                disableTwoFactorLoading={disableTwoFactorLoading}
                startTwoFactorSetup={startTwoFactorSetup}
                setTwoFactorDisableDialogOpen={setTwoFactorDisableDialogOpen}
                updatingSecuritySetting={updatingSecuritySetting}
                handleSecuritySettingChange={handleSecuritySettingChange}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsSection
                notificationPreferences={notificationPreferences}
                setNotificationPreferences={setNotificationPreferences}
                getNotificationDescription={getNotificationDescription}
              />
            )}

            {activeTab === 'display' && (
              <DisplaySection
                displayPreferences={displayPreferences}
                setDisplayPreferences={setDisplayPreferences}
              />
            )}

            {activeTab === 'sessions' && (
              <SessionsSection sessions={sessions} getDeviceIcon={getDeviceIcon} />
            )}

            {activeTab === 'activity' && (
              <ActivitySection activityLog={activityLog} />
            )}

            {activeTab === 'help' && <HelpSection />}
          </div>
        </div>
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
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                resetPasswordForm();
              }}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={
                isChangingPassword ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword ||
                passwordForm.newPassword !== passwordForm.confirmPassword
              }
            >
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Two-Factor Setup Dialog */}
      <Dialog
        open={twoFactorDialogOpen}
        onOpenChange={(open) => {
          setTwoFactorDialogOpen(open);
          if (!open) {
            setTwoFactorCodeInput('');
            setTwoFactorSetup({});
          }
        }}
      >
        <DialogContent className="max-w-md border-0 shadow-2xl p-0">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <DialogTitle className="text-white text-xl">Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-purple-100">
              Scan the QR code below with Google Authenticator, Authy, or any compatible app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            {twoFactorSetup.qrCode && (
              <div className="flex flex-col items-center space-y-2">
                <div className="p-4 bg-white border-2 border-purple-200 rounded-xl shadow-sm">
                  <img src={twoFactorSetup.qrCode} alt="Two-factor QR code" className="w-48 h-48" />
                </div>
                <p className="text-sm text-gray-600 text-center font-medium">
                  After scanning, enter the 6-digit code generated by your authenticator app.
                </p>
              </div>
            )}

            {twoFactorSetup.secret && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 rounded-xl p-4 text-sm">
                <p className="text-gray-700 font-semibold mb-2">Can't scan the QR code? Enter this key manually:</p>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <code className="font-mono text-base text-[#7C3AED] break-all font-bold">
                    {twoFactorSetup.secret}
                  </code>
                  <Button variant="ghost" size="icon" onClick={copyTwoFactorSecret} className="hover:bg-purple-100 hover:text-[#7C3AED]">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="twoFactorCodeInput" className="text-sm font-semibold text-gray-700">Authenticator Code</Label>
              <Input
                id="twoFactorCodeInput"
                placeholder="123456"
                maxLength={6}
                inputMode="numeric"
                value={twoFactorCodeInput}
                onChange={(e) => setTwoFactorCodeInput(e.target.value)}
                className="mt-2 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] text-center text-lg tracking-widest font-mono"
              />
            </div>
          </div>

          <DialogFooter className="p-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setTwoFactorDialogOpen(false);
                setTwoFactorCodeInput('');
                setTwoFactorSetup({});
              }}
              disabled={twoFactorDialogLoading}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmTwoFactorSetup}
              disabled={twoFactorDialogLoading}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
            >
              {twoFactorDialogLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Enable 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Two-Factor Dialog */}
      <Dialog
        open={twoFactorDisableDialogOpen}
        onOpenChange={(open) => {
          setTwoFactorDisableDialogOpen(open);
          if (!open) {
            setTwoFactorDisablePassword('');
          }
        }}
      >
        <DialogContent className="max-w-md border-0 shadow-2xl p-0">
          <DialogHeader className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-lg">
            <DialogTitle className="text-white text-xl">Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-red-100">
              Enter your password to disable two-factor authentication. You can re-enable it at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="disableTwoFactorPassword" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <Input
                id="disableTwoFactorPassword"
                type="password"
                value={twoFactorDisablePassword}
                onChange={(e) => setTwoFactorDisablePassword(e.target.value)}
                placeholder="Enter your password"
                className="border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>

          <DialogFooter className="p-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setTwoFactorDisableDialogOpen(false);
                setTwoFactorDisablePassword('');
              }}
              disabled={disableTwoFactorLoading}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDisableTwoFactor}
              disabled={disableTwoFactorLoading || !twoFactorDisablePassword}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md"
            >
              {disableTwoFactorLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable 2FA'
              )}
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
                  <p className="font-medium mb-1">Warning:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All your data will be permanently deleted</li>
                    <li>You will lose access to all assigned properties</li>
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
function ProfileSection({ profileData, updateFormData, isEditing, setIsEditing, user }: any) {
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
              <AvatarFallback className="bg-green-100 text-green-700 text-2xl">
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
                  <p className="text-sm font-medium text-gray-900">Property Manager</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Assigned Properties</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.assignedProperties?.length || 0} properties
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">January 2024</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Last Login</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Security Section Component
function SecuritySection({
  securitySettings,
  setSecuritySettings,
  setShowPasswordDialog,
  handleExportData,
  setShowDeleteDialog,
  initializingTwoFactor,
  twoFactorDialogLoading,
  disableTwoFactorLoading,
  startTwoFactorSetup,
  setTwoFactorDisableDialogOpen,
  updatingSecuritySetting,
  handleSecuritySettingChange,
}: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password & Authentication</CardTitle>
          <CardDescription>
            Manage your password and authentication methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Key className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Password</p>
                <p className="text-sm text-gray-500">
                  Last changed: {format(new Date(securitySettings.passwordLastChanged), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            <Switch
              checked={securitySettings.twoFactorEnabled}
              onCheckedChange={(checked) => {
                    if (checked) {
                      startTwoFactorSetup();
                    } else {
                      setTwoFactorDisableDialogOpen(true);
                    }
                  }}
                  disabled={initializingTwoFactor || twoFactorDialogLoading || disableTwoFactorLoading}
            />
          </div>

          <div className="space-y-3">
            <Label>Session Timeout</Label>
            <Select
              value={securitySettings.sessionTimeout}
                  onValueChange={(value) => handleSecuritySettingChange('sessionTimeout', value)}
                  disabled={updatingSecuritySetting}
            >
              <SelectTrigger>
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
            <p className="text-xs text-gray-500">
              Automatically log out after period of inactivity
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy & Data</CardTitle>
          <CardDescription>
            Control your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export My Data
          </Button>

          <Separator />

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-1">Danger Zone</h4>
                <p className="text-sm text-red-700 mb-3">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Notifications Section Component
function NotificationsSection({ notificationPreferences, setNotificationPreferences, getNotificationDescription }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Receive notifications via email
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notificationPreferences.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                <p className="text-sm text-gray-500">
                  {getNotificationDescription(key)}
                </p>
              </div>
              <Switch
                checked={value as boolean}
                onCheckedChange={(checked) => {
                  setNotificationPreferences((prev: any) => ({
                    ...prev,
                    email: { ...prev.email, [key]: checked }
                  }));
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>
                Receive notifications via text message
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notificationPreferences.sms).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                <p className="text-sm text-gray-500">
                  {getNotificationDescription(key)}
                </p>
              </div>
              <Switch
                checked={value as boolean}
                onCheckedChange={(checked) => {
                  setNotificationPreferences((prev: any) => ({
                    ...prev,
                    sms: { ...prev.sms, [key]: checked }
                  }));
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Receive push notifications on your devices
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notificationPreferences.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                <p className="text-sm text-gray-500">
                  {getNotificationDescription(key)}
                </p>
              </div>
              <Switch
                checked={value as boolean}
                onCheckedChange={(checked) => {
                  setNotificationPreferences((prev: any) => ({
                    ...prev,
                    push: { ...prev.push, [key]: checked }
                  }));
                }}
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
    <Card>
      <CardHeader>
        <CardTitle>Display Preferences</CardTitle>
        <CardDescription>
          Customize how you view information in your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Theme</Label>
          <Select
            value={displayPreferences.theme}
            onValueChange={(value) => {
              setDisplayPreferences((prev: any) => ({ ...prev, theme: value }));
              toast.success('Theme updated');
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label>Compact Mode</Label>
            <p className="text-sm text-gray-500">
              Display more information in less space
            </p>
          </div>
          <Switch
            checked={displayPreferences.compactMode}
            onCheckedChange={(checked) => {
              setDisplayPreferences((prev: any) => ({ ...prev, compactMode: checked }));
              toast.success(checked ? 'Compact mode enabled' : 'Compact mode disabled');
            }}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label>Show Property Images</Label>
            <p className="text-sm text-gray-500">
              Display property images in lists
            </p>
          </div>
          <Switch
            checked={displayPreferences.showPropertyImages}
            onCheckedChange={(checked) => {
              setDisplayPreferences((prev: any) => ({ ...prev, showPropertyImages: checked }));
            }}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Default View</Label>
          <Select
            value={displayPreferences.defaultView}
            onValueChange={(value) => {
              setDisplayPreferences((prev: any) => ({ ...prev, defaultView: value }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">List View</SelectItem>
              <SelectItem value="grouped">Grouped View</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Items Per Page</Label>
          <Select
            value={String(displayPreferences.itemsPerPage)}
            onValueChange={(value) => {
              setDisplayPreferences((prev: any) => ({ ...prev, itemsPerPage: Number(value) }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 items</SelectItem>
              <SelectItem value="20">20 items</SelectItem>
              <SelectItem value="50">50 items</SelectItem>
              <SelectItem value="100">100 items</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// Sessions Section Component
function SessionsSection({ sessions, getDeviceIcon }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          Manage your active sessions across devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session: any) => {
            const DeviceIcon = getDeviceIcon(session.device);
            return (
              <div
                key={session.id}
                className={`p-4 border rounded-lg ${
                  session.isCurrent ? 'border-green-300 bg-green-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <DeviceIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {session.browser}
                        </h4>
                        {session.isCurrent && (
                          <Badge variant="default" className="bg-green-600">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {session.os} · {session.device}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {session.location} · {session.ipAddress}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Last active: {format(new Date(session.lastActive), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Activity Section Component
function ActivitySection({ activityLog }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>
          Review your recent account activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activityLog.map((activity: any) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.action}</TableCell>
                <TableCell className="text-gray-600">{activity.description}</TableCell>
                <TableCell className="text-gray-500 font-mono text-sm">
                  {activity.ipAddress}
                </TableCell>
                <TableCell className="text-gray-600">
                  {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>
                  {activity.status === 'success' ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <X className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Help Section Component
function HelpSection() {
  const handleDocumentation = () => {
    toast.info('Opening documentation...');
    // Open documentation in new window
    window.open('https://docs.contrezz.com', '_blank');
  };

  const handleContactSupport = () => {
    toast.info('Opening support contact...');
    // Open email client or support form
    window.location.href = 'mailto:support@contrezz.com?subject=Support Request&body=Hello Contrezz Support Team,%0D%0A%0D%0AI need help with:%0D%0A';
  };

  const handleFAQs = () => {
    toast.info('Opening FAQs...');
    // Open FAQs page in new window
    window.open('https://help.contrezz.com/faqs', '_blank');
  };

  const handleStartLiveChat = () => {
    toast.success('Connecting to live chat...');
    // In a real application, this would open a live chat widget
    // For now, we'll show a toast message
    setTimeout(() => {
      toast.info('Live chat agent will be with you shortly!');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
          <CardDescription>
            Get help and find answers to your questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4 hover:bg-blue-50 transition-colors"
            onClick={handleDocumentation}
          >
            <div className="flex items-start space-x-4 text-left">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Documentation</p>
                <p className="text-sm text-gray-500">
                  Browse our comprehensive guides and tutorials
                </p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4 hover:bg-green-50 transition-colors"
            onClick={handleContactSupport}
          >
            <div className="flex items-start space-x-4 text-left">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Contact Support</p>
                <p className="text-sm text-gray-500">
                  Get help from our support team via email
                </p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4 hover:bg-purple-50 transition-colors"
            onClick={handleFAQs}
          >
            <div className="flex items-start space-x-4 text-left">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">FAQs</p>
                <p className="text-sm text-gray-500">
                  Find answers to commonly asked questions
                </p>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Need Quick Help?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Our support team is available 24/7 to assist you
              </p>
              <Button size="sm" onClick={handleStartLiveChat} className="bg-green-600 hover:bg-green-700">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Live Chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
