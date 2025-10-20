import React, { useState, useEffect } from 'react';
import { UserManagement } from './UserManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { BillingPlansAdmin } from './BillingPlansAdmin';
import { Analytics } from './Analytics';
import { SystemHealth } from './SystemHealth';
import { SupportTickets } from './SupportTickets';
import { PlatformSettings } from './PlatformSettings';
import { AddCustomerPage } from './AddCustomerPage';
import { Footer } from './Footer';
import { toast } from "sonner";
import { 
  initializeSocket, 
  disconnectSocket, 
  subscribeToCustomerEvents, 
  unsubscribeFromCustomerEvents,
  subscribeToUserEvents,
  unsubscribeFromUserEvents,
  subscribeToForceReauth,
  unsubscribeFromForceReauth
} from '../lib/socket';
import { setupActiveSessionValidation } from '../lib/sessionValidator';
import { 
  getCustomers,
  createCustomer,
  updateCustomer, 
  deleteCustomer, 
  getUsers, 
  createUser,
  updateUser,
  deleteUser,
  type Customer 
} from '../lib/api';
import { 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole,
  type Role 
} from '../lib/api/roles';
import { apiClient } from '../lib/api-client';
import { 
  PERMISSIONS, 
  getUserPermissions, 
  hasPermission,
  hasAnyPermission 
} from '../lib/permissions';
import { 
  Users, 
  Building, 
  DollarSign, 
  TrendingUp, 
  LogOut,
  Menu,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  RotateCcw,
  Mail,
  UserX,
  AlertTriangle,
  Trash2,
  Copy,
  CheckCircle,
  Key
} from 'lucide-react';
import { Textarea } from './ui/textarea';

interface SuperAdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export function SuperAdminDashboard({ 
  user, 
  onLogout
}: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'add-customer'>('dashboard');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'reset-password' | 'deactivate' | 'resend-invitation' | 'delete' | null;
    customer: any;
  }>({ type: null, customer: null });
  const [viewCustomerDialog, setViewCustomerDialog] = useState<any>(null);
  const [editCustomerDialog, setEditCustomerDialog] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [generatedPasswordDialog, setGeneratedPasswordDialog] = useState<any>(null); // For showing generated password
  const [copiedPassword, setCopiedPassword] = useState(false); // For copy button feedback

  // Customer data from API
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Users data from API
  const [users, setUsers] = useState<any[]>([]);

  // Roles data from API (Internal admin roles only - customer roles like owner, manager, tenant are managed separately)
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Fetch customers with current filters
  const fetchCustomersData = async () => {
    try {
      setLoading(true);
      const response = await getCustomers({ search: searchTerm });
      
      if (response.error) {
        toast.error(response.error.error || 'Failed to load customers');
      } else if (response.data) {
        console.log('🔍 Customers fetched from API:', response.data);
        // Check if plan data is included
        if (response.data.length > 0) {
          console.log('🔍 First customer plan data:', response.data[0].plan);
          console.log('🔍 First customer full object:', JSON.stringify(response.data[0], null, 2));
        }
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsersData = async () => {
    try {
      const response = await getUsers();
      
      if (response.error) {
        console.error('Failed to load users:', response.error);
      } else if (response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  // Fetch roles
  const fetchRolesData = async () => {
    try {
      setRolesLoading(true);
      console.log('🔄 Fetching roles from database...');
      const response = await getRoles();
      
      if (response.error) {
        console.error('❌ Failed to load roles:', response.error);
        toast.error('Failed to load roles');
      } else if (response.data) {
        console.log('✅ Roles fetched from database:', response.data);
        console.log('📊 Number of roles:', response.data.length);
        setRoles(response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setRolesLoading(false);
    }
  };

  // Fetch customers, users, and roles on component mount
  useEffect(() => {
    fetchCustomersData();
    fetchUsersData();
    fetchRolesData();

    // Initialize Socket.io for real-time updates
    const token = localStorage.getItem('token');
    if (token) {
      initializeSocket(token);

      // Subscribe to customer events
      subscribeToCustomerEvents({
        onCreated: (data) => {
          console.log('📡 Real-time: Customer created', data);
          toast.success(`New customer ${data.customer.company} was added`);
          // Add new customer to the list
          setCustomers((prev) => [data.customer, ...prev]);
        },
        onUpdated: (data) => {
          console.log('📡 Real-time: Customer updated', data);
          toast.info(`Customer ${data.customer.company} was updated`);
          // Update customer in the list
          setCustomers((prev) =>
            prev.map((c) => (c.id === data.customer.id ? data.customer : c))
          );
        },
        onDeleted: (data) => {
          console.log('📡 Real-time: Customer deleted', data);
          toast.info('A customer was deleted');
          // Remove customer from the list
          setCustomers((prev) => prev.filter((c) => c.id !== data.customerId));
        }
      });

      // Subscribe to user events
      subscribeToUserEvents({
        onCreated: (data) => {
          console.log('📡 Real-time: User created', data);
          toast.success(`New user ${data.user.name} was added`);
          // Refresh users list
          fetchUsersData();
        },
        onUpdated: (data) => {
          console.log('📡 Real-time: User updated', data);
          toast.info(`User ${data.user.name} was updated`);
          // Update user in the list
          setUsers((prev) =>
            prev.map((u) => (u.id === data.user.id ? data.user : u))
          );
        },
        onDeleted: (data) => {
          console.log('📡 Real-time: User deleted', data);
          toast.info('A user was deleted');
          // Remove user from the list
          setUsers((prev) => prev.filter((u) => u.id !== data.userId));
        }
      });

      // Subscribe to force re-authentication events
      subscribeToForceReauth((data) => {
        console.log('🔐 Force re-authentication received:', data);
        
        // Show warning message to user
        toast.warning(
          <div className="space-y-2">
            <p className="font-semibold">Account Update Required</p>
            <p className="text-sm">{data.reason}</p>
            <p className="text-xs text-gray-500">Please log in again to continue.</p>
          </div>,
          {
            duration: 10000, // Show for 10 seconds
            action: {
              label: 'Log Out Now',
              onClick: () => onLogout()
            }
          }
        );

        // Auto-logout after 15 seconds
        setTimeout(() => {
          toast.info('Logging out due to account changes...');
          onLogout();
        }, 15000);
      });
    }

    // Setup active session validation on click
    const cleanupSessionValidation = setupActiveSessionValidation((reason) => {
      // User's session is invalid - log them out immediately
      toast.error(
        <div className="space-y-2">
          <p className="font-semibold">Session Expired</p>
          <p className="text-sm">{reason}</p>
        </div>,
        { duration: 5000 }
      );
      
      // Logout after showing message
      setTimeout(() => {
        onLogout();
      }, 1000);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeFromCustomerEvents();
      unsubscribeFromUserEvents();
      unsubscribeFromForceReauth();
      disconnectSocket();
      cleanupSessionValidation();
    };
  }, []);

  // Re-fetch customers when search term changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activeTab === 'customers') {
        fetchCustomersData();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeTab]);

  // Calculate platform stats
  const platformStats = {
    totalCustomers: customers.length,
    totalProperties: customers.reduce((sum: number, customer: any) => sum + (customer._count?.properties || 0), 0),
    totalUnits: 0, // Would need separate API call to calculate total units across all properties
    totalRevenue: customers.reduce((sum: number, customer: any) => {
      const plan = customer.plan;
      const mrr = customer.mrr || plan?.monthlyPrice || 0;
      return sum + (mrr * 12);
    }, 0),
    activeSubscriptions: customers.filter((customer: any) => customer.status === 'active').length,
    churnRate: 2.3,
    avgRevenuePer: customers.length > 0 
      ? Math.round(customers.reduce((sum: number, customer: any) => {
          const mrr = customer.mrr || customer.plan?.monthlyPrice || 0;
          return sum + mrr;
        }, 0) / customers.length)
      : 0,
    supportTickets: 23
  };

  // Customer action handlers
  const handleViewCustomer = (customer: any) => {
    setViewCustomerDialog(customer);
  };

  const handleEditCustomer = (customer: any) => {
    setEditCustomerDialog(customer);
    setEditFormData({
      company: customer.company,
      owner: customer.owner,
      email: customer.email,
      phone: customer.phone || '',
      website: customer.website || '',
      taxId: customer.taxId || '',
      industry: customer.industry || '',
      companySize: customer.companySize || '',
      plan: customer.plan?.name || '', // Get plan name from plan object
      status: customer.status,
      billingCycle: customer.billingCycle || 'monthly',
      street: customer.street || '',
      city: customer.city || '',
      state: customer.state || '',
      zipCode: customer.zipCode || '',
      country: customer.country || 'Nigeria',
      propertyLimit: customer.propertyLimit,
      userLimit: customer.userLimit,
      storageLimit: customer.storageLimit,
      notes: customer.notes || '' // Add notes to form data
    });
  };

  const handleSaveEdit = async () => {
    if (!editCustomerDialog) return;

    try {
      setIsSubmitting(true);
      const response = await updateCustomer(editCustomerDialog.id, editFormData);

      if (response.error) {
        toast.error(response.error.error || 'Failed to update customer');
      } else {
        setCustomers(prev => prev.map(c => 
          c.id === editCustomerDialog.id ? { ...c, ...editFormData } : c
        ));
        toast.success(`${editFormData.company} updated successfully!`);
        setEditCustomerDialog(null);
        await fetchCustomersData(); // Refresh data from server
      }
    } catch (error) {
      toast.error('Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordClick = (customer: any) => {
    setConfirmAction({ type: 'reset-password', customer });
  };

  const handleDeactivateClick = (customer: any) => {
    setConfirmAction({ type: 'deactivate', customer });
  };

  const handleResendInvitationClick = (customer: any) => {
    setConfirmAction({ type: 'resend-invitation', customer });
  };

  const handleDeleteClick = (customer: any) => {
    setConfirmAction({ type: 'delete', customer });
  };

  const confirmResetPassword = async () => {
    if (confirmAction.customer) {
      try {
        setIsSubmitting(true);
        
        // Call API to reset password and generate new one (using apiClient for auth)
        const response = await apiClient.post<any>(
          `/api/customers/${confirmAction.customer.id}/action`,
          { action: 'reset-password' }
        );

        if (response.error) {
          throw new Error(response.error.error || 'Failed to reset password');
        }

        // Show the generated password to admin
        setGeneratedPasswordDialog({
          customer: confirmAction.customer,
          password: response.data.tempPassword,
          email: response.data.email,
          name: response.data.name
        });
        
        setConfirmAction({ type: null, customer: null });
        toast.success('New password generated successfully!');
      } catch (error: any) {
        toast.error(error.message || 'Failed to reset password');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const confirmDeactivate = async () => {
    if (confirmAction.customer) {
      try {
        setIsSubmitting(true);
        const newStatus = confirmAction.customer.status === 'active' ? 'inactive' : 'active';
        
        const response = await updateCustomer(confirmAction.customer.id, { status: newStatus });
        
        if (response.error) {
          toast.error(response.error.error || 'Failed to update customer status');
        } else {
          setCustomers(prev => prev.map(c => 
            c.id === confirmAction.customer.id ? { ...c, status: newStatus } : c
          ));
          const action = confirmAction.customer.status === 'active' ? 'deactivated' : 'reactivated';
          toast.success(`${confirmAction.customer.company} has been ${action}`);
        }
        setConfirmAction({ type: null, customer: null });
      } catch (error) {
        toast.error('Failed to update customer status');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const confirmResendInvitation = async () => {
    if (confirmAction.customer) {
      try {
        setIsSubmitting(true);
        // TODO: Implement resend invitation API call
        toast.success(`Invitation resent to ${confirmAction.customer.email}`);
        setConfirmAction({ type: null, customer: null });
      } catch (error) {
        toast.error('Failed to resend invitation');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const confirmDelete = async () => {
    if (confirmAction.customer) {
      try {
        setIsSubmitting(true);
        const response = await deleteCustomer(confirmAction.customer.id);
        
        if (response.error) {
          toast.error(response.error.error || 'Failed to delete customer');
        } else {
          // Remove customer from local state
          setCustomers(prev => prev.filter(c => c.id !== confirmAction.customer.id));
          toast.success(`${confirmAction.customer.company} has been deleted successfully`);
          setConfirmAction({ type: null, customer: null });
          
          // Refresh customer list from server
          await fetchCustomersData();
        }
      } catch (error) {
        toast.error('Failed to delete customer');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Customers are already filtered by the API, but we can apply additional client-side filtering
  const filteredCustomers = customers;

  const systemAlerts = [
    {
      id: 1,
      type: "error",
      title: "Database Connection Issues",
      message: "Intermittent connection issues with primary database",
      time: "5 minutes ago",
      severity: "high"
    },
    {
      id: 2,
      type: "warning",
      title: "High API Usage",
      message: "Metro Properties LLC approaching API rate limits",
      time: "1 hour ago",
      severity: "medium"
    },
    {
      id: 3,
      type: "info",
      title: "Scheduled Maintenance",
      message: "System maintenance scheduled for Sunday 2 AM",
      time: "2 hours ago",
      severity: "low"
    }
  ];

  const revenueData = [
    { month: "Jan", revenue: 180000, customers: 120 },
    { month: "Feb", revenue: 195000, customers: 125 },
    { month: "Mar", revenue: 210000, customers: 132 },
    { month: "Apr", revenue: 225000, customers: 138 },
    { month: "May", revenue: 235000, customers: 142 },
    { month: "Jun", revenue: 245000, customers: 148 }
  ];

  // Get user permissions
  const userPermissions = getUserPermissions(user);

  // Define navigation with permissions
  const allNavigation = [
    { id: 'overview', name: 'Overview', permission: null }, // No permission required for overview
    { id: 'customers', name: 'Customers', permission: PERMISSIONS.CUSTOMER_VIEW },
    { id: 'users', name: 'User Management', permission: PERMISSIONS.USER_VIEW },
    { id: 'billing', name: 'Billing & Plans', permission: PERMISSIONS.BILLING_MANAGEMENT },
    { id: 'analytics', name: 'Analytics', permission: PERMISSIONS.ANALYTICS_VIEW },
    { id: 'system', name: 'System Health', permission: PERMISSIONS.SYSTEM_HEALTH },
    { id: 'support', name: 'Support Tickets', permission: PERMISSIONS.SUPPORT_VIEW },
    { id: 'settings', name: 'Platform Settings', permission: PERMISSIONS.PLATFORM_SETTINGS },
  ];

  // Filter navigation based on user permissions
  const navigation = allNavigation.filter(item => {
    // If no permission required, show item
    if (!item.permission) return true;
    // Check if user has permission
    return hasPermission(userPermissions, item.permission);
  });

  const handleSaveCustomer = async (customerData: any) => {
    try {
      // Call the API to create the customer
      const response = await createCustomer({
        company: customerData.company,
        owner: customerData.owner,
        email: customerData.email,
        phone: customerData.phone,
        planId: null, // Can be set later
        status: 'trial',
        sendInvitation: false // Already handled in the form
      });

      if (response.error) {
        toast.error(response.error.error || 'Failed to create customer');
        return;
      }

      toast.success('Customer created successfully!');
      setCurrentView('dashboard');
      setActiveTab('customers');
      
      // Refetch customers to get the latest data
      await fetchCustomersData();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  };

  // Handle user actions
  const handleAddUser = async (userData: any) => {
    try {
      const response = await createUser(userData);
      if (response.error) {
        toast.error(response.error.error || 'Failed to create user');
      } else if (response.data) {
        setUsers(prev => [...prev, response.data]);
        toast.success('User added successfully!');
        await fetchUsersData();
      }
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const response = await updateUser(userId, updates);
      if (response.error) {
        toast.error(response.error.error || 'Failed to update user');
      } else if (response.data) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
        toast.success('User updated successfully!');
        await fetchUsersData();
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await deleteUser(userId);
      if (response.error) {
        toast.error(response.error.error || 'Failed to delete user');
      } else {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success('User deleted successfully!');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Show Add Customer Page
  if (currentView === 'add-customer') {
    return <AddCustomerPage 
      user={user} 
      onBack={() => {
        setCurrentView('dashboard');
        fetchCustomersData(); // Refresh customer list when returning from add customer page
      }} 
      onSave={handleSaveCustomer}
      onEditExisting={(customerId: string) => {
        // Find the customer and open edit dialog
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
          handleEditCustomer(customer);
          setCurrentView('dashboard'); // Go back to dashboard to show edit dialog
        }
      }}
    />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">PropertyHub Admin</h1>
              <Badge variant="destructive" className="ml-2 text-xs">ADMIN</Badge>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm font-medium">
                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg lg:shadow-none border-r mt-16 lg:mt-0 transition-transform duration-200 ease-in-out`}>
          <nav className="mt-5 px-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.id}>
                  <Button
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className="w-full justify-start text-sm md:text-base"
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                  >
                    {item.name}
                  </Button>
                </li>
              ))}
              
              {/* Logout Button */}
              <li className="pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm md:text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Loading Spinner */}
            {loading && activeTab === 'customers' && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
                  <p className="text-gray-600">Monitor your SaaS platform performance</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{platformStats.totalCustomers}</div>
                      <p className="text-xs text-muted-foreground">
                        +12% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₦{(platformStats.totalRevenue / 12).toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        +15.2% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
                      <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{platformStats.totalProperties}</div>
                      <p className="text-xs text-muted-foreground">
                        {platformStats.totalUnits} total units
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{platformStats.churnRate}%</div>
                      <p className="text-xs text-muted-foreground">
                        -0.8% from last month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* System Alerts */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>System Alerts</CardTitle>
                      <CardDescription>Critical system notifications</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {systemAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <div className={`p-1 rounded-full ${
                            alert.severity === 'high' ? 'bg-red-100' :
                            alert.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                            <AlertTriangle className={`h-4 w-4 ${
                              alert.severity === 'high' ? 'text-red-600' :
                              alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{alert.title}</h4>
                              <Badge variant={
                                alert.severity === 'high' ? 'destructive' :
                                alert.severity === 'medium' ? 'secondary' : 'default'
                              }>
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{alert.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Customers by Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {customers
                          .filter((c: any) => c.status === 'active')
                          .sort((a: any, b: any) => {
                            const aMrr = a.mrr || a.plan?.monthlyPrice || 0; // Fixed: use monthlyPrice
                            const bMrr = b.mrr || b.plan?.monthlyPrice || 0; // Fixed: use monthlyPrice
                            return bMrr - aMrr;
                          })
                          .slice(0, 5)
                          .map((customer: any) => {
                            const mrr = customer.mrr || customer.plan?.monthlyPrice || 0; // Fixed: use monthlyPrice
                            const totalUnits = customer.unitsCount || 0; // Use unitsCount from DB
                            return (
                              <div key={customer.id} className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{customer.company}</p>
                                  <p className="text-sm text-gray-600">{customer.owner}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">₦{mrr}/mo</p>
                                  <p className="text-sm text-gray-600">{totalUnits} units</p>
                                </div>
                              </div>
                            );
                          })}
                        {customers.filter((c: any) => c.status === 'active').length === 0 && (
                          <p className="text-center text-gray-500 py-4">No active customers</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {revenueData.slice(-3).map((data, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{data.month} 2025</span>
                            <div className="text-right">
                              <div className="font-medium">₦{(data.revenue / 1000).toFixed(0)}k</div>
                              <div className="text-sm text-gray-500">{data.customers} customers</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && !loading && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
                    <p className="text-gray-600">
                      Manage all platform customers • {filteredCustomers.length} of {customers.length} customers
                      {searchTerm && ` matching "${searchTerm}"`}
                    </p>
                  </div>
                  <Button onClick={() => setCurrentView('add-customer')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Company</TableHead>
                          <TableHead className="whitespace-nowrap">Owner</TableHead>
                          <TableHead className="whitespace-nowrap">Plan</TableHead>
                          <TableHead className="whitespace-nowrap">Properties</TableHead>
                          <TableHead className="whitespace-nowrap">MRR</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                          <TableHead className="whitespace-nowrap">Last Login</TableHead>
                          <TableHead className="w-[100px] whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer: any) => {
                        const propertiesCount = customer.propertiesCount || customer._count?.properties || 0; // Use propertiesCount from DB or fall back to _count
                        const totalUnits = customer.unitsCount || 0; // Use unitsCount from DB
                        const mrr = customer.mrr || customer.plan?.monthlyPrice || 0; // Fixed: use monthlyPrice, not priceMonthly
                        const planName = customer.plan?.name || 'No Plan';
                        const lastLogin = customer.users?.find((u: any) => u.lastLogin)?
                          new Date(customer.users.find((u: any) => u.lastLogin).lastLogin).toLocaleDateString() : 
                          'Never';

                        return (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{customer.company}</div>
                                <div className="text-sm text-gray-600">{customer.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{customer.owner}</TableCell>
                            <TableCell>
                              <Badge variant={
                                planName === 'Enterprise' ? 'default' :
                                planName === 'Professional' ? 'secondary' : 'outline'
                              }>
                                {planName}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div>{propertiesCount} properties</div>
                                <div className="text-sm text-gray-600">{totalUnits} units</div>
                              </div>
                            </TableCell>
                            <TableCell>₦{mrr}</TableCell>
                            <TableCell>
                              <Badge variant={
                                customer.status === 'active' ? 'default' :
                                customer.status === 'trial' ? 'secondary' : 'destructive'
                              }>
                                {customer.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {lastLogin}
                            </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Customer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleResetPasswordClick(customer)}>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResendInvitationClick(customer)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Resend Invitation
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeactivateClick(customer)}
                                  className="text-orange-600 focus:text-orange-600"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  {customer.status === 'active' ? 'Deactivate' : 'Reactivate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(customer)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Customer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredCustomers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            No customers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
              <UserManagement
                user={user}
                users={users}
                roles={roles}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onAddRole={async (roleData) => {
                  try {
                    const response = await createRole(roleData);
                    
                    if (response.error) {
                      toast.error(response.error.error || 'Failed to create role');
                    } else if (response.data) {
                      console.log('✅ Role created:', response.data);
                      // Refresh roles from database
                      await fetchRolesData();
                      toast.success('Role added successfully!');
                    }
                  } catch (error) {
                    console.error('Error creating role:', error);
                    toast.error('Failed to create role');
                  }
                }}
                onUpdateRole={async (roleId, updates) => {
                  try {
                    const response = await updateRole(roleId, updates);
                    
                    if (response.error) {
                      toast.error(response.error.error || 'Failed to update role');
                    } else if (response.data) {
                      console.log('✅ Role updated:', response.data);
                      // Refresh roles from database
                      await fetchRolesData();
                      toast.success('Role updated successfully!');
                    }
                  } catch (error) {
                    console.error('Error updating role:', error);
                    toast.error('Failed to update role');
                  }
                }}
                onDeleteRole={async (roleId) => {
                  try {
                    const response = await deleteRole(roleId);
                    
                    if (response.error) {
                      toast.error(response.error.error || 'Failed to delete role');
                    } else {
                      console.log('✅ Role deleted');
                      // Refresh roles from database
                      await fetchRolesData();
                      toast.success('Role deleted successfully!');
                    }
                  } catch (error) {
                    console.error('Error deleting role:', error);
                    toast.error('Failed to delete role');
                  }
                }}
                onBack={() => setActiveTab('overview')}
              />
            )}

            {/* Other tabs coming soon */}
            {activeTab === 'billing' && <BillingPlansAdmin />}
            {activeTab === 'analytics' && <Analytics />}
            {activeTab === 'system' && <SystemHealth />}
            {activeTab === 'support' && <SupportTickets />}
            {activeTab === 'settings' && <PlatformSettings />}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Confirmation Dialogs */}
      <AlertDialog open={confirmAction.type === 'reset-password'} onOpenChange={() => setConfirmAction({ type: null, customer: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate New Password</AlertDialogTitle>
            <AlertDialogDescription>
              Generate a new temporary password for <strong>{confirmAction.customer?.company}</strong>? 
              The new password will be displayed so you can share it securely with the customer owner at <strong>{confirmAction.customer?.email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword} disabled={isSubmitting}>
              {isSubmitting ? 'Generating...' : 'Generate New Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction.type === 'deactivate'} onOpenChange={() => setConfirmAction({ type: null, customer: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.customer?.status === 'active' ? 'Deactivate' : 'Reactivate'} Customer
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction.customer?.status === 'active' ? 'deactivate' : 'reactivate'} <strong>{confirmAction.customer?.company}</strong>? 
              {confirmAction.customer?.status === 'active' 
                ? ' This will suspend their access to the platform.' 
                : ' This will restore their access to the platform.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeactivate}
              disabled={isSubmitting}
              className={confirmAction.customer?.status === 'active' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isSubmitting 
                ? 'Processing...' 
                : confirmAction.customer?.status === 'active' ? 'Deactivate' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction.type === 'resend-invitation'} onOpenChange={() => setConfirmAction({ type: null, customer: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to resend the invitation email to <strong>{confirmAction.customer?.company}</strong>? 
              A new invitation will be sent to <strong>{confirmAction.customer?.email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResendInvitation} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Resend Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Customer Confirmation */}
      <AlertDialog open={confirmAction.type === 'delete'} onOpenChange={() => setConfirmAction({ type: null, customer: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{confirmAction.customer?.company}</strong>? 
              This action cannot be undone. All data associated with this customer, including properties, users, and records will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Customer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generated Password Dialog */}
      <Dialog open={!!generatedPasswordDialog} onOpenChange={() => {
        setGeneratedPasswordDialog(null);
        setCopiedPassword(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="h-5 w-5" />
              <DialogTitle>Password Reset Successful</DialogTitle>
            </div>
            <DialogDescription>
              A new temporary password has been generated for this customer.
            </DialogDescription>
          </DialogHeader>
          
          {generatedPasswordDialog && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{generatedPasswordDialog.customer.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Owner Name</p>
                  <p className="font-medium">{generatedPasswordDialog.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{generatedPasswordDialog.email}</p>
                </div>
              </div>

              {/* Generated Password */}
              <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-900">New Temporary Password</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-300">
                      <code className="text-lg font-mono font-bold text-gray-900 break-all">
                        {generatedPasswordDialog.password}
                      </code>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPasswordDialog.password);
                      setCopiedPassword(true);
                      toast.success('Password copied to clipboard!');
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    className="shrink-0"
                  >
                    {copiedPassword ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Copied
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

              {/* Instructions */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Share this password securely with the customer</li>
                      <li>Customer should change this password after logging in</li>
                      <li>This password will not be shown again</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              onClick={() => {
                setGeneratedPasswordDialog(null);
                setCopiedPassword(false);
              }}
              className="w-full"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={!!viewCustomerDialog} onOpenChange={() => setViewCustomerDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View complete information for this customer
            </DialogDescription>
          </DialogHeader>
          {viewCustomerDialog && (
            <div className="space-y-6">
              {/* Company Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-900">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Company Name</p>
                    <p className="font-medium">{viewCustomerDialog.company}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Owner</p>
                    <p className="font-medium">{viewCustomerDialog.owner}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{viewCustomerDialog.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{viewCustomerDialog.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p className="font-medium">{viewCustomerDialog.website || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tax ID</p>
                    <p className="font-medium">{viewCustomerDialog.taxId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium">{viewCustomerDialog.industry || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Company Size</p>
                    <p className="font-medium">{viewCustomerDialog.companySize || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-900">Account Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge variant={
                      viewCustomerDialog.status === 'active' ? 'default' :
                      viewCustomerDialog.status === 'trial' ? 'secondary' :
                      'destructive'
                    }>
                      {viewCustomerDialog.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="font-medium">{viewCustomerDialog.lastLogin || 'Never'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="font-medium">{new Date(viewCustomerDialog.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">MRR</p>
                    <p className="font-medium">₦{viewCustomerDialog.mrr?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>

              {/* Usage & Limits */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-900">Usage & Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Properties</p>
                    <p className="font-medium">{viewCustomerDialog._count?.properties || 0} / {viewCustomerDialog.propertyLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Users</p>
                    <p className="font-medium">{viewCustomerDialog._count?.users || 0} / {viewCustomerDialog.userLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Storage</p>
                    <p className="font-medium">0 MB / {viewCustomerDialog.storageLimit} MB</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Billing Cycle</p>
                    <p className="font-medium capitalize">{viewCustomerDialog.billingCycle}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              {(viewCustomerDialog.street || viewCustomerDialog.city) && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-900">Address</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Street</p>
                      <p className="font-medium">{viewCustomerDialog.street || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">City</p>
                      <p className="font-medium">{viewCustomerDialog.city || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">State</p>
                      <p className="font-medium">{viewCustomerDialog.state || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ZIP Code</p>
                      <p className="font-medium">{viewCustomerDialog.zipCode || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Country</p>
                      <p className="font-medium">{viewCustomerDialog.country || 'Nigeria'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {viewCustomerDialog.notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-900">Additional Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{viewCustomerDialog.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCustomerDialog(null)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewCustomerDialog(null);
              handleEditCustomer(viewCustomerDialog);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={!!editCustomerDialog} onOpenChange={() => setEditCustomerDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information and settings
            </DialogDescription>
          </DialogHeader>
          {editCustomerDialog && (
            <div className="space-y-6">
              {/* Company Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-900">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-company">Company Name *</Label>
                    <Input
                      id="edit-company"
                      value={editFormData.company}
                      onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-owner">Owner Name *</Label>
                    <Input
                      id="edit-owner"
                      value={editFormData.owner}
                      onChange={(e) => setEditFormData({ ...editFormData, owner: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-website">Website</Label>
                    <Input
                      id="edit-website"
                      type="url"
                      placeholder="https://example.com"
                      value={editFormData.website}
                      onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-taxId">Tax ID</Label>
                    <Input
                      id="edit-taxId"
                      value={editFormData.taxId}
                      onChange={(e) => setEditFormData({ ...editFormData, taxId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-industry">Industry</Label>
                    <Input
                      id="edit-industry"
                      value={editFormData.industry}
                      onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-companySize">Company Size</Label>
                    <Select
                      value={editFormData.companySize}
                      onValueChange={(value) => setEditFormData({ ...editFormData, companySize: value })}
                    >
                      <SelectTrigger id="edit-companySize">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="500+">500+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Account Status & Billing */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-900">Account Status & Billing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-plan">Subscription Plan</Label>
                    <Select
                      value={editFormData.plan || 'none'}
                      onValueChange={(value) => setEditFormData({ ...editFormData, plan: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger id="edit-plan">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Plan</SelectItem>
                        <SelectItem value="Starter">Starter - ₦500/mo</SelectItem>
                        <SelectItem value="Professional">Professional - ₦1,200/mo</SelectItem>
                        <SelectItem value="Enterprise">Enterprise - ₦2,500/mo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editFormData.status}
                      onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-billingCycle">Billing Cycle</Label>
                    <Select
                      value={editFormData.billingCycle}
                      onValueChange={(value) => setEditFormData({ ...editFormData, billingCycle: value })}
                    >
                      <SelectTrigger id="edit-billingCycle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-900">Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-street">Street Address</Label>
                    <Input
                      id="edit-street"
                      value={editFormData.street}
                      onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-state">State</Label>
                    <Input
                      id="edit-state"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-zipCode">ZIP Code</Label>
                    <Input
                      id="edit-zipCode"
                      value={editFormData.zipCode}
                      onChange={(e) => setEditFormData({ ...editFormData, zipCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-country">Country</Label>
                    <Input
                      id="edit-country"
                      value={editFormData.country}
                      onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-900">Account Limits</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-properties">Property Limit</Label>
                    <Input
                      id="edit-properties"
                      type="number"
                      min="1"
                      value={editFormData.propertyLimit}
                      onChange={(e) => setEditFormData({ ...editFormData, propertyLimit: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-users">User Limit</Label>
                    <Input
                      id="edit-users"
                      type="number"
                      min="1"
                      value={editFormData.userLimit}
                      onChange={(e) => setEditFormData({ ...editFormData, userLimit: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-storage">Storage (MB)</Label>
                    <Input
                      id="edit-storage"
                      type="number"
                      min="100"
                      value={editFormData.storageLimit}
                      onChange={(e) => setEditFormData({ ...editFormData, storageLimit: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-900">Additional Notes</h3>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Internal Notes</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Add any additional notes about this customer..."
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCustomerDialog(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

