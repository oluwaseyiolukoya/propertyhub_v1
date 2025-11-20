import { apiClient, ApiResponse } from '../api-client';

// ============================================
// TYPES
// ============================================

export interface TeamRole {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  canApproveInvoices: boolean;
  approvalLimit?: number;
  permissions: any;
  memberCount?: number;
  createdAt?: string;
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  status: 'active' | 'inactive' | 'suspended' | 'invited';
  role: {
    id: string;
    name: string;
    description?: string;
    canApproveInvoices?: boolean;
    approvalLimit?: number;
  };
  canApproveInvoices: boolean;
  approvalLimit?: number;
  canCreateInvoices: boolean;
  canManageProjects: boolean;
  canViewReports: boolean;
  delegation?: {
    delegateTo: string;
    delegateeName: string;
    start: string;
    end: string;
  };
  invitedBy?: {
    id: string;
    name: string;
  };
  invitedAt: string;
  joinedAt?: string;
  lastActive?: string;
  createdAt?: string;
}

export interface CreateTeamMemberRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  roleId: string;
  canApproveInvoices?: boolean;
  approvalLimit?: number;
  canCreateInvoices?: boolean;
  canManageProjects?: boolean;
  canViewReports?: boolean;
}

export interface UpdateTeamMemberRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  roleId?: string;
  canApproveInvoices?: boolean;
  approvalLimit?: number;
  canCreateInvoices?: boolean;
  canManageProjects?: boolean;
  canViewReports?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface SetDelegationRequest {
  delegateTo: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  canApproveInvoices?: boolean;
  approvalLimit?: number;
  permissions?: any;
}

// ============================================
// TEAM MEMBERS API
// ============================================

/**
 * Get all team members
 */
export async function getTeamMembers(params?: {
  status?: string;
  role?: string;
  canApprove?: boolean;
}): Promise<ApiResponse<TeamMember[]>> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.role) queryParams.append('role', params.role);
  if (params?.canApprove !== undefined) queryParams.append('canApprove', String(params.canApprove));

  const url = `/api/team/members${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return apiClient.get<TeamMember[]>(url);
}

/**
 * Get a single team member
 */
export async function getTeamMember(memberId: string): Promise<ApiResponse<TeamMember>> {
  return apiClient.get<TeamMember>(`/api/team/members/${memberId}`);
}

/**
 * Create/invite a new team member
 */
export async function createTeamMember(data: CreateTeamMemberRequest): Promise<ApiResponse<any>> {
  return apiClient.post('/api/team/members', data);
}

/**
 * Update a team member
 */
export async function updateTeamMember(
  memberId: string,
  data: UpdateTeamMemberRequest
): Promise<ApiResponse<any>> {
  return apiClient.put(`/api/team/members/${memberId}`, data);
}

/**
 * Delete a team member
 */
export async function deleteTeamMember(memberId: string): Promise<ApiResponse<any>> {
  return apiClient.delete(`/api/team/members/${memberId}`);
}

/**
 * Set delegation for a team member
 */
export async function setDelegation(
  memberId: string,
  data: SetDelegationRequest
): Promise<ApiResponse<any>> {
  return apiClient.post(`/api/team/members/${memberId}/delegate`, data);
}

// ============================================
// ROLES API
// ============================================

/**
 * Get all roles
 */
export async function getTeamRoles(): Promise<ApiResponse<TeamRole[]>> {
  // The backend wraps responses as: { success: boolean, data: TeamRole[] }
  // Our apiClient then wraps that again as ApiResponse<{ success; data }>
  // This helper unwraps the inner `data` so callers always see a plain TeamRole[].
  const res = await apiClient.get<{ success?: boolean; data?: TeamRole[]; error?: any }>(
    '/api/team/roles'
  );

  if (res.error) {
    return { error: res.error };
  }

  const inner = res.data;
  const roles = inner && Array.isArray(inner.data) ? inner.data : [];

  return { data: roles };
}

/**
 * Create a custom role
 */
export async function createTeamRole(data: CreateRoleRequest): Promise<ApiResponse<any>> {
  return apiClient.post('/api/team/roles', data);
}
