import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Bell, DollarSign, Wrench, Key, Settings, Send, Check, X, ChevronDown, User } from 'lucide-react';
import { toast } from "sonner";

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 'NOT001',
      type: 'payment_overdue',
      title: 'Payment Overdue - Lisa Wilson',
      message: 'Rent payment for Unit A202 is 5 days overdue. Amount: $1,500 + $75 late fee.',
      tenant: 'Lisa Wilson',
      unit: 'A202',
      timestamp: '2024-01-02 10:30:00',
      status: 'unread',
      priority: 'high',
      actions: ['Send Reminder', 'Revoke Access', 'Mark Resolved']
    },
    {
      id: 'NOT002',
      type: 'maintenance_urgent',
      title: 'Urgent Maintenance Request',
      message: 'High priority maintenance ticket MT002 - Broken Air Conditioning in Unit A201.',
      tenant: 'Michael Brown',
      unit: 'A201',
      timestamp: '2024-01-01 15:45:00',
      status: 'read',
      priority: 'high',
      actions: ['Assign Technician', 'View Ticket']
    },
    {
      id: 'NOT003',
      type: 'payment_due_soon',
      title: 'Payment Due Soon - Multiple Tenants',
      message: '3 rent payments are due within the next 3 days. Total amount: $4,800.',
      timestamp: '2024-01-01 09:00:00',
      status: 'read',
      priority: 'medium',
      actions: ['Send Reminders', 'View Details']
    },
    {
      id: 'NOT004',
      type: 'access_revoked',
      title: 'Access Automatically Revoked',
      message: 'Keycard access revoked for Lisa Wilson (A202) due to payment overdue.',
      tenant: 'Lisa Wilson',
      unit: 'A202',
      timestamp: '2023-12-28 23:59:00',
      status: 'read',
      priority: 'medium',
      actions: ['Restore Access', 'Contact Tenant']
    },
    {
      id: 'NOT005',
      type: 'payment_success',
      title: 'Payment Received',
      message: 'Rent payment received from Sarah Johnson (A101) - $1,200.',
      tenant: 'Sarah Johnson',
      unit: 'A101',
      timestamp: '2023-12-28 14:20:00',
      status: 'read',
      priority: 'low',
      actions: ['View Receipt']
    }
  ]);

  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      enabled: true,
      paymentReminders: true,
      maintenanceUpdates: true,
      accessControlAlerts: true,
      systemAlerts: true
    },
    sms: {
      enabled: true,
      urgentOnly: true,
      paymentOverdue: true,
      maintenanceUrgent: true,
      accessRevoked: false
    },
    push: {
      enabled: true,
      allNotifications: true,
      quietHours: { enabled: true, start: '22:00', end: '08:00' }
    }
  });

  const [templates, setTemplates] = useState([
    {
      id: 'payment_reminder',
      name: 'Payment Reminder',
      type: 'email',
      subject: 'Rent Payment Reminder - {{unit}}',
      body: 'Dear {{tenant_name}},\n\nThis is a friendly reminder that your rent payment of ₦{{amount}} for {{unit}} is due on {{due_date}}.\n\nYou can make your payment through:\n- Online portal: [Payment Link]\n- Mobile app\n- Bank transfer\n\nIf you have already made this payment, please disregard this message.\n\nBest regards,\nProperty Management Team'
    },
    {
      id: 'payment_overdue',
      name: 'Payment Overdue Notice',
      type: 'email',
      subject: 'URGENT: Overdue Rent Payment - {{unit}}',
      body: 'Dear {{tenant_name}},\n\nYour rent payment of ₦{{amount}} for {{unit}} was due on {{due_date}} and is now overdue.\n\nLate fee of ₦{{late_fee}} has been applied.\nTotal amount due: ₦{{total_amount}}\n\nPlease make payment immediately to avoid further action, including potential access restriction.\n\nContact us immediately if you\'re experiencing difficulties.\n\nProperty Management Team'
    },
    {
      id: 'maintenance_update',
      name: 'Maintenance Update',
      type: 'email',
      subject: 'Maintenance Update - {{unit}}',
      body: 'Dear {{tenant_name}},\n\nThis is to inform you about the status of your maintenance request #{{ticket_id}}.\n\nStatus: {{status}}\nScheduled Date: {{scheduled_date}}\n\nOur team will keep you updated on any changes. If you have any questions, please don\'t hesitate to contact us.\n\nThank you for your patience.\n\nProperty Management Team'
    }
  ]);

  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    recipient: '',
    type: 'email',
    subject: '',
    message: '',
    template: ''
  });
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const recipientDropdownRef = useRef<HTMLDivElement>(null);

  // Available recipients (in a real app, this would come from an API)
  const availableRecipients = [
    { id: 'all', name: 'All Tenants', unit: '' },
    { id: 'sarah', name: 'Sarah Johnson', unit: 'A101' },
    { id: 'michael', name: 'Michael Brown', unit: 'A201' },
    { id: 'lisa', name: 'Lisa Wilson', unit: 'A202' },
    { id: 'john', name: 'John Davis', unit: 'B101' },
    { id: 'emma', name: 'Emma Martinez', unit: 'B202' },
    { id: 'david', name: 'David Thompson', unit: 'C301' },
  ];

  // Filter recipients based on search term
  const filteredRecipients = availableRecipients.filter(recipient =>
    recipient.name.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
    recipient.unit.toLowerCase().includes(recipientSearchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recipientDropdownRef.current && !recipientDropdownRef.current.contains(event.target as Node)) {
        setShowRecipientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment_overdue':
      case 'payment_due_soon':
      case 'payment_success':
        return <DollarSign className="h-4 w-4" />;
      case 'maintenance_urgent':
      case 'maintenance_completed':
        return <Wrench className="h-4 w-4" />;
      case 'access_revoked':
      case 'access_restored':
        return <Key className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, status: 'read' } : n
    ));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
    toast.success('Notification deleted');
  };

  const sendNotification = () => {
    const recipientName = availableRecipients.find(r => r.id === composeData.recipient)?.name || 'recipient';
    toast.success(`${composeData.type.toUpperCase()} sent to ${recipientName}`);
    setShowCompose(false);
    setComposeData({ recipient: '', type: 'email', subject: '', message: '', template: '' });
    setRecipientSearchTerm('');
    setShowRecipientDropdown(false);
  };

  const handleComposeClose = (open: boolean) => {
    setShowCompose(open);
    if (!open) {
      setRecipientSearchTerm('');
      setShowRecipientDropdown(false);
      setComposeData({ recipient: '', type: 'email', subject: '', message: '', template: '' });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setComposeData({...composeData, template: templateId});
    
    if (templateId !== 'custom') {
      const selectedTemplate = templates.find(t => t.id === templateId);
      if (selectedTemplate) {
        setComposeData({
          ...composeData,
          template: templateId,
          subject: selectedTemplate.subject,
          message: selectedTemplate.body
        });
      }
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Notification Center</h2>
          <div className="text-gray-600 mt-1">
            Manage notifications and communication templates
            {unreadCount > 0 && (
              <Badge className="ml-2" variant="destructive">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Notification Settings</DialogTitle>
                <DialogDescription>
                  Configure how and when you receive notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Email Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Enable Email Notifications</Label>
                      <Switch
                        checked={notificationSettings.email.enabled}
                        onCheckedChange={(checked) => setNotificationSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, enabled: checked }
                        })}
                      />
                    </div>
                    {notificationSettings.email.enabled && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Payment Reminders</Label>
                          <Switch defaultChecked={notificationSettings.email.paymentReminders} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Maintenance Updates</Label>
                          <Switch defaultChecked={notificationSettings.email.maintenanceUpdates} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Access Control Alerts</Label>
                          <Switch defaultChecked={notificationSettings.email.accessControlAlerts} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">SMS Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Enable SMS Notifications</Label>
                      <Switch
                        checked={notificationSettings.sms.enabled}
                        onCheckedChange={(checked) => setNotificationSettings({
                          ...notificationSettings,
                          sms: { ...notificationSettings.sms, enabled: checked }
                        })}
                      />
                    </div>
                    {notificationSettings.sms.enabled && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Urgent Only</Label>
                          <Switch defaultChecked={notificationSettings.sms.urgentOnly} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Payment Overdue</Label>
                          <Switch defaultChecked={notificationSettings.sms.paymentOverdue} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCompose} onOpenChange={handleComposeClose}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Notification</DialogTitle>
                <DialogDescription>
                  Send a custom notification to tenants
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Recipient</Label>
                    <div className="relative" ref={recipientDropdownRef}>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search tenant by name or unit..."
                          value={recipientSearchTerm}
                          onChange={(e) => {
                            setRecipientSearchTerm(e.target.value);
                            setShowRecipientDropdown(true);
                          }}
                          onFocus={() => setShowRecipientDropdown(true)}
                          className="pl-10 pr-10"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      
                      {showRecipientDropdown && filteredRecipients.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredRecipients.map((recipient) => (
                            <button
                              key={recipient.id}
                              type="button"
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                              onClick={() => {
                                setComposeData({...composeData, recipient: recipient.id});
                                setRecipientSearchTerm(recipient.unit ? `${recipient.name} (${recipient.unit})` : recipient.name);
                                setShowRecipientDropdown(false);
                              }}
                            >
                              <span className="font-medium">{recipient.name}</span>
                              {recipient.unit && (
                                <span className="text-sm text-gray-500">{recipient.unit}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {composeData.recipient && (
                        <p className="text-xs text-gray-500 mt-1">
                          Selected: {availableRecipients.find(r => r.id === composeData.recipient)?.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select onValueChange={(value) => setComposeData({...composeData, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="push">Push Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Template (Optional)</Label>
                    {(composeData.subject || composeData.message) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setComposeData({...composeData, subject: '', message: '', template: ''})}
                        className="h-auto py-1 px-2 text-xs"
                      >
                        Clear Content
                      </Button>
                    )}
                  </div>
                  <Select value={composeData.template} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Message</SelectItem>
                      <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                      <SelectItem value="payment_overdue">Payment Overdue Notice</SelectItem>
                      <SelectItem value="maintenance_update">Maintenance Update</SelectItem>
                    </SelectContent>
                  </Select>
                  {composeData.template && composeData.template !== 'custom' && (
                    <p className="text-xs text-blue-600">
                      ✓ Template loaded. You can edit the content below.
                    </p>
                  )}
                </div>

                {composeData.type === 'email' && (
                  <div className="grid gap-2">
                    <Label>Subject</Label>
                    <Input
                      value={composeData.subject}
                      onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                      placeholder="Email subject"
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Message</Label>
                  <Textarea
                    value={composeData.message}
                    onChange={(e) => setComposeData({...composeData, message: e.target.value})}
                    placeholder="Your message..."
                    rows={5}
                  />
                  {composeData.template && composeData.template !== 'custom' && (
                    <p className="text-xs text-gray-500">
                      💡 Tip: Replace placeholders like {`{{tenant_name}}`}, {`{{unit}}`}, {`{{amount}}`} with actual values
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleComposeClose(false)}>
                  Cancel
                </Button>
                <Button onClick={sendNotification}>
                  Send Notification
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs" variant="destructive">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card key={notification.id} className={`${notification.status === 'unread' ? 'border-blue-200 bg-blue-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${
                        notification.priority === 'high' ? 'bg-red-100' :
                        notification.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                            {notification.priority}
                          </Badge>
                          {notification.status === 'unread' && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">{notification.timestamp}</p>
                          
                          <div className="flex space-x-2">
                            {notification.actions?.map((action, index) => (
                              <Button key={index} variant="outline" size="sm" className="text-xs">
                                {action}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1 ml-4">
                      {notification.status === 'unread' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>
                Pre-configured templates for common notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{template.type} Template</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500">Subject</Label>
                        <p className="text-sm font-mono bg-gray-50 p-2 rounded">{template.subject}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Body Preview</Label>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {template.body.split('\n')[0]}...
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                History of all sent notifications and their delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Notification history will appear here once notifications are sent.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
