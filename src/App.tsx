import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { GetStartedPage } from './components/GetStartedPage';
import { AccountUnderReviewPage } from './components/AccountUnderReviewPage';
import { ApplicationStatusPage } from './components/ApplicationStatusPage';
import { APIDocumentation } from './components/APIDocumentation';
import { IntegrationsPage } from './components/IntegrationsPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { ScheduleDemoPage } from './components/ScheduleDemoPage';
import { BlogPage } from './components/BlogPage';
import { CareersPage } from './components/CareersPage';
import { HelpCenterPage } from './components/HelpCenterPage';
import { CommunityPage } from './components/CommunityPage';
import { NewDiscussionPage } from './components/NewDiscussionPage';
import { StatusPage } from './components/StatusPage';
import { SecurityPage } from './components/SecurityPage';
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
import { safeStorage } from './lib/safeStorage';
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
  const [showLanding, setShowLanding] = useState(true);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [showAccountReview, setShowAccountReview] = useState(false);
  const [showApplicationStatus, setShowApplicationStatus] = useState(false);
  const [showAPIDocumentation, setShowAPIDocumentation] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showScheduleDemo, setShowScheduleDemo] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [showCareers, setShowCareers] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [signupData, setSignupData] = useState<{ role: string; email: string; name: string } | null>(null);

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
    const token = safeStorage.getItem('auth_token');
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
          headers: { Authorization: `Bearer ${safeStorage.getItem('auth_token') || ''}` },
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
          headers: { Authorization: `Bearer ${safeStorage.getItem('auth_token') || ''}` },
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentUser(null);
    setUserType('');
    setShowLanding(true);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowApplicationStatus(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
    setSignupData(null);
  };

  const handleNavigateToLogin = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToGetStarted = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(true);
    setShowAccountReview(false);
    setShowApplicationStatus(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToApplicationStatus = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowApplicationStatus(true);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToAPIDocumentation = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowApplicationStatus(false);
    setShowAPIDocumentation(true);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToIntegrations = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(true);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToAbout = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(true);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToContact = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(true);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToScheduleDemo = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(true);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToBlog = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(true);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToCareers = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(true);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToHelpCenter = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(true);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToCommunity = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(true);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToNewDiscussion = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(true);
    setShowStatus(false);
    setShowSecurity(false);
  };

  const handleNavigateToStatus = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowStatus(true);
    setShowSecurity(false);
  };

  const handleNavigateToSecurity = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(false);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowStatus(false);
    setShowSecurity(true);
  };

  const handleSignupComplete = (role: string, email: string, name: string) => {
    setSignupData({ role, email, name });
    setShowLanding(false);
    setShowGetStarted(false);
    setShowAccountReview(true);
    setShowAPIDocumentation(false);
    setShowIntegrations(false);
    setShowAbout(false);
    setShowContact(false);
    setShowScheduleDemo(false);
    setShowBlog(false);
    setShowCareers(false);
    setShowHelpCenter(false);
    setShowCommunity(false);
    setShowNewDiscussion(false);
    setShowStatus(false);
    setShowSecurity(false);
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

  // Show API Documentation if requested
  if (!currentUser && showAPIDocumentation) {
    return (
      <>
        <APIDocumentation
          onBackToHome={handleBackToHome}
          onNavigateToStatus={handleNavigateToStatus}
        />
        <Toaster />
      </>
    );
  }

  // Show Integrations page if requested
  if (!currentUser && showIntegrations) {
    return (
      <>
        <IntegrationsPage
          onBackToHome={handleBackToHome}
          onNavigateToHelpCenter={handleNavigateToHelpCenter}
          onNavigateToCommunity={handleNavigateToCommunity}
          onNavigateToStatus={handleNavigateToStatus}
          onNavigateToSecurity={handleNavigateToSecurity}
        />
        <Toaster />
      </>
    );
  }

  // Show About page if requested
  if (!currentUser && showAbout) {
    return (
      <>
        <AboutPage
          onBackToHome={handleBackToHome}
          onNavigateToContact={handleNavigateToContact}
          onNavigateToScheduleDemo={handleNavigateToScheduleDemo}
          onNavigateToCareers={handleNavigateToCareers}
        />
        <Toaster />
      </>
    );
  }

  // Show Contact page if requested
  if (!currentUser && showContact) {
    return (
      <>
        <ContactPage
          onBackToHome={handleBackToHome}
          onNavigateToLogin={handleNavigateToLogin}
          onNavigateToGetStarted={handleNavigateToGetStarted}
          onNavigateToAbout={handleNavigateToAbout}
          onNavigateToBlog={handleNavigateToBlog}
          onNavigateToContact={handleNavigateToContact}
          onNavigateToScheduleDemo={handleNavigateToScheduleDemo}
          onNavigateToAPIDocumentation={handleNavigateToAPIDocumentation}
          onNavigateToIntegrations={handleNavigateToIntegrations}
          onNavigateToCareers={handleNavigateToCareers}
          onNavigateToHelpCenter={handleNavigateToHelpCenter}
          onNavigateToCommunity={handleNavigateToCommunity}
          onNavigateToStatus={handleNavigateToStatus}
          onNavigateToSecurity={handleNavigateToSecurity}
        />
        <Toaster />
      </>
    );
  }

  // Show Schedule Demo page if requested
  if (!currentUser && showScheduleDemo) {
    return (
      <>
        <ScheduleDemoPage
          onBackToHome={handleBackToHome}
          onNavigateToContact={handleNavigateToContact}
          onNavigateToCareers={handleNavigateToCareers}
          onNavigateToHelpCenter={handleNavigateToHelpCenter}
          onNavigateToCommunity={handleNavigateToCommunity}
          onNavigateToStatus={handleNavigateToStatus}
          onNavigateToSecurity={handleNavigateToSecurity}
        />
        <Toaster />
      </>
    );
  }

  // Show Blog page if requested
  if (!currentUser && showBlog) {
    return (
      <>
        <BlogPage
          onBackToHome={handleBackToHome}
          onNavigateToCareers={handleNavigateToCareers}
          onNavigateToHelpCenter={handleNavigateToHelpCenter}
          onNavigateToCommunity={handleNavigateToCommunity}
          onNavigateToStatus={handleNavigateToStatus}
          onNavigateToSecurity={handleNavigateToSecurity}
        />
        <Toaster />
      </>
    );
  }

  // Show Careers page if requested
  if (!currentUser && showCareers) {
    return (
      <>
        <CareersPage
          onBackToHome={handleBackToHome}
          onNavigateToLogin={handleNavigateToLogin}
          onNavigateToGetStarted={handleNavigateToGetStarted}
          onNavigateToAbout={handleNavigateToAbout}
          onNavigateToBlog={handleNavigateToBlog}
          onNavigateToContact={handleNavigateToContact}
          onNavigateToScheduleDemo={handleNavigateToScheduleDemo}
          onNavigateToAPIDocumentation={handleNavigateToAPIDocumentation}
          onNavigateToIntegrations={handleNavigateToIntegrations}
          onNavigateToHelpCenter={handleNavigateToHelpCenter}
        />
        <Toaster />
      </>
    );
  }

  // Show Help Center page if requested
  if (!currentUser && showHelpCenter) {
    return (
      <>
        <HelpCenterPage
          onBackToHome={handleBackToHome}
          onNavigateToLogin={handleNavigateToLogin}
          onNavigateToGetStarted={handleNavigateToGetStarted}
          onNavigateToAbout={handleNavigateToAbout}
          onNavigateToBlog={handleNavigateToBlog}
          onNavigateToContact={handleNavigateToContact}
          onNavigateToScheduleDemo={handleNavigateToScheduleDemo}
          onNavigateToAPIDocumentation={handleNavigateToAPIDocumentation}
          onNavigateToIntegrations={handleNavigateToIntegrations}
          onNavigateToCareers={handleNavigateToCareers}
          onNavigateToHelpCenter={handleNavigateToHelpCenter}
          onNavigateToCommunity={handleNavigateToCommunity}
          onNavigateToStatus={handleNavigateToStatus}
          onNavigateToSecurity={handleNavigateToSecurity}
        />
        <Toaster />
      </>
    );
  }

  // Show Community page if requested
  if (!currentUser && showCommunity) {
    return (
      <>
        <CommunityPage
          onBackToHome={handleBackToHome}
          onNavigateToLogin={handleNavigateToLogin}
          onNavigateToGetStarted={handleNavigateToGetStarted}
          onNavigateToAbout={handleNavigateToAbout}
          onNavigateToBlog={handleNavigateToBlog}
          onNavigateToContact={handleNavigateToContact}
          onNavigateToScheduleDemo={handleNavigateToScheduleDemo}
          onNavigateToAPIDocumentation={handleNavigateToAPIDocumentation}
          onNavigateToIntegrations={handleNavigateToIntegrations}
          onNavigateToCareers={handleNavigateToCareers}
          onNavigateToHelpCenter={handleNavigateToHelpCenter}
          onNavigateToCommunity={handleNavigateToCommunity}
          onNavigateToStatus={handleNavigateToStatus}
          onNavigateToSecurity={handleNavigateToSecurity}
          onNavigateToNewDiscussion={handleNavigateToNewDiscussion}
        />
        <Toaster />
      </>
    );
  }

  // Show New Discussion page if requested
  if (!currentUser && showNewDiscussion) {
    return (
      <>
        <NewDiscussionPage
          onBackToCommunity={handleNavigateToCommunity}
          onNavigateToHome={handleBackToHome}
          onNavigateToLogin={handleNavigateToLogin}
          onNavigateToGetStarted={handleNavigateToGetStarted}
          onNavigateToAbout={handleNavigateToAbout}
          onNavigateToBlog={handleNavigateToBlog}
          onNavigateToContact={handleNavigateToContact}
          onNavigateToScheduleDemo={handleNavigateToScheduleDemo}
          onNavigateToAPIDocumentation={handleNavigateToAPIDocumentation}
          onNavigateToIntegrations={handleNavigateToIntegrations}
          onNavigateToCareers={handleNavigateToCareers}
          onNavigateToHelpCenter={handleNavigateToHelpCenter}
        />
        <Toaster />
      </>
    );
  }

  // Show Status page if requested
  if (!currentUser && showStatus) {
    return (
      <>
        <StatusPage
          onBackToHome={handleBackToHome}
          onNavigateToLogin={handleNavigateToLogin}
          onNavigateToGetStarted={handleNavigateToGetStarted}
          onNavigateToAbout={handleNavigateToAbout}
          onNavigateToBlog={handleNavigateToBlog}
          onNavigateToContact={handleNavigateToContact}
          onNavigateToScheduleDemo={handleNavigateToScheduleDemo}
          onNavigateToAPIDocumentation={handleNavigateToAPIDocumentation}
          onNavigateToIntegrations={handleNavigateToIntegrations}
          onNavigateToCareers={handleNavigateToCareers}
          onNavigateToHelpCenter={handleNavigateToHelpCenter}
          onNavigateToCommunity={handleNavigateToCommunity}
          onNavigateToStatus={handleNavigateToStatus}
          onNavigateToSecurity={handleNavigateToSecurity}
        />
        <Toaster />
      </>
    );
  }

  // Show Security page if requested
  if (!currentUser && showSecurity) {
    return (
      <>
        <SecurityPage
          onBackToHome={handleBackToHome}
          onNavigateToLogin={handleNavigateToLogin}
          onNavigateToGetStarted={handleNavigateToGetStarted}
          onNavigateToAbout={handleNavigateToAbout}
          onNavigateToBlog={handleNavigateToBlog}
          onNavigateToContact={handleNavigateToContact}
          onNavigateToScheduleDemo={handleNavigateToScheduleDemo}
          onNavigateToAPIDocumentation={handleNavigateToAPIDocumentation}
          onNavigateToIntegrations={handleNavigateToIntegrations}
          onNavigateToCareers={handleNavigateToCareers}
          onNavigateToHelpCenter={handleNavigateToHelpCenter}
          onNavigateToCommunity={handleNavigateToCommunity}
          onNavigateToStatus={handleNavigateToStatus}
          onNavigateToSecurity={handleNavigateToSecurity}
        />
        <Toaster />
      </>
    );
  }

  // Show landing page if no user and showLanding is true
  if (!currentUser && showLanding && !showGetStarted) {
    return (
      <>
        <LandingPage
          onNavigateToLogin={handleNavigateToLogin}
          onNavigateToGetStarted={handleNavigateToGetStarted}
          onNavigateToAPIDocumentation={handleNavigateToAPIDocumentation}
          onNavigateToIntegrations={handleNavigateToIntegrations}
          onNavigateToAbout={handleNavigateToAbout}
          onNavigateToContact={handleNavigateToContact}
          onNavigateToScheduleDemo={handleNavigateToScheduleDemo}
          onNavigateToBlog={handleNavigateToBlog}
          onNavigateToCareers={handleNavigateToCareers}
          onNavigateToHelpCenter={handleNavigateToHelpCenter}
          onNavigateToCommunity={handleNavigateToCommunity}
          onNavigateToStatus={handleNavigateToStatus}
          onNavigateToSecurity={handleNavigateToSecurity}
        />
        <Toaster />
      </>
    );
  }

  // Show account under review page if signup completed
  if (!currentUser && showAccountReview && signupData) {
    return (
      <>
        <AccountUnderReviewPage
          onBackToHome={handleBackToHome}
          userRole={signupData.role as 'property-owner' | 'property-manager' | 'tenant'}
          userEmail={signupData.email}
          userName={signupData.name}
        />
        <Toaster />
      </>
    );
  }

  // Show application status page if requested
  if (!currentUser && showApplicationStatus) {
    return (
      <>
        <ApplicationStatusPage
          onBackToHome={handleBackToHome}
        />
        <Toaster />
      </>
    );
  }

  // Show get started page if no user and showGetStarted is true
  if (!currentUser && showGetStarted) {
    return (
      <>
        <GetStartedPage
          onBackToHome={handleBackToHome}
          onNavigateToLogin={handleNavigateToLogin}
          onSignupComplete={handleSignupComplete}
        />
        <Toaster />
      </>
    );
  }

  // Show login if no user but landing is dismissed
  if (!currentUser && !showLanding && !showGetStarted && !showAccountReview && !showAPIDocumentation && !showIntegrations && !showAbout && !showContact && !showScheduleDemo && !showBlog && !showCareers && !showHelpCenter && !showCommunity && !showNewDiscussion && !showStatus && !showSecurity) {
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

