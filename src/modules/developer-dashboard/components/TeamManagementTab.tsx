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
  RefreshCw,
  Power,
  Copy,
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
  resetTeamMemberPassword,
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
  const [actionMemberId, setActionMemberId] = useState<string | null>(null);
  const [passwordResetInfo, setPasswordResetInfo] = useState<{
    name: string;
    email: string;
    password: string;
    expiresAt?: string;
  } | null>(null);

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

      console.log('🔍 [TeamManagement] Raw API Responses:');
      console.log('  Members Response:', membersRes);
      console.log('  Roles Response:', rolesRes);

      // Handle the API response structure properly
      if (membersRes.data) {
        // Check if data is an array or has a nested data property
        const membersList = Array.isArray(membersRes.data)
          ? membersRes.data
          : (membersRes.data.data || []);
        console.log('  ✅ Members List:', membersList.length, 'members');
        setMembers(membersList);
      } else {
        console.log('  ❌ No members data');
        setMembers([]);
      }

      if (rolesRes.data) {
        // After fixing getTeamRoles, rolesRes.data is always TeamRole[]
        const rolesList = Array.isArray(rolesRes.data) ? rolesRes.data : [];
        console.log('  ✅ Roles List:', rolesList.length, 'roles');
        console.log('  Roles:', rolesList.map((r: any) => r.name).join(', '));
        setRoles(rolesList);
      } else {
        console.log('  ❌ No roles data');
        setRoles([]);
      }
    } catch (error) {
      console.error('❌ Error loading team data:', error);
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

  const handleResetPassword = async (member: TeamMember) => {
    if (!confirm(`Generate a new temporary password for ${member.firstName} ${member.lastName}?`)) {
      return;
    }

    setActionMemberId(member.id);
    try {
      const response = await resetTeamMemberPassword(member.id);
      if (response.error) {
        throw new Error(response.error.message || 'Failed to reset password');
      }

      const payload = response.data as any;
      const tempPassword =
        payload?.temporaryPassword ||
        payload?.data?.temporaryPassword;
      const expiresAt =
        payload?.expiresAt ||
        payload?.data?.expiresAt;
      const emailSent =
        payload?.emailSent ??
        payload?.data?.emailSent;
      if (!tempPassword) {
        throw new Error('Temporary password not returned by server');
      }

      setPasswordResetInfo({
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        password: tempPassword,
        expiresAt,
      });

      toast.success('Temporary password generated');
    } catch (error: any) {
      console.error('Error resetting team member password:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setActionMemberId(null);
    }
  };

  const handleToggleMemberStatus = async (member: TeamMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    if (
      !confirm(
        `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${
          member.firstName
        } ${member.lastName}?`
      )
    ) {
      return;
    }

    setActionMemberId(member.id);
    try {
      const response = await updateTeamMember(member.id, { status: newStatus });
      if (response.error) {
        throw new Error(response.error.message || 'Failed to update member status');
      }

      toast.success(`Team member ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      loadData();
    } catch (error: any) {
      console.error('Error updating member status:', error);
      toast.error(error.message || 'Failed to update member status');
    } finally {
      setActionMemberId(null);
    }
  };

  const handleCopyPassword = async () => {
    if (!passwordResetInfo) return;
    try {
      await navigator.clipboard.writeText(passwordResetInfo.password);
      toast.success('Temporary password copied to clipboard');
    } catch (err) {
      console.error('Failed to copy password:', err);
      toast.error('Failed to copy password');
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
        return <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md"><UserX className="w-3 h-3 mr-1" />Inactive</Badge>;
      case 'invited':
        return <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"><Clock className="w-3 h-3 mr-1" />Invited</Badge>;
      case 'suspended':
        return <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Enhanced with Brand Colors */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">
                Team Management
              </h2>
            </div>
          </div>
          <p className="text-gray-600 ml-14">Manage your team members, roles, and permissions</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAddRoleModal(true)}
            className="border-purple-200 hover:bg-purple-50 hover:border-purple-300"
          >
            <Shield className="w-4 h-4 mr-2" />
            Add Role
          </Button>
          <Button
            onClick={() => setShowAddMemberModal(true)}
            className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Statistics Cards - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Total Members</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Active</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-700">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Invited</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-700">{stats.invited}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Approvers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">
              {stats.approvers}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Enhanced */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#7C3AED]" />
            <CardTitle className="text-sm font-semibold text-gray-900">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7C3AED] w-4 h-4" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
              <SelectTrigger className="w-full md:w-[180px] focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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

      {/* Team Members List - Enhanced */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Team Members ({filteredMembers.length})</CardTitle>
              <CardDescription className="text-gray-600">Manage your team members and their permissions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No team members found</p>
              <p className="text-sm text-gray-500 mb-4">Start building your team by adding your first member</p>
              <Button
                onClick={() => setShowAddMemberModal(true)}
                className="mt-4 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
              >
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
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center flex-shrink-0 shadow-md">
                            <span className="text-white font-semibold text-sm">
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
                              onClick={() => handleResetPassword(member)}
                              disabled={actionMemberId === member.id}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleMemberStatus(member)}
                              disabled={actionMemberId === member.id}
                            >
                              <Power className="w-4 h-4 mr-2" />
                              {member.status === 'active' ? 'Deactivate' : 'Activate'}
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

      {/* Roles Section - Enhanced */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Roles ({roles.length})</CardTitle>
              <CardDescription className="text-gray-600">Predefined roles with specific permissions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div key={role.id} className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-purple-300 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{role.name}</h4>
                      {role.isSystemRole && (
                        <Badge className="mt-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs">System Role</Badge>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md">
                    {role.memberCount || 0} members
                  </Badge>
                </div>
                {role.description && (
                  <p className="text-sm text-gray-700 mb-3">{role.description}</p>
                )}
                {role.canApproveInvoices && (
                  <div className="text-xs font-semibold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-lg p-2 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Can approve up to {formatCurrency(role.approvalLimit)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Member Modal - Enhanced */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl p-0">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl">Invite Team Member</DialogTitle>
                <DialogDescription className="text-purple-100">
                  Add a new member to your team. They will receive an invitation email.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">First Name *</Label>
                <Input
                  id="firstName"
                  value={memberForm.firstName}
                  onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                  placeholder="John"
                  className="focus:border-[#7C3AED] focus:ring-[#7C3AED] mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Last Name *</Label>
                <Input
                  id="lastName"
                  value={memberForm.lastName}
                  onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                  placeholder="Doe"
                  className="focus:border-[#7C3AED] focus:ring-[#7C3AED] mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email *</Label>
              <Input
                id="email"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="john@company.com"
                className="focus:border-[#7C3AED] focus:ring-[#7C3AED] mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone</Label>
                <Input
                  id="phone"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  placeholder="+234 123 456 7890"
                  className="focus:border-[#7C3AED] focus:ring-[#7C3AED] mt-1"
                />
              </div>
              <div>
                <Label htmlFor="jobTitle" className="text-sm font-semibold text-gray-700">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={memberForm.jobTitle}
                  onChange={(e) => setMemberForm({ ...memberForm, jobTitle: e.target.value })}
                  placeholder="Finance Manager"
                  className="focus:border-[#7C3AED] focus:ring-[#7C3AED] mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="department" className="text-sm font-semibold text-gray-700">Department</Label>
              <Input
                id="department"
                value={memberForm.department}
                onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                placeholder="Finance"
                className="focus:border-[#7C3AED] focus:ring-[#7C3AED] mt-1"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-sm font-semibold text-gray-700">Role *</Label>
              <Select value={memberForm.roleId} onValueChange={(value) => setMemberForm({ ...memberForm, roleId: value })}>
                <SelectTrigger className="focus:border-[#7C3AED] focus:ring-[#7C3AED] mt-1">
                  <SelectValue placeholder={roles.length > 0 ? "Select a role" : "No roles available"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      <p className="font-medium">No roles found</p>
                      <p className="text-xs mt-1">Please contact support if this issue persists</p>
                    </div>
                  ) : (
                    roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name} {role.isSystemRole && '(System)'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {roles.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ No roles available. System roles may not be seeded in the database.
                </p>
              )}
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
                      className="focus:border-[#7C3AED] focus:ring-[#7C3AED]"
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
          <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => { setShowAddMemberModal(false); resetMemberForm(); }}
              disabled={submitting}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={submitting}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
            >
              {submitting ? 'Inviting...' : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal - Enhanced */}
      <Dialog open={showEditMemberModal} onOpenChange={setShowEditMemberModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl p-0">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl">Edit Team Member</DialogTitle>
                <DialogDescription className="text-purple-100">
                  Update team member details and permissions
                </DialogDescription>
              </div>
            </div>
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
              <Label htmlFor="editRole" className="text-sm font-semibold text-gray-700">Role *</Label>
              <Select value={memberForm.roleId} onValueChange={(value) => setMemberForm({ ...memberForm, roleId: value })}>
                <SelectTrigger className="focus:border-[#7C3AED] focus:ring-[#7C3AED] mt-1">
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
          <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditMemberModal(false);
                setSelectedMember(null);
                resetMemberForm();
              }}
              disabled={submitting}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditMember}
              disabled={submitting}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
            >
              {submitting ? 'Updating...' : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Modal - Enhanced */}
      <Dialog open={showAddRoleModal} onOpenChange={setShowAddRoleModal}>
        <DialogContent className="border-0 shadow-2xl p-0">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl">Create Custom Role</DialogTitle>
                <DialogDescription className="text-purple-100">
                  Create a new role with specific permissions for your team
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div>
              <Label htmlFor="roleName" className="text-sm font-semibold text-gray-700">Role Name *</Label>
              <Input
                id="roleName"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="Senior Project Manager"
                className="focus:border-[#7C3AED] focus:ring-[#7C3AED] mt-1"
              />
            </div>
            <div>
              <Label htmlFor="roleDescription" className="text-sm font-semibold text-gray-700">Description</Label>
              <Input
                id="roleDescription"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Manages multiple projects and approves small invoices"
                className="focus:border-[#7C3AED] focus:ring-[#7C3AED] mt-1"
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
                    className="focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => { setShowAddRoleModal(false); resetRoleForm(); }}
              disabled={submitting}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRole}
              disabled={submitting}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
            >
              {submitting ? 'Creating...' : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Create Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal - Enhanced */}
      <Dialog open={!!passwordResetInfo} onOpenChange={(open) => !open && setPasswordResetInfo(null)}>
        <DialogContent className="max-w-lg border-0 shadow-2xl p-0">
          <DialogHeader className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-6 rounded-t-lg border-b border-amber-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-gray-900 text-xl">Temporary Password Generated</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Share this password securely with {passwordResetInfo?.name}. They will be prompted to set a
                  new password on next login.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {passwordResetInfo && (
            <div className="space-y-4 py-2">
              <div className="text-sm text-gray-600">
                <p>
                  <strong>User:</strong> {passwordResetInfo.name} ({passwordResetInfo.email})
                </p>
                {passwordResetInfo.expiresAt && (
                  <p>
                    <strong>Expires:</strong>{' '}
                    {new Date(passwordResetInfo.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="bg-gray-900 text-white rounded-md px-4 py-3 flex items-center justify-between">
                <code className="text-lg font-mono">{passwordResetInfo.password}</code>
                <Button variant="secondary" size="sm" onClick={handleCopyPassword}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50">
            <Button
              onClick={() => setPasswordResetInfo(null)}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

