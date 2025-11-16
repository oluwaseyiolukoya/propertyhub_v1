import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  BarChart3,
  TrendingUp,
  Settings,
  FolderKanban,
  Building2,
  User,
  CreditCard,
  Users,
  HelpCircle,
  LogOut,
  ChevronDown,
  Bell,
  DollarSign,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import PortfolioOverview from './PortfolioOverview';
import ProjectDashboard from './ProjectDashboard';
import CreateProjectPage from './CreateProjectPage';
import { EditProjectPage } from './EditProjectPage';
import InvoicesPage from './InvoicesPage';
import { BudgetManagementPage } from './BudgetManagementPage';
import { PurchaseOrdersPage } from './PurchaseOrdersPage';
import { ReportsPage } from './ReportsPage';
import { ForecastsPage } from './ForecastsPage';
import { ExpenseManagementPage } from './ExpenseManagementPage';
import ProjectFundingPage from './ProjectFundingPage';
import { useProjects } from '../hooks/useDeveloperDashboardData';
import { Footer } from '../../../components/Footer';
import { toast } from 'sonner';
import { PlatformLogo } from '../../../components/PlatformLogo';
import { TrialStatusBanner } from '../../../components/TrialStatusBanner';
import { UpgradeModal } from '../../../components/UpgradeModal';
import { getAccountInfo } from '../../../lib/api/auth';
import { getSubscriptionStatus } from '../../../lib/api/subscription';
import { apiClient } from '../../../lib/api-client';
import { DeveloperSettings } from './DeveloperSettings';

interface DeveloperDashboardRefactoredProps {
  user?: any;
  onLogout: () => void;
}

type Page =
  | 'portfolio'
  | 'project-dashboard'
  | 'budgets'
  | 'purchase-orders'
  | 'reports'
  | 'forecasts'
  | 'settings'
  | 'create-project'
  | 'edit-project'
  | 'expense-management'
  | 'project-funding';

export const DeveloperDashboardRefactored: React.FC<DeveloperDashboardRefactoredProps> = ({
  user,
  onLogout,
}) => {
  const [currentPage, setCurrentPage] = useState<Page>('portfolio');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Fetch actual projects from API
  const { data: projects, loading: projectsLoading } = useProjects({}, {}, 1, 100);

  // Fetch account info and subscription status
  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const [acctResponse, subResponse] = await Promise.all([
          getAccountInfo(),
          getSubscriptionStatus()
        ]);

        if (acctResponse.data) {
          setAccountInfo(acctResponse.data);
        }

        if (subResponse.data) {
          setSubscription(subResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch account data:', error);
      }
    };

    fetchAccountData();
  }, []);

  const handleProjectSelect = (projectId: string) => {
    if (projectId === 'all-projects') {
      handleBackToPortfolio();
    } else {
      setSelectedProjectId(projectId);
      setCurrentPage('project-dashboard');
    }
  };

  const handleBackToPortfolio = () => {
    setCurrentPage('portfolio');
    setSelectedProjectId(null);
  };

  const handleCreateProject = () => {
    setCurrentPage('create-project');
  };

  const handleCancelCreateProject = () => {
    setCurrentPage('portfolio');
    setSelectedProjectId(null);
  };

  const handleProjectCreated = (projectId: string) => {
    // Go back to portfolio to show the new project in the list
    setCurrentPage('portfolio');
    setSelectedProjectId(null);
    // The portfolio page will automatically refresh and show the new project
  };

  const handleEditProject = () => {
    setCurrentPage('edit-project');
  };

  const handleCancelEditProject = () => {
    setCurrentPage('project-dashboard');
  };

  const handleProjectUpdated = (projectId: string) => {
    // Go back to project dashboard to show updated data
    setCurrentPage('project-dashboard');
    // The project dashboard will automatically refresh
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiClient.delete<{ message: string}>(
        `/api/developer-dashboard/projects/${projectId}`
      );

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete project');
      }

      toast.success('Project deleted successfully');

      // If we're viewing the deleted project, go back to portfolio
      if (selectedProjectId === projectId) {
        setCurrentPage('portfolio');
        setSelectedProjectId(null);
      }

      // Refresh the projects list
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(error?.message || 'Failed to delete project');
    }
  };

  const handleMarkAsCompleted = async (projectId: string) => {
    if (!window.confirm('Mark this project as completed? This will set the status to completed.')) {
      return;
    }

    try {
      const response = await apiClient.patch<any>(
        `/api/developer-dashboard/projects/${projectId}`,
        {
          status: 'completed',
          actualEndDate: new Date().toISOString(),
        }
      );

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update project');
      }

      // Update project progress automatically
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token) {
          await fetch(`/api/developer-dashboard/projects/${projectId}/progress/update`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          console.log("[MarkCompleted] Project progress updated automatically");
        }
      } catch (progressError) {
        console.warn("[MarkCompleted] Failed to update progress:", progressError);
      }

      toast.success('Project marked as completed');
      window.location.reload(); // Refresh to show updated status
    } catch (error: any) {
      console.error('Error marking project as completed:', error);
      toast.error(error?.message || 'Failed to update project');
    }
  };

  const handleReactivateProject = async (projectId: string) => {
    if (!window.confirm('Reactivate this project? This will set the status back to active.')) {
      return;
    }

    try {
      const response = await apiClient.patch<any>(
        `/api/developer-dashboard/projects/${projectId}`,
        {
          status: 'active',
          actualEndDate: null,
        }
      );

      if (response.error) {
        throw new Error(response.error.message || 'Failed to reactivate project');
      }

      toast.success('Project reactivated successfully');
      window.location.reload(); // Refresh to show updated status
    } catch (error: any) {
      console.error('Error reactivating project:', error);
      toast.error(error?.message || 'Failed to reactivate project');
    }
  };

  const handleGenerateReport = () => {
    toast.info('Report generation feature coming soon!');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'PD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    if (projectsLoading) return 'Loading...';
    const project = projects.find((p) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  // Main menu items (always visible)
  const mainMenuItems = [
    { id: 'portfolio' as Page, label: 'Portfolio', icon: FolderKanban },
    { id: 'settings' as Page, label: 'Settings', icon: Settings },
  ];

  // Project-specific menu items (only visible when project is selected)
  const projectMenuItems = [
    { id: 'project-dashboard' as Page, label: 'Project Dashboard', icon: LayoutDashboard },
    { id: 'project-funding' as Page, label: 'Project Funding', icon: DollarSign },
    { id: 'expense-management' as Page, label: 'Expenses', icon: Receipt },
    { id: 'budgets' as Page, label: 'Budgets', icon: Wallet },
    { id: 'purchase-orders' as Page, label: 'Purchase Orders', icon: CreditCard },
    { id: 'reports' as Page, label: 'Reports', icon: BarChart3 },
    { id: 'forecasts' as Page, label: 'Forecasts', icon: TrendingUp },
  ];

  const renderPage = () => {
    if (currentPage === 'create-project') {
      return (
        <CreateProjectPage
          onCancel={handleCancelCreateProject}
          onProjectCreated={handleProjectCreated}
        />
      );
    }

    if (currentPage === 'edit-project' && selectedProjectId) {
      return (
        <EditProjectPage
          projectId={selectedProjectId}
          onCancel={handleCancelEditProject}
          onProjectUpdated={handleProjectUpdated}
        />
      );
    }

    switch (currentPage) {
      case 'portfolio':
        return (
          <>
            {/* Trial Status Banner */}
            <TrialStatusBanner
              onUpgradeClick={() => setShowUpgradeModal(true)}
              onAddPaymentMethod={() => setCurrentPage('settings')}
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
            />
          </>
        );
      case 'project-dashboard':
        return selectedProjectId ? (
          <ProjectDashboard
            projectId={selectedProjectId}
            onBack={handleBackToPortfolio}
            onGenerateReport={handleGenerateReport}
            onEditProject={handleEditProject}
            onMarkAsCompleted={() => handleMarkAsCompleted(selectedProjectId)}
            onReactivateProject={() => handleReactivateProject(selectedProjectId)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project</p>
          </div>
        );
      case 'project-funding':
        return selectedProjectId ? (
          <ProjectFundingPage
            projectId={selectedProjectId}
            projectName={projects.find((p) => p.id === selectedProjectId)?.name || 'Project'}
            projectCurrency={projects.find((p) => p.id === selectedProjectId)?.currency || 'NGN'}
            onBack={handleBackToPortfolio}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project to manage funding</p>
          </div>
        );
      case 'expense-management':
        return selectedProjectId ? (
          <ExpenseManagementPage
            projectId={selectedProjectId}
            projectName={projects.find((p) => p.id === selectedProjectId)?.name || 'Project'}
            projectCurrency={projects.find((p) => p.id === selectedProjectId)?.currency || 'NGN'}
            onBack={handleBackToPortfolio}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project to manage expenses</p>
          </div>
        );
      case 'budgets':
        return selectedProjectId ? (
          <BudgetManagementPage projectId={selectedProjectId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project to view its budget</p>
          </div>
        );
      case 'purchase-orders':
        return selectedProjectId ? (
          <PurchaseOrdersPage projectId={selectedProjectId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project to view purchase orders</p>
          </div>
        );
      case 'reports':
        return selectedProjectId ? (
          <ReportsPage projectId={selectedProjectId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project to view reports</p>
          </div>
        );
      case 'forecasts':
        return selectedProjectId ? (
          <ForecastsPage projectId={selectedProjectId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a project to view forecasts</p>
          </div>
        );
      case 'settings':
        return <DeveloperSettings user={user} />;
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
          />
        );
    }
  };

  // Hide sidebar and header for create-project view
  if (currentPage === 'create-project') {
    return renderPage();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <PlatformLogo
                showText={false}
                iconClassName={hasCustomLogo ? "h-8 w-auto max-w-[200px] object-contain" : "h-6 w-6 text-orange-600 mr-2"}
                onLogoLoad={(hasLogo) => setHasCustomLogo(hasLogo)}
              />
              {!hasCustomLogo && (
                <h1 className="text-xl font-semibold text-gray-900">Contrezz Developer</h1>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user?.company && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {user.company}
                </Badge>
              )}

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-orange-600 text-white text-sm font-medium">
                        {getInitials(user?.name || 'Developer')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900">{user?.name || 'Developer'}</div>
                      <div className="text-xs text-gray-500">Property Developer</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium">{user?.name || 'Developer'}</p>
                      <p className="text-xs text-gray-500 font-normal">{user?.email || 'developer@contrezz.com'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => setCurrentPage('settings')}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <CreditCard className="w-4 h-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Users className="w-4 h-4" />
                    <span>Team</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <HelpCircle className="w-4 h-4" />
                    <span>Help & Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={onLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r min-h-screen p-6 sticky top-16 self-start">
          <div className="mb-6">
            <h2 className="text-gray-900 px-3 mb-1 font-semibold">
              Developer Cost & Reporting
            </h2>
            <p className="text-sm text-gray-600 px-3">Property Management</p>
            {selectedProjectId && (
              <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 mb-1">Current Project</p>
                <p className="text-sm font-medium text-blue-900">
                  {getProjectName(selectedProjectId)}
                </p>
              </div>
            )}
          </div>

          <nav className="space-y-1">
            {/* Main Menu Items */}
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Project-Specific Menu Items (only show when project is selected) */}
            {selectedProjectId && (
              <>
                <div className="pt-4 pb-2">
                  <p className="text-xs text-gray-500 px-3">PROJECT MENU</p>
                </div>
                {projectMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </>
            )}
          </nav>

          {/* Pinned Projects (only show when no project is selected) */}
          {!selectedProjectId && (
            <div className="mt-8">
              <p className="text-xs text-gray-500 px-3 mb-2">PINNED PROJECTS</p>
              <div className="space-y-1">
                {projects.slice(0, 2).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">{project.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-900 mb-1 font-medium">Need Help?</p>
            <p className="text-xs text-gray-600 mb-3">
              Check our documentation and support resources
            </p>
            <button className="text-sm text-blue-600 hover:underline">
              View Documentation
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8">{renderPage()}</main>
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
    </div>
  );
};

export default DeveloperDashboardRefactored;

