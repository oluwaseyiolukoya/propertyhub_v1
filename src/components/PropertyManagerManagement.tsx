import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription } from "./ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Plus, Edit, Mail, Phone, MapPin, Building, Users, Eye, Copy, Settings, Trash2, UserPlus, KeyRound, RefreshCcw, MoreHorizontal, Shield, CheckCircle } from 'lucide-react';
import { toast } from "sonner";
import { getManagerStats, ManagerStats, resetManagerPassword } from '../lib/api/property-managers';

interface PropertyManagerManagementProps {
  user: any;
  managers: any[];
  properties: any[];
  propertyAssignments: any[];
  onAddManager: (managerData: any, ownerId: string) => Promise<any>;
  onAssignManager: (managerId: string, propertyId: string, permissions?: any) => Promise<void>;
  onRemoveManager: (managerId: string, propertyId: string) => Promise<void>;
  onUpdateManager: (managerId: string, updates: any) => Promise<void>;
  onDeactivateManager: (managerId: string) => Promise<void>;
  onRefreshManagers?: () => Promise<void>;
}

export const PropertyManagerManagement = ({
  user,
  managers,
  properties,
  propertyAssignments,
  onAddManager,
  onAssignManager,
  onRemoveManager,
  onUpdateManager,
  onDeactivateManager,
  onRefreshManagers
}: PropertyManagerManagementProps) => {
  const [showAddManager, setShowAddManager] = useState(false);
  const [showAssignProperties, setShowAssignProperties] = useState(false);
  const [showUnassignProperties, setShowUnassignProperties] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [newManager, setNewManager] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [managerStats, setManagerStats] = useState<ManagerStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [unassigningPropertyId, setUnassigningPropertyId] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);
  const [showEditPermissions, setShowEditPermissions] = useState(false);
  const [selectedPropertyForPermissions, setSelectedPropertyForPermissions] = useState<any>(null);
  const [editingPermissions, setEditingPermissions] = useState({ canEdit: false, canDelete: false });

  // Load manager statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true);
        const response = await getManagerStats();
        if (!response.error && response.data) {
          setManagerStats(response.data);
        }
      } catch (error) {
        console.error('Failed to load manager stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [managers, propertyAssignments]); // Reload when managers or assignments change

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setGeneratedPassword(pwd);
    return pwd;
  };

  // Show all managers for current customer (backend already scopes by customer)
  const ownersManagers = managers;

  const handleAddManager = async () => {
    if (!newManager.name || !newManager.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const tempPwd = generatedPassword || generateStrongPassword();
    const payload = {
      ...newManager,
      password: tempPwd,
      credentials: {
        username: newManager.email.split('@')[0],
        tempPassword: tempPwd
      }
    };
    try {
      const manager = await onAddManager(payload, user.id);
      setNewManager({ name: '', email: '', phone: '' });
      setGeneratedPassword('');
      setShowAddManager(false);
      toast.success(`Manager ${manager.name} created successfully! Credentials: ${manager.credentials.username} / ${manager.credentials.tempPassword}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create manager');
    }
  };

  const getManagerAssignedProperties = (manager: any) => {
    const assignments = Array.isArray(manager.property_managers) ? manager.property_managers : [];
    const assignedPropertyIds = assignments.filter((a: any) => a && a.isActive !== false)
      .map((a: any) => (a.properties?.id ?? a.propertyId)?.toString())
      .filter(Boolean);
    return properties.filter((p) => assignedPropertyIds.includes(p.id.toString()));
  };

  const handleAssignProperties = async (
    managerId: string,
    selectedPropertyIds: string[],
    propertyPermissions?: Record<string, any>
  ) => {
    // Get current assignments for this manager from this owner
    const manager = managers.find((m) => m.id === managerId) || {} as any;
    const currentAssignments = (Array.isArray(manager.property_managers) ? manager.property_managers : [])
      .filter((a: any) => a && a.isActive !== false)
      .map((a: any) => (a.properties?.id ?? a.propertyId)?.toString())
      .filter(Boolean);

    // Remove properties that are no longer selected
    for (const propertyId of currentAssignments) {
      if (!selectedPropertyIds.includes(propertyId)) {
        await onRemoveManager(managerId, propertyId);
      }
    }

    // Add new property assignments with permissions
    for (const propertyId of selectedPropertyIds) {
      if (!currentAssignments.includes(propertyId)) {
        const permissions = propertyPermissions?.[propertyId] || { canEdit: false, canDelete: false };
        await onAssignManager(managerId, propertyId, permissions);
      }
    }

    setShowAssignProperties(false);
    setSelectedManager(null);
    toast.success('Property assignments updated successfully');
  };


  const handleGeneratePassword = async (manager: any) => {
    try {
      // Call the backend reset-password endpoint
      const response = await resetManagerPassword(manager.id);

      if (response.error) {
        throw new Error(response.error);
      }

      // Set the password from backend response
      const pwd = response.data?.tempPassword || '';
      setNewPassword(pwd);
      setSelectedManager(manager);
      setShowPasswordDialog(true);

      console.log('✅ Password generated for manager:', manager.email);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate password');
    }
  };

  const handleSaveNewPassword = async () => {
    if (!selectedManager || !newPassword) return;

    try {
      // Copy ONLY the password to clipboard
      navigator.clipboard.writeText(newPassword);

      toast.success('Password copied to clipboard! Manager can now log in.');
      setShowPasswordDialog(false);
      setNewPassword('');
      setSelectedManager(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to copy password');
    }
  };

  const handleToggleManagerStatus = async (manager: any) => {
    try {
      setIsTogglingStatus(manager.id);
      const newStatus = !manager.isActive;

      await onUpdateManager(manager.id, {
        isActive: newStatus
      });

      toast.success(`Manager ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update manager status');
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const handleUnassignProperty = async (managerId: string, propertyId: string, propertyName: string) => {
    try {
      setUnassigningPropertyId(propertyId);
      await onRemoveManager(managerId, propertyId);
      toast.success(`Unassigned ${propertyName} from manager`);

      // Reload stats after unassignment
      const response = await getManagerStats();
      if (!response.error && response.data) {
        setManagerStats(response.data);
      }
    } catch (error: any) {
      console.error('Failed to unassign property:', error);
      toast.error(error?.message || 'Failed to unassign property');
    } finally {
      setUnassigningPropertyId(null);
    }
  };

  const handleOpenEditPermissions = (manager: any, property: any) => {
    // Get current permissions for this property
    const managerAssignment = manager.property_managers?.find(
      (pm: any) => pm.propertyId === property.id && pm.isActive
    );

    const currentPermissions = managerAssignment?.permissions || { canEdit: false, canDelete: false };

    setSelectedManager(manager);
    setSelectedPropertyForPermissions(property);
    setEditingPermissions(currentPermissions);

    // Close the unassign dialog if it's open
    setShowUnassignProperties(false);

    // Open the edit permissions dialog
    setShowEditPermissions(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedManager || !selectedPropertyForPermissions) return;

    try {
      // Call API to update permissions
      await onAssignManager(selectedManager.id, selectedPropertyForPermissions.id, editingPermissions);

      // Reload managers data to reflect changes
      if (onRefreshManagers) {
        await onRefreshManagers();
      }

      // Reload manager stats to reflect changes
      const response = await getManagerStats();
      if (!response.error && response.data) {
        setManagerStats(response.data);
      }

      toast.success('Permissions updated successfully');
      setShowEditPermissions(false);
      setSelectedManager(null);
      setSelectedPropertyForPermissions(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update permissions');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Property Manager Management</h1>
            </div>
            <p className="text-purple-100 text-lg">Create and manage property managers for your portfolio</p>
          </div>
          <Button
            onClick={() => setShowAddManager(true)}
            className="bg-white text-[#7C3AED] hover:bg-purple-50 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Manager
          </Button>
        </div>
      </div>

      {/* Add Manager Dialog - Enhanced Design */}
      <Dialog open={showAddManager} onOpenChange={setShowAddManager}>
        <DialogContent className="max-w-lg border-0 shadow-2xl p-0 overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white m-0">
                  Add New Property Manager
                </DialogTitle>
                <DialogDescription className="text-purple-200 mt-1">
                  Create a manager account for your properties
              </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Personal Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#7C3AED]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Personal Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Full Name
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                <Input
                  id="name"
                  value={newManager.name}
                  onChange={(e) => setNewManager({...newManager, name: e.target.value})}
                      placeholder="e.g., Sarah Johnson"
                      className="pl-10 h-11 rounded-xl border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Email Address
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                <Input
                  id="email"
                  type="email"
                  value={newManager.email}
                  onChange={(e) => setNewManager({...newManager, email: e.target.value})}
                      placeholder="e.g., sarah@company.com"
                      className="pl-10 h-11 rounded-xl border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
              </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                    Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
                  </Label>
                  <div className="relative mt-1.5">
                <Input
                  id="phone"
                  value={newManager.phone}
                  onChange={(e) => setNewManager({...newManager, phone: e.target.value})}
                      placeholder="+234 800 000 0000"
                      className="pl-10 h-11 rounded-xl border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
              </div>
              </div>

            {/* Password Generation Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <KeyRound className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Password</h3>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                  <Input
                    readOnly
                    value={generatedPassword}
                      placeholder="Click Generate to create password"
                      className="h-11 rounded-xl border-gray-200 bg-white pr-10 font-mono text-sm"
                  />
                    {generatedPassword && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={generateStrongPassword}
                    className="h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl px-4"
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!generatedPassword) return;
                      navigator.clipboard.writeText(generatedPassword);
                      toast.success('Password copied to clipboard');
                    }}
                    disabled={!generatedPassword}
                    className="h-11 rounded-xl border-gray-200 hover:bg-purple-50 hover:text-[#7C3AED] hover:border-[#7C3AED] disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Share this password securely with the manager. They can change it after logging in.
                </p>
              </div>
              </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-[#7C3AED]" />
            </div>
                <div>
                  <p className="text-sm font-semibold text-purple-900 mb-1">What happens next?</p>
                  <p className="text-xs text-purple-700 leading-relaxed">
                    The manager can log in immediately with these credentials. You can then assign
                    properties to them from this page.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setShowAddManager(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl px-5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddManager}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25 rounded-xl px-6"
              >
              <UserPlus className="h-4 w-4 mr-2" />
                Create Manager
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* Manager Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Managers Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Total Managers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-[#7C3AED]">
              {loadingStats ? '...' : managerStats?.totalManagers || ownersManagers.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {managerStats?.activeManagers || 0} active, {managerStats?.pendingManagers || 0} pending
              {managerStats && managerStats.inactiveManagers > 0 && `, ${managerStats.inactiveManagers} inactive`}
            </p>
          </CardContent>
        </Card>

        {/* Properties Managed Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Properties Managed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-600">
              {loadingStats ? '...' : managerStats?.propertiesManaged || propertyAssignments.filter(a => a.ownerId === user.id && a.isActive).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {managerStats?.unmanagedProperties || 0} properties without managers
            </p>
          </CardContent>
        </Card>

        {/* Coverage Rate Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Coverage Rate</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-600">
              {loadingStats ? '...' : `${managerStats?.coverageRate.toFixed(1) || Math.round((propertyAssignments.filter(a => a.ownerId === user.id && a.isActive).length / properties.length) * 100)}%`}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {managerStats?.propertiesManaged || 0} of {managerStats?.totalProperties || properties.length} properties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Managers Table */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Property Managers</CardTitle>
              <CardDescription className="text-gray-600">
                Manage your property managers and their assignments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-xl border-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Manager
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Assigned Properties
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ownersManagers.map((manager, index) => {
                  const assignedProperties = getManagerAssignedProperties(manager);
                  return (
                    <TableRow
                      key={manager.id}
                      className={`hover:bg-[#7C3AED]/5 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{manager.name}</p>
                          <p className="text-sm text-gray-500">{manager.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {manager.email}
                          </div>
                          {manager.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1" />
                              {manager.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{assignedProperties.length} properties</p>
                          {assignedProperties.length > 0 && (
                            <div className="text-sm text-gray-500 mt-1">
                              {assignedProperties.slice(0, 2).map(p => p.name).join(', ')}
                              {assignedProperties.length > 2 && ` +${assignedProperties.length - 2} more`}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={manager.isActive ? 'default' : 'secondary'}>
                          {manager.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
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
                            <DropdownMenuLabel>Manager Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedManager(manager);
                                setShowAssignProperties(true);
                              }}
                            >
                              <Building className="h-4 w-4 mr-2" />
                              Assign Properties
                            </DropdownMenuItem>

                            {assignedProperties.length > 0 && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedManager(manager);
                                  setShowUnassignProperties(true);
                                }}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Manage Assigned
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleGeneratePassword(manager)}
                            >
                              <KeyRound className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleToggleManagerStatus(manager)}
                              disabled={isTogglingStatus === manager.id}
                            >
                              {isTogglingStatus === manager.id ? (
                                <>
                                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Settings className="h-4 w-4 mr-2" />
                                  {manager.isActive ? 'Deactivate' : 'Activate'}
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => {
                                // TODO: Implement delete manager
                                toast.info('Delete manager feature coming soon');
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Manager
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {ownersManagers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No managers yet</p>
                        <p className="text-sm">Add your first property manager to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Property Assignment Modal */}
      <Dialog open={showAssignProperties} onOpenChange={setShowAssignProperties}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Properties - {selectedManager?.name}</DialogTitle>
            <DialogDescription>
              Select which properties this manager should have access to
            </DialogDescription>
          </DialogHeader>

          {selectedManager && (
            <PropertyAssignmentForm
              manager={selectedManager}
              properties={properties}
              currentAssignments={getManagerAssignedProperties(selectedManager)}
              allPropertyAssignments={propertyAssignments}
              onSave={(selectedIds, permissions) => handleAssignProperties(selectedManager.id, selectedIds, permissions)}
              onCancel={() => {
                setShowAssignProperties(false);
                setSelectedManager(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Unassign Properties Dialog */}
      <Dialog open={showUnassignProperties} onOpenChange={setShowUnassignProperties}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Unassign Properties - {selectedManager?.name}</DialogTitle>
            <DialogDescription>
              Remove property assignments from this manager
            </DialogDescription>
          </DialogHeader>

          {selectedManager && (
            <div className="space-y-4">
              <div className="max-h-96 overflow-auto border rounded-lg">
                <div className="space-y-2 p-4">
                  {getManagerAssignedProperties(selectedManager).map((property) => {
                    // Get current permissions for this property
                    const managerAssignment = selectedManager.property_managers?.find(
                      (pm: any) => pm.propertyId === property.id && pm.isActive
                    );
                    const permissions = managerAssignment?.permissions || { canEdit: false, canDelete: false };

                    return (
                      <div key={property.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border">
                        <div className="flex-1">
                          <div className="font-medium">{property.name}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {property.address}
                          </div>
                          {property.city && (
                            <div className="text-xs text-gray-400 mt-1">
                              {property.city}, {property.state}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            {permissions.canEdit && (
                              <Badge variant="secondary" className="text-xs">Can Edit</Badge>
                            )}
                            {permissions.canDelete && (
                              <Badge variant="secondary" className="text-xs">Can Delete</Badge>
                            )}
                            {!permissions.canEdit && !permissions.canDelete && (
                              <Badge variant="outline" className="text-xs">View Only</Badge>
                            )}
                          </div>
                        </div>

                        {/* Three-dot menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={unassigningPropertyId === property.id}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenEditPermissions(selectedManager, property)}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUnassignProperty(selectedManager.id, property.id, property.name)}
                              disabled={unassigningPropertyId === property.id}
                              className="text-red-600"
                            >
                              {unassigningPropertyId === property.id ? (
                                <>
                                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                                  Removing...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Unassign Property
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                  {getManagerAssignedProperties(selectedManager).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No properties assigned to this manager
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUnassignProperties(false);
                    setSelectedManager(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New Password - {selectedManager?.name}</DialogTitle>
            <DialogDescription>
              A new password has been generated. Copy it and share with the manager securely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Manager Email</label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded border">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{selectedManager?.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newPassword}
                  readOnly
                  className="flex-1 p-3 border rounded font-mono text-sm bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(newPassword);
                    toast.success('Password copied to clipboard');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!selectedManager) return;
                    try {
                      const response = await resetManagerPassword(selectedManager.id);
                      if (response.error) {
                        throw new Error(response.error);
                      }
                      const pwd = response.data?.tempPassword || '';
                      setNewPassword(pwd);
                      toast.success('New password generated');
                    } catch (error: any) {
                      toast.error(error?.message || 'Failed to regenerate password');
                    }
                  }}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Password will be copied to clipboard when saved
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <KeyRound className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important:</p>
                  <p className="mt-1">Make sure to share this password with the manager securely. They will need it to log in.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setNewPassword('');
                setSelectedManager(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveNewPassword}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={showEditPermissions} onOpenChange={setShowEditPermissions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            <DialogDescription>
              Update permissions for {selectedPropertyForPermissions?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedPropertyForPermissions && selectedManager && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start space-x-3">
                  <Building className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{selectedPropertyForPermissions.name}</p>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedPropertyForPermissions.address}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Manager Permissions:</p>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="edit-permission"
                    checked={editingPermissions.canEdit}
                    onCheckedChange={(checked) =>
                      setEditingPermissions(prev => ({ ...prev, canEdit: checked as boolean }))
                    }
                  />
                  <div className="flex-1">
                    <label htmlFor="edit-permission" className="font-medium cursor-pointer text-sm">
                      Can Edit Property
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Allow manager to modify property details, features, and settings
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="delete-permission"
                    checked={editingPermissions.canDelete}
                    onCheckedChange={(checked) =>
                      setEditingPermissions(prev => ({ ...prev, canDelete: checked as boolean }))
                    }
                  />
                  <div className="flex-1">
                    <label htmlFor="delete-permission" className="font-medium cursor-pointer text-sm">
                      Can Delete Property
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Allow manager to archive or delete this property
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Changes will take effect immediately. The manager will be notified of updated permissions.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditPermissions(false);
                setSelectedManager(null);
                setSelectedPropertyForPermissions(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePermissions}>
              <Settings className="h-4 w-4 mr-2" />
              Save Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Property Assignment Form Component
const PropertyAssignmentForm = ({
  manager,
  properties,
  currentAssignments,
  allPropertyAssignments,
  onSave,
  onCancel
}: {
  manager: any;
  properties: any[];
  currentAssignments: any[];
  allPropertyAssignments: any[];
  onSave: (selectedIds: string[], permissions?: Record<string, any>) => void;
  onCancel: () => void;
}) => {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [propertyPermissions, setPropertyPermissions] = useState<Record<string, any>>({});

  // Get IDs of properties already assigned to this manager
  const currentAssignmentIds = currentAssignments.map(p => p.id.toString());

  // Get IDs of properties assigned to ANY manager (excluding this manager)
  const assignedToOtherManagersIds = allPropertyAssignments
    .filter(a => a.isActive && a.managerId !== manager.id)
    .map(a => a.propertyId.toString());

  // Filter out properties that are already assigned to this manager OR to other managers
  const availableProperties = properties.filter(
    property => !currentAssignmentIds.includes(property.id.toString()) &&
                !assignedToOtherManagersIds.includes(property.id.toString())
  );

  const handlePropertyToggle = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties(prev => [...prev, propertyId]);
      // Initialize default permissions for this property
      setPropertyPermissions(prev => ({
        ...prev,
        [propertyId]: { canEdit: false, canDelete: false }
      }));
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
      // Remove permissions for this property
      setPropertyPermissions(prev => {
        const { [propertyId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePermissionToggle = (propertyId: string, permission: string, checked: boolean) => {
    setPropertyPermissions(prev => ({
      ...prev,
      [propertyId]: {
        ...prev[propertyId],
        [permission]: checked
      }
    }));
  };

  return (
    <div className="space-y-4">
      {availableProperties.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No properties available to assign</p>
          <p className="text-sm text-gray-500 mt-1">
            All properties are already assigned to managers
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-96 overflow-auto border rounded-lg">
            <div className="space-y-3 p-4">
              {availableProperties.map((property) => {
                const isSelected = selectedProperties.includes(property.id.toString());
                const permissions = propertyPermissions[property.id.toString()] || { canEdit: false, canDelete: false };

                return (
                  <div key={property.id} className={`border rounded-lg p-3 ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`property-${property.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handlePropertyToggle(property.id.toString(), checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <label htmlFor={`property-${property.id}`} className="font-medium cursor-pointer">
                              {property.name}
                            </label>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {property.address}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">{property.units || property.totalUnits || 0} units</div>
                          </div>
                        </div>

                        {/* Permissions - Only show if property is selected */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs font-medium text-gray-700 mb-2">Manager Permissions:</p>
                            <div className="flex gap-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`property-${property.id}-edit`}
                                  checked={permissions.canEdit}
                                  onCheckedChange={(checked) => handlePermissionToggle(property.id.toString(), 'canEdit', checked as boolean)}
                                />
                                <label htmlFor={`property-${property.id}-edit`} className="text-sm cursor-pointer">
                                  Can Edit Property
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`property-${property.id}-delete`}
                                  checked={permissions.canDelete}
                                  onCheckedChange={(checked) => handlePermissionToggle(property.id.toString(), 'canDelete', checked as boolean)}
                                />
                                <label htmlFor={`property-${property.id}-delete`} className="text-sm cursor-pointer">
                                  Can Delete Property
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  {selectedProperties.length} properties selected
                </p>
                <p className="text-sm text-blue-700">
                  {manager.name} will have access to manage these properties
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onSave(selectedProperties, propertyPermissions)} disabled={selectedProperties.length === 0}>
              Save Assignments
            </Button>
          </div>
        </>
      )}
    </div>
  );
};


