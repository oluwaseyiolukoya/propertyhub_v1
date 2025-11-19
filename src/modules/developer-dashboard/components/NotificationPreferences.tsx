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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
          <p className="text-gray-600 mt-1">Manage how you receive notifications</p>
        </div>
        <Button
          onClick={handleSendTest}
          disabled={sendingTest}
          variant="outline"
          className="gap-2"
        >
          <TestTube className="w-4 h-4" />
          {sendingTest ? 'Sending...' : 'Send Test'}
        </Button>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Receive notifications via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Master Email Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="email_enabled" className="text-base font-semibold">
                Enable Email Notifications
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Master switch for all email notifications
              </p>
            </div>
            <Switch
              id="email_enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
            />
          </div>

          <Separator />

          {/* Individual Email Preferences */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="email_invoice_approval">Invoice Approval Requests</Label>
                <p className="text-sm text-gray-500">When an invoice needs your approval</p>
              </div>
              <Switch
                id="email_invoice_approval"
                checked={preferences.email_invoice_approval}
                onCheckedChange={(checked) => updatePreference('email_invoice_approval', checked)}
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="email_invoice_approved">Invoice Approved</Label>
                <p className="text-sm text-gray-500">When your invoice is approved</p>
              </div>
              <Switch
                id="email_invoice_approved"
                checked={preferences.email_invoice_approved}
                onCheckedChange={(checked) => updatePreference('email_invoice_approved', checked)}
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="email_invoice_rejected">Invoice Rejected</Label>
                <p className="text-sm text-gray-500">When your invoice is rejected</p>
              </div>
              <Switch
                id="email_invoice_rejected"
                checked={preferences.email_invoice_rejected}
                onCheckedChange={(checked) => updatePreference('email_invoice_rejected', checked)}
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="email_invoice_paid">Invoice Paid</Label>
                <p className="text-sm text-gray-500">When an invoice is marked as paid</p>
              </div>
              <Switch
                id="email_invoice_paid"
                checked={preferences.email_invoice_paid}
                onCheckedChange={(checked) => updatePreference('email_invoice_paid', checked)}
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="email_team_invitation">Team Invitations</Label>
                <p className="text-sm text-gray-500">When you're invited to a team</p>
              </div>
              <Switch
                id="email_team_invitation"
                checked={preferences.email_team_invitation}
                onCheckedChange={(checked) => updatePreference('email_team_invitation', checked)}
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="email_delegation">Approval Delegation</Label>
                <p className="text-sm text-gray-500">When approval authority is delegated to you</p>
              </div>
              <Switch
                id="email_delegation"
                checked={preferences.email_delegation}
                onCheckedChange={(checked) => updatePreference('email_delegation', checked)}
                disabled={!preferences.email_enabled}
              />
            </div>
          </div>

          <Separator />

          {/* Digest Options */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700">Digest Options</h4>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="email_daily_digest">Daily Digest</Label>
                <p className="text-sm text-gray-500">Summary of all notifications once per day</p>
              </div>
              <Switch
                id="email_daily_digest"
                checked={preferences.email_daily_digest}
                onCheckedChange={(checked) => updatePreference('email_daily_digest', checked)}
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="email_weekly_summary">Weekly Summary</Label>
                <p className="text-sm text-gray-500">Summary of all notifications once per week</p>
              </div>
              <Switch
                id="email_weekly_summary"
                checked={preferences.email_weekly_summary}
                onCheckedChange={(checked) => updatePreference('email_weekly_summary', checked)}
                disabled={!preferences.email_enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <CardTitle>In-App Notifications</CardTitle>
          </div>
          <CardDescription>
            Receive notifications in the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Master In-App Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="inapp_enabled" className="text-base font-semibold">
                Enable In-App Notifications
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Master switch for all in-app notifications
              </p>
            </div>
            <Switch
              id="inapp_enabled"
              checked={preferences.inapp_enabled}
              onCheckedChange={(checked) => updatePreference('inapp_enabled', checked)}
            />
          </div>

          <Separator />

          {/* Individual In-App Preferences */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="inapp_invoice_approval">Invoice Approval Requests</Label>
                <p className="text-sm text-gray-500">When an invoice needs your approval</p>
              </div>
              <Switch
                id="inapp_invoice_approval"
                checked={preferences.inapp_invoice_approval}
                onCheckedChange={(checked) => updatePreference('inapp_invoice_approval', checked)}
                disabled={!preferences.inapp_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="inapp_invoice_approved">Invoice Approved</Label>
                <p className="text-sm text-gray-500">When your invoice is approved</p>
              </div>
              <Switch
                id="inapp_invoice_approved"
                checked={preferences.inapp_invoice_approved}
                onCheckedChange={(checked) => updatePreference('inapp_invoice_approved', checked)}
                disabled={!preferences.inapp_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="inapp_invoice_rejected">Invoice Rejected</Label>
                <p className="text-sm text-gray-500">When your invoice is rejected</p>
              </div>
              <Switch
                id="inapp_invoice_rejected"
                checked={preferences.inapp_invoice_rejected}
                onCheckedChange={(checked) => updatePreference('inapp_invoice_rejected', checked)}
                disabled={!preferences.inapp_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="inapp_invoice_paid">Invoice Paid</Label>
                <p className="text-sm text-gray-500">When an invoice is marked as paid</p>
              </div>
              <Switch
                id="inapp_invoice_paid"
                checked={preferences.inapp_invoice_paid}
                onCheckedChange={(checked) => updatePreference('inapp_invoice_paid', checked)}
                disabled={!preferences.inapp_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="inapp_team_invitation">Team Invitations</Label>
                <p className="text-sm text-gray-500">When you're invited to a team</p>
              </div>
              <Switch
                id="inapp_team_invitation"
                checked={preferences.inapp_team_invitation}
                onCheckedChange={(checked) => updatePreference('inapp_team_invitation', checked)}
                disabled={!preferences.inapp_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="inapp_delegation">Approval Delegation</Label>
                <p className="text-sm text-gray-500">When approval authority is delegated to you</p>
              </div>
              <Switch
                id="inapp_delegation"
                checked={preferences.inapp_delegation}
                onCheckedChange={(checked) => updatePreference('inapp_delegation', checked)}
                disabled={!preferences.inapp_enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <CardTitle>Quiet Hours</CardTitle>
          </div>
          <CardDescription>
            Set times when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="quiet_hours_enabled" className="text-base font-semibold">
                Enable Quiet Hours
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Pause notifications during specific hours
              </p>
            </div>
            <Switch
              id="quiet_hours_enabled"
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) => updatePreference('quiet_hours_enabled', checked)}
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiet_hours_start">Start Time</Label>
                  <Select
                    value={preferences.quiet_hours_start || '22:00'}
                    onValueChange={(value) => updatePreference('quiet_hours_start', value)}
                  >
                    <SelectTrigger id="quiet_hours_start">
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
                  <Label htmlFor="quiet_hours_end">End Time</Label>
                  <Select
                    value={preferences.quiet_hours_end || '08:00'}
                    onValueChange={(value) => updatePreference('quiet_hours_end', value)}
                  >
                    <SelectTrigger id="quiet_hours_end">
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
                <Label htmlFor="quiet_hours_timezone">Timezone</Label>
                <Select
                  value={preferences.quiet_hours_timezone}
                  onValueChange={(value) => updatePreference('quiet_hours_timezone', value)}
                >
                  <SelectTrigger id="quiet_hours_timezone">
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
        <div className="flex items-center justify-end gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 mr-auto">You have unsaved changes</p>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

