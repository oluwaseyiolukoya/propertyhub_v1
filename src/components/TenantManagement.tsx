import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Plus, Edit, Mail, Phone, Calendar as CalendarIcon, Copy, Search, Filter, KeyRound, UserMinus, Trash2, AlertTriangle, Check, MoreHorizontal, Eye, Home, Building2, User, DollarSign } from 'lucide-react';
import { toast } from "sonner";
import { createLease, getLeases, terminateLease } from '../lib/api/leases';
import { getUnitsByProperty } from '../lib/api/units';
import { resetTenantPassword, deleteTenant, updateTenant } from '../lib/api/tenant';
import { formatCurrency } from '../lib/currency';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export const TenantManagement = ({ properties = [] as any[] }: { properties?: any[] }) => {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');

  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddTenant, setShowAddTenant] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [newTenant, setNewTenant] = useState({
    name: '',
    email: '',
    phone: '',
    unitId: '',
    propertyId: '',
    leaseStart: '',
    leaseEnd: '',
    rent: '',
    occupancyDate: '',
    password: ''
  });
  const [propertyUnits, setPropertyUnits] = useState<any[]>([]);
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tenantToUnassign, setTenantToUnassign] = useState<any>(null);
  const [tenantToDelete, setTenantToDelete] = useState<any>(null);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [tenantToResetPassword, setTenantToResetPassword] = useState<any>(null);
  const [newGeneratedPassword, setNewGeneratedPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false);
  const [showEditTenantDialog, setShowEditTenantDialog] = useState(false);
  const [editTenantData, setEditTenantData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isUpdatingTenant, setIsUpdatingTenant] = useState(false);
  const [showAssignUnitDialog, setShowAssignUnitDialog] = useState(false);
  const [tenantToAssign, setTenantToAssign] = useState<any>(null);
  const [assignmentData, setAssignmentData] = useState({
    propertyId: '',
    unitId: '',
    leaseStart: '',
    leaseEnd: '',
    rent: ''
  });
  const [assignmentPropertyUnits, setAssignmentPropertyUnits] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Helper to format dates for display (e.g., "Nov 19, 2025")
  const formatDisplayDate = (value?: string | Date | null) => {
    if (!value) return 'N/A';
    try {
      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date.getTime())) return String(value);
      return format(date, 'PPP');
    } catch {
      return String(value);
    }
  };
  // In-memory map to hold latest generated temp passwords keyed by tenantId
  const [tenantPasswords, setTenantPasswords] = useState<Record<string, string>>({});
  // Surface immediate post-creation/reset password with explicit copy CTA
  const [recentPasswordInfo, setRecentPasswordInfo] = useState<{
    tenantId: string;
    email: string;
    password: string;
  } | null>(null);

  // Load persisted temp passwords from localStorage on mount (session convenience)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('tenantTempPasswords');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setTenantPasswords(parsed);
      }
    } catch {}
  }, []);

  // Persist temp passwords to localStorage when they change
  useEffect(() => {
    try {
      window.localStorage.setItem('tenantTempPasswords', JSON.stringify(tenantPasswords));
    } catch {}
  }, [tenantPasswords]);

  // Load units when property is selected (only vacant units) for new tenant
  React.useEffect(() => {
    (async () => {
      if (!newTenant.propertyId) { setPropertyUnits([]); return; }
      const res = await getUnitsByProperty(String(newTenant.propertyId));
      if (!res.error && Array.isArray(res.data)) {
        // Filter to show only vacant units for tenant assignment
        const vacantUnits = res.data.filter((unit: any) => unit.status === 'vacant');
        console.log(`📦 Loaded units for property:`, {
          total: res.data.length,
          vacant: vacantUnits.length,
          propertyId: newTenant.propertyId
        });
        setPropertyUnits(vacantUnits);
      } else {
        setPropertyUnits([]);
      }
    })();
  }, [newTenant.propertyId]);

  // Load units when property is selected for assigning existing tenant
  React.useEffect(() => {
    (async () => {
      if (!assignmentData.propertyId) { setAssignmentPropertyUnits([]); return; }
      const res = await getUnitsByProperty(String(assignmentData.propertyId));
      if (!res.error && Array.isArray(res.data)) {
        // Filter to show only vacant units for tenant assignment
        const vacantUnits = res.data.filter((unit: any) => unit.status === 'vacant');
        console.log(`📦 Loaded units for assignment:`, {
          total: res.data.length,
          vacant: vacantUnits.length,
          propertyId: assignmentData.propertyId
        });
        setAssignmentPropertyUnits(vacantUnits);
      } else {
        setAssignmentPropertyUnits([]);
      }
    })();
  }, [assignmentData.propertyId]);

  const ownerProperties = useMemo(() => (Array.isArray(properties) ? properties : []), [properties]);

  // Load tenants from backend
  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await getLeases();
      if (!res.error && Array.isArray(res.data)) {
        // Transform lease data to tenant format
        const allTenantsData = res.data.map((lease: any) => ({
          id: lease.users?.id || lease.tenantId,
          name: lease.users?.name || 'Unknown',
          email: lease.users?.email || '',
          phone: lease.users?.phone || '',
          unit: lease.units?.unitNumber || '',
          property: lease.properties?.name || '',
          propertyId: lease.properties?.id || '',
          currency: lease.properties?.currency || 'USD',
          leaseStart: lease.startDate,
          leaseEnd: lease.endDate,
          rent: lease.monthlyRent,
          status: lease.status === 'active' ? 'Active' : lease.status === 'terminated' ? 'Terminated' : 'Pending',
          occupancyDate: lease.startDate,
          apartmentId: lease.units?.unitNumber || '',
          leaseId: lease.id,
          createdAt: lease.createdAt || new Date()
        }));

        // Group by tenant ID and keep only the most recent lease per tenant
        // Prioritize Active leases over Terminated ones
        const tenantMap = new Map<string, any>();

        allTenantsData.forEach((tenant: any) => {
          const existingTenant = tenantMap.get(tenant.id);

          if (!existingTenant) {
            // First lease for this tenant
            tenantMap.set(tenant.id, tenant);
          } else {
            // Tenant already exists, determine which lease to show
            // Priority: Active > Pending > Terminated
            // If same status, use most recent (by createdAt)
            const statusPriority = { Active: 3, Pending: 2, Terminated: 1 };
            const existingPriority = statusPriority[existingTenant.status as keyof typeof statusPriority] || 0;
            const newPriority = statusPriority[tenant.status as keyof typeof statusPriority] || 0;

            if (newPriority > existingPriority) {
              // New lease has higher priority status
              tenantMap.set(tenant.id, tenant);
            } else if (newPriority === existingPriority) {
              // Same priority, use most recent
              if (new Date(tenant.createdAt) > new Date(existingTenant.createdAt)) {
                tenantMap.set(tenant.id, tenant);
              }
            }
            // Otherwise, keep existing (has higher priority)
          }
        });

        // Convert map back to array
        const uniqueTenantsData = Array.from(tenantMap.values());

        console.log('✅ Loaded tenants (deduplicated):', uniqueTenantsData.map(t => ({
          name: t.name,
          status: t.status,
          property: t.property,
          currency: t.currency,
          rent: t.rent
        })));

        setTenants(uniqueTenantsData);
      }
    } catch (error: any) {
      console.error('Failed to load tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  // Load tenants on mount
  useEffect(() => {
    loadTenants();
  }, []);

  const generateTenantCredentials = () => {
    const tenantId = `TEN${String(tenants.length + 1).padStart(3, '0')}`;
    const apartmentId = `APT${String(tenants.length + 1).padStart(3, '0')}`;
    return { tenantId, apartmentId };
  };

  const handleAddTenant = async () => {
    try {
      if (!newTenant.propertyId) throw new Error('Please select a property');
      if (!newTenant.unitId) throw new Error('Please select a unit');
      if (!newTenant.name || !newTenant.email) throw new Error('Please enter tenant name and email');
      if (!newTenant.leaseStart || !newTenant.leaseEnd) throw new Error('Please set lease start and end dates');
      if (!newTenant.rent) throw new Error('Please enter monthly rent');

      const payload = {
        propertyId: String(newTenant.propertyId),
        unitId: String(newTenant.unitId),
        tenantName: newTenant.name,
        tenantEmail: newTenant.email,
        tenantPhone: newTenant.phone || undefined,
        startDate: newTenant.leaseStart,
        endDate: newTenant.leaseEnd,
        monthlyRent: Number(newTenant.rent),
        securityDeposit: undefined,
        currency: 'USD',
        terms: undefined,
        specialClauses: undefined,
        sendInvitation: true,
        // If the user generated/typed a password in the dialog, pass it to backend
        tempPassword: newTenant.password || undefined
      };

      const res = await createLease(payload);
      if ((res as any).error) throw new Error((res as any).error.error || 'Failed to create lease');

      // Capture the generated password and tenant ID from the response
      const generatedPassword = (res as any).data?.tempPassword;
      const newTenantId = (res as any).data?.tenant?.id;

      console.log('✅ Tenant created successfully');
      if (generatedPassword) {
        console.log('🔐 Generated password:', generatedPassword);
      }

      // Reload tenants using the shared loader so the shape stays consistent
      await loadTenants();

      // Store the freshly generated password in the in-memory map for copy action
      if (generatedPassword && newTenantId) {
        setTenantPasswords(prev => ({ ...prev, [newTenantId]: generatedPassword }));
        setRecentPasswordInfo({
          tenantId: newTenantId,
          email: (res as any).data?.tenant?.email || newTenant.email,
          password: generatedPassword
        });
        console.log('🔐 Password stored for tenant:', newTenantId);
      }

      setNewTenant({
        name: '', email: '', phone: '', unitId: '', propertyId: '',
        leaseStart: '', leaseEnd: '', rent: '', occupancyDate: '', password: ''
      });
      setShowAddTenant(false);

      if (generatedPassword) {
        toast.success('Tenant created! A temporary password has been generated.');
      } else {
        toast.success('Tenant created and assigned successfully');
      }
    } catch (e: any) {
      console.error('❌ Failed to create tenant:', e);
      toast.error(e?.message || 'Failed to add tenant');
    }
  };

  const sendCredentialsEmail = (tenant: any) => {
    toast.success(`Credentials email sent to ${tenant.email}`);
  };

  const copyCredentials = (tenant: any) => {
    // Prefer in-memory password map; fallback to attached credentials in state
    const password = tenantPasswords[tenant.id] || tenant.credentials?.tempPassword || '';

    if (!password) {
      toast.error('No password available to copy. Please reset the password first.');
      return;
    }

    navigator.clipboard.writeText(password);
    toast.success('Password copied to clipboard!');
    console.log('📋 Password copied for tenant:', tenant.email);
  };

  const handleUnassignTenant = async () => {
    if (!tenantToUnassign) return;

    try {
      setIsUnassigning(true);
      // Terminate the lease to unassign the tenant from the unit
      await terminateLease(tenantToUnassign.leaseId, 'Tenant unassigned by owner');

      toast.success('Tenant unassigned from unit successfully');
      setShowUnassignDialog(false);
      setTenantToUnassign(null);

      // Refresh tenants list
      await loadTenants();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to unassign tenant');
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;

    try {
      setIsDeleting(true);
      console.log('🗑️  Deleting tenant:', tenantToDelete.id);

      // Delete the tenant (this will also terminate their leases and free up units)
      const response = await deleteTenant(tenantToDelete.id);

      if (response.error) {
        console.error('❌ Delete error:', response.error);
        throw new Error(response.error.error || response.error.message || 'Failed to delete tenant');
      }

      console.log('✅ Tenant deleted successfully:', response.data);
      toast.success('Tenant deleted successfully');
      setShowDeleteDialog(false);
      setTenantToDelete(null);

      // Refresh tenants list
      await loadTenants();
    } catch (error: any) {
      console.error('❌ Delete tenant failed:', error);
      toast.error(error?.message || 'Failed to delete tenant');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;

    try {
      setIsUpdatingTenant(true);
      console.log('✏️  Updating tenant:', selectedTenant.id, editTenantData);

      // Update the tenant information
      const response = await updateTenant(selectedTenant.id, editTenantData);

      if (response.error) {
        console.error('❌ Update error:', response.error);
        throw new Error(response.error.error || response.error.message || 'Failed to update tenant');
      }

      console.log('✅ Tenant updated successfully:', response.data);
      toast.success('Tenant information updated successfully');
      setShowEditTenantDialog(false);
      setSelectedTenant(null);

      // Refresh tenants list
      await loadTenants();
    } catch (error: any) {
      console.error('❌ Update tenant failed:', error);
      toast.error(error?.message || 'Failed to update tenant');
    } finally {
      setIsUpdatingTenant(false);
    }
  };

  const handleAssignUnit = async () => {
    if (!tenantToAssign) return;

    try {
      if (!assignmentData.propertyId) throw new Error('Please select a property');
      if (!assignmentData.unitId) throw new Error('Please select a unit');
      if (!assignmentData.leaseStart || !assignmentData.leaseEnd) throw new Error('Please set lease start and end dates');
      if (!assignmentData.rent) throw new Error('Please enter monthly rent');

      setIsAssigning(true);
      console.log('🏠 Assigning tenant to unit:', tenantToAssign.id, assignmentData);

      const payload = {
        propertyId: String(assignmentData.propertyId),
        unitId: String(assignmentData.unitId),
        tenantName: tenantToAssign.name,
        tenantEmail: tenantToAssign.email,
        tenantPhone: tenantToAssign.phone || undefined,
        startDate: assignmentData.leaseStart,
        endDate: assignmentData.leaseEnd,
        monthlyRent: Number(assignmentData.rent),
        securityDeposit: undefined,
        currency: 'USD',
        terms: undefined,
        specialClauses: undefined,
        sendInvitation: false // Don't send invitation for existing tenant
      };

      const res = await createLease(payload);
      if ((res as any).error) throw new Error((res as any).error.error || 'Failed to assign tenant to unit');

      console.log('✅ Tenant assigned to unit successfully');
      toast.success('Tenant assigned to unit successfully');
      setShowAssignUnitDialog(false);
      setTenantToAssign(null);
      setAssignmentData({
        propertyId: '',
        unitId: '',
        leaseStart: '',
        leaseEnd: '',
        rent: ''
      });

      // Refresh tenants list
      await loadTenants();
    } catch (error: any) {
      console.error('❌ Assign tenant failed:', error);
      toast.error(error?.message || 'Failed to assign tenant to unit');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleResetPassword = async () => {
    if (!tenantToResetPassword) return;

    try {
      setIsResettingPassword(true);
      console.log('🔐 Resetting password for tenant:', tenantToResetPassword.id);

      const response = await resetTenantPassword(tenantToResetPassword.id);
      console.log('📥 Reset password response:', response);

      if (response.error) {
        console.error('❌ Reset password error:', response.error);
        throw new Error(response.error.error || response.error.message || 'Failed to reset password');
      }

      if (!response.data || !response.data.tempPassword) {
        console.error('❌ No password in response:', response);
        throw new Error('No password returned from server');
      }

      console.log('✅ Password reset successful, new password received');
      setNewGeneratedPassword(response.data.tempPassword);
      setPasswordCopied(false);

      // Update in-memory password map for reliable copy action
      setTenantPasswords(prev => ({ ...prev, [tenantToResetPassword.id]: response.data.tempPassword }));
      setRecentPasswordInfo({ tenantId: tenantToResetPassword.id, email: tenantToResetPassword.email, password: response.data.tempPassword });

      toast.success('Password reset successfully! Make sure to copy and share it with the tenant.');
    } catch (error: any) {
      console.error('❌ Reset password failed:', error);
      toast.error(error?.message || 'Failed to reset password');
      setShowResetPasswordDialog(false);
      setTenantToResetPassword(null);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCopyPassword = () => {
    if (newGeneratedPassword) {
      navigator.clipboard.writeText(newGeneratedPassword);
      setPasswordCopied(true);
      toast.success('Password copied to clipboard!');
    }
  };

  const handleCloseResetPasswordDialog = () => {
    setShowResetPasswordDialog(false);
    setTenantToResetPassword(null);
    setNewGeneratedPassword('');
    setPasswordCopied(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Payment Overdue': return 'destructive';
      case 'Lease Ending': return 'secondary';
      case 'Pending': return 'outline';
      default: return 'secondary';
    }
  };

  // Get unique properties for filter dropdown (sanitize undefined)
  const uniqueProperties = Array.from(new Set(tenants.map(t => t.property || ''))).filter(Boolean);

  // Filter tenants based on search and filters
  const filteredTenants = tenants.filter(tenant => {
    const safe = (v: any) => (v == null ? '' : String(v)).toLowerCase();
    const matchesSearch =
      safe(tenant.name).includes(searchTerm.toLowerCase()) ||
      safe(tenant.email).includes(searchTerm.toLowerCase()) ||
      safe(tenant.unit).includes(searchTerm.toLowerCase()) ||
      safe(tenant.id).includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    const matchesProperty = propertyFilter === 'all' || tenant.property === propertyFilter;

    return matchesSearch && matchesStatus && matchesProperty;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Tenant Management</h2>
          <p className="text-gray-600 mt-1">Manage tenants, leases, and assignments</p>
        </div>

        <Dialog open={showAddTenant} onOpenChange={setShowAddTenant}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
              <DialogDescription>
                Create a new tenant profile and assign them to a unit
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Section 1: Property & Unit Assignment */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Property & Unit Assignment</h3>
                  <span className="text-xs text-red-500">*Required</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="property">Property *</Label>
                    <Select value={newTenant.propertyId} onValueChange={(value) => setNewTenant({...newTenant, propertyId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {ownerProperties.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unitId">Unit/Apartment *</Label>
                    <Select
                      value={newTenant.unitId}
                      onValueChange={(v) => {
                        // Find the selected unit and auto-populate rent
                        const selectedUnit = propertyUnits.find((u: any) => String(u.id) === v);
                        setNewTenant({
                          ...newTenant,
                          unitId: v,
                          rent: selectedUnit?.monthlyRent ? String(selectedUnit.monthlyRent) : ''
                        });
                      }}
                      disabled={!newTenant.propertyId || propertyUnits.length === 0}
                    >
                      <SelectTrigger id="unitId">
                        <SelectValue placeholder={
                          !newTenant.propertyId
                            ? "Select property first"
                            : propertyUnits.length === 0
                              ? "No vacant units available"
                              : "Select vacant unit"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyUnits.length > 0 ? (
                          propertyUnits.map((u: any) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.unitNumber} {u.type && `- ${u.type}`} {u.bedrooms && `(${u.bedrooms} bed)`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-units" disabled>
                            No vacant units available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {newTenant.propertyId && propertyUnits.length === 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        All units in this property are occupied
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Personal Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <User className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
                  <span className="text-xs text-red-500">*Required</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={newTenant.name}
                      onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                      placeholder="Sarah Johnson"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={newTenant.phone}
                      onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                      placeholder="+234 (XXX) XXX-XXXX"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                    placeholder="sarah@email.com"
                  />
                </div>
              </div>

              {/* Section 3: Financial Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Financial Details</h3>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rent">Monthly Rent</Label>
                  <Input
                    id="rent"
                    type="number"
                    value={newTenant.rent}
                    onChange={(e) => setNewTenant({...newTenant, rent: e.target.value})}
                    placeholder="Auto-populated from unit"
                    disabled={!!newTenant.rent}
                    className={newTenant.rent ? "bg-gray-50 cursor-not-allowed" : ""}
                  />
                  {newTenant.rent && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Auto-filled from unit's monthly rent
                    </p>
                  )}
                </div>
              </div>

              {/* Section 4: Lease Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <CalendarIcon className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Lease Information</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="occupancy">Occupancy Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newTenant.occupancyDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newTenant.occupancyDate ? format(new Date(newTenant.occupancyDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={newTenant.occupancyDate ? new Date(newTenant.occupancyDate) : undefined}
                          onSelect={(date) => setNewTenant({...newTenant, occupancyDate: date ? format(date, 'yyyy-MM-dd') : ''})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="leaseStart">Lease Start</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newTenant.leaseStart && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newTenant.leaseStart ? format(new Date(newTenant.leaseStart), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={newTenant.leaseStart ? new Date(newTenant.leaseStart) : undefined}
                          onSelect={(date) => setNewTenant({...newTenant, leaseStart: date ? format(date, 'yyyy-MM-dd') : ''})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="leaseEnd">Lease End</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newTenant.leaseEnd && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newTenant.leaseEnd ? format(new Date(newTenant.leaseEnd), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={newTenant.leaseEnd ? new Date(newTenant.leaseEnd) : undefined}
                          onSelect={(date) => setNewTenant({...newTenant, leaseEnd: date ? format(date, 'yyyy-MM-dd') : ''})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Section 5: Account Setup */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <KeyRound className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Account Setup</h3>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Temporary Password *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="text"
                      value={newTenant.password}
                      onChange={(e) => setNewTenant({...newTenant, password: e.target.value})}
                      placeholder="Generate or type a password"
                    />
                    <Button type="button" variant="outline" onClick={() => {
                      const pwd = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();
                      setNewTenant({...newTenant, password: pwd});
                      toast.success('Password generated');
                    }}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      if (!newTenant.password) { toast.error('No password to copy'); return; }
                      navigator.clipboard.writeText(newTenant.password);
                      toast.success('Password copied');
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    This password will be sent to the tenant via email for their first login
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddTenant(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTenant}>
                Add Tenant & Generate Credentials
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {recentPasswordInfo && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-amber-800">
                    <span className="font-semibold">Temporary password generated</span> for {recentPasswordInfo.email}. Copy and share securely.
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="recent-temp-password" className="text-xs text-amber-700">Password</Label>
                    <Input id="recent-temp-password" readOnly value={recentPasswordInfo.password} className="font-mono max-w-xs bg-white" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(recentPasswordInfo.password);
                        toast.success('Password copied to clipboard!');
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" /> Copy
                    </Button>
                  </div>
                </div>
                <div>
                  <Button variant="ghost" onClick={() => setRecentPasswordInfo(null)}>Dismiss</Button>
                </div>
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, unit, or tenant ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {uniqueProperties.map((property) => (
                    <SelectItem key={property} value={property}>
                      {property}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Payment Overdue">Payment Overdue</SelectItem>
                  <SelectItem value="Lease Ending">Lease Ending</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || propertyFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setPropertyFilter('all');
                    setStatusFilter('all');
                  }}
                  className="whitespace-nowrap"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Filter Summary */}
            {(searchTerm || propertyFilter !== 'all' || statusFilter !== 'all') && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>
                  Showing {filteredTenants.length} of {tenants.length} tenants
                  {searchTerm && ` matching "${searchTerm}"`}
                  {propertyFilter !== 'all' && ` in ${propertyFilter}`}
                  {statusFilter !== 'all' && ` with status ${statusFilter}`}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants ({filteredTenants.length})</CardTitle>
          <CardDescription>
            View and manage all tenant information and credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Lease Period</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credentials</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Loading tenants...
                    </TableCell>
                  </TableRow>
                ) : filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No tenants found. Click "Add Tenant" to create your first tenant.
                    </TableCell>
                  </TableRow>
                ) : filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-gray-500">{tenant.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {tenant.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {tenant.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.unit}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {tenant.property}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                    <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {formatDisplayDate(tenant.leaseStart)}
                        </div>
                        <div className="text-gray-500">to {formatDisplayDate(tenant.leaseEnd)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(tenant.rent, tenant.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCredentials(tenant)}
                          className="h-8 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendCredentialsEmail(tenant)}
                          className="h-8 px-2"
                        >
                          <Mail className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Tenant Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setShowViewDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setEditTenantData({
                                name: tenant.name,
                                email: tenant.email,
                                phone: tenant.phone
                              });
                              setShowEditTenantDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Tenant
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => {
                              setTenantToResetPassword(tenant);
                              setShowResetPasswordDialog(true);
                            }}
                          >
                            <KeyRound className="h-4 w-4 mr-2 text-blue-500" />
                            Reset Password
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => copyCredentials(tenant)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Password
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => sendCredentialsEmail(tenant)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email Credentials
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/* Show Assign or Unassign based on tenant status */}
                          {tenant.status === 'Active' ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setTenantToUnassign(tenant);
                                setShowUnassignDialog(true);
                              }}
                            >
                              <UserMinus className="h-4 w-4 mr-2 text-orange-500" />
                              Unassign Unit
                            </DropdownMenuItem>
                          ) : tenant.status === 'Terminated' ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setTenantToAssign(tenant);
                                setAssignmentData({
                                  propertyId: '',
                                  unitId: '',
                                  leaseStart: '',
                                  leaseEnd: '',
                                  rent: ''
                                });
                                setShowAssignUnitDialog(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2 text-green-500" />
                              Assign Unit
                            </DropdownMenuItem>
                          ) : null}

                          {(tenant.status === 'Active' || tenant.status === 'Terminated') && <DropdownMenuSeparator />}

                          <DropdownMenuItem
                            onClick={() => {
                              setTenantToDelete(tenant);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Tenant
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Unassign Unit Dialog */}
      <Dialog open={showUnassignDialog} onOpenChange={setShowUnassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unassign Unit from Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to unassign this unit from the tenant? The lease will be terminated.
            </DialogDescription>
          </DialogHeader>

          {tenantToUnassign && (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Tenant Name</span>
                  <span className="font-medium">{tenantToUnassign.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <span className="font-medium">{tenantToUnassign.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Unit</span>
                  <span className="font-medium">{tenantToUnassign.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Property</span>
                  <span className="font-medium">{tenantToUnassign.property}</span>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <UserMinus className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">Lease will be terminated</p>
                    <p className="mt-1">The tenant will no longer have access to this unit. The unit will become available for new assignments.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnassignDialog(false);
                setTenantToUnassign(null);
              }}
              disabled={isUnassigning}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleUnassignTenant}
              disabled={isUnassigning}
            >
              {isUnassigning ? (
                <>
                  <CalendarIcon className="h-4 w-4 mr-2 animate-spin" />
                  Unassigning...
                </>
              ) : (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Unassign Unit
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Tenant Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tenant? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {tenantToDelete && (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Tenant Name</span>
                  <span className="font-medium">{tenantToDelete.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <span className="font-medium">{tenantToDelete.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Unit</span>
                  <span className="font-medium">{tenantToDelete.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Property</span>
                  <span className="font-medium">{tenantToDelete.property}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <Badge variant={tenantToDelete.status === 'Active' ? 'default' : 'secondary'}>
                    {tenantToDelete.status}
                  </Badge>
                </div>
              </div>

              {tenantToDelete.status === 'Active' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Warning: Active tenant</p>
                      <p className="mt-1">This tenant has an active lease. Make sure to handle any outstanding payments or obligations before deleting.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">This action is permanent</p>
                    <p className="mt-1">All tenant data, including lease history and records, will be permanently deleted.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setTenantToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTenant}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <CalendarIcon className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Tenant
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={(open) => {
        if (!open) handleCloseResetPasswordDialog();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Tenant Password</DialogTitle>
            <DialogDescription>
              Generate a new temporary password for the tenant. Make sure to copy and share it securely.
            </DialogDescription>
          </DialogHeader>

          {tenantToResetPassword && (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Tenant Name</span>
                  <span className="font-medium">{tenantToResetPassword.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <span className="font-medium">{tenantToResetPassword.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Unit</span>
                  <span className="font-medium">{tenantToResetPassword.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Property</span>
                  <span className="font-medium">{tenantToResetPassword.property}</span>
                </div>
              </div>

              {!newGeneratedPassword ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <KeyRound className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Password will be reset</p>
                      <p className="mt-1">A new temporary password will be generated. The tenant should change it after their first login.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Check className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium">Password reset successful!</p>
                        <p className="mt-1">The password has been updated in the database. Copy and share it with the tenant.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="generatedPassword">New Temporary Password</Label>
                    <div className="flex gap-2">
                      <Input
                        id="generatedPassword"
                        type="text"
                        value={newGeneratedPassword}
                        readOnly
                        className="font-mono text-lg bg-white"
                      />
                      <Button
                        type="button"
                        variant={passwordCopied ? "default" : "outline"}
                        onClick={handleCopyPassword}
                        className="whitespace-nowrap"
                      >
                        {passwordCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">Important</p>
                        <p className="mt-1">Make sure to copy this password now. You won't be able to see it again after closing this dialog.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            {!newGeneratedPassword ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCloseResetPasswordDialog}
                  disabled={isResettingPassword}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? (
                    <>
                      <KeyRound className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                onClick={handleCloseResetPasswordDialog}
              >
                Done
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showViewDetailsDialog} onOpenChange={setShowViewDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>
              Complete information about the tenant and their lease
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <Label className="text-xs text-gray-500">Full Name</Label>
                    <p className="font-medium">{selectedTenant.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Tenant ID</Label>
                    <p className="font-medium text-sm">{selectedTenant.id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Email Address</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedTenant.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Phone Number</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedTenant.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div>
                      <Badge variant={getStatusColor(selectedTenant.status)}>
                        {selectedTenant.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property & Unit Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Property & Unit</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <Label className="text-xs text-gray-500">Property</Label>
                    <p className="font-medium">{selectedTenant.property}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Unit/Apartment</Label>
                    <p className="font-medium">{selectedTenant.unit}</p>
                  </div>
                </div>
              </div>

              {/* Lease Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Lease Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <Label className="text-xs text-gray-500">Lease Start Date</Label>
                    <p className="font-medium flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDisplayDate(selectedTenant.leaseStart)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Lease End Date</Label>
                    <p className="font-medium flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDisplayDate(selectedTenant.leaseEnd)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Monthly Rent</Label>
                    <p className="font-medium text-lg">
                      {formatCurrency(selectedTenant.rent, selectedTenant.currency)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Occupancy Date</Label>
                    <p className="font-medium flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDisplayDate(selectedTenant.occupancyDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowViewDetailsDialog(false);
                setSelectedTenant(null);
              }}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowViewDetailsDialog(false);
                setEditTenantData({
                  name: selectedTenant?.name || '',
                  email: selectedTenant?.email || '',
                  phone: selectedTenant?.phone || ''
                });
                setShowEditTenantDialog(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Tenant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={showEditTenantDialog} onOpenChange={setShowEditTenantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant Information</DialogTitle>
            <DialogDescription>
              Update the tenant's personal information
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6">
              {/* Personal Information (editable) */}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editTenantData.name}
                    onChange={(e) => setEditTenantData({ ...editTenantData, name: e.target.value })}
                    placeholder="Enter tenant's full name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editTenantData.email}
                    onChange={(e) => setEditTenantData({ ...editTenantData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editTenantData.phone}
                    onChange={(e) => setEditTenantData({ ...editTenantData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Context: Property & Lease (read-only, so nothing feels "missing") */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">Property & Unit</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Property</Label>
                      <p className="font-medium">{selectedTenant.property || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Unit/Apartment</Label>
                      <p className="font-medium">{selectedTenant.unit || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Status</Label>
                      <Badge variant={getStatusColor(selectedTenant.status)}>
                        {selectedTenant.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">Lease Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Lease Start Date</Label>
                      <p className="font-medium flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDisplayDate(selectedTenant.leaseStart)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Lease End Date</Label>
                      <p className="font-medium flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDisplayDate(selectedTenant.leaseEnd)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Monthly Rent</Label>
                      <p className="font-medium">
                        {formatCurrency(selectedTenant.rent, selectedTenant.currency)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Occupancy Date</Label>
                      <p className="font-medium flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDisplayDate(selectedTenant.occupancyDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium">Note:</p>
                    <p className="mt-1">
                      Only personal information can be updated here. To modify lease details or unit assignment,
                      please use the dedicated Assign / Unassign actions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditTenantDialog(false);
                setSelectedTenant(null);
              }}
              disabled={isUpdatingTenant}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTenant}
              disabled={isUpdatingTenant || !editTenantData.name || !editTenantData.email}
            >
              {isUpdatingTenant ? (
                <>
                  <Edit className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Unit Dialog */}
      <Dialog open={showAssignUnitDialog} onOpenChange={setShowAssignUnitDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Tenant to Unit</DialogTitle>
            <DialogDescription>
              Assign {tenantToAssign?.name} to a property unit and create a lease
            </DialogDescription>
          </DialogHeader>

          {tenantToAssign && (
            <div className="space-y-4">
              {/* Tenant Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2 text-blue-900">Tenant Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Name:</span> {tenantToAssign.name}
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Email:</span> {tenantToAssign.email}
                  </div>
                </div>
              </div>

              {/* Property and Unit Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assign-property">Property</Label>
                  <Select
                    value={assignmentData.propertyId}
                    onValueChange={(v) => setAssignmentData({ ...assignmentData, propertyId: v, unitId: '' })}
                  >
                    <SelectTrigger id="assign-property">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownerProperties.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="assign-unit">Unit/Apartment</Label>
                  <Select
                    value={assignmentData.unitId}
                    onValueChange={(v) => {
                      // Find the selected unit and auto-populate rent
                      const selectedUnit = assignmentPropertyUnits.find((u: any) => String(u.id) === v);
                      setAssignmentData({
                        ...assignmentData,
                        unitId: v,
                        rent: selectedUnit?.monthlyRent ? String(selectedUnit.monthlyRent) : ''
                      });
                    }}
                    disabled={!assignmentData.propertyId || assignmentPropertyUnits.length === 0}
                  >
                    <SelectTrigger id="assign-unit">
                      <SelectValue placeholder={
                        !assignmentData.propertyId
                          ? "Select property first"
                          : assignmentPropertyUnits.length === 0
                            ? "No vacant units available"
                            : "Select vacant unit"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {assignmentPropertyUnits.length > 0 ? (
                        assignmentPropertyUnits.map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.unitNumber} {u.type && `- ${u.type}`} {u.bedrooms && `(${u.bedrooms} bed)`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-units" disabled>
                          No vacant units available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {assignmentData.propertyId && assignmentPropertyUnits.length === 0 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      All units in this property are occupied
                    </p>
                  )}
                </div>
              </div>

              {/* Lease Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assign-lease-start">Lease Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !assignmentData.leaseStart && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {assignmentData.leaseStart ? format(new Date(assignmentData.leaseStart), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={assignmentData.leaseStart ? new Date(assignmentData.leaseStart) : undefined}
                        onSelect={(date) => setAssignmentData({ ...assignmentData, leaseStart: date ? format(date, 'yyyy-MM-dd') : '' })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assign-lease-end">Lease End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !assignmentData.leaseEnd && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {assignmentData.leaseEnd ? format(new Date(assignmentData.leaseEnd), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={assignmentData.leaseEnd ? new Date(assignmentData.leaseEnd) : undefined}
                        onSelect={(date) => setAssignmentData({ ...assignmentData, leaseEnd: date ? format(date, 'yyyy-MM-dd') : '' })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Monthly Rent */}
              <div className="grid gap-2">
                <Label htmlFor="assign-rent">Monthly Rent</Label>
                <Input
                  id="assign-rent"
                  type="number"
                  value={assignmentData.rent}
                  onChange={(e) => setAssignmentData({ ...assignmentData, rent: e.target.value })}
                  placeholder="Auto-populated from unit"
                  disabled={!!assignmentData.rent}
                  className={assignmentData.rent ? "bg-gray-50 cursor-not-allowed" : ""}
                />
                {assignmentData.rent && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Auto-filled from unit's monthly rent
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium">Note:</p>
                    <p className="mt-1">This will create an active lease for the tenant. Make sure the unit is vacant and all details are correct.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignUnitDialog(false);
                setTenantToAssign(null);
                setAssignmentData({
                  propertyId: '',
                  unitId: '',
                  leaseStart: '',
                  leaseEnd: '',
                  rent: ''
                });
              }}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignUnit}
              disabled={isAssigning || !assignmentData.propertyId || !assignmentData.unitId || !assignmentData.leaseStart || !assignmentData.leaseEnd || !assignmentData.rent}
            >
              {isAssigning ? (
                <>
                  <Home className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Assign to Unit
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

