import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Bell, Home, Users, CreditCard, Wrench, Shield, Settings, Menu, LogOut, FileText, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { PropertyManagement } from './PropertyManagement';
import { TenantManagement } from './TenantManagement';
import { PaymentOverview } from './PaymentOverview';
import { MaintenanceTickets } from './MaintenanceTickets';
import { AccessControl } from './AccessControl';
import { NotificationCenter } from './NotificationCenter';
import { PropertyManagerSettings } from './PropertyManagerSettings';
import PropertyManagerDocuments from './PropertyManagerDocuments';
import { ManagerDashboardOverview } from './ManagerDashboardOverview';
import { ExpenseManagement } from './ExpenseManagement';
import { Footer } from './Footer';
import { getManagerDashboardOverview, getProperties } from '../lib/api';
import { getAccountInfo } from '../lib/api/auth';
import { getUnits } from '../lib/api/units';
import { getAuthToken } from '../lib/api-client';
import { initializeSocket, subscribeToPermissionsUpdated, unsubscribeFromPermissionsUpdated } from '../lib/socket';
import { usePersistentState } from '../lib/usePersistentState';
import { TrialStatusBanner } from './TrialStatusBanner';
import { UpgradeModal } from './UpgradeModal';

interface PropertyManagerDashboardProps {
  user: any;
  onLogout: () => void;
  propertyAssignments: any[];
  onNavigateToSettings?: () => void;
  onUpdateUser?: (updates: any) => void;
}

export function PropertyManagerDashboard({ user, onLogout, propertyAssignments, onNavigateToSettings, onUpdateUser }: PropertyManagerDashboardProps) {
  const [activeTab, setActiveTab] = usePersistentState('manager-dashboard-tab', 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Reset to overview tab on component mount (every login)
  useEffect(() => {
    setActiveTab('overview');
  }, []);

  // Fetch dashboard data and account info
  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const shouldFetchUnits = currentUser?.permissions?.managerCanViewUnits !== false;
      const [dashResponse, propertiesResponse, unitsResponseOrNull, accountResponse] = await Promise.all([
        getManagerDashboardOverview(),
        getProperties(),
        shouldFetchUnits ? getUnits() : Promise.resolve({ data: [] } as any),
        getAccountInfo()
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

      const unitsResponse = unitsResponseOrNull as any;
      if (shouldFetchUnits) {
        if (unitsResponse.error) {
          console.error('Failed to load units:', unitsResponse.error);
        } else if (unitsResponse.data && Array.isArray(unitsResponse.data)) {
          setUnits(unitsResponse.data);
        }
      } else {
        setUnits([]);
      }

      // Update account info (plan, limits, etc.)
      if (accountResponse.error) {
        console.error('Failed to fetch account info:', accountResponse.error);
      } else if (accountResponse.data) {
        setAccountInfo(accountResponse.data);

        // Update current user with fresh data including baseCurrency
        if (accountResponse.data.user) {
          setCurrentUser((prev: any) => ({
            ...prev,
            ...accountResponse.data.user,
            baseCurrency: accountResponse.data.user.baseCurrency || 'USD'
          }));
        }

        // Show notification if plan/limits were updated (only on silent refresh)
        if (silent && accountInfo && accountResponse.data.customer) {
          const oldCustomer = accountInfo.customer;
          const newCustomer = accountResponse.data.customer;

          if (oldCustomer && newCustomer) {
            if (oldCustomer.plan?.name !== newCustomer.plan?.name) {
              toast.success(`Your organization's plan has been updated to ${newCustomer.plan?.name}!`);
            }
          }
        }
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load dashboard data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Live permissions updates via socket
  useEffect(() => {
    try {
      const token = getAuthToken();
      if (token) {
        initializeSocket(token);
        const handler = (data: { customerId: string; permissions: any }) => {
          if (!currentUser?.customerId) return;
          if (data.customerId !== currentUser.customerId) return;
          toast.info('Your permissions were updated by the owner. Refreshing…');
          // Refresh account info to pull computed permissions from backend
          getAccountInfo().then((acct) => {
            if (acct?.data?.user) {
              setCurrentUser((prev: any) => ({ ...prev, ...acct.data.user }));
            }
            // Silent refresh dashboard data (units fetch will honor permissions)
            fetchDashboardData(true);
          });
        };
        subscribeToPermissionsUpdated(handler);
        return () => {
          unsubscribeFromPermissionsUpdated();
        };
      }
    } catch (e) {
      console.warn('Socket init failed:', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.customerId]);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      fetchDashboardData(true); // Silent refresh
    }, 30000); // 30 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [accountInfo]);

  // Refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData(true); // Silent refresh
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [accountInfo]);

  // Get notification count from dashboard data
  const notificationCount = dashboardData?.notifications?.unread || 0;

  // Get assigned property IDs from dashboard data or fallback
  const assignedPropertyIds = dashboardData?.properties?.properties?.map((p: any) => p.id)
    || currentUser.assignedProperties
    || [];

  // Handle user settings update
  const handleSaveSettings = (updates: any) => {
    setCurrentUser({ ...currentUser, ...updates });
    if (onUpdateUser) {
      onUpdateUser(updates);
    }
    setActiveTab('overview');
  };

  const navigation = [
    { id: 'overview', name: 'Overview', icon: Home },
    { id: 'properties', name: 'Properties', icon: Home },
    { id: 'tenants', name: 'Tenants', icon: Users },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'expenses', name: 'Expenses', icon: Receipt },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'access', name: 'Key Management', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell, count: notificationCount },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'logout', name: 'Logout', icon: LogOut },
  ];

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
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Contrezz Manager</h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative">
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('notifications')}>
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      {notificationCount}
                    </Badge>
                  )}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm font-medium">
                    {currentUser.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
                  <div className="text-xs text-gray-500">{currentUser.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg lg:shadow-none border-r transition-transform duration-200 ease-in-out`}>
          <nav className="mt-5 px-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isLogout = item.id === 'logout';
                return (
                  <li key={item.id}>
                    <Button
                      variant={activeTab === item.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm md:text-base"
                      onClick={() => {
                        if (isLogout) {
                          onLogout();
                        } else {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <Icon className="mr-3 h-4 w-4 md:h-5 md:w-5" />
                      {item.name}
                      {item.count && (
                        <Badge className="ml-auto text-xs" variant="destructive">
                          {item.count}
                        </Badge>
                      )}
                    </Button>
                  </li>
                );
              })}
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
        <main className="flex-1 lg:ml-0 p-4 lg:p-8 w-full overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {/* Trial Status Banner */}
            <TrialStatusBanner
              onUpgradeClick={() => setShowUpgradeModal(true)}
              onAddPaymentMethod={() => setActiveTab('settings')}
            />

            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <ManagerDashboardOverview
                    dashboardData={dashboardData}
                    properties={properties}
                    user={currentUser}
                  />
                )}
                {activeTab === 'properties' && (
                  <PropertyManagement
                    assignedPropertyIds={assignedPropertyIds}
                    isManagerView={true}
                    properties={properties}
                    user={currentUser}
                  />
                )}
                {activeTab === 'tenants' && <TenantManagement properties={properties} />}
                {activeTab === 'payments' && <PaymentOverview />}
                {activeTab === 'expenses' && (
                  <ExpenseManagement
                    user={currentUser}
                    properties={properties}
                    units={units}
                    onBack={() => setActiveTab('overview')}
                  />
                )}
                {activeTab === 'maintenance' && <MaintenanceTickets properties={properties} />}
                {activeTab === 'access' && <AccessControl />}
                {activeTab === 'notifications' && <NotificationCenter />}
                {activeTab === 'documents' && <PropertyManagerDocuments />}
                {activeTab === 'settings' && (
                  <PropertyManagerSettings
                    user={currentUser}
                    onBack={() => setActiveTab('overview')}
                    onSave={handleSaveSettings}
                    onLogout={onLogout}
                  />
                )}
              </>
            )}
          </div>
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
