import React, { useState, useEffect } from 'react';
import {
  Home,
  CreditCard,
  Wrench,
  FileText,
  Settings,
  LogOut,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import TenantOverview from './TenantOverview';
import TenantPaymentsPage from './TenantPaymentsPage';
import TenantMaintenanceRequests from './TenantMaintenanceRequests';
import TenantDocuments from './TenantDocuments';
import TenantSettings from './TenantSettings';
import { Footer } from './Footer';
import { getTenantDashboardOverview, getUserData, removeAuthToken } from '../lib/api';
import { usePersistentState } from '../lib/usePersistentState';

const TenantDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = usePersistentState('tenant-dashboard-section', 'dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userData = getUserData();

  // Reset to dashboard section on component mount (every login)
  useEffect(() => {
    setActiveSection('dashboard');
  }, []);

  // Fetch tenant dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await getTenantDashboardOverview();
        if (response.error) {
          toast.error(response.error.error || 'Failed to load dashboard');
        } else if (response.data) {
          setDashboardData(response.data);
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const tenantInfo = {
    name: userData?.name || "Tenant",
    email: userData?.email || "",
    unit: dashboardData?.unit?.unitNumber || "N/A",
    property: dashboardData?.property?.name || "N/A",
    notifications: dashboardData?.notifications?.unread || 0
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      removeAuthToken();
      window.location.href = '/';
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <TenantOverview onNavigate={setActiveSection} dashboardData={dashboardData} />;
      case 'payments':
        return <TenantPaymentsPage dashboardData={dashboardData} />;
      case 'maintenance':
        return <TenantMaintenanceRequests />;
      case 'documents':
        return <TenantDocuments />;
      case 'settings':
        return <TenantSettings />;
      default:
        return <TenantOverview onNavigate={setActiveSection} dashboardData={dashboardData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h2 className="font-semibold">Contrezz</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {tenantInfo.notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {tenantInfo.notifications}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-16"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r z-40 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-16 lg:pt-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo - Desktop only */}
          <div className="hidden lg:block p-6 border-b">
            <h1 className="text-2xl font-bold text-blue-600">Contrezz</h1>
            <p className="text-sm text-muted-foreground mt-1">Tenant Portal</p>
          </div>

          {/* Tenant Info */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="" alt={tenantInfo.name} />
                <AvatarFallback>{tenantInfo.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{tenantInfo.name}</p>
                <p className="text-sm text-muted-foreground truncate">{tenantInfo.unit}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                      ${isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <div className="hidden lg:block sticky top-0 z-30 bg-white border-b">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h2 className="text-xl font-semibold">{tenantInfo.property}</h2>
              <p className="text-sm text-muted-foreground">{tenantInfo.unit}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {tenantInfo.notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {tenantInfo.notifications}
                  </Badge>
                )}
              </Button>
              <Avatar>
                <AvatarImage src="" alt={tenantInfo.name} />
                <AvatarFallback>{tenantInfo.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-8 flex-grow w-full max-w-full overflow-x-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default TenantDashboard;

