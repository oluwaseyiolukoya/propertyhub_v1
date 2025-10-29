import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {
  Key,
  ClipboardList,
  FileText,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  LogOut,
  LogIn,
  Shield,
  Lock,
  AlertCircle,
  Download,
  MoreHorizontal,
  Info
} from 'lucide-react';
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import {
  PropertyKey,
  PropertyKeyTransaction,
  KeyStats,
  getPropertyKeys,
  createPropertyKey,
  issuePropertyKey,
  returnPropertyKey,
  reportLostPropertyKey,
  getPropertyKeyStats,
  getPropertyKeyTransactions
} from '../lib/api/access-control';
import { getProperties, Property } from '../lib/api/properties';
import { getUnits, getUnit } from '../lib/api/units';
import { formatCurrency } from '../lib/currency';

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Issued', value: 'issued' },
  { label: 'Available', value: 'available' },
  { label: 'Lost', value: 'lost' },
  { label: 'Damaged', value: 'damaged' },
];

const KEY_TYPE_OPTIONS = [
  { label: 'All Types', value: 'all' },
  { label: 'Unit', value: 'Unit' },
  { label: 'Master', value: 'Master' },
  { label: 'Common Area', value: 'Common Area' },
  { label: 'Emergency', value: 'Emergency' },
  { label: 'Gate', value: 'Gate' },
];

const PERSON_TYPE_OPTIONS = ['Tenant', 'Owner', 'Manager', 'Contractor', 'Staff'];

const prettifyStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

export const AccessControl = () => {
  const [keys, setKeys] = useState<PropertyKey[]>([]);
  const [transactions, setTransactions] = useState<PropertyKeyTransaction[]>([]);
  const [stats, setStats] = useState<KeyStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnitActiveTenant, setSelectedUnitActiveTenant] = useState<any | null>(null);
  const [issueKeyTenant, setIssueKeyTenant] = useState<any | null>(null);

  const [loadingKeys, setLoadingKeys] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [processingIssue, setProcessingIssue] = useState(false);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [processingLost, setProcessingLost] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'keys' | 'custody' | 'compliance'>('keys');

  const [showAddKeyPage, setShowAddKeyPage] = useState(false);
  const [showIssueKeyPage, setShowIssueKeyPage] = useState(false);
  const [showReturnKey, setShowReturnKey] = useState(false);
  const [showReportLost, setShowReportLost] = useState(false);

  const [selectedKey, setSelectedKey] = useState<PropertyKey | null>(null);

  const [newKeyForm, setNewKeyForm] = useState({
    keyNumber: '',
    keyLabel: '',
    keyType: 'Unit',
    propertyId: '',
    unitId: '',
    numberOfCopies: '1',
    location: 'Key Cabinet - Office',
    notes: ''
  });

  const [issueKeyForm, setIssueKeyForm] = useState({
    keyId: '',
    issuedTo: '',
    issuedToType: 'Tenant',
    expectedReturnDate: '',
    depositAmount: '',
    notes: ''
  });

  const [returnKeyForm, setReturnKeyForm] = useState({
    condition: 'Good',
    refundDeposit: true,
    refundAmount: '',
    notes: ''
  });

  const [lostKeyForm, setLostKeyForm] = useState({
    reportedBy: '',
    lostDate: '',
    circumstances: '',
    policeReportNumber: '',
    replaceLock: true
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadProperties = useCallback(async () => {
    const response = await getProperties();
    if (response.error) {
      console.error('Failed to load properties:', response.error);
      return;
    }
    const data = response.data || [];
    setProperties(data);
    if (!newKeyForm.propertyId && data.length > 0) {
      setNewKeyForm((prev) => ({ ...prev, propertyId: data[0].id }));
    }
  }, [newKeyForm.propertyId]);

  const loadUnitsForProperty = useCallback(async (propertyId: string) => {
    if (!propertyId) {
      setUnits([]);
      return;
    }
    const response = await getUnits({ propertyId });
    if (response.error) {
      console.error('Failed to load units:', response.error);
      setUnits([]);
      return;
    }
    setUnits(response.data || []);
  }, []);

  const loadKeys = useCallback(async () => {
    setLoadingKeys(true);
    const params: any = {};
    if (propertyFilter !== 'all') params.propertyId = propertyFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter !== 'all') params.type = typeFilter;
    if (debouncedSearch) params.search = debouncedSearch;

    const response = await getPropertyKeys(params);
    if (response.error) {
      console.error('Failed to load keys:', response.error);
      toast.error(response.error.error || 'Failed to load keys');
      setKeys([]);
    } else {
      setKeys(response.data || []);
    }
    setLoadingKeys(false);
  }, [debouncedSearch, propertyFilter, statusFilter, typeFilter]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    const params = propertyFilter !== 'all' ? { propertyId: propertyFilter } : undefined;
    const response = await getPropertyKeyStats(params);
    if (response.error) {
      console.error('Failed to load key stats:', response.error);
      toast.error(response.error.error || 'Failed to load key statistics');
      setStats(null);
    } else {
      setStats(response.data || null);
    }
    setLoadingStats(false);
  }, [propertyFilter]);

  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    const params: any = { limit: 100 };
    if (debouncedSearch) params.search = debouncedSearch;
    const response = await getPropertyKeyTransactions(params);
    if (response.error) {
      console.error('Failed to load key transactions:', response.error);
      toast.error(response.error.error || 'Failed to load transactions');
      setTransactions([]);
    } else {
      setTransactions(response.data || []);
    }
    setLoadingTransactions(false);
  }, [debouncedSearch]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (newKeyForm.propertyId) {
      loadUnitsForProperty(newKeyForm.propertyId);
    }
  }, [newKeyForm.propertyId, loadUnitsForProperty]);

  // Load unit details and active tenant when a unit is selected
  useEffect(() => {
    const fetchUnitDetails = async () => {
      setSelectedUnitActiveTenant(null);
      const unitId = newKeyForm.unitId;
      if (!unitId || unitId === 'none') return;
      const response = await getUnit(unitId);
      if (response.error) {
        console.error('Failed to load unit details:', response.error);
        return;
      }
      const unit = response.data;
      // Find active tenant from leases
      const activeLease = Array.isArray(unit?.leases)
        ? unit.leases.find((l: any) => l.status?.toLowerCase?.() === 'active') || unit.leases[0]
        : null;
      const tenant = activeLease?.users || activeLease?.tenant || null;
      if (tenant) setSelectedUnitActiveTenant(tenant);
    };
    fetchUnitDetails();
  }, [newKeyForm.unitId]);

  // Load assigned tenant for the unit of the selected key in Issue Key page
  useEffect(() => {
    const loadIssueKeyTenant = async () => {
      setIssueKeyTenant(null);
      const selKeyId = issueKeyForm.keyId;
      if (!selKeyId) return;
      const key = keys.find((k) => k.id === selKeyId);
      const unitId = key?.unit?.id;
      if (!unitId) return;
      const response = await getUnit(unitId);
      if (response.error) {
        console.error('Failed to load unit for issue key:', response.error);
        return;
      }
      const unit = response.data;
      const activeLease = Array.isArray(unit?.leases)
        ? unit.leases.find((l: any) => l.status?.toLowerCase?.() === 'active') || unit.leases[0]
        : null;
      const tenant = activeLease?.users || activeLease?.tenant || null;
      if (tenant) setIssueKeyTenant(tenant);
    };
    loadIssueKeyTenant();
  }, [issueKeyForm.keyId, keys]);

  const refreshData = useCallback(async () => {
    await Promise.all([loadKeys(), loadStats(), loadTransactions()]);
  }, [loadKeys, loadStats, loadTransactions]);

  const propertyOptions = useMemo(() => {
    if (properties.length > 0) return properties;
    const uniqueFromKeys = keys
      .map((key) => key.property)
      .filter((prop): prop is PropertyKey['property'] => Boolean(prop?.id && prop?.name))
      .map((prop) => ({ id: prop!.id, name: prop!.name }))
      .filter((value, index, self) => self.findIndex((v) => v.id === value.id) === index);
    return uniqueFromKeys as Property[];
  }, [keys, properties]);

  const statsReady = Boolean(stats) && !loadingStats;
  const totalKeys = stats?.totalKeys ?? 0;
  const issuedKeys = stats?.issuedKeys ?? 0;
  const availableKeys = stats?.availableKeys ?? 0;
  const lostKeys = stats?.lostKeys ?? 0;
  const depositHeld = stats?.depositHeld ?? 0;

  const handleAddKey = async () => {
    if (!newKeyForm.keyNumber || !newKeyForm.propertyId) {
      toast.error('Please provide a key number and property');
      return;
    }

    setSavingKey(true);
    const payload = {
      keyNumber: newKeyForm.keyNumber.trim(),
      keyLabel: newKeyForm.keyLabel || undefined,
      keyType: newKeyForm.keyType,
      propertyId: newKeyForm.propertyId,
      unitId: newKeyForm.unitId && newKeyForm.unitId !== 'none' ? newKeyForm.unitId : undefined,
      numberOfCopies: Number(newKeyForm.numberOfCopies) || 1,
      location: newKeyForm.location,
      notes: newKeyForm.notes || undefined
    };

    const response = await createPropertyKey(payload);
    setSavingKey(false);
    if (response.error) {
      console.error('Failed to create key:', response.error);
      toast.error(response.error.error || 'Failed to create key');
      return;
    }

    toast.success(`Key ${response.data?.keyNumber} added to inventory`);
    setShowAddKeyPage(false);
    setNewKeyForm({
      keyNumber: '',
      keyLabel: '',
      keyType: 'Unit',
      propertyId: propertyOptions[0]?.id || '',
      unitId: '',
      numberOfCopies: '1',
      location: 'Key Cabinet - Office',
      notes: ''
    });
    refreshData();
  };

  const handleIssueKey = async () => {
    if (!issueKeyForm.keyId || !issueKeyForm.issuedTo) {
      toast.error('Please select a key and person');
      return;
    }

    setProcessingIssue(true);
    const response = await issuePropertyKey(issueKeyForm.keyId, {
      issuedTo: issueKeyForm.issuedTo,
      issuedToType: issueKeyForm.issuedToType,
      expectedReturnDate: issueKeyForm.expectedReturnDate || undefined,
      notes: issueKeyForm.notes || undefined
    });
    setProcessingIssue(false);

    if (response.error) {
      console.error('Failed to issue key:', response.error);
      toast.error(response.error.error || 'Failed to issue key');
      return;
    }

    toast.success(`Key ${response.data?.keyNumber} issued to ${issueKeyForm.issuedTo}`);
    setShowIssueKeyPage(false);
    setIssueKeyForm({
      keyId: '',
      issuedTo: '',
      issuedToType: 'Tenant',
      expectedReturnDate: '',
      depositAmount: '',
      notes: ''
    });
    refreshData();
  };

  const handleReturnKey = async () => {
    if (!selectedKey) return;

    setProcessingReturn(true);
    const response = await returnPropertyKey(selectedKey.id, {
      condition: returnKeyForm.condition,
      refundDeposit: returnKeyForm.refundDeposit,
      refundAmount: (returnKeyForm.refundDeposit && returnKeyForm.condition === 'Fair' && returnKeyForm.refundAmount)
        ? Number(returnKeyForm.refundAmount)
        : undefined,
      notes: returnKeyForm.notes || undefined
    });
    setProcessingReturn(false);

    if (response.error) {
      console.error('Failed to process return:', response.error);
      toast.error(response.error.error || 'Failed to process return');
      return;
    }

    toast.success('Key return recorded successfully');
    setShowReturnKey(false);
    setSelectedKey(null);
    setReturnKeyForm({ condition: 'Good', refundDeposit: true, refundAmount: '', notes: '' });
    refreshData();
  };

  const handleReportLost = async () => {
    if (!selectedKey) return;
    if (!lostKeyForm.reportedBy || !lostKeyForm.lostDate) {
      toast.error('Please provide the reporter and lost date');
      return;
    }

    setProcessingLost(true);
    const response = await reportLostPropertyKey(selectedKey.id, {
      reportedBy: lostKeyForm.reportedBy,
      lostDate: lostKeyForm.lostDate,
      circumstances: lostKeyForm.circumstances || undefined,
      policeReportNumber: lostKeyForm.policeReportNumber || undefined,
      replaceLock: lostKeyForm.replaceLock
    });
    setProcessingLost(false);

    if (response.error) {
      console.error('Failed to report lost key:', response.error);
      toast.error(response.error.error || 'Failed to report lost key');
      return;
    }

    toast.error(`Key ${response.data?.keyNumber} reported lost`);
    setShowReportLost(false);
    setSelectedKey(null);
    setLostKeyForm({ reportedBy: '', lostDate: '', circumstances: '', policeReportNumber: '', replaceLock: true });
    refreshData();
  };

  const openIssueDialog = (key?: PropertyKey) => {
    setSelectedKey(key || null);
    setIssueKeyForm((prev) => ({
      ...prev,
      keyId: key?.id || prev.keyId
    }));
    setShowIssueKeyPage(true);
  };

  const openReturnDialog = (key: PropertyKey) => {
    setSelectedKey(key);
    setReturnKeyForm({ condition: 'Good', refundDeposit: true, refundAmount: '', notes: '' });
    setShowReturnKey(true);
  };

  const openLostDialog = (key: PropertyKey) => {
    setSelectedKey(key);
    setLostKeyForm({
      reportedBy: key.issuedToName || '',
      lostDate: new Date().toISOString().split('T')[0],
      circumstances: '',
      policeReportNumber: '',
      replaceLock: true
    });
    setShowReportLost(true);
  };

  const renderStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'issued') return <Badge variant="default">Issued</Badge>;
    if (normalized === 'available') return <Badge variant="secondary">Available</Badge>;
    if (normalized === 'lost') return <Badge variant="destructive">Lost</Badge>;
    if (normalized === 'damaged') return <Badge variant="outline">Damaged</Badge>;
    return <Badge variant="outline">{prettifyStatus(status)}</Badge>;
  };

  const displayedKeys = keys;
  const displayedTransactions = transactions;

  // If "Issue Key" page is open, render it as an in-page form
  if (showIssueKeyPage) {
  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowIssueKeyPage(false)}>
            ← Back to Key Inventory
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Issue Key</CardTitle>
            <CardDescription>Capture handover details for custody tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 max-w-2xl">
              <div className="space-y-2">
                <Label>Select Key *</Label>
                <Select
                  value={issueKeyForm.keyId}
                  onValueChange={(value) => setIssueKeyForm((prev) => ({ ...prev, keyId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a key" />
                  </SelectTrigger>
                  <SelectContent>
                    {keys
                      .filter((k) => k.status.toLowerCase() !== 'issued')
                      .map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.keyNumber} · {k.property?.name ?? 'Unknown'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {/* Assigned tenant preview */}
                {issueKeyForm.keyId && (
                  <div className="mt-3 p-3 border rounded-md bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Assigned Tenant</p>
                    {issueKeyTenant ? (
                      <div className="text-sm">
                        <p className="font-medium">{issueKeyTenant.name}</p>
                        <p className="text-xs text-muted-foreground">{issueKeyTenant.email || issueKeyTenant.phone || '—'}</p>
                    </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No active tenant found for this unit</p>
                    )}
                  </div>
                )}
                    </div>

              <div className="space-y-2">
                <Label>Issued To (Full Name) *</Label>
                <Input
                  value={issueKeyForm.issuedTo}
                  onChange={(e) => setIssueKeyForm((prev) => ({ ...prev, issuedTo: e.target.value }))}
                  placeholder="Enter full name as on ID"
                    />
                  </div>

              <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                  <Label>Person Type *</Label>
                  <Select
                    value={issueKeyForm.issuedToType}
                    onValueChange={(value) => setIssueKeyForm((prev) => ({ ...prev, issuedToType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERSON_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expected Return</Label>
                        <Input
                    type="date"
                    value={issueKeyForm.expectedReturnDate}
                    onChange={(e) => setIssueKeyForm((prev) => ({ ...prev, expectedReturnDate: e.target.value }))}
                  />
                      </div>
              </div>

              {/* Deposit removed by request */}

                      <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={issueKeyForm.notes}
                  onChange={(e) => setIssueKeyForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Any special conditions or remarks..."
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Ensure government-issued ID is verified before key issuance. Witness signature is mandatory for audit compliance.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowIssueKeyPage(false)}>
                  Cancel
                </Button>
                <Button onClick={handleIssueKey} disabled={processingIssue}>
                  {processingIssue ? 'Issuing...' : 'Issue Key'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If "Add New Key" page is open, show only that page
  if (showAddKeyPage) {
  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowAddKeyPage(false)}>
            ← Back to Key Inventory
              </Button>
                  </div>

        <Card>
          <CardHeader>
            <CardTitle>Register New Key</CardTitle>
            <CardDescription>Add a new physical key to the inventory management system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 max-w-3xl">
              <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                  <Label>Key Number *</Label>
                        <Input
                    value={newKeyForm.keyNumber}
                    onChange={(e) => setNewKeyForm((prev) => ({ ...prev, keyNumber: e.target.value }))}
                    placeholder="e.g. SUN-A101-01"
                  />
                  <p className="text-xs text-muted-foreground">Format: PROPERTY-UNIT-NUMBER</p>
                      </div>
                      <div className="space-y-2">
                  <Label>Key Label (Optional)</Label>
                        <Input
                    value={newKeyForm.keyLabel}
                    onChange={(e) => setNewKeyForm((prev) => ({ ...prev, keyLabel: e.target.value }))}
                    placeholder="e.g. Front Door, Back Entrance"
                  />
                    </div>
                </div>

              <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                  <Label>Key Type *</Label>
                      <Select
                    value={newKeyForm.keyType}
                    onValueChange={(value) => setNewKeyForm((prev) => ({ ...prev, keyType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                      {KEY_TYPE_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                  <Label>Property *</Label>
                  <Select
                    value={newKeyForm.propertyId}
                    onValueChange={(value) => {
                      setNewKeyForm((prev) => ({ ...prev, propertyId: value, unitId: '' }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyOptions.map((property) => (
                        <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit (Optional)</Label>
                  <Select
                    value={newKeyForm.unitId}
                    onValueChange={(value) => setNewKeyForm((prev) => ({ ...prev, unitId: value }))}
                    disabled={!newKeyForm.propertyId || units.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={units.length === 0 ? 'No units available' : 'Select unit'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Common Key)</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          Unit {unit.unitNumber} - {unit.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {!newKeyForm.propertyId
                      ? 'Select a property first'
                      : units.length === 0
                      ? 'No units found for this property'
                      : `${units.length} unit(s) available`}
                  </p>

                  {/* Active tenant preview */}
                  {newKeyForm.unitId && newKeyForm.unitId !== 'none' && (
                    <div className="mt-3 p-3 border rounded-md bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Active Tenant</p>
                      {selectedUnitActiveTenant ? (
                        <div className="text-sm">
                          <p className="font-medium">{selectedUnitActiveTenant.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedUnitActiveTenant.email || selectedUnitActiveTenant.phone || '—'}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No active tenant found for this unit</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Number of Copies</Label>
                      <Input
                    type="number"
                    min={1}
                    max={10}
                    value={newKeyForm.numberOfCopies}
                    onChange={(e) => setNewKeyForm((prev) => ({ ...prev, numberOfCopies: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum 2 copies for unit keys</p>
                    </div>
                  </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Storage Location *</Label>
                  <Input
                    value={newKeyForm.location}
                    onChange={(e) => setNewKeyForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Key Cabinet - Office"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={newKeyForm.notes}
                    onChange={(e) => setNewKeyForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional information"
                  />
              </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Best Practice:</strong> Assign unique key numbers for tracking. Include property code, unit number, and copy number (e.g., SUN-A101-01 for Sunset Apartments, Unit A101, Copy 1).
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddKeyPage(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddKey} disabled={savingKey}>
                  {savingKey ? 'Registering...' : 'Add to Inventory'}
                </Button>
        </div>
      </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Key Management</h2>
          <p className="text-gray-600 mt-1">Track physical keys, custody chain, and compliance documentation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info('Custody log exported')}>
            <Download className="h-4 w-4 mr-2" />
            Export Log
              </Button>
          <Button
            onClick={() => {
              if (!newKeyForm.propertyId && propertyOptions.length > 0) {
                setNewKeyForm((prev) => ({ ...prev, propertyId: propertyOptions[0].id }));
              }
              setShowAddKeyPage(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Key
          </Button>
                    </div>
                  </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Compliance:</strong> Every issuance, return, and lost-report is logged with witnesses for audit trails. Maintain a physical register as a secondary backup in line with regulatory requirements.
        </AlertDescription>
      </Alert>

      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Total number of physical keys registered in the inventory system across all properties and units.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Key className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{loadingStats ? '—' : totalKeys}</div>
              <p className="text-xs text-muted-foreground">In inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Keys Issued</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Number of keys currently issued to tenants, managers, contractors, or other authorized personnel. These keys are actively in use.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <LogOut className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-blue-600">{loadingStats ? '—' : issuedKeys}</div>
              <p className="text-xs text-muted-foreground">Currently out</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Keys stored in the key cabinet or office that are ready to be issued. These keys are not currently assigned to anyone.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-green-600">{loadingStats ? '—' : availableKeys}</div>
              <p className="text-xs text-muted-foreground">Ready for issuance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Lost / Damaged</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Keys reported as lost or damaged. These require immediate follow-up including lock replacement, police reports, and deposit forfeiture.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-red-600">{loadingStats ? '—' : lostKeys}</div>
              <p className="text-xs text-muted-foreground">Require follow-up</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Deposits Held</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Total security deposits collected for issued keys that have not been refunded. Deposits are refundable upon key return in good condition.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Lock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-purple-600">
                {statsReady ? formatCurrency(depositHeld, 'NGN') : '—'}
              </div>
              <p className="text-xs text-muted-foreground">Refundable security</p>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">Key Inventory</TabsTrigger>
          <TabsTrigger value="custody">Custody Chain</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                  <CardTitle>Key Inventory Register</CardTitle>
                  <CardDescription>Real-time view of all physical keys and their status</CardDescription>
                  </div>
                <Button onClick={() => openIssueDialog()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Issue Key
                  </Button>
                </div>

              <div className="flex flex-col md:flex-row gap-3 mt-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                    placeholder="Search keys, properties, or person names..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                    </div>
                          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All properties" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Properties</SelectItem>
                    {propertyOptions.map((property) => (
                      <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Key type" />
                            </SelectTrigger>
                            <SelectContent>
                    {KEY_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                            </SelectContent>
                          </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                            </SelectContent>
                          </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Property / Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Holder</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Deposit</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingKeys ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          Loading keys...
                        </TableCell>
                      </TableRow>
                    ) : displayedKeys.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No keys match the current filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedKeys.map((key) => (
                        <TableRow key={key.id}>
                        <TableCell>
                            <div className="flex flex-col">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{key.keyNumber}</code>
                              {key.keyLabel && <span className="text-xs text-gray-500 mt-1">{key.keyLabel}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">{key.keyType}</Badge>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{key.property?.name ?? '—'}</p>
                              {key.unit?.unitNumber && (
                                <p className="text-xs text-muted-foreground">Unit {key.unit.unitNumber}</p>
                              )}
                            </div>
                        </TableCell>
                          <TableCell>{renderStatusBadge(key.status)}</TableCell>
                        <TableCell>
                            {key.issuedToName ? (
                              <div className="text-sm">
                                <p className="font-medium">{key.issuedToName}</p>
                                {key.issuedToType && (
                                  <p className="text-xs text-muted-foreground">{key.issuedToType}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                        </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(key.issuedDate)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(key.expectedReturnDate)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {typeof key.depositAmount === 'number'
                              ? formatCurrency(key.depositAmount, key.depositCurrency || 'NGN')
                              : '—'}
                        </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{key.location || '—'}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openIssueDialog(key)} disabled={processingIssue || key.status.toLowerCase() === 'issued'}>
                                  <LogOut className="h-4 w-4 mr-2" />
                                  Issue Key
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openReturnDialog(key)} disabled={processingReturn || key.status.toLowerCase() !== 'issued'}>
                                  <LogIn className="h-4 w-4 mr-2" />
                                  Mark Returned
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openLostDialog(key)}
                                  disabled={processingLost || key.status.toLowerCase() === 'lost'}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Report Lost
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custody" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Custody Chain</CardTitle>
              <CardDescription>Every issuance, return, and exception recorded for audit readiness</CardDescription>
              <div className="relative mt-4 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                  placeholder="Search custody entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Key Number</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recorded By</TableHead>
                      <TableHead>Deposit</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTransactions ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Loading custody transactions...
                        </TableCell>
                      </TableRow>
                    ) : displayedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No custody transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedTransactions.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell className="font-mono text-sm whitespace-nowrap">{formatDateTime(txn.createdAt)}</TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{txn.key?.keyNumber ?? '—'}</code>
                              {txn.key?.property?.name && (
                                <span className="text-xs text-muted-foreground">{txn.key.property.name}</span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={txn.action === 'ISSUE' ? 'default' : txn.action === 'RETURN' ? 'secondary' : txn.action === 'LOST_REPORT' ? 'destructive' : 'outline'}>
                              {txn.action.replace('_', ' ')}
                            </Badge>
                        </TableCell>
                          <TableCell className="text-sm">
                            <p className="font-medium">{txn.performedForName || '—'}</p>
                            {txn.personType && (
                              <p className="text-xs text-muted-foreground">{txn.personType}</p>
                            )}
                          </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="text-xs">{txn.personType || '—'}</Badge>
                        </TableCell>
                          <TableCell className="text-sm">{txn.performedByName || '—'}</TableCell>
                          
                          <TableCell className="text-sm text-muted-foreground">
                            {typeof txn.depositAmount === 'number' ? formatCurrency(txn.depositAmount, 'NGN') : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{txn.notes || '—'}</TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Control Compliance Framework</CardTitle>
              <CardDescription>Policies and reports that keep your key program audit-ready</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                    <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Compliance Checklist
                </h4>
                <div className="space-y-3">
                  {[
                    { title: 'Physical key register maintained', detail: 'Bound ledger stored securely off-site weekly' },
                    { title: 'Digital audit trail active', detail: 'All events timestamped with witnesses and user IDs' },
                    { title: 'Deposits collected & reconciled', detail: 'NGN 5,000 for unit keys, NGN 20,000 for master keys' },
                    { title: 'Master key controls', detail: 'Weekly accountability check and dual control storage' },
                    { title: 'Lost key protocol', detail: 'Mandatory police report and lock replacement sourcing' }
                  ].map((item) => (
                    <div key={item.title} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                  </div>
                </div>

              <Separator />

                    <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Operational Policies
                </h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-900 mb-1">Issuance</p>
                    <ul className="text-blue-800 space-y-1 ml-4 list-disc">
                      <li>Valid government-issued ID is compulsory</li>
                      <li>Witness signature for every handover</li>
                      <li>Maximum two copies per residential unit</li>
                      <li>Automated email confirmation to tenant</li>
                    </ul>
                    </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-medium text-green-900 mb-1">Returns</p>
                    <ul className="text-green-800 space-y-1 ml-4 list-disc">
                      <li>Return within 24 hours of move-out</li>
                      <li>Refund deposit within 48 hours if no issues</li>
                      <li>Partial refund (₦2,500) for damaged keys</li>
                      <li>No refund for lost keys</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-medium text-red-900 mb-1">Lost Keys</p>
                    <ul className="text-red-800 space-y-1 ml-4 list-disc">
                      <li>Report to management within 24 hours</li>
                      <li>Police report mandatory for insurance claims</li>
                      <li>Immediate lock replacement for affected units</li>
                      <li>Deposit automatically forfeited</li>
                    </ul>
                    </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="font-medium text-purple-900 mb-1">Master Keys</p>
                    <ul className="text-purple-800 space-y-1 ml-4 list-disc">
                      <li>Dual custody (Manager + Security Supervisor)</li>
                      <li>Weekly audit with signatures</li>
                      <li>Stored in biometric safe with access log</li>
                      <li>Immediate re-core if master key is compromised</li>
                    </ul>
                    </div>
                  </div>
                </div>

              <Separator />

                    <div>
                <h4 className="font-medium mb-3">Generate Compliance Reports</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" onClick={() => toast.info('Monthly key inventory exported')}>
                    <Download className="h-4 w-4 mr-2" />
                    Monthly Inventory
                  </Button>
                  <Button variant="outline" onClick={() => toast.info('Deposit ledger exported')}>
                    <Download className="h-4 w-4 mr-2" />
                    Deposit Ledger
                  </Button>
                  <Button variant="outline" onClick={() => toast.info('Lost key incidents exported')}>
                    <Download className="h-4 w-4 mr-2" />
                    Lost Keys
                  </Button>
                  <Button variant="outline" onClick={() => toast.info('Custody audit exported')}>
                    <Download className="h-4 w-4 mr-2" />
                    Custody Audit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      

      <Dialog open={showReturnKey} onOpenChange={setShowReturnKey}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Mark Key as Returned</DialogTitle>
            <DialogDescription>Confirm the physical key is back in custody</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Key Number:</span><span className="font-medium">{selectedKey?.keyNumber ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Last Holder:</span><span className="font-medium">{selectedKey?.issuedToName ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Deposit:</span><span className="font-medium">{selectedKey?.depositAmount ? formatCurrency(selectedKey.depositAmount, selectedKey.depositCurrency || 'NGN') : '—'}</span></div>
            </div>

            <div className="space-y-2">
              <Label>Condition on Return</Label>
              <Select value={returnKeyForm.condition} onValueChange={(value) => setReturnKeyForm((prev) => ({ ...prev, condition: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Good">Good - Full refund</SelectItem>
                  <SelectItem value="Fair">Fair - Partial refund</SelectItem>
                  <SelectItem value="Poor">Poor - No refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Refund Deposit</Label>
                <p className="text-xs text-muted-foreground">Toggle off if refund is withheld</p>
              </div>
              <Switch checked={returnKeyForm.refundDeposit} onCheckedChange={(checked) => setReturnKeyForm((prev) => ({ ...prev, refundDeposit: checked }))} />
            </div>

            {(returnKeyForm.refundDeposit && returnKeyForm.condition === 'Fair') && (
              <div className="space-y-2">
                <Label>Refund Amount (Partial)</Label>
              <Input
                type="number"
                  min={0}
                  value={returnKeyForm.refundAmount}
                  onChange={(e) => setReturnKeyForm((prev) => ({ ...prev, refundAmount: e.target.value }))}
                  placeholder="Enter partial refund amount"
              />
            </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={returnKeyForm.notes} onChange={(e) => setReturnKeyForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Damage observations, comments..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReturnKey(false)}>Cancel</Button>
            <Button onClick={handleReturnKey} disabled={processingReturn}>{processingReturn ? 'Processing...' : 'Confirm Return'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportLost} onOpenChange={setShowReportLost}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Report Lost Key</DialogTitle>
            <DialogDescription>Document the security incident and trigger follow-up actions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Lost keys compromise security. Initiate lock replacement and notify the property owner immediately.</AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reported By *</Label>
                <Input value={lostKeyForm.reportedBy} onChange={(e) => setLostKeyForm((prev) => ({ ...prev, reportedBy: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Date Lost *</Label>
                <Input type="date" value={lostKeyForm.lostDate} onChange={(e) => setLostKeyForm((prev) => ({ ...prev, lostDate: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Circumstances *</Label>
              <Textarea value={lostKeyForm.circumstances} onChange={(e) => setLostKeyForm((prev) => ({ ...prev, circumstances: e.target.value }))} rows={3} placeholder="Describe how the key was lost" />
            </div>

            <div className="space-y-2">
              <Label>Police Report Number</Label>
              <Input value={lostKeyForm.policeReportNumber} onChange={(e) => setLostKeyForm((prev) => ({ ...prev, policeReportNumber: e.target.value }))} placeholder="Optional" />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200">
              <div>
                <Label className="text-red-900">Arrange Lock Replacement</Label>
                <p className="text-xs text-red-700">Recommended to maintain tenant security</p>
              </div>
              <Switch checked={lostKeyForm.replaceLock} onCheckedChange={(checked) => setLostKeyForm((prev) => ({ ...prev, replaceLock: checked }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReportLost(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReportLost} disabled={processingLost}>
              {processingLost ? 'Reporting...' : 'Report Lost Key'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
