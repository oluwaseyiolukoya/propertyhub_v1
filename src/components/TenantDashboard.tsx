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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading...</p>
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
      {/* Mobile Header - Dark Brand Design (Matching Owner Dashboard) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#111827] border-b border-white/10 z-50 flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] p-1.5 rounded-lg shadow-lg shadow-purple-500/25">
            <ContrezztLogo className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-bold text-white">Contrezz</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 transition-colors">
            <Bell className="h-5 w-5" />
            {tenantInfo.notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] border-0 shadow-lg shadow-purple-500/25">
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

      {/* Sidebar - Dark Brand Design (Matching Owner Dashboard) */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-[#111827] shadow-xl z-40 transform transition-transform duration-300 ease-in-out border-r border-white/10
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
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
              <p className="text-xs text-white/60 font-medium">Tenant Portal</p>
            </div>
          </div>

          {/* Tenant Info */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border-2 border-white/20 shadow-lg">
                <AvatarImage src="" alt={tenantInfo.name} />
                <AvatarFallback className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] text-white font-semibold">{tenantInfo.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{tenantInfo.name}</p>
                <p className="text-sm text-white/60 font-medium truncate">{tenantInfo.unit}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
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
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-lg shadow-purple-500/25'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <div className="hidden lg:block sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{tenantInfo.property}</h2>
              <p className="text-sm text-gray-600 font-medium">{tenantInfo.unit}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] transition-colors">
                <Bell className="h-5 w-5" />
                {tenantInfo.notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] border-0 shadow-lg shadow-purple-500/25">
                    {tenantInfo.notifications}
                  </Badge>
                )}
              </Button>
              <Avatar className="h-9 w-9 border-2 border-[#7C3AED]/20 shadow-sm">
                <AvatarImage src="" alt={tenantInfo.name} />
                <AvatarFallback className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] text-white font-semibold">{tenantInfo.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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

