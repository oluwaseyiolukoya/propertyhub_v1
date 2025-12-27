import React, { useState, useEffect } from "react";
import { publicAdminApi, PublicAdmin } from "../../../lib/api/publicAdminApi";
import { Button } from "../../ui/button";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Shield,
  ShieldCheck,
  XCircle,
  Eye,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { UserFormModal } from "./UserFormModal";
import { UserPermissionsModal } from "./UserPermissionsModal";

export function UserManagement() {
  const [admins, setAdmins] = useState<PublicAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAdmin, setSelectedAdmin] = useState<PublicAdmin | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<PublicAdmin | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all")
        params.isActive = statusFilter === "active";

      const response = await publicAdminApi.users.list(params);
      setAdmins(response.admins);
    } catch (error: any) {
      toast.error(error.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [searchTerm, roleFilter, statusFilter]);

  const handleCreate = () => {
    setEditingAdmin(null);
    setShowUserForm(true);
  };

  const handleEdit = (admin: PublicAdmin) => {
    setEditingAdmin(admin);
    setShowUserForm(true);
  };

  const handleDelete = async (admin: PublicAdmin) => {
    if (
      !confirm(
        `Are you sure you want to delete ${admin.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await publicAdminApi.users.delete(admin.id);
      toast.success("User deleted successfully");
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.error || "Failed to delete user");
    }
  };

  const handleActivate = async (admin: PublicAdmin) => {
    try {
      await publicAdminApi.users.activate(admin.id);
      toast.success("User activated successfully");
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.error || "Failed to activate user");
    }
  };

  const handleDeactivate = async (admin: PublicAdmin) => {
    if (
      !confirm(
        `Are you sure you want to deactivate ${admin.name}? They will not be able to log in.`
      )
    ) {
      return;
    }

    try {
      await publicAdminApi.users.deactivate(admin.id);
      toast.success("User deactivated successfully");
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.error || "Failed to deactivate user");
    }
  };

  const handleManagePermissions = (admin: PublicAdmin) => {
    setSelectedAdmin(admin);
    setShowPermissionsModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "editor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        admin.name.toLowerCase().includes(search) ||
        admin.email.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage admin users and their permissions
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No users found. Create your first admin user to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {admin.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {admin.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          admin.role
                        )}`}
                      >
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {admin.pagePermissions && admin.pagePermissions.length > 0
                          ? `${admin.pagePermissions.length} page(s)`
                          : "All pages"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {admin.lastLogin
                        ? new Date(admin.lastLogin).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManagePermissions(admin)}
                          className="gap-1"
                          title="Manage Permissions"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(admin)}
                          className="gap-1"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {admin.isActive ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(admin)}
                            className="gap-1 text-orange-600 hover:text-orange-700"
                            title="Deactivate"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(admin)}
                            className="gap-1 text-green-600 hover:text-green-700"
                            title="Activate"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(admin)}
                          className="gap-1 text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <UserFormModal
          admin={editingAdmin}
          onClose={() => {
            setShowUserForm(false);
            setEditingAdmin(null);
          }}
          onSuccess={() => {
            setShowUserForm(false);
            setEditingAdmin(null);
            fetchAdmins();
          }}
        />
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedAdmin && (
        <UserPermissionsModal
          admin={selectedAdmin}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedAdmin(null);
          }}
          onSuccess={() => {
            setShowPermissionsModal(false);
            setSelectedAdmin(null);
            fetchAdmins();
          }}
        />
      )}
    </div>
  );
}

