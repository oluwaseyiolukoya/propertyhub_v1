import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Clock, TestTube, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  type NotificationPreferences,
} from '../../../lib/api/notifications';

export const NotificationPreferencesTab: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await getNotificationPreferences();
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const response = await updateNotificationPreferences({
        email_enabled: preferences.email_enabled,
        email_invoice_approval: preferences.email_invoice_approval,
        email_invoice_approved: preferences.email_invoice_approved,
        email_invoice_rejected: preferences.email_invoice_rejected,
        email_invoice_paid: preferences.email_invoice_paid,
        email_team_invitation: preferences.email_team_invitation,
        email_delegation: preferences.email_delegation,
        email_daily_digest: preferences.email_daily_digest,
        email_weekly_summary: preferences.email_weekly_summary,
        inapp_enabled: preferences.inapp_enabled,
        inapp_invoice_approval: preferences.inapp_invoice_approval,
        inapp_invoice_approved: preferences.inapp_invoice_approved,
        inapp_invoice_rejected: preferences.inapp_invoice_rejected,
        inapp_invoice_paid: preferences.inapp_invoice_paid,
        inapp_team_invitation: preferences.inapp_team_invitation,
        inapp_delegation: preferences.inapp_delegation,
        quiet_hours_enabled: preferences.quiet_hours_enabled,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        quiet_hours_timezone: preferences.quiet_hours_timezone,
      });

      if (response.error) {
        toast.error('Failed to save preferences');
        return;
      }

      toast.success('Notification preferences saved successfully!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadPreferences();
    setHasChanges(false);
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      const response = await sendTestNotification();
      if (response.error) {
        toast.error('Failed to send test notification');
        return;
      }

      toast.success('Test notification sent! Check your notification center.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setSendingTest(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load notification preferences</p>
        <Button onClick={loadPreferences} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Enhanced with Brand Colors */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">
                Notification Preferences
              </h2>
            </div>
          </div>
          <p className="text-gray-600 ml-14">Manage how you receive notifications</p>
        </div>
        <Button
          onClick={handleSendTest}
          disabled={sendingTest}
          variant="outline"
          className="gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
        >
          <TestTube className="w-4 h-4" />
          {sendingTest ? 'Sending...' : 'Send Test'}
        </Button>
      </div>

      {/* Email Notifications */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Email Notifications</CardTitle>
              <CardDescription className="text-gray-600">
                Receive notifications via email
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Master Email Toggle */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 rounded-xl border-2 border-blue-200/50 hover:border-purple-300 transition-all">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="email_enabled" className="text-base font-bold text-gray-900">
                  Enable Email Notifications
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Master switch for all email notifications
                </p>
              </div>
            </div>
            <Switch
              id="email_enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
            />
          </div>

          <Separator />

          {/* Individual Email Preferences */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="email_invoice_approval" className="text-sm font-semibold text-gray-900">
                  Invoice Approval Requests
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When an invoice needs your approval</p>
              </div>
              <Switch
                id="email_invoice_approval"
                checked={preferences.email_invoice_approval}
                onCheckedChange={(checked) => updatePreference('email_invoice_approval', checked)}
                disabled={!preferences.email_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="email_invoice_approved" className="text-sm font-semibold text-gray-900">
                  Invoice Approved
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When your invoice is approved</p>
              </div>
              <Switch
                id="email_invoice_approved"
                checked={preferences.email_invoice_approved}
                onCheckedChange={(checked) => updatePreference('email_invoice_approved', checked)}
                disabled={!preferences.email_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="email_invoice_rejected" className="text-sm font-semibold text-gray-900">
                  Invoice Rejected
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When your invoice is rejected</p>
              </div>
              <Switch
                id="email_invoice_rejected"
                checked={preferences.email_invoice_rejected}
                onCheckedChange={(checked) => updatePreference('email_invoice_rejected', checked)}
                disabled={!preferences.email_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="email_invoice_paid" className="text-sm font-semibold text-gray-900">
                  Invoice Paid
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When an invoice is marked as paid</p>
              </div>
              <Switch
                id="email_invoice_paid"
                checked={preferences.email_invoice_paid}
                onCheckedChange={(checked) => updatePreference('email_invoice_paid', checked)}
                disabled={!preferences.email_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="email_team_invitation" className="text-sm font-semibold text-gray-900">
                  Team Invitations
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When you're invited to a team</p>
              </div>
              <Switch
                id="email_team_invitation"
                checked={preferences.email_team_invitation}
                onCheckedChange={(checked) => updatePreference('email_team_invitation', checked)}
                disabled={!preferences.email_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="email_delegation" className="text-sm font-semibold text-gray-900">
                  Approval Delegation
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When approval authority is delegated to you</p>
              </div>
              <Switch
                id="email_delegation"
                checked={preferences.email_delegation}
                onCheckedChange={(checked) => updatePreference('email_delegation', checked)}
                disabled={!preferences.email_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>
          </div>

          <Separator />

          {/* Digest Options */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-600" />
              Digest Options
            </h4>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="email_daily_digest" className="text-sm font-semibold text-gray-900">
                  Daily Digest
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">Summary of all notifications once per day</p>
              </div>
              <Switch
                id="email_daily_digest"
                checked={preferences.email_daily_digest}
                onCheckedChange={(checked) => updatePreference('email_daily_digest', checked)}
                disabled={!preferences.email_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="email_weekly_summary" className="text-sm font-semibold text-gray-900">
                  Weekly Summary
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">Summary of all notifications once per week</p>
              </div>
              <Switch
                id="email_weekly_summary"
                checked={preferences.email_weekly_summary}
                onCheckedChange={(checked) => updatePreference('email_weekly_summary', checked)}
                disabled={!preferences.email_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-900">In-App Notifications</CardTitle>
              <CardDescription className="text-gray-600">
                Receive notifications in the application
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Master In-App Toggle */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-br from-purple-50/50 via-indigo-50/50 to-purple-50/50 rounded-xl border-2 border-purple-200/50 hover:border-purple-300 transition-all">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-12 w-12 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="inapp_enabled" className="text-base font-bold text-gray-900">
                  Enable In-App Notifications
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Master switch for all in-app notifications
                </p>
              </div>
            </div>
            <Switch
              id="inapp_enabled"
              checked={preferences.inapp_enabled}
              onCheckedChange={(checked) => updatePreference('inapp_enabled', checked)}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
            />
          </div>

          <Separator />

          {/* Individual In-App Preferences */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="inapp_invoice_approval" className="text-sm font-semibold text-gray-900">
                  Invoice Approval Requests
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When an invoice needs your approval</p>
              </div>
              <Switch
                id="inapp_invoice_approval"
                checked={preferences.inapp_invoice_approval}
                onCheckedChange={(checked) => updatePreference('inapp_invoice_approval', checked)}
                disabled={!preferences.inapp_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="inapp_invoice_approved" className="text-sm font-semibold text-gray-900">
                  Invoice Approved
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When your invoice is approved</p>
              </div>
              <Switch
                id="inapp_invoice_approved"
                checked={preferences.inapp_invoice_approved}
                onCheckedChange={(checked) => updatePreference('inapp_invoice_approved', checked)}
                disabled={!preferences.inapp_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="inapp_invoice_rejected" className="text-sm font-semibold text-gray-900">
                  Invoice Rejected
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When your invoice is rejected</p>
              </div>
              <Switch
                id="inapp_invoice_rejected"
                checked={preferences.inapp_invoice_rejected}
                onCheckedChange={(checked) => updatePreference('inapp_invoice_rejected', checked)}
                disabled={!preferences.inapp_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="inapp_invoice_paid" className="text-sm font-semibold text-gray-900">
                  Invoice Paid
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When an invoice is marked as paid</p>
              </div>
              <Switch
                id="inapp_invoice_paid"
                checked={preferences.inapp_invoice_paid}
                onCheckedChange={(checked) => updatePreference('inapp_invoice_paid', checked)}
                disabled={!preferences.inapp_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="inapp_team_invitation" className="text-sm font-semibold text-gray-900">
                  Team Invitations
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When you're invited to a team</p>
              </div>
              <Switch
                id="inapp_team_invitation"
                checked={preferences.inapp_team_invitation}
                onCheckedChange={(checked) => updatePreference('inapp_team_invitation', checked)}
                disabled={!preferences.inapp_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <Label htmlFor="inapp_delegation" className="text-sm font-semibold text-gray-900">
                  Approval Delegation
                </Label>
                <p className="text-sm text-gray-600 mt-0.5">When approval authority is delegated to you</p>
              </div>
              <Switch
                id="inapp_delegation"
                checked={preferences.inapp_delegation}
                onCheckedChange={(checked) => updatePreference('inapp_delegation', checked)}
                disabled={!preferences.inapp_enabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Quiet Hours</CardTitle>
              <CardDescription className="text-gray-600">
                Set times when you don't want to receive notifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-5 bg-gradient-to-br from-amber-50/50 via-orange-50/50 to-yellow-50/50 rounded-xl border-2 border-amber-200/50 hover:border-amber-300 transition-all">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="quiet_hours_enabled" className="text-base font-bold text-gray-900">
                  Enable Quiet Hours
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Pause notifications during specific hours
                </p>
              </div>
            </div>
            <Switch
              id="quiet_hours_enabled"
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) => updatePreference('quiet_hours_enabled', checked)}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiet_hours_start" className="text-sm font-semibold text-gray-700">
                    Start Time
                  </Label>
                  <Select
                    value={preferences.quiet_hours_start || '22:00'}
                    onValueChange={(value) => updatePreference('quiet_hours_start', value)}
                  >
                    <SelectTrigger id="quiet_hours_start" className="focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quiet_hours_end" className="text-sm font-semibold text-gray-700">
                    End Time
                  </Label>
                  <Select
                    value={preferences.quiet_hours_end || '08:00'}
                    onValueChange={(value) => updatePreference('quiet_hours_end', value)}
                  >
                    <SelectTrigger id="quiet_hours_end" className="focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="quiet_hours_timezone" className="text-sm font-semibold text-gray-700">
                  Timezone
                </Label>
                <Select
                  value={preferences.quiet_hours_timezone}
                  onValueChange={(value) => updatePreference('quiet_hours_timezone', value)}
                >
                  <SelectTrigger id="quiet_hours_timezone" className="focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                    <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los Angeles (PST)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save/Cancel Buttons */}
      {hasChanges && (
        <div className="flex items-center justify-end gap-3 p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-200 rounded-xl shadow-lg">
          <p className="text-sm font-semibold text-purple-700 mr-auto flex items-center gap-2">
            <Bell className="w-4 h-4" />
            You have unsaved changes
          </p>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="gap-2 border-gray-300 hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

