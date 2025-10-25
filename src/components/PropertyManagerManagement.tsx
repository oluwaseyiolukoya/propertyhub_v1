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
import { Plus, Edit, Mail, Phone, MapPin, Building, Users, Eye, Copy, Settings, Trash2, UserPlus, KeyRound, RefreshCcw, MoreHorizontal } from 'lucide-react';
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Property Manager Management</h2>
          <p className="text-gray-600 mt-1">Create and manage property managers for your portfolio</p>
        </div>

        <Dialog open={showAddManager} onOpenChange={setShowAddManager}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Manager
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Property Manager</DialogTitle>
              <DialogDescription>
                Create a new manager account and assign them to your properties
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newManager.name}
                  onChange={(e) => setNewManager({...newManager, name: e.target.value})}
                  placeholder="Sarah Johnson"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newManager.email}
                  onChange={(e) => setNewManager({...newManager, email: e.target.value})}
                  placeholder="sarah@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={newManager.phone}
                  onChange={(e) => setNewManager({...newManager, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="grid gap-2">
                <Label>Generate Password</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={generatedPassword}
                    placeholder="Click Generate to create a strong password"
                  />
                  <Button type="button" variant="secondary" onClick={generateStrongPassword}>
                    <KeyRound className="h-4 w-4 mr-1" /> Generate
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
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Password will be included in the new manager's credentials.</p>
              </div>
              
              <Alert>
                <AlertDescription>
                  Login credentials will be automatically generated and can be shared with the manager.
                </AlertDescription>
              </Alert>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddManager(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddManager}>
                Create Manager
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Manager Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : managerStats?.totalManagers || ownersManagers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {managerStats?.activeManagers || 0} active, {managerStats?.pendingManagers || 0} pending
              {managerStats && managerStats.inactiveManagers > 0 && `, ${managerStats.inactiveManagers} inactive`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties Managed</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : managerStats?.propertiesManaged || propertyAssignments.filter(a => a.ownerId === user.id && a.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {managerStats?.unmanagedProperties || 0} properties without managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : `${managerStats?.coverageRate.toFixed(1) || Math.round((propertyAssignments.filter(a => a.ownerId === user.id && a.isActive).length / properties.length) * 100)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {managerStats?.propertiesManaged || 0} of {managerStats?.totalProperties || properties.length} properties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Managers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Property Managers</CardTitle>
          <CardDescription>
            Manage your property managers and their assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Assigned Properties</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ownersManagers.map((manager) => {
                  const assignedProperties = getManagerAssignedProperties(manager);
                  return (
                    <TableRow key={manager.id}>
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


