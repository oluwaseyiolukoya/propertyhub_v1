import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { toast } from 'sonner';
import {
  getTeamMembers,
  getTeamRoles,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  createTeamRole,
  type TeamMember,
  type TeamRole,
  type CreateTeamMemberRequest,
  type CreateRoleRequest,
} from '../../../lib/api/team';

export const TeamManagementTab: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Form states
  const [memberForm, setMemberForm] = useState<CreateTeamMemberRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    roleId: '',
    canApproveInvoices: false,
    approvalLimit: undefined,
    canCreateInvoices: false,
    canManageProjects: false,
    canViewReports: false,
  });

  const [roleForm, setRoleForm] = useState<CreateRoleRequest>({
    name: '',
    description: '',
    canApproveInvoices: false,
    approvalLimit: undefined,
    permissions: {},
  });

  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, rolesRes] = await Promise.all([
        getTeamMembers(),
        getTeamRoles(),
      ]);

      // Handle the API response structure properly
      if (membersRes.data) {
        // Check if data is an array or has a nested data property
        const membersList = Array.isArray(membersRes.data)
          ? membersRes.data
          : (membersRes.data.data || []);
        setMembers(membersList);
      } else {
        setMembers([]);
      }

      if (rolesRes.data) {
        // Check if data is an array or has a nested data property
        const rolesList = Array.isArray(rolesRes.data)
          ? rolesRes.data
          : (rolesRes.data.data || []);
        setRoles(rolesList);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
      // Set empty arrays on error to prevent filter issues
      setMembers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter members - ensure members is always an array
  const filteredMembers = (Array.isArray(members) ? members : []).filter(member => {
    const matchesSearch =
      member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesRole = roleFilter === 'all' || member.role.id === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Handle add member
  const handleAddMember = async () => {
    if (!memberForm.firstName || !memberForm.lastName || !memberForm.email || !memberForm.roleId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createTeamMember(memberForm);

      if (response.error) {
        toast.error(response.error.message || 'Failed to invite team member');
        return;
      }

      toast.success('Team member invited successfully!');
      setShowAddMemberModal(false);
      resetMemberForm();
      loadData();
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast.error('Failed to invite team member');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit member
  const handleEditMember = async () => {
    if (!selectedMember) return;

    setSubmitting(true);
    try {
      const response = await updateTeamMember(selectedMember.id, memberForm);

      if (response.error) {
        toast.error(response.error.message || 'Failed to update team member');
        return;
      }

      toast.success('Team member updated successfully!');
      setShowEditMemberModal(false);
      setSelectedMember(null);
      resetMemberForm();
      loadData();
    } catch (error) {
      console.error('Error updating team member:', error);
      toast.error('Failed to update team member');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete member
  const handleDeleteMember = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to remove ${member.firstName} ${member.lastName} from the team?`)) {
      return;
    }

    try {
      const response = await deleteTeamMember(member.id);

      if (response.error) {
        toast.error(response.error.message || 'Failed to remove team member');
        return;
      }

      toast.success('Team member removed successfully');
      loadData();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  };

  // Handle add role
  const handleAddRole = async () => {
    if (!roleForm.name) {
      toast.error('Please enter a role name');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createTeamRole(roleForm);

      if (response.error) {
        toast.error(response.error.message || 'Failed to create role');
        return;
      }

      toast.success('Role created successfully!');
      setShowAddRoleModal(false);
      resetRoleForm();
      loadData();
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  const resetMemberForm = () => {
    setMemberForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      department: '',
      roleId: '',
      canApproveInvoices: false,
      approvalLimit: undefined,
      canCreateInvoices: false,
      canManageProjects: false,
      canViewReports: false,
    });
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      canApproveInvoices: false,
      approvalLimit: undefined,
      permissions: {},
    });
  };

  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setMemberForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || '',
      jobTitle: member.jobTitle || '',
      department: member.department || '',
      roleId: member.role.id,
      canApproveInvoices: member.canApproveInvoices,
      approvalLimit: member.approvalLimit,
      canCreateInvoices: member.canCreateInvoices,
      canManageProjects: member.canManageProjects,
      canViewReports: member.canViewReports,
    });
    setShowEditMemberModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500"><UserX className="w-3 h-3 mr-1" />Inactive</Badge>;
      case 'invited':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Invited</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Unlimited';
    return `₦${amount.toLocaleString()}`;
  };

  // Statistics
  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    invited: members.filter(m => m.status === 'invited').length,
    approvers: members.filter(m => m.canApproveInvoices).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600 mt-1">Manage your team members, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddRoleModal(true)}>
            <Shield className="w-4 h-4 mr-2" />
            Add Role
          </Button>
          <Button onClick={() => setShowAddMemberModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Invited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.invited}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approvers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.approvers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({filteredMembers.length})</CardTitle>
          <CardDescription>Manage your team members and their permissions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No team members found</p>
              <Button onClick={() => setShowAddMemberModal(true)} className="mt-4">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Your First Member
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approval Limit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      {/* Member */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-semibold text-sm">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Shield className="w-4 h-4 text-gray-400" />
                          {member.role.name}
                        </div>
                      </td>

                      {/* Job Title */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {member.jobTitle || '-'}
                        </div>
                        {member.department && (
                          <div className="text-xs text-gray-500">{member.department}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(member.status)}
                      </td>

                      {/* Approval Limit */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.canApproveInvoices ? (
                          <div className="flex items-center gap-1 text-sm text-purple-600">
                            <UserCheck className="w-4 h-4" />
                            {formatCurrency(member.approvalLimit)}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(member)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteMember(member)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles Section */}
      <Card>
        <CardHeader>
          <CardTitle>Roles ({roles.length})</CardTitle>
          <CardDescription>Predefined roles with specific permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div key={role.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{role.name}</h4>
                    {role.isSystemRole && (
                      <Badge variant="outline" className="mt-1">System Role</Badge>
                    )}
                  </div>
                  <Badge variant="secondary">{role.memberCount || 0} members</Badge>
                </div>
                {role.description && (
                  <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                )}
                {role.canApproveInvoices && (
                  <div className="text-xs text-purple-600 flex items-center gap-1 mt-2">
                    <UserCheck className="w-3 h-3" />
                    Can approve up to {formatCurrency(role.approvalLimit)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your team. They will receive an invitation email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={memberForm.firstName}
                  onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={memberForm.lastName}
                  onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="john@company.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  placeholder="+234 123 456 7890"
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={memberForm.jobTitle}
                  onChange={(e) => setMemberForm({ ...memberForm, jobTitle: e.target.value })}
                  placeholder="Finance Manager"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={memberForm.department}
                onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                placeholder="Finance"
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={memberForm.roleId} onValueChange={(value) => setMemberForm({ ...memberForm, roleId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} {role.isSystemRole && '(System)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={memberForm.canApproveInvoices}
                    onChange={(e) => setMemberForm({ ...memberForm, canApproveInvoices: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Can approve invoices</span>
                </label>
                {memberForm.canApproveInvoices && (
                  <div className="ml-6">
                    <Label htmlFor="approvalLimit">Approval Limit (₦)</Label>
                    <Input
                      id="approvalLimit"
                      type="number"
                      value={memberForm.approvalLimit || ''}
                      onChange={(e) => setMemberForm({ ...memberForm, approvalLimit: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={memberForm.canCreateInvoices}
                    onChange={(e) => setMemberForm({ ...memberForm, canCreateInvoices: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Can create invoices</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={memberForm.canManageProjects}
                    onChange={(e) => setMemberForm({ ...memberForm, canManageProjects: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Can manage projects</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={memberForm.canViewReports}
                    onChange={(e) => setMemberForm({ ...memberForm, canViewReports: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Can view reports</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddMemberModal(false); resetMemberForm(); }} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={submitting}>
              {submitting ? 'Inviting...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={showEditMemberModal} onOpenChange={setShowEditMemberModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member details and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Same form fields as Add Member Modal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={memberForm.firstName}
                  onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={memberForm.lastName}
                  onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editJobTitle">Job Title</Label>
                <Input
                  id="editJobTitle"
                  value={memberForm.jobTitle}
                  onChange={(e) => setMemberForm({ ...memberForm, jobTitle: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editDepartment">Department</Label>
              <Input
                id="editDepartment"
                value={memberForm.department}
                onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editRole">Role *</Label>
              <Select value={memberForm.roleId} onValueChange={(value) => setMemberForm({ ...memberForm, roleId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} {role.isSystemRole && '(System)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={memberForm.canApproveInvoices}
                    onChange={(e) => setMemberForm({ ...memberForm, canApproveInvoices: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Can approve invoices</span>
                </label>
                {memberForm.canApproveInvoices && (
                  <div className="ml-6">
                    <Label htmlFor="editApprovalLimit">Approval Limit (₦)</Label>
                    <Input
                      id="editApprovalLimit"
                      type="number"
                      value={memberForm.approvalLimit || ''}
                      onChange={(e) => setMemberForm({ ...memberForm, approvalLimit: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={memberForm.canCreateInvoices}
                    onChange={(e) => setMemberForm({ ...memberForm, canCreateInvoices: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Can create invoices</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={memberForm.canManageProjects}
                    onChange={(e) => setMemberForm({ ...memberForm, canManageProjects: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Can manage projects</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={memberForm.canViewReports}
                    onChange={(e) => setMemberForm({ ...memberForm, canViewReports: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Can view reports</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditMemberModal(false);
                setSelectedMember(null);
                resetMemberForm();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditMember} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Modal */}
      <Dialog open={showAddRoleModal} onOpenChange={setShowAddRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>
              Create a new role with specific permissions for your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="Senior Project Manager"
              />
            </div>
            <div>
              <Label htmlFor="roleDescription">Description</Label>
              <Input
                id="roleDescription"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Manages multiple projects and approves small invoices"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roleForm.canApproveInvoices}
                  onChange={(e) => setRoleForm({ ...roleForm, canApproveInvoices: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Can approve invoices</span>
              </label>
              {roleForm.canApproveInvoices && (
                <div className="ml-6">
                  <Label htmlFor="roleApprovalLimit">Approval Limit (₦)</Label>
                  <Input
                    id="roleApprovalLimit"
                    type="number"
                    value={roleForm.approvalLimit || ''}
                    onChange={(e) => setRoleForm({ ...roleForm, approvalLimit: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddRoleModal(false); resetRoleForm(); }} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

