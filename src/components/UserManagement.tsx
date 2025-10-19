import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Search, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Lock,
  XCircle,
  AlertCircle,
  LayoutGrid,
  List,
  CheckCircle,
  Mail,
  Phone,
  Building
} from 'lucide-react';

interface UserManagementProps {
  user: any;
  users: any[];
  roles: any[];
  onAddUser: (userData: any) => void;
  onUpdateUser: (userId: string, updates: any) => void;
  onDeleteUser: (userId: string) => void;
  onAddRole: (roleData: any) => void;
  onUpdateRole: (roleId: string, updates: any) => void;
  onDeleteRole: (roleId: string) => void;
  onBack: () => void;
}

export function UserManagement({ 
  user, 
  users, 
  roles,
  onAddUser, 
  onUpdateUser, 
  onDeleteUser,
  onAddRole,
  onUpdateRole,
  onDeleteRole,
  onBack 
}: UserManagementProps) {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [roleViewMode, setRoleViewMode] = useState<'grid' | 'list'>('grid');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin', // Default to admin role for internal users
    company: 'PropertyHub Admin', // Internal admin company
    department: '',
    isActive: true,
    sendInvite: true
  });

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  });

  const availablePermissions = [
    'user_management',
    'property_management', 
    'tenant_management',
    'financial_reports',
    'maintenance_management',
    'access_control',
    'analytics_view',
    'billing_management',
    'system_settings',
    'support_tickets'
  ];

  // Filter users based on search and filters
  const filteredUsers = users.filter(userItem => {
    const matchesSearch = userItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userItem.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || userItem.status === statusFilter;
    const matchesRole = roleFilter === 'all' || userItem.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Send data to backend API
    onAddUser(newUser);
    
    // Reset form
    setNewUser({
      name: '',
      email: '',
      phone: '',
      role: 'admin', // Default to admin role for internal users
      company: 'PropertyHub Admin', // Internal admin company
      department: '',
      isActive: true,
      sendInvite: true
    });
    setShowAddUser(false);
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    const roleData = {
      ...newRole,
      id: `ROLE${Date.now()}`,
      createdAt: new Date().toISOString(),
      userCount: 0
    };
    
    onAddRole(roleData);
    setNewRole({
      name: '',
      description: '',
      permissions: [],
      isActive: true
    });
    setShowAddRole(false);
  };

  const toggleUserStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    onUpdateUser(userId, { status: newStatus });
  };

  const resetUserPassword = (userId: string) => {
    if (confirm('Are you sure you want to reset this user\'s password? They will receive an email with instructions.')) {
      onUpdateUser(userId, { passwordResetSent: new Date().toISOString() });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 flex items-center"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="flex items-center"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (roleName: string) => {
    const colors: Record<string, string> = {
      'Super Admin': 'bg-red-100 text-red-800',
      'Property Owner': 'bg-blue-100 text-blue-800', 
      'Property Manager': 'bg-purple-100 text-purple-800',
      'Tenant': 'bg-green-100 text-green-800',
      'Support Staff': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={`${colors[roleName] || 'bg-gray-100 text-gray-800'} flex items-center`}>
        <Shield className="h-3 w-3 mr-1" />
        {roleName}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Internal User Management</h2>
          <p className="text-gray-600">Manage internal admin users (staff, support team, etc.). Customer users are managed in Customer Management.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowAddRole(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Add Role
          </Button>
          
          <Button onClick={() => setShowAddUser(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Internal User
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users ({users.length})</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Roles ({roles.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search users by name, email, or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Internal Admin Users</CardTitle>
                <CardDescription>
                  Internal staff, support team, and platform administrators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {userItem.name.split(' ').map((n: string) => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{userItem.name}</div>
                                <div className="text-sm text-gray-600">{userItem.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(userItem.role)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{userItem.company || 'N/A'}</div>
                              {userItem.department && (
                                <div className="text-sm text-gray-600">{userItem.department}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(userItem.status)}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {userItem.lastLogin ? new Date(userItem.lastLogin).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(userItem);
                                  setShowUserDetails(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => resetUserPassword(userItem.id)}>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleUserStatus(userItem.id, userItem.status)}>
                                  {userItem.status === 'active' ? (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this user?')) {
                                      onDeleteUser(userItem.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            {/* View Mode Toggle */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {roles.length} role{roles.length !== 1 ? 's' : ''} available
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={roleViewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRoleViewMode('grid')}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={roleViewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRoleViewMode('list')}
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grid View */}
            {roleViewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roles.map((role) => (
                  <Card key={role.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <Shield className="h-5 w-5" />
                            <span>{role.name}</span>
                          </CardTitle>
                          <CardDescription>{role.description}</CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this role?')) {
                                  onDeleteRole(role.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Users</span>
                            <Badge variant="secondary">{role.userCount || 0}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Status</span>
                            {role.isActive ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-2">Permissions</div>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((permission: string) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* List View */}
            {roleViewMode === 'list' && (
              <Card>
                <CardHeader>
                  <CardTitle>Roles</CardTitle>
                  <CardDescription>
                    Complete list of all roles and their permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{role.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{role.description}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{role.userCount || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {role.permissions.slice(0, 2).map((permission: string) => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                              {role.permissions.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{role.permissions.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {role.isActive ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Role
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this role?')) {
                                      onDeleteRole(role.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Role
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Internal Admin User</DialogTitle>
            <DialogDescription>
              Create a new internal admin user (staff, support team, etc.). This is NOT for customer users.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="support">Support Staff</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newUser.company}
                  onChange={(e) => setNewUser(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="PropertyHub Admin"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={newUser.department}
                  onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g., Customer Support, IT, etc."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sendInvite"
                checked={newUser.sendInvite}
                onCheckedChange={(checked) => setNewUser(prev => ({ ...prev, sendInvite: checked }))}
              />
              <Label htmlFor="sendInvite">Send invitation email</Label>
            </div>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddUser(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new role with specific permissions
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddRole} className="space-y-4">
            <div>
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                value={newRole.name}
                onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Property Manager, Support Staff"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this role is responsible for..."
                rows={3}
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {availablePermissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`perm-${permission}`}
                      checked={newRole.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewRole(prev => ({
                            ...prev,
                            permissions: [...prev.permissions, permission]
                          }));
                        } else {
                          setNewRole(prev => ({
                            ...prev,
                            permissions: prev.permissions.filter(p => p !== permission)
                          }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`perm-${permission}`} className="text-sm">
                      {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddRole(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create Role
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Detailed information for {selectedUser.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xl font-medium">
                      {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRoleBadge(selectedUser.role)}
                      {getStatusBadge(selectedUser.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedUser.email}</span>
                      </div>
                      {selectedUser.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{selectedUser.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Organization</h4>
                    <div className="space-y-2">
                      {selectedUser.company && (
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{selectedUser.company}</span>
                        </div>
                      )}
                      {selectedUser.department && (
                        <div className="text-sm text-gray-600">
                          Department: {selectedUser.department}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Account Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Login:</span>
                      <span className="ml-2">
                        {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
