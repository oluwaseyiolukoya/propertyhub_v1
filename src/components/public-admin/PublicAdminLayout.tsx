import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Routes, Route, Navigate, Outlet } from "react-router-dom";
import {
  publicAdminApi,
  getAdminData,
  getAdminToken,
  removeAdminToken,
} from "../../lib/api/publicAdminApi";
import { parseRoute, generateRoute, ADMIN_ROUTES } from "./routes";
import { Button } from "../ui/button";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  LogOut,
  Menu,
  X,
  BarChart3,
  ClipboardList,
  Calendar,
  Mail,
  Home,
  Users,
} from "lucide-react";
import { toast } from "sonner";

// ContrezztLogo component (brand guideline compliant)
const ContrezztLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
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
import { PublicAdminDashboard } from "./PublicAdminDashboard";
import { LandingPageList } from "./landing-pages/LandingPageList";
import { HomePageEditor } from "./landing-pages/HomePageEditor";
import { CareerManagement } from "./careers/CareerManagement";
import { PublicContentAnalytics } from "./analytics/PublicContentAnalytics";
import { FormsDashboard } from "./forms/FormsDashboard";
import { ScheduleDemoSubmissions } from "./forms/ScheduleDemoSubmissions";
import { ContactUsSubmissions } from "./forms/ContactUsSubmissions";
import { UserManagement } from "./users/UserManagement";

interface PublicAdminLayoutProps {
  children?: React.ReactNode;
  onLogout?: () => void;
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

export function PublicAdminLayout({ children, onLogout }: PublicAdminLayoutProps) {
  const [admin, setAdmin] = useState(getAdminData());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Parse current route from URL
  const { pageId, subPageId } = parseRoute(location.pathname);

  useEffect(() => {
    // Don't do anything if logout is in progress
    if (isLoggingOut) {
      console.log("[PublicAdminLayout] Skipping session verification - logout in progress");
      return;
    }
    
    // Track if component is still mounted
    let isMounted = true;
    
    // Verify admin session on mount
    const verifySession = async () => {
      // Small delay to ensure token is stored after login
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if component is still mounted
      if (!isMounted) return;

      // Check if token exists before making request
      const token = getAdminToken();
      if (!token) {
        // No token, redirect to login (but only if still mounted)
        console.warn("[PublicAdminLayout] No token found, redirecting to login");
        if (isMounted && !isLoggingOut) {
          removeAdminToken();
          // Use window.location to avoid React Router redirect loops
          window.location.href = "/admin/login";
        }
        return;
      }

      try {
        const response = await publicAdminApi.getMe();
        if (isMounted) {
          setAdmin(response.admin);
        }
      } catch (error: any) {
        if (!isMounted || isLoggingOut) return;
        
        // Only logout on 401 (unauthorized) - other errors might be temporary
        if (
          error.error === "Session expired. Please log in again." ||
          error.error === "Not authenticated" ||
          error.message === "Session expired. Please log in again." ||
          error.code === "NETWORK_ERROR" // Network errors might mean server is down
        ) {
          // For network errors, check if we have cached admin data
          // If we do, keep using it (server might be temporarily down)
          if (error.code === "NETWORK_ERROR" && admin) {
            console.warn("[PublicAdminLayout] Network error during session verification, using cached admin data");
            return; // Keep using cached data
          }

          // Session invalid or no cached data, redirect to login
          console.warn("[PublicAdminLayout] Session expired or invalid, redirecting to login");
          removeAdminToken();
          if (onLogout) onLogout();
          window.location.href = "/admin/login";
        } else {
          // For other errors (server errors, etc.), log but don't logout
          // The user might still have a valid session, just can't verify right now
          console.error("[PublicAdminLayout] Failed to verify session (non-auth error):", error);
          // Keep using cached admin data if available
          if (!admin) {
            // If no cached admin data and verification fails, redirect to login
            removeAdminToken();
            if (onLogout) onLogout();
            window.location.href = "/admin/login";
          }
        }
      }
    };

    // Always verify session if we have admin data or token
    const token = getAdminToken();
    if (admin || token) {
      verifySession();
    } else if (!isLoggingOut) {
      // No admin data and no token, redirect to login
      console.log("[PublicAdminLayout] No admin data and no token, redirecting to login");
      window.location.href = "/admin/login";
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggingOut]); // Re-run when logout state changes

  const handleLogout = async () => {
    console.log("[PublicAdminLayout] handleLogout called");
    
    // Set flag to prevent useEffect from redirecting
    setIsLoggingOut(true);
    
    try {
      await publicAdminApi.logout();
      console.log("[PublicAdminLayout] API logout successful");
    } catch (error: any) {
      console.error("[PublicAdminLayout] API logout failed:", error);
      // Even if API call fails, remove token locally
      removeAdminToken();
    }
    
    // IMPORTANT: Update parent state to prevent redirect loop
    console.log("[PublicAdminLayout] Calling onLogout callback");
    if (onLogout) {
      onLogout();
    }
    
    // Use full page reload to ensure clean state and avoid redirect loops
    // This clears all React state and navigates to the login page
    console.log("[PublicAdminLayout] Performing full page redirect to login");
    toast.success("Logged out successfully");
    
    // Give toast time to show, then do full page redirect
    setTimeout(() => {
      window.location.href = "/admin/login";
    }, 500);
  };

  // Check if user has access to a page
  const hasPageAccess = (pageId: string): boolean => {
    // If user is admin, they have access to everything
    if (admin?.role === "admin") return true;

    // If no pagePermissions set, user has access to all pages (default)
    if (!admin?.pagePermissions || admin.pagePermissions.length === 0) {
      return true;
    }

    // Check if page is in user's permissions
    return admin.pagePermissions.includes(pageId);
  };

  const menuItems: MenuItem[] = [
    hasPageAccess("dashboard") && {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    hasPageAccess("landing-pages") && {
      id: "landing-pages",
      label: "Landing Pages",
      icon: FileText,
      subItems: [{ id: "home", label: "Home", icon: Home }],
    },
    hasPageAccess("careers") && {
      id: "careers",
      label: "Careers",
      icon: Briefcase,
    },
    hasPageAccess("forms") && {
      id: "forms",
      label: "Forms",
      icon: ClipboardList,
      subItems: [
        { id: "contact-us", label: "Contact Us", icon: Mail },
        { id: "schedule-demo", label: "Schedule Demo", icon: Calendar },
      ],
    },
    hasPageAccess("analytics") && {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
    },
    hasPageAccess("users") && admin?.role === "admin" && {
      id: "users",
      label: "Users",
      icon: Users,
    },
  ].filter(Boolean) as MenuItem[];

  const handleMenuClick = (itemId: string, subItemId?: string) => {
    const route = generateRoute(itemId, subItemId);
    navigate(route);
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
                <ContrezztLogo className="h-5 w-5 text-white" />
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
              const itemRoute = generateRoute(item.id);
              const isActive = pageId === item.id;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isSubMenuOpen = isActive && hasSubItems;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (hasSubItems && isActive) {
                        // Toggle submenu - navigate to parent route
                        navigate(itemRoute);
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
                        {isSubMenuOpen && subPageId ? "▼" : "▶"}
                      </span>
                    )}
                  </button>
                  {hasSubItems && isSubMenuOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subRoute = generateRoute(item.id, subItem.id);
                        const isSubActive = pageId === item.id && subPageId === subItem.id;
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
          <Routes>
            <Route
              path="dashboard"
              element={
                <PublicAdminDashboard
                  onNavigate={(page, subPage) => handleMenuClick(page, subPage)}
                />
              }
            />
            <Route path="landing-pages" element={<LandingPageList />} />
            <Route path="landing-pages/home" element={<HomePageEditor />} />
            <Route path="careers" element={<CareerManagement />} />
            <Route
              path="forms"
              element={
                <FormsDashboard
                  onNavigateToForm={(formType) => {
                    navigate(generateRoute("forms", formType));
                  }}
                />
              }
            />
            <Route
              path="forms/contact-us"
              element={<ContactUsSubmissions />}
            />
            <Route
              path="forms/schedule-demo"
              element={<ScheduleDemoSubmissions />}
            />
            <Route path="analytics" element={<PublicContentAnalytics />} />
            <Route path="users" element={<UserManagement />} />
            <Route
              index
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="*"
              element={<Navigate to="/admin/dashboard" replace />}
            />
          </Routes>
          {children}
        </main>
      </div>
    </div>
  );
}
