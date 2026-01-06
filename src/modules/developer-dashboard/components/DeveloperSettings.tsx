import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import { Separator } from "../../../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Progress } from "../../../components/ui/progress";
import { TeamManagementTab } from "./TeamManagementTab";
import { NotificationPreferencesTab } from "./NotificationPreferences";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Users,
  Mail,
  Save,
  Upload,
  Globe,
  Crown,
  TrendingUp,
  HardDrive,
  AlertCircle,
  Lock,
  Key,
  Settings,
  Loader2,
  Receipt,
  Plug,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";
import {
  getAccountInfo,
  changePassword,
  type ChangePasswordRequest,
  initializeTwoFactor,
  verifyTwoFactorSetup,
  disableTwoFactor,
} from "../../../lib/api/auth";
import { getSubscriptionStatus } from "../../../lib/api/subscription";
import { formatCurrency as formatCurrencyUtil } from "../../../lib/currency";
import { apiClient } from "../../../lib/api-client";
import {
  getSubscriptionPlans,
  changePlan,
  changeBillingCycle,
  cancelSubscription,
  getBillingHistory,
  initializeUpgrade,
  verifyUpgrade,
  type Plan,
  type Invoice,
} from "../../../lib/api/subscriptions";
import { updateProfile, updateOrganization } from "../../../lib/api/settings";
import PaymentMethodsManager from "../../../components/PaymentMethodsManager";
import { getPaymentGatewayStatus } from "../../../lib/api/system";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

interface DeveloperSettingsProps {
  user?: any;
  showOnlyProfile?: boolean;
}

export function DeveloperSettings({
  user,
  showOnlyProfile = false,
}: DeveloperSettingsProps) {
  // Get active tab from URL and store in state
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("tab") || "organization";
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [billingHistory, setBillingHistory] = useState<Invoice[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [showChangeBillingDialog, setShowChangeBillingDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [newBillingCycle, setNewBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [cancelReason, setCancelReason] = useState("");
  const [cancelConfirmation, setCancelConfirmation] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Two-Factor Authentication state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
  const [twoFactorDisableDialogOpen, setTwoFactorDisableDialogOpen] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    secret: string;
    otpauthUrl: string;
    qrCode: string;
  }>({
    secret: "",
    otpauthUrl: "",
    qrCode: "",
  });
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState("");
  const [twoFactorDisablePassword, setTwoFactorDisablePassword] = useState("");
  const [initializingTwoFactor, setInitializingTwoFactor] = useState(false);
  const [twoFactorDialogLoading, setTwoFactorDialogLoading] = useState(false);
  const [disableTwoFactorLoading, setDisableTwoFactorLoading] = useState(false);

  // Storage quota state
  const [storageQuota, setStorageQuota] = useState<any>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);

  // Payment gateway status state
  const [paystackConfig, setPaystackConfig] = useState<{ isEnabled: boolean; testMode: boolean } | null>(null);
  const [monicreditConfig, setMonicreditConfig] = useState<{ isEnabled: boolean; testMode: boolean } | null>(null);
  const [loadingGateways, setLoadingGateways] = useState(true);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Organization form state
  const [organizationData, setOrganizationData] = useState({
    company: "",
    organizationType: "developer",
    taxId: "",
    licenseNumber: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    website: "",
  });
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);

  useEffect(() => {
    fetchAccountData();
    fetchPlans();
    fetchBillingHistory();
    fetchStorageQuota();
    fetchPaymentGateways();
  }, []);

  // Set up periodic refresh for storage quota when storage tab is active
  useEffect(() => {
    if (activeTab === "storage") {
      const interval = setInterval(() => {
        fetchStorageQuota();
      }, 30000); // Refresh every 30 seconds

      return () => {
        clearInterval(interval);
      };
    }
  }, [activeTab]);

  // Refresh storage quota when window regains focus (if storage tab is active)
  useEffect(() => {
    if (activeTab === "storage") {
      const handleFocus = () => {
        fetchStorageQuota();
      };

      window.addEventListener("focus", handleFocus);

      return () => {
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [activeTab]);

  // Listen to document events to refresh storage quota when documents are uploaded/deleted
  useEffect(() => {
    if (activeTab === "storage") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { initializeSocket } = require("../../../lib/socket");
          initializeSocket(token);
        } catch (e) {
          console.warn("Socket init failed for storage updates:", e);
        }
      }

      const handleDocumentUpdate = (data: {
        documentId: string;
        action: string;
        reason?: string;
        timestamp: string;
      }) => {
        // Refresh storage quota when documents are uploaded, updated, or deleted
        if (data.action === "updated" || data.action === "removed" || data.action === "deleted") {
          console.log("[Storage] Document event received, refreshing storage quota:", data.action);
          fetchStorageQuota();
        }
      };

      const handleDocumentDeleted = (data: { documentId: string; timestamp: string }) => {
        console.log("[Storage] Document deleted, refreshing storage quota");
        fetchStorageQuota();
      };

      try {
        const {
          subscribeToDocumentEvents,
          unsubscribeFromDocumentEvents,
        } = require("../../../lib/socket");
        subscribeToDocumentEvents({
          onUpdated: handleDocumentUpdate,
          onDeleted: handleDocumentDeleted,
        });

        // Also listen to custom browser events for storage updates
        const handleStorageUpdate = () => {
          console.log("[Storage] Storage update event received, refreshing quota");
          fetchStorageQuota();
        };

        window.addEventListener("storage:updated", handleStorageUpdate);

        return () => {
          unsubscribeFromDocumentEvents();
          window.removeEventListener("storage:updated", handleStorageUpdate);
        };
      } catch (e) {
        console.warn("Failed to subscribe to document events:", e);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    // Check for payment callback
    const urlParams = new URLSearchParams(window.location.search);
    const reference =
      urlParams.get("reference") || sessionStorage.getItem("upgrade_reference");
    const paymentCallback = urlParams.get("payment_callback");

    // Handle upgrade payment callback
    if (reference && (paymentCallback === "upgrade" || window.location.pathname.includes("/upgrade/callback"))) {
      handlePaymentCallback(reference);
    }

    // Handle browser back/forward navigation and programmatic URL changes
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab") || "organization";
      if (tab !== activeTab) {
        console.log(
          "[DeveloperSettings] URL tab changed, switching to tab:",
          tab
        );
        setActiveTab(tab);
      }
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener("popstate", handleUrlChange);

    // Also listen for pushstate/replacestate (custom navigation)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      setTimeout(handleUrlChange, 0);
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(window.history, args);
      setTimeout(handleUrlChange, 0);
    };

    // Check initial URL on mount
    handleUrlChange();

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [activeTab]);

  const handlePaymentCallback = async (reference: string) => {
    try {
      console.log(
        "[DeveloperSettings] Verifying payment with reference:",
        reference
      );
      toast.info("Verifying payment...");

      const response = await verifyUpgrade(reference);
      console.log("[DeveloperSettings] Verification response:", response.data);

      if (response.data?.success) {
        // Clear stored reference
        sessionStorage.removeItem("upgrade_reference");
        sessionStorage.removeItem("upgrade_plan_id");

        const customer = response.data.customer;
        const limits = customer.limits;

        console.log(
          "[DeveloperSettings] Upgrade successful! New limits:",
          limits
        );

        // Show success message with new plan details
        toast.success(
          `Plan upgraded successfully! You now have ${
            limits.projects || limits.properties || 0
          } ${limits.projects ? "projects" : "properties"} and ${
            limits.users
          } users.`
        );

        // Refresh data and stay on billing tab
        setTimeout(async () => {
          console.log("[DeveloperSettings] Refreshing data...");
          setActiveTab("billing");
          const url = new URL(window.location.href);
          url.searchParams.set("tab", "billing");
          url.searchParams.delete("reference"); // Remove reference from URL
          window.history.replaceState({}, "", url.toString());

          // Refresh all data
          await fetchAccountData();
          await fetchPlans();
          await fetchBillingHistory();
        }, 2000);
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error: any) {
      console.error("[DeveloperSettings] Payment verification error:", error);
      toast.error(error.response?.data?.error || "Failed to verify payment");

      // Clear stored reference and clean up URL
      sessionStorage.removeItem("upgrade_reference");
      sessionStorage.removeItem("upgrade_plan_id");

      const url = new URL(window.location.href);
      url.searchParams.delete("reference");
      url.searchParams.delete("payment_callback");
      url.searchParams.set("tab", "billing");
      window.history.replaceState({}, "", url.toString());

      // Switch to billing tab to show error
      setActiveTab("billing");
    }
  };

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const [acctResponse, subResponse] = await Promise.all([
        getAccountInfo(),
        getSubscriptionStatus(),
      ]);

      if (acctResponse.data) {
        console.log("[DeveloperSettings] Account info loaded:", {
          plan: acctResponse.data.customer?.plan?.name,
          projectLimit: acctResponse.data.customer?.projectLimit,
          userLimit: acctResponse.data.customer?.plan?.userLimit,
        });
        setAccountInfo(acctResponse.data);

        // Set 2FA status
        const twoFactorStatus = acctResponse.data.user?.twoFactorEnabled ?? false;
        console.log("[DeveloperSettings] 2FA status from API:", {
          twoFactorEnabled: twoFactorStatus,
          userData: acctResponse.data.user,
        });
        setTwoFactorEnabled(twoFactorStatus);

        // Initialize profile form data
        const fullName = acctResponse.data.user?.name || user?.name || "";
        const nameParts = fullName.split(" ");
        setProfileData({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: acctResponse.data.user?.email || user?.email || "",
          phone:
            acctResponse.data.user?.phone ||
            acctResponse.data.customer?.phone ||
            "",
          bio: acctResponse.data.user?.bio || "",
        });

        // Initialize organization form data
        setOrganizationData({
          company: acctResponse.data.customer?.company || user?.company || "",
          organizationType: "developer", // Default, can be updated
          taxId: acctResponse.data.customer?.taxId || "",
          licenseNumber: acctResponse.data.customer?.licenseNumber || "",
          street: acctResponse.data.customer?.street || "",
          city: acctResponse.data.customer?.city || "",
          state: acctResponse.data.customer?.state || "",
          postalCode:
            acctResponse.data.customer?.postalCode ||
            acctResponse.data.customer?.zipCode ||
            "",
          website: acctResponse.data.customer?.website || "",
        });
      }

      if (subResponse.data) {
        console.log("[DeveloperSettings] Subscription loaded:", {
          plan: subResponse.data.plan?.name,
          status: subResponse.data.status,
        });
        setSubscription(subResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch account data:", error);
      toast.error("Failed to load account information");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await getSubscriptionPlans();
      if (response.data?.plans) {
        setAvailablePlans(response.data.plans);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await getBillingHistory();
      if (response.data?.invoices) {
        setBillingHistory(response.data.invoices);
      }
    } catch (error) {
      console.error("Failed to fetch billing history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchStorageQuota = async () => {
    try {
      setLoadingQuota(true);
      const response = await apiClient.get<any>("/api/storage/quota");

      if (response.error) {
        console.error(
          "[DeveloperSettings] Failed to fetch storage quota:",
          response.error
        );
        setStorageQuota(null);
        return;
      }

      const payload = response.data as any;
      if (payload?.success && payload.data) {
        setStorageQuota(payload.data);
      } else {
        console.error(
          "[DeveloperSettings] Storage quota response missing data:",
          payload
        );
        setStorageQuota(null);
      }
    } catch (error) {
      console.error(
        "[DeveloperSettings] Failed to fetch storage quota:",
        error
      );
      setStorageQuota(null);
    } finally {
      setLoadingQuota(false);
    }
  };

  const fetchPaymentGateways = async () => {
    try {
      setLoadingGateways(true);

      // Fetch Paystack status (read-only, no sensitive keys)
      const paystackResponse = await getPaymentGatewayStatus('paystack');
      if (paystackResponse.data) {
        setPaystackConfig(paystackResponse.data);
      } else if (paystackResponse.error) {
        console.error("[DeveloperSettings] Failed to fetch Paystack status:", paystackResponse.error);
        setPaystackConfig({ isEnabled: false, testMode: false });
      }

      // Fetch Monicredit status (read-only, no sensitive keys)
      const monicreditResponse = await getPaymentGatewayStatus('monicredit');
      if (monicreditResponse.data) {
        setMonicreditConfig(monicreditResponse.data);
      } else if (monicreditResponse.error) {
        console.error("[DeveloperSettings] Failed to fetch Monicredit status:", monicreditResponse.error);
        setMonicreditConfig({ isEnabled: false, testMode: false });
      }
    } catch (error) {
      console.error("[DeveloperSettings] Failed to fetch payment gateways:", error);
      // Set defaults on error
      setPaystackConfig({ isEnabled: false, testMode: false });
      setMonicreditConfig({ isEnabled: false, testMode: false });
    } finally {
      setLoadingGateways(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    try {
      setIsProcessing(true);

      // Initialize payment
      const currentBillingCycle = (subscription?.billingCycle || accountInfo?.customer?.billingCycle || 'monthly') as 'monthly' | 'annual';
      console.log("[Upgrade] Initializing payment for plan:", selectedPlan, "billing cycle:", currentBillingCycle);
      const response = await initializeUpgrade(selectedPlan, currentBillingCycle);
      console.log("[Upgrade] Response:", response);

      if (response.data?.authorizationUrl) {
        // Store reference for verification
        sessionStorage.setItem("upgrade_reference", response.data.reference);
        sessionStorage.setItem("upgrade_plan_id", selectedPlan);

        toast.info("Redirecting to payment gateway...");

        // Redirect to Paystack payment page
        setTimeout(() => {
          window.location.href = response.data.authorizationUrl;
        }, 1000);
      } else {
        console.error("[Upgrade] No authorization URL in response:", response);
        const errorMessage =
          response.data?.error ||
          response.error?.error ||
          "Failed to initialize payment";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("[Upgrade] Failed to initialize upgrade:", error);
      console.error("[Upgrade] Error details:", {
        message: error.message,
        response: error.response,
        data: error.response?.data,
      });
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to initialize upgrade payment";
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleChangeBillingCycle = async () => {
    try {
      setIsProcessing(true);
      const response = await changeBillingCycle(newBillingCycle);
      if (response.error) {
        toast.error(response.error.error || "Failed to change billing cycle");
      } else {
        toast.success("Billing cycle changed successfully!");
        setShowChangeBillingDialog(false);
        fetchAccountData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to change billing cycle");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (cancelConfirmation !== "CANCEL_SUBSCRIPTION") {
      toast.error("Please type CANCEL_SUBSCRIPTION to confirm");
      return;
    }

    try {
      setIsProcessing(true);
      const response = await cancelSubscription({
        reason: cancelReason,
        confirmation: cancelConfirmation,
      });

      if (response.error) {
        toast.error(response.error.error || "Failed to cancel subscription");
      } else {
        toast.success(
          "Subscription cancelled successfully. Logging you out..."
        );
        setShowCancelDialog(false);

        // Clear all authentication data immediately
        localStorage.removeItem("auth_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userType");

        // Wait a moment then redirect to login
        setTimeout(() => {
          window.location.href = "/login?message=account_cancelled";
        }, 1500);
      }
    } catch (error: any) {
      console.error("[DeveloperSettings] Cancel subscription error:", error);
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to cancel subscription"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      console.log("[DeveloperSettings] Saving profile...");

      const fullName =
        `${profileData.firstName} ${profileData.lastName}`.trim();

      const response = await updateProfile({
        name: fullName,
        phone: profileData.phone,
        bio: profileData.bio,
      });

      if (response.error) {
        toast.error(
          response.error.message ||
            response.error.error ||
            "Failed to update profile"
        );
      } else {
        toast.success("Profile updated successfully!");
        // Refresh account data to show updated info
        await fetchAccountData();
      }
    } catch (error: any) {
      console.error("[DeveloperSettings] Update profile error:", error);
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to update profile"
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveOrganization = async () => {
    try {
      setIsSavingOrganization(true);
      console.log("[DeveloperSettings] Saving organization...");

      const response = await updateOrganization({
        company: organizationData.company,
        taxId: organizationData.taxId,
        licenseNumber: organizationData.licenseNumber,
        street: organizationData.street,
        city: organizationData.city,
        state: organizationData.state,
        postalCode: organizationData.postalCode,
        website: organizationData.website,
        organizationType: organizationData.organizationType,
      });

      if (response.error) {
        toast.error(
          response.error.message ||
            response.error.error ||
            "Failed to update organization"
        );
      } else {
        toast.success("Organization details updated successfully!");
        // Refresh account data to show updated info
        await fetchAccountData();
      }
    } catch (error: any) {
      console.error("[DeveloperSettings] Update organization error:", error);
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to update organization"
      );
    } finally {
      setIsSavingOrganization(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setIsChangingPassword(true);
      console.log("[DeveloperSettings] Changing password...");

      const response = await changePassword({
        currentPassword,
        newPassword,
      });

      if (response.error) {
        toast.error(response.error.error || "Failed to change password");
      } else {
        toast.success("Password changed successfully!");
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      console.error("[DeveloperSettings] Change password error:", error);
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to change password"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 2FA handlers
  const startTwoFactorSetup = async () => {
    try {
      setInitializingTwoFactor(true);
      const response = await initializeTwoFactor();
      if ((response as any).error) {
        toast.error((response as any).error?.error || "Failed to start 2FA setup");
        return;
      }

      const secret = (response as any).data?.secret;
      const otpauthUrl = (response as any).data?.otpauthUrl;
      if (!secret || !otpauthUrl) {
        toast.error("Invalid response from server");
        return;
      }

      const qrCode = await QRCode.toDataURL(otpauthUrl);
      setTwoFactorSetup({ secret, otpauthUrl, qrCode });
      setTwoFactorCodeInput("");
      setTwoFactorDialogOpen(true);
    } catch (error: any) {
      console.error("2FA init error", error);
      toast.error(error?.message || "Failed to start 2FA setup");
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
      if ((response as any).error) {
        toast.error((response as any).error?.error || "Invalid code, try again");
        return;
      }
      toast.success("Two-factor authentication enabled");
      setTwoFactorEnabled(true);
      setTwoFactorDialogOpen(false);
      setTwoFactorCodeInput("");
      setTwoFactorSetup({ secret: "", otpauthUrl: "", qrCode: "" });
      // Refresh account data
      await fetchAccountData();
    } catch (error: any) {
      console.error("2FA verify error", error);
      toast.error(error?.message || "Failed to enable 2FA");
    } finally {
      setTwoFactorDialogLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!twoFactorDisablePassword) {
      toast.error("Please enter your password to disable 2FA");
      return;
    }
    try {
      setDisableTwoFactorLoading(true);
      const response = await disableTwoFactor(twoFactorDisablePassword);
      if ((response as any).error) {
        toast.error((response as any).error?.error || "Failed to disable 2FA");
        return;
      }
      toast.success("Two-factor authentication disabled");
      setTwoFactorEnabled(false); // Update UI immediately
      setTwoFactorDisableDialogOpen(false);
      setTwoFactorDisablePassword("");
      // Refresh account data to sync with backend
      await fetchAccountData();
    } catch (error: any) {
      console.error("Disable 2FA error", error);
      toast.error(error?.message || "Failed to disable 2FA");
    } finally {
      setDisableTwoFactorLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "PD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Derive next payment date:
  // - Prefer backend-calculated subscription.nextBillingDate
  // - Fallback: compute from customer's subscriptionStartDate + billingCycle
  let nextPaymentDate: Date | null = null;
  if (subscription?.nextBillingDate) {
    nextPaymentDate = new Date(subscription.nextBillingDate);
  } else if (
    (subscription?.status === "active" ||
      accountInfo?.customer?.status === "active") &&
    accountInfo?.customer?.subscriptionStartDate
  ) {
    const start = new Date(accountInfo.customer.subscriptionStartDate);
    const next = new Date(start);
    const cycle =
      subscription?.billingCycle || accountInfo.customer.billingCycle || "monthly";
    if (cycle === "annual") {
      next.setFullYear(next.getFullYear() + 1);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    nextPaymentDate = next;
  }

  const handleTabChange = (value: string) => {
    console.log("[DeveloperSettings] Tab changed to:", value);
    // Update state
    setActiveTab(value);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.pushState({}, "", url.toString());
  };

  // Check if user is Owner (only Owner can see Team tab)
  const isOwner = !!accountInfo?.user?.isOwner;

  // If showOnlyProfile is true, render only the Profile content without tabs
  if (showOnlyProfile) {
    return (
      <div className="space-y-6">
        {/* Header - Enhanced with Brand Colors */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">
                  Profile Settings
                </h1>
              </div>
            </div>
            <p className="text-gray-600 ml-16">
              Manage your personal information and preferences
            </p>
          </div>
        </div>

        {/* Profile Content Only */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b border-purple-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Profile Information</CardTitle>
                <CardDescription className="text-gray-600">
                  Update your personal information and profile picture
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 ring-4 ring-purple-100">
                <AvatarFallback className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] text-white text-2xl shadow-lg">
                  {getInitials(user?.name || accountInfo?.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Button
                  variant="outline"
                  className="gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  JPG, PNG or GIF (max. 2MB)
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={profileData.firstName}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      firstName: e.target.value,
                    })
                  }
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={profileData.lastName}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      lastName: e.target.value,
                    })
                  }
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
                placeholder="+234 XXX XXX XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={
                  accountInfo?.user?.teamMemberRole?.name ||
                  (accountInfo?.user?.isOwner ? "Owner" : "Property Developer")
                }
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) =>
                  setProfileData({ ...profileData, bio: e.target.value })
                }
                placeholder="Tell us a bit about yourself..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="gap-2"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
              >
                <Save className="w-4 h-4" />
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchAccountData()}
                disabled={isSavingProfile}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Otherwise, render full Settings with all tabs
  return (
    <div className="space-y-6">
      {/* Header - Enhanced with Brand Colors */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">
                Settings
              </h1>
            </div>
          </div>
          <p className="text-gray-600 ml-16">
            Manage your account and project preferences
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList
          className={`grid w-full bg-gray-100/50 p-1 rounded-xl ${isOwner ? "grid-cols-7" : "grid-cols-6"}`}
        >
          <TabsTrigger
            value="organization"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 transition-all"
          >
            <Building2 className="w-4 h-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 transition-all"
          >
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 transition-all"
          >
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 transition-all"
          >
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 transition-all"
          >
            <Plug className="w-4 h-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger
            value="storage"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 transition-all"
          >
            <HardDrive className="w-4 h-4" />
            Storage Space
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger
              value="team"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 transition-all"
            >
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
          )}
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Organization Details</CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage your organization information and preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={organizationData.company}
                  onChange={(e) =>
                    setOrganizationData({
                      ...organizationData,
                      company: e.target.value,
                    })
                  }
                  placeholder="Your Company Name"
                  className="focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-type">Organization Type</Label>
                <Select
                  value={organizationData.organizationType}
                  onValueChange={(value) =>
                    setOrganizationData({
                      ...organizationData,
                      organizationType: value,
                    })
                  }
                >
                  <SelectTrigger className="focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developer">
                      Property Developer
                    </SelectItem>
                    <SelectItem value="contractor">
                      General Contractor
                    </SelectItem>
                    <SelectItem value="consultant">
                      Construction Consultant
                    </SelectItem>
                    <SelectItem value="investor">
                      Real Estate Investor
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID / EIN</Label>
                  <Input
                    id="tax-id"
                    value={organizationData.taxId}
                    onChange={(e) =>
                      setOrganizationData({
                        ...organizationData,
                        taxId: e.target.value,
                      })
                    }
                    placeholder="XX-XXXXXXX"
                  className="focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={organizationData.licenseNumber}
                    onChange={(e) =>
                      setOrganizationData({
                        ...organizationData,
                        licenseNumber: e.target.value,
                      })
                    }
                    placeholder="LIC-2025-XXXX"
                    className="focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  value={organizationData.street}
                  onChange={(e) =>
                    setOrganizationData({
                      ...organizationData,
                      street: e.target.value,
                    })
                  }
                    placeholder="123 Main Street"
                    className="focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={organizationData.city}
                      onChange={(e) =>
                        setOrganizationData({
                          ...organizationData,
                          city: e.target.value,
                        })
                      }
                      placeholder="Lagos"
                      className="focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={organizationData.state}
                      onChange={(e) =>
                        setOrganizationData({
                          ...organizationData,
                          state: e.target.value,
                        })
                      }
                      placeholder="Lagos State"
                      className="focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={organizationData.postalCode}
                      onChange={(e) =>
                        setOrganizationData({
                          ...organizationData,
                          postalCode: e.target.value,
                        })
                      }
                      placeholder="100001"
                      className="focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <Input
                    id="website"
                    value={organizationData.website}
                    onChange={(e) =>
                      setOrganizationData({
                        ...organizationData,
                        website: e.target.value,
                      })
                    }
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="gap-2 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
                  onClick={handleSaveOrganization}
                  disabled={isSavingOrganization}
                >
                  <Save className="w-4 h-4" />
                  {isSavingOrganization ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fetchAccountData()}
                  disabled={isSavingOrganization}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Two-Factor Authentication Card */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Two-Factor Authentication</CardTitle>
                  <CardDescription className="text-gray-600">
                    Add an extra layer of security to protect your account
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-br from-purple-50/50 via-indigo-50/50 to-purple-50/50 rounded-xl border-2 border-purple-200/50 hover:border-purple-300 transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Enable 2FA</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Protect your account with two-factor authentication
                    </p>
                    {twoFactorEnabled && (
                      <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">
                        <Shield className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      startTwoFactorSetup();
                    } else {
                      setTwoFactorDisableDialogOpen(true);
                    }
                  }}
                  disabled={initializingTwoFactor || twoFactorDialogLoading || disableTwoFactorLoading}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#5B21B6]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Password Change Card */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Change Password</CardTitle>
                  <CardDescription className="text-gray-600">
                    Update your password to keep your account secure
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm font-semibold text-gray-700">
                    Current Password
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="focus:border-[#7C3AED] focus:ring-[#7C3AED] h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-semibold text-gray-700">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="focus:border-[#7C3AED] focus:ring-[#7C3AED] h-11"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    Password must be at least 6 characters long
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="focus:border-[#7C3AED] focus:ring-[#7C3AED] h-11"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    isChangingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25 h-11 px-6"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationPreferencesTab />
        </TabsContent>

        {/* Storage Space Tab */}
        <TabsContent value="storage" className="space-y-6">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                  <HardDrive className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Storage Space</CardTitle>
                  <CardDescription className="text-gray-600">
                    Monitor your file storage usage and available space
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {loadingQuota ? (
                <div className="text-center py-12">
                  <Loader2 className="h-10 w-10 mx-auto mb-4 text-[#7C3AED] animate-spin" />
                  <p className="text-gray-600 font-medium">Loading storage quota...</p>
                </div>
              ) : storageQuota ? (
                <>
                  <div className="space-y-6">
                    {/* Usage Stats - Enhanced */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-purple-200/50">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
                            <HardDrive className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700">
                            Storage Used
                          </p>
                        </div>
                        <p className="text-3xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">
                          {storageQuota.usedFormatted}
                        </p>
                        <p className="text-sm font-medium text-gray-600 mt-1">
                          of {storageQuota.limitFormatted} total
                        </p>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl border-2 border-green-200/50">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700">
                            Available
                          </p>
                        </div>
                        <p className="text-3xl font-bold text-green-700">
                          {storageQuota.availableFormatted}
                        </p>
                        <p className="text-sm font-medium text-gray-600 mt-1">
                          remaining storage
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar - Enhanced */}
                    <div className="space-y-3 p-5 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-900">Storage Usage</p>
                        <p className="text-sm font-bold bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">
                          {storageQuota.percentage.toFixed(1)}% used
                        </p>
                      </div>
                      <Progress
                        value={storageQuota.percentage}
                        className={`h-4 rounded-full ${
                          storageQuota.percentage > 90
                            ? "bg-red-100"
                            : storageQuota.percentage > 75
                            ? "bg-yellow-100"
                            : "bg-green-100"
                        }`}
                      />
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-600">
                          {storageQuota.usedFormatted} used
                        </span>
                        <span>
                          {storageQuota.percentage > 90 && (
                            <span className="flex items-center gap-1 text-red-600 font-semibold">
                              <AlertCircle className="w-4 h-4" />
                              Almost full
                            </span>
                          )}
                          {storageQuota.percentage > 75 &&
                            storageQuota.percentage <= 90 && (
                              <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                                <AlertCircle className="w-4 h-4" />
                                Running low
                              </span>
                            )}
                          {storageQuota.percentage <= 75 && (
                            <span className="flex items-center gap-1 text-green-600 font-semibold">
                              <TrendingUp className="w-4 h-4" />
                              Healthy
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Warning Message - Enhanced */}
                    {storageQuota.percentage > 90 && (
                      <div className="p-5 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 border-2 border-red-200 rounded-xl shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-red-900 mb-1">
                              Storage almost full
                            </p>
                            <p className="text-sm text-red-700">
                              You're running out of storage space. Consider
                              upgrading your plan or deleting unused files.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {storageQuota.percentage > 75 && storageQuota.percentage <= 90 && (
                      <div className="p-5 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-200 rounded-xl shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-yellow-900 mb-1">
                              Storage running low
                            </p>
                            <p className="text-sm text-yellow-700">
                              You're using {storageQuota.percentage.toFixed(1)}% of your storage. Consider cleaning up unused files.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Info Box - Enhanced */}
                    <div className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                          <HardDrive className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          What counts towards storage?
                        </p>
                      </div>
                      <ul className="text-sm text-gray-700 space-y-2 ml-11">
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full"></div>
                          Uploaded documents and files
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full"></div>
                          Invoice attachments and receipts
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full"></div>
                          Property images and media
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full"></div>
                          Project documents and architecture plans
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons - Enhanced */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    {storageQuota.percentage > 75 && (
                      <Button
                        onClick={() => setActiveTab("billing")}
                        className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          setLoadingQuota(true);
                          // Recalculate storage usage
                          await apiClient.post("/api/storage/recalculate");
                          // Then fetch updated quota
                          await fetchStorageQuota();
                          toast.success("Storage usage recalculated");
                        } catch (error) {
                          console.error("Failed to recalculate storage:", error);
                          toast.error("Failed to recalculate storage");
                        } finally {
                          setLoadingQuota(false);
                        }
                      }}
                      disabled={loadingQuota}
                      className="border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                    >
                      {loadingQuota ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Recalculating...
                        </>
                      ) : (
                        <>
                          <HardDrive className="w-4 h-4 mr-2" />
                          Recalculate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={fetchStorageQuota}
                      disabled={loadingQuota}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      Refresh
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">
                    Failed to load storage quota
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Please try again or contact support if the issue persists
                  </p>
                  <Button
                    variant="outline"
                    onClick={fetchStorageQuota}
                    className="border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                  >
                    <HardDrive className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Subscription Plan</CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage your subscription and billing information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 text-[#7C3AED] animate-spin" />
                  <p className="text-gray-600 font-medium">
                    Loading subscription details...
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-xl shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                            <Crown className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                              {subscription?.plan?.name ||
                                accountInfo?.customer?.plan?.name ||
                                "Free Plan"}
                            </h3>
                          </div>
                          <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                          {accountInfo?.customer?.projectLimit ||
                            subscription?.projectLimit ||
                            3}{" "}
                          projects •{" "}
                          {accountInfo?.customer?.plan?.userLimit ||
                            subscription?.plan?.userLimit ||
                            5}{" "}
                          users • Advanced analytics • Priority support
                        </p>
                        {/* Next Payment Cycle */}
                        {nextPaymentDate && (
                          <div className="mt-3 p-3 bg-white/60 rounded-lg border border-green-200">
                            <p className="text-sm font-semibold text-gray-900">
                              Next payment:{" "}
                              <span className="text-green-700">
                                {nextPaymentDate.toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="p-4 bg-white/60 rounded-lg border border-green-200">
                          <p className="text-2xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">
                            {formatCurrencyUtil(
                              accountInfo?.customer?.plan?.monthlyPrice ||
                                subscription?.plan?.monthlyPrice ||
                                0,
                              accountInfo?.customer?.plan?.currency ||
                                subscription?.plan?.currency ||
                                "NGN"
                            )}
                          </p>
                          <p className="text-sm text-gray-600 font-medium mt-1">
                            /month • Billed {subscription?.billingCycle || "monthly"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-green-200">
                      <Button
                        onClick={() => {
                          // Check if payment gateway is configured
                          if (!paystackConfig?.isEnabled && !monicreditConfig?.isEnabled) {
                            toast.error("No payment gateway configured. Please contact your administrator to enable a payment gateway in Platform Settings → Integrations.");
                            setActiveTab("integrations");
                            return;
                          }
                          setShowChangePlanDialog(true);
                        }}
                        className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(true)}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        Cancel Subscription
                      </Button>
                    </div>

                    {/* Payment Gateway Warning */}
                    {(!paystackConfig?.isEnabled && !monicreditConfig?.isEnabled) && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-200 rounded-xl shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                            <AlertCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-yellow-900 mb-1">
                              Payment Gateway Not Configured
                            </p>
                            <p className="text-sm text-yellow-700 mb-2">
                              No payment gateway is currently enabled. You won't be able to upgrade your plan until a payment gateway is configured.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveTab("integrations")}
                              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-400"
                            >
                              <Plug className="w-3 h-3 mr-2" />
                              View Integrations
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-bold text-gray-900">
                        Billing Information
                      </p>
                    </div>
                    <div className="space-y-2 pl-11">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-700">
                          Next billing date:
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {nextPaymentDate
                            ? nextPaymentDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods Card */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Payment Methods</CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage your payment methods for automatic billing
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PaymentMethodsManager />
            </CardContent>
          </Card>


          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Billing History</CardTitle>
                  <CardDescription className="text-gray-600">
                    View and download your billing history
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 text-[#7C3AED] animate-spin" />
                  <p className="text-gray-600 font-medium">Loading billing history...</p>
                </div>
              ) : billingHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No billing history yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Your invoices will appear here once you have billing
                    activity
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {(() => {
                      // Calculate pagination
                      const totalPages = Math.ceil(billingHistory.length / itemsPerPage);
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const currentItems = billingHistory.slice(startIndex, endIndex);

                      return currentItems.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-md">
                              <Receipt className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-900">
                                {new Date(
                                  invoice.paidAt || invoice.createdAt
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 mt-1">
                                {formatCurrencyUtil(invoice.amount, invoice.currency)}
                              </p>
                              {invoice.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {invoice.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              className={
                                invoice.status === "paid"
                                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"
                                  : invoice.status === "pending"
                                  ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md"
                                  : "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md"
                              }
                            >
                              {invoice.status.charAt(0).toUpperCase() +
                                invoice.status.slice(1)}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toast.info("Invoice download coming soon!")
                              }
                              className="border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Pagination Controls */}
                  {billingHistory.length > itemsPerPage && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                      <div className="text-sm font-medium text-gray-700">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, billingHistory.length)} of{" "}
                        {billingHistory.length} invoices
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="border-gray-300 hover:bg-gray-50"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: Math.ceil(billingHistory.length / itemsPerPage) },
                            (_, i) => i + 1
                          ).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 ${
                                currentPage === page
                                  ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(
                                Math.ceil(billingHistory.length / itemsPerPage),
                                prev + 1
                              )
                            )
                          }
                          disabled={
                            currentPage === Math.ceil(billingHistory.length / itemsPerPage)
                          }
                          className="border-gray-300 hover:bg-gray-50"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                  <Plug className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Payment Gateway Integrations</CardTitle>
                  <CardDescription className="text-gray-600">
                    View payment gateway connection status for subscription payments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {loadingGateways ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 text-[#7C3AED] animate-spin" />
                  <p className="text-gray-600 font-medium">Loading payment gateway status...</p>
                </div>
              ) : (
                <>
                  {/* Paystack Gateway Status */}
                  <div className="p-5 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center shadow-md ${
                          paystackConfig?.isEnabled
                            ? "bg-gradient-to-br from-green-500 to-emerald-500"
                            : "bg-gradient-to-br from-gray-400 to-gray-500"
                        }`}>
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Paystack Payment Gateway</h3>
                          <p className="text-sm text-gray-600">Platform subscription payments</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {paystackConfig?.isEnabled ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md">
                              Connected
                            </Badge>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-gray-400" />
                            <Badge className="bg-gray-400 text-white">
                              Not Connected
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 pl-16">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-700">Status:</p>
                        <p className={`text-sm font-semibold ${
                          paystackConfig?.isEnabled ? "text-green-700" : "text-gray-500"
                        }`}>
                          {paystackConfig?.isEnabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      {paystackConfig?.testMode && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500 text-white text-xs">
                            Test Mode
                          </Badge>
                        </div>
                      )}
                      {!paystackConfig?.isEnabled && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            Paystack is not configured. Please contact your administrator to enable it in Platform Settings → Integrations.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Monicredit Gateway Status */}
                  <div className="p-5 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center shadow-md ${
                          monicreditConfig?.isEnabled
                            ? "bg-gradient-to-br from-green-500 to-emerald-500"
                            : "bg-gradient-to-br from-gray-400 to-gray-500"
                        }`}>
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Monicredit Payment Gateway</h3>
                          <p className="text-sm text-gray-600">Platform subscription payments</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {monicreditConfig?.isEnabled ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md">
                              Connected
                            </Badge>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-gray-400" />
                            <Badge className="bg-gray-400 text-white">
                              Not Connected
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 pl-16">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-700">Status:</p>
                        <p className={`text-sm font-semibold ${
                          monicreditConfig?.isEnabled ? "text-green-700" : "text-gray-500"
                        }`}>
                          {monicreditConfig?.isEnabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      {monicreditConfig?.testMode && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500 text-white text-xs">
                            Test Mode
                          </Badge>
                        </div>
                      )}
                      {!monicreditConfig?.isEnabled && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            Monicredit is not configured. Please contact your administrator to enable it in Platform Settings → Integrations.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning if no gateway is enabled */}
                  {(!paystackConfig?.isEnabled && !monicreditConfig?.isEnabled) && (
                    <div className="p-5 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 border-2 border-red-200 rounded-xl shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-red-900 mb-1">
                            No Payment Gateway Configured
                          </p>
                          <p className="text-sm text-red-700 mb-3">
                            No payment gateway is currently enabled for subscription payments. You will not be able to upgrade your plan until a payment gateway is configured.
                          </p>
                          <p className="text-sm text-red-600">
                            Please contact your administrator to configure Paystack or Monicredit in Platform Settings → Integrations.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info about subscription payments */}
                  <div className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                        <Settings className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        About Payment Gateways
                      </p>
                    </div>
                    <ul className="text-sm text-gray-700 space-y-2 ml-11">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full"></div>
                        Payment gateways are configured by administrators in Platform Settings
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full"></div>
                        Subscription payments use the enabled payment gateway automatically
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full"></div>
                        If multiple gateways are enabled, Paystack is preferred over Monicredit
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full"></div>
                        Payment gateway status is read-only for developers
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

          {/* Change Plan Dialog */}
          {showChangePlanDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">Upgrade Subscription Plan</CardTitle>
                      <CardDescription className="text-purple-100">
                        Select a higher plan to upgrade your account
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingPlans ? (
                    <p className="text-center py-4">Loading plans...</p>
                  ) : (
                    (() => {
                      const currentPlanId =
                        accountInfo?.customer?.planId || subscription?.planId;
                      const currentPlanPrice =
                        accountInfo?.customer?.plan?.monthlyPrice ||
                        subscription?.plan?.monthlyPrice ||
                        0;

                      console.log('[DeveloperSettings] Change Plan Dialog - Current Plan:', {
                        id: currentPlanId,
                        price: currentPlanPrice,
                      });
                      console.log('[DeveloperSettings] All available plans:', availablePlans.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.monthlyPrice
                      })));

                      // Sort plans by price
                      const sortedPlans = [...availablePlans].sort(
                        (a, b) => a.monthlyPrice - b.monthlyPrice
                      );

                      // Filter to show ONLY higher-tier plans (exclude current and lower)
                      const upgradePlans = sortedPlans.filter(
                        (plan) => plan.monthlyPrice > currentPlanPrice
                      );

                      // Get current plan for display
                      const currentPlan = availablePlans.find(
                        (plan) => plan.id === currentPlanId
                      );

                      console.log('[DeveloperSettings] Filtered upgrade plans:', upgradePlans.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.monthlyPrice
                      })));

                      return (
                        <div className="space-y-3">
                          {/* Show current plan (highlighted as active) */}
                          {currentPlan && (
                            <div className="p-5 border-2 border-green-500 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 shadow-md">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                                    <Crown className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-lg text-gray-900">
                                        {currentPlan.name}
                                      </h4>
                                      <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs shadow-md">
                                        Active Plan
                                      </Badge>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 mt-1">
                                      {currentPlan.projectLimit || currentPlan.propertyLimit} {currentPlan.projectLimit ? 'projects' : 'properties'} •{" "}
                                      {currentPlan.userLimit} users •{" "}
                                      {currentPlan.storageLimit}MB storage
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent">
                                    {formatCurrencyUtil(
                                      currentPlan.monthlyPrice,
                                      currentPlan.currency
                                    )}
                                  </p>
                                  <p className="text-sm font-medium text-gray-600">
                                    /month
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Show upgrade plans */}
                          {upgradePlans.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-gray-600 font-medium">
                                You're on the highest plan! 🎉
                              </p>
                              <p className="text-sm text-gray-500 mt-2">
                                There are no higher plans available to upgrade
                                to.
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="pt-2">
                                <p className="text-sm font-medium text-gray-700 mb-3">
                                  Available Upgrades
                                </p>
                              </div>
                              {upgradePlans.map((plan) => {
                                const isSelected = selectedPlan === plan.id;
                                return (
                                  <div
                                    key={plan.id}
                                    className={`p-5 border-2 rounded-xl transition-all cursor-pointer ${
                                      isSelected
                                        ? "border-[#7C3AED] bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg"
                                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                                    }`}
                                    onClick={() => setSelectedPlan(plan.id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                          isSelected
                                            ? "bg-gradient-to-br from-[#A855F7] to-[#7C3AED] shadow-md"
                                            : "bg-gray-200"
                                        }`}>
                                          <TrendingUp className={`w-5 h-5 ${isSelected ? "text-white" : "text-gray-500"}`} />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900">
                                              {plan.name}
                                            </h4>
                                            {plan.isPopular && (
                                              <Badge className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white text-xs shadow-md">
                                                Popular
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-sm font-medium text-gray-700 mt-1">
                                            {plan.projectLimit || plan.propertyLimit} {plan.projectLimit ? 'projects' : 'properties'} •{" "}
                                            {plan.userLimit} users •{" "}
                                            {plan.storageLimit}MB storage
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className={`text-xl font-bold ${
                                          isSelected
                                            ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] bg-clip-text text-transparent"
                                            : "text-gray-900"
                                        }`}>
                                          {formatCurrencyUtil(
                                            plan.monthlyPrice,
                                            plan.currency
                                          )}
                                        </p>
                                        <p className="text-sm font-medium text-gray-600">
                                          /month
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            }
                            </>
                          )}
                        </div>
                      );
                    })()
                  )}
                </CardContent>
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowChangePlanDialog(false);
                      setSelectedPlan("");
                    }}
                    disabled={isProcessing}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChangePlan}
                    disabled={isProcessing || !selectedPlan}
                    className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Cancel Subscription Dialog */}
          {showCancelDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Cancel Subscription</CardTitle>
                  <CardDescription>
                    Are you sure you want to cancel your subscription?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cancel-reason">
                      Reason for cancellation (optional)
                    </Label>
                    <Textarea
                      id="cancel-reason"
                      placeholder="Tell us why you're leaving..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cancel-confirm">
                      Type <strong>CANCEL_SUBSCRIPTION</strong> to confirm
                    </Label>
                    <Input
                      id="cancel-confirm"
                      placeholder="CANCEL_SUBSCRIPTION"
                      value={cancelConfirmation}
                      onChange={(e) => setCancelConfirmation(e.target.value)}
                    />
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      Your subscription will be cancelled immediately and you
                      will lose access to all features.
                    </p>
                  </div>
                </CardContent>
                <div className="p-6 border-t flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCancelDialog(false);
                      setCancelReason("");
                      setCancelConfirmation("");
                    }}
                    disabled={isProcessing}
                  >
                    Keep Subscription
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={
                      isProcessing ||
                      cancelConfirmation !== "CANCEL_SUBSCRIPTION"
                    }
                  >
                    {isProcessing ? "Cancelling..." : "Cancel Subscription"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

        {/* Team Settings - Only for Owner */}
        {isOwner && (
          <TabsContent value="team" className="space-y-6">
            <TeamManagementTab />
          </TabsContent>
        )}
      </Tabs>

      {/* Two-Factor Setup Dialog */}
      <Dialog
        open={twoFactorDialogOpen}
        onOpenChange={(open) => {
          setTwoFactorDialogOpen(open);
          if (!open) {
            setTwoFactorCodeInput("");
            setTwoFactorSetup({ secret: "", otpauthUrl: "", qrCode: "" });
          }
        }}
      >
        <DialogContent className="max-w-md border-0 shadow-2xl p-0">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl">Enable Two-Factor Authentication</DialogTitle>
                <DialogDescription className="text-purple-100">
                  Scan the QR code below with Google Authenticator, Authy, or any compatible app.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 p-6">
            {twoFactorSetup.qrCode && (
              <div className="flex flex-col items-center space-y-3">
                <div className="p-4 bg-white border-2 border-purple-200 rounded-xl shadow-sm">
                  <img
                    src={twoFactorSetup.qrCode}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center font-medium">
                  Scan this QR code with your authenticator app
                </p>
              </div>
            )}

            {twoFactorSetup.secret && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Can't scan? Enter this key manually:
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={twoFactorSetup.secret}
                    readOnly
                    className="font-mono text-sm bg-white border-purple-200 focus:border-purple-300"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(twoFactorSetup.secret);
                      toast.success("Secret copied to clipboard");
                    }}
                    className="border-purple-200 hover:bg-purple-50"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Enter 6-digit code from your app
              </Label>
              <Input
                value={twoFactorCodeInput}
                onChange={(e) => setTwoFactorCodeInput(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono focus:border-[#7C3AED] focus:ring-[#7C3AED] h-12"
              />
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => {
                setTwoFactorDialogOpen(false);
                setTwoFactorCodeInput("");
                setTwoFactorSetup({ secret: "", otpauthUrl: "", qrCode: "" });
              }}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmTwoFactorSetup}
              disabled={!twoFactorCodeInput || twoFactorCodeInput.length !== 6 || twoFactorDialogLoading}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
            >
              {twoFactorDialogLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Enable"
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
        <DialogContent className="border-0 shadow-2xl p-0">
          <DialogHeader className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 p-6 rounded-t-lg border-b border-red-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-gray-900 text-xl">Disable Two-Factor Authentication</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Enter your password to disable two-factor authentication.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Password</Label>
              <Input
                type="password"
                value={twoFactorDisablePassword}
                onChange={(e) => setTwoFactorDisablePassword(e.target.value)}
                placeholder="Enter your password"
                className="focus:border-[#7C3AED] focus:ring-[#7C3AED] h-11"
              />
              <p className="text-xs text-gray-500">
                This action will remove the extra security layer from your account
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => {
                setTwoFactorDisableDialogOpen(false);
                setTwoFactorDisablePassword("");
              }}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisableTwoFactor}
              disabled={!twoFactorDisablePassword || disableTwoFactorLoading}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg"
            >
              {disableTwoFactorLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
