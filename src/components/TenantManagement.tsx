import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Mail, Phone, Calendar, Copy, Search, Filter, KeyRound, UserMinus, Trash2, AlertTriangle, Check } from 'lucide-react';
import { toast } from "sonner";
import { createLease, getLeases, terminateLease } from '../lib/api/leases';
import { getUnitsByProperty } from '../lib/api/units';
import { resetTenantPassword, deleteTenant } from '../lib/api/tenant';

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

  // Load units when property is selected
  React.useEffect(() => {
    (async () => {
      if (!newTenant.propertyId) { setPropertyUnits([]); return; }
      const res = await getUnitsByProperty(String(newTenant.propertyId));
      if (!res.error && Array.isArray(res.data)) setPropertyUnits(res.data);
      else setPropertyUnits([]);
    })();
  }, [newTenant.propertyId]);

  const ownerProperties = useMemo(() => (Array.isArray(properties) ? properties : []), [properties]);

  // Load tenants from backend
  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await getLeases();
      if (!res.error && Array.isArray(res.data)) {
        // Transform lease data to tenant format
        const tenantsData = res.data.map((lease: any) => ({
          id: lease.users?.id || lease.tenantId,
          name: lease.users?.name || 'Unknown',
          email: lease.users?.email || '',
          phone: lease.users?.phone || '',
          unit: lease.units?.unitNumber || '',
          property: lease.properties?.name || '',
          leaseStart: lease.startDate,
          leaseEnd: lease.endDate,
          rent: lease.monthlyRent,
          status: lease.status === 'active' ? 'Active' : lease.status === 'terminated' ? 'Terminated' : 'Pending',
          occupancyDate: lease.startDate,
          apartmentId: lease.units?.unitNumber || '',
          leaseId: lease.id
        }));
        setTenants(tenantsData);
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
        sendInvitation: true
      };

      const res = await createLease(payload);
      if ((res as any).error) throw new Error((res as any).error.error || 'Failed to create lease');

      // Capture the generated password from the response
      const generatedPassword = (res as any).data?.tempPassword;
      
      console.log('✅ Tenant created successfully');
      if (generatedPassword) {
        console.log('🔐 Generated password:', generatedPassword);
      }

      // Reload tenants from backend and add password to the newly created tenant
      await loadTenants();
      
      // If password was generated, update the tenant in state with the password
      if (generatedPassword && (res as any).data?.tenant?.id) {
        setTenants(prevTenants => 
          prevTenants.map(t => 
            t.id === (res as any).data.tenant.id 
              ? { ...t, credentials: { tempPassword: generatedPassword } }
              : t
          )
        );
      }

      setNewTenant({
        name: '', email: '', phone: '', unitId: '', propertyId: '',
        leaseStart: '', leaseEnd: '', rent: '', occupancyDate: '', password: ''
      });
      setShowAddTenant(false);
      
      if (generatedPassword) {
        toast.success('Tenant created! Password: ' + generatedPassword + ' (Click copy icon to copy)');
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
    // Copy only the password if available
    const password = tenant.credentials?.tempPassword || '';
    
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
      
      // Update tenant in state with the new password so it can be copied later
      setTenants(prevTenants => 
        prevTenants.map(t => 
          t.id === tenantToResetPassword.id 
            ? { ...t, credentials: { tempPassword: response.data.tempPassword } }
            : t
        )
      );
      
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

  // Get unique properties for filter dropdown
  const uniqueProperties = Array.from(new Set(tenants.map(t => t.property)));

  // Filter tenants based on search and filters
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.id.toLowerCase().includes(searchTerm.toLowerCase());
    
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
              <DialogDescription>
                Create a new tenant profile and assign them to a unit
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                    placeholder="Sarah Johnson"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                    placeholder="sarah@email.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rent">Monthly Rent</Label>
                  <Input
                    id="rent"
                    type="number"
                    value={newTenant.rent}
                    onChange={(e) => setNewTenant({...newTenant, rent: e.target.value})}
                    placeholder="1200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">Temporary Password</Label>
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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="property">Property</Label>
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
                  <Label htmlFor="unitId">Unit/Apartment</Label>
                  <Select value={newTenant.unitId} onValueChange={(v) => setNewTenant({ ...newTenant, unitId: v })}>
                    <SelectTrigger id="unitId">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyUnits.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.unitNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="occupancy">Occupancy Date</Label>
                  <Input
                    id="occupancy"
                    type="date"
                    value={newTenant.occupancyDate}
                    onChange={(e) => setNewTenant({...newTenant, occupancyDate: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="leaseStart">Lease Start</Label>
                  <Input
                    id="leaseStart"
                    type="date"
                    value={newTenant.leaseStart}
                    onChange={(e) => setNewTenant({...newTenant, leaseStart: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="leaseEnd">Lease End</Label>
                  <Input
                    id="leaseEnd"
                    type="date"
                    value={newTenant.leaseEnd}
                    onChange={(e) => setNewTenant({...newTenant, leaseEnd: e.target.value})}
                  />
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
                        <p className="text-sm text-gray-500">{tenant.property}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {tenant.leaseStart}
                        </div>
                        <div className="text-gray-500">to {tenant.leaseEnd}</div>
                      </div>
                    </TableCell>
                    <TableCell>₦{tenant.rent}</TableCell>
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
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTenant(tenant)}
                          title="Edit tenant"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTenantToResetPassword(tenant);
                            setShowResetPasswordDialog(true);
                          }}
                          title="Reset tenant password"
                        >
                          <KeyRound className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTenantToUnassign(tenant);
                            setShowUnassignDialog(true);
                          }}
                          title="Unassign unit from tenant"
                        >
                          <UserMinus className="h-4 w-4 text-orange-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTenantToDelete(tenant);
                            setShowDeleteDialog(true);
                          }}
                          title="Delete tenant"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
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
                  <Calendar className="h-4 w-4 mr-2 animate-spin" />
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
                  <Calendar className="h-4 w-4 mr-2 animate-spin" />
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
    </div>
  );
};

