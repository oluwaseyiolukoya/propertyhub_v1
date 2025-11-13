import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Receipt,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { PlatformLogo } from '../../../components/PlatformLogo';
import PortfolioOverview from './PortfolioOverview';
import AllProjectsPage from './AllProjectsPage';
import ProjectDashboard from './ProjectDashboard';
import CreateProjectPage from './CreateProjectPage';
import InvoicesPage from './InvoicesPage';
import { toast } from 'sonner';

interface DeveloperDashboardProps {
  user?: any;
  onLogout: () => void;
}

type ViewMode = 'portfolio' | 'projects' | 'project' | 'create-project' | 'vendors' | 'invoices' | 'analytics' | 'settings';

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('portfolio');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);

  // Reset to portfolio view on mount
  useEffect(() => {
    setCurrentView('portfolio');
  }, []);

  const navigation = [
    { id: 'portfolio', name: 'Portfolio Overview', icon: LayoutDashboard },
    { id: 'projects', name: 'Projects', icon: Building2 },
    { id: 'invoices', name: 'Invoices', icon: Receipt },
    { id: 'vendors', name: 'Vendors', icon: Users },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project');
  };

  const handleBackToPortfolio = () => {
    setCurrentView('portfolio');
    setSelectedProjectId(null);
  };

  const handleCreateProject = () => {
    setCurrentView('create-project');
    setSidebarOpen(false);
  };

  const handleCancelCreateProject = () => {
    setCurrentView('portfolio');
    setSelectedProjectId(null);
  };

  const handleProjectCreated = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project');
    toast.success('Project created successfully!');
  };

  const handleGenerateReport = () => {
    toast.info('Report generation feature coming soon!');
    // TODO: Implement report generation
  };

  const handleNavigationClick = (viewId: string) => {
    if (viewId === 'portfolio') {
      setCurrentView('portfolio');
      setSelectedProjectId(null);
    } else if (viewId === 'projects') {
      setCurrentView('projects');
      setSelectedProjectId(null);
    } else if (viewId === 'invoices') {
      setCurrentView('invoices');
      setSelectedProjectId(null);
    } else {
      toast.info(`${viewId.charAt(0).toUpperCase() + viewId.slice(1)} page coming soon!`);
    }
    setSidebarOpen(false);
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

  const renderContent = () => {
    if (currentView === 'create-project') {
      return (
        <CreateProjectPage
          onCancel={handleCancelCreateProject}
          onProjectCreated={handleProjectCreated}
        />
      );
    }

    if (currentView === 'project' && selectedProjectId) {
      return (
        <ProjectDashboard
          projectId={selectedProjectId}
          onBack={handleBackToPortfolio}
          onGenerateReport={handleGenerateReport}
        />
      );
    }

    if (currentView === 'projects') {
      return (
        <AllProjectsPage
          onViewProject={handleViewProject}
          onCreateProject={handleCreateProject}
        />
      );
    }

    if (currentView === 'invoices') {
      return (
        <InvoicesPage
          onViewProject={handleViewProject}
        />
      );
    }

    if (currentView === 'portfolio') {
      return (
        <PortfolioOverview
          onViewProject={handleViewProject}
          onCreateProject={handleCreateProject}
        />
      );
    }

    // Placeholder for other views
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {navigation.find((n) => n.id === currentView)?.name}
          </h2>
          <p className="text-gray-600">This feature is coming soon!</p>
        </div>
      </div>
    );
  };

  // Hide header and sidebar for create-project view
  if (currentView === 'create-project') {
    return renderContent();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Logo and Menu Toggle */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <PlatformLogo
                showText={false}
                iconClassName={hasCustomLogo ? "h-8 w-auto max-w-[200px] object-contain" : "h-6 w-6 text-orange-600 mr-2"}
                onLogoLoad={(hasLogo) => setHasCustomLogo(hasLogo)}
              />
              {!hasCustomLogo && (
                <span className="text-xl font-bold text-gray-900">Contrezz Developer</span>
              )}
            </div>
          </div>

          {/* Right: User Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Property Developer'}</p>
              <p className="text-xs text-gray-500">{user?.email || ''}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-orange-600 text-white">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex pt-16">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg lg:shadow-none border-r transition-transform duration-200 ease-in-out mt-16 lg:mt-0`}
        >
          <nav className="mt-5 px-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  (item.id === 'portfolio' && currentView === 'portfolio') ||
                  (item.id === 'projects' && (currentView === 'projects' || currentView === 'project')) ||
                  (item.id === 'invoices' && currentView === 'invoices');
                return (
                  <li key={item.id}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="w-full justify-start text-sm md:text-base"
                      onClick={() => handleNavigationClick(item.id)}
                    >
                      <Icon className="mr-3 h-4 w-4 md:h-5 md:w-5" />
                      {item.name}
                    </Button>
                  </li>
                );
              })}

              {/* Logout Button */}
              <li className="pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm md:text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 p-4 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default DeveloperDashboard;

