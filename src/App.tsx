import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { PropertyOwnerDashboard } from './components/PropertyOwnerDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { PropertyManagerDashboard } from './components/PropertyManagerDashboard';
import TenantDashboard from './components/TenantDashboard';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { getUserData, getUserType, removeAuthToken, verifyToken } from './lib/api';
import { setupActiveSessionValidation } from './lib/sessionValidator';
import { getAccountInfo } from './lib/api/auth';
import { sessionManager } from './lib/sessionManager';
import { initializeSocket } from './lib/socket';
import {
  getManagers as apiGetManagers,
  createManager as apiCreateManager,
  assignManagerToProperty as apiAssignManagerToProperty,
  removeManagerFromProperty as apiRemoveManagerFromProperty,
  updateManager as apiUpdateManager,
  deactivateManager as apiDeactivateManager,
} from './lib/api/property-managers';

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userType, setUserType] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Managers and assignments loaded from backend
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
          // Hydrate latest user info and correct userType from backend if needed
          try {
            const acct = await getAccountInfo();
            const refreshedUser = acct.data?.user ? { ...storedUser, ...acct.data.user } : storedUser;
            setCurrentUser(refreshedUser);
            // Prefer backend-provided userType, then fall back to derived
            const backendUserType = (acct.data?.user as any)?.userType;
            const derivedType = deriveUserTypeFromUser(refreshedUser);
            const finalType = backendUserType || derivedType || storedUserType || '';
            setUserType(finalType);
            // Load managers if owner
            if (finalType === 'owner' || finalType === 'property-owner') {
              await loadManagers();
            }
          } catch {
            setCurrentUser(storedUser);
            const derivedType = deriveUserTypeFromUser(storedUser);
            setUserType(derivedType || storedUserType);
          }
        } else {
          // Token invalid, clear auth
          removeAuthToken();
        }
      }
      setIsAuthChecking(false);
    };

    checkAuth();
  }, []);

  // Ensure socket is connected for all authenticated users (tenant, owner, manager, admin)
  useEffect(() => {
    if (!currentUser) return;
    const token = (await import('./lib/safeStorage')).safeStorage.getItem('auth_token');
    if (token) {
      try { initializeSocket(token); } catch {}
    }
  }, [currentUser]);

  // Handle Paystack redirect: ?payment_ref=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentRef = params.get('payment_ref');
    if (!paymentRef || !currentUser) return;
    // Query backend for status and notify
    const fetchStatus = async () => {
      try {
        // Always verify with Paystack via backend to ensure accurate status
        const verifyResp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/verify/${encodeURIComponent(paymentRef)}`, {
          headers: { Authorization: `Bearer ${(await import('./lib/safeStorage')).safeStorage.getItem('auth_token') || ''}` },
          cache: 'no-store',
        });
        if (verifyResp.ok) {
          const v = await verifyResp.json();
          if (v?.status === 'success') toast.success('Payment successful', { description: `Ref ${paymentRef}` });
          else if (v?.status === 'failed') toast.error('Payment failed', { description: `Ref ${paymentRef}` });
          else toast.info(`Payment ${v?.status || 'pending'}`, { description: `Ref ${paymentRef}` });
          // Broadcast browser event so pages can refresh immediately
          window.dispatchEvent(new CustomEvent('payment:updated', { detail: { reference: paymentRef, status: v?.status } }));
        } else {
          // Fallback to local record if verification failed
          const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/by-reference/${encodeURIComponent(paymentRef)}`, {
          headers: { Authorization: `Bearer ${(await import('./lib/safeStorage')).safeStorage.getItem('auth_token') || ''}` },
          cache: 'no-store',
        });
          const data = await resp.json();
          if (resp.ok && data?.status) {
          if (data.status === 'success') {
            toast.success('Payment successful', { description: `Ref ${paymentRef}` });
          } else if (data.status === 'failed') {
            toast.error('Payment failed', { description: `Ref ${paymentRef}` });
          } else {
            toast.info(`Payment ${data.status}`, { description: `Ref ${paymentRef}` });
          }
          } else {
            toast.error(data?.error || 'Unable to verify payment');
          }
        }
      } catch (e: any) {
        toast.error('Unable to verify payment');
      } finally {
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete('payment_ref');
        window.history.replaceState({}, document.title, url.toString());
      }
    };
    fetchStatus();
  }, [currentUser]);

  // Initialize session manager
  useEffect(() => {
    // Session manager is automatically initialized
    // Sessions will persist across page refreshes using localStorage
    console.log('🔐 Session manager initialized - sessions will persist across page refreshes');
  }, []);

  // Listen for permissions update and account blocked events
  useEffect(() => {
    const handlePermissionsUpdated = (event: any) => {
      const message = event.detail?.message || 'Your permissions have been updated. Please log in again.';
      toast.warning(message, {
        duration: 5000,
        description: 'You will be redirected to the login page shortly.',
      });
    };
    const handleAccountBlocked = (event: any) => {
      const message = event.detail?.message || 'Your account has been deactivated.';
      toast.error(message, {
        duration: 4000,
      });
      // Force logout immediately
      sessionManager.clearSessionManually();
      setCurrentUser(null);
      setUserType('');
    };

    window.addEventListener('permissionsUpdated', handlePermissionsUpdated);
    window.addEventListener('accountBlocked', handleAccountBlocked);

    return () => {
      window.removeEventListener('permissionsUpdated', handlePermissionsUpdated);
      window.removeEventListener('accountBlocked', handleAccountBlocked);
    };
  }, []);

  const handleLogin = (type: string, userData: any) => {
    console.log('🔐 Login - Initial Type:', type);
    console.log('👤 User Data:', userData);
    console.log('📋 User Role:', userData?.role);
    console.log('🏢 Customer ID:', userData?.customerId);
    console.log('🎯 UserType from backend:', userData?.userType);

    setCurrentUser(userData);
    const derivedType = deriveUserTypeFromUser(userData);
    const finalType = userData?.userType || derivedType || type;

    console.log('🔍 Derived Type:', derivedType);
    console.log('✅ Final UserType:', finalType);

    setUserType(finalType);
  };

  const handleLogout = () => {
    sessionManager.clearSessionManually();
    setCurrentUser(null);
    setUserType('');
  };

  const handleBackToHome = () => {
    // Navigate to landing page
    setCurrentUser(null);
    setUserType('');
  };

  // Global active-session validation on any user interaction
  useEffect(() => {
    if (!currentUser) return;
    const cleanup = setupActiveSessionValidation((reason) => {
      toast.error(reason || 'Your account has been deactivated');
      sessionManager.clearSessionManually();
      setCurrentUser(null);
      setUserType('');
    });
    return cleanup;
  }, [currentUser]);

  // Helpers to map assignments from API managers into a flat list the UI can use
  const rebuildAssignmentsFromManagers = (mgrs: any[]) => {
    const flat = [] as any[];
    for (const m of mgrs) {
      const assignments = Array.isArray(m.property_managers) ? m.property_managers : [];
      for (const a of assignments) {
        flat.push({
          id: a.id || `${m.id}-${a.properties?.id}`,
          managerId: m.id,
          propertyId: a.properties?.id,
          ownerId: undefined, // not provided by API; UI should not rely on this
          isActive: a.isActive !== false,
          assignedAt: a.assignedAt,
        });
      }
    }
    setPropertyAssignments(flat);
  };

  // Load managers from backend
  const loadManagers = async () => {
    try {
      console.log('🔄 Loading managers...');
      const res = await apiGetManagers();
      console.log('📦 Managers response:', res);
      if (res.data) {
        console.log(`✅ Loaded ${res.data.length} managers`);
        setManagers(res.data);
        rebuildAssignmentsFromManagers(res.data);
      } else if (res.error) {
        console.error('❌ Error loading managers:', res.error);
      }
    } catch (error) {
      console.error('❌ Exception loading managers:', error);
    }
  };

  // Manager management functions (now backed by API)
  const addManager = async (managerData: any) => {
    const res = await apiCreateManager(managerData);
    if (res.error) throw new Error(res.error.error || 'Failed to create manager');
    const created = res.data as any;
    // Preserve credentials shape expected by child component
    const username = managerData.credentials?.username || (managerData.email?.split('@')[0] || 'user');
    const tempPassword = managerData.credentials?.tempPassword || (created as any).tempPassword;
    const managerWithCreds = { ...created, credentials: { username, tempPassword } };
    await loadManagers();
    return managerWithCreds;
  };

  const assignManager = async (managerId: string, propertyId: string, permissions?: any) => {
    const res = await apiAssignManagerToProperty(managerId, propertyId, permissions);
    if (res.error) throw new Error(res.error.error || 'Failed to assign manager');
    await loadManagers();
  };

  const removeManager = async (managerId: string, propertyId: string) => {
    const res = await apiRemoveManagerFromProperty(managerId, propertyId);
    if (res.error) throw new Error(res.error.error || 'Failed to remove manager');
    await loadManagers();
  };

  const updateManager = async (managerId: string, updates: any) => {
    const res = await apiUpdateManager(managerId, updates);
    if (res.error) throw new Error(res.error.error || 'Failed to update manager');
    await loadManagers();
  };

  const deactivateManager = async (managerId: string) => {
    const res = await apiDeactivateManager(managerId);
    if (res.error) throw new Error(res.error.error || 'Failed to deactivate manager');
    await loadManagers();
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
          onRefreshManagers={loadManagers}
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

// Helpers
function deriveUserTypeFromUser(user: any): string {
  if (!user) {
    console.log('⚠️ deriveUserTypeFromUser: No user provided');
    return '';
  }

  const role = (user.role || '').toString().toLowerCase();
  const isInternal = !user.customerId; // internal users have no customerId

  console.log('🔍 deriveUserTypeFromUser:');
  console.log('   - Original role:', user.role);
  console.log('   - Normalized role:', role);
  console.log('   - customerId:', user.customerId);
  console.log('   - isInternal:', isInternal);

  if (isInternal) {
    console.log('   → Internal user detected');
    if (role === 'super_admin' || role === 'super admin' || role === 'superadmin') return 'super-admin';
    if (role === 'admin') return 'admin';
    if (role === 'billing' || role === 'support' || role === 'analyst') return 'admin'; // internal dashboards
    return 'admin';
  }

  console.log('   → Customer user (has customerId)');

  if (role === 'owner' || role === 'property owner') {
    console.log('   → Matched: owner');
    return 'owner';
  }
  if (role === 'manager' || role === 'property manager') {
    console.log('   → Matched: property-manager');
    return 'property-manager';
  }
  if (role === 'tenant') {
    console.log('   → Matched: tenant');
    return 'tenant';
  }

  console.log('   → No match! Returning empty string');
  return '';
}

