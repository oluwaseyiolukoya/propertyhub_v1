import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Building,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  Settings,
  LogOut,
  Menu,
  CheckCircle,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Home,
  FileText,
  Wallet,
  BarChart3,
  Receipt,
  Wrench,
  UserCog,
  Key,
  FileBox,
  Cog,
  ArrowLeft,
  Edit,
  MapPin,
  Building2,
  Bed,
  Info,
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
import { toast } from "sonner";
import { PropertiesPage } from "./PropertiesPage";
import { TenantManagement } from "./TenantManagement";
import { FinancialReports } from "./FinancialReports";
import { ExpenseManagement } from "./ExpenseManagement";
import { PropertyManagerManagement } from "./PropertyManagerManagement";
import { MaintenanceTickets } from "./MaintenanceTickets";
import { AccessControl } from "./AccessControl";
import { PropertyOwnerSettings } from "./PropertyOwnerSettings";
import { AddPropertyPage } from "./AddPropertyPage";
import { Footer } from "./Footer";
import PropertyOwnerDocuments from "./PropertyOwnerDocuments";
import { PaymentOverview } from "./PaymentOverview";
import { TenantVerificationManagement } from "./owner/TenantVerificationManagement";
import { getOwnerActivities } from "../lib/api";
import { getProperty, updateProperty } from "../lib/api/properties";
import { createProperty } from "../lib/api/properties";
import { useCurrency } from "../lib/CurrencyContext";
import { usePersistentState } from "../lib/usePersistentState";
import {
  formatCurrency as formatCurrencyUtil,
  getSmartBaseCurrency,
} from "../lib/currency";
import { TrialStatusBanner } from "./TrialStatusBanner";
import { UpgradeModal } from "./UpgradeModal";
import { getSubscriptionStatus } from "../lib/api/subscription";
import { verifyUpgrade } from "../lib/api/subscriptions";
import { apiClient } from "../lib/api-client";
import { PlatformLogo } from "./PlatformLogo";
import { TRIAL_PLAN_LIMITS } from "../lib/constants/subscriptions";
import {
  useProperties,
  useUnits,
  useOwnerDashboard,
  useAccountInfo,
} from "../hooks";

interface PropertyOwnerDashboardProps {
  user: any;
  onLogout: () => void;
  managers: any[];
  propertyAssignments: any[];
  onAddManager: (managerData: any, ownerId: string) => Promise<any>;
  onAssignManager: (
    managerId: string,
    propertyId: string,
    permissions?: any
  ) => Promise<void>;
  onRemoveManager: (managerId: string, propertyId: string) => Promise<void>;
  onUpdateManager: (managerId: string, updates: any) => Promise<void>;
  onDeactivateManager: (managerId: string) => Promise<void>;
  onRefreshManagers?: () => Promise<void>; // Callback to reload managers
}

// Recent Activity Card Component with Pagination
const RecentActivityCard: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    fetchActivities(currentPage);
  }, [currentPage]);

  const fetchActivities = async (page: number) => {
    try {
      setLoadingActivities(true);
      const response = await getOwnerActivities(page, 5);

      if (response.error) {
        console.error("Failed to load activities:", response.error);
      } else if (response.data) {
        setActivities(response.data.activities || []);
        setPagination(
          response.data.pagination || {
            page: 1,
            limit: 5,
            total: 0,
            totalPages: 0,
            hasMore: false,
          }
        );
      }
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
        <CardDescription>Latest updates from your properties</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingActivities ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
            <p className="ml-3 text-sm text-gray-500">Loading activities...</p>
          </div>
        ) : activities.length > 0 ? (
          <>
            <div className="space-y-3">
              {activities.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-[#7C3AED]/10 rounded-lg">
                    <Clock className="h-4 w-4 text-[#7C3AED]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {log.description || `${log.action} ${log.entity}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge className="bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20 capitalize">
                    {log.entity}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                  <span className="text-gray-400 ml-1">
                    ({pagination.total} total)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || loadingActivities}
                    className="hover:bg-[#7C3AED]/10 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!pagination.hasMore || loadingActivities}
                    className="hover:bg-[#7C3AED]/10 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-[#7C3AED]/10 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-[#7C3AED]" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              No recent activities
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Activities will appear here as actions are performed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function PropertyOwnerDashboard({
  user,
  onLogout,
  managers,
  propertyAssignments,
  onAddManager,
  onAssignManager,
  onRemoveManager,
  onUpdateManager,
  onDeactivateManager,
  onRefreshManagers,
}: PropertyOwnerDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { formatCurrency } = useCurrency();
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentView, setCurrentView] = usePersistentState(
    "owner-dashboard-view",
    "dashboard"
  );
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    string | undefined
  >(undefined);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);

  // React Query hooks - replaces manual useState + fetch
  const {
    data: properties = [],
    isLoading: propertiesLoading,
    refetch: refetchProperties,
  } = useProperties();
  const {
    data: units = [],
    isLoading: unitsLoading,
    refetch: refetchUnits,
  } = useUnits();
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
  } = useOwnerDashboard();
  const {
    data: accountInfo,
    isLoading: accountLoading,
    refetch: refetchAccount,
  } = useAccountInfo();

  // Combined loading state
  const loading =
    propertiesLoading || unitsLoading || dashboardLoading || accountLoading;

  // Reset to dashboard view on component mount (every login)
  useEffect(() => {
    setCurrentView("dashboard");
  }, []);

  // Clear the settings tab hint once the user leaves the settings view
  useEffect(() => {
    if (currentView !== "settings" && settingsInitialTab) {
      setSettingsInitialTab(undefined);
    }
  }, [currentView, settingsInitialTab]);

  // Calculate smart base currency based on properties
  const smartBaseCurrency = getSmartBaseCurrency(properties);
  const derivedPropertyLimit =
    accountInfo?.customer?.propertyLimit ??
    (!accountInfo?.customer?.planId ? TRIAL_PLAN_LIMITS.properties : undefined);
  const derivedUnitLimit =
    accountInfo?.customer?.plan?.unitLimit ??
    (!accountInfo?.customer?.planId ? TRIAL_PLAN_LIMITS.units : undefined);

  // Helper function to get rent frequency from property
  const getPropertyRentFrequency = (property: any): string => {
    if (!property) return "monthly";
    let features = property.features;

    // Handle null/undefined features
    if (features === null || features === undefined) {
      return "monthly";
    }

    // Handle string features (JSON)
    if (typeof features === "string") {
      try {
        features = JSON.parse(features);
      } catch {
        features = {};
      }
    }

    // Handle array features (legacy format - amenities array)
    if (Array.isArray(features)) {
      return property.rentFrequency || "monthly";
    }

    // Check for rent frequency in various locations
    const rentFrequency =
      features?.nigeria?.rentFrequency ||
      features?.rentFrequency ||
      property.rentFrequency ||
      "monthly";

    return rentFrequency;
  };

  // Helper function to get portfolio revenue label based on all properties
  const getPortfolioRevenueLabel = (): string => {
    if (properties.length === 0) return "Monthly Revenue";

    const frequencies = properties.map((p) => getPropertyRentFrequency(p));
    const allAnnual = frequencies.every((f) => f === "annual");
    const allMonthly = frequencies.every((f) => f === "monthly");

    if (allAnnual) return "Annual Revenue";
    if (allMonthly) return "Monthly Revenue";
    return "Revenue"; // Mixed frequencies
  };

  // Helper function to get property revenue based on rent frequency
  const getPropertyRevenue = (property: any): number => {
    const rentFrequency = getPropertyRentFrequency(property);
    const monthlyIncome = Number(
      property.totalMonthlyIncome || property.monthlyRevenue || 0
    );

    // If property has annual frequency, convert monthly income to annual (multiply by 12)
    if (rentFrequency === "annual") {
      return monthlyIncome * 12;
    }
    return monthlyIncome;
  };

  // Refetch all data - React Query makes this instant with cache
  const fetchData = async (silent = false) => {
    try {
      // Refetch all queries in parallel - React Query handles caching
      await Promise.all([
        refetchProperties(),
        refetchUnits(),
        refetchDashboard(),
        refetchAccount(),
      ]);

      // Fetch subscription status (not cached via React Query yet)
      try {
        const subStatus = await getSubscriptionStatus();
        if (subStatus) {
          setSubscription(subStatus);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      }

      if (!silent) {
        toast.success("Data refreshed");
      }
    } catch (error) {
      if (!silent) {
        toast.error("Failed to refresh data");
      }
    }
  };

  // Handle Paystack payment callbacks for property owners:
  // FRONTEND_URL/?payment_callback=upgrade&tab=billing&reference=...
  // FRONTEND_URL/?payment_callback=payment_method&tab=billing&reference=...
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const paymentCallback = params.get("payment_callback");
      const reference =
        params.get("reference") ||
        params.get("trxref") ||
        sessionStorage.getItem("upgrade_reference");

      // Handle payment_method callback - navigate to settings billing tab
      if (paymentCallback === "payment_method") {
        console.log(
          "[PropertyOwnerDashboard] Detected payment_method callback, navigating to settings..."
        );
        setSettingsInitialTab("billing");
        setCurrentView("settings");
        return;
      }

      if (paymentCallback !== "upgrade" || !reference) {
        return;
      }

      const handleUpgradeCallback = async () => {
        try {
          console.log(
            "[PropertyOwnerDashboard] Handling subscription upgrade callback with reference:",
            reference
          );
          toast.info("Verifying subscription upgrade...");

          const resp = await verifyUpgrade(reference);
          console.log(
            "[PropertyOwnerDashboard] Upgrade verification response:",
            resp
          );

          // Check for API error first
          if (resp.error) {
            throw new Error(
              resp.error.message ||
                resp.error.error ||
                resp.error.details ||
                "Upgrade verification failed"
            );
          }

          // Handle response similar to tenant payments (check status field)
          if (!resp.error && resp.data) {
            const data = resp.data;

            // Clean URL params immediately
            sessionStorage.removeItem("upgrade_reference");
            sessionStorage.removeItem("upgrade_plan_id");
            params.delete("reference");
            params.delete("trxref");
            params.delete("payment_callback");
            url.search = params.toString();
            window.history.replaceState({}, document.title, url.toString());

            if (data.status === "success" || data.success) {
              toast.success(
                data.message ||
                  "Plan upgraded successfully! Refreshing your dashboard..."
              );
              // Reload the page to refresh all data and remove trial banner
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else if (data.status === "failed") {
              toast.error(data.message || "Payment failed. Please try again.");
            } else if (data.status === "pending") {
              toast.info(
                data.message || "Payment is being processed. Please wait..."
              );
            } else {
              // Unknown status - show message or generic info
              toast.info(data.message || "Payment status: " + data.status);
            }
          } else {
            throw new Error("Upgrade verification failed");
          }
        } catch (error: any) {
          console.error(
            "[PropertyOwnerDashboard] Subscription upgrade verification error:",
            error
          );
          // api-client returns errors in format: { error: { error: string, message?: string, details?: string } }
          const message =
            error?.error?.message ||
            error?.error?.error ||
            error?.error?.details ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to verify subscription upgrade";
          toast.error(message);
        }
      };

      // Fire and forget (we don't await in the effect body)
      void handleUpgradeCallback();
    } catch (e) {
      // If URL parsing fails for any reason, just ignore and continue
      console.error(
        "[PropertyOwnerDashboard] Error while initializing upgrade callback handler:",
        e
      );
    }
  }, []);

  // Initial data fetch - React Query handles this automatically
  // Data loads on mount with caching and automatic refetching

  // Load recent billing history (subscriptions only)
  useEffect(() => {
    (async () => {
      try {
        setLoadingBills(true);
        console.log(
          "[PropertyOwnerDashboard] Fetching subscription payments..."
        );
        const res = await apiClient.get<any>("/api/payments", {
          page: 1,
          pageSize: 5,
          type: "subscription",
        });
        console.log("[PropertyOwnerDashboard] Payments API response:", res);
        if (!(res as any).error) {
          const items = (res as any).data?.items || [];
          console.log(
            "[PropertyOwnerDashboard] Subscription payments received:",
            items
          );
          setRecentBills(items);
        } else {
          console.error(
            "[PropertyOwnerDashboard] Error fetching payments:",
            (res as any).error
          );
        }
      } catch (e) {
        console.error(
          "[PropertyOwnerDashboard] Exception fetching payments:",
          e
        );
      } finally {
        setLoadingBills(false);
      }
    })();
  }, []);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      fetchData(true); // Silent refresh
    }, 30000); // 30 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [accountInfo]);

  // Reload managers when switching to managers view
  useEffect(() => {
    if (currentView === "managers" && onRefreshManagers) {
      console.log("🔄 Reloading managers on view change...");
      onRefreshManagers();
    }
  }, [currentView, onRefreshManagers]);

  // Refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchData(true); // Silent refresh
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [accountInfo]);

  // Mock properties data for backwards compatibility
  const mockProperties = [
    {
      id: 1,
      name: "Sunset Apartments",
      address: "123 Main St, Downtown",
      city: "Metro City",
      state: "CA",
      zipCode: "90210",
      propertyType: "Apartment Complex",
      yearBuilt: 2018,
      totalUnits: 24,
      units: 24,
      occupiedUnits: 22,
      occupied: 22,
      vacantUnits: 2,
      monthlyRevenue: 18400,
      avgRent: 850,
      occupancyRate: 91.7,
      manager: "Sarah Johnson",
      managerPhone: "(555) 123-4567",
      managerEmail: "sarah@contrezz.com",
      status: "active",
      lastInspection: "2024-02-15",
      nextInspection: "2024-05-15",
      maintenanceRequests: 3,
      expiredLeases: 2,
      features: ["Pool", "Gym", "Parking", "Laundry"],
      images: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
      ],
      financials: {
        grossRent: 20400,
        expenses: 5200,
        netIncome: 15200,
        capRate: 6.8,
        cashFlow: 12800,
        currency: "USD",
      },
      insurance: {
        provider: "Property Insurance Co.",
        policyNumber: "PI-123456",
        premium: 850,
        expiration: "2024-12-31",
      },
      currency: "NGN",
    },
    {
      id: 2,
      name: "Riverside Complex",
      address: "456 River Ave, Westside",
      city: "Metro City",
      state: "CA",
      zipCode: "90211",
      propertyType: "Mixed Use",
      yearBuilt: 2020,
      totalUnits: 36,
      units: 36,
      occupiedUnits: 34,
      occupied: 34,
      vacantUnits: 2,
      monthlyRevenue: 25200,
      avgRent: 750,
      occupancyRate: 94.4,
      manager: "Mike Chen",
      managerPhone: "(555) 987-6543",
      managerEmail: "mike@contrezz.com",
      status: "active",
      lastInspection: "2024-03-01",
      nextInspection: "2024-06-01",
      maintenanceRequests: 5,
      expiredLeases: 1,
      features: ["Retail Space", "Elevator", "Security System", "Central AC"],
      images: [
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
      ],
      financials: {
        grossRent: 27000,
        expenses: 6800,
        netIncome: 20200,
        capRate: 7.2,
        cashFlow: 17500,
        currency: "USD",
      },
      insurance: {
        provider: "Metro Insurance",
        policyNumber: "MI-789012",
        premium: 1200,
        expiration: "2024-11-30",
      },
      currency: "NGN",
    },
    {
      id: 3,
      name: "Park View Towers",
      address: "789 Park Blvd, Northside",
      city: "Metro City",
      state: "CA",
      zipCode: "90212",
      propertyType: "High Rise",
      yearBuilt: 2019,
      totalUnits: 48,
      units: 48,
      occupiedUnits: 45,
      occupied: 45,
      vacantUnits: 3,
      monthlyRevenue: 31500,
      avgRent: 720,
      occupancyRate: 93.8,
      manager: "Lisa Rodriguez",
      managerPhone: "(555) 456-7890",
      managerEmail: "lisa@contrezz.com",
      status: "active",
      lastInspection: "2024-01-20",
      nextInspection: "2024-04-20",
      maintenanceRequests: 2,
      expiredLeases: 3,
      features: ["Concierge", "Rooftop Deck", "Valet Parking", "Smart Home"],
      images: [
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400",
      ],
      financials: {
        grossRent: 34560,
        expenses: 8900,
        netIncome: 25660,
        capRate: 7.8,
        cashFlow: 22100,
        currency: "USD",
      },
      insurance: {
        provider: "Tower Insurance Ltd.",
        policyNumber: "TI-345678",
        premium: 1500,
        expiration: "2025-01-15",
      },
      currency: "NGN",
    },
    {
      id: 4,
      name: "Garden Homes",
      address: "321 Garden Way, Suburbs",
      city: "Metro City",
      state: "CA",
      zipCode: "90213",
      propertyType: "Townhouse",
      yearBuilt: 2016,
      totalUnits: 18,
      units: 18,
      occupiedUnits: 16,
      occupied: 16,
      vacantUnits: 2,
      monthlyRevenue: 12400,
      avgRent: 775,
      occupancyRate: 88.9,
      manager: "David Thompson",
      managerPhone: "(555) 321-0987",
      managerEmail: "david@contrezz.com",
      status: "maintenance",
      lastInspection: "2024-02-28",
      nextInspection: "2024-05-28",
      maintenanceRequests: 8,
      expiredLeases: 0,
      features: ["Private Garage", "Garden", "Pet Friendly", "Storage"],
      images: [
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
      ],
      financials: {
        grossRent: 13950,
        expenses: 4200,
        netIncome: 9750,
        capRate: 5.9,
        cashFlow: 8100,
        currency: "USD",
      },
      insurance: {
        provider: "Home Shield Insurance",
        policyNumber: "HS-901234",
        premium: 650,
        expiration: "2024-10-15",
      },
      currency: "NGN",
    },
  ];

  // Use real properties if available, otherwise use mock
  const displayProperties = properties.length > 0 ? properties : mockProperties;

  // Show welcome message for first-time users
  useEffect(() => {
    if (user?.isFirstLogin) {
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 5000);
    }
  }, [user]);

  // Use backend-provided portfolio overview when available
  // Note: Backend revenue is always monthly equivalent, so we need to calculate
  // the display value based on property frequencies
  const portfolioStats = dashboardData?.portfolio
    ? {
        totalProperties: dashboardData.portfolio.totalProperties || 0,
        totalUnits: dashboardData.portfolio.totalUnits || 0,
        occupancyRate:
          Math.round((dashboardData.portfolio.occupancyRate || 0) * 10) / 10,
        // Backend provides monthly equivalent, but we need to calculate display value
        // based on property frequencies (multiply by 12 for annual properties)
        monthlyRevenue:
          properties.length > 0
            ? properties.reduce((sum, p) => sum + getPropertyRevenue(p), 0)
            : dashboardData.revenue?.currentMonth || 0,
      }
    : {
        totalProperties: properties.length,
        totalUnits: properties.reduce((sum, p) => sum + p.units, 0),
        occupancyRate:
          properties.length > 0
            ? Math.round(
                properties.reduce(
                  (sum, p) => sum + ((p.occupied || 0) / (p.units || 1)) * 100,
                  0
                ) / properties.length
              )
            : 0,
        monthlyRevenue: properties.reduce(
          (sum, p) => sum + getPropertyRevenue(p),
          0
        ),
      };

  const recentActivity = [
    {
      id: 1,
      description: "Rent payment received from Sunset Apartments Unit 4B",
      amount: "₦1,250",
      time: "2 hours ago",
    },
    {
      id: 2,
      description: "New maintenance request at Riverside Complex",
      time: "4 hours ago",
    },
    {
      id: 3,
      description: "ACH payment processed for Park View Towers Unit C401",
      amount: "₦1,800",
      time: "1 day ago",
    },
  ];

  const navigation = [
    { name: "Portfolio Overview", key: "dashboard", icon: Home },
    { name: "Properties", key: "properties", icon: Building },
    { name: "Tenant Management", key: "tenants", icon: Users },
    { name: "Tenant Verification", key: "tenant-verification", icon: Shield },
    { name: "Payments", key: "payments", icon: Wallet },
    { name: "Financial Reports", key: "financial", icon: BarChart3 },
    { name: "Expenses", key: "expenses", icon: Receipt },
    { name: "Maintenance", key: "maintenance", icon: Wrench },
    { name: "Property Managers", key: "managers", icon: UserCog },
    { name: "Key Management", key: "access", icon: Key },
    { name: "Documents", key: "documents", icon: FileBox },
    { name: "Settings", key: "settings", icon: Cog },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      {/* Header - Inverted Brand Color (Gray 900) */}
      <header className="bg-[#111827] shadow-lg sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2 text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] p-2 rounded-xl">
                  <ContrezztLogo className="w-6 h-6 text-[#111827]" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
                  Contrezz
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                {user.company}
              </Badge>

              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center ring-2 ring-white/20">
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

      {/* Welcome Notification */}
      {showWelcome && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Welcome to Contrezz, {user.name}!
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Your account has been successfully set up. Get started by adding
                your first property or exploring the dashboard features.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWelcome(false)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar - Dark Brand Design (Matching Header) */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#111827] shadow-xl lg:shadow-none border-r border-white/10 mt-16 lg:mt-0 transition-transform duration-300 ease-in-out`}
        >
          {/* Mobile close button */}
          <div className="lg:hidden absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.key;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setCurrentView(item.key);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-lg shadow-purple-500/25"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isActive ? "text-white" : "text-white/60"
                      }`}
                    />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

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
          </nav>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 w-full min-w-0">
          {currentView === "properties" ? (
            <PropertiesPage
              user={user}
              onBack={() => setCurrentView("dashboard")}
              onNavigateToAddProperty={() => setCurrentView("add-property")}
              properties={properties}
              onViewProperty={async (propertyId: string) => {
                try {
                  const res = await getProperty(propertyId);
                  if (res.error)
                    throw new Error(
                      res.error.error || "Failed to fetch property"
                    );
                  setSelectedProperty(res.data);
                  setCurrentView("property-details");
                } catch (e: any) {
                  toast.error(e?.message || "Failed to fetch property");
                }
              }}
              onEditProperty={async (propertyId: string) => {
                try {
                  const res = await getProperty(propertyId);
                  if (res.error)
                    throw new Error(
                      res.error.error || "Failed to fetch property"
                    );
                  setSelectedProperty(res.data);
                  setCurrentView("property-edit");
                } catch (e: any) {
                  toast.error(e?.message || "Failed to fetch property");
                }
              }}
              onNavigateToTenants={() => setCurrentView("tenants")}
              onNavigateToMaintenance={() => setCurrentView("maintenance")}
              onPropertyDeleted={async (propertyId) => {
                // Refetch properties to get fresh data from server
                await refetchProperties();
                toast.success("Property deleted successfully");
              }}
              onRefreshProperties={() => refetchProperties()}
            />
          ) : currentView === "property-details" ? (
            <div className="p-4 lg:p-8 bg-gray-50">
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentView("properties")}
                    className="border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED] hover:bg-purple-50"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Properties
                  </Button>
                  <Button
                    onClick={() => setCurrentView("property-edit")}
                    className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Property
                  </Button>
                </div>

                {selectedProperty ? (
                  <>
                    {/* Hero Section with Cover Image */}
                    {(selectedProperty.coverImage ||
                      (Array.isArray(selectedProperty.images) &&
                        selectedProperty.images[0])) && (
                      <Card className="border-0 shadow-xl overflow-hidden">
                        <div className="relative">
                          <img
                            src={
                              selectedProperty.coverImage ||
                              selectedProperty.images[0]
                            }
                            alt={selectedProperty.name}
                            className="w-full h-80 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                            <h1 className="text-4xl font-bold mb-2">
                              {selectedProperty?.name || "Property Details"}
                            </h1>
                            <div className="flex items-center gap-2 text-lg">
                              <MapPin className="h-5 w-5" />
                              <span>
                                {selectedProperty?.address},{" "}
                                {selectedProperty?.city},{" "}
                                {selectedProperty?.state}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Title Card (if no cover image) */}
                    {!selectedProperty.coverImage &&
                      !(
                        Array.isArray(selectedProperty.images) &&
                        selectedProperty.images[0]
                      ) && (
                        <Card className="border-2 border-purple-200 shadow-md">
                          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
                            <CardTitle className="text-3xl">
                              {selectedProperty?.name || "Property Details"}
                            </CardTitle>
                            <CardDescription className="text-purple-100 text-base">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                <span>
                                  {selectedProperty?.address},{" "}
                                  {selectedProperty?.city},{" "}
                                  {selectedProperty?.state}
                                </span>
                              </div>
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      )}

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Basic Info Card */}
                      <Card className="border-2 border-purple-200 shadow-md">
                        <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
                          <div className="flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            <CardTitle className="text-lg">
                              Basic Information
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 pt-6">
                          <div>
                            <p className="text-sm text-gray-600 font-medium">
                              Type
                            </p>
                            <p className="font-semibold text-gray-900">
                              {selectedProperty.propertyType || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">
                              Status
                            </p>
                            <p className="font-semibold text-[#7C3AED]">
                              {selectedProperty.status || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">
                              Created
                            </p>
                            <p className="font-semibold text-gray-900 text-sm">
                              {selectedProperty.createdAt
                                ? new Date(
                                    selectedProperty.createdAt
                                  ).toLocaleString()
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">
                              Updated
                            </p>
                            <p className="font-semibold text-gray-900 text-sm">
                              {selectedProperty.updatedAt
                                ? new Date(
                                    selectedProperty.updatedAt
                                  ).toLocaleString()
                                : "N/A"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Management Card */}
                      <Card className="border-2 border-purple-200 shadow-md">
                        <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            <CardTitle className="text-lg">
                              Management
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          {Array.isArray(selectedProperty.property_managers) &&
                          selectedProperty.property_managers.length > 0 ? (
                            <div className="space-y-3">
                              {selectedProperty.property_managers.map(
                                (pm: any) => (
                                  <div
                                    key={pm.id}
                                    className="p-4 border-2 border-purple-100 rounded-xl bg-gradient-to-br from-purple-50 to-white hover:border-purple-300 transition-colors"
                                  >
                                    <p className="font-bold text-gray-900 mb-2">
                                      {pm.users?.name || "Manager"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {pm.users?.email || "—"}
                                    </p>
                                    {pm.users?.phone && (
                                      <p className="text-sm text-gray-600">
                                        {pm.users.phone}
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-600 text-center py-4">
                              Unassigned
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Location Card */}
                    <Card className="border-2 border-purple-200 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          <CardTitle className="text-lg">Location</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Address
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.address || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            City
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.city || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            State
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.state || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Postal Code
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.postalCode || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Country
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.country || "N/A"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Property Details Card */}
                    <Card className="border-2 border-purple-200 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          <CardTitle className="text-lg">
                            Property Details
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-3 gap-4 pt-6">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Year Built
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.yearBuilt ?? "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Total Units
                          </p>
                          <p className="font-semibold text-[#7C3AED] text-lg">
                            {selectedProperty.totalUnits ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Floors
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.floors ?? "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Total Area
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.totalArea
                              ? `${selectedProperty.totalArea} sq ft`
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Lot Size
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.lotSize
                              ? `${selectedProperty.lotSize} sq ft`
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Parking
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.parking ?? "N/A"} spaces
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Financial Card */}
                    <Card className="border-2 border-green-200 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          <CardTitle className="text-lg">
                            Financial Information
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-3 gap-4 pt-6">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Currency
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Avg Rent
                          </p>
                          <p className="font-semibold text-green-600 text-lg">
                            {selectedProperty.currency === "NGN"
                              ? "₦"
                              : selectedProperty.currency === "USD"
                              ? "$"
                              : selectedProperty.currency === "GBP"
                              ? "£"
                              : selectedProperty.currency === "EUR"
                              ? "€"
                              : ""}
                            {(
                              Number(selectedProperty.avgRent) || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Current Property Value
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.currentValue
                              ? `${
                                  selectedProperty.currency === "NGN"
                                    ? "₦"
                                    : selectedProperty.currency === "USD"
                                    ? "$"
                                    : selectedProperty.currency === "GBP"
                                    ? "£"
                                    : selectedProperty.currency === "EUR"
                                    ? "€"
                                    : ""
                                }${Number(
                                  selectedProperty.currentValue
                                ).toLocaleString()}`
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Security Deposit
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.currency === "NGN"
                              ? "₦"
                              : selectedProperty.currency === "USD"
                              ? "$"
                              : selectedProperty.currency === "GBP"
                              ? "£"
                              : selectedProperty.currency === "EUR"
                              ? "€"
                              : ""}
                            {(
                              Number(selectedProperty.securityDeposit) || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Application Fee
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.currency === "NGN"
                              ? "₦"
                              : selectedProperty.currency === "USD"
                              ? "$"
                              : selectedProperty.currency === "GBP"
                              ? "£"
                              : selectedProperty.currency === "EUR"
                              ? "€"
                              : ""}
                            {(
                              Number(selectedProperty.applicationFee) || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Caution Fee
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.currency === "NGN"
                              ? "₦"
                              : selectedProperty.currency === "USD"
                              ? "$"
                              : selectedProperty.currency === "GBP"
                              ? "£"
                              : selectedProperty.currency === "EUR"
                              ? "€"
                              : ""}
                            {(
                              Number(selectedProperty.cautionFee) || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Legal Fee
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.currency === "NGN"
                              ? "₦"
                              : selectedProperty.currency === "USD"
                              ? "$"
                              : selectedProperty.currency === "GBP"
                              ? "£"
                              : selectedProperty.currency === "EUR"
                              ? "€"
                              : ""}
                            {(
                              Number(selectedProperty.legalFee) || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Agent Commission
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.currency === "NGN"
                              ? "₦"
                              : selectedProperty.currency === "USD"
                              ? "$"
                              : selectedProperty.currency === "GBP"
                              ? "£"
                              : selectedProperty.currency === "EUR"
                              ? "€"
                              : ""}
                            {(
                              Number(selectedProperty.agentCommission) || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Service Charge
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.currency === "NGN"
                              ? "₦"
                              : selectedProperty.currency === "USD"
                              ? "$"
                              : selectedProperty.currency === "GBP"
                              ? "£"
                              : selectedProperty.currency === "EUR"
                              ? "€"
                              : ""}
                            {(
                              Number(selectedProperty.serviceCharge) || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Agreement Fee
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.currency === "NGN"
                              ? "₦"
                              : selectedProperty.currency === "USD"
                              ? "$"
                              : selectedProperty.currency === "GBP"
                              ? "£"
                              : selectedProperty.currency === "EUR"
                              ? "€"
                              : ""}
                            {(
                              Number(selectedProperty.agreementFee) || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Property Taxes
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.currency === "NGN"
                              ? "₦"
                              : selectedProperty.currency === "USD"
                              ? "$"
                              : selectedProperty.currency === "GBP"
                              ? "£"
                              : selectedProperty.currency === "EUR"
                              ? "€"
                              : ""}
                            {(
                              Number(selectedProperty.propertyTaxes) || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Insurance Card */}
                    <Card className="border-2 border-blue-200 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          <CardTitle className="text-lg">Insurance</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Provider
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.insuranceProvider || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Policy Number
                          </p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {selectedProperty.insurancePolicyNumber || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Premium
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.currency === "NGN"
                              ? "₦"
                              : selectedProperty.currency === "USD"
                              ? "$"
                              : selectedProperty.currency === "GBP"
                              ? "£"
                              : selectedProperty.currency === "EUR"
                              ? "€"
                              : ""}
                            {(
                              Number(selectedProperty.insurancePremium) || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Expiration
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedProperty.insuranceExpiration
                              ? new Date(
                                  selectedProperty.insuranceExpiration
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Features Card */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="border-2 border-purple-200 shadow-md">
                        <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
                          <div className="flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            <CardTitle className="text-lg">
                              Property Features
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(selectedProperty.features)
                              ? selectedProperty.features
                              : []
                            ).map((f: any, idx: number) => (
                              <Badge
                                key={idx}
                                className="bg-purple-100 text-[#7C3AED] border border-purple-300 hover:bg-purple-200 px-3 py-1"
                              >
                                {String(f)}
                              </Badge>
                            ))}
                            {(!selectedProperty.features ||
                              selectedProperty.features.length === 0) && (
                              <span className="text-gray-500">
                                No features specified
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-green-200 shadow-md">
                        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                          <div className="flex items-center gap-2">
                            <Bed className="h-5 w-5" />
                            <CardTitle className="text-lg">
                              Unit Features
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(selectedProperty.unitFeatures)
                              ? selectedProperty.unitFeatures
                              : []
                            ).map((f: any, idx: number) => (
                              <Badge
                                key={idx}
                                className="bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 px-3 py-1"
                              >
                                {String(f)}
                              </Badge>
                            ))}
                            {(!selectedProperty.unitFeatures ||
                              selectedProperty.unitFeatures.length === 0) && (
                              <span className="text-gray-500">
                                No unit features specified
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Description & Notes */}
                    {(selectedProperty.description ||
                      selectedProperty.notes) && (
                      <Card className="border-2 border-gray-200 shadow-md">
                        <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                          <div className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            <CardTitle className="text-lg">
                              Additional Information
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                          {selectedProperty.description && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                Description:
                              </p>
                              <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                                {selectedProperty.description}
                              </p>
                            </div>
                          )}
                          {selectedProperty.notes && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                Internal Notes:
                              </p>
                              <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                                {selectedProperty.notes}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="border-2 border-gray-200 shadow-md">
                    <CardContent className="text-center py-12">
                      <div className="text-gray-600">
                        Loading property details...
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : currentView === "property-edit" ? (
            <AddPropertyPage
              user={user}
              onBack={() => setCurrentView("property-details")}
              initialValues={selectedProperty}
              mode="edit"
              managers={managers}
              onManagerCreated={onRefreshManagers}
              propertyLimit={derivedPropertyLimit}
              currentPropertyCount={
                accountInfo?.customer?.actualPropertiesCount ??
                properties.length
              }
              unitLimit={derivedUnitLimit}
              currentUnitCount={
                accountInfo?.customer?.actualUnitsCount ?? units.length
              }
              onSave={async (data: any) => {
                try {
                  if (!selectedProperty?.id)
                    throw new Error("Missing property id");
                  const payload: any = {
                    ...data,
                    totalUnits: data.totalUnits
                      ? Number(data.totalUnits)
                      : undefined,
                    floors: data.floors ? Number(data.floors) : undefined,
                    yearBuilt: data.yearBuilt
                      ? Number(data.yearBuilt)
                      : undefined,
                    totalArea: data.totalArea
                      ? Number(data.totalArea)
                      : undefined,
                    lotSize: data.lotSize ? Number(data.lotSize) : undefined,
                    parking: data.parking ? Number(data.parking) : undefined,
                    avgRent: data.avgRent ? Number(data.avgRent) : undefined,
                    securityDeposit: data.securityDeposit
                      ? Number(data.securityDeposit)
                      : undefined,
                    applicationFee: data.applicationFee
                      ? Number(data.applicationFee)
                      : undefined,
                    cautionFee: data.cautionFee
                      ? Number(data.cautionFee)
                      : undefined,
                    legalFee: data.legalFee ? Number(data.legalFee) : undefined,
                    agentCommission: data.agentCommission
                      ? Number(data.agentCommission)
                      : undefined,
                    serviceCharge: data.serviceCharge
                      ? Number(data.serviceCharge)
                      : undefined,
                    agreementFee: data.agreementFee
                      ? Number(data.agreementFee)
                      : undefined,
                    insurancePremium:
                      data.insurance?.premium || data.insurancePremium,
                    insuranceExpiration:
                      data.insurance?.expiration || data.insuranceExpiration,
                    insuranceProvider:
                      data.insurance?.provider || data.insuranceProvider,
                    insurancePolicyNumber:
                      data.insurance?.policyNumber ||
                      data.insurancePolicyNumber,
                    propertyTaxes: data.propertyTaxes
                      ? Number(data.propertyTaxes)
                      : undefined,
                    images: Array.isArray(data.images) ? data.images : [],
                    insurance: undefined,
                    managerId: data.managerId || "", // Include managerId for manager assignment changes
                  };

                  console.log("🔄 Updating property with payload:", {
                    propertyId: selectedProperty.id,
                    managerId: payload.managerId,
                    hasManagerChange:
                      payload.managerId !== selectedProperty.managerId,
                  });

                  const res = await updateProperty(
                    selectedProperty.id,
                    payload
                  );
                  if (res.error)
                    throw new Error(
                      res.error.error || "Failed to update property"
                    );

                  toast.success("Property updated successfully");

                  // Refresh managers list to reflect new assignments
                  if (onRefreshManagers) {
                    console.log("🔄 Refreshing managers list...");
                    await onRefreshManagers();
                  }

                  // Refresh all data to show updated property
                  await fetchData(true);
                  const refreshed = await getProperty(selectedProperty.id);
                  setSelectedProperty(refreshed.data);
                  setCurrentView("property-details");
                } catch (e: any) {
                  toast.error(e?.message || "Failed to update property");
                }
              }}
            />
          ) : currentView === "tenants" ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <TenantManagement properties={properties} />
              </div>
            </div>
          ) : currentView === "tenant-verification" ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <TenantVerificationManagement />
              </div>
            </div>
          ) : currentView === "payments" ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <PaymentOverview />
              </div>
            </div>
          ) : currentView === "financial" ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <FinancialReports properties={properties} user={user} />
              </div>
            </div>
          ) : currentView === "expenses" ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <ExpenseManagement
                  user={user}
                  properties={properties}
                  units={units}
                  onBack={() => setCurrentView("dashboard")}
                />
              </div>
            </div>
          ) : currentView === "maintenance" ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <MaintenanceTickets properties={properties} />
              </div>
            </div>
          ) : currentView === "managers" ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <PropertyManagerManagement
                  user={user}
                  managers={managers}
                  properties={properties}
                  propertyAssignments={propertyAssignments}
                  onAddManager={onAddManager}
                  onAssignManager={onAssignManager}
                  onRemoveManager={onRemoveManager}
                  onUpdateManager={onUpdateManager}
                  onDeactivateManager={onDeactivateManager}
                  onRefreshManagers={onRefreshManagers}
                />
              </div>
            </div>
          ) : currentView === "access" ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <AccessControl />
              </div>
            </div>
          ) : currentView === "documents" ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <PropertyOwnerDocuments />
              </div>
            </div>
          ) : currentView === "add-property" ? (
            <AddPropertyPage
              user={user}
              onBack={() => setCurrentView("dashboard")}
              managers={managers}
              onManagerCreated={onRefreshManagers}
              propertyLimit={derivedPropertyLimit}
              currentPropertyCount={
                accountInfo?.customer?.actualPropertiesCount ??
                properties.length
              }
              unitLimit={derivedUnitLimit}
              currentUnitCount={
                accountInfo?.customer?.actualUnitsCount ?? units.length
              }
              onSave={(propertyData) => {
                // Persist to backend, then refresh list
                (async () => {
                  try {
                    const payload = {
                      ...propertyData,
                      // Coerce numeric fields to numbers for API
                      totalUnits: Number(propertyData.totalUnits) || 0,
                      floors: propertyData.floors
                        ? Number(propertyData.floors)
                        : undefined,
                      yearBuilt: propertyData.yearBuilt
                        ? Number(propertyData.yearBuilt)
                        : undefined,
                      totalArea: propertyData.totalArea
                        ? Number(propertyData.totalArea)
                        : undefined,
                      lotSize: propertyData.lotSize
                        ? Number(propertyData.lotSize)
                        : undefined,
                      parking: propertyData.parking
                        ? Number(propertyData.parking)
                        : undefined,
                      avgRent: propertyData.avgRent
                        ? Number(propertyData.avgRent)
                        : undefined,
                      securityDeposit: propertyData.securityDeposit
                        ? Number(propertyData.securityDeposit)
                        : undefined,
                      applicationFee: propertyData.applicationFee
                        ? Number(propertyData.applicationFee)
                        : undefined,
                      cautionFee: propertyData.cautionFee
                        ? Number(propertyData.cautionFee)
                        : undefined,
                      legalFee: propertyData.legalFee
                        ? Number(propertyData.legalFee)
                        : undefined,
                      agentCommission: propertyData.agentCommission
                        ? Number(propertyData.agentCommission)
                        : undefined,
                      serviceCharge: propertyData.serviceCharge
                        ? Number(propertyData.serviceCharge)
                        : undefined,
                      agreementFee: propertyData.agreementFee
                        ? Number(propertyData.agreementFee)
                        : undefined,
                      insurancePremium:
                        propertyData.insurance?.premium ||
                        propertyData.insurancePremium,
                      insuranceExpiration:
                        propertyData.insurance?.expiration ||
                        propertyData.insuranceExpiration,
                      insuranceProvider:
                        propertyData.insurance?.provider ||
                        propertyData.insuranceProvider,
                      insurancePolicyNumber:
                        propertyData.insurance?.policyNumber ||
                        propertyData.insurancePolicyNumber,
                      propertyTaxes: propertyData.propertyTaxes
                        ? Number(propertyData.propertyTaxes)
                        : undefined,
                      images: Array.isArray(propertyData.images)
                        ? propertyData.images
                        : [],
                      // Remove the nested insurance object to avoid confusion
                      insurance: undefined,
                      // Remove fields that aren't in the API
                      id: undefined,
                      status: undefined,
                      occupiedUnits: undefined,
                      vacantUnits: undefined,
                      monthlyRevenue: undefined,
                      occupancyRate: undefined,
                      maintenanceRequests: undefined,
                      expiredLeases: undefined,
                      lastInspection: undefined,
                      nextInspection: undefined,
                      financials: undefined,
                    } as any;

                    const res = await createProperty(payload);
                    if (res.error)
                      throw new Error(
                        res.error.error || "Failed to create property"
                      );
                    toast.success("Property created");
                    // Auto-assign selected manager if provided
                    if ((propertyData as any).managerId) {
                      try {
                        await onAssignManager?.(
                          (propertyData as any).managerId,
                          res.data.id
                        );
                      } catch (e) {
                        // non-blocking
                      }
                    }
                    await fetchData(true);
                    setCurrentView("properties");
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to create property");
                  }
                })();
              }}
            />
          ) : currentView === "settings" ? (
            <PropertyOwnerSettings
              user={user}
              onBack={() => setCurrentView("dashboard")}
              initialTab={settingsInitialTab}
              onSave={(updates) => {
                // Handle profile updates here
                console.log("Profile updates:", updates);
              }}
              onLogout={onLogout}
            />
          ) : (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                {/* Welcome Section - Brand Styled */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></div>
                    <span className="text-sm text-gray-500">
                      Active Portfolio
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Welcome back, {user.name.split(" ")[0]}!
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Here's an overview of your property portfolio
                  </p>
                </div>

                {/* Trial Status Banner - Only shows for trial/suspended/grace period */}
                <TrialStatusBanner
                  onUpgradeClick={() => setShowUpgradeModal(true)}
                  onAddPaymentMethod={() => {
                    setSettingsInitialTab("billing");
                    setCurrentView("settings");
                  }}
                />

                {/* Key Metrics - Brand Styled Cards */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Properties
                      </CardTitle>
                      <div className="p-2 bg-[#7C3AED]/10 rounded-lg">
                        <Building className="h-4 w-4 text-[#7C3AED]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">
                        {portfolioStats.totalProperties}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {portfolioStats.totalUnits} total units
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-[#10B981] to-[#34D399]"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Occupancy Rate
                      </CardTitle>
                      <div className="p-2 bg-[#10B981]/10 rounded-lg">
                        <Users className="h-4 w-4 text-[#10B981]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">
                        {portfolioStats.occupancyRate}%
                      </div>
                      <p className="text-sm text-[#10B981] mt-1">
                        +2.1% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {getPortfolioRevenueLabel()}
                      </CardTitle>
                      <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
                        <DollarSign className="h-4 w-4 text-[#3B82F6]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">
                        {formatCurrencyUtil(
                          portfolioStats.monthlyRevenue || 0,
                          smartBaseCurrency
                        )}
                      </div>
                      <p className="text-sm text-[#10B981] mt-1">
                        +12.5% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Collection Rate
                      </CardTitle>
                      <div className="p-2 bg-[#F59E0B]/10 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-[#F59E0B]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">
                        {typeof dashboardData?.collection?.rate === "number"
                          ? `${dashboardData.collection.rate}%`
                          : "0%"}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Collected{" "}
                        {formatCurrency(
                          dashboardData?.collection?.collected || 0
                        )}{" "}
                        of{" "}
                        {formatCurrency(
                          dashboardData?.collection?.expected || 0
                        )}{" "}
                        this month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Active License & Billing - Brand Styled */}
                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"></div>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold">
                          Subscription
                        </CardTitle>
                        <CardDescription>
                          Your current license and renewal
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          subscription?.status === "active"
                            ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30"
                            : "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/30"
                        }
                      >
                        {subscription?.status || "—"}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-xs uppercase tracking-wider">
                            Current Plan
                          </p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {subscription?.plan?.name ||
                              accountInfo?.customer?.plan?.name ||
                              "—"}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-xs uppercase tracking-wider">
                            Billing Cycle
                          </p>
                          <p className="font-semibold text-gray-900 mt-1 capitalize">
                            {subscription?.billingCycle ||
                              accountInfo?.customer?.billingCycle ||
                              "—"}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-xs uppercase tracking-wider">
                            Next Billing Date
                          </p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {subscription?.nextBillingDate
                              ? new Date(
                                  subscription.nextBillingDate
                                ).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-xs uppercase tracking-wider">
                            MRR
                          </p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {formatCurrencyUtil(
                              subscription?.mrr ||
                                accountInfo?.customer?.mrr ||
                                0,
                              subscription?.plan?.currency || "NGN"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 flex gap-3">
                        <Button
                          onClick={() => setShowUpgradeModal(true)}
                          className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
                        >
                          Upgrade Plan
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSettingsInitialTab("billing");
                            setCurrentView("settings");
                          }}
                          className="hover:bg-[#7C3AED]/10 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                        >
                          View Billing History
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold">
                          Recent Billing
                        </CardTitle>
                        <CardDescription>
                          Your last subscription payments
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingBills ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin text-[#7C3AED]" />{" "}
                          Loading...
                        </div>
                      ) : recentBills.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Receipt className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500">
                            No subscription payments yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentBills.map((p: any) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
                            >
                              <div className="text-sm">
                                <div className="font-semibold text-gray-900">
                                  {(p.type || "subscription")
                                    .toString()
                                    .toUpperCase()}
                                </div>
                                <div className="text-gray-500 text-xs mt-1">
                                  {new Date(
                                    p.paidAt || p.createdAt
                                  ).toLocaleString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">
                                  {p.currency || "NGN"}{" "}
                                  {(Number(p.amount) || 0).toFixed(2)}
                                </div>
                                <Badge
                                  className={`mt-1 capitalize ${
                                    p.status === "success" ||
                                    p.status === "completed"
                                      ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {p.status || "success"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Properties List - Brand Styled */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold">
                          Property Portfolio
                        </CardTitle>
                        <CardDescription>
                          Your managed properties
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setCurrentView("add-property")}
                        className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Property
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {properties.map((property: any) => (
                          <div
                            key={property.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#7C3AED]/50 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-900">
                                  {property.name}
                                </h4>
                                <Badge
                                  className={
                                    property.status === "active"
                                      ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30"
                                      : "bg-gray-100 text-gray-600"
                                  }
                                >
                                  {property.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {property.address}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {property.occupiedUnits ?? 0}/
                                  {property._count?.units ?? 0} units
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <UserCog className="h-3 w-3" />
                                {property.property_managers?.[0]?.users?.name ??
                                  "Unassigned"}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-[#7C3AED]/10 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                                onClick={async () => {
                                  try {
                                    const res = await getProperty(property.id);
                                    if (res.error)
                                      throw new Error(
                                        res.error.error ||
                                          "Failed to fetch property"
                                      );
                                    setSelectedProperty(res.data);
                                    setCurrentView("property-details");
                                  } catch (e: any) {
                                    toast.error(
                                      e?.message || "Failed to open property"
                                    );
                                  }
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-[#7C3AED]/10 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                                onClick={async () => {
                                  try {
                                    const res = await getProperty(property.id);
                                    if (res.error)
                                      throw new Error(
                                        res.error.error ||
                                          "Failed to fetch property"
                                      );
                                    setSelectedProperty(res.data);
                                    setCurrentView("property-edit");
                                  } catch (e: any) {
                                    toast.error(
                                      e?.message || "Failed to open editor"
                                    );
                                  }
                                }}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity with Pagination */}
                  <RecentActivityCard />
                </div>

                {/* Quick Actions - Brand Styled */}
                <Card className="mt-8 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">
                      Quick Actions
                    </CardTitle>
                    <CardDescription>
                      Common tasks for property owners
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      <button
                        onClick={() => setCurrentView("add-property")}
                        className="group h-24 md:h-28 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#7C3AED]/30 bg-[#7C3AED]/5 hover:border-[#7C3AED] hover:bg-[#7C3AED]/10 transition-all duration-200"
                      >
                        <div className="p-2 bg-[#7C3AED]/10 rounded-lg group-hover:bg-[#7C3AED]/20 transition-colors">
                          <Plus className="h-5 w-5 md:h-6 md:w-6 text-[#7C3AED]" />
                        </div>
                        <span className="mt-2 text-sm font-medium text-gray-700">
                          Add Property
                        </span>
                      </button>
                      <button
                        onClick={() => setCurrentView("managers")}
                        className="group h-24 md:h-28 flex flex-col items-center justify-center rounded-xl border border-gray-200 hover:border-[#7C3AED] hover:shadow-md transition-all duration-200"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#7C3AED]/10 transition-colors">
                          <UserCog className="h-5 w-5 md:h-6 md:w-6 text-gray-600 group-hover:text-[#7C3AED]" />
                        </div>
                        <span className="mt-2 text-sm font-medium text-gray-700">
                          Hire Manager
                        </span>
                      </button>
                      <button
                        onClick={() => setCurrentView("financial")}
                        className="group h-24 md:h-28 flex flex-col items-center justify-center rounded-xl border border-gray-200 hover:border-[#7C3AED] hover:shadow-md transition-all duration-200"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#7C3AED]/10 transition-colors">
                          <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-gray-600 group-hover:text-[#7C3AED]" />
                        </div>
                        <span className="mt-2 text-sm font-medium text-gray-700">
                          View Reports
                        </span>
                      </button>
                      <button
                        onClick={() => setCurrentView("tenants")}
                        className="group h-24 md:h-28 flex flex-col items-center justify-center rounded-xl border border-gray-200 hover:border-[#7C3AED] hover:shadow-md transition-all duration-200"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#7C3AED]/10 transition-colors">
                          <Users className="h-5 w-5 md:h-6 md:w-6 text-gray-600 group-hover:text-[#7C3AED]" />
                        </div>
                        <span className="mt-2 text-sm font-medium text-gray-700">
                          Tenants
                        </span>
                      </button>
                      <button
                        onClick={() => setCurrentView("access")}
                        className="group h-24 md:h-28 flex flex-col items-center justify-center rounded-xl border border-gray-200 hover:border-[#7C3AED] hover:shadow-md transition-all duration-200"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#7C3AED]/10 transition-colors">
                          <Key className="h-5 w-5 md:h-6 md:w-6 text-gray-600 group-hover:text-[#7C3AED]" />
                        </div>
                        <span className="mt-2 text-sm font-medium text-gray-700">
                          Key Management
                        </span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          setShowUpgradeModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
}

export default PropertyOwnerDashboard;
