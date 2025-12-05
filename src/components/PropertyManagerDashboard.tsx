import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Home, Users, CreditCard, Wrench, Shield, Settings, Menu, LogOut, FileText, Receipt, X, Building } from 'lucide-react';
import { toast } from 'sonner';
import { PropertyManagement } from './PropertyManagement';
import { TenantManagement } from './TenantManagement';
import { PaymentOverview } from './PaymentOverview';
import { MaintenanceTickets } from './MaintenanceTickets';
import { AccessControl } from './AccessControl';
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

// Exact Contrezz logo from Figma Brand Guidelines (matching Owner Dashboard)
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
    { id: 'properties', name: 'Properties', icon: Building },
    { id: 'tenants', name: 'Tenants', icon: Users },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'expenses', name: 'Expenses', icon: Receipt },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'access', name: 'Key Management', icon: Shield },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* Mobile Header - Dark Brand Design */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#111827] border-b border-white/10 z-50 flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] p-1.5 rounded-lg shadow-lg shadow-purple-500/25">
            <ContrezztLogo className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-bold text-white">Contrezz</h2>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar - Dark Brand Design (Matching Owner Dashboard) */}
        <div className={`
          fixed top-0 left-0 h-full w-64 bg-[#111827] shadow-xl z-40 transform transition-transform duration-300 ease-in-out border-r border-white/10
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          pt-16 lg:pt-0
        `}>
          <div className="flex flex-col h-full">
            {/* Logo - Desktop only */}
            <div className="hidden lg:flex items-center gap-3 p-6 border-b border-white/10">
              <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] p-2 rounded-xl shadow-lg shadow-purple-500/25">
                <ContrezztLogo className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Contrezz</h1>
                <p className="text-xs text-white/60 font-medium">Manager Portal</p>
              </div>
            </div>

            {/* Manager Info */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border-2 border-white/20 shadow-lg">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold">
                    {currentUser.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-white/60 capitalize">{currentUser.role}</p>
                </div>
              </div>
              {/* Properties Count Badge */}
              <div className="mt-4 p-3 bg-gradient-to-r from-[#A855F7] to-[#7C3AED] rounded-xl">
                <p className="text-xs text-white/80 font-medium">Managing</p>
                <p className="text-white font-bold">
                  {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                          ${isActive
                            ? 'bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-lg shadow-purple-500/25'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }
                        `}
                        onClick={() => {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                        {item.count && item.count > 0 && (
                          <Badge className={`ml-auto text-xs ${isActive ? 'bg-white/20 text-white border-0' : 'bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white border-0'}`}>
                            {item.count}
                          </Badge>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-white/10">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
                onClick={onLogout}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
            {/* Trial Status Banner */}
            <TrialStatusBanner
              onUpgradeClick={() => setShowUpgradeModal(true)}
              onAddPaymentMethod={() => setActiveTab('settings')}
            />

            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 font-medium">Loading...</p>
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
