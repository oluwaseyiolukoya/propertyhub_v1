import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { resetUserPassword as resetUserPasswordAPI } from "../lib/api/users";
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
  Building,
  Clipboard,
} from "lucide-react";

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
  onBack,
}: UserManagementProps) {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [userToReset, setUserToReset] = useState<any>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [roleViewMode, setRoleViewMode] = useState<"grid" | "list">("grid");
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showRoleDetails, setShowRoleDetails] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [showAddUserInline, setShowAddUserInline] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "admin", // Default to admin role for internal users
    company: "Contrezz Admin", // Internal admin company
    department: "",
    isActive: true,
    sendInvite: true,
  });

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
    isActive: true,
  });

  // Major countries list
  const countries = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Cape Verde",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Ivory Coast",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kosovo",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

  // Internal admin permissions (for Contrezz platform management)
  // These permissions map to actual dashboard pages and features
  const availablePermissions = [
    // Dashboard Pages (Main Navigation)
    {
      id: "overview",
      label: "Dashboard Overview",
      category: "Dashboard Pages",
      description: "View main dashboard with metrics and stats",
    },
    {
      id: "customers",
      label: "Customer Management Page",
      category: "Dashboard Pages",
      description: "Access customer management dashboard",
    },
    {
      id: "users",
      label: "User Management Page",
      category: "Dashboard Pages",
      description: "Access internal user management",
    },
    {
      id: "billing",
      label: "Billing & Plans Page",
      category: "Dashboard Pages",
      description: "Access billing plans management",
    },
    {
      id: "analytics",
      label: "Analytics Page",
      category: "Dashboard Pages",
      description: "View analytics and reports dashboard",
    },
    {
      id: "system",
      label: "System Health Page",
      category: "Dashboard Pages",
      description: "Monitor system health and performance",
    },
    {
      id: "support",
      label: "Support Tickets Page",
      category: "Dashboard Pages",
      description: "Manage customer support tickets",
    },
    {
      id: "settings",
      label: "Platform Settings Page",
      category: "Dashboard Pages",
      description: "Configure platform-wide settings",
    },

    // Customer Management Actions
    {
      id: "customer_view",
      label: "View Customers",
      category: "Customer Actions",
      description: "View customer list and details",
    },
    {
      id: "customer_create",
      label: "Create Customers",
      category: "Customer Actions",
      description: "Add new customers to the platform",
    },
    {
      id: "customer_edit",
      label: "Edit Customers",
      category: "Customer Actions",
      description: "Modify customer information",
    },
    {
      id: "customer_delete",
      label: "Delete Customers",
      category: "Customer Actions",
      description: "Remove customers from the platform",
    },
    {
      id: "customer_reset_password",
      label: "Reset Customer Passwords",
      category: "Customer Actions",
      description: "Reset customer account passwords",
    },
    {
      id: "customer_deactivate",
      label: "Activate/Deactivate Customers",
      category: "Customer Actions",
      description: "Change customer account status",
    },

    // Internal User Management Actions
    {
      id: "user_view",
      label: "View Internal Users",
      category: "User Management",
      description: "View internal staff users",
    },
    {
      id: "user_create",
      label: "Create Internal Users",
      category: "User Management",
      description: "Add new staff members",
    },
    {
      id: "user_edit",
      label: "Edit Internal Users",
      category: "User Management",
      description: "Modify staff user information",
    },
    {
      id: "user_delete",
      label: "Delete Internal Users",
      category: "User Management",
      description: "Remove staff users",
    },
    {
      id: "user_reset_password",
      label: "Reset User Passwords",
      category: "User Management",
      description: "Reset staff user passwords",
    },

    // Role & Permission Management
    {
      id: "role_view",
      label: "View Roles",
      category: "Roles & Permissions",
      description: "View all roles and their permissions",
    },
    {
      id: "role_create",
      label: "Create Roles",
      category: "Roles & Permissions",
      description: "Create new user roles",
    },
    {
      id: "role_edit",
      label: "Edit Roles",
      category: "Roles & Permissions",
      description: "Modify role permissions",
    },
    {
      id: "role_delete",
      label: "Delete Roles",
      category: "Roles & Permissions",
      description: "Remove custom roles",
    },

    // Billing & Plans Management
    {
      id: "billing_management",
      label: "Manage Billing Plans",
      category: "Billing & Plans",
      description: "Create and edit subscription plans",
    },
    {
      id: "plan_view",
      label: "View Plans",
      category: "Billing & Plans",
      description: "View all subscription plans",
    },
    {
      id: "plan_create",
      label: "Create Plans",
      category: "Billing & Plans",
      description: "Add new subscription plans",
    },
    {
      id: "plan_edit",
      label: "Edit Plans",
      category: "Billing & Plans",
      description: "Modify existing plans",
    },
    {
      id: "plan_delete",
      label: "Delete Plans",
      category: "Billing & Plans",
      description: "Remove subscription plans",
    },
    {
      id: "invoice_view",
      label: "View Invoices",
      category: "Billing & Plans",
      description: "View customer invoices",
    },
    {
      id: "payment_view",
      label: "View Payments",
      category: "Billing & Plans",
      description: "View payment transactions",
    },

    // Analytics & Reports
    {
      id: "analytics_view",
      label: "View Analytics",
      category: "Analytics & Reports",
      description: "Access analytics dashboard",
    },
    {
      id: "analytics_mrr",
      label: "View MRR Analytics",
      category: "Analytics & Reports",
      description: "View monthly recurring revenue",
    },
    {
      id: "analytics_churn",
      label: "View Churn Analytics",
      category: "Analytics & Reports",
      description: "View customer churn metrics",
    },
    {
      id: "analytics_export",
      label: "Export Analytics Data",
      category: "Analytics & Reports",
      description: "Download analytics reports",
    },

    // System & Platform
    {
      id: "system_health",
      label: "View System Health",
      category: "System & Platform",
      description: "Monitor system performance",
    },
    {
      id: "system_logs",
      label: "View System Logs",
      category: "System & Platform",
      description: "Access system activity logs",
    },
    {
      id: "platform_settings",
      label: "Manage Platform Settings",
      category: "System & Platform",
      description: "Configure platform settings",
    },
    {
      id: "cache_clear",
      label: "Clear System Cache",
      category: "System & Platform",
      description: "Clear application cache",
    },

    // Support & Tickets
    {
      id: "support_view",
      label: "View Support Tickets",
      category: "Support",
      description: "View customer support tickets",
    },
    {
      id: "support_create",
      label: "Create Support Tickets",
      category: "Support",
      description: "Create tickets on behalf of customers",
    },
    {
      id: "support_respond",
      label: "Respond to Tickets",
      category: "Support",
      description: "Reply to customer tickets",
    },
    {
      id: "support_close",
      label: "Close Support Tickets",
      category: "Support",
      description: "Resolve and close tickets",
    },
    {
      id: "support_assign",
      label: "Assign Support Tickets",
      category: "Support",
      description: "Assign tickets to team members",
    },

    // Activity & Audit
    {
      id: "activity_logs",
      label: "View Activity Logs",
      category: "Audit & Logs",
      description: "View user activity history",
    },
    {
      id: "audit_reports",
      label: "Generate Audit Reports",
      category: "Audit & Logs",
      description: "Create compliance audit reports",
    },
  ];

  // Filter users based on search and filters
  const filteredUsers = users.filter((userItem) => {
    const matchesSearch =
      userItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || userItem.status === statusFilter;
    const matchesRole = roleFilter === "all" || userItem.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Filter roles to show only internal admin roles (exclude customer-facing roles)
  const customerRoleNames = [
    "owner",
    "manager",
    "tenant",
    "property owner",
    "property manager",
  ];
  const filteredRoles = roles.filter(
    (role) => !customerRoleNames.includes(role.name.toLowerCase())
  );

  // Helper function to get permission label from ID
  const getPermissionLabel = (permissionId: string | any) => {
    // Ensure permissionId is a string
    if (!permissionId || typeof permissionId !== "string") {
      return "Unknown Permission";
    }

    const permission = availablePermissions.find((p) => p.id === permissionId);
    return permission
      ? permission.label
      : permissionId
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    // Send data to backend API
    onAddUser(newUser);

    // Reset form
    setNewUser({
      name: "",
      email: "",
      phone: "",
      role: "admin", // Default to admin role for internal users
      company: "Contrezz Admin", // Internal admin company
      department: "",
      isActive: true,
      sendInvite: true,
    });
    setShowAddUser(false);
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();

    // Only send the fields that the backend expects
    const roleData = {
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions,
      isActive: newRole.isActive,
    };

    console.log("📤 Sending role data to backend:", roleData);
    onAddRole(roleData);

    setNewRole({
      name: "",
      description: "",
      permissions: [],
      isActive: true,
    });
    setShowAddRole(false);
  };

  const toggleUserStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    onUpdateUser(userId, { status: newStatus });
  };

  const openResetConfirmation = (
    userId: string,
    userName: string,
    userEmail: string
  ) => {
    setUserToReset({ id: userId, name: userName, email: userEmail });
    setShowResetConfirmation(true);
  };

  const confirmResetPassword = async () => {
    if (!userToReset) return;

    try {
      const response = await resetUserPasswordAPI(userToReset.id);
      console.log("🔐 Password reset API response:", response);

      if (response.error) {
        console.error("Password reset error:", response.error);
        alert(
          `Failed to reset password: ${
            response.error.message || response.error.error
          }`
        );
        setShowResetConfirmation(false);
        return;
      }

      if (response.data?.tempPassword) {
        console.log("🔑 Temp password:", response.data.tempPassword);
        setGeneratedPassword(response.data.tempPassword);
        setShowResetConfirmation(false);
        setShowResetPassword(true);
      } else {
        console.error("No temp password in response:", response);
        alert("Failed to generate password. Please try again.");
        setShowResetConfirmation(false);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      alert("Failed to reset password. Please try again.");
      setShowResetConfirmation(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary" className="flex items-center">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (roleName: string) => {
    const colors: Record<string, string> = {
      "Super Admin": "bg-red-100 text-red-800",
      "Property Owner": "bg-blue-100 text-blue-800",
      "Property Manager": "bg-purple-100 text-purple-800",
      Tenant: "bg-green-100 text-green-800",
      "Support Staff": "bg-orange-100 text-orange-800",
    };

    return (
      <Badge
        className={`${
          colors[roleName] || "bg-gray-100 text-gray-800"
        } flex items-center`}
      >
        <Shield className="h-3 w-3 mr-1" />
        {roleName}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Animated Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 p-8 shadow-2xl">
        {/* Animated background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <Users className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <Shield className="h-16 w-16 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  Internal User Management
                </h2>
                <p className="text-purple-100 text-lg">
                  Manage internal admin users (staff, support team, etc.).
                  Customer users are managed in Customer Management.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAddRole(true)}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
              >
                <Shield className="h-4 w-4 mr-2" />
                Add Role
              </Button>

              <Button
                onClick={() => setShowAddUserInline((prev) => !prev)}
                className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Internal User
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {/* Enhanced Tabs List */}
          <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 rounded-t-xl">
            <TabsList className="grid w-full grid-cols-2 h-auto bg-transparent p-2 gap-2">
              <TabsTrigger
                value="users"
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
              >
                <Users className="h-4 w-4" />
                <span className="font-medium">Users ({users.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="roles"
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
              >
                <Shield className="h-4 w-4" />
                <span className="font-medium">
                  Roles ({filteredRoles.length})
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-0 p-6">
            {/* Enhanced Search and Filters */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search users by name, email, or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[150px] border-gray-200 focus:border-purple-300 focus:ring-purple-200">
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
                    <SelectTrigger className="w-full md:w-[150px] border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {filteredRoles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Inline Add User Form */}
            {showAddUserInline && (
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Add Internal Admin User
                  </CardTitle>
                  <CardDescription className="text-purple-100 mt-2">
                    Create a new internal admin user (staff, support team,
                    etc.). This is NOT for customer users.
                  </CardDescription>
                </div>
                <CardContent className="pt-6">
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) =>
                            setNewUser((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          required
                          className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) =>
                            setNewUser((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          required
                          className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={newUser.phone}
                          onChange={(e) =>
                            setNewUser((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="+234 xxx xxx xxxx"
                          className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role *</Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(value) =>
                            setNewUser((prev) => ({ ...prev, role: value }))
                          }
                        >
                          <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredRoles.map((role) => (
                              <SelectItem key={role.id} value={role.name}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={newUser.company}
                          onChange={(e) =>
                            setNewUser((prev) => ({
                              ...prev,
                              company: e.target.value,
                            }))
                          }
                          placeholder="Contrezz Admin"
                          className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={newUser.department}
                          onChange={(e) =>
                            setNewUser((prev) => ({
                              ...prev,
                              department: e.target.value,
                            }))
                          }
                          placeholder="e.g., Customer Support, IT, etc."
                          className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sendInvite"
                        checked={newUser.sendInvite}
                        onCheckedChange={(checked) =>
                          setNewUser((prev) => ({
                            ...prev,
                            sendInvite: checked,
                          }))
                        }
                      />
                      <Label htmlFor="sendInvite">Send invitation email</Label>
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddUserInline(false)}
                        className="border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
                      >
                        Create User
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Users Table */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Internal Admin Users
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Internal staff, support team, and platform administrators
                    </CardDescription>
                  </div>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="font-semibold text-gray-700">
                          User
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Role
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Company
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Last Login
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-4 rounded-full bg-gray-100">
                                <Users className="h-8 w-8 text-gray-400" />
                              </div>
                              <div className="text-gray-500 font-medium">
                                No users found
                              </div>
                              <div className="text-sm text-gray-400">
                                {searchTerm ||
                                statusFilter !== "all" ||
                                roleFilter !== "all"
                                  ? "Try adjusting your search or filters"
                                  : "Get started by adding your first internal user"}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((userItem) => (
                          <TableRow
                            key={userItem.id}
                            className="hover:bg-purple-50/30 transition-colors duration-150"
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-md">
                                  <span className="text-white text-sm font-bold">
                                    {userItem.name
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {userItem.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {userItem.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(userItem.role)}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {userItem.company || "N/A"}
                                </div>
                                {userItem.department && (
                                  <div className="text-sm text-gray-600">
                                    {userItem.department}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(userItem.status)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {userItem.lastLogin
                                ? new Date(
                                    userItem.lastLogin
                                  ).toLocaleDateString()
                                : "Never"}
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
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(userItem);
                                      setShowUserDetails(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>

                                  {/* Disable edit for Super Admins */}
                                  {!(userItem as any).isSuperAdmin && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(userItem);
                                        setShowEditUser(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit User
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openResetConfirmation(
                                        userItem.id,
                                        userItem.name,
                                        userItem.email
                                      )
                                    }
                                  >
                                    <Lock className="h-4 w-4 mr-2" />
                                    Reset Password
                                  </DropdownMenuItem>

                                  {/* Disable deactivate for Super Admins */}
                                  {!(userItem as any).isSuperAdmin && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toggleUserStatus(
                                          userItem.id,
                                          userItem.status
                                        )
                                      }
                                    >
                                      {userItem.status === "active" ? (
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
                                  )}

                                  {/* Disable delete for Super Admins */}
                                  {!(userItem as any).isSuperAdmin && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => {
                                          if (
                                            confirm(
                                              "Are you sure you want to delete this user?"
                                            )
                                          ) {
                                            onDeleteUser(userItem.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete User
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6 mt-0 p-6">
            {/* Enhanced View Mode Toggle */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {filteredRoles.length} role
                        {filteredRoles.length !== 1 ? "s" : ""} available
                      </div>
                      <div className="text-xs text-gray-500">
                        Manage roles and permissions for internal users
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={roleViewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRoleViewMode("grid")}
                      className={
                        roleViewMode === "grid"
                          ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white"
                          : "border-purple-200 text-purple-700 hover:bg-purple-50"
                      }
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={roleViewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRoleViewMode("list")}
                      className={
                        roleViewMode === "list"
                          ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white"
                          : "border-purple-200 text-purple-700 hover:bg-purple-50"
                      }
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Grid View */}
            {roleViewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRoles.map((role) => (
                  <Card
                    key={role.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <CardHeader className="p-0">
                      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="flex items-center space-x-2 text-xl">
                              <Shield className="h-5 w-5" />
                              <span>{role.name}</span>
                            </CardTitle>
                            <CardDescription className="text-purple-100 mt-2">
                              {role.description}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRole(role);
                                  setShowRoleDetails(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRole(role);
                                  setShowEditRole(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Role
                              </DropdownMenuItem>
                              {!role.isSystem && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `Are you sure you want to delete the "${role.name}" role?`
                                        )
                                      ) {
                                        onDeleteRole(role.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Role
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="h-4 w-4 text-purple-600" />
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Users
                              </span>
                            </div>
                            <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                              {role.userCount || 0}
                            </Badge>
                          </div>
                          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="h-4 w-4 text-purple-600" />
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Status
                              </span>
                            </div>
                            {role.isActive ? (
                              <Badge className="bg-green-100 text-green-700 border-green-300">
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-700 border-gray-300"
                              >
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                          <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-purple-600" />
                            Permissions
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {role.permissions
                              .slice(0, 3)
                              .map((permission: string) => (
                                <Badge
                                  key={permission}
                                  variant="outline"
                                  className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                >
                                  {getPermissionLabel(permission)}
                                </Badge>
                              ))}
                            {role.permissions.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-violet-50 text-violet-700 border-violet-200"
                              >
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

            {/* Enhanced List View */}
            {roleViewMode === "list" && (
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Roles
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Complete list of all roles and their permissions
                  </CardDescription>
                </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="font-semibold text-gray-700">
                            Role Name
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700">
                            Description
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700">
                            Users
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700">
                            Permissions
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700">
                            Status
                          </TableHead>
                          <TableHead className="text-right font-semibold text-gray-700">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRoles.map((role) => (
                          <TableRow
                            key={role.id}
                            className="hover:bg-purple-50/30 transition-colors duration-150"
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500">
                                  <Shield className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-semibold text-gray-900">
                                  {role.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {role.description}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {role.userCount || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {role.permissions
                                  .slice(0, 2)
                                  .map((permission: string) => (
                                    <Badge
                                      key={permission}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {getPermissionLabel(permission)}
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
                                <Badge className="bg-green-100 text-green-800">
                                  Active
                                </Badge>
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
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRole(role);
                                      setShowRoleDetails(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRole(role);
                                      setShowEditRole(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Role
                                  </DropdownMenuItem>
                                  {!role.isSystem && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => {
                                          if (
                                            confirm(
                                              `Are you sure you want to delete the "${role.name}" role?`
                                            )
                                          ) {
                                            onDeleteRole(role.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Role
                                      </DropdownMenuItem>
                                    </>
                                  )}
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
              Create a new internal admin user (staff, support team, etc.). This
              is NOT for customer users.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, email: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) =>
                    setNewUser((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRoles.map((role) => (
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
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, company: e.target.value }))
                  }
                  placeholder="Contrezz Admin"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={newUser.department}
                  onChange={(e) =>
                    setNewUser((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  placeholder="e.g., Customer Support, IT, etc."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sendInvite"
                checked={newUser.sendInvite}
                onCheckedChange={(checked) =>
                  setNewUser((prev) => ({ ...prev, sendInvite: checked }))
                }
              />
              <Label htmlFor="sendInvite">Send invitation email</Label>
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddUser(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enhanced Add Role Dialog */}
      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-lg flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl text-white">
                Add New Role
              </DialogTitle>
            </div>
            <DialogDescription className="text-purple-100 mt-2">
              Create a new role with specific permissions
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleAddRole}
            className="space-y-4 flex-1 overflow-y-auto pr-2"
          >
            <div>
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                value={newRole.name}
                onChange={(e) =>
                  setNewRole((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Support Staff, Business Analyst, Developer"
                required
                className="mt-3 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
            </div>

            <div>
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={newRole.description}
                onChange={(e) =>
                  setNewRole((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what this role is responsible for..."
                rows={3}
                className="mt-3 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="mt-2 space-y-4 max-h-[400px] overflow-y-auto border rounded-md p-4">
                {/* Group permissions by category */}
                {Array.from(
                  new Set(availablePermissions.map((p) => p.category))
                ).map((category) => (
                  <div key={category}>
                    <div className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      {category}
                    </div>
                    <div className="space-y-2 ml-6">
                      {availablePermissions
                        .filter((p) => p.category === category)
                        .map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-start space-x-2 py-1"
                          >
                            <input
                              type="checkbox"
                              id={`perm-${permission.id}`}
                              checked={newRole.permissions.includes(
                                permission.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewRole((prev) => ({
                                    ...prev,
                                    permissions: [
                                      ...prev.permissions,
                                      permission.id,
                                    ],
                                  }));
                                } else {
                                  setNewRole((prev) => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(
                                      (p) => p !== permission.id
                                    ),
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={`perm-${permission.id}`}
                                className="text-sm font-medium text-gray-700 cursor-pointer"
                              >
                                {permission.label}
                              </Label>
                              {permission.description && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-4 border-t border-gray-200 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowAddRole(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
              >
                Create Role
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enhanced User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          {selectedUser && (
            <>
              <DialogHeader className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <DialogTitle className="text-xl text-white">
                    User Details
                  </DialogTitle>
                </div>
                <DialogDescription className="text-purple-100 mt-2">
                  Detailed information for {selectedUser.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">
                      {selectedUser.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedUser.name}
                    </h3>
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
                          <span className="text-sm">
                            {selectedUser.company}
                          </span>
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
                      <span className="ml-2">
                        {selectedUser.createdAt
                          ? new Date(
                              selectedUser.createdAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Login:</span>
                      <span className="ml-2">
                        {selectedUser.lastLogin
                          ? new Date(
                              selectedUser.lastLogin
                            ).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="max-w-md">
          {selectedUser && (
            <>
              <DialogHeader className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Edit className="h-5 w-5 text-white" />
                  </div>
                  <DialogTitle className="text-xl text-white">
                    Edit Internal User
                  </DialogTitle>
                </div>
                <DialogDescription className="text-purple-100 mt-2">
                  Update internal admin user information
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onUpdateUser(selectedUser.id, selectedUser);
                  setShowEditUser(false);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Full Name *</Label>
                    <Input
                      id="edit-name"
                      value={selectedUser.name}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          name: e.target.value,
                        })
                      }
                      required
                      className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={selectedUser.email}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          email: e.target.value,
                        })
                      }
                      required
                      className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={selectedUser.phone || ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-role">Role *</Label>
                    <Select
                      value={selectedUser.role}
                      onValueChange={(value) =>
                        setSelectedUser({ ...selectedUser, role: value })
                      }
                    >
                      <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredRoles.map((role) => (
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
                    <Label htmlFor="edit-company">Company</Label>
                    <Input
                      id="edit-company"
                      value={selectedUser.company || ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          company: e.target.value,
                        })
                      }
                      className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-department">Department</Label>
                    <Input
                      id="edit-department"
                      value={selectedUser.department || ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          department: e.target.value,
                        })
                      }
                      className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-country">Country</Label>
                    <Select
                      value={selectedUser.country || ""}
                      onValueChange={(value) =>
                        setSelectedUser({ ...selectedUser, country: value })
                      }
                    >
                      <SelectTrigger
                        id="edit-country"
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      >
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={selectedUser.status}
                      onValueChange={(value) =>
                        setSelectedUser({ ...selectedUser, status: value })
                      }
                    >
                      <SelectTrigger
                        id="edit-status"
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowEditUser(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
                  >
                    Update User
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog
        open={showResetConfirmation}
        onOpenChange={setShowResetConfirmation}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Confirm Password Reset
            </DialogTitle>
            <DialogDescription>
              This action will generate a new temporary password for the user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-900 mb-2">
                Are you sure you want to reset password for{" "}
                <strong className="font-semibold">{userToReset?.name}</strong>?
              </p>
              <p className="text-xs text-orange-700">
                Email: {userToReset?.email}
              </p>
            </div>

            <p className="text-sm text-gray-600">
              A new temporary password will be generated and you'll need to
              share it with the user securely.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowResetConfirmation(false);
                setUserToReset(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmResetPassword}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Yes, Reset Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Password Reset Successful</DialogTitle>
            <DialogDescription>
              A new temporary password has been generated for this user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Temporary Password:
              </p>
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-blue-300">
                <code className="text-lg font-mono text-blue-600">
                  {generatedPassword || "Loading..."}
                </code>
                {generatedPassword && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      alert("Password copied to clipboard!");
                    }}
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {!generatedPassword && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Password not generated. Check console for errors.
                </p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Copy this password now and share it
                securely with the user. They should change it after their first
                login.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowResetPassword(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced View Role Details Dialog */}
      <Dialog open={showRoleDetails} onOpenChange={setShowRoleDetails}>
        <DialogContent className="max-w-2xl">
          {selectedRole && (
            <>
              <DialogHeader className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <DialogTitle className="text-xl text-white">
                    {selectedRole.name}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-purple-100 mt-2">
                  {selectedRole.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                      Status
                    </Label>
                    <div className="mt-1">
                      {selectedRole.isActive ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-700 border-gray-300"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                      Users Assigned
                    </Label>
                    <div className="mt-1">
                      <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                        <Users className="h-3 w-3 mr-1" />
                        {selectedRole.userCount || 0} users
                      </Badge>
                    </div>
                  </div>
                </div>

                {selectedRole.isSystem && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>System Role:</strong> This is a protected role and
                      cannot be deleted.
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Permissions ({selectedRole.permissions.length})
                  </Label>
                  <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                    <div className="space-y-4">
                      {Array.from(
                        new Set(availablePermissions.map((p) => p.category))
                      ).map((category) => {
                        const categoryPermissions =
                          selectedRole.permissions.filter((pId: string) =>
                            availablePermissions.find(
                              (p) => p.id === pId && p.category === category
                            )
                          );

                        if (categoryPermissions.length === 0) return null;

                        return (
                          <div key={category}>
                            <div className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
                              <Shield className="h-4 w-4 mr-2" />
                              {category}
                            </div>
                            <div className="space-y-1 ml-6">
                              {categoryPermissions.map(
                                (permissionId: string) => (
                                  <div
                                    key={permissionId}
                                    className="flex items-center space-x-2 text-sm text-gray-700"
                                  >
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span>
                                      {getPermissionLabel(permissionId)}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Created:{" "}
                  {new Date(selectedRole.createdAt).toLocaleDateString()}
                  {selectedRole.updatedAt &&
                    ` • Last updated: ${new Date(
                      selectedRole.updatedAt
                    ).toLocaleDateString()}`}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRoleDetails(false)}
                >
                  Close
                </Button>
                {!selectedRole.isSystem && (
                  <Button
                    onClick={() => {
                      setShowRoleDetails(false);
                      setShowEditRole(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Role
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit Role Dialog */}
      <Dialog open={showEditRole} onOpenChange={setShowEditRole}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRole && (
            <>
              <DialogHeader className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Edit className="h-5 w-5 text-white" />
                  </div>
                  <DialogTitle className="text-xl text-white">
                    Edit Role
                  </DialogTitle>
                </div>
                <DialogDescription className="text-purple-100 mt-2">
                  Update role information and permissions
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onUpdateRole(selectedRole.id, selectedRole);
                  setShowEditRole(false);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-role-name">Role Name *</Label>
                    <Input
                      id="edit-role-name"
                      value={selectedRole.name}
                      onChange={(e) =>
                        setSelectedRole({
                          ...selectedRole,
                          name: e.target.value,
                        })
                      }
                      required
                      disabled={selectedRole.isSystem}
                      className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-role-status">Status</Label>
                    <Select
                      value={selectedRole.isActive ? "active" : "inactive"}
                      onValueChange={(value) =>
                        setSelectedRole({
                          ...selectedRole,
                          isActive: value === "active",
                        })
                      }
                    >
                      <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-role-description">Description</Label>
                  <Input
                    id="edit-role-description"
                    value={selectedRole.description || ""}
                    onChange={(e) =>
                      setSelectedRole({
                        ...selectedRole,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description of this role"
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                  />
                </div>

                <div>
                  <Label>Permissions *</Label>
                  <div className="mt-2 space-y-4 max-h-96 overflow-y-auto border rounded-md p-4">
                    {Array.from(
                      new Set(availablePermissions.map((p) => p.category))
                    ).map((category) => (
                      <div key={category}>
                        <div className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          {category}
                        </div>
                        <div className="space-y-2 ml-6">
                          {availablePermissions
                            .filter((p) => p.category === category)
                            .map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  id={`edit-perm-${permission.id}`}
                                  checked={selectedRole.permissions.includes(
                                    permission.id
                                  )}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRole({
                                        ...selectedRole,
                                        permissions: [
                                          ...selectedRole.permissions,
                                          permission.id,
                                        ],
                                      });
                                    } else {
                                      setSelectedRole({
                                        ...selectedRole,
                                        permissions:
                                          selectedRole.permissions.filter(
                                            (p: string) => p !== permission.id
                                          ),
                                      });
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label
                                  htmlFor={`edit-perm-${permission.id}`}
                                  className="text-sm text-gray-700 cursor-pointer"
                                >
                                  {permission.label}
                                </Label>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditRole(false)}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
