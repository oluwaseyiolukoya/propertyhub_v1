import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  BarChart3,
  TrendingUp,
  Settings,
  FolderKanban,
  Building2,
  CreditCard,
  Users,
  HelpCircle,
  LogOut,
  ChevronDown,
  Bell,
  DollarSign,
  Shield,
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
import { Button } from "../../../components/ui/button";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import PortfolioOverview from "./PortfolioOverview";
import ProjectDashboard from "./ProjectDashboard";
import CreateProjectPage from "./CreateProjectPage";
import { EditProjectPage } from "./EditProjectPage";
import InvoicesPage from "./InvoicesPage";
import { BudgetManagementPage } from "./BudgetManagementPage";
import { PurchaseOrdersPage } from "./PurchaseOrdersPage";
import { ReportsPage } from "./ReportsPage";
import { ForecastsPage } from "./ForecastsPage";
import { ExpenseManagementPage } from "./ExpenseManagementPage";
import ProjectFundingPage from "./ProjectFundingPage";
import ProjectInvoicesPage from "./ProjectInvoicesPage";
import { useProjects } from "../hooks/useDeveloperDashboardData";
import { Footer } from "../../../components/Footer";
import { toast } from "sonner";
import { PlatformLogo } from "../../../components/PlatformLogo";
import { TrialStatusBanner } from "../../../components/TrialStatusBanner";
import { UpgradeModal } from "../../../components/UpgradeModal";
import { NotificationCenter } from "../../../components/NotificationCenter";
import { ChangePasswordModal } from "../../../components/ChangePasswordModal";
import { getAccountInfo } from "../../../lib/api/auth";
import { getSubscriptionStatus } from "../../../lib/api/subscription";
import { apiClient } from "../../../lib/api-client";
import { DeveloperSettings } from "./DeveloperSettings";

interface DeveloperDashboardRefactoredProps {
  user?: any;
  onLogout: () => void;
}

type Page =
  | "portfolio"
  | "project-dashboard"
  | "budgets"
  | "purchase-orders"
  | "project-invoices"
  | "reports"
  | "forecasts"
  | "settings"
  | "profile"
  | "create-project"
  | "edit-project"
  | "expense-management"
  | "project-funding";

export const DeveloperDashboardRefactored: React.FC<
  DeveloperDashboardRefactoredProps
> = ({ user, onLogout }) => {
  const [currentPage, setCurrentPage] = useState<Page>("portfolio");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  // Treat ANY team member as non-owner and also require email match with customer email.
  const customerEmail = (
    user?.customer?.email ||
    user?.customerEmail ||
    ""
  ).toLowerCase();
  const userEmail = (user?.email || "").toLowerCase();
  const initialIsOwner =
    !!user?.isOwner &&
    !user?.teamMemberRole &&
    !!userEmail &&
    !!customerEmail &&
    userEmail === customerEmail;
  const [isOwner, setIsOwner] = useState<boolean>(initialIsOwner);

  // Fetch actual projects from API
  const { data: projects, loading: projectsLoading } = useProjects(
    {},
    {},
    1,
    100
  );

  // Check for payment callback and redirect to settings
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentCallback = urlParams.get("payment_callback");

    if (paymentCallback === "payment_method" || paymentCallback === "upgrade") {
      console.log(
        "[DeveloperDashboard] Detected payment callback, redirecting to settings..."
      );
      setCurrentPage("settings");
    }
  }, []);

  // Fetch account info and subscription status
  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const [acctResponse, subResponse] = await Promise.all([
          getAccountInfo(),
          getSubscriptionStatus(),
        ]);

        if (acctResponse.data) {
          setAccountInfo(acctResponse.data);
          const backendIsOwner = !!acctResponse.data.user?.isOwner;
          const hasTeamMemberRole = !!acctResponse.data.user?.teamMemberRole;
          const responseUserEmail = (
            acctResponse.data.user?.email || ""
          ).toLowerCase();
          const responseCustomerEmail = (
            acctResponse.data.customer?.email || ""
          ).toLowerCase();
          const emailMatches =
            !!responseUserEmail &&
            !!responseCustomerEmail &&
            responseUserEmail === responseCustomerEmail;
          // Final owner status: backend flag AND email matches customer AND not a team member
          const ownerStatus =
            backendIsOwner && emailMatches && !hasTeamMemberRole;
          setIsOwner(ownerStatus);
          console.log("🔍 [DeveloperDashboardRefactored] Owner status check:", {
            email: acctResponse.data.user?.email,
            isOwner: ownerStatus,
            rawIsOwner: acctResponse.data.user?.isOwner,
            teamMemberRole: acctResponse.data.user?.teamMemberRole,
            role: acctResponse.data.user?.role,
            emailMatchesCustomer: emailMatches,
            customerEmail: acctResponse.data.customer?.email,
          });
        }

        if (subResponse.data) {
          setSubscription(subResponse.data);
        }
      } catch (error) {
        console.error("Failed to fetch account data:", error);
      }
    };

    fetchAccountData();
  }, [user]);

  // Prevent non-owners from staying on settings page
  useEffect(() => {
    if (!isOwner && currentPage === "settings") {
      setCurrentPage("portfolio");
    }
  }, [isOwner, currentPage]);

  const handleProjectSelect = (projectId: string) => {
    if (projectId === "all-projects") {
      handleBackToPortfolio();
    } else {
      setSelectedProjectId(projectId);
      setCurrentPage("project-dashboard");
    }
  };

  const handleBackToPortfolio = () => {
    setCurrentPage("portfolio");
    setSelectedProjectId(null);
  };

  const handleCreateProject = () => {
    setCurrentPage("create-project");
  };

  const handleCancelCreateProject = () => {
    setCurrentPage("portfolio");
    setSelectedProjectId(null);
  };

  const handleProjectCreated = (projectId: string) => {
    // Go back to portfolio to show the new project in the list
    setCurrentPage("portfolio");
    setSelectedProjectId(null);
    // The portfolio page will automatically refresh and show the new project
  };

  const handleEditProject = () => {
    setCurrentPage("edit-project");
  };

  const handleCancelEditProject = () => {
    setCurrentPage("project-dashboard");
  };

  const handleProjectUpdated = (projectId: string) => {
    // Go back to project dashboard to show updated data
    setCurrentPage("project-dashboard");
    // The project dashboard will automatically refresh
  };

  const handleOpenSettings = (tab?: string) => {
    if (isOwner) {
      setCurrentPage("settings");
      // Update URL with tab parameter if provided
      if (tab) {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.pushState({}, "", url.toString());
      }
    } else {
      toast.warning("Only account owners can access Settings and Billing.");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await apiClient.delete<{ message: string }>(
        `/api/developer-dashboard/projects/${projectId}`
      );

      if (response.error) {
        throw new Error(response.error.message || "Failed to delete project");
      }

      toast.success("Project deleted successfully");

      // If we're viewing the deleted project, go back to portfolio
      if (selectedProjectId === projectId) {
        setCurrentPage("portfolio");
        setSelectedProjectId(null);
      }

      // Refresh the projects list
      window.location.reload();
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error(error?.message || "Failed to delete project");
    }
  };

  const handleMarkAsCompleted = async (projectId: string) => {
    if (
      !window.confirm(
        "Mark this project as completed? This will set the status to completed."
      )
    ) {
      return;
    }

    try {
      const response = await apiClient.patch<any>(
        `/api/developer-dashboard/projects/${projectId}`,
        {
          status: "completed",
          actualEndDate: new Date().toISOString(),
        }
      );

      if (response.error) {
        throw new Error(response.error.message || "Failed to update project");
      }

      // Update project progress automatically
      try {
        const token =
          localStorage.getItem("auth_token") || localStorage.getItem("token");
        if (token) {
          await fetch(
            `/api/developer-dashboard/projects/${projectId}/progress/update`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log("[MarkCompleted] Project progress updated automatically");
        }
      } catch (progressError) {
        console.warn(
          "[MarkCompleted] Failed to update progress:",
          progressError
        );
      }

      toast.success("Project marked as completed");
      window.location.reload(); // Refresh to show updated status
    } catch (error: any) {
      console.error("Error marking project as completed:", error);
      toast.error(error?.message || "Failed to update project");
    }
  };

  const handleReactivateProject = async (projectId: string) => {
    if (
      !window.confirm(
        "Reactivate this project? This will set the status back to active."
      )
    ) {
      return;
    }

    try {
      const response = await apiClient.patch<any>(
        `/api/developer-dashboard/projects/${projectId}`,
        {
          status: "active",
          actualEndDate: null,
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || "Failed to reactivate project"
        );
      }

      toast.success("Project reactivated successfully");
      window.location.reload(); // Refresh to show updated status
    } catch (error: any) {
      console.error("Error reactivating project:", error);
      toast.error(error?.message || "Failed to reactivate project");
    }
  };

  const handleGenerateReport = () => {
    toast.info("Report generation feature coming soon!");
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

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    if (projectsLoading) return "Loading...";
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  // Get user permissions and role
  const userPermissions = accountInfo?.user?.permissions || {};
  // Check if user can manage projects (create/edit/delete)
  // If permissions.projects === "view", they can only view, not manage
  const canManageProjects =
    userPermissions.canManageProjects !== false &&
    userPermissions.projects !== "view"; // Default true for Owner, false if projects is "view"
  // Owners (isOwner) have all permissions by default
  // Team members need explicit permission
  const canApproveInvoices =
    isOwner || userPermissions.canApproveInvoices === true;
  const canCreateInvoices =
    isOwner || userPermissions.canCreateInvoices === true;
  const canViewReports = userPermissions.canViewReports !== false; // Default true

  // Main menu items (always visible)
  const mainMenuItems: Array<{ id: Page; label: string; icon: any }> = [
    { id: "portfolio" as Page, label: "Portfolio", icon: FolderKanban },
  ];
  if (isOwner) {
    mainMenuItems.push({
      id: "settings" as Page,
      label: "Settings",
      icon: Settings,
    });
  }

  // Project-specific menu items (organized by developer workflow hierarchy)
  const allProjectMenuItems = [
    // 1. Overview & Planning
    {
      id: "project-dashboard" as Page,
      label: "Project Dashboard",
      icon: LayoutDashboard,
      visible: true, // Everyone can view
    },
    // 2. Financial Planning & Setup
    {
      id: "budgets" as Page,
      label: "Budgets",
      icon: Wallet,
      visible: true, // Everyone can view budgets
    },
    {
      id: "project-funding" as Page,
      label: "Project Funding",
      icon: DollarSign,
      visible: canManageProjects, // Owner, Project Manager
    },
    // 3. Procurement & Operations
    {
      id: "purchase-orders" as Page,
      label: "Purchase Orders",
      icon: CreditCard,
      visible: true, // Everyone can view POs
    },
    {
      id: "expense-management" as Page,
      label: "Expenses",
      icon: Receipt,
      visible: true, // Everyone can view expenses
    },
    // 4. Billing & Payments
    {
      id: "project-invoices" as Page,
      label: "Invoices",
      icon: Receipt,
      visible: true, // Everyone can view invoices
    },
    // 5. Analytics & Insights
    {
      id: "reports" as Page,
      label: "Reports",
      icon: BarChart3,
      visible: canViewReports, // Everyone except Viewer (limited)
    },
    {
      id: "forecasts" as Page,
      label: "Forecasts",
      icon: TrendingUp,
      visible: true, // Everyone can view forecasts
    },
  ];

  // Filter project menu items based on permissions
  const projectMenuItems = allProjectMenuItems.filter((item) => item.visible);

  const renderPage = () => {
    if (currentPage === "create-project") {
      return (
        <CreateProjectPage
          onCancel={handleCancelCreateProject}
          onProjectCreated={handleProjectCreated}
        />
      );
    }

    if (currentPage === "edit-project" && selectedProjectId) {
      return (
        <EditProjectPage
          projectId={selectedProjectId}
          onCancel={handleCancelEditProject}
          onProjectUpdated={handleProjectUpdated}
        />
      );
    }

    switch (currentPage) {
      case "portfolio":
        return (
          <>
            {/* Trial Status Banner */}
            <TrialStatusBanner
              onUpgradeClick={() => setShowUpgradeModal(true)}
              onAddPaymentMethod={() => handleOpenSettings("billing")}
            />
            <PortfolioOverview
              onViewProject={handleProjectSelect}
              onEditProject={(projectId) => {
                setSelectedProjectId(projectId);
                handleEditProject();
              }}
              onDeleteProject={handleDeleteProject}
              onMarkAsCompleted={handleMarkAsCompleted}
              onReactivateProject={handleReactivateProject}
              onCreateProject={handleCreateProject}
              canManageProjects={canManageProjects}
            />
          </>
        );
      case "project-dashboard":
        return selectedProjectId ? (
          <ProjectDashboard
            projectId={selectedProjectId}
            onBack={handleBackToPortfolio}
            onGenerateReport={handleGenerateReport}
            onEditProject={handleEditProject}
            onMarkAsCompleted={() => handleMarkAsCompleted(selectedProjectId)}
            onReactivateProject={() =>
              handleReactivateProject(selectedProjectId)
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project</p>
          </div>
        );
      case "project-invoices":
        return selectedProjectId ? (
          <ProjectInvoicesPage
            projectId={selectedProjectId}
            canApproveInvoices={canApproveInvoices}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Please select a project to view invoices
            </p>
          </div>
        );
      case "project-funding":
        return selectedProjectId ? (
          <ProjectFundingPage
            projectId={selectedProjectId}
            projectName={
              projects.find((p) => p.id === selectedProjectId)?.name ||
              "Project"
            }
            projectCurrency={
              projects.find((p) => p.id === selectedProjectId)?.currency ||
              "NGN"
            }
            onBack={handleBackToPortfolio}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Please select a project to manage funding
            </p>
          </div>
        );
      case "expense-management":
        return selectedProjectId ? (
          <ExpenseManagementPage
            projectId={selectedProjectId}
            projectName={
              projects.find((p) => p.id === selectedProjectId)?.name ||
              "Project"
            }
            projectCurrency={
              projects.find((p) => p.id === selectedProjectId)?.currency ||
              "NGN"
            }
            onBack={handleBackToPortfolio}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Please select a project to manage expenses
            </p>
          </div>
        );
      case "budgets":
        return selectedProjectId ? (
          <BudgetManagementPage projectId={selectedProjectId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Please select a project to view its budget
            </p>
          </div>
        );
      case "purchase-orders":
        return selectedProjectId ? (
          <PurchaseOrdersPage
            projectId={selectedProjectId}
            canApproveInvoices={canApproveInvoices}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Please select a project to view purchase orders
            </p>
          </div>
        );
      case "reports":
        return selectedProjectId ? (
          <ReportsPage projectId={selectedProjectId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Please select a project to view reports
            </p>
          </div>
        );
      case "forecasts":
        return selectedProjectId ? (
          <ForecastsPage projectId={selectedProjectId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Please select a project to view forecasts
            </p>
          </div>
        );
      case "profile":
        return <DeveloperSettings user={user} showOnlyProfile={true} />;
      case "settings":
        if (!isOwner) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Access Restricted
                </h3>
                <p className="text-gray-600">
                  Only account owners can manage Settings.
                </p>
              </div>
            </div>
          );
        }
        return <DeveloperSettings user={user} showOnlyProfile={false} />;
      default:
        return (
          <PortfolioOverview
            onViewProject={handleProjectSelect}
            onEditProject={(projectId) => {
              setSelectedProjectId(projectId);
              handleEditProject();
            }}
            onDeleteProject={handleDeleteProject}
            onMarkAsCompleted={handleMarkAsCompleted}
            onReactivateProject={handleReactivateProject}
            onCreateProject={handleCreateProject}
            canManageProjects={canManageProjects}
          />
        );
    }
  };

  // Hide sidebar and header for create-project view
  if (currentPage === "create-project") {
    return renderPage();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      {/* Header - Dark Brand Design (Matching Owner Dashboard) */}
      <header className="bg-[#111827] shadow-lg sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] p-2 rounded-xl">
                <ContrezztLogo className="w-6 h-6 text-[#111827]" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
                Contrezz
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {user?.company && (
                <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  {user.company}
                </Badge>
              )}

              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center ring-2 ring-white/20">
                  <span className="text-white text-sm font-semibold">
                    {getInitials(user?.name || "Developer")}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-white">
                    {user?.name || "Developer"}
                  </div>
                  <div className="text-xs text-white/60">
                    Property Developer
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Dark Brand Design (Matching Owner Dashboard) */}
        <div className="hidden lg:block w-64 bg-[#111827] shadow-xl border-r border-white/10">
          {selectedProjectId && (
            <div className="p-4 border-b border-white/10">
              <div className="px-3 py-2 bg-purple-600/20 rounded-lg border border-purple-500/30">
                <p className="text-xs text-purple-300 mb-1">Current Project</p>
                <p className="text-sm font-medium text-white">
                  {getProjectName(selectedProjectId)}
                </p>
              </div>
            </div>
          )}

          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {/* Main Menu Items */}
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "settings") {
                        handleOpenSettings("organization");
                      } else {
                        setCurrentPage(item.id);
                      }
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
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Project-Specific Menu Items */}
              {selectedProjectId && (
                <>
                  <div className="pt-6 pb-2">
                    <p className="text-xs text-white/50 px-4 uppercase tracking-wider">
                      Project Menu
                    </p>
                  </div>
                  {projectMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentPage(item.id)}
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
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
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

          {/* Pinned Projects */}
          {!selectedProjectId && projects.length > 0 && (
            <div className="mt-8 px-3">
              <p className="text-xs text-white/50 px-4 mb-2 uppercase tracking-wider">
                Pinned Projects
              </p>
              <div className="space-y-1">
                {projects.slice(0, 3).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left"
                  >
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm truncate">{project.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0">
          {renderPage()}
        </main>
      </div>

      {/* Footer */}
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

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default DeveloperDashboardRefactored;
