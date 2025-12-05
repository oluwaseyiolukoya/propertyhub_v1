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
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
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
  Info,
  Calendar as CalendarIcon
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
  updatePropertyKey,
  issuePropertyKey,
  returnPropertyKey,
  reportLostPropertyKey,
  getPropertyKeyStats,
  getPropertyKeyTransactions
} from '../lib/api/access-control';
import { getProperties, Property } from '../lib/api/properties';
import { getUnits, getUnit } from '../lib/api/units';
import { formatCurrency } from '../lib/currency';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

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

  const [editKeyForm, setEditKeyForm] = useState({
    keyNumber: '',
    keyLabel: '',
    keyType: 'Unit',
    propertyId: '',
    unitId: 'none', // sentinel for "no unit"
    numberOfCopies: '1',
    location: '',
    notes: ''
  });
  const [showEditKeyDialog, setShowEditKeyDialog] = useState(false);
  const [savingEditKey, setSavingEditKey] = useState(false);

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
      const unitId = key?.units?.id;
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

  const openEditKeyDialog = (key: PropertyKey) => {
    setSelectedKey(key);
    setEditKeyForm({
      keyNumber: key.keyNumber || '',
      keyLabel: key.keyLabel || '',
      keyType: key.keyType || 'Unit',
      propertyId: key.propertyId,
      // use 'none' sentinel when there is no unit
      unitId: key.unitId || 'none',
      numberOfCopies: String(key.numberOfCopies || '1'),
      location: key.location || '',
      notes: key.notes || '',
    });
    setShowEditKeyDialog(true);
  };

  const handleSaveEditKey = async () => {
    if (!selectedKey) return;

    try {
      if (!editKeyForm.keyNumber || !editKeyForm.keyType || !editKeyForm.propertyId) {
        toast.error('Key number, type and property are required');
        return;
      }

      setSavingEditKey(true);
      const payload: Partial<PropertyKey> = {
        keyNumber: editKeyForm.keyNumber,
        keyLabel: editKeyForm.keyLabel || undefined,
        keyType: editKeyForm.keyType,
        propertyId: editKeyForm.propertyId,
        // treat 'none' as no unit selected
        unitId: editKeyForm.unitId && editKeyForm.unitId !== 'none' ? editKeyForm.unitId : undefined,
        numberOfCopies: Number(editKeyForm.numberOfCopies || '1'),
        location: editKeyForm.location || undefined,
        notes: editKeyForm.notes || undefined,
      };

      const response = await updatePropertyKey(selectedKey.id, payload);
      if (response.error) {
        console.error('Failed to update key:', response.error);
        toast.error(response.error.error || 'Failed to update key');
        return;
      }

      toast.success('Key entry updated successfully');
      setShowEditKeyDialog(false);
      setSelectedKey(null);
      await refreshData();
    } catch (error: any) {
      console.error('Error updating key:', error);
      toast.error(error?.message || 'Failed to update key');
    } finally {
      setSavingEditKey(false);
    }
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
        {/* Header with Back Button */}
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] rounded-xl p-6 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setShowIssueKeyPage(false)} className="text-white hover:bg-white/10">
              ← Back to Key Inventory
            </Button>
            <h1 className="text-2xl font-bold text-white">Issue Key</h1>
          </div>
        </div>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <LogOut className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Key Handover Details</CardTitle>
                <CardDescription className="text-gray-600">Capture information for custody tracking and compliance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6 max-w-3xl">
              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">Select Key *</Label>
                <Select
                  value={issueKeyForm.keyId}
                  onValueChange={(value) => setIssueKeyForm((prev) => ({ ...prev, keyId: value }))}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                    <SelectValue placeholder="Choose a key" />
                  </SelectTrigger>
                  <SelectContent>
                    {keys
                      .filter((k) => k.status.toLowerCase() !== 'issued')
                      .map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.keyNumber} · {k.properties?.name ?? 'Unknown'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {/* Assigned tenant preview */}
                {issueKeyForm.keyId && (
                  <div className="mt-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Assigned Tenant</p>
                    {issueKeyTenant ? (
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{issueKeyTenant.name}</p>
                        <p className="text-xs text-gray-600">{issueKeyTenant.email || issueKeyTenant.phone || '—'}</p>
                    </div>
                    ) : (
                      <p className="text-xs text-gray-600">No active tenant found for this unit</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">Issued To (Full Name) *</Label>
                <Input
                  value={issueKeyForm.issuedTo}
                  onChange={(e) => setIssueKeyForm((prev) => ({ ...prev, issuedTo: e.target.value }))}
                  placeholder="Enter full name as on ID"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-700">Person Type *</Label>
                  <Select
                    value={issueKeyForm.issuedToType}
                    onValueChange={(value) => setIssueKeyForm((prev) => ({ ...prev, issuedToType: value }))}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                  <Label className="font-semibold text-gray-700">Expected Return</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]",
                          !issueKeyForm.expectedReturnDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-[#7C3AED]" />
                        {issueKeyForm.expectedReturnDate
                          ? format(new Date(issueKeyForm.expectedReturnDate), "PPP")
                          : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl shadow-xl" align="start">
                      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] px-4 py-3 rounded-t-xl">
                        <p className="text-white font-semibold text-sm">Select Expected Return Date</p>
                      </div>
                      <div className="p-3 bg-white">
                        <CalendarComponent
                          mode="single"
                          selected={issueKeyForm.expectedReturnDate ? new Date(issueKeyForm.expectedReturnDate) : undefined}
                          onSelect={(date) =>
                            setIssueKeyForm((prev) => ({
                              ...prev,
                              expectedReturnDate: date ? format(date, "yyyy-MM-dd") : "",
                            }))
                          }
                          initialFocus
                          classNames={{
                            caption_label: "text-gray-900 font-semibold",
                            nav_button: "border-gray-300 hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED]",
                            day_selected: "bg-[#7C3AED] text-white font-bold shadow-md hover:bg-[#6D28D9]",
                            day_today: "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                            day: "hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]",
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Deposit removed by request */}

              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">Notes</Label>
                <Textarea
                  value={issueKeyForm.notes}
                  onChange={(e) => setIssueKeyForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Any special conditions or remarks..."
                  className="resize-none border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>

              <Alert className="bg-blue-50 border-blue-200 text-blue-800 rounded-xl shadow-sm">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <strong>Compliance:</strong> Ensure government-issued ID is verified before key issuance. Witness signature is mandatory for audit compliance.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <Button variant="outline" onClick={() => setShowIssueKeyPage(false)} className="border-gray-300">
                  Cancel
                </Button>
                <Button
                  onClick={handleIssueKey}
                  disabled={processingIssue}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                >
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
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setShowAddKeyPage(false)}
            className="hover:bg-purple-50 hover:text-[#7C3AED]"
          >
            ← Back to Key Inventory
          </Button>
        </div>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-t-xl">
            <CardTitle className="text-2xl">Register New Key</CardTitle>
            <CardDescription className="text-purple-100">Add a new physical key to the inventory management system</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6 max-w-3xl">
              <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Key Number *</Label>
                        <Input
                    value={newKeyForm.keyNumber}
                    onChange={(e) => setNewKeyForm((prev) => ({ ...prev, keyNumber: e.target.value }))}
                    placeholder="e.g. SUN-A101-01"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <p className="text-xs text-gray-500">Format: PROPERTY-UNIT-NUMBER</p>
                      </div>
                      <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Key Label (Optional)</Label>
                        <Input
                    value={newKeyForm.keyLabel}
                    onChange={(e) => setNewKeyForm((prev) => ({ ...prev, keyLabel: e.target.value }))}
                    placeholder="e.g. Front Door, Back Entrance"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                    </div>
                </div>

              <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Key Type *</Label>
                      <Select
                    value={newKeyForm.keyType}
                    onValueChange={(value) => setNewKeyForm((prev) => ({ ...prev, keyType: value }))}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                  <Label className="text-sm font-semibold text-gray-700">Property *</Label>
                  <Select
                    value={newKeyForm.propertyId}
                    onValueChange={(value) => {
                      setNewKeyForm((prev) => ({ ...prev, propertyId: value, unitId: '' }));
                    }}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                  <Label className="text-sm font-semibold text-gray-700">Unit (Optional)</Label>
                  <Select
                    value={newKeyForm.unitId}
                    onValueChange={(value) => setNewKeyForm((prev) => ({ ...prev, unitId: value }))}
                    disabled={!newKeyForm.propertyId || units.length === 0}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                  <p className="text-xs text-gray-500">
                    {!newKeyForm.propertyId
                      ? 'Select a property first'
                      : units.length === 0
                      ? 'No units found for this property'
                      : `${units.length} unit(s) available`}
                  </p>

                  {/* Active tenant preview */}
                  {newKeyForm.unitId && newKeyForm.unitId !== 'none' && (
                    <div className="mt-3 p-3 border border-purple-200 rounded-lg bg-purple-50">
                      <p className="text-xs text-gray-700 font-semibold mb-1">Active Tenant</p>
                      {selectedUnitActiveTenant ? (
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{selectedUnitActiveTenant.name}</p>
                          <p className="text-xs text-gray-600">{selectedUnitActiveTenant.email || selectedUnitActiveTenant.phone || '—'}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">No active tenant found for this unit</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Number of Copies</Label>
                      <Input
                    type="number"
                    min={1}
                    max={10}
                    value={newKeyForm.numberOfCopies}
                    onChange={(e) => setNewKeyForm((prev) => ({ ...prev, numberOfCopies: e.target.value }))}
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <p className="text-xs text-gray-500">Maximum 2 copies for unit keys</p>
                    </div>
                  </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Storage Location *</Label>
                  <Input
                    value={newKeyForm.location}
                    onChange={(e) => setNewKeyForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Key Cabinet - Office"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Notes</Label>
                  <Input
                    value={newKeyForm.notes}
                    onChange={(e) => setNewKeyForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional information"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
              </div>
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>Best Practice:</strong> Assign unique key numbers for tracking. Include property code, unit number, and copy number (e.g., SUN-A101-01 for Sunset Apartments, Unit A101, Copy 1).
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowAddKeyPage(false)}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddKey}
                  disabled={savingKey}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                >
                  {savingKey ? (
                    <>
                      <Key className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Inventory
                    </>
                  )}
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
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Key className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Key Management</h1>
            </div>
            <p className="text-purple-100 text-lg">Track physical keys, custody chain, and compliance documentation</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => toast.info('Custody log exported')}
              className="bg-white/10 border-white/30 hover:bg-white/20 text-white"
            >
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
              className="bg-white text-[#7C3AED] hover:bg-purple-50 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Key
            </Button>
          </div>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Compliance:</strong> Every issuance, return, and lost-report is logged with witnesses for audit trails. Maintain a physical register as a secondary backup in line with regulatory requirements.
        </AlertDescription>
      </Alert>

      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Total Keys Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-600 opacity-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center">
                  <Key className="h-5 w-5 text-gray-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-700">Total Keys</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Total number of physical keys registered in the inventory system across all properties and units.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-gray-600">{loadingStats ? '—' : totalKeys}</div>
              <p className="text-xs text-gray-500 mt-1">In inventory</p>
            </CardContent>
          </Card>

          {/* Keys Issued Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-700">Keys Issued</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Number of keys currently issued to tenants, managers, contractors, or other authorized personnel. These keys are actively in use.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-blue-600">{loadingStats ? '—' : issuedKeys}</div>
              <p className="text-xs text-gray-500 mt-1">Currently out</p>
            </CardContent>
          </Card>

          {/* Available Keys Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-700">Available</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Keys stored in the key cabinet or office that are ready to be issued. These keys are not currently assigned to anyone.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-green-600">{loadingStats ? '—' : availableKeys}</div>
              <p className="text-xs text-gray-500 mt-1">Ready for issuance</p>
            </CardContent>
          </Card>

          {/* Lost/Damaged Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-700">Lost / Damaged</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Keys reported as lost or damaged. These require immediate follow-up including lock replacement, police reports, and deposit forfeiture.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-red-600">{loadingStats ? '—' : lostKeys}</div>
              <p className="text-xs text-gray-500 mt-1">Require follow-up</p>
            </CardContent>
          </Card>

          {/* Deposits Held Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] opacity-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Lock className="h-5 w-5 text-[#7C3AED]" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-700">Deposits Held</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Total security deposits collected for issued keys that have not been refunded. Deposits are refundable upon key return in good condition.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-[#7C3AED]">
                {statsReady ? formatCurrency(depositHeld, 'NGN') : '—'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Refundable security</p>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger
            value="keys"
            className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white"
          >
            Key Inventory
          </TabsTrigger>
          <TabsTrigger
            value="custody"
            className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white"
          >
            Custody Chain
          </TabsTrigger>
          <TabsTrigger
            value="compliance"
            className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white"
          >
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Key className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">Key Inventory Register</CardTitle>
                    <CardDescription className="text-gray-600">Real-time view of all physical keys and their status</CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => openIssueDialog()}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Issue Key
                </Button>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mt-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                      <Input
                    placeholder="Search keys, properties, or person names..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                    </div>
                          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger className="w-full md:w-48 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
              <div className="overflow-x-auto rounded-xl border-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Key Number
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Type
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Property / Unit
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Holder
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Issued
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Expected Return
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Deposit
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Location
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </TableHead>
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
                      displayedKeys.map((key, index) => (
                        <TableRow
                          key={key.id}
                          className={`hover:bg-[#7C3AED]/5 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
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
                              <p className="font-medium">{key.properties?.name ?? '—'}</p>
                              {key.units?.unitNumber && (
                                <p className="text-xs text-muted-foreground">Unit {key.units.unitNumber}</p>
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
                                <DropdownMenuItem onClick={() => openEditKeyDialog(key)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Edit Key
                                </DropdownMenuItem>
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
                              {txn.key?.properties?.name && (
                                <span className="text-xs text-muted-foreground">{txn.key.properties.name}</span>
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

      {/* Edit Key Dialog */}
      <Dialog open={showEditKeyDialog} onOpenChange={setShowEditKeyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Key Entry</DialogTitle>
            <DialogDescription>
              Update key details such as label, type, property, unit, copies, location, and notes.
            </DialogDescription>
          </DialogHeader>

          {selectedKey && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-key-number">Key Number</Label>
                  <Input
                    id="edit-key-number"
                    value={editKeyForm.keyNumber}
                    onChange={(e) => setEditKeyForm(prev => ({ ...prev, keyNumber: e.target.value }))}
                    placeholder="e.g. A-101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-key-label">Key Label</Label>
                  <Input
                    id="edit-key-label"
                    value={editKeyForm.keyLabel}
                    onChange={(e) => setEditKeyForm(prev => ({ ...prev, keyLabel: e.target.value }))}
                    placeholder="Front Door Key"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-key-type">Key Type</Label>
                  <Select
                    value={editKeyForm.keyType}
                    onValueChange={(value) => setEditKeyForm(prev => ({ ...prev, keyType: value }))}
                  >
                    <SelectTrigger id="edit-key-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KEY_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-copies">Number of Copies</Label>
                  <Input
                    id="edit-copies"
                    type="number"
                    min={1}
                    value={editKeyForm.numberOfCopies}
                    onChange={(e) => setEditKeyForm(prev => ({ ...prev, numberOfCopies: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-property">Property</Label>
                  <Select
                    value={editKeyForm.propertyId}
                    onValueChange={(value) => setEditKeyForm(prev => ({ ...prev, propertyId: value, unitId: 'none' }))}
                  >
                    <SelectTrigger id="edit-property">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Unit (Optional)</Label>
                  <Select
                    value={editKeyForm.unitId}
                    onValueChange={(value) => setEditKeyForm(prev => ({ ...prev, unitId: value }))}
                    disabled={!editKeyForm.propertyId}
                  >
                    <SelectTrigger id="edit-unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No unit</SelectItem>
                      {units
                        .filter((u) => u.propertyId === editKeyForm.propertyId)
                        .map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.unitNumber}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editKeyForm.location}
                  onChange={(e) => setEditKeyForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Key Cabinet - Office"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editKeyForm.notes}
                  onChange={(e) => setEditKeyForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Any special handling instructions..."
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (!savingEditKey) {
                  setShowEditKeyDialog(false);
                  setSelectedKey(null);
                }
              }}
              disabled={savingEditKey}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEditKey} disabled={savingEditKey}>
              {savingEditKey ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>



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
