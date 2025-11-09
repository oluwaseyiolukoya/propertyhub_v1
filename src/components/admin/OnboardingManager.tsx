import React, { useState } from 'react';
import { OnboardingDashboard } from './OnboardingDashboard';
import { ApplicationDetail } from './ApplicationDetail';
import { OnboardingApplication } from '../../lib/api/admin-onboarding';

export function OnboardingManager() {
  const [selectedApplication, setSelectedApplication] = useState<OnboardingApplication | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleViewApplication = (application: OnboardingApplication) => {
    setSelectedApplication(application);
  };

  const handleBack = () => {
    setSelectedApplication(null);
    setRefreshTrigger(prev => prev + 1); // Trigger refresh when going back
  };

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1); // Trigger refresh after any update
  };

  if (selectedApplication) {
    return (
      <ApplicationDetail
        applicationId={selectedApplication.id}
        onBack={handleBack}
        onUpdate={handleUpdate}
      />
    );
  }

  return (
    <OnboardingDashboard
      key={refreshTrigger}
      onViewApplication={handleViewApplication}
    />
  );
}

