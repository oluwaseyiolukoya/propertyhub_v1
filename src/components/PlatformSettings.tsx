import React, { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";

// Get API base URL from environment
const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "" : "");
import {
  Settings,
  Shield,
  Users,
  Key,
  Bell,
  CreditCard,
  Server,
  FileText,
  Globe,
  Database,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  Zap,
  Building2,
  Network,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
  CheckCircle,
  Info,
  Copy,
  RotateCcw,
  Calendar,
  Clock,
  Target,
  Monitor,
  HardDrive,
  Activity,
  Webhook,
  Crown,
  Banknote,
  Receipt,
  Calculator,
  Filter,
  Archive,
  Scale,
  AlertCircle,
  Search,
  Wrench,
} from "lucide-react";
import {
  getAdminPaymentGateway,
  saveAdminPaymentGateway,
  AdminPaymentGatewayConfig,
} from "../lib/api/system";

export function PlatformSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const [settings, setSettings] = useState({
    general: {
      platformName: "Contrezz",
      platformUrl: "https://contrezz.com",
      supportEmail: "support@contrezz.com",
      timezone: "UTC-8",
      dateFormat: "MM/DD/YYYY",
      currency: "USD",
      language: "English",
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
      logoUrl: null as string | null,
      faviconUrl: null as string | null,
    },
    smtp: {
      host: "smtp.gmail.com",
      port: 587,
      username: "noreply@contrezz.com",
      password: "••••••••••••",
      encryption: "TLS",
      fromEmail: "noreply@contrezz.com",
      fromName: "Contrezz",
      isConnected: true,
    },
    security: {
      enforceSSL: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      twoFactorAuth: true,
      apiRateLimit: 1000,
      ipWhitelist: "",
      dataRetention: 365,
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      maintenanceAlerts: true,
      billingAlerts: true,
      securityAlerts: true,
      systemUpdates: true,
      marketingEmails: false,
    },
    billing: {
      paymentProcessor: "stripe",
      webhookUrl: "https://api.contrezz.com/webhooks/stripe",
      taxCalculation: true,
      invoiceTemplate: "default",
      paymentMethods: ["card", "ach", "wire"],
      gracePeriod: 7,
      autoSuspend: true,
      prorationEnabled: true,
    },
  });

  const [monicreditConfig, setMonicreditConfig] =
    useState<AdminPaymentGatewayConfig | null>(null);
  const [loadingMonicredit, setLoadingMonicredit] = useState(false);
  const [showMonicreditDialog, setShowMonicreditDialog] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [savingMonicredit, setSavingMonicredit] = useState(false);

  const [paystackConfig, setPaystackConfig] =
    useState<AdminPaymentGatewayConfig | null>(null);
  const [loadingPaystack, setLoadingPaystack] = useState(false);
  const [showPaystackDialog, setShowPaystackDialog] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [savingPaystack, setSavingPaystack] = useState(false);

  // Load Monicredit configuration
  useEffect(() => {
    loadMonicreditConfig();
  }, []);

  // Load Paystack configuration
  useEffect(() => {
    loadPaystackConfig();
  }, []);

  const loadMonicreditConfig = async () => {
    try {
      setLoadingMonicredit(true);
      const response = await getAdminPaymentGateway("monicredit");
      if (response.data) {
        setMonicreditConfig(response.data);
      }
    } catch (error: any) {
      console.error("Failed to load Monicredit config:", error);
    } finally {
      setLoadingMonicredit(false);
    }
  };

  const handleSaveMonicredit = async (config: AdminPaymentGatewayConfig) => {
    try {
      if (config.isEnabled && (!config.publicKey || !config.privateKey)) {
        toast.error(
          "Public key and private key are required to enable Monicredit"
        );
        return;
      }

      setSavingMonicredit(true);
      const response = await saveAdminPaymentGateway({
        provider: "monicredit",
        publicKey: config.publicKey || undefined,
        privateKey: config.privateKey || undefined,
        merchantId: config.merchantId || undefined,
        testMode: config.testMode,
        isEnabled: config.isEnabled,
      });

      if (response.error) {
        toast.error(response.error.error || "Failed to save configuration");
        return;
      }

      if (response.data) {
        setMonicreditConfig(response.data);
        setShowMonicreditDialog(false);
        toast.success("Monicredit configuration saved successfully");
      }
    } catch (error: any) {
      console.error("Failed to save Monicredit config:", error);
      toast.error("Failed to save payment gateway configuration");
    } finally {
      setSavingMonicredit(false);
    }
  };

  const loadPaystackConfig = async () => {
    try {
      setLoadingPaystack(true);
      const response = await getAdminPaymentGateway("paystack");
      if (response.data) {
        setPaystackConfig(response.data);
      }
    } catch (error: any) {
      console.error("Failed to load Paystack config:", error);
    } finally {
      setLoadingPaystack(false);
    }
  };

  const handleSavePaystack = async (config: AdminPaymentGatewayConfig) => {
    try {
      if (config.isEnabled && (!config.publicKey || !config.secretKey)) {
        toast.error(
          "Public key and secret key are required to enable Paystack"
        );
        return;
      }

      setSavingPaystack(true);
      const response = await saveAdminPaymentGateway({
        provider: "paystack",
        publicKey: config.publicKey || undefined,
        secretKey: config.secretKey || undefined,
        testMode: config.testMode,
        isEnabled: config.isEnabled,
      });

      if (response.error) {
        toast.error(response.error.error || "Failed to save configuration");
        return;
      }

      if (response.data) {
        setPaystackConfig(response.data);
        setShowPaystackDialog(false);
        toast.success("Paystack configuration saved successfully");
      }
    } catch (error: any) {
      console.error("Failed to save Paystack config:", error);
      toast.error("Failed to save payment gateway configuration");
    } finally {
      setSavingPaystack(false);
    }
  };

  const integrations = [
    {
      id: 1,
      name: "Stripe Payment Gateway",
      type: "payment",
      status: "connected",
      lastSync: "2024-03-21T14:30:00Z",
      webhookUrl: "https://api.contrezz.com/webhooks/stripe",
      apiVersion: "v2024-02-15",
    },
    {
      id: 2,
      name: "Paystack Payment Gateway",
      type: "payment",
      status: paystackConfig?.isEnabled ? "connected" : "disconnected",
      lastSync: paystackConfig?.isEnabled ? new Date().toISOString() : null,
      webhookUrl: "https://api.app.contrezz.com/api/paystack/webhook",
      apiVersion: "v1.0",
      isPaystack: true, // Flag to identify Paystack
    },
    {
      id: 3,
      name: "Monicredit Payment Gateway",
      type: "payment",
      status: monicreditConfig?.isEnabled ? "connected" : "disconnected",
      lastSync: monicreditConfig?.isEnabled ? new Date().toISOString() : null,
      webhookUrl: "https://api.app.contrezz.com/api/monicredit/webhook/payment",
      apiVersion: "v1.0",
      isMonicredit: true, // Flag to identify Monicredit
    },
    {
      id: 4,
      name: "Kisi Access Control",
      type: "access-control",
      status: "connected",
      lastSync: "2024-03-21T12:15:00Z",
      webhookUrl: "https://api.contrezz.com/webhooks/kisi",
      apiVersion: "v2.0",
    },
    {
      id: 5,
      name: "Brivo Access Control",
      type: "access-control",
      status: "disconnected",
      lastSync: null,
      webhookUrl: "",
      apiVersion: "v1.0",
    },
    {
      id: 6,
      name: "SendGrid Email Service",
      type: "communication",
      status: "connected",
      lastSync: "2024-03-21T15:45:00Z",
      webhookUrl: "https://api.contrezz.com/webhooks/sendgrid",
      apiVersion: "v3",
    },
    {
      id: 7,
      name: "Twilio SMS Service",
      type: "communication",
      status: "pending",
      lastSync: null,
      webhookUrl: "https://api.contrezz.com/webhooks/twilio",
      apiVersion: "v2010-04-01",
    },
  ];

  const userRoles = [
    {
      id: 1,
      name: "Super Admin",
      description: "Full system access and configuration",
      permissions: ["all"],
      userCount: 2,
      canDelete: false,
    },
    {
      id: 2,
      name: "Property Owner",
      description: "Manage owned properties and tenants",
      permissions: [
        "view_properties",
        "manage_tenants",
        "view_reports",
        "manage_payments",
      ],
      userCount: 156,
      canDelete: false,
    },
    {
      id: 3,
      name: "Property Manager",
      description: "Day-to-day property management operations",
      permissions: [
        "manage_properties",
        "manage_tenants",
        "handle_maintenance",
        "process_payments",
      ],
      userCount: 89,
      canDelete: false,
    },
    {
      id: 4,
      name: "Tenant",
      description: "Access to tenant portal and services",
      permissions: [
        "view_lease",
        "make_payments",
        "submit_maintenance",
        "update_profile",
      ],
      userCount: 2847,
      canDelete: false,
    },
    {
      id: 5,
      name: "Maintenance Staff",
      description: "Handle maintenance requests and scheduling",
      permissions: [
        "view_maintenance",
        "update_maintenance",
        "schedule_appointments",
      ],
      userCount: 45,
      canDelete: true,
    },
  ];

  const systemMetrics = {
    uptime: 99.97,
    activeUsers: 2847,
    apiCalls: 45672,
    storageUsed: 2.3,
    bandwidthUsed: 1.8,
    databaseSize: 4.2,
    lastBackup: "2024-03-21T02:00:00Z",
    nextMaintenance: "2024-03-25T02:00:00Z",
  };

  const auditLogs = [
    {
      id: 1,
      action: "Settings Updated",
      user: "admin@contrezz.com",
      timestamp: "2024-03-21T14:30:00Z",
      details: "Updated payment processor configuration",
      ipAddress: "192.168.1.100",
    },
    {
      id: 2,
      action: "User Role Modified",
      user: "admin@contrezz.com",
      timestamp: "2024-03-21T13:15:00Z",
      details: "Added new permission to Property Manager role",
      ipAddress: "192.168.1.100",
    },
    {
      id: 3,
      action: "Integration Configured",
      user: "admin@contrezz.com",
      timestamp: "2024-03-21T12:00:00Z",
      details: "Connected new Stripe webhook endpoint",
      ipAddress: "192.168.1.100",
    },
  ];

  const availablePermissions = [
    { id: "view_properties", name: "View Properties", category: "Properties" },
    {
      id: "manage_properties",
      name: "Manage Properties",
      category: "Properties",
    },
    {
      id: "delete_properties",
      name: "Delete Properties",
      category: "Properties",
    },
    { id: "view_tenants", name: "View Tenants", category: "Tenants" },
    { id: "manage_tenants", name: "Manage Tenants", category: "Tenants" },
    { id: "view_payments", name: "View Payments", category: "Payments" },
    { id: "manage_payments", name: "Manage Payments", category: "Payments" },
    { id: "process_payments", name: "Process Payments", category: "Payments" },
    { id: "view_reports", name: "View Reports", category: "Reports" },
    { id: "generate_reports", name: "Generate Reports", category: "Reports" },
    {
      id: "view_maintenance",
      name: "View Maintenance",
      category: "Maintenance",
    },
    {
      id: "handle_maintenance",
      name: "Handle Maintenance",
      category: "Maintenance",
    },
    { id: "manage_users", name: "Manage Users", category: "Users" },
    { id: "manage_roles", name: "Manage Roles", category: "Users" },
    { id: "view_settings", name: "View Settings", category: "Settings" },
    { id: "manage_settings", name: "Manage Settings", category: "Settings" },
  ];

  // Load branding on component mount
  React.useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      // Try multiple token sources (auth_token is the correct key used by the app)
      const token =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("auth_token") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("admin_token");

      if (!token) {
        console.log("No authentication token found for loading branding");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Load logo
      const logoResponse = await fetch(
        `${API_BASE_URL}/api/system/settings/platform_logo_url`,
        { headers }
      );
      if (logoResponse.ok) {
        const logoData = await logoResponse.json();
        if (logoData.value) {
          // If value is already a full URL, use it as-is; otherwise prepend API_BASE_URL
          const logoUrl =
            logoData.value.startsWith("http://") ||
            logoData.value.startsWith("https://")
              ? logoData.value
              : `${API_BASE_URL}${logoData.value}`;
          setSettings((prev) => ({
            ...prev,
            general: { ...prev.general, logoUrl },
          }));
        }
      }

      // Load favicon
      const faviconResponse = await fetch(
        `${API_BASE_URL}/api/system/settings/platform_favicon_url`,
        { headers }
      );
      if (faviconResponse.ok) {
        const faviconData = await faviconResponse.json();
        if (faviconData.value) {
          // If value is already a full URL, use it as-is; otherwise prepend API_BASE_URL
          const faviconUrl =
            faviconData.value.startsWith("http://") ||
            faviconData.value.startsWith("https://")
              ? faviconData.value
              : `${API_BASE_URL}${faviconData.value}`;
          setSettings((prev) => ({
            ...prev,
            general: { ...prev.general, faviconUrl },
          }));
        }
      }
    } catch (error) {
      console.error("Failed to load branding:", error);
    }
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
      // Try multiple token sources (auth_token is the correct key used by the app)
      const token =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("auth_token") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("admin_token");

      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        return;
      }

      console.log("Uploading logo with token:", token.substring(0, 20) + "...");

      const response = await fetch(
        `${API_BASE_URL}/api/system/settings/upload-logo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        // If data.url is already a full URL, use it as-is; otherwise prepend API_BASE_URL
        const logoUrl =
          data.url.startsWith("http://") || data.url.startsWith("https://")
            ? data.url
            : `${API_BASE_URL}${data.url}`;

        setSettings((prev) => ({
          ...prev,
          general: { ...prev.general, logoUrl },
        }));
        toast.success("Logo uploaded successfully");
        // Trigger a page reload to update logo across all components
        window.location.reload();
      } else {
        const error = await response.json();
        console.error("Upload error:", error);
        toast.error(error.error || "Failed to upload logo");
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error("Failed to upload logo");
    }
  };

  const handleFaviconUpload = async (file: File | undefined) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("favicon", file);

    try {
      // Try multiple token sources (auth_token is the correct key used by the app)
      const token =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("auth_token") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("admin_token");

      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/system/settings/upload-favicon`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        // If data.url is already a full URL, use it as-is; otherwise prepend API_BASE_URL
        const faviconUrl =
          data.url.startsWith("http://") || data.url.startsWith("https://")
            ? data.url
            : `${API_BASE_URL}${data.url}`;

        setSettings((prev) => ({
          ...prev,
          general: { ...prev.general, faviconUrl },
        }));
        toast.success("Favicon uploaded successfully");
        // Update favicon immediately with cache-busting
        updateFavicon(`${faviconUrl}?cb=${Date.now()}`);
      } else {
        const error = await response.json();
        console.error("Upload error:", error);
        toast.error(error.error || "Failed to upload favicon");
      }
    } catch (error) {
      console.error("Favicon upload error:", error);
      toast.error("Failed to upload favicon");
    }
  };

  const handleRemoveLogo = async () => {
    try {
      // Try multiple token sources (auth_token is the correct key used by the app)
      const token =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("auth_token") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("admin_token");

      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/system/settings/logo`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSettings((prev) => ({
          ...prev,
          general: { ...prev.general, logoUrl: null },
        }));
        toast.success("Logo removed successfully");
        // Trigger a page reload to update logo across all components
        window.location.reload();
      } else {
        const error = await response.json();
        console.error("Remove error:", error);
        toast.error(error.error || "Failed to remove logo");
      }
    } catch (error) {
      console.error("Logo removal error:", error);
      toast.error("Failed to remove logo");
    }
  };

  const handleRemoveFavicon = async () => {
    try {
      // Try multiple token sources (auth_token is the correct key used by the app)
      const token =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("auth_token") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("admin_token");

      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/system/settings/favicon`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSettings((prev) => ({
          ...prev,
          general: { ...prev.general, faviconUrl: null },
        }));
        toast.success("Favicon removed successfully");
        // Reset to an inline default favicon to avoid 404s
        const defaultFavicon =
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='%23ff7a00'/></svg>";
        updateFavicon(defaultFavicon);
      } else {
        const error = await response.json();
        console.error("Remove error:", error);
        toast.error(error.error || "Failed to remove favicon");
      }
    } catch (error) {
      console.error("Favicon removal error:", error);
      toast.error("Failed to remove favicon");
    }
  };

  const updateFavicon = (url: string) => {
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach((link) => link.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = url;
    document.head.appendChild(link);
  };

  const handleSaveSettings = (category: string) => {
    toast.success(`${category} settings saved successfully`);
  };

  const handleAddRole = () => {
    if (!newRole.name.trim()) {
      toast.error("Please enter a role name");
      return;
    }
    if (!newRole.description.trim()) {
      toast.error("Please enter a role description");
      return;
    }
    if (newRole.permissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    toast.success(`Role "${newRole.name}" created successfully`);
    setShowAddRoleDialog(false);
    setNewRole({ name: "", description: "", permissions: [] });
  };

  const togglePermission = (permissionId: string) => {
    setNewRole((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "disconnected":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return "default";
      case "disconnected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <CreditCard className="h-4 w-4" />;
      case "access-control":
        return <Key className="h-4 w-4" />;
      case "communication":
        return <Mail className="h-4 w-4" />;
      default:
        return <Network className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">
                  Platform Settings
                </h2>
              </div>
              <p className="text-purple-100 text-lg">
                Configure and manage platform-wide settings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Config
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Config
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 rounded-t-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8 h-auto bg-transparent p-2 gap-2">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">General</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Users</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Integrations</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Billing</span>
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">System</span>
            </TabsTrigger>
            <TabsTrigger
              value="compliance"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Compliance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-0 p-6">
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        General Platform Settings
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Basic platform configuration and branding
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="platform-name">Platform Name</Label>
                      <Input
                        id="platform-name"
                        value={settings.general.platformName}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: {
                              ...prev.general,
                              platformName: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="platform-url">Platform URL</Label>
                      <Input
                        id="platform-url"
                        value={settings.general.platformUrl}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: {
                              ...prev.general,
                              platformUrl: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="support-email">Support Email</Label>
                      <Input
                        id="support-email"
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: {
                              ...prev.general,
                              supportEmail: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="timezone">Default Timezone</Label>
                      <Select
                        value={settings.general.timezone}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, timezone: value },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC-8">
                            Pacific Time (UTC-8)
                          </SelectItem>
                          <SelectItem value="UTC-5">
                            Eastern Time (UTC-5)
                          </SelectItem>
                          <SelectItem value="UTC-6">
                            Central Time (UTC-6)
                          </SelectItem>
                          <SelectItem value="UTC+0">UTC</SelectItem>
                          <SelectItem value="UTC+1">
                            Central European Time (UTC+1)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="date-format"
                        className="text-gray-700 font-medium"
                      >
                        Date Format
                      </Label>
                      <Select
                        value={settings.general.dateFormat}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, dateFormat: value },
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="currency"
                        className="text-gray-700 font-medium"
                      >
                        Default Currency
                      </Label>
                      <Select
                        value={settings.general.currency}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, currency: value },
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="GBP">
                            British Pound (GBP)
                          </SelectItem>
                          <SelectItem value="CAD">
                            Canadian Dollar (CAD)
                          </SelectItem>
                          <SelectItem value="NGN">
                            Nigerian Naira (NGN)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="language"
                        className="text-gray-700 font-medium"
                      >
                        Default Language
                      </Label>
                      <Select
                        value={settings.general.language}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, language: value },
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Platform Branding
                  </h4>
                  <p className="text-sm text-gray-600">
                    Customize your platform's logo and favicon
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Logo Upload */}
                    <div className="space-y-3">
                      <Label>Platform Logo</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {settings.general.logoUrl ? (
                          <div className="space-y-3">
                            <img
                              src={settings.general.logoUrl}
                              alt="Platform Logo"
                              className="h-16 mx-auto object-contain"
                            />
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept =
                                    "image/svg+xml,image/png,image/jpeg,image/jpg,image/webp";
                                  input.onchange = (e) =>
                                    handleLogoUpload(
                                      (e.target as HTMLInputElement).files?.[0]
                                    );
                                  input.click();
                                }}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Change
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveLogo}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg w-fit mx-auto">
                              <Upload className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept =
                                    "image/svg+xml,image/png,image/jpeg,image/jpg,image/webp";
                                  input.onchange = (e) =>
                                    handleLogoUpload(
                                      (e.target as HTMLInputElement).files?.[0]
                                    );
                                  input.click();
                                }}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Logo
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              SVG, PNG, JPG, JPEG, or WEBP (max 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Favicon Upload */}
                    <div className="space-y-3">
                      <Label className="text-gray-700 font-medium">
                        Platform Favicon
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
                        {settings.general.faviconUrl ? (
                          <div className="space-y-3">
                            <img
                              src={settings.general.faviconUrl}
                              alt="Platform Favicon"
                              className="h-16 mx-auto object-contain"
                            />
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept =
                                    "image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml";
                                  input.onchange = (e) =>
                                    handleFaviconUpload(
                                      (e.target as HTMLInputElement).files?.[0]
                                    );
                                  input.click();
                                }}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Change
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveFavicon}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg w-fit mx-auto">
                              <Upload className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept =
                                    "image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml";
                                  input.onchange = (e) =>
                                    handleFaviconUpload(
                                      (e.target as HTMLInputElement).files?.[0]
                                    );
                                  input.click();
                                }}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Favicon
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              ICO, PNG, or SVG (max 1MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Platform Access</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label
                          htmlFor="maintenance-mode"
                          className="text-gray-700 font-medium"
                        >
                          Maintenance Mode
                        </Label>
                        <p className="text-sm text-gray-600">
                          Temporarily disable platform access
                        </p>
                      </div>
                      <Switch
                        id="maintenance-mode"
                        checked={settings.general.maintenanceMode}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: {
                              ...prev.general,
                              maintenanceMode: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label
                          htmlFor="allow-registration"
                          className="text-gray-700 font-medium"
                        >
                          Allow Registration
                        </Label>
                        <p className="text-sm text-gray-600">
                          Allow new user registrations
                        </p>
                      </div>
                      <Switch
                        id="allow-registration"
                        checked={settings.general.allowRegistration}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: {
                              ...prev.general,
                              allowRegistration: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label
                          htmlFor="email-verification"
                          className="text-gray-700 font-medium"
                        >
                          Require Email Verification
                        </Label>
                        <p className="text-sm text-gray-600">
                          Users must verify email before access
                        </p>
                      </div>
                      <Switch
                        id="email-verification"
                        checked={settings.general.requireEmailVerification}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: {
                              ...prev.general,
                              requireEmailVerification: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => handleSaveSettings("General")}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-0 p-6">
            {/* User Roles Management */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        User Roles & Permissions
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Manage user roles and their permissions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search roles..."
                          className="w-64 pl-10 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={() => setShowAddRoleDialog(true)}
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Role
                    </Button>
                  </div>

                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50">
                          <TableHead className="font-semibold text-gray-900">
                            Role Name
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Description
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Users
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Permissions
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userRoles.map((role) => (
                          <TableRow
                            key={role.id}
                            className="hover:bg-purple-50/50 transition-colors duration-200"
                          >
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {role.name === "Super Admin" && (
                                  <div className="p-1 bg-gradient-to-br from-yellow-500 to-amber-500 rounded">
                                    <Crown className="h-4 w-4 text-white" />
                                  </div>
                                )}
                                <span className="font-medium text-gray-900">
                                  {role.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {role.description}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="bg-purple-100 text-purple-700 border-purple-200"
                              >
                                {role.userCount} users
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {role.permissions
                                  .slice(0, 2)
                                  .map((permission, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs border-purple-200 text-purple-700 bg-purple-50"
                                    >
                                      {permission.replace("_", " ")}
                                    </Badge>
                                  ))}
                                {role.permissions.length > 2 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-purple-200 text-purple-700 bg-purple-50"
                                  >
                                    +{role.permissions.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {role.canDelete && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Authentication Settings */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <Key className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Authentication Settings
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Configure user authentication and access controls
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="session-timeout"
                        className="text-gray-700 font-medium"
                      >
                        Session Timeout (minutes)
                      </Label>
                      <Input
                        id="session-timeout"
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              sessionTimeout: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="mt-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="max-login-attempts"
                        className="text-gray-700 font-medium"
                      >
                        Max Login Attempts
                      </Label>
                      <Input
                        id="max-login-attempts"
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              maxLoginAttempts: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="mt-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="password-min-length"
                        className="text-gray-700 font-medium"
                      >
                        Minimum Password Length
                      </Label>
                      <Input
                        id="password-min-length"
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              passwordMinLength: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="mt-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Require Special Characters
                        </Label>
                        <p className="text-sm text-gray-600">
                          Password must contain special characters
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.requireSpecialChars}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              requireSpecialChars: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Require Numbers
                        </Label>
                        <p className="text-sm text-gray-600">
                          Password must contain numbers
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.requireNumbers}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              requireNumbers: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Two-Factor Authentication
                        </Label>
                        <p className="text-sm text-gray-600">
                          Require 2FA for all users
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.twoFactorAuth}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              twoFactorAuth: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => handleSaveSettings("User Authentication")}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-0 p-6">
            {/* Security Policies */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-b border-red-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Security Policies
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Configure platform security settings and policies
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Enforce SSL/HTTPS
                        </Label>
                        <p className="text-sm text-gray-600">
                          Require secure connections
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.enforceSSL}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: { ...prev.security, enforceSSL: checked },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="api-rate-limit"
                        className="text-gray-700 font-medium"
                      >
                        API Rate Limit (requests/hour)
                      </Label>
                      <Input
                        id="api-rate-limit"
                        type="number"
                        value={settings.security.apiRateLimit}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              apiRateLimit: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="mt-2 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="ip-whitelist"
                        className="text-gray-700 font-medium"
                      >
                        IP Whitelist
                      </Label>
                      <Textarea
                        id="ip-whitelist"
                        placeholder="Enter IP addresses (one per line)"
                        value={settings.security.ipWhitelist}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              ipWhitelist: e.target.value,
                            },
                          }))
                        }
                        className="mt-2 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="data-retention"
                        className="text-gray-700 font-medium"
                      >
                        Data Retention (days)
                      </Label>
                      <Input
                        id="data-retention"
                        type="number"
                        value={settings.security.dataRetention}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              dataRetention: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="mt-2 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-white">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Security Status
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 border border-gray-200 rounded bg-gray-50">
                          <span className="text-sm text-gray-700">
                            SSL Certificate
                          </span>
                          <Badge
                            variant="default"
                            className="bg-green-600 text-white"
                          >
                            Valid
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 border border-gray-200 rounded bg-gray-50">
                          <span className="text-sm text-gray-700">
                            Firewall Status
                          </span>
                          <Badge
                            variant="default"
                            className="bg-green-600 text-white"
                          >
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 border border-gray-200 rounded bg-gray-50">
                          <span className="text-sm text-gray-700">
                            Intrusion Detection
                          </span>
                          <Badge
                            variant="default"
                            className="bg-green-600 text-white"
                          >
                            Enabled
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Keys Management */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-orange-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                      <Key className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        API Keys & Webhooks
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Manage API access keys and webhook endpoints
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      Platform API Key
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toast.success("API key copied to clipboard")
                        }
                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success("New API key generated")}
                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="font-mono text-sm bg-gray-50 p-3 rounded border border-gray-200">
                    {showApiKey
                      ? "pk_live_51234567890abcdef..."
                      : "••••••••••••••••••••••••••••••••"}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Webhook Endpoints
                    </h4>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Webhook
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div>
                        <p className="font-medium text-gray-900">
                          Payment Events
                        </p>
                        <p className="text-sm text-gray-600">
                          https://api.contrezz.com/webhooks/payments
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="default"
                          className="bg-green-600 text-white"
                        >
                          Active
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div>
                        <p className="font-medium text-gray-900">User Events</p>
                        <p className="text-sm text-gray-600">
                          https://api.contrezz.com/webhooks/users
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="default"
                          className="bg-green-600 text-white"
                        >
                          Active
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Logs */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 border-b border-gray-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-500 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Security Audit Logs
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Recent security-related activities and changes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50">
                        <TableHead className="font-semibold text-gray-900">
                          Action
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          User
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Timestamp
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          IP Address
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Details
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow
                          key={log.id}
                          className="hover:bg-gray-50/50 transition-colors duration-200"
                        >
                          <TableCell className="font-medium text-gray-900">
                            {log.action}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {log.user}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {log.ipAddress}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-gray-700">
                            {log.details}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6 mt-0 p-6">
            {/* Integration Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Connected
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {
                        integrations.filter((i) => i.status === "connected")
                          .length
                      }
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Active integrations
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Pending
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg shadow-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                      {
                        integrations.filter((i) => i.status === "pending")
                          .length
                      }
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Awaiting setup</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Available
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <Network className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      12
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Total available
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Last Sync
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                      <RefreshCw className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      2m ago
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Most recent sync
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Integrations List */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <Network className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Third-Party Integrations
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Manage connections with external services
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
                        <TableHead className="font-semibold text-gray-900">
                          Service
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Type
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Last Sync
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          API Version
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {integrations.map((integration) => (
                        <TableRow
                          key={integration.id}
                          className="hover:bg-blue-50/50 transition-colors duration-200"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {getIntegrationIcon(integration.type)}
                              <span className="font-medium text-gray-900">
                                {integration.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize text-gray-700">
                            {integration.type.replace("-", " ")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(integration.status)}
                              <Badge
                                variant={getStatusBadge(integration.status)}
                              >
                                {integration.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {integration.lastSync
                              ? new Date(integration.lastSync).toLocaleString()
                              : "Never"}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {integration.apiVersion}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  if ((integration as any).isPaystack) {
                                    setShowPaystackDialog(true);
                                  } else if (
                                    (integration as any).isMonicredit
                                  ) {
                                    setShowMonicreditDialog(true);
                                  } else {
                                    toast.info(`Configure ${integration.name}`);
                                  }
                                }}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  if ((integration as any).isPaystack) {
                                    loadPaystackConfig();
                                    toast.success(
                                      "Paystack configuration refreshed"
                                    );
                                  } else if (
                                    (integration as any).isMonicredit
                                  ) {
                                    loadMonicreditConfig();
                                    toast.success(
                                      "Monicredit configuration refreshed"
                                    );
                                  } else {
                                    toast.info(`Refresh ${integration.name}`);
                                  }
                                }}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              {integration.status === "connected" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                  onClick={() => {
                                    if (
                                      (integration as any).isPaystack &&
                                      paystackConfig
                                    ) {
                                      // Copy webhook URL
                                      navigator.clipboard.writeText(
                                        integration.webhookUrl
                                      );
                                      toast.success(
                                        "Webhook URL copied to clipboard"
                                      );
                                    } else if (
                                      (integration as any).isMonicredit &&
                                      monicreditConfig
                                    ) {
                                      // Show webhook URL and verify token
                                      const webhookInfo = `Webhook URL: ${
                                        integration.webhookUrl
                                      }\nVerify Token: ${
                                        monicreditConfig.verifyToken ||
                                        "Not set"
                                      }`;
                                      navigator.clipboard.writeText(
                                        webhookInfo
                                      );
                                      toast.success(
                                        "Webhook information copied to clipboard"
                                      );
                                    } else {
                                      toast.info(
                                        `View ${integration.name} details`
                                      );
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Monicredit Configuration Dialog */}
            <Dialog
              open={showMonicreditDialog}
              onOpenChange={setShowMonicreditDialog}
            >
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    Configure Monicredit Payment Gateway
                  </DialogTitle>
                  <DialogDescription>
                    Configure Monicredit for platform-level subscription
                    payments
                  </DialogDescription>
                </DialogHeader>

                {loadingMonicredit ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-gray-600">
                      Loading configuration...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    {/* Provider Info */}
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Monicredit
                          </h4>
                          <p className="text-sm text-gray-600">
                            Platform-level configuration for subscription
                            payments
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          monicreditConfig?.isEnabled ? "default" : "secondary"
                        }
                      >
                        {monicreditConfig?.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <Label
                          htmlFor="enable-monicredit"
                          className="text-base font-semibold"
                        >
                          Enable Monicredit
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Allow subscription payments via Monicredit
                        </p>
                      </div>
                      <Switch
                        id="enable-monicredit"
                        checked={monicreditConfig?.isEnabled || false}
                        onCheckedChange={(checked) =>
                          setMonicreditConfig({
                            ...(monicreditConfig || {
                              provider: "monicredit",
                              isEnabled: false,
                              testMode: false,
                              publicKey: null,
                              privateKey: null,
                              merchantId: null,
                              verifyToken: null,
                            }),
                            isEnabled: checked,
                          })
                        }
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>

                    {/* Test Mode Toggle */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <Label
                          htmlFor="test-mode"
                          className="text-base font-semibold"
                        >
                          Test Mode
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Use Monicredit sandbox environment
                        </p>
                      </div>
                      <Switch
                        id="test-mode"
                        checked={monicreditConfig?.testMode || false}
                        onCheckedChange={(checked) =>
                          setMonicreditConfig({
                            ...(monicreditConfig || {
                              provider: "monicredit",
                              isEnabled: false,
                              testMode: false,
                              publicKey: null,
                              privateKey: null,
                              merchantId: null,
                              verifyToken: null,
                            }),
                            testMode: checked,
                          })
                        }
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>

                    {/* Configuration Fields */}
                    {monicreditConfig?.isEnabled && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <Label
                            htmlFor="public-key"
                            className="text-sm font-semibold"
                          >
                            Public Key <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="public-key"
                            type="text"
                            placeholder="Enter Monicredit public key"
                            value={monicreditConfig?.publicKey || ""}
                            onChange={(e) =>
                              setMonicreditConfig({
                                ...(monicreditConfig || {
                                  provider: "monicredit",
                                  isEnabled: true,
                                  testMode: false,
                                  publicKey: null,
                                  privateKey: null,
                                  merchantId: null,
                                  verifyToken: null,
                                }),
                                publicKey: e.target.value,
                              })
                            }
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="private-key"
                            className="text-sm font-semibold"
                          >
                            Private Key <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative mt-2">
                            <Input
                              id="private-key"
                              type={showPrivateKey ? "text" : "password"}
                              placeholder="Enter Monicredit private key"
                              value={monicreditConfig?.privateKey || ""}
                              onChange={(e) =>
                                setMonicreditConfig({
                                  ...(monicreditConfig || {
                                    provider: "monicredit",
                                    isEnabled: true,
                                    testMode: false,
                                    publicKey: null,
                                    privateKey: null,
                                    merchantId: null,
                                    verifyToken: null,
                                  }),
                                  privateKey: e.target.value,
                                })
                              }
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPrivateKey(!showPrivateKey)}
                            >
                              {showPrivateKey ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor="merchant-id"
                            className="text-sm font-semibold"
                          >
                            Merchant ID (Optional)
                          </Label>
                          <Input
                            id="merchant-id"
                            type="text"
                            placeholder="Enter merchant ID if required"
                            value={monicreditConfig?.merchantId || ""}
                            onChange={(e) =>
                              setMonicreditConfig({
                                ...(monicreditConfig || {
                                  provider: "monicredit",
                                  isEnabled: true,
                                  testMode: false,
                                  publicKey: null,
                                  privateKey: null,
                                  merchantId: null,
                                  verifyToken: null,
                                }),
                                merchantId: e.target.value,
                              })
                            }
                            className="mt-2"
                          />
                        </div>

                        {monicreditConfig?.verifyToken && (
                          <div>
                            <Label className="text-sm font-semibold">
                              Webhook Verify Token
                            </Label>
                            <div className="flex items-center gap-2 mt-2">
                              <Input
                                type="text"
                                value={monicreditConfig.verifyToken}
                                readOnly
                                className="font-mono text-xs"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    monicreditConfig.verifyToken || ""
                                  );
                                  toast.success(
                                    "Verify token copied to clipboard"
                                  );
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Use this token to verify webhook requests from
                              Monicredit
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMonicreditDialog(false);
                      loadMonicreditConfig();
                    }}
                    disabled={savingMonicredit}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (monicreditConfig) {
                        handleSaveMonicredit(monicreditConfig);
                      }
                    }}
                    disabled={savingMonicredit || loadingMonicredit}
                    className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                  >
                    {savingMonicredit ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Paystack Configuration Dialog */}
            <Dialog
              open={showPaystackDialog}
              onOpenChange={setShowPaystackDialog}
            >
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Configure Paystack Payment Gateway
                  </DialogTitle>
                  <DialogDescription>
                    Configure Paystack for platform-level subscription payments
                  </DialogDescription>
                </DialogHeader>

                {loadingPaystack ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
                    <span className="ml-2 text-gray-600">
                      Loading configuration...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    {/* Provider Info */}
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CreditCard className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Paystack
                          </h4>
                          <p className="text-sm text-gray-600">
                            Platform-level configuration for subscription
                            payments
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          paystackConfig?.isEnabled ? "default" : "secondary"
                        }
                      >
                        {paystackConfig?.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <Label
                          htmlFor="enable-paystack"
                          className="text-base font-semibold"
                        >
                          Enable Paystack
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Allow subscription payments via Paystack
                        </p>
                      </div>
                      <Switch
                        id="enable-paystack"
                        checked={paystackConfig?.isEnabled || false}
                        onCheckedChange={(checked) =>
                          setPaystackConfig({
                            ...(paystackConfig || {
                              provider: "paystack",
                              isEnabled: false,
                              testMode: false,
                              publicKey: null,
                              secretKey: null,
                            }),
                            isEnabled: checked,
                          })
                        }
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>

                    {/* Test Mode Toggle */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <Label
                          htmlFor="paystack-test-mode"
                          className="text-base font-semibold"
                        >
                          Test Mode
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Use Paystack test environment
                        </p>
                      </div>
                      <Switch
                        id="paystack-test-mode"
                        checked={paystackConfig?.testMode || false}
                        onCheckedChange={(checked) =>
                          setPaystackConfig({
                            ...(paystackConfig || {
                              provider: "paystack",
                              isEnabled: false,
                              testMode: false,
                              publicKey: null,
                              secretKey: null,
                            }),
                            testMode: checked,
                          })
                        }
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>

                    {/* Configuration Fields */}
                    {paystackConfig?.isEnabled && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <Label
                            htmlFor="paystack-public-key"
                            className="text-sm font-semibold"
                          >
                            Public Key <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="paystack-public-key"
                            type="text"
                            placeholder="Enter Paystack public key (pk_live_... or pk_test_...)"
                            value={paystackConfig?.publicKey || ""}
                            onChange={(e) =>
                              setPaystackConfig({
                                ...(paystackConfig || {
                                  provider: "paystack",
                                  isEnabled: true,
                                  testMode: false,
                                  publicKey: null,
                                  secretKey: null,
                                }),
                                publicKey: e.target.value,
                              })
                            }
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="paystack-secret-key"
                            className="text-sm font-semibold"
                          >
                            Secret Key <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative mt-2">
                            <Input
                              id="paystack-secret-key"
                              type={showSecretKey ? "text" : "password"}
                              placeholder="Enter Paystack secret key (sk_live_... or sk_test_...)"
                              value={paystackConfig?.secretKey || ""}
                              onChange={(e) =>
                                setPaystackConfig({
                                  ...(paystackConfig || {
                                    provider: "paystack",
                                    isEnabled: true,
                                    testMode: false,
                                    publicKey: null,
                                    secretKey: null,
                                  }),
                                  secretKey: e.target.value,
                                })
                              }
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowSecretKey(!showSecretKey)}
                            >
                              {showSecretKey ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-semibold">
                            Webhook URL
                          </Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="text"
                              value="https://api.app.contrezz.com/api/paystack/webhook"
                              readOnly
                              className="font-mono text-xs bg-gray-100"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  "https://api.app.contrezz.com/api/paystack/webhook"
                                );
                                toast.success(
                                  "Webhook URL copied to clipboard"
                                );
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Configure this URL in your Paystack dashboard for
                            webhook notifications
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPaystackDialog(false);
                      loadPaystackConfig();
                    }}
                    disabled={savingPaystack}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (paystackConfig) {
                        handleSavePaystack(paystackConfig);
                      }
                    }}
                    disabled={savingPaystack || loadingPaystack}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {savingPaystack ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Integration Configuration */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Add New Integration
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Connect additional third-party services
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-6 border border-gray-200 rounded-lg text-center hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg w-fit mx-auto mb-3">
                      <CreditCard className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900">PayPal</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Alternative payment processing
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      Connect
                    </Button>
                  </div>

                  <div className="p-6 border border-gray-200 rounded-lg text-center hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg w-fit mx-auto mb-3">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900">Yardi</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Property management sync
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-green-200 text-green-700 hover:bg-green-50"
                    >
                      Connect
                    </Button>
                  </div>

                  <div className="p-6 border border-gray-200 rounded-lg text-center hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg w-fit mx-auto mb-3">
                      <Bell className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900">Slack</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Team notifications
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      Connect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-0 p-6">
            {/* Notification Preferences */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 border-b border-yellow-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Notification Settings
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Configure platform-wide notification preferences
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                    <div>
                      <Label className="text-gray-700 font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-600">
                        Send notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            emailNotifications: checked,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                    <div>
                      <Label className="text-gray-700 font-medium">
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-gray-600">
                        Send notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.smsNotifications}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            smsNotifications: checked,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                    <div>
                      <Label className="text-gray-700 font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-gray-600">
                        Send push notifications to mobile apps
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.pushNotifications}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            pushNotifications: checked,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Notification Types
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Maintenance Alerts
                        </Label>
                        <p className="text-sm text-gray-600">
                          System maintenance notifications
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.maintenanceAlerts}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              maintenanceAlerts: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Billing Alerts
                        </Label>
                        <p className="text-sm text-gray-600">
                          Payment and billing notifications
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.billingAlerts}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              billingAlerts: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Security Alerts
                        </Label>
                        <p className="text-sm text-gray-600">
                          Security-related notifications
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.securityAlerts}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              securityAlerts: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          System Updates
                        </Label>
                        <p className="text-sm text-gray-600">
                          Feature updates and announcements
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.systemUpdates}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              systemUpdates: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => handleSaveSettings("Notifications")}
                    className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SMTP Configuration */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        SMTP Configuration
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Configure email server settings for sending
                        notifications
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">
                        SMTP Connected
                      </p>
                      <p className="text-sm text-green-700">
                        Email server is configured and working
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={smtpTesting}
                    onClick={() => {
                      setSmtpTesting(true);
                      setTimeout(() => {
                        setSmtpTesting(false);
                        toast.success(
                          "Test email sent successfully to " +
                            settings.smtp.fromEmail
                        );
                      }, 2000);
                    }}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    {smtpTesting ? "Testing..." : "Test Connection"}
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="smtp-host"
                        className="text-gray-700 font-medium"
                      >
                        SMTP Host
                      </Label>
                      <Input
                        id="smtp-host"
                        placeholder="smtp.gmail.com"
                        value={settings.smtp.host}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            smtp: { ...prev.smtp, host: e.target.value },
                          }))
                        }
                        className="mt-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="smtp-port"
                        className="text-gray-700 font-medium"
                      >
                        SMTP Port
                      </Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        placeholder="587"
                        value={settings.smtp.port}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            smtp: {
                              ...prev.smtp,
                              port: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="mt-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="smtp-username"
                        className="text-gray-700 font-medium"
                      >
                        SMTP Username
                      </Label>
                      <Input
                        id="smtp-username"
                        type="email"
                        placeholder="noreply@contrezz.com"
                        value={settings.smtp.username}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            smtp: { ...prev.smtp, username: e.target.value },
                          }))
                        }
                        className="mt-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="smtp-password"
                        className="text-gray-700 font-medium"
                      >
                        SMTP Password
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="smtp-password"
                          type={showSmtpPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={settings.smtp.password}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              smtp: { ...prev.smtp, password: e.target.value },
                            }))
                          }
                          className="pr-10 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                        >
                          {showSmtpPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="smtp-encryption"
                        className="text-gray-700 font-medium"
                      >
                        Encryption
                      </Label>
                      <Select
                        value={settings.smtp.encryption}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            smtp: { ...prev.smtp, encryption: value },
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TLS">TLS (Recommended)</SelectItem>
                          <SelectItem value="SSL">SSL</SelectItem>
                          <SelectItem value="NONE">
                            None (Not recommended)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="smtp-from-email"
                        className="text-gray-700 font-medium"
                      >
                        From Email Address
                      </Label>
                      <Input
                        id="smtp-from-email"
                        type="email"
                        placeholder="noreply@contrezz.com"
                        value={settings.smtp.fromEmail}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            smtp: { ...prev.smtp, fromEmail: e.target.value },
                          }))
                        }
                        className="mt-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="smtp-from-name"
                        className="text-gray-700 font-medium"
                      >
                        From Name
                      </Label>
                      <Input
                        id="smtp-from-name"
                        placeholder="Contrezz"
                        value={settings.smtp.fromName}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            smtp: { ...prev.smtp, fromName: e.target.value },
                          }))
                        }
                        className="mt-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Common SMTP Ports
                      </h4>
                      <div className="space-y-1 text-sm text-blue-700">
                        <p>• Port 587: TLS (Recommended)</p>
                        <p>• Port 465: SSL</p>
                        <p>• Port 25: Unencrypted</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Popular SMTP Providers
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <h5 className="font-medium text-gray-900 mb-1">Gmail</h5>
                      <p className="text-xs text-gray-600">
                        smtp.gmail.com:587
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <h5 className="font-medium text-gray-900 mb-1">
                        SendGrid
                      </h5>
                      <p className="text-xs text-gray-600">
                        smtp.sendgrid.net:587
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <h5 className="font-medium text-gray-900 mb-1">
                        Mailgun
                      </h5>
                      <p className="text-xs text-gray-600">
                        smtp.mailgun.org:587
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast.info("Configuration reset to defaults")
                    }
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Reset to Defaults
                  </Button>
                  <Button
                    onClick={() => handleSaveSettings("SMTP")}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save SMTP Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Customize email notification templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Welcome Email</h4>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Sent to new users upon registration
                      </p>
                      <Badge variant="default" className="mt-2">
                        Active
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Password Reset</h4>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Password reset instructions
                      </p>
                      <Badge variant="default" className="mt-2">
                        Active
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Payment Receipt</h4>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Payment confirmation email
                      </p>
                      <Badge variant="default" className="mt-2">
                        Active
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Maintenance Alert</h4>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        System maintenance notifications
                      </p>
                      <Badge variant="default" className="mt-2">
                        Active
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Template
                    </Button>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6 mt-0 p-6">
            {/* Payment Configuration */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Payment Configuration
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Configure payment processing and billing settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="payment-processor"
                        className="text-gray-700 font-medium"
                      >
                        Payment Processor
                      </Label>
                      <Select
                        value={settings.billing.paymentProcessor}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            billing: {
                              ...prev.billing,
                              paymentProcessor: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2 focus:border-green-500 focus:ring-green-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe">Stripe</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="webhook-url"
                        className="text-gray-700 font-medium"
                      >
                        Webhook URL
                      </Label>
                      <Input
                        id="webhook-url"
                        value={settings.billing.webhookUrl}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            billing: {
                              ...prev.billing,
                              webhookUrl: e.target.value,
                            },
                          }))
                        }
                        className="mt-2 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="grace-period"
                        className="text-gray-700 font-medium"
                      >
                        Grace Period (days)
                      </Label>
                      <Input
                        id="grace-period"
                        type="number"
                        value={settings.billing.gracePeriod}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            billing: {
                              ...prev.billing,
                              gracePeriod: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="mt-2 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Tax Calculation
                        </Label>
                        <p className="text-sm text-gray-600">
                          Automatically calculate taxes
                        </p>
                      </div>
                      <Switch
                        checked={settings.billing.taxCalculation}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            billing: {
                              ...prev.billing,
                              taxCalculation: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Auto Suspend
                        </Label>
                        <p className="text-sm text-gray-600">
                          Suspend accounts for non-payment
                        </p>
                      </div>
                      <Switch
                        checked={settings.billing.autoSuspend}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            billing: { ...prev.billing, autoSuspend: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Proration Enabled
                        </Label>
                        <p className="text-sm text-gray-600">
                          Prorate charges for plan changes
                        </p>
                      </div>
                      <Switch
                        checked={settings.billing.prorationEnabled}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            billing: {
                              ...prev.billing,
                              prorationEnabled: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => handleSaveSettings("Billing")}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Plans section removed; manage plans in Billing & Plans */}

            {/* Payment Methods */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                      <Banknote className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Payment Methods</CardTitle>
                      <CardDescription className="mt-1">
                        Configure accepted payment methods
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                      <span className="text-gray-900 font-medium">
                        Credit Cards
                      </span>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <Banknote className="h-4 w-4 text-purple-600" />
                      <span className="text-gray-900 font-medium">
                        ACH/Bank Transfer
                      </span>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <Receipt className="h-4 w-4 text-purple-600" />
                      <span className="text-gray-900 font-medium">
                        Wire Transfer
                      </span>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6 mt-0 p-6">
            {/* System Performance */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      System Uptime
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {systemMetrics.uptime}%
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Last 30 days</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Active Users
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {systemMetrics.activeUsers.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Currently online
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      API Calls
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      {systemMetrics.apiCalls.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Last 24 hours</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Storage Used
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg">
                      <HardDrive className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {systemMetrics.storageUsed}TB
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Of 10TB allocated
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* System Configuration */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 border-b border-gray-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-500 rounded-lg">
                      <Server className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        System Configuration
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Technical system settings and parameters
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="max-file-size"
                        className="text-gray-700 font-medium"
                      >
                        Max File Upload Size (MB)
                      </Label>
                      <Input
                        id="max-file-size"
                        type="number"
                        defaultValue="50"
                        className="mt-2 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="cache-duration"
                        className="text-gray-700 font-medium"
                      >
                        Cache Duration (hours)
                      </Label>
                      <Input
                        id="cache-duration"
                        type="number"
                        defaultValue="24"
                        className="mt-2 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="backup-frequency"
                        className="text-gray-700 font-medium"
                      >
                        Backup Frequency
                      </Label>
                      <Select defaultValue="daily">
                        <SelectTrigger className="mt-2 focus:border-gray-500 focus:ring-gray-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="log-retention"
                        className="text-gray-700 font-medium"
                      >
                        Log Retention (days)
                      </Label>
                      <Input
                        id="log-retention"
                        type="number"
                        defaultValue="90"
                        className="mt-2 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="concurrent-users"
                        className="text-gray-700 font-medium"
                      >
                        Max Concurrent Users
                      </Label>
                      <Input
                        id="concurrent-users"
                        type="number"
                        defaultValue="5000"
                        className="mt-2 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="database-pool"
                        className="text-gray-700 font-medium"
                      >
                        Database Connection Pool
                      </Label>
                      <Input
                        id="database-pool"
                        type="number"
                        defaultValue="20"
                        className="mt-2 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Flags */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Feature Flags</CardTitle>
                      <CardDescription className="mt-1">
                        Enable or disable platform features
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Advanced Analytics
                        </Label>
                        <p className="text-sm text-gray-600">
                          Enable advanced analytics features
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Mobile Push Notifications
                        </Label>
                        <p className="text-sm text-gray-600">
                          Enable mobile push notifications
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          AI-Powered Insights
                        </Label>
                        <p className="text-sm text-gray-600">
                          Enable AI features (beta)
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Multi-Language Support
                        </Label>
                        <p className="text-sm text-gray-600">
                          Enable multiple language options
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-gray-600">
                          Enable dark mode interface
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Real-time Chat Support</Label>
                        <p className="text-sm text-gray-600">
                          Enable live chat widget
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Maintenance */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <Wrench className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        System Maintenance
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Manage system maintenance and updates
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Last Backup
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(systemMetrics.lastBackup).toLocaleString()}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Next Maintenance
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(
                          systemMetrics.nextMaintenance
                        ).toLocaleString()}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Database Size: {systemMetrics.databaseSize}GB
                      </h4>
                      <p className="text-sm text-gray-600">
                        Current database storage usage
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Optimize
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6 mt-0 p-6">
            {/* Compliance Overview */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      GDPR Compliance
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Compliant
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Last audit: Mar 1, 2024
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      SOC 2 Compliance
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Certified
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Valid until Dec 2024
                    </p>
                  </CardContent>
                </div>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Data Retention
                    </CardTitle>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                      <Archive className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      365 days
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Current policy</p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Legal Documents */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Legal Documents</CardTitle>
                      <CardDescription className="mt-1">
                        Manage terms of service, privacy policy, and legal
                        agreements
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Terms of Service
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Last updated: March 1, 2024
                      </p>
                      <Badge
                        variant="default"
                        className="mt-2 bg-blue-600 text-white"
                      >
                        Version 2.1
                      </Badge>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Privacy Policy
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Last updated: February 15, 2024
                      </p>
                      <Badge
                        variant="default"
                        className="mt-2 bg-blue-600 text-white"
                      >
                        Version 3.0
                      </Badge>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Cookie Policy
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Last updated: January 10, 2024
                      </p>
                      <Badge
                        variant="default"
                        className="mt-2 bg-blue-600 text-white"
                      >
                        Version 1.2
                      </Badge>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Data Processing Agreement
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Last updated: March 5, 2024
                      </p>
                      <Badge
                        variant="default"
                        className="mt-2 bg-blue-600 text-white"
                      >
                        Version 1.0
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 border-b border-gray-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-500 rounded-lg">
                      <Database className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Data Management</CardTitle>
                      <CardDescription className="mt-1">
                        Configure data retention, deletion, and export policies
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="data-retention-period"
                        className="text-gray-700 font-medium"
                      >
                        Data Retention Period (days)
                      </Label>
                      <Input
                        id="data-retention-period"
                        type="number"
                        defaultValue="365"
                        className="mt-2 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="backup-retention"
                        className="text-gray-700 font-medium"
                      >
                        Backup Retention (days)
                      </Label>
                      <Input
                        id="backup-retention"
                        type="number"
                        defaultValue="90"
                        className="mt-2 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Auto-delete Inactive Accounts
                        </Label>
                        <p className="text-sm text-gray-600">
                          Delete accounts inactive for 2+ years
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Enable Data Export
                        </Label>
                        <p className="text-sm text-gray-600">
                          Allow users to export their data
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label className="text-gray-700 font-medium">
                          Anonymize Deleted Data
                        </Label>
                        <p className="text-sm text-gray-600">
                          Anonymize data instead of deletion
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <div>
                        <Label>Right to be Forgotten</Label>
                        <p className="text-sm text-gray-600">
                          Enable GDPR deletion requests
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Reports */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Compliance Reports
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Generate compliance reports and audit trails
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-6 border border-gray-200 rounded-lg text-center hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg w-fit mx-auto mb-3">
                      <Scale className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900">GDPR Report</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Data processing activities
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>

                  <div className="p-6 border border-gray-200 rounded-lg text-center hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg w-fit mx-auto mb-3">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900">SOC 2 Report</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Security controls audit
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>

                  <div className="p-6 border border-gray-200 rounded-lg text-center hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg w-fit mx-auto mb-3">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900">Audit Trail</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      System access and changes
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new user role with specific permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="role-name"
                  placeholder="e.g., Property Manager, Accountant"
                  value={newRole.name}
                  onChange={(e) =>
                    setNewRole((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="role-description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="role-description"
                  placeholder="Describe the responsibilities and scope of this role"
                  value={newRole.description}
                  onChange={(e) =>
                    setNewRole((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-semibold">
                Permissions <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-gray-600 mb-4">
                Select the permissions this role should have
              </p>

              <div className="space-y-4">
                {[
                  "Properties",
                  "Tenants",
                  "Payments",
                  "Reports",
                  "Maintenance",
                  "Users",
                  "Settings",
                ].map((category) => (
                  <div key={category} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availablePermissions
                        .filter((p) => p.category === category)
                        .map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={permission.id}
                              checked={newRole.permissions.includes(
                                permission.id
                              )}
                              onCheckedChange={() =>
                                togglePermission(permission.id)
                              }
                            />
                            <Label
                              htmlFor={permission.id}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {newRole.permissions.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    {newRole.permissions.length} permission
                    {newRole.permissions.length !== 1 ? "s" : ""} selected
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddRoleDialog(false);
                setNewRole({ name: "", description: "", permissions: [] });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddRole}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
