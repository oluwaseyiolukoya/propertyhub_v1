import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  getSettings,
  updateManagerPermissions,
  getPaymentGatewaySettings,
  savePaymentGatewaySettings,
} from "../lib/api/settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Switch } from "./ui/switch";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Monitor,
  Smartphone,
  Shield,
  Activity,
  HelpCircle,
  Save,
  X,
  Upload,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  AlertCircle,
  CheckCircle,
  Building2,
  Users,
  Clock,
  Laptop,
  Tablet,
  Settings,
  Key,
  Download,
  FileText,
  MessageSquare,
  DollarSign,
  CreditCard,
  Receipt,
  Briefcase,
  Globe,
  Zap,
  Archive,
  ExternalLink,
  Crown,
  TrendingUp,
  PieChart,
  Copy,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAccountInfo,
  initializeTwoFactor,
  verifyTwoFactorSetup,
  disableTwoFactor,
} from "../lib/api/auth";
import { updateCustomer } from "../lib/api/customers";
import { apiClient } from "../lib/api-client";
import {
  getSubscriptionPlans,
  changePlan,
  changeBillingCycle,
  cancelSubscription,
  type Plan,
} from "../lib/api/subscriptions";
import { SubscriptionManagement } from "./SubscriptionManagement";
import {
  initializeSocket,
  subscribeToAccountEvents,
  unsubscribeFromAccountEvents,
} from "../lib/socket";
import { API_BASE_URL } from "../lib/api-config";
import { TRIAL_PLAN_LIMITS } from "../lib/constants/subscriptions";

interface PropertyOwnerSettingsProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    avatar?: string;
    company?: string;
  };
  onBack: () => void;
  onSave: (updates: any) => void;
  onLogout: () => void;
  initialTab?: string;
}

export function PropertyOwnerSettings({
  user,
  onBack,
  onSave,
  onLogout,
  initialTab,
}: PropertyOwnerSettingsProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "profile");
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Subscription management states
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [planCategory, setPlanCategory] = useState<string | undefined>(
    undefined
  );
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [showChangeBillingDialog, setShowChangeBillingDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [newBillingCycle, setNewBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [cancelReason, setCancelReason] = useState("");
  const [cancelConfirmation, setCancelConfirmation] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    address: "",
    timezone: "America/Los_Angeles",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    avatar: user.avatar || null,
  });

  // Company state
  const [companyData, setCompanyData] = useState({
    companyName: user.company || "",
    businessType: "", // Maps to 'industry' in database
    taxId: "",
    website: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    yearEstablished: "",
    licenseNumber: "",
    insuranceProvider: "",
    insurancePolicy: "",
    insuranceExpiration: "",
    companySize: "",
  });

  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState({
    plan: "Trial",
    planId: "",
    planCategory: "property_management",
    currency: "USD",
    planMonthlyPrice: 0,
    planAnnualPrice: 0,
    status: "trial",
    billingCycle: "monthly",
    nextBillingDate: "2024-04-01",
    amount: 0,
    properties: TRIAL_PLAN_LIMITS.properties,
    units: TRIAL_PLAN_LIMITS.units,
    managers: TRIAL_PLAN_LIMITS.users,
    usageStats: {
      propertiesUsed: 0,
      unitsUsed: 0,
      managersUsed: 0,
      storageUsed: 0,
      storageLimit: TRIAL_PLAN_LIMITS.storageMb,
    },
  });

  const bytesToGigabytes = (bytes: number) =>
    Number((bytes / 1024 ** 3).toFixed(2));

  // Fetch account data from database
  const fetchAccountData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      const response = await getAccountInfo();

      if (response.error) {
        if (!silent) toast.error("Failed to load account data");
        return;
      }

      if (response.data) {
        const { user: userData, customer } = response.data;
        setAccountInfo(response.data);

        // Update profile data
        setProfileData({
          name: customer?.owner || userData.name || user.name, // Use customer.owner as the Full Name
          email: customer?.email || userData.email || user.email, // Use customer.email
          phone: customer?.phone || "",
          address: customer
            ? `${customer.street || ""}, ${customer.city || ""}, ${
                customer.state || ""
              } ${customer.zipCode || ""}`.trim()
            : "",
          timezone: "America/Los_Angeles",
          language: "en",
          dateFormat: "MM/DD/YYYY",
          avatar: user.avatar || null,
        });

        // Update company data
        if (customer) {
          console.log("🔍 DEBUG - Customer data from API:", {
            taxId: customer.taxId,
            industry: customer.industry,
            company: customer.company,
          });

          setCompanyData({
            companyName: customer.company || "",
            businessType: customer.industry || "", // Map industry from database to businessType
            taxId: customer.taxId || "",
            website: customer.website || "",
            businessAddress: `${customer.street || ""}, ${
              customer.city || ""
            }, ${customer.state || ""} ${customer.zipCode || ""}`.trim(),
            businessPhone: customer.phone || "",
            businessEmail: customer.email || "",
            yearEstablished: customer.yearEstablished || "",
            licenseNumber: customer.licenseNumber || "",
            insuranceProvider: customer.insuranceProvider || "",
            insurancePolicy: customer.insurancePolicy || "",
            insuranceExpiration: customer.insuranceExpiration || "",
            companySize: customer.companySize || "",
          });

          console.log("✅ DEBUG - Company data set to:", {
            businessType: customer.industry || "",
            taxId: customer.taxId || "",
          });

          // Update subscription data with real usage counts
          const nextBillingDate = customer.subscriptionStartDate
            ? new Date(
                new Date(customer.subscriptionStartDate).setMonth(
                  new Date(customer.subscriptionStartDate).getMonth() + 1
                )
              )
                .toISOString()
                .split("T")[0]
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0];

          const resolvedPlanCategory =
            customer.plan?.category ||
            customer.planCategory ||
            (customer.projectLimit ? "development" : "property_management");
          setPlanCategory(resolvedPlanCategory);

          const propertyLimit =
            customer.propertyLimit ?? TRIAL_PLAN_LIMITS.properties;
          const unitsLimit =
            (customer as any).unitLimit ??
            customer.plan?.unitLimit ??
            (customer.planId ? 0 : TRIAL_PLAN_LIMITS.units);
          const managersLimit = customer.userLimit ?? TRIAL_PLAN_LIMITS.users;
          const storageLimitBytes = customer.storageLimitBytes ?? null;
          const storageUsedBytes = customer.storageUsedBytes ?? 0;
          const hasPaidPlan = Boolean(customer.planId);
          const computedStorageLimitGb =
            storageLimitBytes && storageLimitBytes > 0
              ? bytesToGigabytes(storageLimitBytes)
              : customer.storageLimit
              ? Number((customer.storageLimit / 1024).toFixed(2))
              : TRIAL_PLAN_LIMITS.storageMb / 1024;
          const storageLimit = hasPaidPlan
            ? computedStorageLimitGb
            : TRIAL_PLAN_LIMITS.storageMb / 1024;
          const storageUsed =
            storageLimitBytes && storageLimitBytes > 0
              ? bytesToGigabytes(storageUsedBytes)
              : 0;
          const billingCycle = customer.billingCycle || "monthly";
          const plan = customer.plan;
          const resolvedPlanName =
            plan?.name ||
            (customer.status === "trial" ? "Trial" : "Custom Plan");
          const resolvedPlanMonthlyPrice = plan?.monthlyPrice || 0;
          const resolvedPlanAnnualPrice = plan?.annualPrice || 0;
          const resolvedAmount = plan
            ? billingCycle === "annual"
              ? resolvedPlanAnnualPrice
              : resolvedPlanMonthlyPrice
            : 0;

          setSubscriptionData({
            plan: resolvedPlanName,
            planId: customer.planId || "",
            planCategory: resolvedPlanCategory || "property_management",
            currency: plan?.currency || "USD",
            planMonthlyPrice: resolvedPlanMonthlyPrice,
            planAnnualPrice: resolvedPlanAnnualPrice,
            status: customer.status || "active",
            billingCycle,
            nextBillingDate: nextBillingDate,
            amount: resolvedAmount,
            properties: propertyLimit,
            units: unitsLimit,
            managers: managersLimit,
            usageStats: {
              propertiesUsed:
                customer.actualPropertiesCount ?? customer.propertiesCount ?? 0,
              unitsUsed: customer.actualUnitsCount ?? customer.unitsCount ?? 0,
              managersUsed: customer.actualManagersCount ?? 0,
              storageUsed,
              storageLimit,
            },
          });

          // Show notification if data was updated (only on silent refresh)
          if (silent && accountInfo && customer) {
            const oldCustomer = accountInfo.customer;
            if (oldCustomer) {
              if (oldCustomer.company !== customer.company) {
                toast.info("Company information has been updated");
              }
              if (oldCustomer.plan?.name !== customer.plan?.name) {
                toast.success(
                  `Your plan has been updated to ${customer.plan?.name}!`
                );
              }
            }
          }
        }
      }
    } catch (error) {
      if (!silent) {
        console.error("Error fetching account data:", error);
        toast.error("Failed to load account data");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Initial data fetch and socket setup
  useEffect(() => {
    fetchAccountData();

    // Initialize Socket.io for real-time updates
    const token = localStorage.getItem("token");
    if (token) {
      initializeSocket(token);

      // Subscribe to account updates
      subscribeToAccountEvents({
        onUpdated: (data) => {
          console.log("📡 Real-time: Account updated", data);
          toast.info("Your account information was updated");
          // Update account info immediately
          setAccountInfo(data.customer);
        },
      });
    }

    // Cleanup on unmount
    return () => {
      unsubscribeFromAccountEvents();
    };
  }, []);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      fetchAccountData(true); // Silent refresh
    }, 30000); // 30 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [accountInfo]);

  // Load available subscription plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await getSubscriptionPlans();
        if (response.data) {
          setAllPlans(response.data.plans);
        }
      } catch (error) {
        console.error("Failed to load subscription plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  useEffect(() => {
    if (!allPlans.length) {
      setAvailablePlans([]);
      return;
    }

    if (planCategory) {
      setAvailablePlans(
        allPlans.filter(
          (plan) => (plan.category || "property_management") === planCategory
        )
      );
    } else {
      setAvailablePlans(allPlans);
    }
  }, [allPlans, planCategory]);

  // Refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchAccountData(true); // Silent refresh
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [accountInfo]);

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: true,
    sessionTimeout: "60",
    passwordLastChanged: "2024-02-15",
    securityQuestions: true,
    loginAlerts: true,
    ipWhitelist: false,
    // Units permissions
    managerCanViewUnits: true,
    managerCanCreateUnits: true,
    managerCanEditUnits: true,
    managerCanDeleteUnits: false,
    // Properties permissions
    managerCanViewProperties: true,
    managerCanEditProperty: false,
    // Tenants permissions
    managerCanViewTenants: true,
    managerCanCreateTenants: true,
    managerCanEditTenants: true,
    managerCanDeleteTenants: false,
    // Financial permissions
    managerCanViewFinancials: true,
  });

  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Load permissions and security settings from database on mount
  useEffect(() => {
    const loadPermissionsAndSecurity = async () => {
      try {
        setLoadingPermissions(true);
        console.log(
          "🔄 Loading permissions and security settings from database..."
        );

        // Load manager permissions
        const settingsResponse = await getSettings();
        const settings = settingsResponse.data;
        console.log("✅ Settings loaded:", settings);
        console.log("📦 Raw permissions from DB:", settings?.permissions);

        // Load security settings
        const securityResponse = await apiClient.get(
          "/api/auth/security-settings"
        );
        console.log("🔐 Security settings loaded:", securityResponse.data);

        if (settings?.permissions && typeof settings.permissions === "object") {
          console.log(
            "📝 Applying permissions to state:",
            settings.permissions
          );

          // Update security settings with loaded data
          setSecuritySettings((prev) => {
            const updated = {
              ...prev,
              // Security settings from API
              twoFactorEnabled:
                securityResponse.data?.twoFactorEnabled ??
                prev.twoFactorEnabled,
              sessionTimeout: String(
                securityResponse.data?.sessionTimeout ?? prev.sessionTimeout
              ),
              loginAlerts:
                securityResponse.data?.loginAlerts ?? prev.loginAlerts,
              passwordLastChanged:
                securityResponse.data?.passwordLastChanged ??
                prev.passwordLastChanged,
              // Manager permissions from settings API
              managerCanViewUnits:
                settings.permissions.managerCanViewUnits ??
                prev.managerCanViewUnits,
              managerCanCreateUnits:
                settings.permissions.managerCanCreateUnits ??
                prev.managerCanCreateUnits,
              managerCanEditUnits:
                settings.permissions.managerCanEditUnits ??
                prev.managerCanEditUnits,
              managerCanDeleteUnits:
                settings.permissions.managerCanDeleteUnits ??
                prev.managerCanDeleteUnits,
              managerCanViewProperties:
                settings.permissions.managerCanViewProperties ??
                prev.managerCanViewProperties,
              managerCanEditProperty:
                settings.permissions.managerCanEditProperty ??
                prev.managerCanEditProperty,
              managerCanViewTenants:
                settings.permissions.managerCanViewTenants ??
                prev.managerCanViewTenants,
              managerCanCreateTenants:
                settings.permissions.managerCanCreateTenants ??
                prev.managerCanCreateTenants,
              managerCanEditTenants:
                settings.permissions.managerCanEditTenants ??
                prev.managerCanEditTenants,
              managerCanDeleteTenants:
                settings.permissions.managerCanDeleteTenants ??
                prev.managerCanDeleteTenants,
              managerCanViewFinancials:
                settings.permissions.managerCanViewFinancials ??
                prev.managerCanViewFinancials,
            };
            console.log("✨ Updated security settings:", updated);
            return updated;
          });
        } else {
          console.log("⚠️ No permissions found in settings or invalid format");

          // Still update security settings even if no permissions
          if (securityResponse.data) {
            setSecuritySettings((prev) => ({
              ...prev,
              twoFactorEnabled:
                securityResponse.data.twoFactorEnabled ?? prev.twoFactorEnabled,
              sessionTimeout: String(
                securityResponse.data.sessionTimeout ?? prev.sessionTimeout
              ),
              loginAlerts:
                securityResponse.data.loginAlerts ?? prev.loginAlerts,
              passwordLastChanged:
                securityResponse.data.passwordLastChanged ??
                prev.passwordLastChanged,
            }));
          }
        }
      } catch (error: any) {
        console.error(
          "❌ Failed to load permissions and security settings:",
          error
        );
      } finally {
        setLoadingPermissions(false);
      }
    };

    loadPermissionsAndSecurity();
  }, []);

  // Notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: {
      propertyAlerts: true,
      maintenanceRequests: true,
      tenantIssues: true,
      financialReports: true,
      leaseExpirations: true,
      paymentReminders: true,
      managerActivity: true,
      systemUpdates: false,
      weeklyDigest: true,
      monthlyReports: true,
    },
    sms: {
      urgentMaintenance: true,
      paymentReceived: true,
      leaseExpirations: true,
      managerActivity: false,
      systemUpdates: false,
    },
    push: {
      propertyAlerts: true,
      maintenanceRequests: true,
      tenantIssues: true,
      financialReports: true,
      systemUpdates: true,
    },
  });

  // Display preferences
  const [displayPreferences, setDisplayPreferences] = useState({
    theme: "light",
    compactMode: false,
    showPropertyImages: true,
    defaultView: "cards",
    itemsPerPage: 25,
    dashboardLayout: "default",
    chartType: "line",
  });

  // Billing history (loaded from backend)
  const [billingHistory, setBillingHistory] = useState<any[]>([]);

  // Load billing history when Billing tab is active
  useEffect(() => {
    const loadBilling = async () => {
      try {
        const res = await apiClient.get<any>("/api/payments", {
          page: 1,
          pageSize: 50,
          type: "subscription",
        });
        if ((res as any).error) return;
        const items = (res as any).data?.items || [];
        const transformed = items.map((p: any, idx: number) => ({
          id: p.providerReference || p.id || `INV-${idx + 1}`,
          date: new Date(p.paidAt || p.createdAt).toISOString().split("T")[0],
          description: `${
            accountInfo?.customer?.plan?.name || "Subscription"
          } - ${accountInfo?.customer?.billingCycle || "monthly"}`,
          amount: Number(p.amount) || 0,
          status: p.status === "success" ? "paid" : p.status || "pending",
          downloadUrl: "#",
        }));
        setBillingHistory(transformed);
      } catch {}
    };
    if (activeTab === "billing") {
      loadBilling();
    }
  }, [activeTab, accountInfo]);

  // Payment methods - fetched from API
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  // Fetch payment methods from API
  const fetchPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      const { getPaymentMethods } = await import("../lib/api/payment-methods");
      const response = await getPaymentMethods();
      if (response.data?.data) {
        setPaymentMethods(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Fetch sessions from API
  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const { getSessions } = await import("../lib/api/auth");
      const response = await getSessions();
      if (response.data?.sessions) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch payment methods on mount and when billing tab is active
  useEffect(() => {
    if (activeTab === "billing") {
      fetchPaymentMethods();
    }
  }, [activeTab]);

  // Fetch sessions when sessions tab is active
  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessions();
    }
  }, [activeTab]);

  // Check for payment callback on mount and auto-switch to billing tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentCallback = urlParams.get("payment_callback");
    const tab = urlParams.get("tab");

    if (paymentCallback === "payment_method" || tab === "billing") {
      setActiveTab("billing");
    }
  }, []);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Sessions data
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Mock activity log
  const [activityLog] = useState([
    {
      id: "ACT001",
      action: "Login",
      description: "Logged in from Chrome on Windows",
      timestamp: new Date().toISOString(),
      ipAddress: "192.168.1.100",
      status: "success",
    },
    {
      id: "ACT002",
      action: "Property Added",
      description: "Added new property: Oak Street Condos",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      ipAddress: "192.168.1.100",
      status: "success",
    },
    {
      id: "ACT003",
      action: "Manager Assigned",
      description: "Assigned Sarah Johnson to Sunset Apartments",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      ipAddress: "192.168.1.100",
      status: "success",
    },
    {
      id: "ACT004",
      action: "Subscription Updated",
      description: "Upgraded to Professional plan",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      ipAddress: "192.168.1.100",
      status: "success",
    },
  ]);

  // Handler functions
  const handleSaveProfile = async () => {
    if (!accountInfo?.customer?.id) {
      toast.error("Customer information not found");
      return;
    }

    try {
      setIsSaving(true);

      // Parse address if changed
      let addressParts = { street: "", city: "", state: "", zipCode: "" };
      if (profileData.address) {
        const parts = profileData.address.split(",").map((p) => p.trim());
        addressParts.street = parts[0] || "";
        addressParts.city = parts[1] || "";
        const stateZip = parts[2]?.split(" ") || [];
        addressParts.state = stateZip[0] || "";
        addressParts.zipCode = stateZip[1] || "";
      }

      // Prepare update data based on current tab
      let updateData: any = {};

      if (activeTab === "profile") {
        updateData = {
          owner: profileData.name,
          phone: profileData.phone,
          street: addressParts.street || accountInfo.customer.street,
          city: addressParts.city || accountInfo.customer.city,
          state: addressParts.state || accountInfo.customer.state,
          zipCode: addressParts.zipCode || accountInfo.customer.zipCode,
          country: accountInfo.customer.country || "Nigeria",
        };
      } else if (activeTab === "company") {
        // Parse company address if changed
        let companyAddressParts = {
          street: "",
          city: "",
          state: "",
          zipCode: "",
        };
        if (companyData.businessAddress) {
          const parts = companyData.businessAddress
            .split(",")
            .map((p) => p.trim());
          companyAddressParts.street = parts[0] || "";
          companyAddressParts.city = parts[1] || "";
          const stateZip = parts[2]?.split(" ") || [];
          companyAddressParts.state = stateZip[0] || "";
          companyAddressParts.zipCode = stateZip[1] || "";
        }

        updateData = {
          company: companyData.companyName,
          // taxId is read-only for owners, only admins can update it
          website: companyData.website,
          industry: companyData.businessType, // Map businessType to industry for backend
          companySize: companyData.companySize,
          yearEstablished: companyData.yearEstablished,
          licenseNumber: companyData.licenseNumber,
          insuranceProvider: companyData.insuranceProvider,
          insurancePolicy: companyData.insurancePolicy,
          insuranceExpiration: companyData.insuranceExpiration,
          phone: companyData.businessPhone,
          street: companyAddressParts.street || accountInfo.customer.street,
          city: companyAddressParts.city || accountInfo.customer.city,
          state: companyAddressParts.state || accountInfo.customer.state,
          zipCode: companyAddressParts.zipCode || accountInfo.customer.zipCode,
          country: accountInfo.customer.country || "Nigeria",
        };
      }

      // Call owner self-service endpoint instead of admin-only customers route
      const response = await apiClient.put("/api/auth/account", updateData);

      if ((response as any).error) {
        throw new Error(
          (response as any).error.error || "Failed to update information"
        );
      }

      // Update was successful
      setIsEditing(false);
      setHasUnsavedChanges(false);
      toast.success(
        activeTab === "profile"
          ? "Profile updated successfully"
          : "Company information updated successfully"
      );

      // Refresh data from server
      await fetchAccountData(true);

      // Also notify parent component
      onSave(activeTab === "profile" ? profileData : companyData);
    } catch (error: any) {
      console.error("Error updating customer:", error);
      toast.error(error.message || "Failed to update information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setHasUnsavedChanges(false);
    // Restore original data from accountInfo
    if (accountInfo?.customer) {
      const customer = accountInfo.customer;
      setProfileData({
        name: accountInfo.user?.name || user.name,
        email: accountInfo.user?.email || user.email,
        phone: customer.phone || "",
        address: `${customer.street || ""}, ${customer.city || ""}, ${
          customer.state || ""
        } ${customer.zipCode || ""}`.trim(),
        timezone: "America/Los_Angeles",
        language: "en",
        dateFormat: "MM/DD/YYYY",
        avatar: user.avatar || null,
      });
      setCompanyData({
        companyName: customer.company || "",
        businessType: customer.industry || "",
        taxId: customer.taxId || "",
        website: customer.website || "",
        businessAddress: `${customer.street || ""}, ${customer.city || ""}, ${
          customer.state || ""
        } ${customer.zipCode || ""}`.trim(),
        businessPhone: customer.phone || "",
        businessEmail: customer.email || "",
        yearEstablished: customer.yearEstablished || "",
        licenseNumber: customer.licenseNumber || "",
        insuranceProvider: customer.insuranceProvider || "",
        insurancePolicy: customer.insurancePolicy || "",
        insuranceExpiration: customer.insuranceExpiration || "",
        companySize: customer.companySize || "",
      });
    }
    toast.info("Changes discarded");
  };

  const handlePasswordChange = async () => {
    // Validate inputs
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("All fields are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    try {
      setIsSaving(true);

      const { changePassword } = await import("../lib/api/auth");
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.error) {
        toast.error(response.error.error || "Failed to change password");
        return;
      }

      // Success
      setShowPasswordDialog(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully");

      // Update security settings to reflect new password change date
      setSecuritySettings((prev) => ({
        ...prev,
        passwordLastChanged: new Date().toISOString(),
      }));
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error("Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsSaving(true);
      const response = await apiClient.post("/api/auth/export-data", {});

      if (response.error) {
        toast.error(response.error.error || "Failed to request data export");
        return;
      }

      toast.success(
        "Data export started. You will receive an email when ready."
      );
    } catch (error) {
      console.error("Export data error:", error);
      toast.error("Failed to request data export");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete account state
  const [deleteAccountForm, setDeleteAccountForm] = useState({
    confirmPassword: "",
    reason: "",
    confirmText: "",
  });

  const handleDeleteAccount = async () => {
    // Validate inputs
    if (!deleteAccountForm.confirmPassword) {
      toast.error("Please enter your password to confirm");
      return;
    }

    if (deleteAccountForm.confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion");
      return;
    }

    try {
      setIsSaving(true);

      const response = await apiClient.post("/api/auth/delete-account", {
        confirmPassword: deleteAccountForm.confirmPassword,
        reason: deleteAccountForm.reason,
      });

      if (response.error) {
        toast.error(response.error.error || "Failed to delete account");
        return;
      }

      // Success - account deleted
      setShowDeleteDialog(false);
      setDeleteAccountForm({
        confirmPassword: "",
        reason: "",
        confirmText: "",
      });
      toast.success("Account deleted successfully. Logging out...");

      // Log out after 2 seconds
      setTimeout(() => {
        onLogout();
      }, 2000);
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsSaving(false);
    }
  };

  // Subscription management handlers
  const handleChangePlan = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    try {
      const response = await changePlan({ planId: selectedPlan.id });
      if (response.error) {
        toast.error(response.error.error || "Failed to change plan");
        return;
      }

      toast.success("Subscription plan updated successfully!");
      setShowChangePlanDialog(false);
      setSelectedPlan(null);
      // Refresh account data
      await fetchAccountData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to change plan");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeBillingCycle = async () => {
    setIsProcessing(true);
    try {
      const response = await changeBillingCycle({
        billingCycle: newBillingCycle,
      });
      if (response.error) {
        toast.error(response.error.error || "Failed to change billing cycle");
        return;
      }

      toast.success("Billing cycle updated successfully!");
      setShowChangeBillingDialog(false);
      // Refresh account data
      await fetchAccountData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to change billing cycle");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (cancelConfirmation !== "CANCEL_SUBSCRIPTION") {
      toast.error('Please type "CANCEL_SUBSCRIPTION" to confirm');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await cancelSubscription({
        reason: cancelReason,
        confirmation: cancelConfirmation,
      });

      if (response.error) {
        toast.error(response.error.error || "Failed to cancel subscription");
        return;
      }

      toast.success("Subscription cancelled. Logging you out...");

      // Wait 2 seconds then logout
      setTimeout(() => {
        onLogout();
      }, 2000);
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device === "Desktop") return Laptop;
    if (device === "Mobile") return Smartphone;
    return Tablet;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#111827] to-[#1F2937] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button + Title */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-sm text-white/70">
                  Manage your account, company, and preferences
                </p>
              </div>
            </div>

            {/* Right: Save/Cancel */}
            {isEditing && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading account information...</p>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <Card className="border-gray-200 shadow-md">
                <CardContent className="p-4">
                  <nav className="space-y-1">
                    <button
                      onClick={() => setActiveTab("profile")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-medium ${
                        activeTab === "profile"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                          : "hover:bg-purple-50 hover:text-[#7C3AED] text-gray-700"
                      }`}
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("company")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-medium ${
                        activeTab === "company"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                          : "hover:bg-purple-50 hover:text-[#7C3AED] text-gray-700"
                      }`}
                    >
                      <Building2 className="h-5 w-5" />
                      <span>Company</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("subscription")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-medium ${
                        activeTab === "subscription"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                          : "hover:bg-purple-50 hover:text-[#7C3AED] text-gray-700"
                      }`}
                    >
                      <Crown className="h-5 w-5" />
                      <span>Subscription</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("billing")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-medium ${
                        activeTab === "billing"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                          : "hover:bg-purple-50 hover:text-[#7C3AED] text-gray-700"
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>Billing</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("payment-gateway")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-medium ${
                        activeTab === "payment-gateway"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                          : "hover:bg-purple-50 hover:text-[#7C3AED] text-gray-700"
                      }`}
                    >
                      <DollarSign className="h-5 w-5" />
                      <span>Payment Gateway</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("security")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-medium ${
                        activeTab === "security"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                          : "hover:bg-purple-50 hover:text-[#7C3AED] text-gray-700"
                      }`}
                    >
                      <Lock className="h-5 w-5" />
                      <span>Security</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("notifications")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-medium ${
                        activeTab === "notifications"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                          : "hover:bg-purple-50 hover:text-[#7C3AED] text-gray-700"
                      }`}
                    >
                      <Bell className="h-5 w-5" />
                      <span>Notifications</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("display")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-medium ${
                        activeTab === "display"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                          : "hover:bg-purple-50 hover:text-[#7C3AED] text-gray-700"
                      }`}
                    >
                      <Monitor className="h-5 w-5" />
                      <span>Display</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("sessions")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-medium ${
                        activeTab === "sessions"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                          : "hover:bg-purple-50 hover:text-[#7C3AED] text-gray-700"
                      }`}
                    >
                      <Smartphone className="h-5 w-5" />
                      <span>Sessions</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("activity")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-medium ${
                        activeTab === "activity"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                          : "hover:bg-purple-50 hover:text-[#7C3AED] text-gray-700"
                      }`}
                    >
                      <Activity className="h-5 w-5" />
                      <span>Activity</span>
                    </button>

                    <Separator className="my-2" />

                    <button
                      onClick={() => setActiveTab("help")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors font-medium ${
                        activeTab === "help"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                          : "hover:bg-purple-50 hover:text-[#7C3AED] text-gray-700"
                      }`}
                    >
                      <HelpCircle className="h-5 w-5" />
                      <span>Help & Support</span>
                    </button>
                  </nav>
                </CardContent>
              </Card>

              {/* Plan Badge */}
              <Card className="mt-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Crown className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        {subscriptionData.plan} Plan
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        ${subscriptionData.amount}/month
                      </p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-blue-600 mt-2"
                      >
                        Upgrade Plan →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {activeTab === "profile" && (
                <ProfileSection
                  profileData={profileData}
                  setProfileData={setProfileData}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  setHasUnsavedChanges={setHasUnsavedChanges}
                  user={user}
                  onSaveClick={handleSaveProfile}
                />
              )}

              {activeTab === "company" && (
                <CompanySection
                  companyData={companyData}
                  setCompanyData={setCompanyData}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  setHasUnsavedChanges={setHasUnsavedChanges}
                  onSaveClick={handleSaveProfile}
                />
              )}

              {activeTab === "subscription" && (
                <SubscriptionManagement
                  subscriptionData={subscriptionData}
                  availablePlans={availablePlans}
                  loadingPlans={loadingPlans}
                  showChangePlanDialog={showChangePlanDialog}
                  setShowChangePlanDialog={setShowChangePlanDialog}
                  showChangeBillingDialog={showChangeBillingDialog}
                  setShowChangeBillingDialog={setShowChangeBillingDialog}
                  showCancelDialog={showCancelDialog}
                  setShowCancelDialog={setShowCancelDialog}
                  selectedPlan={selectedPlan}
                  setSelectedPlan={setSelectedPlan}
                  newBillingCycle={newBillingCycle}
                  setNewBillingCycle={setNewBillingCycle}
                  cancelReason={cancelReason}
                  setCancelReason={setCancelReason}
                  cancelConfirmation={cancelConfirmation}
                  setCancelConfirmation={setCancelConfirmation}
                  isProcessing={isProcessing}
                  onChangePlan={handleChangePlan}
                  onChangeBillingCycle={handleChangeBillingCycle}
                  onCancelSubscription={handleCancelSubscription}
                />
              )}

              {activeTab === "billing" && (
                <BillingSection
                  billingHistory={billingHistory}
                  paymentMethods={paymentMethods}
                  loadingPaymentMethods={loadingPaymentMethods}
                  onPaymentMethodsChange={fetchPaymentMethods}
                />
              )}

              {activeTab === "payment-gateway" && <PaymentGatewaySection />}

              {activeTab === "security" && (
                <SecuritySection
                  securitySettings={securitySettings}
                  setSecuritySettings={setSecuritySettings}
                  setShowPasswordDialog={setShowPasswordDialog}
                  handleExportData={handleExportData}
                  setShowDeleteDialog={setShowDeleteDialog}
                  formatDate={formatDate}
                  loadingPermissions={loadingPermissions}
                  savingPermissions={savingPermissions}
                  onSavePermissions={async () => {
                    try {
                      setSavingPermissions(true);
                      const permissions = {
                        managerCanViewUnits:
                          securitySettings.managerCanViewUnits,
                        managerCanCreateUnits:
                          securitySettings.managerCanCreateUnits,
                        managerCanEditUnits:
                          securitySettings.managerCanEditUnits,
                        managerCanDeleteUnits:
                          securitySettings.managerCanDeleteUnits,
                        managerCanViewProperties:
                          securitySettings.managerCanViewProperties,
                        managerCanEditProperty:
                          securitySettings.managerCanEditProperty,
                        managerCanViewTenants:
                          securitySettings.managerCanViewTenants,
                        managerCanCreateTenants:
                          securitySettings.managerCanCreateTenants,
                        managerCanEditTenants:
                          securitySettings.managerCanEditTenants,
                        managerCanDeleteTenants:
                          securitySettings.managerCanDeleteTenants,
                        managerCanViewFinancials:
                          securitySettings.managerCanViewFinancials,
                      };
                      console.log("💾 Saving permissions:", permissions);
                      const result = await updateManagerPermissions(
                        permissions
                      );
                      console.log("✅ Save result:", result);

                      // Reload permissions from database to ensure sync
                      console.log("🔄 Reloading permissions to verify save...");
                      const updatedResp = await getSettings();
                      const updatedSettings = updatedResp.data;
                      console.log(
                        "📦 Reloaded permissions:",
                        updatedSettings?.permissions
                      );

                      if (updatedSettings?.permissions) {
                        setSecuritySettings((prev) => ({
                          ...prev,
                          managerCanViewUnits:
                            updatedSettings.permissions.managerCanViewUnits ??
                            prev.managerCanViewUnits,
                          managerCanCreateUnits:
                            updatedSettings.permissions.managerCanCreateUnits ??
                            prev.managerCanCreateUnits,
                          managerCanEditUnits:
                            updatedSettings.permissions.managerCanEditUnits ??
                            prev.managerCanEditUnits,
                          managerCanDeleteUnits:
                            updatedSettings.permissions.managerCanDeleteUnits ??
                            prev.managerCanDeleteUnits,
                          managerCanViewProperties:
                            updatedSettings.permissions
                              .managerCanViewProperties ??
                            prev.managerCanViewProperties,
                          managerCanEditProperty:
                            updatedSettings.permissions
                              .managerCanEditProperty ??
                            prev.managerCanEditProperty,
                          managerCanViewTenants:
                            updatedSettings.permissions.managerCanViewTenants ??
                            prev.managerCanViewTenants,
                          managerCanCreateTenants:
                            updatedSettings.permissions
                              .managerCanCreateTenants ??
                            prev.managerCanCreateTenants,
                          managerCanEditTenants:
                            updatedSettings.permissions.managerCanEditTenants ??
                            prev.managerCanEditTenants,
                          managerCanDeleteTenants:
                            updatedSettings.permissions
                              .managerCanDeleteTenants ??
                            prev.managerCanDeleteTenants,
                          managerCanViewFinancials:
                            updatedSettings.permissions
                              .managerCanViewFinancials ??
                            prev.managerCanViewFinancials,
                        }));
                      }

                      toast.success("Manager permissions updated successfully");
                    } catch (error: any) {
                      console.error("❌ Save error:", error);
                      toast.error(
                        error?.message || "Failed to update manager permissions"
                      );
                    } finally {
                      setSavingPermissions(false);
                    }
                  }}
                />
              )}

              {activeTab === "notifications" && (
                <NotificationsSection
                  notificationPreferences={notificationPreferences}
                  setNotificationPreferences={setNotificationPreferences}
                />
              )}

              {activeTab === "display" && (
                <DisplaySection
                  displayPreferences={displayPreferences}
                  setDisplayPreferences={setDisplayPreferences}
                />
              )}

              {activeTab === "sessions" && (
                <SessionsSection
                  sessions={sessions}
                  getDeviceIcon={getDeviceIcon}
                  formatTime={formatTime}
                  loadingSessions={loadingSessions}
                  onRefresh={fetchSessions}
                />
              )}

              {activeTab === "activity" && (
                <ActivitySection
                  activityLog={activityLog}
                  formatTime={formatTime}
                />
              )}

              {activeTab === "help" && <HelpSection />}
            </div>
          </div>
        )}
      </main>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -m-6 mb-0 p-6 rounded-t-lg">
            <DialogTitle className="text-white text-2xl">
              Change Password
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 px-6">
            <div className="space-y-2">
              <Label
                htmlFor="current-password"
                className="text-sm font-semibold text-gray-700"
              >
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      current: !prev.current,
                    }))
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#7C3AED] hover:text-[#6D28D9]"
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="new-password"
                className="text-sm font-semibold text-gray-700"
              >
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#7C3AED] hover:text-[#6D28D9]"
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="text-sm font-semibold text-gray-700"
              >
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#7C3AED] hover:text-[#6D28D9]"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6">
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
            >
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="mb-1 font-semibold">Warning:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All your properties and units will be deleted</li>
                    <li>All managers and tenants will lose access</li>
                    <li>All financial data will be permanently removed</li>
                    <li>This action cannot be reversed</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor="delete-reason">
                Reason for leaving (optional)
              </Label>
              <Textarea
                id="delete-reason"
                placeholder="Help us improve by telling us why you're leaving..."
                value={deleteAccountForm.reason}
                onChange={(e) =>
                  setDeleteAccountForm({
                    ...deleteAccountForm,
                    reason: e.target.value,
                  })
                }
                className="mt-2"
                rows={3}
              />
            </div>

            {/* Password Confirmation */}
            <div>
              <Label htmlFor="delete-password">Confirm your password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="delete-password"
                  type="password"
                  placeholder="Enter your password"
                  value={deleteAccountForm.confirmPassword}
                  onChange={(e) =>
                    setDeleteAccountForm({
                      ...deleteAccountForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type DELETE to confirm */}
            <div>
              <Label htmlFor="delete-confirm">
                Type <span className="font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                type="text"
                placeholder="Type DELETE"
                value={deleteAccountForm.confirmText}
                onChange={(e) =>
                  setDeleteAccountForm({
                    ...deleteAccountForm,
                    confirmText: e.target.value,
                  })
                }
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteAccountForm({
                  confirmPassword: "",
                  reason: "",
                  confirmText: "",
                });
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={
                isSaving ||
                !deleteAccountForm.confirmPassword ||
                deleteAccountForm.confirmText !== "DELETE"
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              This will set your subscription status to cancelled. You will lose
              access at the end of your current period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isSaving}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isSaving}
            >
              {isSaving ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Profile Section Component
function ProfileSection({
  profileData,
  setProfileData,
  isEditing,
  setIsEditing,
  setHasUnsavedChanges,
  user,
  onSaveClick,
}: any) {
  const updateFormData = (field: string, value: any) => {
    setProfileData((prev: any) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-gray-900">
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Update your personal information and profile picture
                </CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Avatar Section */}
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24 border-2 border-purple-200">
              <AvatarImage src={profileData.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-purple-100 to-purple-200 text-[#7C3AED] text-2xl font-bold">
                {profileData.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Profile Picture
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                JPG, PNG or GIF. Max size 2MB.
              </p>
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Profile Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700"
              >
                Full Name
              </Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                disabled={!isEditing}
                className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-gray-700"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={() => {
                    /* Email is read-only for owners */
                  }}
                  disabled={true}
                  className="pl-10 border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-semibold text-gray-700"
              >
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="address"
                className="text-sm font-semibold text-gray-700"
              >
                Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="timezone"
                className="text-sm font-semibold text-gray-700"
              >
                Timezone
              </Label>
              <Select
                value={profileData.timezone}
                onValueChange={(value) => updateFormData("timezone", value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time (PT)
                  </SelectItem>
                  <SelectItem value="America/Denver">
                    Mountain Time (MT)
                  </SelectItem>
                  <SelectItem value="America/Chicago">
                    Central Time (CT)
                  </SelectItem>
                  <SelectItem value="America/New_York">
                    Eastern Time (ET)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="language"
                className="text-sm font-semibold text-gray-700"
              >
                Language
              </Label>
              <Select
                value={profileData.language}
                onValueChange={(value) => updateFormData("language", value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Account Info */}
          <Separator />
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              Account Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl">
                <div className="w-10 h-10 bg-[#7C3AED] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Role</p>
                  <p className="text-sm font-bold text-gray-900">
                    Property Owner
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl">
                <div className="w-10 h-10 bg-[#7C3AED] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    Member Since
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    January 2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Inline actions for this section */}
      {isEditing && (
        <div className="flex justify-end">
          <Button
            onClick={onSaveClick}
            className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}

// Company Section Component
function CompanySection({
  companyData,
  setCompanyData,
  isEditing,
  setIsEditing,
  setHasUnsavedChanges,
  onSaveClick,
}: any) {
  const updateFormData = (field: string, value: any) => {
    setCompanyData((prev: any) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-gray-900">
                  Company Information
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your business details and documentation
                </CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
              >
                Edit Company
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Basic Company Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="companyName"
                className="text-sm font-semibold text-gray-700"
              >
                Company Name
              </Label>
              <Input
                id="companyName"
                value={companyData.companyName}
                onChange={(e) => updateFormData("companyName", e.target.value)}
                disabled={!isEditing}
                className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="businessType"
                className="text-sm font-semibold text-gray-700"
              >
                Business Type
              </Label>
              <Select
                value={companyData.businessType}
                onValueChange={(value) => updateFormData("businessType", value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LLC">LLC</SelectItem>
                  <SelectItem value="Corporation">Corporation</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Sole Proprietorship">
                    Sole Proprietorship
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="taxId"
                className="text-sm font-semibold text-gray-700"
              >
                Tax ID (EIN)
              </Label>
              <Input
                id="taxId"
                value={companyData.taxId}
                disabled={true}
                className="bg-gray-50 cursor-not-allowed border-gray-300"
                readOnly
              />
              <p className="text-xs text-gray-500">
                Tax ID can only be updated by an administrator
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="yearEstablished"
                className="text-sm font-semibold text-gray-700"
              >
                Year Established
              </Label>
              <Input
                id="yearEstablished"
                value={companyData.yearEstablished}
                onChange={(e) =>
                  updateFormData("yearEstablished", e.target.value)
                }
                disabled={!isEditing}
                className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="website"
                className="text-sm font-semibold text-gray-700"
              >
                Website
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                <Input
                  id="website"
                  value={companyData.website}
                  onChange={(e) => updateFormData("website", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="licenseNumber"
                className="text-sm font-semibold text-gray-700"
              >
                License Number
              </Label>
              <Input
                id="licenseNumber"
                value={companyData.licenseNumber}
                onChange={(e) =>
                  updateFormData("licenseNumber", e.target.value)
                }
                disabled={!isEditing}
                className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              Business Contact
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="businessPhone"
                  className="text-sm font-semibold text-gray-700"
                >
                  Business Phone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                  <Input
                    id="businessPhone"
                    value={companyData.businessPhone}
                    onChange={(e) =>
                      updateFormData("businessPhone", e.target.value)
                    }
                    disabled={!isEditing}
                    className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="businessEmail"
                  className="text-sm font-semibold text-gray-700"
                >
                  Business Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                  <Input
                    id="businessEmail"
                    value={companyData.businessEmail}
                    onChange={() => {
                      /* Business email is read-only for owners */
                    }}
                    disabled={true}
                    className="pl-10 border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="businessAddress"
                  className="text-sm font-semibold text-gray-700"
                >
                  Business Address
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                  <Input
                    id="businessAddress"
                    value={companyData.businessAddress}
                    onChange={(e) =>
                      updateFormData("businessAddress", e.target.value)
                    }
                    disabled={!isEditing}
                    className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Insurance Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              Insurance Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="insuranceProvider"
                  className="text-sm font-semibold text-gray-700"
                >
                  Insurance Provider
                </Label>
                <Input
                  id="insuranceProvider"
                  value={companyData.insuranceProvider}
                  onChange={(e) =>
                    updateFormData("insuranceProvider", e.target.value)
                  }
                  disabled={!isEditing}
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="insurancePolicy"
                  className="text-sm font-semibold text-gray-700"
                >
                  Policy Number
                </Label>
                <Input
                  id="insurancePolicy"
                  value={companyData.insurancePolicy}
                  onChange={(e) =>
                    updateFormData("insurancePolicy", e.target.value)
                  }
                  disabled={!isEditing}
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="insuranceExpiration"
                  className="text-sm font-semibold text-gray-700"
                >
                  Expiration Date
                </Label>
                <Input
                  id="insuranceExpiration"
                  type="date"
                  value={companyData.insuranceExpiration}
                  onChange={(e) =>
                    updateFormData("insuranceExpiration", e.target.value)
                  }
                  disabled={!isEditing}
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Inline actions for this section */}
      {isEditing && (
        <div className="flex justify-end">
          <Button
            onClick={onSaveClick}
            className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}

// Subscription Section Component
function SubscriptionSection({ subscriptionData, onCancelClick }: any) {
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {subscriptionData.plan} Plan
                </h3>
                <Badge
                  className={
                    subscriptionData.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }
                >
                  {subscriptionData.status === "cancelled"
                    ? "Cancelled"
                    : "Active"}
                </Badge>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                ${subscriptionData.amount}/month • Billed{" "}
                {subscriptionData.billingCycle}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Next billing date: {subscriptionData.nextBillingDate}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button>Upgrade Plan</Button>
              <Button variant="outline">Change Billing</Button>
              {subscriptionData.status !== "cancelled" && (
                <Button variant="destructive" onClick={onCancelClick}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Usage Stats */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Usage & Limits</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Properties</span>
                  <span className="text-gray-900">
                    {subscriptionData.usageStats.propertiesUsed} /{" "}
                    {subscriptionData.properties}
                  </span>
                </div>
                <Progress
                  value={
                    (subscriptionData.usageStats.propertiesUsed /
                      subscriptionData.properties) *
                    100
                  }
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Units</span>
                  <span className="text-gray-900">
                    {subscriptionData.usageStats.unitsUsed} /{" "}
                    {subscriptionData.units}
                  </span>
                </div>
                <Progress
                  value={
                    (subscriptionData.usageStats.unitsUsed /
                      subscriptionData.units) *
                    100
                  }
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Property Managers</span>
                  <span className="text-gray-900">
                    {subscriptionData.usageStats.managersUsed} /{" "}
                    {subscriptionData.managers}
                  </span>
                </div>
                <Progress
                  value={
                    (subscriptionData.usageStats.managersUsed /
                      subscriptionData.managers) *
                    100
                  }
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Storage</span>
                  <span className="text-gray-900">
                    {subscriptionData.usageStats.storageUsed} GB /{" "}
                    {subscriptionData.usageStats.storageLimit} GB
                  </span>
                </div>
                <Progress
                  value={
                    (subscriptionData.usageStats.storageUsed /
                      subscriptionData.usageStats.storageLimit) *
                    100
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Compare plans and features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Starter Plan */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Starter</h4>
              <p className="text-gray-600 text-sm mb-4">
                For small property owners
              </p>
              <p className="text-gray-900 text-2xl font-bold mb-4">
                $299
                <span className="text-sm font-normal text-gray-600">/mo</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Up to 3 properties
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  75 units
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />2 managers
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled>
                Downgrade
              </Button>
            </div>

            {/* Professional Plan */}
            <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50 relative">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600">
                Current
              </Badge>
              <h4 className="font-semibold mb-2">Professional</h4>
              <p className="text-gray-600 text-sm mb-4">
                For growing portfolios
              </p>
              <p className="text-gray-900 text-2xl font-bold mb-4">
                $750
                <span className="text-sm font-normal text-gray-600">/mo</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  Up to 12 properties
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  240 units
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />5 managers
                </li>
              </ul>
              <Button className="w-full" disabled>
                Current Plan
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Enterprise</h4>
              <p className="text-gray-600 text-sm mb-4">For large portfolios</p>
              <p className="text-gray-900 text-2xl font-bold mb-4">
                $2,500
                <span className="text-sm font-normal text-gray-600">/mo</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Unlimited properties
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Unlimited units
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Unlimited managers
                </li>
              </ul>
              <Button className="w-full">Upgrade</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Billing Section Component
function BillingSection({
  billingHistory,
  paymentMethods,
  loadingPaymentMethods,
  onPaymentMethodsChange,
}: any) {
  const [isAddingMethod, setIsAddingMethod] = React.useState(false);
  const [isRemovingMethod, setIsRemovingMethod] = React.useState<string | null>(
    null
  );
  const [isSettingDefault, setIsSettingDefault] = React.useState<string | null>(
    null
  );
  const [isVerifyingCallback, setIsVerifyingCallback] = React.useState(false);
  const callbackProcessedRef = React.useRef(false);

  // Check for payment callback on mount
  React.useEffect(() => {
    // Prevent double processing
    if (callbackProcessedRef.current) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get("reference") || urlParams.get("trxref");
    const paymentCallback = urlParams.get("payment_callback");

    if (reference && paymentCallback === "payment_method") {
      callbackProcessedRef.current = true;
      handlePaymentCallback(reference);
    }
  }, []);

  const handlePaymentCallback = async (reference: string) => {
    try {
      setIsVerifyingCallback(true);
      toast.info("Verifying card authorization...");

      // Import dynamically to avoid circular dependencies
      const { addPaymentMethod } = await import("../lib/api/payment-methods");
      const response = await addPaymentMethod(reference, true);

      if (response.error) {
        toast.error(response.error.error || "Failed to add payment method");
      } else {
        toast.success("Payment method added successfully!");
        // Refresh payment methods list
        await onPaymentMethodsChange?.();
      }

      // Clean up URL but keep on billing tab
      const url = new URL(window.location.href);
      url.searchParams.delete("reference");
      url.searchParams.delete("payment_callback");
      url.searchParams.delete("trxref");
      // Keep tab=billing so the page stays on billing
      window.history.replaceState({}, "", url.toString());

      // Clean up session storage
      sessionStorage.removeItem("payment_method_reference");
    } catch (error: any) {
      console.error("Payment callback error:", error);
      toast.error("Failed to verify payment method");

      // Clean up URL even on error
      const url = new URL(window.location.href);
      url.searchParams.delete("reference");
      url.searchParams.delete("payment_callback");
      url.searchParams.delete("trxref");
      window.history.replaceState({}, "", url.toString());
    } finally {
      setIsVerifyingCallback(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setIsAddingMethod(true);
      toast.info("Initializing card authorization...");

      const { initializeCardAuthorization } = await import(
        "../lib/api/payment-methods"
      );
      const response = await initializeCardAuthorization();

      if (response.error) {
        toast.error(
          response.error.error || "Failed to initialize card authorization"
        );
        return;
      }

      if (response.data?.data?.authorizationUrl) {
        // Store reference for verification
        sessionStorage.setItem(
          "payment_method_reference",
          response.data.data.reference
        );

        toast.info("Redirecting to payment gateway...");

        // Redirect to Paystack
        setTimeout(() => {
          window.location.href = response.data.data.authorizationUrl;
        }, 1000);
      } else {
        toast.error("No authorization URL received");
      }
    } catch (error: any) {
      console.error("Add payment method error:", error);
      toast.error(error.message || "Failed to add payment method");
    } finally {
      setIsAddingMethod(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      setIsSettingDefault(methodId);

      const { setDefaultPaymentMethod } = await import(
        "../lib/api/payment-methods"
      );
      const response = await setDefaultPaymentMethod(methodId);

      if (response.error) {
        toast.error(
          response.error.error || "Failed to set default payment method"
        );
      } else {
        toast.success("Default payment method updated");
        onPaymentMethodsChange?.();
      }
    } catch (error: any) {
      console.error("Set default error:", error);
      toast.error("Failed to set default payment method");
    } finally {
      setIsSettingDefault(null);
    }
  };

  const handleRemoveMethod = async (methodId: string) => {
    if (
      !window.confirm("Are you sure you want to remove this payment method?")
    ) {
      return;
    }

    try {
      setIsRemovingMethod(methodId);

      const { removePaymentMethod } = await import(
        "../lib/api/payment-methods"
      );
      const response = await removePaymentMethod(methodId);

      if (response.error) {
        toast.error(response.error.error || "Failed to remove payment method");
      } else {
        toast.success("Payment method removed");
        onPaymentMethodsChange?.();
      }
    } catch (error: any) {
      console.error("Remove payment method error:", error);
      toast.error("Failed to remove payment method");
    } finally {
      setIsRemovingMethod(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Payment Methods</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your payment methods
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleAddPaymentMethod}
              disabled={isAddingMethod}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
            >
              {isAddingMethod ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Method
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isVerifyingCallback ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-[#7C3AED] mx-auto mb-3 animate-spin" />
              <p className="text-sm text-gray-700 font-semibold">
                Verifying payment method...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Please wait while we confirm your card
              </p>
            </div>
          ) : loadingPaymentMethods ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-[#7C3AED] mx-auto mb-3 animate-spin" />
              <p className="text-sm text-gray-600 font-medium">
                Loading payment methods...
              </p>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-8 w-8 text-[#7C3AED]" />
              </div>
              <p className="text-sm text-gray-700 font-semibold">
                No payment methods added yet
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Add a payment method to enable automatic billing
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method: any) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-[#7C3AED]" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {method.cardBrand || method.brand || "Card"} ••••{" "}
                        {method.cardLast4 || method.last4}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires {method.cardExpMonth || method.exp_month}/
                        {method.cardExpYear || method.exp_year}
                      </p>
                    </div>
                    {method.isDefault && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 font-semibold"
                      >
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        disabled={isSettingDefault === method.id}
                        className="hover:bg-purple-50 hover:text-[#7C3AED]"
                      >
                        {isSettingDefault === method.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Set Default"
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveMethod(method.id)}
                      disabled={isRemovingMethod === method.id}
                    >
                      {isRemovingMethod === method.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Remove"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Receipt className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Billing History</CardTitle>
                <CardDescription className="text-gray-600">
                  View and download your invoices
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto rounded-xl border-0 shadow-md">
            <Table>
              <TableHeader className="bg-[#111827]">
                <TableRow>
                  <TableHead className="text-white font-semibold">
                    Invoice
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Date
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Description
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Amount
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((invoice: any, index: number) => (
                  <TableRow
                    key={invoice.id}
                    className={
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50/50 hover:bg-[#7C3AED]/5"
                    }
                  >
                    <TableCell className="font-bold text-gray-900">
                      {invoice.id}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {invoice.date}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {invoice.description}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      ${invoice.amount}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 font-semibold"
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-purple-50 hover:text-[#7C3AED]"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Security Section Component
function SecuritySection({
  securitySettings,
  setSecuritySettings,
  setShowPasswordDialog,
  handleExportData,
  setShowDeleteDialog,
  formatDate,
  loadingPermissions,
  savingPermissions,
  onSavePermissions,
}: any) {
  const [updatingSecuritySetting, setUpdatingSecuritySetting] =
    React.useState(false);
  const [initializingTwoFactor, setInitializingTwoFactor] =
    React.useState(false);
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = React.useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = React.useState<{
    secret: string;
    otpauthUrl: string;
    qrCode: string;
  }>({
    secret: "",
    otpauthUrl: "",
    qrCode: "",
  });
  const [twoFactorCodeInput, setTwoFactorCodeInput] = React.useState("");
  const [twoFactorDialogLoading, setTwoFactorDialogLoading] =
    React.useState(false);
  const [twoFactorDisableDialogOpen, setTwoFactorDisableDialogOpen] =
    React.useState(false);
  const [twoFactorDisablePassword, setTwoFactorDisablePassword] =
    React.useState("");
  const [disableTwoFactorLoading, setDisableTwoFactorLoading] =
    React.useState(false);

  const handleSecuritySettingChange = async (
    setting: "loginAlerts" | "sessionTimeout",
    value: any
  ) => {
    try {
      setUpdatingSecuritySetting(true);
      const payload: any = {};

      if (setting === "loginAlerts") {
        payload.loginAlerts = value;
      } else if (setting === "sessionTimeout") {
        payload.sessionTimeout = value === "1440" ? 1440 : parseInt(value, 10);
      }

      const response = await apiClient.put(
        "/api/auth/security-settings",
        payload
      );
      if ((response as any).error) {
        throw new Error(
          (response as any).error?.error || "Failed to update security setting"
        );
      }

      setSecuritySettings((prev: any) => ({
        ...prev,
        loginAlerts: setting === "loginAlerts" ? value : prev.loginAlerts,
        sessionTimeout:
          setting === "sessionTimeout" ? value : prev.sessionTimeout,
      }));

      toast.success("Security setting updated");
    } catch (error: any) {
      console.error("Security setting update error:", error);
      toast.error(error?.message || "Failed to update security setting");
    } finally {
      setUpdatingSecuritySetting(false);
    }
  };

  const startTwoFactorSetup = async () => {
    try {
      setInitializingTwoFactor(true);
      const response = await initializeTwoFactor();

      if (response.error) {
        toast.error(
          response.error.error ||
            "Failed to initialize two-factor authentication"
        );
        return;
      }

      const secret = response.data?.secret;
      const otpauthUrl = response.data?.otpauthUrl;
      if (!secret || !otpauthUrl) {
        toast.error("Invalid response from server");
        return;
      }

      const qrCode = await QRCode.toDataURL(otpauthUrl);
      setTwoFactorSetup({ secret, otpauthUrl, qrCode });
      setTwoFactorCodeInput("");
      setTwoFactorDialogOpen(true);
    } catch (error: any) {
      console.error("Initialize 2FA error:", error);
      toast.error(
        error?.message || "Failed to initialize two-factor authentication"
      );
    } finally {
      setInitializingTwoFactor(false);
    }
  };

  const confirmTwoFactorSetup = async () => {
    if (!twoFactorCodeInput) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }

    try {
      setTwoFactorDialogLoading(true);
      const response = await verifyTwoFactorSetup(twoFactorCodeInput);

      if (response.error) {
        toast.error(response.error.error || "Failed to verify code");
        return;
      }

      setSecuritySettings((prev: any) => ({
        ...prev,
        twoFactorEnabled: true,
      }));

      toast.success("Two-factor authentication enabled");
      setTwoFactorDialogOpen(false);
      setTwoFactorCodeInput("");
    } catch (error: any) {
      console.error("Verify 2FA error:", error);
      toast.error(error?.message || "Failed to verify code");
    } finally {
      setTwoFactorDialogLoading(false);
    }
  };

  const copyTwoFactorSecret = async () => {
    if (!twoFactorSetup.secret) return;
    try {
      await navigator.clipboard.writeText(twoFactorSetup.secret);
      toast.success("Secret copied to clipboard");
    } catch {
      toast.error("Failed to copy secret");
    }
  };

  const confirmDisableTwoFactor = async () => {
    if (!twoFactorDisablePassword) {
      toast.error(
        "Please enter your password to disable two-factor authentication"
      );
      return;
    }

    try {
      setDisableTwoFactorLoading(true);
      const response = await disableTwoFactor(twoFactorDisablePassword);

      if (response.error) {
        toast.error(
          response.error.error || "Failed to disable two-factor authentication"
        );
        return;
      }

      setSecuritySettings((prev: any) => ({
        ...prev,
        twoFactorEnabled: false,
      }));

      toast.success("Two-factor authentication disabled");
      setTwoFactorDisablePassword("");
      setTwoFactorDisableDialogOpen(false);
    } catch (error: any) {
      console.error("Disable 2FA error:", error);
      toast.error(
        error?.message || "Failed to disable two-factor authentication"
      );
    } finally {
      setDisableTwoFactorLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-gray-900">
                  Security Settings
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your password and security preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Password */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900">Password</h4>
                <p className="text-sm text-gray-600">
                  {securitySettings.passwordLastChanged
                    ? `Last changed on ${formatDate(
                        securitySettings.passwordLastChanged
                      )}`
                    : "Never changed"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(true)}
                className="border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]"
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>

            <Separator />

            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-gray-600">
                  Add an extra layer of security to your account
                </p>
                {securitySettings.twoFactorEnabled && (
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <p className="text-xs text-green-600 font-semibold">
                      Enabled
                    </p>
                  </div>
                )}
              </div>
              <Switch
                checked={securitySettings.twoFactorEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    startTwoFactorSetup();
                  } else {
                    setTwoFactorDisableDialogOpen(true);
                  }
                }}
                disabled={
                  initializingTwoFactor ||
                  twoFactorDialogLoading ||
                  disableTwoFactorLoading
                }
                className="data-[state=checked]:bg-[#7C3AED]"
              />
            </div>

            <Separator />

            {/* Login Alerts */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">Login Alerts</h4>
                <p className="text-sm text-gray-600">
                  Get notified about new login attempts
                </p>
              </div>
              <Switch
                checked={securitySettings.loginAlerts}
                onCheckedChange={(checked) =>
                  handleSecuritySettingChange("loginAlerts", checked)
                }
                disabled={updatingSecuritySetting}
                className="data-[state=checked]:bg-[#7C3AED]"
              />
            </div>

            <Separator />

            {/* Session Timeout */}
            <div>
              <Label className="text-sm font-semibold text-gray-700">
                Session Timeout
              </Label>
              <Select
                value={securitySettings.sessionTimeout}
                onValueChange={(value) =>
                  handleSecuritySettingChange("sessionTimeout", value)
                }
                disabled={updatingSecuritySetting}
              >
                <SelectTrigger className="mt-2 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="1440">Never (24 hours)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Your session will expire after this period of inactivity
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Manager Permissions */}
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-gray-900">
                  Manager Permissions
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Control default permissions for property managers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Units Permissions */}
            <div className="border-2 border-gray-200 rounded-xl p-5 space-y-4 bg-gradient-to-br from-gray-50 to-white">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">
                  Units Management
                </h4>
                <p className="text-sm text-gray-600">
                  Control what managers can do with units
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unit-view"
                    checked={securitySettings.managerCanViewUnits}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        managerCanViewUnits: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="unit-view" className="text-sm cursor-pointer">
                    View Units
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unit-create"
                    checked={securitySettings.managerCanCreateUnits}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        managerCanCreateUnits: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="unit-create"
                    className="text-sm cursor-pointer"
                  >
                    Create Units
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unit-edit"
                    checked={securitySettings.managerCanEditUnits}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        managerCanEditUnits: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="unit-edit" className="text-sm cursor-pointer">
                    Edit Units
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unit-delete"
                    checked={securitySettings.managerCanDeleteUnits}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        managerCanDeleteUnits: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="unit-delete"
                    className="text-sm cursor-pointer"
                  >
                    Delete Units
                  </Label>
                </div>
              </div>
            </div>

            {/* Properties Permissions */}
            <div className="border-2 border-gray-200 rounded-xl p-5 space-y-4 bg-gradient-to-br from-gray-50 to-white">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">
                  Properties Management
                </h4>
                <p className="text-sm text-gray-600">
                  Control what managers can do with properties
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="property-view"
                    checked={securitySettings.managerCanViewProperties}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        managerCanViewProperties: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="property-view"
                    className="text-sm cursor-pointer"
                  >
                    View Properties
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="property-edit"
                    checked={securitySettings.managerCanEditProperty}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        managerCanEditProperty: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="property-edit"
                    className="text-sm cursor-pointer"
                  >
                    Edit Properties
                  </Label>
                </div>
              </div>
            </div>

            {/* Tenants Permissions */}
            <div className="border-2 border-gray-200 rounded-xl p-5 space-y-4 bg-gradient-to-br from-gray-50 to-white">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">
                  Tenants Management
                </h4>
                <p className="text-sm text-gray-600">
                  Control what managers can do with tenants
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tenant-view"
                    checked={securitySettings.managerCanViewTenants}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        managerCanViewTenants: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="tenant-view"
                    className="text-sm cursor-pointer"
                  >
                    View Tenants
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tenant-create"
                    checked={securitySettings.managerCanCreateTenants}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        managerCanCreateTenants: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="tenant-create"
                    className="text-sm cursor-pointer"
                  >
                    Add Tenants
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tenant-edit"
                    checked={securitySettings.managerCanEditTenants}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        managerCanEditTenants: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="tenant-edit"
                    className="text-sm cursor-pointer"
                  >
                    Edit Tenants
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tenant-delete"
                    checked={securitySettings.managerCanDeleteTenants}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        managerCanDeleteTenants: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="tenant-delete"
                    className="text-sm cursor-pointer"
                  >
                    Remove Tenants
                  </Label>
                </div>
              </div>
            </div>

            {/* Financial Permissions */}
            <div className="border-2 border-gray-200 rounded-xl p-5 space-y-4 bg-gradient-to-br from-gray-50 to-white">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">
                  Financial Access
                </h4>
                <p className="text-sm text-gray-600">
                  Control financial data visibility
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="financial-view"
                    checked={securitySettings.managerCanViewFinancials}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        managerCanViewFinancials: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="financial-view"
                    className="text-sm cursor-pointer"
                  >
                    View Reports
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Save Button */}
            <div className="flex items-center justify-between gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 rounded-xl flex-1 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#7C3AED] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm text-gray-900">
                    <strong>Note:</strong> These are default permissions. You
                    can override them for individual managers in the Property
                    Manager Management page.
                  </p>
                </div>
              </div>
              <Button
                onClick={onSavePermissions}
                disabled={savingPermissions || loadingPermissions}
                className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingPermissions ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Lock className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Data & Privacy</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your data and privacy settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Download className="h-5 w-5 text-[#7C3AED]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Export Your Data</h4>
                  <p className="text-sm text-gray-600">
                    Download a copy of your data
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleExportData}
                className="border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]"
              >
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border-2 border-red-300 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-red-900">Delete Account</h4>
                  <p className="text-sm text-red-700">
                    Permanently delete your account and data
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md"
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-Factor Setup Dialog */}
      <Dialog
        open={twoFactorDialogOpen}
        onOpenChange={(open) => {
          setTwoFactorDialogOpen(open);
          if (!open) {
            setTwoFactorCodeInput("");
          }
        }}
      >
        <DialogContent className="max-w-md border-0 shadow-2xl p-0">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <DialogTitle className="text-white text-xl">
              Enable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Scan the QR code below with Google Authenticator, Authy, or any
              compatible app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            {twoFactorSetup.qrCode && (
              <div className="flex flex-col items-center space-y-2">
                <div className="p-4 bg-white border-2 border-purple-200 rounded-xl shadow-sm">
                  <img
                    src={twoFactorSetup.qrCode}
                    alt="Two-factor QR code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center font-medium">
                  After scanning, enter the 6-digit code generated by your
                  authenticator app.
                </p>
              </div>
            )}

            {twoFactorSetup.secret && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 rounded-xl p-4 text-sm">
                <p className="text-gray-700 font-semibold mb-2">
                  Can't scan the QR code? Enter this key manually:
                </p>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <code className="font-mono text-base text-[#7C3AED] break-all font-bold">
                    {twoFactorSetup.secret}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyTwoFactorSecret}
                    className="hover:bg-purple-100 hover:text-[#7C3AED]"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label
                htmlFor="twoFactorCodeInput"
                className="text-sm font-semibold text-gray-700"
              >
                Authenticator Code
              </Label>
              <Input
                id="twoFactorCodeInput"
                placeholder="123456"
                maxLength={6}
                inputMode="numeric"
                value={twoFactorCodeInput}
                onChange={(e) => setTwoFactorCodeInput(e.target.value)}
                className="mt-2 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] text-center text-lg tracking-widest font-mono"
              />
            </div>
          </div>

          <DialogFooter className="p-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setTwoFactorDialogOpen(false);
                setTwoFactorCodeInput("");
              }}
              disabled={twoFactorDialogLoading}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmTwoFactorSetup}
              disabled={twoFactorDialogLoading}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
            >
              {twoFactorDialogLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Enable 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Two-Factor Dialog */}
      <Dialog
        open={twoFactorDisableDialogOpen}
        onOpenChange={(open) => {
          setTwoFactorDisableDialogOpen(open);
          if (!open) {
            setTwoFactorDisablePassword("");
          }
        }}
      >
        <DialogContent className="max-w-md border-0 shadow-2xl p-0">
          <DialogHeader className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-lg">
            <DialogTitle className="text-white text-xl">
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-red-100">
              Enter your password to disable two-factor authentication. You can
              re-enable it at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-300 rounded-xl text-sm text-red-800 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <p className="font-semibold">
                  Disabling two-factor authentication will make your account
                  less secure.
                </p>
              </div>
            </div>

            <div>
              <Label
                htmlFor="disableTwoFactorPassword"
                className="text-sm font-semibold text-gray-700"
              >
                Password
              </Label>
              <Input
                id="disableTwoFactorPassword"
                type="password"
                placeholder="Enter your password"
                value={twoFactorDisablePassword}
                onChange={(e) => setTwoFactorDisablePassword(e.target.value)}
                className="mt-2 border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>

          <DialogFooter className="p-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setTwoFactorDisableDialogOpen(false);
                setTwoFactorDisablePassword("");
              }}
              disabled={disableTwoFactorLoading}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDisableTwoFactor}
              disabled={disableTwoFactorLoading}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md"
            >
              {disableTwoFactorLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Notifications Section Component
function NotificationsSection({
  notificationPreferences,
  setNotificationPreferences,
}: any) {
  const updatePreference = (
    channel: string,
    setting: string,
    value: boolean
  ) => {
    setNotificationPreferences({
      ...notificationPreferences,
      [channel]: {
        ...notificationPreferences[channel],
        [setting]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">
                Email Notifications
              </CardTitle>
              <CardDescription className="text-gray-600">
                Choose what email updates you want to receive
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {Object.entries(notificationPreferences.email).map(
            ([key, value]: [string, any]) => (
              <div key={key} className="flex items-center justify-between">
                <Label
                  htmlFor={`email-${key}`}
                  className="cursor-pointer font-semibold text-gray-900"
                >
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </Label>
                <Switch
                  id={`email-${key}`}
                  checked={value}
                  onCheckedChange={(checked) =>
                    updatePreference("email", key, checked)
                  }
                  className="data-[state=checked]:bg-[#7C3AED]"
                />
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Phone className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">SMS Notifications</CardTitle>
              <CardDescription className="text-gray-600">
                Receive important alerts via text message
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {Object.entries(notificationPreferences.sms).map(
            ([key, value]: [string, any]) => (
              <div key={key} className="flex items-center justify-between">
                <Label
                  htmlFor={`sms-${key}`}
                  className="cursor-pointer font-semibold text-gray-900"
                >
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </Label>
                <Switch
                  id={`sms-${key}`}
                  checked={value}
                  onCheckedChange={(checked) =>
                    updatePreference("sms", key, checked)
                  }
                  className="data-[state=checked]:bg-[#7C3AED]"
                />
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">
                Push Notifications
              </CardTitle>
              <CardDescription className="text-gray-600">
                Real-time notifications in your browser
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {Object.entries(notificationPreferences.push).map(
            ([key, value]: [string, any]) => (
              <div key={key} className="flex items-center justify-between">
                <Label
                  htmlFor={`push-${key}`}
                  className="cursor-pointer font-semibold text-gray-900"
                >
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </Label>
                <Switch
                  id={`push-${key}`}
                  checked={value}
                  onCheckedChange={(checked) =>
                    updatePreference("push", key, checked)
                  }
                  className="data-[state=checked]:bg-[#7C3AED]"
                />
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Display Section Component
function DisplaySection({ displayPreferences, setDisplayPreferences }: any) {
  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Monitor className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">
                Display Preferences
              </CardTitle>
              <CardDescription className="text-gray-600">
                Customize how you view and interact with the platform
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Theme</Label>
            <Select
              value={displayPreferences.theme}
              onValueChange={(value) =>
                setDisplayPreferences({ ...displayPreferences, theme: value })
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto (System)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Default Property View
            </Label>
            <Select
              value={displayPreferences.defaultView}
              onValueChange={(value) =>
                setDisplayPreferences({
                  ...displayPreferences,
                  defaultView: value,
                })
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cards">Cards</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Items Per Page
            </Label>
            <Select
              value={displayPreferences.itemsPerPage.toString()}
              onValueChange={(value) =>
                setDisplayPreferences({
                  ...displayPreferences,
                  itemsPerPage: parseInt(value),
                })
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">Compact Mode</h4>
              <p className="text-sm text-gray-600">
                Show more content in less space
              </p>
            </div>
            <Switch
              checked={displayPreferences.compactMode}
              onCheckedChange={(checked) =>
                setDisplayPreferences({
                  ...displayPreferences,
                  compactMode: checked,
                })
              }
              className="data-[state=checked]:bg-[#7C3AED]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">
                Show Property Images
              </h4>
              <p className="text-sm text-gray-600">
                Display property images in listings
              </p>
            </div>
            <Switch
              checked={displayPreferences.showPropertyImages}
              onCheckedChange={(checked) =>
                setDisplayPreferences({
                  ...displayPreferences,
                  showPropertyImages: checked,
                })
              }
              className="data-[state=checked]:bg-[#7C3AED]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sessions Section Component
function SessionsSection({
  sessions,
  getDeviceIcon,
  formatTime,
  loadingSessions,
  onRefresh,
}: any) {
  const [revokingSession, setRevokingSession] = React.useState<string | null>(
    null
  );
  const [revokingAll, setRevokingAll] = React.useState(false);

  const handleRevokeSession = async (sessionId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to revoke this session? The device will be logged out."
      )
    ) {
      return;
    }

    try {
      setRevokingSession(sessionId);
      const { revokeSession } = await import("../lib/api/auth");
      const response = await revokeSession(sessionId);

      if (response.error) {
        toast.error(response.error.error || "Failed to revoke session");
      } else {
        toast.success("Session revoked successfully");
        onRefresh?.();
      }
    } catch (error: any) {
      console.error("Revoke session error:", error);
      toast.error("Failed to revoke session");
    } finally {
      setRevokingSession(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (
      !window.confirm(
        "Are you sure you want to revoke all other sessions? All other devices will be logged out."
      )
    ) {
      return;
    }

    try {
      setRevokingAll(true);
      const { revokeAllSessions } = await import("../lib/api/auth");
      const response = await revokeAllSessions();

      if (response.error) {
        toast.error(response.error.error || "Failed to revoke sessions");
      } else {
        toast.success("All other sessions revoked successfully");
        onRefresh?.();
      }
    } catch (error: any) {
      console.error("Revoke all sessions error:", error);
      toast.error("Failed to revoke sessions");
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Monitor className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Active Sessions</CardTitle>
              <CardDescription className="text-gray-600">
                Manage your active sessions and devices
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingSessions ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-[#7C3AED] mx-auto mb-3 animate-spin" />
              <p className="text-sm text-gray-600 font-medium">
                Loading sessions...
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <Monitor className="h-8 w-8 text-[#7C3AED]" />
              </div>
              <p className="text-sm text-gray-600 font-medium">
                No active sessions found
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {sessions.map((session: any) => {
                  const DeviceIcon = getDeviceIcon(session.device);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg flex items-center justify-center">
                          <DeviceIcon className="h-6 w-6 text-[#7C3AED]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">
                              {session.device}
                            </p>
                            {session.isCurrent && (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-300 bg-green-50 font-semibold"
                              >
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 font-medium">
                            {session.browser} • {session.os}
                          </p>
                          <p className="text-xs text-gray-600">
                            {session.location} • {session.ipAddress}
                          </p>
                          <p className="text-xs text-gray-500">
                            Last active: {formatTime(session.lastActive)}
                          </p>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingSession === session.id}
                        >
                          {revokingSession === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Revoke"
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              {sessions.filter((s: any) => !s.isCurrent).length > 0 && (
                <Button
                  variant="outline"
                  className="w-full mt-4 border-gray-300 hover:border-red-500 hover:text-red-600 hover:bg-red-50 font-semibold"
                  onClick={handleRevokeAllSessions}
                  disabled={revokingAll}
                >
                  {revokingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    "Revoke All Other Sessions"
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Activity Section Component
function ActivitySection({ activityLog, formatTime }: any) {
  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Activity Log</CardTitle>
              <CardDescription className="text-gray-600">
                Recent activity on your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {activityLog.map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-colors"
              >
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{formatTime(activity.timestamp)}</span>
                    <span>IP: {activity.ipAddress}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Payment Gateway Section Component
function PaymentGatewaySection() {
  const [paymentGateways, setPaymentGateways] = useState([
    {
      id: "stripe",
      name: "Stripe",
      description: "Accept credit cards, debit cards, and digital wallets",
      logo: "💳",
      enabled: false, // default disabled unless configured
      connected: false, // default disconnected unless configured
      apiKey: "",
      publishableKey: "",
      webhookUrl: "https://contrezz.com/webhook/stripe",
      testMode: false,
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Accept PayPal and major credit cards",
      logo: "🅿️",
      enabled: false,
      connected: false,
      clientId: "",
      clientSecret: "",
      webhookUrl: "https://contrezz.com/webhook/paypal",
      testMode: false,
    },
    {
      id: "square",
      name: "Square",
      description: "Accept payments with Square",
      logo: "🟦",
      enabled: false,
      connected: false,
      applicationId: "",
      accessToken: "",
      webhookUrl: "https://contrezz.com/webhook/square",
      testMode: false,
    },
    {
      id: "paystack",
      name: "Paystack",
      description: "Accept payments in Nigeria and other African countries",
      logo: "💚",
      enabled: false,
      connected: false,
      publicKey: "",
      secretKey: "",
      webhookUrl: `${API_BASE_URL}/api/paystack/webhook`,
      testMode: false,
    },
    {
      id: "monicredit",
      name: "Monicredit",
      description:
        "Accept payments in Nigeria with comprehensive payment solutions",
      logo: "💳",
      enabled: false,
      connected: false,
      publicKey: "",
      privateKey: "",
      webhookUrl: `${API_BASE_URL}/api/monicredit/webhook`,
      testMode: false,
    },
  ]);

  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState<any>({});

  // Load existing payment gateway settings for this owner
  useEffect(() => {
    (async () => {
      // Load Paystack settings
      const paystackResp = await getPaymentGatewaySettings("paystack");
      if (!paystackResp.error && paystackResp.data) {
        setPaymentGateways((prev) =>
          prev.map((g) => {
            if (g.id !== "paystack") return g;
            const hasKeys = !!paystackResp.data?.publicKey;
            return {
              ...g,
              connected: hasKeys || !!paystackResp.data?.isEnabled,
              enabled: !!paystackResp.data?.isEnabled,
              publicKey: paystackResp.data?.publicKey || "",
              secretConfigured: !!(paystackResp.data as any)?.secretConfigured,
              bankTransferTemplate:
                paystackResp.data?.bankTransferTemplate || "",
              // never set secretKey in UI state from server
              testMode: !!paystackResp.data?.testMode,
              webhookUrl: `${API_BASE_URL}/api/paystack/webhook`,
            };
          })
        );
      }

      // Load Monicredit settings
      const monicreditResp = await getPaymentGatewaySettings("monicredit");
      if (!monicreditResp.error && monicreditResp.data) {
        setPaymentGateways((prev) =>
          prev.map((g) => {
            if (g.id !== "monicredit") return g;
            const hasKeys = !!monicreditResp.data?.publicKey;
            return {
              ...g,
              connected: hasKeys || !!monicreditResp.data?.isEnabled,
              enabled: !!monicreditResp.data?.isEnabled,
              publicKey: monicreditResp.data?.publicKey || "",
              privateKey: "", // Never set privateKey in UI state from server
              privateKeyConfigured: !!(monicreditResp.data as any)
                ?.privateKeyConfigured,
              merchantId: (monicreditResp.data as any)?.merchantId || "",
              verifyToken: (monicreditResp.data as any)?.verifyToken || "",
              testMode: !!monicreditResp.data?.testMode,
              webhookUrl: `${API_BASE_URL}/api/monicredit/webhook`,
            };
          })
        );
      }
    })();
  }, []);

  const handleConnectGateway = (gatewayId: string) => {
    const gateway = paymentGateways.find((g) => g.id === gatewayId);
    if (gateway) {
      setSelectedGateway(gatewayId);
      setGatewayConfig(gateway);
      setShowConfigDialog(true);
    }
  };

  const handleSaveGatewayConfig = async () => {
    if (selectedGateway === "paystack") {
      const payload: any = {
        // Only send fields provided; backend supports partial updates now
        ...(gatewayConfig.publicKey
          ? { publicKey: gatewayConfig.publicKey }
          : {}),
        ...(gatewayConfig.secretKey
          ? { secretKey: gatewayConfig.secretKey }
          : {}),
        testMode: !!gatewayConfig.testMode,
        isEnabled: !!gatewayConfig.enabled,
        bankTransferTemplate: gatewayConfig.bankTransferTemplate || "",
      };
      const resp = await savePaymentGatewaySettings("paystack", payload);
      if (resp.error) {
        toast.error(resp.error.error || "Failed to save Paystack settings");
        return;
      }
      setPaymentGateways((prev) =>
        prev.map((g) =>
          g.id === "paystack"
            ? {
                ...g,
                connected: !!(
                  resp.data?.settings?.publicKey ||
                  resp.data?.settings?.isEnabled
                ),
                enabled: !!resp.data?.settings?.isEnabled,
                publicKey: resp.data?.settings?.publicKey || "",
                bankTransferTemplate:
                  resp.data?.settings?.bankTransferTemplate || "",
                testMode: !!resp.data?.settings?.testMode,
                webhookUrl: `${API_BASE_URL}/api/paystack/webhook`,
              }
            : g
        )
      );
      setShowConfigDialog(false);
      toast.success("Paystack settings saved");
      return;
    }

    if (selectedGateway === "monicredit") {
      const payload: any = {
        // Only send fields provided; backend supports partial updates now
        ...(gatewayConfig.publicKey
          ? { publicKey: gatewayConfig.publicKey }
          : {}),
        ...(gatewayConfig.privateKey
          ? { privateKey: gatewayConfig.privateKey }
          : {}),
        ...(gatewayConfig.merchantId
          ? { merchantId: gatewayConfig.merchantId }
          : {}),
        testMode: !!gatewayConfig.testMode,
        isEnabled: !!gatewayConfig.enabled,
      };
      const resp = await savePaymentGatewaySettings("monicredit", payload);
      if (resp.error) {
        toast.error(resp.error.error || "Failed to save Monicredit settings");
        return;
      }
      setPaymentGateways((prev) =>
        prev.map((g) =>
          g.id === "monicredit"
            ? {
                ...g,
                connected: !!(
                  resp.data?.settings?.publicKey ||
                  resp.data?.settings?.isEnabled
                ),
                enabled: !!resp.data?.settings?.isEnabled,
                publicKey: resp.data?.settings?.publicKey || "",
                verifyToken: (resp.data?.settings as any)?.verifyToken || "",
                testMode: !!resp.data?.settings?.testMode,
                webhookUrl: `${API_BASE_URL}/api/monicredit/webhook`,
              }
            : g
        )
      );

      // Update gatewayConfig with verify token if it was generated
      if (resp.data?.settings && (resp.data.settings as any)?.verifyToken) {
        setGatewayConfig((prev: any) => ({
          ...prev,
          verifyToken: (resp.data?.settings as any)?.verifyToken,
        }));
      }

      setShowConfigDialog(false);
      toast.success("Monicredit settings saved");
      return;
    }

    // Default behavior for other gateways (mock)
    setPaymentGateways((prev) =>
      prev.map((g) =>
        g.id === selectedGateway
          ? { ...g, ...gatewayConfig, connected: true }
          : g
      )
    );
    setShowConfigDialog(false);
    toast.success(`${gatewayConfig.name} configured successfully`);
  };

  const handleToggleGateway = async (gatewayId: string, enabled: boolean) => {
    // Persist payment gateway enable/disable to backend
    if (gatewayId === "paystack" || gatewayId === "monicredit") {
      const resp = await savePaymentGatewaySettings(gatewayId, {
        isEnabled: enabled,
      } as any);
      if (resp.error) {
        toast.error(
          resp.error.error ||
            `Failed to update ${
              gatewayId === "paystack" ? "Paystack" : "Monicredit"
            } status`
        );
        return;
      }
    }
    setPaymentGateways((prev) =>
      prev.map((g) => (g.id === gatewayId ? { ...g, enabled } : g))
    );
    toast.success(
      enabled ? "Payment gateway enabled" : "Payment gateway disabled"
    );
  };

  const handleDisconnectGateway = async (gatewayId: string) => {
    // For Paystack and Monicredit, mark disabled (keys retained on server)
    if (gatewayId === "paystack" || gatewayId === "monicredit") {
      const resp = await savePaymentGatewaySettings(gatewayId, {
        isEnabled: false,
      } as any);
      if (resp.error) {
        toast.error(
          resp.error.error ||
            `Failed to disconnect ${
              gatewayId === "paystack" ? "Paystack" : "Monicredit"
            }`
        );
        return;
      }
    }
    setPaymentGateways((prev) =>
      prev.map((g) =>
        g.id === gatewayId ? { ...g, connected: false, enabled: false } : g
      )
    );
    toast.success("Payment gateway disconnected");
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">
                Payment Gateway Configuration
              </h3>
              <p className="text-sm text-gray-700 mb-4 font-medium">
                Configure payment gateways to accept rent payments from tenants.
                These settings apply to all properties you own and will be used
                by property managers to process payments.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-900 font-semibold">
                    {paymentGateways.filter((g) => g.connected).length}{" "}
                    Connected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <Zap className="h-4 w-4 text-[#7C3AED]" />
                  </div>
                  <span className="text-gray-900 font-semibold">
                    {paymentGateways.filter((g) => g.enabled).length} Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateways List */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">
                Available Payment Gateways
              </CardTitle>
              <CardDescription className="text-gray-600">
                Connect and configure payment processors for your properties
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {paymentGateways.map((gateway) => (
            <div
              key={gateway.id}
              className={`p-5 border-2 rounded-xl transition-all ${
                gateway.connected
                  ? "border-green-300 bg-gradient-to-br from-green-50 to-green-100/50 shadow-sm"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-4xl">{gateway.logo}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900">
                        {gateway.name}
                      </h4>
                      {gateway.connected && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold">
                          Connected
                        </Badge>
                      )}
                      {gateway.testMode && gateway.connected && (
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-300 bg-orange-50 font-semibold"
                        >
                          Test Mode
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {gateway.description}
                    </p>

                    {gateway.connected && (
                      <div className="space-y-2 text-xs text-gray-700">
                        <div className="flex items-center gap-2">
                          <Key className="h-3 w-3 text-[#7C3AED]" />
                          <span className="font-mono">
                            API Key:{" "}
                            {gateway.apiKey || gateway.publicKey || "••••••••"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3 text-[#7C3AED]" />
                          <span>Webhook: {gateway.webhookUrl}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {gateway.connected ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`${gateway.id}-toggle`}
                          className="text-sm font-semibold"
                        >
                          {gateway.enabled ? "Enabled" : "Disabled"}
                        </Label>
                        <Switch
                          id={`${gateway.id}-toggle`}
                          checked={gateway.enabled}
                          onCheckedChange={(checked) =>
                            handleToggleGateway(gateway.id, checked)
                          }
                          className="data-[state=checked]:bg-[#7C3AED]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnectGateway(gateway.id)}
                          className="border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDisconnectGateway(gateway.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnectGateway(gateway.id)}
                      className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Payment Settings</CardTitle>
              <CardDescription className="text-gray-600">
                Configure general payment preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">
                Auto-capture Payments
              </h4>
              <p className="text-sm text-gray-600">
                Automatically capture authorized payments
              </p>
            </div>
            <Switch
              defaultChecked
              className="data-[state=checked]:bg-[#7C3AED]"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">
                Send Payment Receipts
              </h4>
              <p className="text-sm text-gray-600">
                Automatically email receipts to tenants
              </p>
            </div>
            <Switch
              defaultChecked
              className="data-[state=checked]:bg-[#7C3AED]"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Default Currency
            </Label>
            <Select defaultValue="NGN">
              <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="GBP">British Pound (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Late Payment Fee
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                defaultValue="5"
                className="w-24 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
              <Select defaultValue="percentage">
                <SelectTrigger className="w-32 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">% of rent</SelectItem>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">
              Additional fee charged for late payments
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <DialogTitle className="text-white text-2xl">
              Configure {gatewayConfig.name}
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Enter your API credentials to connect {gatewayConfig.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            {selectedGateway === "stripe" && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="publishableKey"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Publishable Key
                  </Label>
                  <Input
                    id="publishableKey"
                    value={gatewayConfig.publishableKey || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        publishableKey: e.target.value,
                      })
                    }
                    placeholder="pk_test_..."
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="secretKey"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Secret Key
                  </Label>
                  <Input
                    id="secretKey"
                    type="password"
                    value={gatewayConfig.apiKey || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        apiKey: e.target.value,
                      })
                    }
                    placeholder="sk_test_..."
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
              </>
            )}

            {selectedGateway === "paypal" && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="clientId"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Client ID
                  </Label>
                  <Input
                    id="clientId"
                    value={gatewayConfig.clientId || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        clientId: e.target.value,
                      })
                    }
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="clientSecret"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Client Secret
                  </Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={gatewayConfig.clientSecret || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        clientSecret: e.target.value,
                      })
                    }
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
              </>
            )}

            {selectedGateway === "square" && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="applicationId"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Application ID
                  </Label>
                  <Input
                    id="applicationId"
                    value={gatewayConfig.applicationId || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        applicationId: e.target.value,
                      })
                    }
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="accessToken"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Access Token
                  </Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={gatewayConfig.accessToken || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        accessToken: e.target.value,
                      })
                    }
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
              </>
            )}

            {selectedGateway === "paystack" && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="publicKey"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Public Key
                  </Label>
                  <Input
                    id="publicKey"
                    value={gatewayConfig.publicKey || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        publicKey: e.target.value,
                      })
                    }
                    placeholder="pk_test_..."
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="secretKey"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Secret Key
                  </Label>
                  <Input
                    id="secretKey"
                    type="password"
                    value={gatewayConfig.secretKey || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        secretKey: e.target.value,
                      })
                    }
                    placeholder="sk_test_..."
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  {gatewayConfig.secretConfigured &&
                    !gatewayConfig.secretKey && (
                      <p className="text-xs text-gray-500">
                        A secret key is already configured. Leave blank to keep
                        existing.
                      </p>
                    )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label
                    htmlFor="bankTransferTemplate"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Bank Transfer Instructions (Optional)
                  </Label>
                  <Textarea
                    id="bankTransferTemplate"
                    value={gatewayConfig.bankTransferTemplate || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        bankTransferTemplate: e.target.value,
                      })
                    }
                    placeholder="Enter custom instructions for tenants making bank transfers&#10;&#10;Example:&#10;Bank Name: First Bank of Nigeria&#10;Account Name: Metro Properties Ltd&#10;Account Number: 1234567890&#10;&#10;Please use your unit number as reference."
                    rows={6}
                    className="resize-none border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <p className="text-xs text-gray-500">
                    This message will be shown to tenants when they select "Bank
                    Transfer" as payment method. Include your bank details and
                    any special instructions.
                  </p>
                </div>
              </>
            )}

            {selectedGateway === "monicredit" && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="monicreditPublicKey"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Public Key
                  </Label>
                  <Input
                    id="monicreditPublicKey"
                    value={gatewayConfig.publicKey || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        publicKey: e.target.value,
                      })
                    }
                    placeholder="PUB_TEST_..."
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <p className="text-xs text-gray-500">
                    Your Monicredit public key from the dashboard. Use test key
                    for test mode and live key for live mode.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="monicreditPrivateKey"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Private Key
                  </Label>
                  <Input
                    id="monicreditPrivateKey"
                    type="password"
                    value={gatewayConfig.privateKey || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        privateKey: e.target.value,
                      })
                    }
                    placeholder="PRV_TEST_..."
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  {gatewayConfig.privateKeyConfigured &&
                    !gatewayConfig.privateKey && (
                      <p className="text-xs text-gray-500">
                        A private key is already configured. Leave blank to keep
                        existing.
                      </p>
                    )}
                  <p className="text-xs text-gray-500">
                    Your Monicredit private key from the dashboard. This is kept
                    secure and never exposed to the frontend.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="monicreditMerchantId"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Merchant ID
                  </Label>
                  <Input
                    id="monicreditMerchantId"
                    value={gatewayConfig.merchantId || ""}
                    onChange={(e) =>
                      setGatewayConfig({
                        ...gatewayConfig,
                        merchantId: e.target.value,
                      })
                    }
                    placeholder="MERCHANT_..."
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <p className="text-xs text-gray-500">
                    Your Monicredit merchant ID from the dashboard. This may be
                    required for authentication.
                  </p>
                </div>

                {/* Warning about Demo Environment */}
                <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-900 mb-1">
                        ⚠️ Demo Environment Notice
                      </p>
                      <p className="text-xs text-yellow-800 mb-2">
                        This integration uses Monicredit's demo environment (
                        <code className="bg-yellow-100 px-1 rounded">
                          demo.backend.monicredit.com
                        </code>
                        ). However,{" "}
                        <strong>
                          the demo environment may still process real payments
                        </strong>{" "}
                        depending on your credentials.
                      </p>
                      <p className="text-xs text-yellow-800 font-semibold">
                        To avoid real payments during testing:
                      </p>
                      <ul className="text-xs text-yellow-800 mt-1 ml-4 list-disc space-y-1">
                        <li>
                          Use <strong>test/demo credentials</strong> from
                          Monicredit (not production keys)
                        </li>
                        <li>
                          Contact Monicredit support to obtain sandbox/test API
                          keys
                        </li>
                        <li>
                          Test keys typically start with{" "}
                          <code className="bg-yellow-100 px-1 rounded">
                            PUB_DEMO_
                          </code>{" "}
                          or{" "}
                          <code className="bg-yellow-100 px-1 rounded">
                            PUB_TEST_
                          </code>
                        </li>
                        <li>
                          Verify with Monicredit that your demo account is
                          configured for test transactions only
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Webhook URLs and Verify Token */}
                <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">
                        Webhook Configuration
                      </p>
                      <p className="text-xs text-blue-700">
                        Add these URLs to your Monicredit dashboard
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="paymentWebhookUrl"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Payment Webhook URL
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="paymentWebhookUrl"
                          value={`${API_BASE_URL}/api/monicredit/webhook/payment`}
                          readOnly
                          className="flex-1 border-blue-300 bg-white font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${API_BASE_URL}/api/monicredit/webhook/payment`
                            );
                            toast.success(
                              "Payment webhook URL copied to clipboard"
                            );
                          }}
                          className="border-blue-300 hover:border-blue-500 hover:text-blue-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="walletWebhookUrl"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Wallet Webhook URL
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="walletWebhookUrl"
                          value={`${API_BASE_URL}/api/monicredit/webhook/wallet`}
                          readOnly
                          className="flex-1 border-blue-300 bg-white font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${API_BASE_URL}/api/monicredit/webhook/wallet`
                            );
                            toast.success(
                              "Wallet webhook URL copied to clipboard"
                            );
                          }}
                          className="border-blue-300 hover:border-blue-500 hover:text-blue-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="verifyToken"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Verify Token
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="verifyToken"
                          value={
                            gatewayConfig.verifyToken ||
                            "Not generated yet. Save settings to generate."
                          }
                          readOnly
                          className="flex-1 border-blue-300 bg-white font-mono text-xs"
                        />
                        {gatewayConfig.verifyToken && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                gatewayConfig.verifyToken
                              );
                              toast.success("Verify token copied to clipboard");
                            }}
                            className="border-blue-300 hover:border-blue-500 hover:text-blue-600"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        This token is automatically generated when you save your
                        Monicredit settings. Use it in your Monicredit dashboard
                        for webhook verification.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedGateway !== "monicredit" && <Separator />}

            <div className="space-y-2">
              <Label
                htmlFor="webhookUrl"
                className="text-sm font-semibold text-gray-700"
              >
                Webhook URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="webhookUrl"
                  value={gatewayConfig.webhookUrl || ""}
                  readOnly
                  className="flex-1 border-gray-300 bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(gatewayConfig.webhookUrl);
                    toast.success("Webhook URL copied to clipboard");
                  }}
                  className="border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Add this webhook URL to your {gatewayConfig.name} dashboard
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-300 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-orange-900">Test Mode</p>
                  <p className="text-xs text-orange-700">
                    Use test API keys for testing
                  </p>
                </div>
              </div>
              <Switch
                checked={gatewayConfig.testMode || false}
                onCheckedChange={(checked) =>
                  setGatewayConfig({ ...gatewayConfig, testMode: checked })
                }
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
          </div>

          <DialogFooter className="p-6 border-t">
            <Button
              variant="outline"
              onClick={() => setShowConfigDialog(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveGatewayConfig}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Help Section Component
function HelpSection() {
  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Help & Support</CardTitle>
              <CardDescription className="text-gray-600">
                Get help and learn more about Contrezz
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-5 flex-col items-start border-2 border-gray-200 hover:border-[#7C3AED] hover:bg-purple-50 transition-all rounded-xl group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#7C3AED] transition-colors">
                <FileText className="h-6 w-6 text-[#7C3AED] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-bold mb-1 text-gray-900">Documentation</h4>
              <p className="text-xs text-gray-600">
                Browse our guides and tutorials
              </p>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-5 flex-col items-start border-2 border-gray-200 hover:border-[#7C3AED] hover:bg-purple-50 transition-all rounded-xl group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#7C3AED] transition-colors">
                <MessageSquare className="h-6 w-6 text-[#7C3AED] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-bold mb-1 text-gray-900">Contact Support</h4>
              <p className="text-xs text-gray-600">Get help from our team</p>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-5 flex-col items-start border-2 border-gray-200 hover:border-[#7C3AED] hover:bg-purple-50 transition-all rounded-xl group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#7C3AED] transition-colors">
                <HelpCircle className="h-6 w-6 text-[#7C3AED] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-bold mb-1 text-gray-900">FAQ</h4>
              <p className="text-xs text-gray-600">
                Find answers to common questions
              </p>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-5 flex-col items-start border-2 border-gray-200 hover:border-[#7C3AED] hover:bg-purple-50 transition-all rounded-xl group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#7C3AED] transition-colors">
                <ExternalLink className="h-6 w-6 text-[#7C3AED] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-bold mb-1 text-gray-900">Community Forum</h4>
              <p className="text-xs text-gray-600">Connect with other users</p>
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-bold text-gray-900">Quick Links</h4>
            <div className="space-y-1">
              <Button
                variant="link"
                className="h-auto p-0 justify-start text-[#7C3AED] hover:text-[#5B21B6] font-semibold"
              >
                Getting Started Guide →
              </Button>
              <Button
                variant="link"
                className="h-auto p-0 justify-start text-[#7C3AED] hover:text-[#5B21B6] font-semibold"
              >
                Video Tutorials →
              </Button>
              <Button
                variant="link"
                className="h-auto p-0 justify-start text-[#7C3AED] hover:text-[#5B21B6] font-semibold"
              >
                API Documentation →
              </Button>
              <Button
                variant="link"
                className="h-auto p-0 justify-start text-[#7C3AED] hover:text-[#5B21B6] font-semibold"
              >
                Release Notes →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
