import React, { useState } from 'react';
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
import { Plus, Edit, Mail, Phone, MapPin, Building, Users, Eye, Copy, Settings, Trash2, UserPlus } from 'lucide-react';
import { toast } from "sonner";

interface PropertyManagerManagementProps {
  user: any;
  managers: any[];
  properties: any[];
  propertyAssignments: any[];
  onAddManager: (managerData: any, ownerId: string) => any;
  onAssignManager: (managerId: string, propertyId: string, ownerId: string) => void;
  onRemoveManager: (managerId: string, propertyId: string, ownerId: string) => void;
  onUpdateManager: (managerId: string, updates: any) => void;
  onDeactivateManager: (managerId: string) => void;
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
  onDeactivateManager
}: PropertyManagerManagementProps) => {
  const [showAddManager, setShowAddManager] = useState(false);
  const [showAssignProperties, setShowAssignProperties] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [newManager, setNewManager] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Get managers created by current owner or assigned to owner's properties
  const ownersManagers = managers.filter(manager => 
    manager.createdBy === user.id || 
    propertyAssignments.some(assignment => 
      assignment.ownerId === user.id && 
      assignment.managerId === manager.id && 
      assignment.isActive
    )
  );

  const handleAddManager = () => {
    if (!newManager.name || !newManager.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const manager = onAddManager(newManager, user.id);
    setNewManager({ name: '', email: '', phone: '' });
    setShowAddManager(false);
    toast.success(`Manager ${manager.name} created successfully! Credentials: ${manager.credentials.username} / ${manager.credentials.tempPassword}`);
  };

  const getManagerAssignedProperties = (managerId: string) => {
    const assignedPropertyIds = propertyAssignments
      .filter(assignment => 
        assignment.managerId === managerId && 
        assignment.ownerId === user.id && 
        assignment.isActive
      )
      .map(assignment => assignment.propertyId);
    
    return properties.filter(property => 
      assignedPropertyIds.includes(property.id.toString())
    );
  };

  const handleAssignProperties = (managerId: string, selectedPropertyIds: string[]) => {
    // Get current assignments for this manager from this owner
    const currentAssignments = propertyAssignments
      .filter(assignment => 
        assignment.managerId === managerId && 
        assignment.ownerId === user.id && 
        assignment.isActive
      )
      .map(assignment => assignment.propertyId);

    // Remove properties that are no longer selected
    currentAssignments.forEach(propertyId => {
      if (!selectedPropertyIds.includes(propertyId)) {
        onRemoveManager(managerId, propertyId, user.id);
      }
    });

    // Add new property assignments
    selectedPropertyIds.forEach(propertyId => {
      if (!currentAssignments.includes(propertyId)) {
        onAssignManager(managerId, propertyId, user.id);
      }
    });

    setShowAssignProperties(false);
    setSelectedManager(null);
    toast.success('Property assignments updated successfully');
  };

  const copyCredentials = (manager: any) => {
    const credentials = `Username: ${manager.credentials.username}\nPassword: ${manager.credentials.tempPassword}\nEmail: ${manager.email}`;
    navigator.clipboard.writeText(credentials);
    toast.success('Manager credentials copied to clipboard');
  };

  const sendCredentialsEmail = (manager: any) => {
    // Mock email sending
    toast.success(`Login credentials sent to ${manager.email}`);
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
            <div className="text-2xl font-bold">{ownersManagers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active property managers
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
              {propertyAssignments.filter(a => a.ownerId === user.id && a.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total assignments
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
              {Math.round((propertyAssignments.filter(a => a.ownerId === user.id && a.isActive).length / properties.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Properties with managers
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
                  <TableHead>Credentials</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ownersManagers.map((manager) => {
                  const assignedProperties = getManagerAssignedProperties(manager.id);
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
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyCredentials(manager)}
                            className="h-8 px-2"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendCredentialsEmail(manager)}
                            className="h-8 px-2"
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedManager(manager);
                              setShowAssignProperties(true);
                            }}
                          >
                            <Building className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeactivateManager(manager.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {ownersManagers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
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
              currentAssignments={getManagerAssignedProperties(selectedManager.id)}
              onSave={(selectedIds) => handleAssignProperties(selectedManager.id, selectedIds)}
              onCancel={() => {
                setShowAssignProperties(false);
                setSelectedManager(null);
              }}
            />
          )}
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
  onSave,
  onCancel
}: {
  manager: any;
  properties: any[];
  currentAssignments: any[];
  onSave: (selectedIds: string[]) => void;
  onCancel: () => void;
}) => {
  const [selectedProperties, setSelectedProperties] = useState<string[]>(
    currentAssignments.map(p => p.id.toString())
  );

  const handlePropertyToggle = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties(prev => [...prev, propertyId]);
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
    }
  };

  return (
    <div className="space-y-4">
      <div className="max-h-64 overflow-auto border rounded-lg">
        <div className="space-y-2 p-4">
          {properties.map((property) => (
            <div key={property.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
              <Checkbox
                id={`property-${property.id}`}
                checked={selectedProperties.includes(property.id.toString())}
                onCheckedChange={(checked) => handlePropertyToggle(property.id.toString(), checked as boolean)}
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
                    <div className="font-medium">{property.units} units</div>
                    <div className="text-gray-500">{property.occupancyRate}% occupied</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
        <Button onClick={() => onSave(selectedProperties)}>
          Save Assignments
        </Button>
      </div>
    </div>
  );
};


