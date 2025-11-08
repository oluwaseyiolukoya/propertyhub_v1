import React, { useEffect } from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface PublicLayoutProps {
  children: React.ReactNode;
  currentPage?: 'home' | 'about' | 'careers' | 'blog' | 'contact' | 'schedule-demo' | 'api-docs' | 'integrations' | 'help-center' | 'community' | 'status' | 'security';
  onNavigateToHome?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToGetStarted?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToCareers?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToScheduleDemo?: () => void;
  onNavigateToAPIDocumentation?: () => void;
  onNavigateToIntegrations?: () => void;
  onNavigateToHelpCenter?: () => void;
  onNavigateToCommunity?: () => void;
  onNavigateToStatus?: () => void;
  onNavigateToSecurity?: () => void;
}

export function PublicLayout({
  children,
  currentPage,
  onNavigateToHome,
  onNavigateToLogin,
  onNavigateToGetStarted,
  onNavigateToAbout,
  onNavigateToCareers,
  onNavigateToBlog,
  onNavigateToContact,
  onNavigateToScheduleDemo,
  onNavigateToAPIDocumentation,
  onNavigateToIntegrations,
  onNavigateToHelpCenter,
  onNavigateToCommunity,
  onNavigateToStatus,
  onNavigateToSecurity
}: PublicLayoutProps) {
  // Scroll to top whenever the page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <PublicHeader
        currentPage={currentPage}
        onNavigateToHome={onNavigateToHome}
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToGetStarted={onNavigateToGetStarted}
        onNavigateToAbout={onNavigateToAbout}
        onNavigateToCareers={onNavigateToCareers}
        onNavigateToBlog={onNavigateToBlog}
        onNavigateToContact={onNavigateToContact}
      />

      <main className="flex-1">
        {children}
      </main>

      <PublicFooter
        onNavigateToHome={onNavigateToHome}
        onNavigateToAbout={onNavigateToAbout}
        onNavigateToCareers={onNavigateToCareers}
        onNavigateToBlog={onNavigateToBlog}
        onNavigateToContact={onNavigateToContact}
        onNavigateToAPIDocumentation={onNavigateToAPIDocumentation}
        onNavigateToIntegrations={onNavigateToIntegrations}
        onNavigateToHelpCenter={onNavigateToHelpCenter}
        onNavigateToCommunity={onNavigateToCommunity}
        onNavigateToStatus={onNavigateToStatus}
        onNavigateToSecurity={onNavigateToSecurity}
      />
    </div>
  );
}

