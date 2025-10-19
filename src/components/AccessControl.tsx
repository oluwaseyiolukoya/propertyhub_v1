import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Shield, Key, Clock, AlertTriangle, CheckCircle, Settings, History, Plus, Play, Pause, RotateCcw, Search, Filter, X as XIcon } from 'lucide-react';
import { toast } from "sonner";

export const AccessControl = () => {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [tenantAccess, setTenantAccess] = useState([
    {
      id: 'ACC001',
      tenantName: 'Sarah Johnson',
      unit: 'A101',
      property: 'Sunset Apartments',
      propertyId: 'PROP001',
      cardId: 'CARD001',
      status: 'Active',
      lastAccess: '2024-01-02 14:30',
      paymentStatus: 'Current',
      accessExpiry: '2024-12-31',
      autoRevoke: true
    },
    {
      id: 'ACC002',
      tenantName: 'Michael Brown',
      unit: 'A201',
      property: 'Sunset Apartments',
      propertyId: 'PROP001',
      cardId: 'CARD002',
      status: 'Active',
      lastAccess: '2024-01-01 09:15',
      paymentStatus: 'Due Soon',
      accessExpiry: '2024-08-31',
      autoRevoke: true
    },
    {
      id: 'ACC003',
      tenantName: 'Lisa Wilson',
      unit: 'A202',
      property: 'Sunset Apartments',
      propertyId: 'PROP001',
      cardId: 'CARD003',
      status: 'Revoked',
      lastAccess: '2023-12-25 16:45',
      paymentStatus: 'Overdue',
      accessExpiry: '2025-02-28',
      autoRevoke: true,
      revokedDate: '2023-12-28',
      revokeReason: 'Payment Overdue'
    },
    {
      id: 'ACC004',
      tenantName: 'David Chen',
      unit: 'B301',
      property: 'Harbor View Condos',
      propertyId: 'PROP002',
      cardId: 'CARD004',
      status: 'Temporary',
      lastAccess: '2024-01-01 11:20',
      paymentStatus: 'Current',
      accessExpiry: '2024-01-07',
      autoRevoke: false,
      temporaryReason: 'Extended by PM'
    },
    {
      id: 'ACC005',
      tenantName: 'Emma Davis',
      unit: 'B101',
      property: 'Harbor View Condos',
      propertyId: 'PROP002',
      cardId: 'CARD005',
      status: 'Active',
      lastAccess: '2024-01-02 08:45',
      paymentStatus: 'Current',
      accessExpiry: '2024-11-30',
      autoRevoke: true
    },
    {
      id: 'ACC006',
      tenantName: 'James Miller',
      unit: 'C105',
      property: 'Downtown Lofts',
      propertyId: 'PROP003',
      cardId: 'CARD006',
      status: 'Active',
      lastAccess: '2024-01-01 18:20',
      paymentStatus: 'Current',
      accessExpiry: '2025-03-31',
      autoRevoke: true
    }
  ]);

  const [accessLogs, setAccessLogs] = useState([
    {
      id: 'LOG001',
      tenantName: 'Sarah Johnson',
      unit: 'A101',
      cardId: 'CARD001',
      action: 'Access Granted',
      timestamp: '2024-01-02 14:30:15',
      location: 'Main Entrance',
      result: 'Success'
    },
    {
      id: 'LOG002',
      tenantName: 'Lisa Wilson',
      unit: 'A202',
      cardId: 'CARD003',
      action: 'Access Denied',
      timestamp: '2024-01-02 10:15:30',
      location: 'Main Entrance',
      result: 'Failed - Card Revoked'
    },
    {
      id: 'LOG003',
      tenantName: 'Michael Brown',
      unit: 'A201',
      cardId: 'CARD002',
      action: 'Access Granted',
      timestamp: '2024-01-01 09:15:45',
      location: 'Building Entrance',
      result: 'Success'
    }
  ]);

  const [systemSettings, setSystemSettings] = useState({
    autoRevokeEnabled: true,
    revokeTime: '23:59',
    gracePeriod: 24, // hours
    webhookUrl: 'https://api.property-management.com/webhooks/access',
    integrationProvider: 'Kisi'
  });

  const [showExtendAccess, setShowExtendAccess] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [extensionData, setExtensionData] = useState({
    duration: '',
    reason: '',
    type: 'temporary'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Revoked': return 'destructive';
      case 'Temporary': return 'secondary';
      case 'Expired': return 'outline';
      default: return 'secondary';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Current': return 'default';
      case 'Due Soon': return 'secondary';
      case 'Overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const handleRevokeAccess = (tenantId: string, reason = 'Manual Revocation') => {
    setTenantAccess(tenantAccess.map(tenant =>
      tenant.id === tenantId
        ? {
            ...tenant,
            status: 'Revoked',
            revokedDate: new Date().toISOString().split('T')[0],
            revokeReason: reason
          }
        : tenant
    ));
    
    // Add to access logs
    const tenant = tenantAccess.find(t => t.id === tenantId);
    if (tenant) {
      const newLog = {
        id: `LOG${String(accessLogs.length + 1).padStart(3, '0')}`,
        tenantName: tenant.tenantName,
        unit: tenant.unit,
        cardId: tenant.cardId,
        action: 'Access Revoked',
        timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
        location: 'System',
        result: `Revoked - ${reason}`
      };
      setAccessLogs([newLog, ...accessLogs]);
    }
    
    toast.success(`Access revoked for ${tenant?.tenantName}`);
  };

  const handleRestoreAccess = (tenantId: string) => {
    setTenantAccess(tenantAccess.map(tenant =>
      tenant.id === tenantId
        ? {
            ...tenant,
            status: 'Active',
            revokedDate: undefined,
            revokeReason: undefined
          }
        : tenant
    ));
    
    const tenant = tenantAccess.find(t => t.id === tenantId);
    toast.success(`Access restored for ${tenant?.tenantName}`);
  };

  const handleExtendAccess = () => {
    if (!selectedTenant) return;
    
    const extendedDate = new Date();
    extendedDate.setDate(extendedDate.getDate() + parseInt(extensionData.duration));
    
    setTenantAccess(tenantAccess.map(tenant =>
      tenant.id === selectedTenant.id
        ? {
            ...tenant,
            status: extensionData.type === 'permanent' ? 'Active' : 'Temporary',
            accessExpiry: extendedDate.toISOString().split('T')[0],
            temporaryReason: extensionData.reason
          }
        : tenant
    ));
    
    toast.success(`Access extended for ${selectedTenant.tenantName}`);
    setShowExtendAccess(false);
    setSelectedTenant(null);
    setExtensionData({ duration: '', reason: '', type: 'temporary' });
  };

  // Get unique properties with keycard counts
  const properties = tenantAccess.reduce((acc, tenant) => {
    const existing = acc.find(p => p.id === tenant.propertyId);
    if (existing) {
      existing.totalKeycards++;
      if (tenant.status === 'Active') existing.activeKeycards++;
      if (tenant.status === 'Revoked') existing.revokedKeycards++;
    } else {
      acc.push({
        id: tenant.propertyId,
        name: tenant.property,
        totalKeycards: 1,
        activeKeycards: tenant.status === 'Active' ? 1 : 0,
        revokedKeycards: tenant.status === 'Revoked' ? 1 : 0
      });
    }
    return acc;
  }, [] as any[]);

  // Filter and search logic
  const filteredTenantAccess = tenantAccess.filter(tenant => {
    // Property filter
    if (propertyFilter !== 'all' && tenant.propertyId !== propertyFilter) return false;
    
    // Status filter
    if (statusFilter !== 'all' && tenant.status !== statusFilter) return false;
    
    // Payment status filter
    if (paymentStatusFilter !== 'all' && tenant.paymentStatus !== paymentStatusFilter) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      switch (searchBy) {
        case 'tenant':
          return tenant.tenantName.toLowerCase().includes(query);
        case 'unit':
          return tenant.unit.toLowerCase().includes(query);
        case 'cardId':
          return tenant.cardId.toLowerCase().includes(query);
        case 'all':
        default:
          return (
            tenant.tenantName.toLowerCase().includes(query) ||
            tenant.unit.toLowerCase().includes(query) ||
            tenant.cardId.toLowerCase().includes(query) ||
            tenant.property.toLowerCase().includes(query)
          );
      }
    }
    
    return true;
  });

  const filteredAccessLogs = accessLogs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      switch (searchBy) {
        case 'tenant':
          return log.tenantName.toLowerCase().includes(query);
        case 'unit':
          return log.unit.toLowerCase().includes(query);
        case 'cardId':
          return log.cardId.toLowerCase().includes(query);
        case 'location':
          return log.location.toLowerCase().includes(query);
        case 'all':
        default:
          return (
            log.tenantName.toLowerCase().includes(query) ||
            log.unit.toLowerCase().includes(query) ||
            log.cardId.toLowerCase().includes(query) ||
            log.location.toLowerCase().includes(query) ||
            log.action.toLowerCase().includes(query)
          );
      }
    }
    return true;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSearchBy('all');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setPropertyFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || paymentStatusFilter !== 'all' || propertyFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Access Control</h2>
          <p className="text-gray-600 mt-1">Manage keycard access and automated payment-based revocation</p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Access Control Settings</DialogTitle>
                <DialogDescription>
                  Configure automatic access revocation and integration settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Auto-Revoke on Payment Due</Label>
                      <p className="text-sm text-gray-500">Automatically revoke access when payment is overdue</p>
                    </div>
                    <Switch
                      checked={systemSettings.autoRevokeEnabled}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, autoRevokeEnabled: checked})}
                    />
                  </div>

                  {systemSettings.autoRevokeEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Revoke Time</Label>
                        <Input
                          type="time"
                          value={systemSettings.revokeTime}
                          onChange={(e) => setSystemSettings({...systemSettings, revokeTime: e.target.value})}
                        />
                        <p className="text-xs text-gray-500">Time to revoke access on due date</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Grace Period (hours)</Label>
                        <Input
                          type="number"
                          value={systemSettings.gracePeriod}
                          onChange={(e) => setSystemSettings({...systemSettings, gracePeriod: parseInt(e.target.value)})}
                        />
                        <p className="text-xs text-gray-500">Additional time before revocation</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-base">Integration Settings</Label>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Access Control Provider</Label>
                      <Select
                        value={systemSettings.integrationProvider}
                        onValueChange={(value) => setSystemSettings({...systemSettings, integrationProvider: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kisi">Kisi</SelectItem>
                          <SelectItem value="Brivo">Brivo</SelectItem>
                          <SelectItem value="HID">HID/Salto</SelectItem>
                          <SelectItem value="Custom">Custom Webhook</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input
                        value={systemSettings.webhookUrl}
                        onChange={(e) => setSystemSettings({...systemSettings, webhookUrl: e.target.value})}
                        placeholder="https://api.your-system.com/webhooks/access"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Access</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{tenantAccess.filter(t => t.status === 'Active').length}</div>
            <p className="text-xs text-muted-foreground">
              Cards with active access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revoked Access</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{tenantAccess.filter(t => t.status === 'Revoked').length}</div>
            <p className="text-xs text-muted-foreground">
              Due to payment issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temporary Access</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-600">{tenantAccess.filter(t => t.status === 'Temporary').length}</div>
            <p className="text-xs text-muted-foreground">
              Extended by PM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integration Status</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              {systemSettings.integrationProvider} connected
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="access" className="space-y-4">
        <TabsList>
          <TabsTrigger value="access">Access Management</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tenant Access Status</CardTitle>
                    <CardDescription>
                      Manage keycard access for all tenants with payment-based automation
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                </div>

                {/* Search and Filter Section */}
                <div className="space-y-3">
                  {/* Search Bar */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search tenants, units, or card IDs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Select value={searchBy} onValueChange={setSearchBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fields</SelectItem>
                        <SelectItem value="tenant">Tenant Name</SelectItem>
                        <SelectItem value="unit">Unit Number</SelectItem>
                        <SelectItem value="cardId">Card ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Advanced Filters */}
                  {showFilters && (
                    <div className="space-y-3">
                      <div className="flex gap-2 items-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs">Property</Label>
                          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Properties</SelectItem>
                              {properties.map(property => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.name} ({property.totalKeycards} keycards)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1 space-y-2">
                          <Label className="text-xs">Access Status</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Revoked">Revoked</SelectItem>
                              <SelectItem value="Temporary">Temporary</SelectItem>
                              <SelectItem value="Expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1 space-y-2">
                          <Label className="text-xs">Payment Status</Label>
                          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="Current">Current</SelectItem>
                              <SelectItem value="Due Soon">Due Soon</SelectItem>
                              <SelectItem value="Overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="mt-6"
                          >
                            <XIcon className="h-4 w-4 mr-2" />
                            Clear All
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Results Summary */}
                  {hasActiveFilters && (
                    <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                      <span className="text-gray-600">
                        Showing {filteredTenantAccess.length} of {tenantAccess.length} results
                      </span>
                      <div className="flex items-center gap-3">
                        {propertyFilter !== 'all' && (
                          <span className="text-gray-500">
                            Property: <span className="font-medium">{properties.find(p => p.id === propertyFilter)?.name}</span>
                          </span>
                        )}
                        {searchQuery && (
                          <span className="text-gray-500">
                            Searching by: <span className="font-medium">{searchBy === 'all' ? 'All Fields' : searchBy}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Card ID</TableHead>
                      <TableHead>Access Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Last Access</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Auto-Revoke</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenantAccess.length > 0 ? (
                      filteredTenantAccess.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tenant.tenantName}</p>
                            <p className="text-sm text-gray-500">{tenant.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{tenant.property}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{tenant.cardId}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(tenant.status)}>
                            {tenant.status}
                          </Badge>
                          {tenant.status === 'Revoked' && tenant.revokeReason && (
                            <p className="text-xs text-gray-500 mt-1">{tenant.revokeReason}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusColor(tenant.paymentStatus)}>
                            {tenant.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{tenant.lastAccess}</TableCell>
                        <TableCell className="text-sm">{tenant.accessExpiry}</TableCell>
                        <TableCell>
                          <Switch
                            checked={tenant.autoRevoke}
                            disabled={tenant.status === 'Revoked'}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {tenant.status === 'Active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeAccess(tenant.id, 'Manual Revocation')}
                              >
                                <Pause className="h-3 w-3 mr-1" />
                                Revoke
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreAccess(tenant.id)}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Restore
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setShowExtendAccess(true);
                              }}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Extend
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          No results found matching your search criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4">
                <div>
                  <CardTitle>Access Logs</CardTitle>
                  <CardDescription>
                    Audit trail of all access control changes and entry attempts
                  </CardDescription>
                </div>

                {/* Search Bar for Logs */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search logs by tenant, unit, card ID, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Select value={searchBy} onValueChange={setSearchBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fields</SelectItem>
                      <SelectItem value="tenant">Tenant Name</SelectItem>
                      <SelectItem value="unit">Unit Number</SelectItem>
                      <SelectItem value="cardId">Card ID</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Results Summary for Logs */}
                {searchQuery && (
                  <div className="text-sm text-gray-600">
                    Showing {filteredAccessLogs.length} of {accessLogs.length} log entries
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Card ID</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccessLogs.length > 0 ? (
                      filteredAccessLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.tenantName}</p>
                            <p className="text-sm text-gray-500">{log.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{log.cardId}</code>
                        </TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.location}</TableCell>
                        <TableCell>
                          <Badge variant={log.result.includes('Success') ? 'default' : 'destructive'}>
                            {log.result}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No log entries found matching your search criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>
                Configure automatic access control based on payment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">Payment Due Date Rule</h4>
                      <p className="text-sm text-gray-500">Automatically revoke access when payment is overdue</p>
                    </div>
                    <Switch checked={systemSettings.autoRevokeEnabled} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Trigger:</span> Payment due date passed
                    </div>
                    <div>
                      <span className="font-medium">Action:</span> Revoke keycard access
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> {systemSettings.revokeTime} on due date
                    </div>
                    <div>
                      <span className="font-medium">Restore:</span> On successful payment
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">Grace Period Extension</h4>
                      <p className="text-sm text-gray-500">Allow additional time before automatic revocation</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span> {systemSettings.gracePeriod} hours
                    </div>
                    <div>
                      <span className="font-medium">Notification:</span> Send warning to tenant
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">Lease Expiration Rule</h4>
                      <p className="text-sm text-gray-500">Automatically revoke access when lease expires</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Trigger:</span> Lease end date reached
                    </div>
                    <div>
                      <span className="font-medium">Action:</span> Revoke access at midnight
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Extend Access Dialog */}
      <Dialog open={showExtendAccess} onOpenChange={setShowExtendAccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Access</DialogTitle>
            <DialogDescription>
              Extend or override access for {selectedTenant?.tenantName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Extension Type</Label>
              <Select
                value={extensionData.type}
                onValueChange={(value) => setExtensionData({...extensionData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary Extension</SelectItem>
                  <SelectItem value="permanent">Permanent Override</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Duration (days)</Label>
              <Input
                type="number"
                value={extensionData.duration}
                onChange={(e) => setExtensionData({...extensionData, duration: e.target.value})}
                placeholder="7"
              />
            </div>

            <div className="grid gap-2">
              <Label>Reason for Extension</Label>
              <Textarea
                value={extensionData.reason}
                onChange={(e) => setExtensionData({...extensionData, reason: e.target.value})}
                placeholder="Explain why access is being extended..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowExtendAccess(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtendAccess}>
              Extend Access
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

