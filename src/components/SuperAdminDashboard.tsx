import React, { useState, useEffect } from 'react';
import { UserManagement } from './UserManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
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
import { OnboardingManager } from './admin/OnboardingManager';
import { LandingPageManagement } from './admin/LandingPageManagement';
import { VerificationManagement } from './admin/VerificationManagement';
import { Footer } from './Footer';
import { PlatformLogo } from './PlatformLogo';
import { toast } from "sonner";
import { changePassword } from "../lib/api/auth";
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
import { clearCache } from '../lib/api/cache';
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
import { getBillingPlans } from '../lib/api/plans';
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
  Key,
  ArrowLeft,
  User,
  Shield,
  ChevronDown,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Textarea } from './ui/textarea';
import { useCurrency } from '../lib/CurrencyContext';
import { computeCustomerChurn, computeMRRChurn, lastNDaysWindow } from '../lib/metrics';

interface SuperAdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export function SuperAdminDashboard({
  user,
  onLogout
}: SuperAdminDashboardProps) {
  const { currency, formatCurrency, convertAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      return localStorage.getItem('admin_active_tab') || 'overview';
    } catch {
      return 'overview';
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'add-customer' | 'view-customer'>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'reset-password' | 'deactivate' | 'resend-invitation' | 'delete' | null;
    customer: any;
  }>({ type: null, customer: null });
  const [viewCustomerDialog, setViewCustomerDialog] = useState<any>(null);
  const [editCustomerDialog, setEditCustomerDialog] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [generatedPasswordDialog, setGeneratedPasswordDialog] = useState<any>(null); // For showing generated password
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false); // For copy button feedback

  // Customer data from API
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Users data from API
  const [users, setUsers] = useState<any[]>([]);

  // Roles data from API (Internal admin roles only - customer roles like owner, manager, tenant are managed separately)
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Plans data from API
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // Customer filters (Admin → Customer Management)
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'trial' | 'active' | 'suspended' | 'cancelled'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all'); // planId or 'all'
  const [billingCycleFilter, setBillingCycleFilter] = useState<'all' | 'monthly' | 'annual'>('all');
  const [hasPlanFilter, setHasPlanFilter] = useState<'all' | 'with' | 'without'>('all');
  const [minProperties, setMinProperties] = useState<string>('');
  const [maxProperties, setMaxProperties] = useState<string>('');
  const [minMRR, setMinMRR] = useState<string>('');
  const [maxMRR, setMaxMRR] = useState<string>('');

  const clearAllFilters = () => {
    setStatusFilter('all');
    setPlanFilter('all');
    setBillingCycleFilter('all');
    setHasPlanFilter('all');
    setMinProperties('');
    setMaxProperties('');
    setMinMRR('');
    setMaxMRR('');
  };

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

  // Fetch customers with current filters
  const fetchCustomersData = async (options?: { isInitial?: boolean; silent?: boolean }) => {
    try {
      const isInitial = options?.isInitial === true;
      const silent = options?.silent === true;
      if (!silent) {
        if (isInitial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
      }
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
      // Always clear loading flags, even for silent fetches
      setLoading(false);
      setRefreshing(false);
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

  // Fetch plans
  const fetchPlansData = async () => {
    try {
      setPlansLoading(true);
      console.log('🔄 Fetching plans from database...');
      const response = await getBillingPlans();

      if (response.error) {
        console.error('❌ Failed to load plans:', response.error);
        toast.error('Failed to load plans');
      } else if (response.data) {
        console.log('✅ Plans fetched from database:', response.data);
        // Filter only active plans for customer assignment
        setPlans(response.data.filter((p: any) => p.isActive));
      }
    } catch (error) {
      console.error('❌ Error fetching plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setPlansLoading(false);
    }
  };

  // Handle cache clearing
  const handleClearCache = async () => {
    try {
      setIsClearingCache(true);
      console.log('🧹 Clearing cache for all user types...');

      // Debug: Check if we have a token
      const token = localStorage.getItem('auth_token');
      console.log('🔑 Auth token exists:', !!token);
      console.log('🔑 Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');

      const response = await clearCache();

      if (response.error) {
        console.error('❌ Failed to clear cache:', response.error);
        toast.error('Failed to clear cache');
      } else if (response.data) {
        console.log('✅ Cache cleared successfully:', response.data);
        toast.success(`Cache cleared successfully! Cleared ${response.data.details.clearedTypes.length} cache types.`);

        // Optionally refresh data after cache clear
        setTimeout(() => {
          fetchCustomersData({ silent: true });
          fetchUsersData();
          fetchRolesData();
          fetchPlansData();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setIsClearingCache(false);
    }
  };

  // Subscribe to real-time plan events to keep UI in sync
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const handlePlanCreated = () => fetchPlansData();
    const handlePlanUpdated = () => fetchPlansData();
    const handlePlanDeleted = () => fetchPlansData();

    // Reuse socket helper
    const { on: onEvent, off: offEvent } = require('../lib/socket');
    try {
      onEvent('plan:created', handlePlanCreated);
      onEvent('plan:updated', handlePlanUpdated);
      onEvent('plan:deleted', handlePlanDeleted);
    } catch {}

    return () => {
      try {
        offEvent('plan:created', handlePlanCreated);
        offEvent('plan:updated', handlePlanUpdated);
        offEvent('plan:deleted', handlePlanDeleted);
      } catch {}
    };
  }, []);

  // Fetch customers, users, roles, and plans on component mount
  useEffect(() => {
    // Load customers silently to populate Overview metrics without UI changes
    fetchCustomersData({ silent: true });
    fetchUsersData();
    fetchRolesData();
    fetchPlansData();

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

      // Subscribe to force re-authentication events (immediate logout)
      subscribeToForceReauth((data) => {
        console.log('🔐 Force re-authentication received:', data);
        toast.error(data.reason || 'Your session has been terminated');
        onLogout();
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
  }, [searchTerm]);

  // When switching to Customers tab, fetch if we have no data yet
  useEffect(() => {
    if (activeTab === 'customers' && customers.length === 0) {
      fetchCustomersData({ isInitial: true });
    }
  }, [activeTab]);

  // Calculate platform stats
  const totalActiveSubscriptions = customers.filter((c: any) => c.status === 'active' || c.status === 'trial').length;
  const totalMonthlyRevenue = customers.reduce((sum: number, c: any) => sum + (c.mrr || c.plan?.monthlyPrice || 0), 0);
  const platformStats = {
    totalCustomers: customers.length,
    totalProperties: customers.reduce((sum: number, customer: any) => sum + (customer._count?.properties || 0), 0),
    totalUnits: 0, // Would need separate API call to calculate total units across all properties
    totalRevenue: totalMonthlyRevenue * 12,
    activeSubscriptions: totalActiveSubscriptions,
    churnRate: null as number | null,
    avgRevenuePer: totalActiveSubscriptions > 0 ? Math.round((totalMonthlyRevenue / totalActiveSubscriptions) * 100) / 100 : null,
    supportTickets: 23
  };

  // Compute 30-day churn metrics
  const churnWindow = lastNDaysWindow(30);
  const customerChurn = computeCustomerChurn(
    customers.map((c: any) => ({
      id: c.id,
      status: c.status,
      createdAt: c.createdAt,
      subscriptionStartDate: c.subscriptionStartDate,
      updatedAt: c.updatedAt,
      cancelledAt: null,
      mrr: c.mrr || c.plan?.monthlyPrice || 0,
    })),
    churnWindow
  );
  const mrrChurn = computeMRRChurn(
    customers.map((c: any) => ({
      id: c.id,
      status: c.status,
      createdAt: c.createdAt,
      subscriptionStartDate: c.subscriptionStartDate,
      updatedAt: c.updatedAt,
      cancelledAt: null,
      mrr: c.mrr || c.plan?.monthlyPrice || 0,
    })),
    churnWindow
  );

  // Customer action handlers
  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCurrentView('view-customer');
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
      planId: customer.planId || '', // Use planId instead of plan name
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
      notes: customer.notes || '', // Add notes to form data
      trialStartsAt: customer.trialStartsAt ? new Date(customer.trialStartsAt).toISOString().split('T')[0] : '',
      trialEndsAt: customer.trialEndsAt ? new Date(customer.trialEndsAt).toISOString().split('T')[0] : ''
    });
  };

  // Handle plan change in edit form - auto-fill limits
  const handlePlanChangeInEdit = (planId: string) => {
    // Support clearing the plan (\"No Plan\")
    if (!planId) {
      setEditFormData(prev => ({
        ...prev,
        planId: '',
        // Keep existing limits when removing a plan so they don't get lost
        propertyLimit: prev.propertyLimit,
        userLimit: prev.userLimit,
        storageLimit: prev.storageLimit,
      }));
      return;
    }

    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan) {
      setEditFormData(prev => ({
        ...prev,
        planId,
        propertyLimit: selectedPlan.propertyLimit,
        userLimit: selectedPlan.userLimit,
        storageLimit: selectedPlan.storageLimit,
      }));
    }
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

  // Customers are already filtered by the API via `search`, apply additional client-side filters
  const filteredCustomers = customers.filter((c: any) => {
    // Status
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;

    // Billing cycle
    if (billingCycleFilter !== 'all' && (c.billingCycle || 'monthly') !== billingCycleFilter) return false;

    // Has plan
    if (hasPlanFilter === 'with' && !c.planId) return false;
    if (hasPlanFilter === 'without' && !!c.planId) return false;

    // Plan match (by id)
    if (planFilter !== 'all') {
      const customerPlanId = c.planId || c.plan?.id || '';
      if (customerPlanId !== planFilter) return false;
    }

    // Properties count range
    const propertiesCount = c.propertiesCount ?? c._count?.properties ?? 0;
    const minProps = minProperties ? parseInt(minProperties) : undefined;
    const maxProps = maxProperties ? parseInt(maxProperties) : undefined;
    if (minProps !== undefined && propertiesCount < minProps) return false;
    if (maxProps !== undefined && propertiesCount > maxProps) return false;

    // MRR range (fallback to plan monthly price if MRR missing)
    const mrr = c.mrr ?? c.plan?.monthlyPrice ?? 0;
    const minM = minMRR ? parseFloat(minMRR) : undefined;
    const maxM = maxMRR ? parseFloat(maxMRR) : undefined;
    if (minM !== undefined && mrr < minM) return false;
    if (maxM !== undefined && mrr > maxM) return false;

    return true;
  });

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

  // Define navigation with permissions (matching the permission IDs from the database)
  const allNavigation = [
    // Overview is always visible to avoid a blank dashboard for restricted roles
    { id: 'overview', name: 'Overview', permission: null },
    // Show page if user has explicit page permission OR any action within that area
    { id: 'onboarding', name: 'Onboarding', permission: null }, // Available to all admins
    { id: 'landing-page', name: 'Landing Page', permission: null }, // Available to all admins
    { id: 'customers', name: 'Customers', permission: [PERMISSIONS.CUSTOMERS, PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.CUSTOMER_CREATE, PERMISSIONS.CUSTOMER_EDIT, PERMISSIONS.CUSTOMER_DELETE] },
    { id: 'users', name: 'User Management', permission: [PERMISSIONS.USERS, PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_EDIT, PERMISSIONS.USER_DELETE] },
    { id: 'verifications', name: 'Verifications', permission: null }, // Available to all admins
    { id: 'billing', name: 'Billing & Plans', permission: [PERMISSIONS.BILLING, PERMISSIONS.BILLING_MANAGEMENT, PERMISSIONS.PLAN_VIEW, PERMISSIONS.PLAN_CREATE, PERMISSIONS.PLAN_EDIT, PERMISSIONS.PLAN_DELETE, PERMISSIONS.INVOICE_VIEW, PERMISSIONS.PAYMENT_VIEW] },
    { id: 'analytics', name: 'Analytics', permission: [PERMISSIONS.ANALYTICS, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_MRR, PERMISSIONS.ANALYTICS_CHURN, PERMISSIONS.ANALYTICS_EXPORT] },
    { id: 'system', name: 'System Health', permission: [PERMISSIONS.SYSTEM, PERMISSIONS.SYSTEM_HEALTH, PERMISSIONS.SYSTEM_LOGS, PERMISSIONS.PLATFORM_SETTINGS, PERMISSIONS.CACHE_CLEAR] },
    { id: 'support', name: 'Support Tickets', permission: [PERMISSIONS.SUPPORT, PERMISSIONS.SUPPORT_VIEW, PERMISSIONS.SUPPORT_CREATE, PERMISSIONS.SUPPORT_RESPOND, PERMISSIONS.SUPPORT_CLOSE, PERMISSIONS.SUPPORT_ASSIGN] },
    { id: 'settings', name: 'Platform Settings', permission: [PERMISSIONS.SETTINGS, PERMISSIONS.PLATFORM_SETTINGS] },
  ];

  // Filter navigation based on user permissions
  const navigation = allNavigation.filter(item => {
    // If no permission required, show item
    if (!item.permission) return true;
    // Check if user has permission (supports single or any-of array)
    if (Array.isArray(item.permission)) {
      return hasAnyPermission(userPermissions, item.permission as any);
    }
    return hasPermission(userPermissions, item.permission as any);
  });

  // Safety net: if nothing is visible for the user, at least show Overview
  const visibleNavigation = navigation.length === 0 ? allNavigation.filter(i => i.id === 'overview') : navigation;

  const handleSaveCustomer = async (customerData: any) => {
    try {
      // Customer is already created by AddCustomerPage component
      // This function just needs to refresh the list and navigate back
      console.log('✅ Customer already created, refreshing list:', customerData.id || customerData.email);

      // Navigate back to dashboard
      setCurrentView('dashboard');
      setActiveTab('customers');

      // Refetch customers to get the latest data (including the newly created customer)
      await fetchCustomersData();

      // Show success message (customer creation success was already shown in AddCustomerPage)
      toast.success('Customer list refreshed');
    } catch (error) {
      console.error('Error refreshing customer list:', error);
      toast.error('Failed to refresh customer list');
    }
  };

  // Handle user actions
  const handleAddUser = async (userData: any) => {
    try {
      // Find the role by name to get its permissions
      const selectedRole = roles.find(r => r.name === userData.role);

      // Include the role's permissions in the user data
      const userDataWithPermissions = {
        ...userData,
        permissions: selectedRole?.permissions || []
      };

      console.log('📤 Creating user with role permissions:', {
        role: userData.role,
        permissions: userDataWithPermissions.permissions
      });

      const response = await createUser(userDataWithPermissions);
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
      // If role is being updated, include the new role's permissions
      let updatesWithPermissions = { ...updates };
      if (updates.role) {
        const selectedRole = roles.find(r => r.name === updates.role);
        updatesWithPermissions.permissions = selectedRole?.permissions || [];

        console.log('📤 Updating user role with permissions:', {
          role: updates.role,
          permissions: updatesWithPermissions.permissions
        });
      }

      const response = await updateUser(userId, updatesWithPermissions);
      if (response.error) {
        toast.error(response.error.error || 'Failed to update user');
      } else if (response.data) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatesWithPermissions } : u));
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

  // Show View Customer Page
  if (currentView === 'view-customer' && selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentView('dashboard');
                    setSelectedCustomer(null);
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Customers
                </Button>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Customer Details</h1>
                  <p className="text-sm text-gray-500">{selectedCustomer.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentView('dashboard');
                    handleEditCustomer(selectedCustomer);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0">
          <div className="max-w-5xl mx-auto space-y-6 w-full min-w-0">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Company Name</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.company}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Owner</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.owner}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Website</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.website || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tax ID</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.taxId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Industry</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.industry || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Company Size</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.companySize || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription & Billing */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <Badge variant={
                      selectedCustomer.status === 'active' ? 'default' :
                      selectedCustomer.status === 'trial' ? 'secondary' :
                      selectedCustomer.status === 'suspended' ? 'destructive' : 'outline'
                    }>
                      {selectedCustomer.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Plan</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.plan?.name || 'No Plan'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Billing Cycle</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedCustomer.billingCycle || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">MRR</p>
                    <p className="font-medium text-gray-900">${selectedCustomer.mrr?.toFixed(2) || '0.00'}</p>
                  </div>
                  {selectedCustomer.trialEndsAt && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Trial Ends</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedCustomer.trialEndsAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedCustomer.subscriptionStartDate && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Subscription Start</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedCustomer.subscriptionStartDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Next payment:{' '}
                        {(() => {
                          const startDate = new Date(selectedCustomer.subscriptionStartDate);
                          const nextBilling = new Date(startDate);
                          if (selectedCustomer.billingCycle === 'annual') {
                            nextBilling.setFullYear(nextBilling.getFullYear() + 1);
                          } else {
                            nextBilling.setMonth(nextBilling.getMonth() + 1);
                          }
                          return nextBilling.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          });
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage & Limits */}
            <Card>
              <CardHeader>
                <CardTitle>Usage & Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Properties</p>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.propertiesCount || 0} / {selectedCustomer.propertyLimit || 'Unlimited'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Users</p>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.usersCount || 0} / {selectedCustomer.userLimit || 'Unlimited'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Storage</p>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.storageUsed || 0} MB / {selectedCustomer.storageLimit || 'Unlimited'} MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Street</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.street || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">City</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.city || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">State</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.state || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Postal Code</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.postalCode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Country</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.country || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedCustomer.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedCustomer.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedCustomer.lastLogin && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Last Login</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedCustomer.lastLogin).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedCustomer.notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Notes</p>
                      <p className="font-medium text-gray-900 whitespace-pre-wrap">{selectedCustomer.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
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
              <PlatformLogo
                iconClassName={hasCustomLogo ? "h-10 w-auto max-w-[200px] object-contain" : "h-6 w-6 text-blue-600 mr-2"}
                showText={false}
                onLogoLoad={(hasLogo) => setHasCustomLogo(hasLogo)}
              />
              {!hasCustomLogo && (
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Contrezz Admin</h1>
              )}
              <Badge variant="destructive" className="ml-2 text-xs">ADMIN</Badge>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Clear Cache Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="text-xs sm:text-sm"
              >
                {isClearingCache ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2"></div>
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 mr-2" />
                    Clear Cache
                  </>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-gray-100"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-red-600 text-white text-sm font-medium">
                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500 font-normal">
                        {user.email}
                      </p>
              </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => setActiveTab('profile')}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => setActiveTab('change-password')}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Change Password</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Help & Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={onLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg lg:shadow-none border-r mt-16 lg:mt-0 transition-transform duration-200 ease-in-out`}>
          <nav className="mt-5 px-4">
            <ul className="space-y-1">
              {visibleNavigation.map((item) => (
                <li key={item.id}>
                  <Button
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className="w-full justify-start text-sm md:text-base"
                    onClick={() => {
                      setActiveTab(item.id);
                      try { localStorage.setItem('admin_active_tab', item.id); } catch {}
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
        <main className="flex-1 lg:ml-0 p-4 lg:p-8 w-full min-w-0">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {/* Loading Spinner (first load only) */}
            {loading && activeTab === 'customers' && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              </div>
            )}
            {/* No visible refresh indicator to avoid UI flicker during refetch */}

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
                      <div className="text-2xl font-bold">{formatCurrency(platformStats.totalRevenue / 12)}</div>
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
                      <div className="text-2xl font-bold">{customerChurn.rate !== null ? `${customerChurn.rate}%` : '—'}</div>
                      <p className="text-xs text-muted-foreground">{mrrChurn.rate !== null ? `MRR churn: ${mrrChurn.rate}%` : 'MRR churn: —'}</p>
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
                            const mrr = customer.mrr || customer.plan?.monthlyPrice || 0;
                            const totalUnits = customer.unitsCount || 0; // Use unitsCount from DB
                            return (
                              <div key={customer.id} className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{customer.company}</p>
                                  <p className="text-sm text-gray-600">{customer.owner}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{formatCurrency(convertAmount(mrr, customer.plan?.currency || 'USD'))}/mo</p>
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
                              <div className="font-medium">{formatCurrency(data.revenue)}</div>
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
                  <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="h-4 w-4 mr-2" />
                    {showFilters ? 'Hide Filters' : 'Filter'}
                  </Button>
                </div>

                {showFilters && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="trial">Trial</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Plan</Label>
                          <Select value={planFilter} onValueChange={(v: any) => setPlanFilter(v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Plans</SelectItem>
                              {plans.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Billing Cycle</Label>
                          <Select value={billingCycleFilter} onValueChange={(v: any) => setBillingCycleFilter(v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Has Plan</Label>
                          <Select value={hasPlanFilter} onValueChange={(v: any) => setHasPlanFilter(v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="with">With Plan</SelectItem>
                              <SelectItem value="without">Without Plan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Min Properties</Label>
                          <Input value={minProperties} onChange={(e) => setMinProperties(e.target.value)} placeholder="e.g. 1" />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Properties</Label>
                          <Input value={maxProperties} onChange={(e) => setMaxProperties(e.target.value)} placeholder="e.g. 50" />
                        </div>
                        <div className="space-y-2">
                          <Label>Min MRR</Label>
                          <Input value={minMRR} onChange={(e) => setMinMRR(e.target.value)} placeholder="e.g. 500" />
                        </div>
                        <div className="space-y-2">
                          <Label>Max MRR</Label>
                          <Input value={maxMRR} onChange={(e) => setMaxMRR(e.target.value)} placeholder="e.g. 5000" />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={clearAllFilters}>Clear</Button>
                        <Button variant="outline" onClick={() => setShowFilters(false)}>Apply</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                        const usersCount = customer._count?.users || (Array.isArray(customer.users) ? customer.users.length : 0);
                        const mrr = customer.mrr || customer.plan?.monthlyPrice || 0; // Fixed: use monthlyPrice, not priceMonthly
                        const planName = customer.plan?.name || 'No Plan';
                        const propLimit = customer.plan?.propertyLimit;
                        const userLimit = customer.plan?.userLimit;
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
                                <div>
                                  {propertiesCount} {propLimit ? `/ ${propLimit}` : ''} properties
                                </div>
                                <div className="text-sm text-gray-600">
                                  {usersCount} {userLimit ? `/ ${userLimit}` : ''} users
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(convertAmount(mrr, customer.plan?.currency || 'USD'))}</TableCell>
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

            {/* Onboarding Tab */}
            {activeTab === 'onboarding' && (
              <OnboardingManager
                onViewCustomer={(customerId) => {
                  // Find the customer and navigate to customers tab
                  const customer = customers.find(c => c.id === customerId);
                  if (customer) {
                    setSelectedCustomer(customer);
                    setCurrentView('view-customer');
                    setActiveTab('customers');
                  } else {
                    toast.error('Customer not found');
                  }
                }}
              />
            )}

            {/* Landing Page Management Tab */}
            {activeTab === 'landing-page' && <LandingPageManagement />}

            {/* Other tabs coming soon */}
            {activeTab === 'billing' && <BillingPlansAdmin />}
            {activeTab === 'analytics' && <Analytics />}
            {activeTab === 'system' && <SystemHealth />}
            {activeTab === 'verifications' && <VerificationManagement />}
            {activeTab === 'support' && <SupportTickets />}
            {activeTab === 'settings' && <PlatformSettings />}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Profile Settings
                    </h1>
                    <p className="text-gray-600">
                      Manage your personal information and preferences
                    </p>
                  </div>
                </div>

                {/* Profile Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal information and profile details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                      <Avatar className="w-20 h-20">
                        <AvatarFallback className="bg-red-600 text-white text-2xl font-semibold">
                          {user.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="destructive" className="text-sm px-3 py-1">
                            {user.role}
                          </Badge>
                          <Badge variant="outline" className="text-sm px-3 py-1">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin Access
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Administrator account with full system access
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Profile Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="admin-name" className="text-sm font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          Full Name
                        </Label>
                        <Input
                          id="admin-name"
                          value={user.name}
                          disabled
                          className="bg-gray-50 font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin-email" className="text-sm font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          Email Address
                        </Label>
                        <Input
                          id="admin-email"
                          type="email"
                          value={user.email}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">Primary contact email</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin-role" className="text-sm font-medium flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-500" />
                          Role
                        </Label>
                        <Input
                          id="admin-role"
                          value={user.role}
                          disabled
                          className="bg-gray-50 font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin-id" className="text-sm font-medium flex items-center gap-2">
                          <Key className="w-4 h-4 text-gray-500" />
                          User ID
                        </Label>
                        <Input
                          id="admin-id"
                          value={user.id || 'N/A'}
                          disabled
                          className="bg-gray-50 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Account Status */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Account Status
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Status</p>
                            <p className="text-sm font-semibold text-gray-900">Active</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Access Level</p>
                            <p className="text-sm font-semibold text-gray-900">Full Access</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Key className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Permissions</p>
                            <p className="text-sm font-semibold text-gray-900">All Granted</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Quick Actions */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => setActiveTab('change-password')}
                        >
                          <Shield className="w-4 h-4" />
                          Change Password
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                        >
                          <HelpCircle className="w-4 h-4" />
                          Help & Support
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security Information
                    </CardTitle>
                    <CardDescription>
                      Your account security details and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          Security Best Practices
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          <li>Change your password regularly</li>
                          <li>Never share your admin credentials</li>
                          <li>Use a strong, unique password</li>
                          <li>Log out when using shared devices</li>
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Key className="w-4 h-4 text-gray-500" />
                          <h4 className="text-sm font-semibold text-gray-900">Password</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Last changed: Not available
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setActiveTab('change-password')}
                        >
                          Change Password
                        </Button>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <h4 className="text-sm font-semibold text-gray-900">Email Verified</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Your email is verified and active
                        </p>
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Verified</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'change-password' && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (isChangingPassword) return;
                      const formElement = e.currentTarget as HTMLFormElement;

                      const formData = new FormData(formElement);
                      const currentPassword = (formData.get("currentPassword") as string) || "";
                      const newPassword = (formData.get("newPassword") as string) || "";
                      const confirmPassword = (formData.get("confirmPassword") as string) || "";

                      // Validation – keep in sync with global password change feature
                      if (!currentPassword || !newPassword || !confirmPassword) {
                        toast.error("All fields are required");
                        return;
                      }

                      if (newPassword.length < 6) {
                        toast.error("New password must be at least 6 characters long");
                        return;
                      }

                      if (newPassword !== confirmPassword) {
                        toast.error("New passwords do not match");
                        return;
                      }

                      if (currentPassword === newPassword) {
                        toast.error("New password must be different from current password");
                        return;
                      }

                      setIsChangingPassword(true);
                      try {
                        const response = await changePassword({
                          currentPassword,
                          newPassword,
                        });

                        if (response.data) {
                          toast.success("Password changed successfully");
                          formElement.reset();
                        } else if (response.error) {
                          const errorMessage =
                            response.error.message ||
                            response.error.error ||
                            "Failed to change password";
                          toast.error(errorMessage);
                        }
                      } catch (error: any) {
                        console.error("Error changing password:", error);
                        toast.error(error?.message || "Failed to change password");
                      } finally {
                        setIsChangingPassword(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                        required
                        disabled={isChangingPassword}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        required
                        disabled={isChangingPassword}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        required
                        disabled={isChangingPassword}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? "Changing..." : "Change Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
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
                    <p className="font-medium">{formatCurrency(convertAmount(viewCustomerDialog.mrr || 0, viewCustomerDialog.plan?.currency || 'USD'))}</p>
                  </div>
                </div>
              </div>

              {/* Usage & Limits */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-900">Usage & Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Show Projects for developers, Properties for others */}
                  {viewCustomerDialog.planCategory === 'development' ? (
                    <div>
                      <p className="text-sm text-gray-500">Projects</p>
                      <p className="font-medium">{viewCustomerDialog.projectsCount || 0} / {viewCustomerDialog.projectLimit || 'N/A'}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500">Properties</p>
                      <p className="font-medium">{viewCustomerDialog._count?.properties || 0} / {viewCustomerDialog.propertyLimit}</p>
                    </div>
                  )}
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
                  {viewCustomerDialog.subscriptionStartDate && (
                    <div>
                      <p className="text-sm text-gray-500">Next Payment</p>
                      <p className="font-medium">
                        {(() => {
                          const startDate = new Date(viewCustomerDialog.subscriptionStartDate);
                          const nextBilling = new Date(startDate);
                          if (viewCustomerDialog.billingCycle === 'annual') {
                            nextBilling.setFullYear(nextBilling.getFullYear() + 1);
                          } else {
                            nextBilling.setMonth(nextBilling.getMonth() + 1);
                          }
                          return nextBilling.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          });
                        })()}
                      </p>
                    </div>
                  )}
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

              {/* Developer Information (from Get Started application) */}
              {viewCustomerDialog.planCategory === 'development' && viewCustomerDialog.onboarding_applications?.[0]?.metadata && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-900">Developer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {viewCustomerDialog.onboarding_applications[0].metadata.yearsInDevelopment && (
                      <div>
                        <p className="text-sm text-gray-500">Years in Development</p>
                        <p className="font-medium">{viewCustomerDialog.onboarding_applications[0].metadata.yearsInDevelopment}</p>
                      </div>
                    )}
                    {viewCustomerDialog.onboarding_applications[0].metadata.developmentType && (
                      <div>
                        <p className="text-sm text-gray-500">Development Type</p>
                        <p className="font-medium capitalize">{viewCustomerDialog.onboarding_applications[0].metadata.developmentType}</p>
                      </div>
                    )}
                    {viewCustomerDialog.onboarding_applications[0].metadata.specialization && (
                      <div>
                        <p className="text-sm text-gray-500">Specialization</p>
                        <p className="font-medium capitalize">{viewCustomerDialog.onboarding_applications[0].metadata.specialization}</p>
                      </div>
                    )}
                    {viewCustomerDialog.onboarding_applications[0].metadata.primaryMarket && (
                      <div>
                        <p className="text-sm text-gray-500">Primary Market</p>
                        <p className="font-medium">{viewCustomerDialog.onboarding_applications[0].metadata.primaryMarket}</p>
                      </div>
                    )}
                    {viewCustomerDialog.onboarding_applications[0].metadata.totalProjectValue && (
                      <div>
                        <p className="text-sm text-gray-500">Total Project Value</p>
                        <p className="font-medium">{viewCustomerDialog.onboarding_applications[0].metadata.totalProjectValue}</p>
                      </div>
                    )}
                    {viewCustomerDialog.onboarding_applications[0].metadata.teamSize && (
                      <div>
                        <p className="text-sm text-gray-500">Team Size</p>
                        <p className="font-medium">{viewCustomerDialog.onboarding_applications[0].metadata.teamSize}</p>
                      </div>
                    )}
                    {viewCustomerDialog.onboarding_applications[0].metadata.developmentLicense && (
                      <div>
                        <p className="text-sm text-gray-500">Development License</p>
                        <p className="font-medium capitalize">{viewCustomerDialog.onboarding_applications[0].metadata.developmentLicense}</p>
                      </div>
                    )}
                    {viewCustomerDialog.onboarding_applications[0].metadata.licenseNumber && (
                      <div>
                        <p className="text-sm text-gray-500">License Number</p>
                        <p className="font-medium">{viewCustomerDialog.onboarding_applications[0].metadata.licenseNumber}</p>
                      </div>
                    )}
                    {viewCustomerDialog.onboarding_applications[0].metadata.companyRegistration && (
                      <div>
                        <p className="text-sm text-gray-500">Company Registration</p>
                        <p className="font-medium">{viewCustomerDialog.onboarding_applications[0].metadata.companyRegistration}</p>
                      </div>
                    )}
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
                      value={editFormData.planId || 'none'}
                      onValueChange={(value) => handlePlanChangeInEdit(value === 'none' ? '' : value)}
                      disabled={plansLoading}
                    >
                      <SelectTrigger id="edit-plan">
                        <SelectValue placeholder={plansLoading ? "Loading plans..." : "Select a plan"} />
                      </SelectTrigger>
                      <SelectContent>
            <SelectItem value="none">No Plan</SelectItem>
            {plans.filter((p: any) => p.isActive).map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {formatCurrency(convertAmount(plan.monthlyPrice, plan.currency || 'USD'))}/mo
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editFormData.planId && plans.find(p => p.id === editFormData.planId) && (
                      <p className="text-xs text-gray-500">
                        Limits will be set to: {plans.find(p => p.id === editFormData.planId)?.propertyLimit} properties, {plans.find(p => p.id === editFormData.planId)?.userLimit} users, {plans.find(p => p.id === editFormData.planId)?.storageLimit}MB storage
                      </p>
                    )}
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

                {/* Trial Period Management - Only show if status is 'trial' */}
                {editFormData.status === 'trial' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold mb-3 text-blue-900 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Trial Period
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-trialStartsAt">Trial Start Date</Label>
                        <Input
                          id="edit-trialStartsAt"
                          type="date"
                          value={editFormData.trialStartsAt || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, trialStartsAt: e.target.value })}
                        />
                        <p className="text-xs text-gray-500">When the trial period started</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-trialEndsAt">Trial End Date</Label>
                        <Input
                          id="edit-trialEndsAt"
                          type="date"
                          value={editFormData.trialEndsAt || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, trialEndsAt: e.target.value })}
                        />
                        <p className="text-xs text-gray-500">When the trial period expires</p>
                      </div>
                    </div>
                    {editFormData.trialStartsAt && editFormData.trialEndsAt && (
                      <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                        <p className="text-sm text-gray-700">
                          <strong>Trial Duration:</strong>{' '}
                          {Math.ceil(
                            (new Date(editFormData.trialEndsAt).getTime() -
                             new Date(editFormData.trialStartsAt).getTime()) /
                            (1000 * 60 * 60 * 24)
                          )} days
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          <strong>Days Remaining:</strong>{' '}
                          {Math.max(0, Math.floor(
                            (new Date(editFormData.trialEndsAt).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                          ))} days
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
                    <Select
                      value={editFormData.country || ""}
                      onValueChange={(value) => setEditFormData({ ...editFormData, country: value })}
                    >
                      <SelectTrigger id="edit-country">
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

