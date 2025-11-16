import React, { useState } from 'react';
import PortfolioOverview from '../components/PortfolioOverview';
import ProjectDashboard from '../components/ProjectDashboard';
import { toast } from 'sonner';

type ViewMode = 'portfolio' | 'project';

interface DeveloperDashboardPageProps {
  user?: any;
}

export const DeveloperDashboardPage: React.FC<DeveloperDashboardPageProps> = ({ user }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('portfolio');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setViewMode('project');
  };

  const handleBackToPortfolio = () => {
    setViewMode('portfolio');
    setSelectedProjectId(null);
  };

  const handleCreateProject = () => {
    toast.info('Create project feature coming soon!');
    // TODO: Implement create project modal/form
  };

  const handleGenerateReport = () => {
    toast.info('Report generation feature coming soon!');
    // TODO: Implement report generation
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-w-0">
        {viewMode === 'portfolio' ? (
          <PortfolioOverview
            onViewProject={handleViewProject}
            onCreateProject={handleCreateProject}
          />
        ) : (
          selectedProjectId && (
            <ProjectDashboard
              projectId={selectedProjectId}
              onBack={handleBackToPortfolio}
              onGenerateReport={handleGenerateReport}
            />
          )
        )}
      </div>
    </div>
  );
};

export default DeveloperDashboardPage;

