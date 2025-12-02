import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Building, Users, DollarSign, TrendingUp, Plus, Eye, Settings, LogOut, Menu, CheckCircle, Shield, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PropertiesPage } from './PropertiesPage';
import { TenantManagement } from './TenantManagement';
import { FinancialReports } from './FinancialReports';
import { ExpenseManagement } from './ExpenseManagement';
import { PropertyManagerManagement } from './PropertyManagerManagement';
import { MaintenanceTickets } from './MaintenanceTickets';
import { AccessControl } from './AccessControl';
import { PropertyOwnerSettings } from './PropertyOwnerSettings';
import { AddPropertyPage } from './AddPropertyPage';
import { Footer } from './Footer';
import PropertyOwnerDocuments from './PropertyOwnerDocuments';
import { PaymentOverview } from './PaymentOverview';
import { TenantVerificationManagement } from './owner/TenantVerificationManagement';
import { getOwnerDashboardOverview, getProperties, getOwnerActivities } from '../lib/api';
import { getProperty, updateProperty } from '../lib/api/properties';
import { createProperty } from '../lib/api/properties';
import { getUnits } from '../lib/api/units';
import { useCurrency } from '../lib/CurrencyContext';
import { getAccountInfo } from '../lib/api/auth';
import { usePersistentState } from '../lib/usePersistentState';
import { formatCurrency as formatCurrencyUtil, getSmartBaseCurrency } from '../lib/currency';
import { TrialStatusBanner } from './TrialStatusBanner';
import { UpgradeModal } from './UpgradeModal';
import { getSubscriptionStatus } from '../lib/api/subscription';
import { verifyUpgrade } from '../lib/api/subscriptions';
import { apiClient } from '../lib/api-client';
import { PlatformLogo } from './PlatformLogo';
import { TRIAL_PLAN_LIMITS } from '../lib/constants/subscriptions';

interface PropertyOwnerDashboardProps {
  user: any;
  onLogout: () => void;
  managers: any[];
  propertyAssignments: any[];
  onAddManager: (managerData: any, ownerId: string) => Promise<any>;
  onAssignManager: (managerId: string, propertyId: string, permissions?: any) => Promise<void>;
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
    hasMore: false
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
        console.error('Failed to load activities:', response.error);
      } else if (response.data) {
        setActivities(response.data.activities || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 5,
          total: 0,
          totalPages: 0,
          hasMore: false
        });
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
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
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your properties</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingActivities ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="ml-3 text-sm text-gray-500">Loading activities...</p>
          </div>
        ) : activities.length > 0 ? (
          <>
            <div className="space-y-4">
              {activities.map((log: any) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm">{log.description || `${log.action} ${log.entity}`}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {log.entity}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
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
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!pagination.hasMore || loadingActivities}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No recent activities</p>
            <p className="text-xs text-gray-400 mt-1">Activities will appear here as actions are performed</p>
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
  onRefreshManagers
}: PropertyOwnerDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { formatCurrency } = useCurrency();
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentView, setCurrentView] = usePersistentState('owner-dashboard-view', 'dashboard');
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<string | undefined>(undefined);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);

  // Reset to dashboard view on component mount (every login)
  useEffect(() => {
    setCurrentView('dashboard');
  }, []);

  // Clear the settings tab hint once the user leaves the settings view
  useEffect(() => {
    if (currentView !== 'settings' && settingsInitialTab) {
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

  // Fetch dashboard data, properties, and account info
  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const [dashResponse, propertiesResponse, unitsResponse, accountResponse, subStatus] = await Promise.all([
        getOwnerDashboardOverview(),
        getProperties(),
        getUnits(),
        getAccountInfo(),
        getSubscriptionStatus().catch(() => null)
      ]);

      if (dashResponse.error) {
        if (!silent) toast.error(dashResponse.error.error || 'Failed to load dashboard');
      } else if (dashResponse.data) {
        setDashboardData(dashResponse.data);
      }

      if (propertiesResponse.error) {
        if (!silent) toast.error(propertiesResponse.error.error || 'Failed to load properties');
      } else if (propertiesResponse.data) {
        setProperties(propertiesResponse.data);
      }

      if (unitsResponse.error) {
        console.error('Failed to load units:', unitsResponse.error);
      } else if (unitsResponse.data && Array.isArray(unitsResponse.data)) {
        setUnits(unitsResponse.data);
      }

      // Update account info (plan, limits, etc.)
      if (accountResponse.error) {
        console.error('Failed to fetch account info:', accountResponse.error);
      } else if (accountResponse.data) {
        setAccountInfo(accountResponse.data);

        // Show notification if plan/limits were updated (only on silent refresh)
        if (silent && accountInfo && accountResponse.data.customer) {
          const oldCustomer = accountInfo.customer;
          const newCustomer = accountResponse.data.customer;

          if (oldCustomer && newCustomer) {
            if (oldCustomer.plan?.name !== newCustomer.plan?.name) {
              toast.success(`Your plan has been updated to ${newCustomer.plan?.name}!`);
            }
            if (oldCustomer.propertyLimit !== newCustomer.propertyLimit) {
              toast.info(`Property limit updated to ${newCustomer.propertyLimit}`);
            }
            if (oldCustomer.userLimit !== newCustomer.userLimit) {
              toast.info(`User limit updated to ${newCustomer.userLimit}`);
            }
          }
        }
      }

      // Subscription status
      if (subStatus) {
        setSubscription(subStatus);
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Handle Paystack payment callbacks for property owners:
  // FRONTEND_URL/?payment_callback=upgrade&tab=billing&reference=...
  // FRONTEND_URL/?payment_callback=payment_method&tab=billing&reference=...
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const paymentCallback = params.get('payment_callback');
      const reference =
        params.get('reference') || params.get('trxref') || sessionStorage.getItem('upgrade_reference');

      // Handle payment_method callback - navigate to settings billing tab
      if (paymentCallback === 'payment_method') {
        console.log('[PropertyOwnerDashboard] Detected payment_method callback, navigating to settings...');
        setSettingsInitialTab('billing');
        setCurrentView('settings');
        return;
      }

      if (paymentCallback !== 'upgrade' || !reference) {
        return;
      }

      const handleUpgradeCallback = async () => {
        try {
          console.log(
            '[PropertyOwnerDashboard] Handling subscription upgrade callback with reference:',
            reference
          );
          toast.info('Verifying subscription upgrade...');

          const resp = await verifyUpgrade(reference);
          console.log(
            '[PropertyOwnerDashboard] Upgrade verification response:',
            resp.data
          );

          if (!resp.data?.success) {
            throw new Error(
              resp.data?.message || 'Upgrade verification failed'
            );
          }

          // Clear stored reference and clean up URL
          sessionStorage.removeItem('upgrade_reference');
          sessionStorage.removeItem('upgrade_plan_id');
          params.delete('reference');
          params.delete('payment_callback');
          url.search = params.toString();
          window.history.replaceState({}, document.title, url.toString());

          toast.success(
            'Plan upgraded successfully! Refreshing your dashboard...'
          );

          // Refresh dashboard and subscription status silently
          await fetchData(true);
        } catch (error: any) {
          console.error(
            '[PropertyOwnerDashboard] Subscription upgrade verification error:',
            error
          );
          const message =
            error?.response?.data?.error ||
            error?.message ||
            'Failed to verify subscription upgrade';
          toast.error(message);
        }
      };

      // Fire and forget (we don't await in the effect body)
      void handleUpgradeCallback();
    } catch (e) {
      // If URL parsing fails for any reason, just ignore and continue
      console.error(
        '[PropertyOwnerDashboard] Error while initializing upgrade callback handler:',
        e
      );
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Load recent billing history (subscriptions only)
  useEffect(() => {
    (async () => {
      try {
        setLoadingBills(true);
        console.log('[PropertyOwnerDashboard] Fetching subscription payments...');
        const res = await apiClient.get<any>('/api/payments', { page: 1, pageSize: 5, type: 'subscription' });
        console.log('[PropertyOwnerDashboard] Payments API response:', res);
        if (!(res as any).error) {
          const items = (res as any).data?.items || [];
          console.log('[PropertyOwnerDashboard] Subscription payments received:', items);
          setRecentBills(items);
        } else {
          console.error('[PropertyOwnerDashboard] Error fetching payments:', (res as any).error);
        }
      } catch (e) {
        console.error('[PropertyOwnerDashboard] Exception fetching payments:', e);
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

  // Reload managers when switching to property-managers view
  useEffect(() => {
    if (currentView === 'property-managers' && onRefreshManagers) {
      console.log('🔄 Reloading managers on view change...');
      onRefreshManagers();
    }
  }, [currentView]);

  // Refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchData(true); // Silent refresh
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
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
      images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400"],
      financials: {
        grossRent: 20400,
        expenses: 5200,
        netIncome: 15200,
        capRate: 6.8,
        cashFlow: 12800,
        currency: 'USD'
      },
      insurance: {
        provider: "Property Insurance Co.",
        policyNumber: "PI-123456",
        premium: 850,
        expiration: "2024-12-31"
      },
      currency: 'NGN'
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
      images: ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"],
      financials: {
        grossRent: 27000,
        expenses: 6800,
        netIncome: 20200,
        capRate: 7.2,
        cashFlow: 17500,
        currency: 'USD'
      },
      insurance: {
        provider: "Metro Insurance",
        policyNumber: "MI-789012",
        premium: 1200,
        expiration: "2024-11-30"
      },
      currency: 'NGN'
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
      images: ["https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400"],
      financials: {
        grossRent: 34560,
        expenses: 8900,
        netIncome: 25660,
        capRate: 7.8,
        cashFlow: 22100,
        currency: 'USD'
      },
      insurance: {
        provider: "Tower Insurance Ltd.",
        policyNumber: "TI-345678",
        premium: 1500,
        expiration: "2025-01-15"
      },
      currency: 'NGN'
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
      images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400"],
      financials: {
        grossRent: 13950,
        expenses: 4200,
        netIncome: 9750,
        capRate: 5.9,
        cashFlow: 8100,
        currency: 'USD'
      },
      insurance: {
        provider: "Home Shield Insurance",
        policyNumber: "HS-901234",
        premium: 650,
        expiration: "2024-10-15"
      },
      currency: 'NGN'
    }
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
  const portfolioStats = dashboardData?.portfolio
    ? {
        totalProperties: dashboardData.portfolio.totalProperties || 0,
        totalUnits: dashboardData.portfolio.totalUnits || 0,
        occupancyRate: Math.round((dashboardData.portfolio.occupancyRate || 0) * 10) / 10,
        monthlyRevenue: (dashboardData.revenue?.currentMonth || 0),
      }
    : {
        totalProperties: properties.length,
        totalUnits: properties.reduce((sum, p) => sum + p.units, 0),
        occupancyRate: properties.length > 0
          ? Math.round(properties.reduce((sum, p) => sum + ((p.occupied || 0) / (p.units || 1) * 100), 0) / properties.length)
          : 0,
        monthlyRevenue: properties.reduce((sum, p) => sum + (p.monthlyRevenue || 0), 0),
      };

  const recentActivity = [
    {
      id: 1,
      description: "Rent payment received from Sunset Apartments Unit 4B",
      amount: "₦1,250",
      time: "2 hours ago"
    },
    {
      id: 2,
      description: "New maintenance request at Riverside Complex",
      time: "4 hours ago"
    },
    {
      id: 3,
      description: "ACH payment processed for Park View Towers Unit C401",
      amount: "₦1,800",
      time: "1 day ago"
    },
  ];

  const navigation = [
    { name: 'Portfolio Overview', key: 'dashboard' },
    { name: 'Properties', key: 'properties' },
    { name: 'Tenant Management', key: 'tenants' },
    { name: 'Tenant Verification', key: 'tenant-verification' },
    { name: 'Payments', key: 'payments' },
    { name: 'Financial Reports', key: 'financial' },
    { name: 'Expenses', key: 'expenses' },
    { name: 'Maintenance', key: 'maintenance' },
    { name: 'Property Managers', key: 'managers' },
    { name: 'Key Management', key: 'access' },
    { name: 'Documents', key: 'documents' },
    { name: 'Settings', key: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
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
                showText={false}
                iconClassName={hasCustomLogo ? "h-8 w-auto max-w-[200px] object-contain" : "h-6 w-6 text-blue-600 mr-2"}
                onLogoLoad={(hasLogo) => setHasCustomLogo(hasLogo)}
              />
              {!hasCustomLogo && (
                <span className="text-xl font-semibold text-gray-900">Contrezz Owner</span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {user.company}
              </Badge>

              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
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
                Your account has been successfully set up. Get started by adding your first property or exploring the dashboard features.
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

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg lg:shadow-none border-r mt-16 lg:mt-0`}>
          <nav className="mt-5 px-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Button
                    variant={currentView === item.key ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setCurrentView(item.key);
                      setSidebarOpen(false);
                    }}
                  >
                    {item.name}
                  </Button>
                </li>
              ))}

              {/* Logout Button below Settings */}
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <main className="flex-1 lg:ml-0 w-full min-w-0">
          {currentView === 'properties' ? (
            <PropertiesPage
              user={user}
              onBack={() => setCurrentView('dashboard')}
              onNavigateToAddProperty={() => setCurrentView('add-property')}
              properties={properties}
              onViewProperty={async (propertyId: string) => {
                try {
                  const res = await getProperty(propertyId);
                  if (res.error) throw new Error(res.error.error || 'Failed to fetch property');
                  setSelectedProperty(res.data);
                  setCurrentView('property-details');
                } catch (e: any) {
                  toast.error(e?.message || 'Failed to fetch property');
                }
              }}
              onEditProperty={async (propertyId: string) => {
                try {
                  const res = await getProperty(propertyId);
                  if (res.error) throw new Error(res.error.error || 'Failed to fetch property');
                  setSelectedProperty(res.data);
                  setCurrentView('property-edit');
                } catch (e: any) {
                  toast.error(e?.message || 'Failed to fetch property');
                }
              }}
              onNavigateToTenants={() => setCurrentView('tenants')}
              onNavigateToMaintenance={() => setCurrentView('maintenance')}
              onPropertyDeleted={(propertyId) => {
                // Remove the deleted property from local state
                setProperties(prev => prev.filter(p => p.id !== propertyId));
              }}
              onRefreshProperties={() => fetchData(true)}
            />
          ) : currentView === 'property-details' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-5xl mx-auto">
                <div className="mb-4">
                  <Button variant="outline" onClick={() => setCurrentView('properties')}>← Back to Properties</Button>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedProperty?.name || 'Property Details'}</CardTitle>
                    <CardDescription>{selectedProperty?.address}, {selectedProperty?.city}, {selectedProperty?.state}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedProperty ? (
                      <div className="space-y-6 text-sm">
                        {(selectedProperty.coverImage || (Array.isArray(selectedProperty.images) && selectedProperty.images[0])) && (
                          <img
                            src={selectedProperty.coverImage || selectedProperty.images[0]}
                            alt={selectedProperty.name}
                            className="w-full h-64 object-cover rounded-md"
                          />
                        )}
                        {/* Basic Info */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-600">Type</p>
                            <p className="font-medium">{selectedProperty.propertyType || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Status</p>
                            <p className="font-medium">{selectedProperty.status || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Created</p>
                            <p className="font-medium">{selectedProperty.createdAt ? new Date(selectedProperty.createdAt).toLocaleString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Updated</p>
                            <p className="font-medium">{selectedProperty.updatedAt ? new Date(selectedProperty.updatedAt).toLocaleString() : 'N/A'}</p>
                          </div>
                        </div>

                        {/* Management */}
                        <div>
                          <p className="text-gray-600 mb-1">Management</p>
                          {Array.isArray(selectedProperty.property_managers) && selectedProperty.property_managers.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                              {selectedProperty.property_managers.map((pm: any) => (
                                <div key={pm.id} className="p-3 border rounded-md">
                                  <p className="font-medium">{pm.users?.name || 'Manager'}</p>
                                  <p className="text-gray-600">{pm.users?.email || '—'}</p>
                                  {pm.users?.phone && (
                                    <p className="text-gray-600">{pm.users.phone}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-600">Unassigned</p>
                          )}
                        </div>

                        {/* Location */}
                        <div>
                          <p className="text-gray-600 mb-1">Location</p>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-600">Address</p>
                              <p className="font-medium">{selectedProperty.address || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">City</p>
                              <p className="font-medium">{selectedProperty.city || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">State</p>
                              <p className="font-medium">{selectedProperty.state || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Postal Code</p>
                              <p className="font-medium">{selectedProperty.postalCode || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Country</p>
                              <p className="font-medium">{selectedProperty.country || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Property Details */}
                        <div>
                          <p className="text-gray-600 mb-1">Property Details</p>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-gray-600">Year Built</p>
                              <p className="font-medium">{selectedProperty.yearBuilt ?? 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Total Units</p>
                              <p className="font-medium">{selectedProperty.totalUnits ?? 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Floors</p>
                              <p className="font-medium">{selectedProperty.floors ?? 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Total Area</p>
                              <p className="font-medium">{selectedProperty.totalArea ?? 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Lot Size</p>
                              <p className="font-medium">{selectedProperty.lotSize ?? 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Parking</p>
                              <p className="font-medium">{selectedProperty.parking ?? 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Financial */}
                        <div>
                          <p className="text-gray-600 mb-1">Financial</p>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-gray-600">Currency</p>
                              <p className="font-medium">{selectedProperty.currency}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Avg Rent</p>
                              <p className="font-medium">{(Number(selectedProperty.avgRent) || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Security Deposit</p>
                              <p className="font-medium">{(Number(selectedProperty.securityDeposit) || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Application Fee</p>
                              <p className="font-medium">{(Number(selectedProperty.applicationFee) || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Caution Fee</p>
                              <p className="font-medium">{(Number(selectedProperty.cautionFee) || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Legal Fee</p>
                              <p className="font-medium">{(Number(selectedProperty.legalFee) || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Agent Commission</p>
                              <p className="font-medium">{(Number(selectedProperty.agentCommission) || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Service Charge</p>
                              <p className="font-medium">{(Number(selectedProperty.serviceCharge) || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Agreement Fee</p>
                              <p className="font-medium">{(Number(selectedProperty.agreementFee) || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Property Taxes</p>
                              <p className="font-medium">{(Number(selectedProperty.propertyTaxes) || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Insurance */}
                        <div>
                          <p className="text-gray-600 mb-1">Insurance</p>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-gray-600">Provider</p>
                              <p className="font-medium">{selectedProperty.insuranceProvider || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Policy Number</p>
                              <p className="font-medium">{selectedProperty.insurancePolicyNumber || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Premium</p>
                              <p className="font-medium">{(Number(selectedProperty.insurancePremium) || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Expiration</p>
                              <p className="font-medium">{selectedProperty.insuranceExpiration ? new Date(selectedProperty.insuranceExpiration).toLocaleDateString() : 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-600 mb-1">Features</p>
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(selectedProperty.features) ? selectedProperty.features : [] ).map((f: any, idx: number) => (
                                <Badge key={idx} variant="outline">{String(f)}</Badge>
                              ))}
                              {!selectedProperty.features && <span className="text-gray-500">None</span>}
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">Unit Features</p>
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(selectedProperty.unitFeatures) ? selectedProperty.unitFeatures : [] ).map((f: any, idx: number) => (
                                <Badge key={idx} variant="outline">{String(f)}</Badge>
                              ))}
                              {!selectedProperty.unitFeatures && <span className="text-gray-500">None</span>}
                            </div>
                          </div>
                        </div>

                        {/* Images section removed; hero image shown at top */}

                        {/* Description & Notes */}
                        {selectedProperty.description && (
                          <div>
                            <p className="text-gray-600 mb-1">Description</p>
                            <p>{selectedProperty.description}</p>
                          </div>
                        )}
                        {selectedProperty.notes && (
                          <div>
                            <p className="text-gray-600 mb-1">Notes</p>
                            <p>{selectedProperty.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">Loading...</div>
                    )}
                  </CardContent>
                </Card>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setCurrentView('property-edit')}>Edit Property</Button>
                </div>
              </div>
            </div>
          ) : currentView === 'property-edit' ? (
            <AddPropertyPage
              user={user}
              onBack={() => setCurrentView('property-details')}
              initialValues={selectedProperty}
              mode="edit"
              managers={managers}
              onManagerCreated={onRefreshManagers}
              propertyLimit={derivedPropertyLimit}
              currentPropertyCount={accountInfo?.customer?.actualPropertiesCount ?? properties.length}
              unitLimit={derivedUnitLimit}
              currentUnitCount={accountInfo?.customer?.actualUnitsCount ?? units.length}
              onSave={async (data: any) => {
                try {
                  if (!selectedProperty?.id) throw new Error('Missing property id');
                  const payload: any = {
                    ...data,
                    totalUnits: data.totalUnits ? Number(data.totalUnits) : undefined,
                    floors: data.floors ? Number(data.floors) : undefined,
                    yearBuilt: data.yearBuilt ? Number(data.yearBuilt) : undefined,
                    totalArea: data.totalArea ? Number(data.totalArea) : undefined,
                    lotSize: data.lotSize ? Number(data.lotSize) : undefined,
                    parking: data.parking ? Number(data.parking) : undefined,
                    avgRent: data.avgRent ? Number(data.avgRent) : undefined,
                    securityDeposit: data.securityDeposit ? Number(data.securityDeposit) : undefined,
                    applicationFee: data.applicationFee ? Number(data.applicationFee) : undefined,
                    cautionFee: data.cautionFee ? Number(data.cautionFee) : undefined,
                    legalFee: data.legalFee ? Number(data.legalFee) : undefined,
                    agentCommission: data.agentCommission ? Number(data.agentCommission) : undefined,
                    serviceCharge: data.serviceCharge ? Number(data.serviceCharge) : undefined,
                    agreementFee: data.agreementFee ? Number(data.agreementFee) : undefined,
                    insurancePremium: data.insurance?.premium || data.insurancePremium,
                    insuranceExpiration: data.insurance?.expiration || data.insuranceExpiration,
                    insuranceProvider: data.insurance?.provider || data.insuranceProvider,
                    insurancePolicyNumber: data.insurance?.policyNumber || data.insurancePolicyNumber,
                    propertyTaxes: data.propertyTaxes ? Number(data.propertyTaxes) : undefined,
                    images: Array.isArray(data.images) ? data.images : [],
                    insurance: undefined,
                    managerId: data.managerId || '', // Include managerId for manager assignment changes
                  };

                  console.log('🔄 Updating property with payload:', {
                    propertyId: selectedProperty.id,
                    managerId: payload.managerId,
                    hasManagerChange: payload.managerId !== selectedProperty.managerId
                  });

                  const res = await updateProperty(selectedProperty.id, payload);
                  if (res.error) throw new Error(res.error.error || 'Failed to update property');

                  toast.success('Property updated successfully');

                  // Refresh managers list to reflect new assignments
                  if (onRefreshManagers) {
                    console.log('🔄 Refreshing managers list...');
                    await onRefreshManagers();
                  }

                  // Refresh all data to show updated property
                  await fetchData(true);
                  const refreshed = await getProperty(selectedProperty.id);
                  setSelectedProperty(refreshed.data);
                  setCurrentView('property-details');
                } catch (e: any) {
                  toast.error(e?.message || 'Failed to update property');
                }
              }}
            />
          ) : currentView === 'tenants' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <TenantManagement properties={properties} />
              </div>
            </div>
          ) : currentView === 'tenant-verification' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <TenantVerificationManagement />
              </div>
            </div>
          ) : currentView === 'payments' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <PaymentOverview />
              </div>
            </div>
          ) : currentView === 'financial' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <FinancialReports
                  properties={properties}
                  user={user}
                />
              </div>
            </div>
          ) : currentView === 'expenses' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <ExpenseManagement
                  user={user}
                  properties={properties}
                  units={units}
                  onBack={() => setCurrentView('dashboard')}
                />
              </div>
            </div>
          ) : currentView === 'maintenance' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <MaintenanceTickets properties={properties} />
              </div>
            </div>
          ) : currentView === 'managers' ? (
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
          ) : currentView === 'access' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <AccessControl />
              </div>
            </div>
          ) : currentView === 'documents' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <PropertyOwnerDocuments />
              </div>
            </div>
          ) : currentView === 'add-property' ? (
            <AddPropertyPage
              user={user}
              onBack={() => setCurrentView('dashboard')}
              managers={managers}
              onManagerCreated={onRefreshManagers}
              propertyLimit={derivedPropertyLimit}
              currentPropertyCount={accountInfo?.customer?.actualPropertiesCount ?? properties.length}
              unitLimit={derivedUnitLimit}
              currentUnitCount={accountInfo?.customer?.actualUnitsCount ?? units.length}
              onSave={(propertyData) => {
                // Persist to backend, then refresh list
                (async () => {
                  try {
                    const payload = {
                      ...propertyData,
                      // Coerce numeric fields to numbers for API
                      totalUnits: Number(propertyData.totalUnits) || 0,
                      floors: propertyData.floors ? Number(propertyData.floors) : undefined,
                      yearBuilt: propertyData.yearBuilt ? Number(propertyData.yearBuilt) : undefined,
                      totalArea: propertyData.totalArea ? Number(propertyData.totalArea) : undefined,
                      lotSize: propertyData.lotSize ? Number(propertyData.lotSize) : undefined,
                      parking: propertyData.parking ? Number(propertyData.parking) : undefined,
                      avgRent: propertyData.avgRent ? Number(propertyData.avgRent) : undefined,
                      securityDeposit: propertyData.securityDeposit ? Number(propertyData.securityDeposit) : undefined,
                      applicationFee: propertyData.applicationFee ? Number(propertyData.applicationFee) : undefined,
                      cautionFee: propertyData.cautionFee ? Number(propertyData.cautionFee) : undefined,
                      legalFee: propertyData.legalFee ? Number(propertyData.legalFee) : undefined,
                      agentCommission: propertyData.agentCommission ? Number(propertyData.agentCommission) : undefined,
                      serviceCharge: propertyData.serviceCharge ? Number(propertyData.serviceCharge) : undefined,
                      agreementFee: propertyData.agreementFee ? Number(propertyData.agreementFee) : undefined,
                      insurancePremium: propertyData.insurance?.premium || propertyData.insurancePremium,
                      insuranceExpiration: propertyData.insurance?.expiration || propertyData.insuranceExpiration,
                      insuranceProvider: propertyData.insurance?.provider || propertyData.insuranceProvider,
                      insurancePolicyNumber: propertyData.insurance?.policyNumber || propertyData.insurancePolicyNumber,
                      propertyTaxes: propertyData.propertyTaxes ? Number(propertyData.propertyTaxes) : undefined,
                      images: Array.isArray(propertyData.images) ? propertyData.images : [],
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
                      financials: undefined
                    } as any;

                    const res = await createProperty(payload);
                    if (res.error) throw new Error(res.error.error || 'Failed to create property');
                    toast.success('Property created');
                    // Auto-assign selected manager if provided
                    if ((propertyData as any).managerId) {
                      try {
                        await onAssignManager?.((propertyData as any).managerId, res.data.id);
                      } catch (e) {
                        // non-blocking
                      }
                    }
                    await fetchData(true);
                setCurrentView('properties');
                  } catch (e: any) {
                    toast.error(e?.message || 'Failed to create property');
                  }
                })();
              }}
            />
          ) : currentView === 'settings' ? (
            <PropertyOwnerSettings
              user={user}
              onBack={() => setCurrentView('dashboard')}
              initialTab={settingsInitialTab}
              onSave={(updates) => {
                // Handle profile updates here
                console.log('Profile updates:', updates);
              }}
              onLogout={onLogout}
            />
          ) : (
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Welcome Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}!</h2>
                <p className="text-gray-600">Here's an overview of your property portfolio</p>
              </div>

              {/* Trial Status Banner */}
              <TrialStatusBanner
                onUpgradeClick={() => setShowUpgradeModal(true)}
                onAddPaymentMethod={() => {
                  setSettingsInitialTab('billing');
                  setCurrentView('settings');
                }}
              />

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{portfolioStats.totalProperties}</div>
                    <p className="text-xs text-muted-foreground">
                      {portfolioStats.totalUnits} total units
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{portfolioStats.occupancyRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      +2.1% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrencyUtil(portfolioStats.monthlyRevenue || 0, smartBaseCurrency)}</div>
                    <p className="text-xs text-muted-foreground">
                      +12.5% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{typeof dashboardData?.collection?.rate === 'number' ? `${dashboardData.collection.rate}%` : '0%'}</div>
                    <p className="text-xs text-muted-foreground">
                      Collected {formatCurrency(dashboardData?.collection?.collected || 0)} of {formatCurrency(dashboardData?.collection?.expected || 0)} this month
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Active License & Billing */}
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Subscription</CardTitle>
                      <CardDescription>Your current license and renewal</CardDescription>
                    </div>
                    <Badge variant="outline" className={subscription?.status === 'active' ? 'text-green-700 border-green-300 bg-green-50' : 'text-blue-700 border-blue-300 bg-blue-50'}>
                      {subscription?.status || '—'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Current Plan</p>
                        <p className="font-medium">{subscription?.plan?.name || accountInfo?.customer?.plan?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Billing Cycle</p>
                        <p className="font-medium capitalize">{subscription?.billingCycle || accountInfo?.customer?.billingCycle || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Next Billing Date</p>
                        <p className="font-medium">{subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">MRR</p>
                        <p className="font-medium">{formatCurrencyUtil(subscription?.mrr || accountInfo?.customer?.mrr || 0, subscription?.plan?.currency || 'NGN')}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button variant="outline" onClick={() => setShowUpgradeModal(true)}>Upgrade Plan</Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSettingsInitialTab('billing');
                          setCurrentView('settings');
                        }}
                      >
                        View Billing History
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Billing</CardTitle>
                      <CardDescription>Your last subscription payments</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingBills ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : recentBills.length === 0 ? (
                      <p className="text-sm text-gray-500">No subscription payments yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {recentBills.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="text-sm">
                              <div className="font-medium">{(p.type || 'subscription').toString().toUpperCase()}</div>
                              <div className="text-gray-500">{new Date(p.paidAt || p.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{(p.currency || 'NGN')} {(Number(p.amount) || 0).toFixed(2)}</div>
                              <Badge variant="outline" className="mt-1 capitalize">{p.status || 'success'}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Properties List */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Property Portfolio</CardTitle>
                      <CardDescription>Your managed properties</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setCurrentView('add-property')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {properties.map((property: any) => (
                        <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{property.name}</h4>
                              <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                                {property.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{property.address}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{(property.occupiedUnits ?? 0)}/{(property._count?.units ?? 0)} units occupied</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Manager: {property.property_managers?.[0]?.users?.name ?? 'Unassigned'}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={async () => {
                              try {
                                const res = await getProperty(property.id);
                                if (res.error) throw new Error(res.error.error || 'Failed to fetch property');
                                setSelectedProperty(res.data);
                                setCurrentView('property-details');
                              } catch (e: any) {
                                toast.error(e?.message || 'Failed to open property');
                              }
                            }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={async () => {
                              try {
                                const res = await getProperty(property.id);
                                if (res.error) throw new Error(res.error.error || 'Failed to fetch property');
                                setSelectedProperty(res.data);
                                setCurrentView('property-edit');
                              } catch (e: any) {
                                toast.error(e?.message || 'Failed to open editor');
                              }
                            }}>
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

              {/* Quick Actions */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks for property owners</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                    <Button variant="outline" className="h-20 md:h-24 flex-col text-xs sm:text-sm" onClick={() => setCurrentView('add-property')}>
                      <Plus className="h-5 w-5 md:h-6 md:w-6 mb-2" />
                      <span>Add Property</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col text-xs sm:text-sm" onClick={() => setCurrentView('managers')}>
                      <Users className="h-5 w-5 md:h-6 md:w-6 mb-2" />
                      <span>Hire Manager</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col text-xs sm:text-sm" onClick={() => setCurrentView('financial')}>
                      <DollarSign className="h-5 w-5 md:h-6 md:w-6 mb-2" />
                      <span>View Reports</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col text-xs sm:text-sm" onClick={() => setCurrentView('tenants')}>
                      <Users className="h-5 w-5 md:h-6 md:w-6 mb-2" />
                      <span>Tenants</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col text-xs sm:text-sm" onClick={() => setCurrentView('access')}>
                      <Shield className="h-5 w-5 md:h-6 md:w-6 mb-2" />
                      <span>Key Management</span>
                    </Button>
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

