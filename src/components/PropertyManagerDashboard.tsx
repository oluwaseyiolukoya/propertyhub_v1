import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Bell, Home, Users, CreditCard, Wrench, Shield, Settings, Menu, LogOut, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PropertyManagement } from './PropertyManagement';
import { TenantManagement } from './TenantManagement';
import { PaymentManagement } from './PaymentManagement';
import { MaintenanceTickets } from './MaintenanceTickets';
import { AccessControl } from './AccessControl';
import { NotificationCenter } from './NotificationCenter';
import { PropertyManagerSettings } from './PropertyManagerSettings';
import PropertyManagerDocuments from './PropertyManagerDocuments';
import { ManagerDashboardOverview } from './ManagerDashboardOverview';
import { getManagerDashboardOverview, getProperties } from '../lib/api';

interface PropertyManagerDashboardProps {
  user: any;
  onLogout: () => void;
  propertyAssignments: any[];
  onNavigateToSettings?: () => void;
  onUpdateUser?: (updates: any) => void;
}

export function PropertyManagerDashboard({ user, onLogout, propertyAssignments, onNavigateToSettings, onUpdateUser }: PropertyManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashResponse, propertiesResponse] = await Promise.all([
          getManagerDashboardOverview(),
          getProperties()
        ]);

        if (dashResponse.error) {
          toast.error(dashResponse.error.error || 'Failed to load dashboard');
        } else if (dashResponse.data) {
          setDashboardData(dashResponse.data);
        }

        if (propertiesResponse.error) {
          toast.error(propertiesResponse.error.error || 'Failed to load properties');
        } else if (propertiesResponse.data) {
          setProperties(propertiesResponse.data);
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'access', name: 'Access Control', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell, count: notificationCount },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'logout', name: 'Logout', icon: LogOut },
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
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
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">PropertyHub Manager</h1>
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
                  />
                )}
                {activeTab === 'tenants' && <TenantManagement properties={properties} />}
                {activeTab === 'payments' && <PaymentManagement properties={properties} />}
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
    </div>
  );
}
