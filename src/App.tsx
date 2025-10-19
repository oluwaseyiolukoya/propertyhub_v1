import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { PropertyOwnerDashboard } from './components/PropertyOwnerDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { PropertyManagerDashboard } from './components/PropertyManagerDashboard';
import TenantDashboard from './components/TenantDashboard';
import { Toaster, toast } from './components/ui/sonner';
import { getUserData, getUserType, removeAuthToken, verifyToken } from './lib/api';

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userType, setUserType] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Mock managers and property assignments
  const [managers, setManagers] = useState<any[]>([]);
  const [propertyAssignments, setPropertyAssignments] = useState<any[]>([]);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = getUserData();
      const storedUserType = getUserType();

      if (storedUser && storedUserType) {
        // Verify token is still valid
        const response = await verifyToken();
        if (response.data && response.data.valid) {
          setCurrentUser(storedUser);
          setUserType(storedUserType);
        } else {
          // Token invalid, clear auth
          removeAuthToken();
        }
      }
      setIsAuthChecking(false);
    };

    checkAuth();
  }, []);

  // Listen for permissions update events
  useEffect(() => {
    const handlePermissionsUpdated = (event: any) => {
      const message = event.detail?.message || 'Your permissions have been updated. Please log in again.';
      toast.warning(message, {
        duration: 5000,
        description: 'You will be redirected to the login page shortly.',
      });
    };

    window.addEventListener('permissionsUpdated', handlePermissionsUpdated);

    return () => {
      window.removeEventListener('permissionsUpdated', handlePermissionsUpdated);
    };
  }, []);

  const handleLogin = (type: string, userData: any) => {
    console.log('Login - User Type:', type, 'User Data:', userData);
    setCurrentUser(userData);
    setUserType(type);
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    setUserType('');
  };

  const handleBackToHome = () => {
    // Navigate to landing page
    setCurrentUser(null);
    setUserType('');
  };

  // Manager management functions
  const addManager = (managerData: any, ownerId: string) => {
    const newManager = {
      id: `MGR${String(managers.length + 1).padStart(3, '0')}`,
      ...managerData,
      createdBy: ownerId,
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    setManagers(prev => [...prev, newManager]);
    return newManager;
  };

  const assignManager = (managerId: string, propertyId: string, ownerId: string) => {
    const newAssignment = {
      id: `ASSIGN${Date.now()}`,
      managerId,
      propertyId,
      ownerId,
      assignedAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    setPropertyAssignments(prev => [...prev, newAssignment]);
  };

  const removeManager = (managerId: string, propertyId: string, ownerId: string) => {
    setPropertyAssignments(prev =>
      prev.map(assignment =>
        assignment.managerId === managerId &&
        assignment.propertyId === propertyId &&
        assignment.ownerId === ownerId
          ? { ...assignment, isActive: false }
          : assignment
      )
    );
  };

  const updateManager = (managerId: string, updates: any) => {
    setManagers(prev =>
      prev.map(manager =>
        manager.id === managerId ? { ...manager, ...updates } : manager
      )
    );
  };

  const deactivateManager = (managerId: string) => {
    updateManager(managerId, { isActive: false });
  };

  // Debug: Log current state
  console.log('Current State - UserType:', userType, 'CurrentUser:', currentUser);

  // Show loading while checking auth
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if no user
  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={handleLogin} onBackToHome={handleBackToHome} />
        <Toaster />
      </>
    );
  }

  // Show Owner Dashboard if property owner
  if (userType === 'owner' || userType === 'property-owner') {
    return (
      <>
        <PropertyOwnerDashboard
          user={currentUser}
          onLogout={handleLogout}
          managers={managers}
          propertyAssignments={propertyAssignments}
          onAddManager={addManager}
          onAssignManager={assignManager}
          onRemoveManager={removeManager}
          onUpdateManager={updateManager}
          onDeactivateManager={deactivateManager}
        />
        <Toaster />
      </>
    );
  }

  // Show Super Admin Dashboard if super admin
  if (userType === 'admin' || userType === 'super-admin') {
    return (
      <>
        <SuperAdminDashboard
          user={currentUser}
          onLogout={handleLogout}
        />
        <Toaster />
      </>
    );
  }

  // Show Property Manager Dashboard if property manager
  if (userType === 'manager' || userType === 'property-manager') {
    return (
      <>
        <PropertyManagerDashboard
          user={currentUser}
          onLogout={handleLogout}
          propertyAssignments={propertyAssignments}
        />
        <Toaster />
      </>
    );
  }

  // Show Tenant Dashboard if tenant
  if (userType === 'tenant') {
    return (
      <>
        <TenantDashboard />
        <Toaster />
      </>
    );
  }

  // For other user types, show coming soon
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Dashboard for {currentUser.role}
          </h1>
          <p className="text-gray-600 mb-4">Coming soon!</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Logout
          </button>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export default App;

