import React, { useState, useEffect } from "react";
import { UserManagement } from "./UserManagement";
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
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { BillingPlansAdmin } from "./BillingPlansAdmin";
import { Analytics } from "./Analytics";
import { SystemHealth } from "./SystemHealth";
import { SupportTickets } from "./SupportTickets";
import { PlatformSettings } from "./PlatformSettings";
import { AddCustomerPage } from "./AddCustomerPage";
import { OnboardingManager } from "./admin/OnboardingManager";
import { VerificationManagement } from "./admin/VerificationManagement";
import { Documentation } from "./admin/Documentation";
import { Footer } from "./Footer";
import { PlatformLogo } from "./PlatformLogo";
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
  unsubscribeFromForceReauth,
} from "../lib/socket";
import { clearCache } from "../lib/api/cache";
import { setupActiveSessionValidation } from "../lib/sessionValidator";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type Customer,
} from "../lib/api";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  type Role,
} from "../lib/api/roles";
import { getBillingPlans } from "../lib/api/plans";
import { apiClient } from "../lib/api-client";
import {
  PERMISSIONS,
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
} from "../lib/permissions";
import {
  Users,
  Building,
  Building2,
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
  CheckCircle2,
  Key,
  ArrowLeft,
  User,
  Shield,
  ChevronDown,
  HelpCircle,
  AlertCircle,
  BookOpen,
  Phone,
  MapPin,
  Calendar,
  Clock,
} from "lucide-react";

// Exact Contrezz logo from Figma Brand Guidelines
function ContrezztLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="4"
        y="16"
        width="12"
        height="20"
        rx="2"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <rect
        x="20"
        y="8"
        width="12"
        height="28"
        rx="2"
        fill="currentColor"
        fillOpacity="1"
      />
      <rect
        x="12"
        y="4"
        width="8"
        height="14"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.7"
      />
      <circle cx="10" cy="22" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="10" cy="28" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="26" cy="14" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="26" cy="20" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="26" cy="26" r="1.5" fill="white" fillOpacity="0.6" />
    </svg>
  );
}
import { Textarea } from "./ui/textarea";
import { useCurrency } from "../lib/CurrencyContext";
import {
  computeCustomerChurn,
  computeMRRChurn,
  lastNDaysWindow,
} from "../lib/metrics";

interface SuperAdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export function SuperAdminDashboard({
  user,
  onLogout,
}: SuperAdminDashboardProps) {
  const { currency, formatCurrency, convertAmount } = useCurrency();
  // Admin dashboard should display amounts in NGN (matching BillingPlansAdmin)
  const adminCurrency = "NGN";
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      return localStorage.getItem("admin_active_tab") || "overview";
    } catch {
      return "overview";
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState<
    "dashboard" | "add-customer" | "view-customer"
  >("dashboard");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type:
      | "reset-password"
      | "deactivate"
      | "resend-invitation"
      | "delete"
      | null;
    customer: any;
  }>({ type: null, customer: null });
  const [viewCustomerDialog, setViewCustomerDialog] = useState<any>(null);
  const [editCustomerDialog, setEditCustomerDialog] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [generatedPasswordDialog, setGeneratedPasswordDialog] =
    useState<any>(null); // For showing generated password
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
  const [statusFilter, setStatusFilter] = useState<
    "all" | "trial" | "active" | "suspended" | "cancelled"
  >("all");
  const [planFilter, setPlanFilter] = useState<string>("all"); // planId or 'all'
  const [billingCycleFilter, setBillingCycleFilter] = useState<
    "all" | "monthly" | "annual"
  >("all");
  const [hasPlanFilter, setHasPlanFilter] = useState<
    "all" | "with" | "without"
  >("all");
  const [minProperties, setMinProperties] = useState<string>("");
  const [maxProperties, setMaxProperties] = useState<string>("");
  const [minMRR, setMinMRR] = useState<string>("");
  const [maxMRR, setMaxMRR] = useState<string>("");

  // Customer pagination
  const [currentCustomerPage, setCurrentCustomerPage] = useState(1);
  const customersPerPage = 10;

  const clearAllFilters = () => {
    setStatusFilter("all");
    setPlanFilter("all");
    setBillingCycleFilter("all");
    setHasPlanFilter("all");
    setMinProperties("");
    setMaxProperties("");
    setMinMRR("");
    setMaxMRR("");
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
  const fetchCustomersData = async (options?: {
    isInitial?: boolean;
    silent?: boolean;
  }) => {
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
        toast.error(response.error.error || "Failed to load customers");
      } else if (response.data) {
        console.log("🔍 Customers fetched from API:", response.data);
        // Check if plan data is included
        if (response.data.length > 0) {
          console.log("🔍 First customer plan data:", response.data[0].plan);
          console.log(
            "🔍 First customer full object:",
            JSON.stringify(response.data[0], null, 2)
          );
        }
        setCustomers(response.data);
      }
    } catch (error) {
      console.error("❌ Error fetching customers:", error);
      toast.error("Failed to load customers");
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
        console.error("Failed to load users:", response.error);
      } else if (response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  // Fetch roles
  const fetchRolesData = async () => {
    try {
      setRolesLoading(true);
      console.log("🔄 Fetching roles from database...");
      const response = await getRoles();

      if (response.error) {
        console.error("❌ Failed to load roles:", response.error);
        toast.error("Failed to load roles");
      } else if (response.data) {
        console.log("✅ Roles fetched from database:", response.data);
        console.log("📊 Number of roles:", response.data.length);
        setRoles(response.data);
      }
    } catch (error) {
      console.error("❌ Error fetching roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setRolesLoading(false);
    }
  };

  // Fetch plans
  const fetchPlansData = async () => {
    try {
      setPlansLoading(true);
      console.log("🔄 Fetching plans from database...");
      const response = await getBillingPlans();

      if (response.error) {
        console.error("❌ Failed to load plans:", response.error);
        toast.error("Failed to load plans");
      } else if (response.data) {
        console.log("✅ Plans fetched from database:", response.data);
        // Filter only active plans for customer assignment
        setPlans(response.data.filter((p: any) => p.isActive));
      }
    } catch (error) {
      console.error("❌ Error fetching plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setPlansLoading(false);
    }
  };

  // Handle cache clearing
  const handleClearCache = async () => {
    try {
      setIsClearingCache(true);
      console.log("🧹 Clearing cache for all user types...");

      // Debug: Check if we have a token
      const token = localStorage.getItem("auth_token");
      console.log("🔑 Auth token exists:", !!token);
      console.log(
        "🔑 Token preview:",
        token ? `${token.substring(0, 20)}...` : "No token"
      );

      const response = await clearCache();

      if (response.error) {
        console.error("❌ Failed to clear cache:", response.error);
        toast.error("Failed to clear cache");
      } else if (response.data) {
        console.log("✅ Cache cleared successfully:", response.data);
        toast.success(
          `Cache cleared successfully! Cleared ${response.data.details.clearedTypes.length} cache types.`
        );

        // Optionally refresh data after cache clear
        setTimeout(() => {
          fetchCustomersData({ silent: true });
          fetchUsersData();
          fetchRolesData();
          fetchPlansData();
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Error clearing cache:", error);
      toast.error("Failed to clear cache");
    } finally {
      setIsClearingCache(false);
    }
  };

  // Subscribe to real-time plan events to keep UI in sync
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const handlePlanCreated = () => fetchPlansData();
    const handlePlanUpdated = () => fetchPlansData();
    const handlePlanDeleted = () => fetchPlansData();

    // Reuse socket helper
    const { on: onEvent, off: offEvent } = require("../lib/socket");
    try {
      onEvent("plan:created", handlePlanCreated);
      onEvent("plan:updated", handlePlanUpdated);
      onEvent("plan:deleted", handlePlanDeleted);
    } catch {}

    return () => {
      try {
        offEvent("plan:created", handlePlanCreated);
        offEvent("plan:updated", handlePlanUpdated);
        offEvent("plan:deleted", handlePlanDeleted);
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
    const token = localStorage.getItem("token");
    if (token) {
      initializeSocket(token);

      // Subscribe to customer events
      subscribeToCustomerEvents({
        onCreated: (data) => {
          console.log("📡 Real-time: Customer created", data);
          toast.success(`New customer ${data.customer.company} was added`);
          // Add new customer to the list
          setCustomers((prev) => [data.customer, ...prev]);
        },
        onUpdated: (data) => {
          console.log("📡 Real-time: Customer updated", data);
          toast.info(`Customer ${data.customer.company} was updated`);
          // Update customer in the list
          setCustomers((prev) =>
            prev.map((c) => (c.id === data.customer.id ? data.customer : c))
          );
        },
        onDeleted: (data) => {
          console.log("📡 Real-time: Customer deleted", data);
          toast.info("A customer was deleted");
          // Remove customer from the list
          setCustomers((prev) => prev.filter((c) => c.id !== data.customerId));
        },
      });

      // Subscribe to user events
      subscribeToUserEvents({
        onCreated: (data) => {
          console.log("📡 Real-time: User created", data);
          toast.success(`New user ${data.user.name} was added`);
          // Refresh users list
          fetchUsersData();
        },
        onUpdated: (data) => {
          console.log("📡 Real-time: User updated", data);
          toast.info(`User ${data.user.name} was updated`);
          // Update user in the list
          setUsers((prev) =>
            prev.map((u) => (u.id === data.user.id ? data.user : u))
          );
        },
        onDeleted: (data) => {
          console.log("📡 Real-time: User deleted", data);
          toast.info("A user was deleted");
          // Remove user from the list
          setUsers((prev) => prev.filter((u) => u.id !== data.userId));
        },
      });

      // Subscribe to force re-authentication events (immediate logout)
      subscribeToForceReauth((data) => {
        console.log("🔐 Force re-authentication received:", data);
        toast.error(data.reason || "Your session has been terminated");
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
      if (activeTab === "customers") {
        fetchCustomersData();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // When switching to Customers tab, fetch if we have no data yet
  useEffect(() => {
    if (activeTab === "customers" && customers.length === 0) {
      fetchCustomersData({ isInitial: true });
    }
  }, [activeTab]);

  // Calculate platform stats
  const totalActiveSubscriptions = customers.filter(
    (c: any) => c.status === "active" || c.status === "trial"
  ).length;
  const totalMonthlyRevenue = customers.reduce(
    (sum: number, c: any) => sum + (c.mrr || c.plan?.monthlyPrice || 0),
    0
  );
  const platformStats = {
    totalCustomers: customers.length,
    totalProperties: customers.reduce(
      (sum: number, customer: any) => sum + (customer._count?.properties || 0),
      0
    ),
    totalUnits: 0, // Would need separate API call to calculate total units across all properties
    totalRevenue: totalMonthlyRevenue * 12,
    activeSubscriptions: totalActiveSubscriptions,
    churnRate: null as number | null,
    avgRevenuePer:
      totalActiveSubscriptions > 0
        ? Math.round((totalMonthlyRevenue / totalActiveSubscriptions) * 100) /
          100
        : null,
    supportTickets: 23,
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
    setCurrentView("view-customer");
  };

  const handleEditCustomer = (customer: any) => {
    setEditCustomerDialog(customer);
    setEditFormData({
      company: customer.company,
      owner: customer.owner,
      email: customer.email,
      phone: customer.phone || "",
      website: customer.website || "",
      taxId: customer.taxId || "",
      industry: customer.industry || "",
      companySize: customer.companySize || "",
      planId: customer.planId || "", // Use planId instead of plan name
      status: customer.status,
      billingCycle: customer.billingCycle || "monthly",
      street: customer.street || "",
      city: customer.city || "",
      state: customer.state || "",
      zipCode: customer.zipCode || "",
      country: customer.country || "Nigeria",
      propertyLimit: customer.propertyLimit,
      userLimit: customer.userLimit,
      storageLimit: customer.storageLimit,
      notes: customer.notes || "", // Add notes to form data
      trialStartsAt: customer.trialStartsAt
        ? new Date(customer.trialStartsAt).toISOString().split("T")[0]
        : "",
      trialEndsAt: customer.trialEndsAt
        ? new Date(customer.trialEndsAt).toISOString().split("T")[0]
        : "",
    });
  };

  // Handle plan change in edit form - auto-fill limits
  const handlePlanChangeInEdit = (planId: string) => {
    // Support clearing the plan (\"No Plan\")
    if (!planId) {
      setEditFormData((prev) => ({
        ...prev,
        planId: "",
        // Keep existing limits when removing a plan so they don't get lost
        propertyLimit: prev.propertyLimit,
        userLimit: prev.userLimit,
        storageLimit: prev.storageLimit,
      }));
      return;
    }

    const selectedPlan = plans.find((p) => p.id === planId);
    if (selectedPlan) {
      setEditFormData((prev) => ({
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
      const response = await updateCustomer(
        editCustomerDialog.id,
        editFormData
      );

      if (response.error) {
        toast.error(response.error.error || "Failed to update customer");
      } else {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editCustomerDialog.id ? { ...c, ...editFormData } : c
          )
        );
        toast.success(`${editFormData.company} updated successfully!`);
        setEditCustomerDialog(null);
        await fetchCustomersData(); // Refresh data from server
      }
    } catch (error) {
      toast.error("Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordClick = (customer: any) => {
    setConfirmAction({ type: "reset-password", customer });
  };

  const handleDeactivateClick = (customer: any) => {
    setConfirmAction({ type: "deactivate", customer });
  };

  const handleResendInvitationClick = (customer: any) => {
    setConfirmAction({ type: "resend-invitation", customer });
  };

  const handleDeleteClick = (customer: any) => {
    setConfirmAction({ type: "delete", customer });
  };

  const confirmResetPassword = async () => {
    if (confirmAction.customer) {
      try {
        setIsSubmitting(true);

        // Call API to reset password and generate new one (using apiClient for auth)
        const response = await apiClient.post<any>(
          `/api/customers/${confirmAction.customer.id}/action`,
          { action: "reset-password" }
        );

        if (response.error) {
          throw new Error(response.error.error || "Failed to reset password");
        }

        // Show the generated password to admin
        setGeneratedPasswordDialog({
          customer: confirmAction.customer,
          password: response.data.tempPassword,
          email: response.data.email,
          name: response.data.name,
        });

        setConfirmAction({ type: null, customer: null });
        toast.success("New password generated successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to reset password");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const confirmDeactivate = async () => {
    if (confirmAction.customer) {
      try {
        setIsSubmitting(true);
        const newStatus =
          confirmAction.customer.status === "active" ? "inactive" : "active";

        const response = await updateCustomer(confirmAction.customer.id, {
          status: newStatus,
        });

        if (response.error) {
          toast.error(
            response.error.error || "Failed to update customer status"
          );
        } else {
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === confirmAction.customer.id
                ? { ...c, status: newStatus }
                : c
            )
          );
          const action =
            confirmAction.customer.status === "active"
              ? "deactivated"
              : "reactivated";
          toast.success(`${confirmAction.customer.company} has been ${action}`);
        }
        setConfirmAction({ type: null, customer: null });
      } catch (error) {
        toast.error("Failed to update customer status");
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
        toast.error("Failed to resend invitation");
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
          toast.error(response.error.error || "Failed to delete customer");
        } else {
          // Remove customer from local state
          setCustomers((prev) =>
            prev.filter((c) => c.id !== confirmAction.customer.id)
          );
          toast.success(
            `${confirmAction.customer.company} has been deleted successfully`
          );
          setConfirmAction({ type: null, customer: null });

          // Refresh customer list from server
          await fetchCustomersData();
        }
      } catch (error) {
        toast.error("Failed to delete customer");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Customers are already filtered by the API via `search`, apply additional client-side filters
  const filteredCustomers = customers.filter((c: any) => {
    // Status
    if (statusFilter !== "all" && c.status !== statusFilter) return false;

    // Billing cycle
    if (
      billingCycleFilter !== "all" &&
      (c.billingCycle || "monthly") !== billingCycleFilter
    )
      return false;

    // Has plan
    if (hasPlanFilter === "with" && !c.planId) return false;
    if (hasPlanFilter === "without" && !!c.planId) return false;

    // Plan match (by id)
    if (planFilter !== "all") {
      const customerPlanId = c.planId || c.plan?.id || "";
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

  // Calculate pagination for customers
  const totalCustomerPages = Math.ceil(
    filteredCustomers.length / customersPerPage
  );
  const startIndex = (currentCustomerPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentCustomerPage(1);
  }, [
    statusFilter,
    planFilter,
    billingCycleFilter,
    hasPlanFilter,
    minProperties,
    maxProperties,
    minMRR,
    maxMRR,
    searchTerm,
  ]);

  const systemAlerts = [
    {
      id: 1,
      type: "error",
      title: "Database Connection Issues",
      message: "Intermittent connection issues with primary database",
      time: "5 minutes ago",
      severity: "high",
    },
    {
      id: 2,
      type: "warning",
      title: "High API Usage",
      message: "Metro Properties LLC approaching API rate limits",
      time: "1 hour ago",
      severity: "medium",
    },
    {
      id: 3,
      type: "info",
      title: "Scheduled Maintenance",
      message: "System maintenance scheduled for Sunday 2 AM",
      time: "2 hours ago",
      severity: "low",
    },
  ];

  const revenueData = [
    { month: "Jan", revenue: 180000, customers: 120 },
    { month: "Feb", revenue: 195000, customers: 125 },
    { month: "Mar", revenue: 210000, customers: 132 },
    { month: "Apr", revenue: 225000, customers: 138 },
    { month: "May", revenue: 235000, customers: 142 },
    { month: "Jun", revenue: 245000, customers: 148 },
  ];

  // Get user permissions
  const userPermissions = getUserPermissions(user);

  // Define navigation with permissions (matching the permission IDs from the database)
  const allNavigation = [
    // Overview is always visible to avoid a blank dashboard for restricted roles
    { id: "overview", name: "Overview", permission: null },
    // Show page if user has explicit page permission OR any action within that area
    { id: "onboarding", name: "Onboarding", permission: null }, // Available to all admins
    {
      id: "customers",
      name: "Customers",
      permission: [
        PERMISSIONS.CUSTOMERS,
        PERMISSIONS.CUSTOMER_VIEW,
        PERMISSIONS.CUSTOMER_CREATE,
        PERMISSIONS.CUSTOMER_EDIT,
        PERMISSIONS.CUSTOMER_DELETE,
      ],
    },
    {
      id: "users",
      name: "User Management",
      permission: [
        PERMISSIONS.USERS,
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_EDIT,
        PERMISSIONS.USER_DELETE,
      ],
    },
    { id: "verifications", name: "Verifications", permission: null }, // Available to all admins
    {
      id: "billing",
      name: "Billing & Plans",
      permission: [
        PERMISSIONS.BILLING,
        PERMISSIONS.BILLING_MANAGEMENT,
        PERMISSIONS.PLAN_VIEW,
        PERMISSIONS.PLAN_CREATE,
        PERMISSIONS.PLAN_EDIT,
        PERMISSIONS.PLAN_DELETE,
        PERMISSIONS.INVOICE_VIEW,
        PERMISSIONS.PAYMENT_VIEW,
      ],
    },
    {
      id: "analytics",
      name: "Analytics",
      permission: [
        PERMISSIONS.ANALYTICS,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.ANALYTICS_MRR,
        PERMISSIONS.ANALYTICS_CHURN,
        PERMISSIONS.ANALYTICS_EXPORT,
      ],
    },
    {
      id: "system",
      name: "System Health",
      permission: [
        PERMISSIONS.SYSTEM,
        PERMISSIONS.SYSTEM_HEALTH,
        PERMISSIONS.SYSTEM_LOGS,
        PERMISSIONS.PLATFORM_SETTINGS,
        PERMISSIONS.CACHE_CLEAR,
      ],
    },
    {
      id: "support",
      name: "Support Tickets",
      permission: [
        PERMISSIONS.SUPPORT,
        PERMISSIONS.SUPPORT_VIEW,
        PERMISSIONS.SUPPORT_CREATE,
        PERMISSIONS.SUPPORT_RESPOND,
        PERMISSIONS.SUPPORT_CLOSE,
        PERMISSIONS.SUPPORT_ASSIGN,
      ],
    },
    { id: "documentation", name: "Documentation", permission: null }, // Available to all admins
    {
      id: "settings",
      name: "Platform Settings",
      permission: [PERMISSIONS.SETTINGS, PERMISSIONS.PLATFORM_SETTINGS],
    },
  ];

  // Filter navigation based on user permissions
  const navigation = allNavigation.filter((item) => {
    // If no permission required, show item
    if (!item.permission) return true;
    // Check if user has permission (supports single or any-of array)
    if (Array.isArray(item.permission)) {
      return hasAnyPermission(userPermissions, item.permission as any);
    }
    return hasPermission(userPermissions, item.permission as any);
  });

  // Safety net: if nothing is visible for the user, at least show Overview
  const visibleNavigation =
    navigation.length === 0
      ? allNavigation.filter((i) => i.id === "overview")
      : navigation;

  const handleSaveCustomer = async (customerData: any) => {
    try {
      // Customer is already created by AddCustomerPage component
      // This function just needs to refresh the list and navigate back
      console.log(
        "✅ Customer already created, refreshing list:",
        customerData.id || customerData.email
      );

      // Navigate back to dashboard
      setCurrentView("dashboard");
      setActiveTab("customers");

      // Refetch customers to get the latest data (including the newly created customer)
      await fetchCustomersData();

      // Show success message (customer creation success was already shown in AddCustomerPage)
      toast.success("Customer list refreshed");
    } catch (error) {
      console.error("Error refreshing customer list:", error);
      toast.error("Failed to refresh customer list");
    }
  };

  // Handle user actions
  const handleAddUser = async (userData: any) => {
    try {
      // Find the role by name to get its permissions
      const selectedRole = roles.find((r) => r.name === userData.role);

      // Include the role's permissions in the user data
      const userDataWithPermissions = {
        ...userData,
        permissions: selectedRole?.permissions || [],
      };

      console.log("📤 Creating user with role permissions:", {
        role: userData.role,
        permissions: userDataWithPermissions.permissions,
      });

      const response = await createUser(userDataWithPermissions);
      if (response.error) {
        toast.error(response.error.error || "Failed to create user");
      } else if (response.data) {
        setUsers((prev) => [...prev, response.data]);
        toast.success("User added successfully!");
        await fetchUsersData();
      }
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      // If role is being updated, include the new role's permissions
      let updatesWithPermissions = { ...updates };
      if (updates.role) {
        const selectedRole = roles.find((r) => r.name === updates.role);
        updatesWithPermissions.permissions = selectedRole?.permissions || [];

        console.log("📤 Updating user role with permissions:", {
          role: updates.role,
          permissions: updatesWithPermissions.permissions,
        });
      }

      const response = await updateUser(userId, updatesWithPermissions);
      if (response.error) {
        toast.error(response.error.error || "Failed to update user");
      } else if (response.data) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, ...updatesWithPermissions } : u
          )
        );
        toast.success("User updated successfully!");
        await fetchUsersData();
      }
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await deleteUser(userId);
      if (response.error) {
        toast.error(response.error.error || "Failed to delete user");
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast.success("User deleted successfully!");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  // Show Add Customer Page
  if (currentView === "add-customer") {
    return (
      <AddCustomerPage
        user={user}
        onBack={() => {
          setCurrentView("dashboard");
          fetchCustomersData(); // Refresh customer list when returning from add customer page
        }}
        onSave={handleSaveCustomer}
        onEditExisting={(customerId: string) => {
          // Find the customer and open edit dialog
          const customer = customers.find((c) => c.id === customerId);
          if (customer) {
            handleEditCustomer(customer);
            setCurrentView("dashboard"); // Go back to dashboard to show edit dialog
          }
        }}
      />
    );
  }

  // Show View Customer Page
  if (currentView === "view-customer" && selectedCustomer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 flex flex-col">
        {/* Enhanced Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-purple-100/50 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentView("dashboard");
                    setSelectedCustomer(null);
                  }}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Customers
                </Button>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                      Customer Details
                    </h1>
                    <p className="text-base text-gray-600 mt-0.5 font-medium">
                      {selectedCustomer.company}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentView("dashboard");
                    handleEditCustomer(selectedCustomer);
                  }}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 shadow-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0">
          <div className="max-w-6xl mx-auto space-y-8 w-full min-w-0">
            {/* Enhanced Company Information */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle className="text-white text-xl font-bold">
                    Company Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Company Name
                    </Label>
                    <p className="font-bold text-gray-900 text-lg">
                      {selectedCustomer.company}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Owner
                    </Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <p className="font-semibold text-gray-900 text-lg">
                        {selectedCustomer.owner}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Email
                    </Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {selectedCustomer.email}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Phone
                    </Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {selectedCustomer.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Website
                    </Label>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.website ? (
                        <a
                          href={selectedCustomer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 hover:underline"
                        >
                          {selectedCustomer.website}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Tax ID
                    </Label>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.taxId || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Industry
                    </Label>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.industry || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Company Size
                    </Label>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.companySize || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Subscription & Billing */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 text-white p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <CardTitle className="text-white text-xl font-bold">
                    Subscription & Billing
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </Label>
                    <div className="mt-2">
                      <Badge
                        className={
                          selectedCustomer.status === "active"
                            ? "bg-green-100 text-green-700 border-green-300 px-3 py-1.5 text-sm font-semibold"
                            : selectedCustomer.status === "trial"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-300 px-3 py-1.5 text-sm font-semibold"
                            : selectedCustomer.status === "suspended"
                            ? "bg-red-100 text-red-700 border-red-300 px-3 py-1.5 text-sm font-semibold"
                            : "bg-gray-100 text-gray-700 border-gray-300 px-3 py-1.5 text-sm font-semibold"
                        }
                        variant="outline"
                      >
                        {selectedCustomer.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Plan
                    </Label>
                    <p className="font-bold text-gray-900 text-lg">
                      {selectedCustomer.plan?.name || "No Plan"}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Billing Cycle
                    </Label>
                    <p className="font-semibold text-gray-900 capitalize text-lg">
                      {selectedCustomer.billingCycle || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Monthly Revenue
                    </Label>
                    <p className="font-bold text-2xl text-gray-900 bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      {formatCurrency(
                        convertAmount(
                          selectedCustomer.mrr || 0,
                          selectedCustomer.plan?.currency || "NGN",
                          adminCurrency
                        ),
                        adminCurrency
                      )}
                    </p>
                  </div>
                  {selectedCustomer.trialEndsAt && (
                    <div className="space-y-2 p-4 rounded-xl bg-white border-2 border-yellow-100 hover:border-yellow-200 transition-colors bg-yellow-50/30">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Trial Ends
                      </Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-yellow-600" />
                        <p className="font-semibold text-gray-900">
                          {new Date(
                            selectedCustomer.trialEndsAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedCustomer.subscriptionStartDate && (
                    <div className="space-y-2 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-colors">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Subscription Start
                      </Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="font-semibold text-gray-900">
                          {new Date(
                            selectedCustomer.subscriptionStartDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Next payment:{" "}
                        {(() => {
                          const startDate = new Date(
                            selectedCustomer.subscriptionStartDate
                          );
                          const nextBilling = new Date(startDate);
                          if (selectedCustomer.billingCycle === "annual") {
                            nextBilling.setFullYear(
                              nextBilling.getFullYear() + 1
                            );
                          } else {
                            nextBilling.setMonth(nextBilling.getMonth() + 1);
                          }
                          return nextBilling.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          });
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Usage & Limits */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <CardTitle className="text-white text-xl font-bold">
                    Usage & Limits
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-xl bg-white border-2 border-gray-100 hover:border-blue-200 transition-colors group">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Properties
                      </Label>
                      <Building2 className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="font-bold text-2xl text-gray-900">
                      {selectedCustomer.propertiesCount || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      of {selectedCustomer.propertyLimit || "Unlimited"}
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-white border-2 border-gray-100 hover:border-indigo-200 transition-colors group">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Users
                      </Label>
                      <Users className="h-5 w-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="font-bold text-2xl text-gray-900">
                      {selectedCustomer.usersCount || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      of {selectedCustomer.userLimit || "Unlimited"}
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-colors group">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Storage
                      </Label>
                      <AlertCircle className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="font-bold text-2xl text-gray-900">
                      {selectedCustomer.storageUsed || 0} MB
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      of {selectedCustomer.storageLimit || "Unlimited"} MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Address */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white p-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <CardTitle className="text-white text-xl font-bold">
                    Address
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-emerald-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Street
                    </Label>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.street || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-emerald-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      City
                    </Label>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.city || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-emerald-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      State
                    </Label>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.state || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-emerald-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Postal Code
                    </Label>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.postalCode || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-emerald-200 bg-emerald-50/30 md:col-span-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Country
                    </Label>
                    <p className="font-semibold text-gray-900 text-lg">
                      {selectedCustomer.country || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Account Information */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-600 to-slate-600 text-white p-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <CardTitle className="text-white text-xl font-bold">
                    Account Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Created
                    </Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedCustomer.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 transition-colors">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Last Updated
                    </Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedCustomer.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedCustomer.lastLogin && (
                    <div className="space-y-2 p-4 rounded-xl bg-white border border-green-100 hover:border-green-200 transition-colors bg-green-50/30">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Last Login
                      </Label>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <p className="font-semibold text-gray-900">
                          {new Date(
                            selectedCustomer.lastLogin
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedCustomer.notes && (
                    <div className="md:col-span-2 space-y-2 p-4 rounded-xl bg-white border-2 border-purple-100 hover:border-purple-200 transition-colors">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Notes
                      </Label>
                      <p className="font-medium text-gray-900 whitespace-pre-wrap p-3 bg-gray-50 rounded-lg border border-gray-100">
                        {selectedCustomer.notes}
                      </p>
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
      {/* Enhanced Header - Dark Brand Design */}
      <header className="bg-[#111827] shadow-lg sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2 text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] p-2 rounded-xl">
                <ContrezztLogo className="w-6 h-6 text-[#111827]" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
                Contrezz
              </span>
              <Badge className="bg-red-600 text-white border-red-700 hover:bg-red-700">
                ADMIN
              </Badge>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Clear Cache Button */}
              <button
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/20 hover:border-white/30"
              >
                {isClearingCache ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white"></div>
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Cache</span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center ring-2 ring-white/20">
                  <span className="text-white text-sm font-semibold">
                    {user.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-white">
                    {user.name}
                  </div>
                  <div className="text-xs text-white/60">{user.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Enhanced Sidebar - Dark Brand Design */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#111827] shadow-xl border-r border-white/10 mt-16 lg:mt-0 transition-transform duration-200 ease-in-out`}
        >
          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {visibleNavigation.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      try {
                        localStorage.setItem("admin_active_tab", item.id);
                      } catch {}
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-lg shadow-purple-500/25"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{item.name}</span>
                  </button>
                );
              })}

              {/* Logout Button */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
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
            {loading && activeTab === "customers" && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              </div>
            )}
            {/* No visible refresh indicator to avoid UI flicker during refetch */}

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Enhanced Header with Animated Gradient */}
                <div className="relative overflow-hidden rounded-3xl">
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-purple-500/10 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-violet-600/5 to-purple-600/5"></div>

                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl -ml-48 -mb-48"></div>

                  {/* Content */}
                  <div className="relative p-8 rounded-3xl border border-purple-200/50 bg-white/90 backdrop-blur-xl shadow-xl">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg">
                            <Building className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                              Platform Overview
                            </h2>
                            <p className="text-gray-600 text-lg mt-1">
                              Real-time insights and performance metrics
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-1">
                          Live
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-purple-50/30">
                    {/* Animated gradient orb */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/30 to-violet-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-violet-200 rounded-full -mr-16 -mt-16 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                      <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Total Customers
                      </CardTitle>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-3">
                      <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
                          {platformStats.totalCustomers}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50">
                          <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">
                            +12%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          vs last month
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-violet-50/30">
                    {/* Animated gradient orb */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-400/30 to-purple-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200 to-purple-200 rounded-full -mr-16 -mt-16 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                      <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Monthly Revenue
                      </CardTitle>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-3">
                      <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-violet-900 bg-clip-text text-transparent">
                          {formatCurrency(
                            convertAmount(
                              platformStats.totalRevenue / 12,
                              "NGN",
                              adminCurrency
                            ),
                            adminCurrency
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50">
                          <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">
                            +15.2%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          vs last month
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-purple-50/30">
                    {/* Animated gradient orb */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/30 to-violet-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-violet-200 rounded-full -mr-16 -mt-16 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                      <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Active Properties
                      </CardTitle>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Building className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-3">
                      <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
                          {platformStats.totalProperties}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-50">
                          <span className="text-xs font-semibold text-purple-700">
                            {platformStats.totalUnits}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          total units
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-violet-50/30">
                    {/* Animated gradient orb */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-400/30 to-purple-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200 to-purple-200 rounded-full -mr-16 -mt-16 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                      <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Churn Rate
                      </CardTitle>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-3">
                      <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-violet-900 bg-clip-text text-transparent">
                          {customerChurn.rate !== null
                            ? `${customerChurn.rate}%`
                            : "—"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-600">
                          {mrrChurn.rate !== null
                            ? `MRR churn: ${mrrChurn.rate}%`
                            : "MRR churn: —"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced System Alerts */}
                <Card className="border-0 shadow-xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <CardTitle className="text-white text-xl font-bold">
                          System Alerts
                        </CardTitle>
                      </div>
                      <CardDescription className="text-purple-100">
                        Critical system notifications and important updates
                      </CardDescription>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white">
                    <div className="space-y-4">
                      {systemAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`group flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                            alert.severity === "high"
                              ? "border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 hover:border-red-300"
                              : alert.severity === "medium"
                              ? "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:border-orange-300"
                              : "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:border-blue-300"
                          }`}
                        >
                          <div
                            className={`p-3 rounded-xl shadow-md ${
                              alert.severity === "high"
                                ? "bg-gradient-to-br from-red-500 to-red-600"
                                : alert.severity === "medium"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600"
                                : "bg-gradient-to-br from-blue-500 to-blue-600"
                            }`}
                          >
                            <AlertTriangle className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900 text-lg">
                                {alert.title}
                              </h4>
                              <Badge
                                className={`font-semibold px-3 py-1 ${
                                  alert.severity === "high"
                                    ? "bg-red-100 text-red-700 border-red-300"
                                    : alert.severity === "medium"
                                    ? "bg-orange-100 text-orange-700 border-orange-300"
                                    : "bg-blue-100 text-blue-700 border-blue-300"
                                }`}
                                variant="outline"
                              >
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed mb-2">
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                              <p className="text-xs font-medium text-gray-500">
                                {alert.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Recent Activity Cards */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <Card className="border-0 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            <CardTitle className="text-white text-xl font-bold">
                              Top Customers by Revenue
                            </CardTitle>
                          </div>
                          <CardDescription className="text-purple-100">
                            Highest revenue generating customers
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white">
                      <div className="space-y-3">
                        {customers
                          .filter((c: any) => c.status === "active")
                          .sort((a: any, b: any) => {
                            const aMrr = a.mrr || a.plan?.monthlyPrice || 0;
                            const bMrr = b.mrr || b.plan?.monthlyPrice || 0;
                            return bMrr - aMrr;
                          })
                          .slice(0, 5)
                          .map((customer: any, index: number) => {
                            const mrr =
                              customer.mrr || customer.plan?.monthlyPrice || 0;
                            const totalUnits = customer.unitsCount || 0;
                            return (
                              <div
                                key={customer.id}
                                className="group flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 bg-white hover:border-purple-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 text-white font-bold shadow-md">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-base">
                                      {customer.company}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {customer.owner}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900 text-lg">
                                    {formatCurrency(
                                      convertAmount(
                                        mrr,
                                        customer.plan?.currency ||
                                          adminCurrency,
                                        adminCurrency
                                      ),
                                      adminCurrency
                                    )}
                                    <span className="text-xs text-gray-500 font-normal ml-1">
                                      /mo
                                    </span>
                                  </p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Building className="h-3 w-3 text-gray-400" />
                                    <p className="text-xs text-gray-500">
                                      {totalUnits} units
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        {customers.filter((c: any) => c.status === "active")
                          .length === 0 && (
                          <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">
                              No active customers
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            <CardTitle className="text-white text-xl font-bold">
                              Revenue Trend
                            </CardTitle>
                          </div>
                          <CardDescription className="text-purple-100">
                            Monthly revenue performance
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white">
                      <div className="space-y-3">
                        {revenueData.slice(-3).map((data, index) => (
                          <div
                            key={index}
                            className="group flex justify-between items-center p-4 rounded-xl border-2 border-gray-100 bg-white hover:border-violet-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white font-bold shadow-md">
                                {index + 1}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-gray-900">
                                  {data.month} 2025
                                </span>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {data.customers} customers
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900 text-lg">
                                {formatCurrency(
                                  convertAmount(
                                    data.revenue,
                                    "NGN",
                                    adminCurrency
                                  ),
                                  adminCurrency
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-1 justify-end">
                                <div className="h-2 w-2 rounded-full bg-violet-500"></div>
                                <span className="text-xs text-gray-500">
                                  Revenue
                                </span>
                              </div>
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
            {activeTab === "customers" && !loading && (
              <div className="space-y-6">
                {/* Enhanced Header with Animated Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 p-8 shadow-2xl">
                  {/* Animated background orbs */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 opacity-20">
                    <Building2 className="h-24 w-24 text-white" />
                  </div>
                  <div className="absolute bottom-4 left-4 opacity-20">
                    <Users className="h-16 w-16 text-white" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-4xl font-bold text-white mb-2">
                            Customer Management
                          </h2>
                          <p className="text-purple-100 text-lg">
                            Manage all platform customers •{" "}
                            {filteredCustomers.length} of {customers.length}{" "}
                            customers
                            {searchTerm && ` matching "${searchTerm}"`}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setCurrentView("add-customer")}
                        className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Search and Filter Section */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search customers by name, email, or company..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {showFilters ? "Hide Filters" : "Filter"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {showFilters && (
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/50 to-violet-50/50">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={statusFilter}
                            onValueChange={(v: any) => setStatusFilter(v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="trial">Trial</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">
                                Suspended
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Plan</Label>
                          <Select
                            value={planFilter}
                            onValueChange={(v: any) => setPlanFilter(v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Plans</SelectItem>
                              {plans.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Billing Cycle</Label>
                          <Select
                            value={billingCycleFilter}
                            onValueChange={(v: any) => setBillingCycleFilter(v)}
                          >
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
                          <Select
                            value={hasPlanFilter}
                            onValueChange={(v: any) => setHasPlanFilter(v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="with">With Plan</SelectItem>
                              <SelectItem value="without">
                                Without Plan
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Min Properties</Label>
                          <Input
                            value={minProperties}
                            onChange={(e) => setMinProperties(e.target.value)}
                            placeholder="e.g. 1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Properties</Label>
                          <Input
                            value={maxProperties}
                            onChange={(e) => setMaxProperties(e.target.value)}
                            placeholder="e.g. 50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Min MRR</Label>
                          <Input
                            value={minMRR}
                            onChange={(e) => setMinMRR(e.target.value)}
                            placeholder="e.g. 500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max MRR</Label>
                          <Input
                            value={maxMRR}
                            onChange={(e) => setMaxMRR(e.target.value)}
                            placeholder="e.g. 5000"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={clearAllFilters}>
                          Clear
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowFilters(false)}
                        >
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Customer Table */}
                <Card className="border-0 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Customer List
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Company
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Owner
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Plan
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Properties
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            MRR
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Status
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Next Payment
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Last Login
                          </TableHead>
                          <TableHead className="w-[100px] whitespace-nowrap font-semibold text-gray-700">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCustomers.map((customer: any) => {
                          const propertiesCount =
                            customer.propertiesCount ||
                            customer._count?.properties ||
                            0; // Use propertiesCount from DB or fall back to _count
                          const usersCount =
                            customer._count?.users ||
                            (Array.isArray(customer.users)
                              ? customer.users.length
                              : 0);
                          const mrr =
                            customer.mrr || customer.plan?.monthlyPrice || 0; // Fixed: use monthlyPrice, not priceMonthly
                          const planName = customer.plan?.name || "No Plan";
                          const propLimit = customer.plan?.propertyLimit;
                          const userLimit = customer.plan?.userLimit;
                          const lastLogin = customer.users?.find(
                            (u: any) => u.lastLogin
                          )
                            ? new Date(
                                customer.users.find(
                                  (u: any) => u.lastLogin
                                ).lastLogin
                              ).toLocaleDateString()
                            : "Never";

                          // Calculate next payment date
                          const calculateNextPaymentDate = () => {
                            // If customer is on trial, show trial end date
                            if (
                              customer.status === "trial" &&
                              customer.trialEndsAt
                            ) {
                              return {
                                date: new Date(customer.trialEndsAt),
                                isTrial: true,
                              };
                            }

                            // If customer has nextPaymentDate, use it
                            if (customer.nextPaymentDate) {
                              return {
                                date: new Date(customer.nextPaymentDate),
                                isTrial: false,
                              };
                            }

                            // Calculate from subscription start date and billing cycle
                            if (
                              customer.subscriptionStartDate &&
                              customer.status === "active"
                            ) {
                              const startDate = new Date(
                                customer.subscriptionStartDate
                              );
                              const billingCycle =
                                customer.billingCycle || "monthly";
                              const nextPayment = new Date(startDate);
                              const now = new Date();

                              if (
                                billingCycle === "annual" ||
                                billingCycle === "yearly"
                              ) {
                                // Add years until we're in the future
                                while (nextPayment <= now) {
                                  nextPayment.setFullYear(
                                    nextPayment.getFullYear() + 1
                                  );
                                }
                              } else {
                                // Monthly billing
                                while (nextPayment <= now) {
                                  nextPayment.setMonth(
                                    nextPayment.getMonth() + 1
                                  );
                                }
                              }

                              return {
                                date: nextPayment,
                                isTrial: false,
                              };
                            }

                            return null;
                          };

                          const nextPaymentInfo = calculateNextPaymentDate();

                          return (
                            <TableRow
                              key={customer.id}
                              className="hover:bg-purple-50/30 transition-colors duration-150"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 text-white font-bold shadow-md">
                                    {customer.company
                                      ?.charAt(0)
                                      ?.toUpperCase() || "C"}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">
                                      {customer.company}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {customer.email}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-gray-900">
                                  {customer.owner}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    planName === "Enterprise"
                                      ? "bg-purple-100 text-purple-700 border-purple-300"
                                      : planName === "Professional"
                                      ? "bg-violet-100 text-violet-700 border-violet-300"
                                      : "bg-gray-100 text-gray-700 border-gray-300"
                                  }
                                >
                                  {planName}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-purple-600" />
                                    <span className="font-medium text-gray-900">
                                      {propertiesCount}
                                      {propLimit ? ` / ${propLimit}` : ""}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="h-3 w-3 text-gray-400" />
                                    <span>
                                      {usersCount}
                                      {userLimit ? ` / ${userLimit}` : ""} users
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-semibold text-gray-900">
                                  {formatCurrency(
                                    convertAmount(
                                      mrr,
                                      customer.plan?.currency || "NGN",
                                      adminCurrency
                                    ),
                                    adminCurrency
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">MRR</div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    customer.status === "active"
                                      ? "bg-green-100 text-green-700 border-green-300"
                                      : customer.status === "trial"
                                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                      : customer.status === "suspended"
                                      ? "bg-orange-100 text-orange-700 border-orange-300"
                                      : "bg-red-100 text-red-700 border-red-300"
                                  }
                                >
                                  {customer.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {nextPaymentInfo ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-purple-600" />
                                      <span className="font-medium text-gray-900">
                                        {nextPaymentInfo.date.toLocaleDateString(
                                          "en-US",
                                          {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          }
                                        )}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      {nextPaymentInfo.isTrial ? (
                                        <>
                                          <span className="text-yellow-600">
                                            Trial ends
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span>Due in</span>
                                          <span className="font-semibold text-purple-600">
                                            {Math.ceil(
                                              (nextPaymentInfo.date.getTime() -
                                                new Date().getTime()) /
                                                (1000 * 60 * 60 * 24)
                                            )}
                                          </span>
                                          <span>days</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">
                                    N/A
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {lastLogin}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-[160px]"
                                  >
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleViewCustomer(customer)
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleEditCustomer(customer)
                                      }
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Customer
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleResetPasswordClick(customer)
                                      }
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Reset Password
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleResendInvitationClick(customer)
                                      }
                                    >
                                      <Mail className="mr-2 h-4 w-4" />
                                      Resend Invitation
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeactivateClick(customer)
                                      }
                                      className="text-orange-600 focus:text-orange-600"
                                    >
                                      <UserX className="mr-2 h-4 w-4" />
                                      {customer.status === "active"
                                        ? "Deactivate"
                                        : "Reactivate"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeleteClick(customer)
                                      }
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
                        {paginatedCustomers.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="text-center py-12"
                            >
                              <div className="flex flex-col items-center gap-3">
                                <div className="p-4 rounded-full bg-gray-100">
                                  <Users className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="text-gray-500 font-medium">
                                  No customers found
                                </div>
                                <div className="text-sm text-gray-400">
                                  {searchTerm || showFilters
                                    ? "Try adjusting your search or filters"
                                    : "Get started by adding your first customer"}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  {totalCustomerPages > 1 && (
                    <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-t border-purple-200/50 px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-gray-700">
                          Showing{" "}
                          <span className="text-purple-600 font-bold">
                            {filteredCustomers.length === 0
                              ? 0
                              : startIndex + 1}
                          </span>{" "}
                          to{" "}
                          <span className="text-purple-600 font-bold">
                            {Math.min(endIndex, filteredCustomers.length)}
                          </span>{" "}
                          of{" "}
                          <span className="text-purple-600 font-bold">
                            {filteredCustomers.length}
                          </span>{" "}
                          customers
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentCustomerPage(currentCustomerPage - 1)
                            }
                            disabled={currentCustomerPage === 1}
                            className="border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </Button>
                          <div className="flex items-center space-x-1">
                            {Array.from(
                              { length: totalCustomerPages },
                              (_, i) => i + 1
                            )
                              .filter(
                                (page) =>
                                  page === 1 ||
                                  page === totalCustomerPages ||
                                  (page >= currentCustomerPage - 1 &&
                                    page <= currentCustomerPage + 1)
                              )
                              .map((page, index, array) => (
                                <React.Fragment key={page}>
                                  {index > 0 &&
                                    array[index - 1] !== page - 1 && (
                                      <span className="px-2 text-gray-400">
                                        ...
                                      </span>
                                    )}
                                  <Button
                                    variant={
                                      page === currentCustomerPage
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setCurrentCustomerPage(page)}
                                    className={
                                      page === currentCustomerPage
                                        ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white border-0"
                                        : "border-purple-200 text-purple-700 hover:bg-purple-50"
                                    }
                                  >
                                    {page}
                                  </Button>
                                </React.Fragment>
                              ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentCustomerPage(currentCustomerPage + 1)
                            }
                            disabled={
                              currentCustomerPage === totalCustomerPages
                            }
                            className="border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === "users" && (
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
                      toast.error(
                        response.error.error || "Failed to create role"
                      );
                    } else if (response.data) {
                      console.log("✅ Role created:", response.data);
                      // Refresh roles from database
                      await fetchRolesData();
                      toast.success("Role added successfully!");
                    }
                  } catch (error) {
                    console.error("Error creating role:", error);
                    toast.error("Failed to create role");
                  }
                }}
                onUpdateRole={async (roleId, updates) => {
                  try {
                    const response = await updateRole(roleId, updates);

                    if (response.error) {
                      toast.error(
                        response.error.error || "Failed to update role"
                      );
                    } else if (response.data) {
                      console.log("✅ Role updated:", response.data);
                      // Refresh roles from database
                      await fetchRolesData();
                      toast.success("Role updated successfully!");
                    }
                  } catch (error) {
                    console.error("Error updating role:", error);
                    toast.error("Failed to update role");
                  }
                }}
                onDeleteRole={async (roleId) => {
                  try {
                    const response = await deleteRole(roleId);

                    if (response.error) {
                      toast.error(
                        response.error.error || "Failed to delete role"
                      );
                    } else {
                      console.log("✅ Role deleted");
                      // Refresh roles from database
                      await fetchRolesData();
                      toast.success("Role deleted successfully!");
                    }
                  } catch (error) {
                    console.error("Error deleting role:", error);
                    toast.error("Failed to delete role");
                  }
                }}
                onBack={() => setActiveTab("overview")}
              />
            )}

            {/* Onboarding Tab */}
            {activeTab === "onboarding" && (
              <OnboardingManager
                onViewCustomer={(customerId) => {
                  // Find the customer and navigate to customers tab
                  const customer = customers.find((c) => c.id === customerId);
                  if (customer) {
                    setSelectedCustomer(customer);
                    setCurrentView("view-customer");
                    setActiveTab("customers");
                  } else {
                    toast.error("Customer not found");
                  }
                }}
              />
            )}

            {/* Other tabs coming soon */}
            {activeTab === "billing" && <BillingPlansAdmin />}
            {activeTab === "analytics" && <Analytics />}
            {activeTab === "system" && <SystemHealth />}
            {activeTab === "verifications" && <VerificationManagement />}
            {activeTab === "support" && <SupportTickets />}
            {activeTab === "documentation" && <Documentation />}
            {activeTab === "settings" && <PlatformSettings />}

            {/* Profile Tab */}
            {activeTab === "profile" && (
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
                          {user.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="destructive"
                            className="text-sm px-3 py-1"
                          >
                            {user.role}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-sm px-3 py-1"
                          >
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
                        <Label
                          htmlFor="admin-name"
                          className="text-sm font-medium flex items-center gap-2"
                        >
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
                        <Label
                          htmlFor="admin-email"
                          className="text-sm font-medium flex items-center gap-2"
                        >
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
                        <p className="text-xs text-gray-500">
                          Primary contact email
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="admin-role"
                          className="text-sm font-medium flex items-center gap-2"
                        >
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
                        <Label
                          htmlFor="admin-id"
                          className="text-sm font-medium flex items-center gap-2"
                        >
                          <Key className="w-4 h-4 text-gray-500" />
                          User ID
                        </Label>
                        <Input
                          id="admin-id"
                          value={user.id || "N/A"}
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
                            <p className="text-sm font-semibold text-gray-900">
                              Active
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">
                              Access Level
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              Full Access
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Key className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Permissions</p>
                            <p className="text-sm font-semibold text-gray-900">
                              All Granted
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Quick Actions */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Quick Actions
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => setActiveTab("change-password")}
                        >
                          <Shield className="w-4 h-4" />
                          Change Password
                        </Button>
                        <Button variant="outline" className="gap-2">
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
                          <h4 className="text-sm font-semibold text-gray-900">
                            Password
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Last changed: Not available
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setActiveTab("change-password")}
                        >
                          Change Password
                        </Button>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <h4 className="text-sm font-semibold text-gray-900">
                            Email Verified
                          </h4>
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
            {activeTab === "change-password" && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (isChangingPassword) return;
                      const formElement = e.currentTarget as HTMLFormElement;

                      const formData = new FormData(formElement);
                      const currentPassword =
                        (formData.get("currentPassword") as string) || "";
                      const newPassword =
                        (formData.get("newPassword") as string) || "";
                      const confirmPassword =
                        (formData.get("confirmPassword") as string) || "";

                      // Validation – keep in sync with global password change feature
                      if (
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword
                      ) {
                        toast.error("All fields are required");
                        return;
                      }

                      if (newPassword.length < 6) {
                        toast.error(
                          "New password must be at least 6 characters long"
                        );
                        return;
                      }

                      if (newPassword !== confirmPassword) {
                        toast.error("New passwords do not match");
                        return;
                      }

                      if (currentPassword === newPassword) {
                        toast.error(
                          "New password must be different from current password"
                        );
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
                        toast.error(
                          error?.message || "Failed to change password"
                        );
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
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
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
      <AlertDialog
        open={confirmAction.type === "reset-password"}
        onOpenChange={() => setConfirmAction({ type: null, customer: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate New Password</AlertDialogTitle>
            <AlertDialogDescription>
              Generate a new temporary password for{" "}
              <strong>{confirmAction.customer?.company}</strong>? The new
              password will be displayed so you can share it securely with the
              customer owner at <strong>{confirmAction.customer?.email}</strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmResetPassword}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Generating..." : "Generate New Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmAction.type === "deactivate"}
        onOpenChange={() => setConfirmAction({ type: null, customer: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.customer?.status === "active"
                ? "Deactivate"
                : "Reactivate"}{" "}
              Customer
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {confirmAction.customer?.status === "active"
                ? "deactivate"
                : "reactivate"}{" "}
              <strong>{confirmAction.customer?.company}</strong>?
              {confirmAction.customer?.status === "active"
                ? " This will suspend their access to the platform."
                : " This will restore their access to the platform."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeactivate}
              disabled={isSubmitting}
              className={
                confirmAction.customer?.status === "active"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {isSubmitting
                ? "Processing..."
                : confirmAction.customer?.status === "active"
                ? "Deactivate"
                : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmAction.type === "resend-invitation"}
        onOpenChange={() => setConfirmAction({ type: null, customer: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to resend the invitation email to{" "}
              <strong>{confirmAction.customer?.company}</strong>? A new
              invitation will be sent to{" "}
              <strong>{confirmAction.customer?.email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmResendInvitation}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Resend Invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Customer Confirmation */}
      <AlertDialog
        open={confirmAction.type === "delete"}
        onOpenChange={() => setConfirmAction({ type: null, customer: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong>{confirmAction.customer?.company}</strong>? This action
              cannot be undone. All data associated with this customer,
              including properties, users, and records will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isSubmitting ? "Deleting..." : "Delete Customer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generated Password Dialog */}
      <Dialog
        open={!!generatedPasswordDialog}
        onOpenChange={() => {
          setGeneratedPasswordDialog(null);
          setCopiedPassword(false);
        }}
      >
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
                  <p className="font-medium">
                    {generatedPasswordDialog.customer.company}
                  </p>
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
                      <p className="text-sm font-semibold text-blue-900">
                        New Temporary Password
                      </p>
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
                      navigator.clipboard.writeText(
                        generatedPasswordDialog.password
                      );
                      setCopiedPassword(true);
                      toast.success("Password copied to clipboard!");
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
                      <li>
                        Customer should change this password after logging in
                      </li>
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
      <Dialog
        open={!!viewCustomerDialog}
        onOpenChange={() => setViewCustomerDialog(null)}
      >
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
                <h3 className="text-sm font-semibold mb-3 text-gray-900">
                  Company Information
                </h3>
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
                    <p className="font-medium">
                      {viewCustomerDialog.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p className="font-medium">
                      {viewCustomerDialog.website || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tax ID</p>
                    <p className="font-medium">
                      {viewCustomerDialog.taxId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium">
                      {viewCustomerDialog.industry || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Company Size</p>
                    <p className="font-medium">
                      {viewCustomerDialog.companySize || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-900">
                  Account Status
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge
                      variant={
                        viewCustomerDialog.status === "active"
                          ? "default"
                          : viewCustomerDialog.status === "trial"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {viewCustomerDialog.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="font-medium">
                      {viewCustomerDialog.lastLogin || "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="font-medium">
                      {new Date(
                        viewCustomerDialog.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">MRR</p>
                    <p className="font-medium">
                      {formatCurrency(
                        convertAmount(
                          viewCustomerDialog.mrr || 0,
                          viewCustomerDialog.plan?.currency || adminCurrency,
                          adminCurrency
                        ),
                        adminCurrency
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Usage & Limits */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-900">
                  Usage & Limits
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Show Projects for developers, Properties for others */}
                  {viewCustomerDialog.planCategory === "development" ? (
                    <div>
                      <p className="text-sm text-gray-500">Projects</p>
                      <p className="font-medium">
                        {viewCustomerDialog.projectsCount || 0} /{" "}
                        {viewCustomerDialog.projectLimit || "N/A"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500">Properties</p>
                      <p className="font-medium">
                        {viewCustomerDialog._count?.properties || 0} /{" "}
                        {viewCustomerDialog.propertyLimit}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Users</p>
                    <p className="font-medium">
                      {viewCustomerDialog._count?.users || 0} /{" "}
                      {viewCustomerDialog.userLimit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Storage</p>
                    <p className="font-medium">
                      0 MB / {viewCustomerDialog.storageLimit} MB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Billing Cycle</p>
                    <p className="font-medium capitalize">
                      {viewCustomerDialog.billingCycle}
                    </p>
                  </div>
                  {viewCustomerDialog.subscriptionStartDate && (
                    <div>
                      <p className="text-sm text-gray-500">Next Payment</p>
                      <p className="font-medium">
                        {(() => {
                          const startDate = new Date(
                            viewCustomerDialog.subscriptionStartDate
                          );
                          const nextBilling = new Date(startDate);
                          if (viewCustomerDialog.billingCycle === "annual") {
                            nextBilling.setFullYear(
                              nextBilling.getFullYear() + 1
                            );
                          } else {
                            nextBilling.setMonth(nextBilling.getMonth() + 1);
                          }
                          return nextBilling.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
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
                  <h3 className="text-sm font-semibold mb-3 text-gray-900">
                    Address
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Street</p>
                      <p className="font-medium">
                        {viewCustomerDialog.street || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">City</p>
                      <p className="font-medium">
                        {viewCustomerDialog.city || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">State</p>
                      <p className="font-medium">
                        {viewCustomerDialog.state || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ZIP Code</p>
                      <p className="font-medium">
                        {viewCustomerDialog.zipCode || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Country</p>
                      <p className="font-medium">
                        {viewCustomerDialog.country || "Nigeria"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Developer Information (from Get Started application) */}
              {viewCustomerDialog.planCategory === "development" &&
                viewCustomerDialog.onboarding_applications?.[0]?.metadata && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-gray-900">
                      Developer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {viewCustomerDialog.onboarding_applications[0].metadata
                        .yearsInDevelopment && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Years in Development
                          </p>
                          <p className="font-medium">
                            {
                              viewCustomerDialog.onboarding_applications[0]
                                .metadata.yearsInDevelopment
                            }
                          </p>
                        </div>
                      )}
                      {viewCustomerDialog.onboarding_applications[0].metadata
                        .developmentType && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Development Type
                          </p>
                          <p className="font-medium capitalize">
                            {
                              viewCustomerDialog.onboarding_applications[0]
                                .metadata.developmentType
                            }
                          </p>
                        </div>
                      )}
                      {viewCustomerDialog.onboarding_applications[0].metadata
                        .specialization && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Specialization
                          </p>
                          <p className="font-medium capitalize">
                            {
                              viewCustomerDialog.onboarding_applications[0]
                                .metadata.specialization
                            }
                          </p>
                        </div>
                      )}
                      {viewCustomerDialog.onboarding_applications[0].metadata
                        .primaryMarket && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Primary Market
                          </p>
                          <p className="font-medium">
                            {
                              viewCustomerDialog.onboarding_applications[0]
                                .metadata.primaryMarket
                            }
                          </p>
                        </div>
                      )}
                      {viewCustomerDialog.onboarding_applications[0].metadata
                        .totalProjectValue && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Total Project Value
                          </p>
                          <p className="font-medium">
                            {
                              viewCustomerDialog.onboarding_applications[0]
                                .metadata.totalProjectValue
                            }
                          </p>
                        </div>
                      )}
                      {viewCustomerDialog.onboarding_applications[0].metadata
                        .teamSize && (
                        <div>
                          <p className="text-sm text-gray-500">Team Size</p>
                          <p className="font-medium">
                            {
                              viewCustomerDialog.onboarding_applications[0]
                                .metadata.teamSize
                            }
                          </p>
                        </div>
                      )}
                      {viewCustomerDialog.onboarding_applications[0].metadata
                        .developmentLicense && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Development License
                          </p>
                          <p className="font-medium capitalize">
                            {
                              viewCustomerDialog.onboarding_applications[0]
                                .metadata.developmentLicense
                            }
                          </p>
                        </div>
                      )}
                      {viewCustomerDialog.onboarding_applications[0].metadata
                        .licenseNumber && (
                        <div>
                          <p className="text-sm text-gray-500">
                            License Number
                          </p>
                          <p className="font-medium">
                            {
                              viewCustomerDialog.onboarding_applications[0]
                                .metadata.licenseNumber
                            }
                          </p>
                        </div>
                      )}
                      {viewCustomerDialog.onboarding_applications[0].metadata
                        .companyRegistration && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Company Registration
                          </p>
                          <p className="font-medium">
                            {
                              viewCustomerDialog.onboarding_applications[0]
                                .metadata.companyRegistration
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Additional Notes */}
              {viewCustomerDialog.notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-900">
                    Additional Notes
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {viewCustomerDialog.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewCustomerDialog(null)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setViewCustomerDialog(null);
                handleEditCustomer(viewCustomerDialog);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit Customer Dialog */}
      <Dialog
        open={!!editCustomerDialog}
        onOpenChange={() => setEditCustomerDialog(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6 rounded-t-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Edit className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-white text-2xl font-bold">
                    Edit Customer
                  </DialogTitle>
                  <DialogDescription className="text-purple-100 mt-1">
                    Update customer information and settings
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {editCustomerDialog && (
            <div className="p-6 space-y-8 bg-gradient-to-b from-gray-50 to-white">
              {/* Enhanced Company Information */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-gray-900 font-bold">
                      Company Information
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-company"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Company Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-company"
                        value={editFormData.company}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            company: e.target.value,
                          })
                        }
                        required
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-owner"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Owner Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-owner"
                        value={editFormData.owner}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            owner: e.target.value,
                          })
                        }
                        required
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-email"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="edit-email"
                          type="email"
                          value={editFormData.email}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              email: e.target.value,
                            })
                          }
                          required
                          className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-phone"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Phone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="edit-phone"
                          value={editFormData.phone}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              phone: e.target.value,
                            })
                          }
                          className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-website"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Website
                      </Label>
                      <Input
                        id="edit-website"
                        type="url"
                        placeholder="https://example.com"
                        value={editFormData.website}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            website: e.target.value,
                          })
                        }
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-taxId"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Tax ID
                      </Label>
                      <Input
                        id="edit-taxId"
                        value={editFormData.taxId}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            taxId: e.target.value,
                          })
                        }
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-industry"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Industry
                      </Label>
                      <Input
                        id="edit-industry"
                        value={editFormData.industry}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            industry: e.target.value,
                          })
                        }
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-companySize"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Company Size
                      </Label>
                      <Select
                        value={editFormData.companySize}
                        onValueChange={(value) =>
                          setEditFormData({
                            ...editFormData,
                            companySize: value,
                          })
                        }
                      >
                        <SelectTrigger
                          id="edit-companySize"
                          className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        >
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">
                            51-200 employees
                          </SelectItem>
                          <SelectItem value="201-500">
                            201-500 employees
                          </SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Account Status & Billing */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100 p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-violet-600" />
                    <CardTitle className="text-gray-900 font-bold">
                      Account Status & Billing
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-plan"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Subscription Plan
                      </Label>
                      <Select
                        value={editFormData.planId || "none"}
                        onValueChange={(value) =>
                          handlePlanChangeInEdit(value === "none" ? "" : value)
                        }
                        disabled={plansLoading}
                      >
                        <SelectTrigger
                          id="edit-plan"
                          className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        >
                          <SelectValue
                            placeholder={
                              plansLoading
                                ? "Loading plans..."
                                : "Select a plan"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Plan</SelectItem>
                          {plans
                            .filter((p: any) => p.isActive)
                            .map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} -{" "}
                                {formatCurrency(
                                  convertAmount(
                                    plan.monthlyPrice,
                                    plan.currency || adminCurrency,
                                    adminCurrency
                                  ),
                                  adminCurrency
                                )}
                                /mo
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {editFormData.planId &&
                        plans.find((p) => p.id === editFormData.planId) && (
                          <div className="mt-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
                            <p className="text-xs font-medium text-purple-900">
                              Limits will be set to:{" "}
                              <span className="font-bold">
                                {
                                  plans.find(
                                    (p) => p.id === editFormData.planId
                                  )?.propertyLimit
                                }{" "}
                                properties
                              </span>
                              ,{" "}
                              <span className="font-bold">
                                {
                                  plans.find(
                                    (p) => p.id === editFormData.planId
                                  )?.userLimit
                                }{" "}
                                users
                              </span>
                              ,{" "}
                              <span className="font-bold">
                                {
                                  plans.find(
                                    (p) => p.id === editFormData.planId
                                  )?.storageLimit
                                }{" "}
                                MB storage
                              </span>
                            </p>
                          </div>
                        )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-status"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Status
                      </Label>
                      <Select
                        value={editFormData.status}
                        onValueChange={(value) =>
                          setEditFormData({ ...editFormData, status: value })
                        }
                      >
                        <SelectTrigger
                          id="edit-status"
                          className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        >
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
                      <Label
                        htmlFor="edit-billingCycle"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Billing Cycle
                      </Label>
                      <Select
                        value={editFormData.billingCycle}
                        onValueChange={(value) =>
                          setEditFormData({
                            ...editFormData,
                            billingCycle: value,
                          })
                        }
                      >
                        <SelectTrigger
                          id="edit-billingCycle"
                          className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Enhanced Trial Period Management - Only show if status is 'trial' */}
                  {editFormData.status === "trial" && (
                    <div className="mt-6 p-5 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
                      <h4 className="text-base font-bold mb-4 text-yellow-900 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        Trial Period Management
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-trialStartsAt">
                            Trial Start Date
                          </Label>
                          <Input
                            id="edit-trialStartsAt"
                            type="date"
                            value={editFormData.trialStartsAt || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                trialStartsAt: e.target.value,
                              })
                            }
                          />
                          <p className="text-xs text-gray-500">
                            When the trial period started
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-trialEndsAt">
                            Trial End Date
                          </Label>
                          <Input
                            id="edit-trialEndsAt"
                            type="date"
                            value={editFormData.trialEndsAt || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                trialEndsAt: e.target.value,
                              })
                            }
                          />
                          <p className="text-xs text-gray-500">
                            When the trial period expires
                          </p>
                        </div>
                      </div>
                      {editFormData.trialStartsAt &&
                        editFormData.trialEndsAt && (
                          <div className="mt-4 p-4 bg-white rounded-xl border-2 border-yellow-300 shadow-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                                <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">
                                  Trial Duration
                                </p>
                                <p className="text-lg font-bold text-yellow-900">
                                  {Math.ceil(
                                    (new Date(
                                      editFormData.trialEndsAt
                                    ).getTime() -
                                      new Date(
                                        editFormData.trialStartsAt
                                      ).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )}{" "}
                                  <span className="text-sm font-normal">
                                    days
                                  </span>
                                </p>
                              </div>
                              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                                  Days Remaining
                                </p>
                                <p className="text-lg font-bold text-orange-900">
                                  {Math.max(
                                    0,
                                    Math.floor(
                                      (new Date(
                                        editFormData.trialEndsAt
                                      ).getTime() -
                                        new Date().getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    )
                                  )}{" "}
                                  <span className="text-sm font-normal">
                                    days
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Address */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-gray-900 font-bold">
                      Address
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label
                        htmlFor="edit-street"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Street Address
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="edit-street"
                          value={editFormData.street}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              street: e.target.value,
                            })
                          }
                          className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-city"
                        className="text-sm font-semibold text-gray-700"
                      >
                        City
                      </Label>
                      <Input
                        id="edit-city"
                        value={editFormData.city}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            city: e.target.value,
                          })
                        }
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-state"
                        className="text-sm font-semibold text-gray-700"
                      >
                        State
                      </Label>
                      <Input
                        id="edit-state"
                        value={editFormData.state}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            state: e.target.value,
                          })
                        }
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-zipCode"
                        className="text-sm font-semibold text-gray-700"
                      >
                        ZIP Code
                      </Label>
                      <Input
                        id="edit-zipCode"
                        value={editFormData.zipCode}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            zipCode: e.target.value,
                          })
                        }
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-country"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Country
                      </Label>
                      <Select
                        value={editFormData.country || ""}
                        onValueChange={(value) =>
                          setEditFormData({ ...editFormData, country: value })
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
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Account Limits */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-gray-900 font-bold">
                      Account Limits
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-blue-200 transition-colors">
                      <Label
                        htmlFor="edit-properties"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Building2 className="h-4 w-4 text-blue-500" />
                        Property Limit
                      </Label>
                      <Input
                        id="edit-properties"
                        type="number"
                        min="1"
                        value={editFormData.propertyLimit}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            propertyLimit: parseInt(e.target.value) || 0,
                          })
                        }
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 font-semibold"
                      />
                    </div>
                    <div className="space-y-2 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-indigo-200 transition-colors">
                      <Label
                        htmlFor="edit-users"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Users className="h-4 w-4 text-indigo-500" />
                        User Limit
                      </Label>
                      <Input
                        id="edit-users"
                        type="number"
                        min="1"
                        value={editFormData.userLimit}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            userLimit: parseInt(e.target.value) || 0,
                          })
                        }
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 font-semibold"
                      />
                    </div>
                    <div className="space-y-2 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-colors">
                      <Label
                        htmlFor="edit-storage"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 text-purple-500" />
                        Storage (MB)
                      </Label>
                      <Input
                        id="edit-storage"
                        type="number"
                        min="100"
                        value={editFormData.storageLimit}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            storageLimit: parseInt(e.target.value) || 0,
                          })
                        }
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 font-semibold"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Additional Notes */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-gray-900 font-bold">
                      Additional Notes
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-notes"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Internal Notes
                    </Label>
                    <Textarea
                      id="edit-notes"
                      placeholder="Add any additional notes about this customer..."
                      value={editFormData.notes || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          notes: e.target.value,
                        })
                      }
                      rows={4}
                      className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Enhanced Footer */}
          <DialogFooter className="p-6 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setEditCustomerDialog(null)}
              disabled={isSubmitting}
              className="border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
