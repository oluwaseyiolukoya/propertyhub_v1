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
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";
import {
  getAccountInfo,
  changePassword,
  type ChangePasswordRequest,
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

  // Storage quota state
  const [storageQuota, setStorageQuota] = useState<any>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);

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

    // Check for payment callback
    const urlParams = new URLSearchParams(window.location.search);
    const reference =
      urlParams.get("reference") || sessionStorage.getItem("upgrade_reference");
    const paymentCallback = urlParams.get("payment_callback");

    // Handle upgrade payment callback
    if (reference && (paymentCallback === "upgrade" || window.location.pathname.includes("/upgrade/callback"))) {
      handlePaymentCallback(reference);
    }

    // Handle browser back/forward navigation
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab") || "organization";
      console.log(
        "[DeveloperSettings] Browser navigation detected, switching to tab:",
        tab
      );
      setActiveTab(tab);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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

  const handleChangePlan = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    try {
      setIsProcessing(true);

      // Initialize payment
      console.log("[Upgrade] Initializing payment for plan:", selectedPlan);
      const response = await initializeUpgrade(selectedPlan);
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

        {/* Profile Content Only */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {getInitials(user?.name || accountInfo?.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Button variant="outline" className="gap-2">
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
                defaultValue="Property Developer"
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
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
          className={`grid w-full ${isOwner ? "grid-cols-4" : "grid-cols-3"}`}
        >
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="w-4 h-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
          )}
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Manage your organization information and preferences
              </CardDescription>
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
                  <SelectTrigger>
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
                  className="gap-2"
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
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationPreferencesTab />
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Loading subscription details...
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-6 border-2 border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {subscription?.plan?.name ||
                              accountInfo?.customer?.plan?.name ||
                              "Free Plan"}
                          </h3>
                          <Badge className="bg-green-600 text-white">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
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
                          <p className="text-sm text-gray-700 mt-2 font-medium">
                            Next payment:{" "}
                            <span className="text-gray-900">
                              {nextPaymentDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-gray-900">
                          {formatCurrencyUtil(
                            accountInfo?.customer?.plan?.monthlyPrice ||
                              subscription?.plan?.monthlyPrice ||
                              0,
                            accountInfo?.customer?.plan?.currency ||
                              subscription?.plan?.currency ||
                              "NGN"
                          )}
                          /month
                        </p>
                        <p className="text-sm text-gray-500">
                          Billed {subscription?.billingCycle || "monthly"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowChangePlanDialog(true)}
                      >
                        Upgrade Plan
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-semibold text-gray-900 mb-4">
                      Billing Information
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Next billing date:{" "}
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
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods for automatic billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentMethodsManager />
            </CardContent>
          </Card>

          {/* Storage Quota Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Storage Quota
              </CardTitle>
              <CardDescription>
                Monitor your file storage usage and available space
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingQuota ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading storage quota...</p>
                </div>
              ) : storageQuota ? (
                <>
                  <div className="space-y-3">
                    {/* Usage Stats */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Storage Used
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {storageQuota.usedFormatted}
                          <span className="text-sm font-normal text-gray-500">
                            {" "}
                            / {storageQuota.limitFormatted}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          Available
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {storageQuota.availableFormatted}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress
                        value={storageQuota.percentage}
                        className={`h-3 ${
                          storageQuota.percentage > 90
                            ? "bg-red-100"
                            : storageQuota.percentage > 75
                            ? "bg-yellow-100"
                            : "bg-green-100"
                        }`}
                      />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{storageQuota.percentage.toFixed(1)}% used</span>
                        <span>
                          {storageQuota.percentage > 90 && (
                            <span className="flex items-center gap-1 text-red-600 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              Almost full
                            </span>
                          )}
                          {storageQuota.percentage > 75 &&
                            storageQuota.percentage <= 90 && (
                              <span className="flex items-center gap-1 text-yellow-600 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                Running low
                              </span>
                            )}
                        </span>
                      </div>
                    </div>

                    {/* Warning Message */}
                    {storageQuota.percentage > 90 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-900">
                              Storage almost full
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                              You're running out of storage space. Consider
                              upgrading your plan or deleting unused files.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>What counts towards storage?</strong>
                      </p>
                      <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                        <li>Invoice attachments (receipts, documents)</li>
                        <li>Project documents and files</li>
                        <li>Uploaded images and media</li>
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to storage test page or files page
                        window.location.href = "/storage-test";
                      }}
                    >
                      View Files
                    </Button>
                    {storageQuota.percentage > 75 && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowChangePlanDialog(true)}
                      >
                        Upgrade Plan
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Storage quota information unavailable
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={fetchStorageQuota}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View and download your billing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading billing history...</p>
                </div>
              ) : billingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No billing history yet</p>
                  <p className="text-sm text-gray-400 mt-2">
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
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(
                                invoice.paidAt || invoice.createdAt
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatCurrencyUtil(invoice.amount, invoice.currency)}
                            </p>
                            {invoice.description && (
                              <p className="text-xs text-gray-400 mt-1">
                                {invoice.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              className={
                                invoice.status === "paid"
                                  ? "bg-green-500"
                                  : invoice.status === "pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }
                            >
                              {invoice.status.charAt(0).toUpperCase() +
                                invoice.status.slice(1)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toast.info("Invoice download coming soon!")
                              }
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
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-600">
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
                              className="w-10"
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

          {/* Change Plan Dialog */}
          {showChangePlanDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Upgrade Subscription Plan</CardTitle>
                  <CardDescription>
                    Select a higher plan to upgrade your account
                  </CardDescription>
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
                            <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">
                                      {currentPlan.name}
                                    </h4>
                                    <Badge className="bg-green-600 text-white text-xs">
                                      Active Plan
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1">
                                    {currentPlan.projectLimit || currentPlan.propertyLimit} {currentPlan.projectLimit ? 'projects' : 'properties'} •{" "}
                                    {currentPlan.userLimit} users •{" "}
                                    {currentPlan.storageLimit}MB storage
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-gray-900">
                                    {formatCurrencyUtil(
                                      currentPlan.monthlyPrice,
                                      currentPlan.currency
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-600">
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
                                    className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                                      isSelected
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                                    }`}
                                    onClick={() => setSelectedPlan(plan.id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold text-gray-900">
                                            {plan.name}
                                          </h4>
                                          {plan.isPopular && (
                                            <Badge className="bg-blue-600 text-white text-xs">
                                              Popular
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                          {plan.projectLimit || plan.propertyLimit} {plan.projectLimit ? 'projects' : 'properties'} •{" "}
                                          {plan.userLimit} users •{" "}
                                          {plan.storageLimit}MB storage
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-lg font-semibold text-gray-900">
                                          {formatCurrencyUtil(
                                            plan.monthlyPrice,
                                            plan.currency
                                          )}
                                        </p>
                                        <p className="text-sm text-gray-500">
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
                <div className="p-6 border-t flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowChangePlanDialog(false);
                      setSelectedPlan("");
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChangePlan}
                    disabled={isProcessing || !selectedPlan}
                  >
                    {isProcessing ? "Processing..." : "Upgrade Plan"}
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
        </TabsContent>

        {/* Team Settings - Only for Owner */}
        {isOwner && (
          <TabsContent value="team" className="space-y-6">
            <TeamManagementTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
