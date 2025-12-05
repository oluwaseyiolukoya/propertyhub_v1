import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Camera,
  Settings,
  Bell,
  Eye,
  Smartphone,
  Monitor,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Home,
  Calendar,
  DollarSign,
  UserCog
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

const TenantSettings: React.FC = () => {
  const [profileData, setProfileData] = useState({
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 123-4567',
    emergencyContact: 'John Johnson',
    emergencyPhone: '(555) 987-6543'
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    rentReminders: true,
    maintenanceUpdates: true,
    propertyAnnouncements: true,
    marketingEmails: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully!');
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences updated!');
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    toast.success('Password changed successfully!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] p-6 md:p-8 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg hidden md:flex">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
              <p className="text-white/80 font-medium mt-1">Manage your account and preferences</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
              <p className="text-white/70 text-xs font-medium">Account Status</p>
              <p className="text-white font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-300" />
                Active
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm p-1.5 border border-gray-200 shadow-lg rounded-xl h-auto flex-wrap">
          <TabsTrigger
            value="profile"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="privacy"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <Eye className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-2.5 shadow-lg shadow-purple-500/25">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Profile Information</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Update your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src="" alt="Profile" />
                  <AvatarFallback className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] text-white text-2xl font-bold">{profileData.firstName[0]}{profileData.lastName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{profileData.firstName} {profileData.lastName}</h3>
                  <p className="text-gray-600 font-medium">{profileData.email}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-purple-600" />
                  Personal Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="font-semibold text-gray-700">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        className="pl-10 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="font-semibold text-gray-700">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="lastName"
                        className="pl-10 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold text-gray-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-semibold text-gray-700">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact" className="font-semibold text-gray-700">Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      className="border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
                      value={profileData.emergencyContact}
                      onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone" className="font-semibold text-gray-700">Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      className="border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
                      value={profileData.emergencyPhone}
                      onChange={(e) => setProfileData({ ...profileData, emergencyPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveProfile}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-200"
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rental Information */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 shadow-lg shadow-blue-500/25">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Rental Information</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Your current rental details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-blue-600 font-semibold">Property</p>
                  </div>
                  <p className="font-bold text-gray-900">Sunset Apartments</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-4 w-4 text-purple-600" />
                    <p className="text-xs text-purple-600 font-semibold">Unit</p>
                  </div>
                  <p className="font-bold text-gray-900">Unit 204</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-green-600 font-semibold">Monthly Rent</p>
                  </div>
                  <p className="font-bold text-gray-900">₦2,500</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <p className="text-xs text-gray-600 font-semibold">Lease Start</p>
                  </div>
                  <p className="font-bold text-gray-900">January 1, 2024</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <p className="text-xs text-gray-600 font-semibold">Lease End</p>
                  </div>
                  <p className="font-bold text-gray-900">December 31, 2024</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <p className="text-xs text-gray-600 font-semibold">Property Manager</p>
                  </div>
                  <p className="font-bold text-gray-900">Jennifer Smith</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-red-500 to-orange-500 p-2.5 shadow-lg shadow-red-500/25">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Change Password</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Update your password to keep your account secure</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="font-semibold text-gray-700">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="currentPassword"
                    type="password"
                    className="pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="font-semibold text-gray-700">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    className="pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-semibold text-gray-700">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Password Requirements</p>
                    <p className="text-sm text-gray-600">
                      At least 8 characters with uppercase, lowercase, numbers, and special characters.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleChangePassword}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-red-500/25 transition-all duration-200"
                >
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2.5 shadow-lg shadow-green-500/25">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Two-Factor Authentication</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Add an extra layer of security to your account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Smartphone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600">Secure your account with 2FA</p>
                  </div>
                </div>
                <Button
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-green-500/25"
                >
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 shadow-lg shadow-blue-500/25">
                  <Monitor className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Active Sessions</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Manage your active sessions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <Monitor className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      Current Device
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">Chrome on MacOS • San Francisco, CA</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Last active: Just now</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 p-2.5 shadow-lg shadow-blue-500/25">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Notification Preferences</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Choose how you want to be notified</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Delivery Methods */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Delivery Methods
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <Label htmlFor="emailNotifications" className="font-semibold text-gray-900 cursor-pointer">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                      className="data-[state=checked]:bg-[#7C3AED]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-100 p-2">
                        <Smartphone className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <Label htmlFor="smsNotifications" className="font-semibold text-gray-900 cursor-pointer">SMS Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via text message</p>
                      </div>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                      className="data-[state=checked]:bg-[#7C3AED]"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Types */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-purple-600" />
                  Notification Types
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-100 p-2">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <Label htmlFor="rentReminders" className="font-semibold text-gray-900 cursor-pointer">Rent Reminders</Label>
                        <p className="text-sm text-gray-500">Get reminders before rent is due</p>
                      </div>
                    </div>
                    <Switch
                      id="rentReminders"
                      checked={notifications.rentReminders}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, rentReminders: checked })}
                      className="data-[state=checked]:bg-[#7C3AED]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-orange-100 p-2">
                        <Settings className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <Label htmlFor="maintenanceUpdates" className="font-semibold text-gray-900 cursor-pointer">Maintenance Updates</Label>
                        <p className="text-sm text-gray-500">Updates on your maintenance requests</p>
                      </div>
                    </div>
                    <Switch
                      id="maintenanceUpdates"
                      checked={notifications.maintenanceUpdates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, maintenanceUpdates: checked })}
                      className="data-[state=checked]:bg-[#7C3AED]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <Label htmlFor="propertyAnnouncements" className="font-semibold text-gray-900 cursor-pointer">Property Announcements</Label>
                        <p className="text-sm text-gray-500">Important property updates and notices</p>
                      </div>
                    </div>
                    <Switch
                      id="propertyAnnouncements"
                      checked={notifications.propertyAnnouncements}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, propertyAnnouncements: checked })}
                      className="data-[state=checked]:bg-[#7C3AED]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-gray-100 p-2">
                        <Mail className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="marketingEmails" className="font-semibold text-gray-900 cursor-pointer">Marketing Emails</Label>
                        <p className="text-sm text-gray-500">Tips, news, and special offers</p>
                      </div>
                    </div>
                    <Switch
                      id="marketingEmails"
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
                      className="data-[state=checked]:bg-[#7C3AED]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveNotifications}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-200"
                >
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-2.5 shadow-lg shadow-purple-500/25">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Privacy Settings</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Control your privacy and data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Data & Privacy */}
              <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-purple-100 p-3">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Data & Privacy</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Learn about how we collect, use, and protect your personal information
                    </p>
                    <Button
                      variant="outline"
                      className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Privacy Policy
                    </Button>
                  </div>
                </div>
              </div>

              {/* Download Data */}
              <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-blue-100 p-3">
                    <Download className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Download Your Data</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Request a copy of all your personal data stored in our system
                    </p>
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Request Data Export
                    </Button>
                  </div>
                </div>
              </div>

              {/* Delete Account */}
              <div className="p-5 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border-2 border-red-200">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-red-100 p-3">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-red-900 mb-1">Delete Account</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data
                    </p>
                    <div className="p-3 bg-red-100 rounded-lg border border-red-200 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 font-medium">
                          This action cannot be undone. Please contact property management before deleting your account.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-red-500/25"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantSettings;


