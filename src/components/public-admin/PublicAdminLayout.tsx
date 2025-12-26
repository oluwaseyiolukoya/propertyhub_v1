import React, { useState, useEffect } from "react";
import {
  publicAdminApi,
  getAdminData,
  removeAdminToken,
} from "../../lib/api/publicAdminApi";
import { Button } from "../ui/button";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  LogOut,
  Menu,
  X,
  Shield,
  BarChart3,
  ClipboardList,
  Calendar,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { PublicAdminDashboard } from "./PublicAdminDashboard";
import { LandingPageList } from "./landing-pages/LandingPageList";
import { CareerManagement } from "./careers/CareerManagement";
import { PublicContentAnalytics } from "./analytics/PublicContentAnalytics";
import { FormsDashboard } from "./forms/FormsDashboard";
import { ScheduleDemoSubmissions } from "./forms/ScheduleDemoSubmissions";
import { ContactUsSubmissions } from "./forms/ContactUsSubmissions";

interface PublicAdminLayoutProps {
  children?: React.ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export function PublicAdminLayout({ children }: PublicAdminLayoutProps) {
  const [admin, setAdmin] = useState(getAdminData());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [currentSubPage, setCurrentSubPage] = useState<string | null>(null);

  useEffect(() => {
    // Verify admin session on mount
    const verifySession = async () => {
      try {
        const response = await publicAdminApi.getMe();
        setAdmin(response.admin);
      } catch (error: any) {
        // Session invalid, redirect to login
        removeAdminToken();
        window.location.href = "/admin/login";
      }
    };

    if (admin) {
      verifySession();
    }
  }, []);

  const handleLogout = async () => {
    try {
      await publicAdminApi.logout();
      toast.success("Logged out successfully");
      window.location.href = "/admin/login";
    } catch (error: any) {
      // Even if API call fails, remove token locally
      removeAdminToken();
      window.location.href = "/admin/login";
    }
  };

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "landing-pages", label: "Landing Pages", icon: FileText },
    { id: "careers", label: "Careers", icon: Briefcase },
    {
      id: "forms",
      label: "Forms",
      icon: ClipboardList,
      subItems: [
        { id: "contact-us", label: "Contact Us", icon: Mail },
        { id: "schedule-demo", label: "Schedule Demo", icon: Calendar },
      ],
    },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const handleMenuClick = (itemId: string, subItemId?: string) => {
    setCurrentPage(itemId);
    setCurrentSubPage(subItemId || null);
  };

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Public Admin
                </h1>
                <p className="text-xs text-gray-500">Content Management</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{admin.name}</p>
              <p className="text-xs text-gray-500">{admin.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0`}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const hasSubItems = item.subItems && item.subItems.length > 0;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (hasSubItems && currentPage === item.id) {
                        // Toggle submenu
                        setCurrentSubPage(null);
                      } else {
                        handleMenuClick(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {hasSubItems && (
                      <span
                        className={`text-xs ${
                          isActive ? "text-white/70" : "text-gray-400"
                        }`}
                      >
                        {currentPage === item.id && currentSubPage ? "▼" : "▶"}
                      </span>
                    )}
                  </button>
                  {hasSubItems && currentPage === item.id && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = currentSubPage === subItem.id;
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => handleMenuClick(item.id, subItem.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                              isSubActive
                                ? "bg-purple-100 text-purple-700 font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <SubIcon className="h-4 w-4" />
                            <span>{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {currentPage === "dashboard" && <PublicAdminDashboard />}
          {currentPage === "landing-pages" && <LandingPageList />}
          {currentPage === "careers" && <CareerManagement />}
          {currentPage === "forms" && !currentSubPage && (
            <FormsDashboard
              onNavigateToForm={(formType) => {
                setCurrentSubPage(formType);
              }}
            />
          )}
          {currentPage === "forms" && currentSubPage === "contact-us" && (
            <ContactUsSubmissions />
          )}
          {currentPage === "forms" && currentSubPage === "schedule-demo" && (
            <ScheduleDemoSubmissions />
          )}
          {currentPage === "analytics" && <PublicContentAnalytics />}
          {children}
        </main>
      </div>
    </div>
  );
}
