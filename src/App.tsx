import React, { useState, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import { GetStartedPage } from "./components/GetStartedPage";
import { AccountUnderReviewPage } from "./components/AccountUnderReviewPage";
import { ApplicationStatusPage } from "./components/ApplicationStatusPage";
import { APIDocumentation } from "./components/APIDocumentation";
import { IntegrationsPage } from "./components/IntegrationsPage";
import { AboutPage } from "./components/AboutPage";
import { ContactPage } from "./components/ContactPage";
import { ScheduleDemoPage } from "./components/ScheduleDemoPage";
import { BlogPage } from "./components/BlogPage";
import { CareersPage } from "./components/CareersPage";
import { HelpCenterPage } from "./components/HelpCenterPage";
import { CommunityPage } from "./components/CommunityPage";
import { NewDiscussionPage } from "./components/NewDiscussionPage";
import { StatusPage } from "./components/StatusPage";
import { SecurityPage } from "./components/SecurityPage";
import { LoginPage } from "./components/LoginPage";
import { PropertyOwnerDashboard } from "./components/PropertyOwnerDashboard";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { PropertyManagerDashboard } from "./components/PropertyManagerDashboard";
import TenantDashboard from "./components/TenantDashboard";
import { DeveloperDashboardRefactored } from "./modules/developer-dashboard";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import {
  getUserData,
  getUserType,
  removeAuthToken,
  verifyToken,
} from "./lib/api";
import {
  setupActiveSessionValidation,
  checkSessionValidity,
} from "./lib/sessionValidator";
import { getAccountInfo } from "./lib/api/auth";
import { sessionManager } from "./lib/sessionManager";
import { initializeSocket } from "./lib/socket";
import { safeStorage } from "./lib/safeStorage";
import {
  getManagers as apiGetManagers,
  createManager as apiCreateManager,
  assignManagerToProperty as apiAssignManagerToProperty,
  removeManagerFromProperty as apiRemoveManagerFromProperty,
  updateManager as apiUpdateManager,
  deactivateManager as apiDeactivateManager,
} from "./lib/api/property-managers";
import { usePlatformBranding } from "./hooks/usePlatformBranding";
import StorageTest from "./components/StorageTest";
import CheckAuth from "./components/CheckAuth";
import { verifyUpgrade } from "./lib/api/subscriptions";
import { KYCVerificationPage } from "./components/KYCVerificationPage";
import { PublicAdminLogin } from "./components/public-admin/PublicAdminLogin";
import { PublicAdminLayout } from "./components/public-admin/PublicAdminLayout";
import { isAdminAuthenticated } from "./lib/api/publicAdminApi";

function App() {
  // Load platform branding (logo and favicon)
  usePlatformBranding();

  // Detect domain for routing
  const hostname = window.location.hostname;
  const port = window.location.port;
  // Check for public landing page query parameter (for local dev)
  const urlParams = new URLSearchParams(window.location.search);
  const forcePublic = urlParams.get("public") === "true";

  // Detect if we're in local development
  const isLocalDev =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "contrezz.local" ||
    hostname === "app.contrezz.local";

  // Detect if we're on admin subdomain or admin path
  const currentPath = window.location.pathname;
  const isAdminDomain =
    hostname === "admin.contrezz.com" ||
    hostname === "admin.contrezz.local" ||
    (isLocalDev && currentPath.startsWith("/admin"));

  // Get base URLs based on environment
  const getAppUrl = () => {
    if (isLocalDev) {
      return `http://localhost:${port || "5173"}`;
    }
    return "https://app.contrezz.com";
  };

  const getPublicUrl = (path: string = "") => {
    if (isLocalDev) {
      // If using contrezz.local, use that; otherwise use localhost with ?public=true
      const baseUrl =
        hostname === "contrezz.local"
          ? `http://contrezz.local:${port || "5173"}`
          : `http://localhost:${port || "5173"}`;
      // Add query parameter only if not using contrezz.local
      const query = hostname === "contrezz.local" ? "" : "?public=true";
      return `${baseUrl}${path}${query}`;
    }
    return `https://contrezz.com${path}`;
  };

  const isAppDomain =
    !forcePublic &&
    (hostname === "app.contrezz.com" ||
      hostname === "app.contrezz.local" ||
      (hostname === "localhost" && !urlParams.get("public")));
  const isPublicDomain =
    forcePublic ||
    hostname === "contrezz.com" ||
    hostname === "www.contrezz.com" ||
    hostname === "contrezz.local";

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userType, setUserType] = useState<string>("");
  const [customerData, setCustomerData] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showLanding, setShowLanding] = useState(!isAppDomain); // Don't show landing on app domain

  // Public Admin State
  const [publicAdminAuthenticated, setPublicAdminAuthenticated] =
    useState(false);

  // Check if we're on admin path (for localhost access)
  const isOnAdminPath = isLocalDev && currentPath.startsWith("/admin");
  const shouldShowAdmin = isAdminDomain || isOnAdminPath;

  // Check public admin authentication on admin domain or path
  useEffect(() => {
    if (shouldShowAdmin) {
      setPublicAdminAuthenticated(isAdminAuthenticated());
    }
  }, [shouldShowAdmin]);

  // Listen for pathname changes (for client-side navigation)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const onAdminPath = isLocalDev && path.startsWith("/admin");
      if (onAdminPath && !publicAdminAuthenticated) {
        setPublicAdminAuthenticated(isAdminAuthenticated());
      }
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [isLocalDev, publicAdminAuthenticated]);

  // Redirect logic: if on wrong domain, redirect to correct one
  useEffect(() => {
    // Skip redirects during auth check
    if (isAuthChecking) return;

    // Skip redirects on admin domain or admin path
    if (isAdminDomain || isOnAdminPath) return;

    // If on app domain but trying to access public routes, redirect to public domain
    if (isAppDomain && !currentUser) {
      const publicRoutes = [
        "/careers",
        "/blog",
        "/about",
        "/contact",
        "/help",
        "/community",
        "/status",
        "/security",
      ];
      const currentPath = window.location.pathname;

      // Allow login and root on app domain
      if (currentPath === "/login" || currentPath === "/") {
        return; // Stay on app domain for login
      }

      // Redirect public routes to public domain
      if (publicRoutes.some((route) => currentPath.startsWith(route))) {
        window.location.href = getPublicUrl(currentPath);
        return;
      }
    }

    // If on public domain but authenticated, redirect to app domain for dashboard
    if (isPublicDomain && currentUser && userType) {
      const currentPath = window.location.pathname;
      // Only redirect if on landing/login pages
      if (currentPath === "/" || currentPath === "/login") {
        window.location.href = `${getAppUrl()}/`;
        return;
      }
    }
  }, [isAppDomain, isPublicDomain, currentUser, userType, isAuthChecking]);
  const [showKYCVerification, setShowKYCVerification] = useState(false);
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
  const [showStorageTest, setShowStorageTest] = useState(false);
  const [showCheckAuth, setShowCheckAuth] = useState(false);
  const [signupData, setSignupData] = useState<{
    role: string;
    email: string;
    name: string;
  } | null>(null);

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
          console.log("[App] ========== CHECKING AUTH ON MOUNT ==========");
          const acct = await getAccountInfo();
          console.log("[App] Account response on mount:", {
            hasError: !!acct.error,
            hasData: !!acct.data,
            error: acct.error,
          });

          // Check for KYC error in response
          if (acct.error?.kycRequired) {
            console.log(
              "[App] ✅ KYC required on mount (from error), showing verification page. Status:",
              acct.error.kycStatus
            );
            setCurrentUser(storedUser);
            const derivedType = deriveUserTypeFromUser(storedUser);
            setUserType(derivedType || storedUserType);
            setShowKYCVerification(true);
            setShowLanding(false);
            setIsAuthChecking(false);
            return;
          }

          const refreshedUser = acct.data?.user
            ? { ...storedUser, ...acct.data.user }
            : storedUser;
          const customer = acct.data?.customer;

          setCurrentUser(refreshedUser);
          setCustomerData(customer || null);

          // Prefer backend-provided userType, then fall back to derived
          const backendUserType = (acct.data?.user as any)?.userType;
          const derivedType = deriveUserTypeFromUser(refreshedUser);
          const finalType =
            backendUserType || derivedType || storedUserType || "";
          setUserType(finalType);

          console.log("[App] ========== CUSTOMER DATA ON MOUNT ==========");
          console.log("📦 Customer exists:", !!customer);
          console.log("📦 Customer ID:", customer?.id);
          console.log("📦 Customer KYC Status:", customer?.kycStatus);
          console.log("📦 Customer Requires KYC:", customer?.requiresKyc);
          console.log("📦 Final User Type:", finalType);
          console.log("[App] ================================================");

          // Check if KYC required and not completed
          // For tenants: KYC is at user level. For others: at customer level.
          const user = acct.data?.user;
          const isTenant =
            user?.role?.toLowerCase() === "tenant" || finalType === "tenant";

          // Valid completed statuses: 'verified' (auto) or 'manually_verified' (admin)
          let needsKyc = false;

          if (isTenant) {
            // Tenant KYC check - at user level
            // For tenants, owner_approved is also a valid completed KYC status
            needsKyc =
              user?.requiresKyc &&
              user?.kycStatus !== "verified" &&
              user?.kycStatus !== "manually_verified" &&
              user?.kycStatus !== "owner_approved";

            console.log("[App] Tenant KYC Check on mount:", {
              requiresKyc: user?.requiresKyc,
              kycStatus: user?.kycStatus,
              needsKyc: needsKyc,
            });
          } else {
            // Non-tenant KYC check - at customer level
            needsKyc =
              customer?.requiresKyc &&
              customer?.kycStatus !== "verified" &&
              customer?.kycStatus !== "manually_verified";

            console.log("[App] Customer KYC Check on mount:", {
              requiresKyc: customer?.requiresKyc,
              kycStatus: customer?.kycStatus,
              needsKyc: needsKyc,
            });
          }

          if (needsKyc) {
            const kycStatus = isTenant ? user?.kycStatus : customer?.kycStatus;
            console.log(
              "[App] ✅ KYC required on mount, showing verification page. Status:",
              kycStatus
            );
            setShowKYCVerification(true);
            setShowLanding(false);
            setIsAuthChecking(false);
            return;
          } else {
            console.log(
              "[App] ❌ KYC NOT required or already completed on mount, proceeding to dashboard"
            );
          }

          // Load managers if owner
          if (finalType === "owner" || finalType === "property-owner") {
            await loadManagers();
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

  // Check for special test routes
  useEffect(() => {
    if (window.location.pathname === "/storage-test") {
      setShowStorageTest(true);
    } else if (window.location.pathname === "/check-auth") {
      setShowCheckAuth(true);
    }
  }, []);

  // Helper function to detect and set page based on pathname
  const detectAndSetPageFromPathname = () => {
    if (isAuthChecking) return;

    const pathname = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const forcePublic = urlParams.get("public") === "true";

    // Only handle pathname detection on public domain or when forced
    if (!isPublicDomain && !forcePublic) return;

    // Reset all page states first
    setShowLanding(false);
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

    // Set the appropriate page based on pathname
    if (pathname === "/contact") {
      setShowContact(true);
    } else if (pathname === "/about") {
      setShowAbout(true);
    } else if (pathname === "/blog") {
      setShowBlog(true);
    } else if (pathname === "/careers") {
      setShowCareers(true);
    } else if (pathname === "/help" || pathname === "/help-center") {
      setShowHelpCenter(true);
    } else if (pathname === "/community") {
      setShowCommunity(true);
    } else if (pathname === "/status") {
      setShowStatus(true);
    } else if (pathname === "/security") {
      setShowSecurity(true);
    } else if (pathname === "/login") {
      // Login page is handled separately
    } else if (pathname === "/" || pathname === "") {
      // Show landing page for root
      setShowLanding(true);
    }
  };

  // Detect pathname changes and show appropriate page (for public routes)
  useEffect(() => {
    detectAndSetPageFromPathname();

    // Listen for popstate events (back/forward button)
    const handlePopState = () => {
      detectAndSetPageFromPathname();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isPublicDomain, isAuthChecking, hostname, forcePublic]);

  // Ensure socket is connected for all authenticated users (tenant, owner, manager, admin)
  useEffect(() => {
    if (!currentUser) return;
    const token = safeStorage.getItem("auth_token");
    if (token) {
      // Initialize socket asynchronously without blocking the app
      initializeSocket(token).catch((error) => {
        // Silently handle socket initialization errors - app works without WebSocket
        console.debug(
          "WebSocket initialization skipped:",
          error?.message || "Server unavailable"
        );
      });
    }
  }, [currentUser]);

  // Handle Paystack/Monicredit redirect: ?payment_ref=... or ?transId=...
  useEffect(() => {
    // Handle malformed URLs like: ?payment_ref=REF?transId=ACX...
    // URLSearchParams won't parse this correctly, so we need manual parsing
    const search = window.location.search;
    let paymentRef: string | null = null;
    let transId: string | null = null;

    // First, try normal URLSearchParams parsing
    const params = new URLSearchParams(search);
    paymentRef =
      params.get("transId") ||
      params.get("transid") ||
      params.get("payment_ref") ||
      params.get("reference");
    transId = params.get("transId") || params.get("transid");

    // If payment_ref contains a malformed query (e.g., "REF?transId=ACX...")
    // Extract both the reference and transId manually
    if (paymentRef && paymentRef.includes("?")) {
      const parts = paymentRef.split("?");
      paymentRef = parts[0]; // First part is the actual reference

      // Try to extract transId from the malformed part
      if (parts.length > 1) {
        const malformedPart = parts.slice(1).join("?"); // Rejoin in case there are multiple ?
        const malformedParams = new URLSearchParams("?" + malformedPart);
        transId =
          malformedParams.get("transId") ||
          malformedParams.get("transid") ||
          transId;
      }
    }

    // Also check if the entire search string has malformed format
    // Pattern: ?payment_ref=REF?transId=ACX...
    if (
      !paymentRef &&
      search.includes("payment_ref=") &&
      search.includes("?transId=")
    ) {
      const paymentRefMatch = search.match(/[?&]payment_ref=([^?&]+)/);
      const transIdMatch = search.match(/[?&]transId=([^&]+)/);
      if (paymentRefMatch) {
        paymentRef = paymentRefMatch[1].split("?")[0]; // Clean any embedded query
      }
      if (transIdMatch) {
        transId = transIdMatch[1];
      }
    }

    // Prioritize transId if available (Monicredit), otherwise use payment_ref
    const finalRef = transId || paymentRef;

    // Clean the reference one more time to be safe
    if (finalRef) {
      paymentRef = finalRef.split("?")[0].split("&")[0];
    }

    if (!paymentRef || !currentUser) return;
    // Query backend for status and notify
    const fetchStatus = async () => {
      try {
        // Always verify with Paystack via backend to ensure accurate status
        const verifyResp = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/payments/verify/${encodeURIComponent(paymentRef)}`,
          {
            headers: {
              Authorization: `Bearer ${
                safeStorage.getItem("auth_token") || ""
              }`,
            },
            cache: "no-store",
          }
        );
        if (verifyResp.ok) {
          const v = await verifyResp.json();
          if (v?.status === "success")
            toast.success("Payment successful", {
              description: `Ref ${paymentRef}`,
            });
          else if (v?.status === "failed")
            toast.error("Payment failed", { description: `Ref ${paymentRef}` });
          else
            toast.info(`Payment ${v?.status || "pending"}`, {
              description: `Ref ${paymentRef}`,
            });
          // Broadcast browser event so pages can refresh immediately
          window.dispatchEvent(
            new CustomEvent("payment:updated", {
              detail: { reference: paymentRef, status: v?.status },
            })
          );
        } else {
          // Fallback to local record if verification failed
          const resp = await fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:5000"
            }/api/payments/by-reference/${encodeURIComponent(paymentRef)}`,
            {
              headers: {
                Authorization: `Bearer ${
                  safeStorage.getItem("auth_token") || ""
                }`,
              },
              cache: "no-store",
            }
          );
          const data = await resp.json();
          if (resp.ok && data?.status) {
            if (data.status === "success") {
              toast.success("Payment successful", {
                description: `Ref ${paymentRef}`,
              });
            } else if (data.status === "failed") {
              toast.error("Payment failed", {
                description: `Ref ${paymentRef}`,
              });
            } else {
              toast.info(`Payment ${data.status}`, {
                description: `Ref ${paymentRef}`,
              });
            }
          } else {
            toast.error(data?.error || "Unable to verify payment");
          }
        }
      } catch (e: any) {
        toast.error("Unable to verify payment");
      } finally {
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete("payment_ref");
        url.searchParams.delete("reference");
        url.searchParams.delete("transId"); // Monicredit support
        url.searchParams.delete("transid"); // Case variation
        window.history.replaceState({}, document.title, url.toString());
      }
    };
    fetchStatus();
  }, [currentUser]);

  // Handle subscription upgrade callback: /upgrade/callback?reference=...
  // This is used by the developer billing flow that redirects to Paystack.
  // We verify the upgrade immediately when the user returns, so the new plan
  // takes effect without requiring them to manually visit Settings → Billing.
  useEffect(() => {
    if (!currentUser) return;

    const url = new URL(window.location.href);
    const pathname = url.pathname;
    if (!pathname.includes("/upgrade/callback")) return;

    const reference =
      url.searchParams.get("reference") ||
      sessionStorage.getItem("upgrade_reference");
    if (!reference) return;

    const handleUpgradeCallback = async () => {
      try {
        console.log(
          "[App] Handling subscription upgrade callback with reference:",
          reference
        );
        toast.info("Verifying subscription upgrade...");

        const resp = await verifyUpgrade(reference);
        console.log("[App] Upgrade verification response:", resp.data);

        if (!resp.data?.success) {
          throw new Error(resp.data?.message || "Upgrade verification failed");
        }

        // Clear stored reference and clean URL
        sessionStorage.removeItem("upgrade_reference");
        sessionStorage.removeItem("upgrade_plan_id");
        url.searchParams.delete("reference");
        window.history.replaceState({}, document.title, url.toString());

        toast.success(
          "Plan upgraded successfully! Reloading your dashboard..."
        );

        // Full reload to ensure all dashboard components refetch subscription
        // and account data and immediately reflect the new plan/limits.
        setTimeout(() => {
          window.location.href = "/developer/settings?tab=billing";
        }, 1500);
      } catch (error: any) {
        console.error("[App] Subscription upgrade verification error:", error);
        const message =
          error?.response?.data?.error ||
          error?.message ||
          "Failed to verify subscription upgrade";
        toast.error(message);
      }
    };

    handleUpgradeCallback();
  }, [currentUser]);

  // Initialize session manager
  useEffect(() => {
    // Session manager is automatically initialized
    // Sessions will persist across page refreshes using localStorage
    console.log(
      "🔐 Session manager initialized - sessions will persist across page refreshes"
    );
  }, []);

  // Listen for permissions update and account blocked events
  useEffect(() => {
    const handlePermissionsUpdated = (event: any) => {
      const message =
        event.detail?.message ||
        "Your permissions have been updated. Please log in again.";
      toast.warning(message, {
        duration: 5000,
        description: "You will be redirected to the login page shortly.",
      });
    };
    const handleAccountBlocked = (event: any) => {
      const message =
        event.detail?.message || "Your account has been deactivated.";
      toast.error(message, {
        duration: 4000,
      });
      // Force logout immediately
      sessionManager.clearSessionManually();
      setCurrentUser(null);
      setUserType("");
    };

    // Handle session revoked event
    const handleSessionRevoked = (event: any) => {
      const message =
        event.detail?.message ||
        "Your session has been revoked. Please log in again.";
      toast.error(message, {
        duration: 4000,
      });
      // Force logout immediately
      sessionManager.clearSessionManually();
      setCurrentUser(null);
      setUserType("");
    };

    window.addEventListener("permissionsUpdated", handlePermissionsUpdated);
    window.addEventListener("accountBlocked", handleAccountBlocked);
    window.addEventListener("sessionRevoked", handleSessionRevoked);

    return () => {
      window.removeEventListener(
        "permissionsUpdated",
        handlePermissionsUpdated
      );
      window.removeEventListener("accountBlocked", handleAccountBlocked);
      window.removeEventListener("sessionRevoked", handleSessionRevoked);
    };
  }, []);

  const handleLogin = async (type: string, userData: any) => {
    console.log("🔐 Login - Initial Type:", type);
    console.log("👤 User Data:", userData);
    console.log("📋 User Role:", userData?.role);
    console.log("🏢 Customer ID:", userData?.customerId);
    console.log("🎯 UserType from backend:", userData?.userType);

    setCurrentUser(userData);
    const derivedType = deriveUserTypeFromUser(userData);
    const finalType = userData?.userType || derivedType || type;

    console.log("🔍 Derived Type:", derivedType);
    console.log("✅ Final UserType:", finalType);

    setUserType(finalType);

    // Fetch customer data to check plan category and KYC status
    console.log("[App] ========== FETCHING ACCOUNT INFO ==========");
    const acct = await getAccountInfo();
    console.log("[App] Account response:", {
      hasError: !!acct.error,
      hasData: !!acct.data,
      error: acct.error,
    });

    // Check for KYC error in response
    if (acct.error?.kycRequired) {
      console.log(
        "[App] ✅ KYC required after login (from error), showing verification page. Status:",
        acct.error.kycStatus
      );
      setShowKYCVerification(true);
      setShowLanding(false);
      return; // Don't proceed to dashboard
    }

    const customer = acct.data?.customer;
    setCustomerData(customer || null);
    console.log("[App] ========== CUSTOMER DATA ==========");
    console.log("📦 Customer exists:", !!customer);
    console.log("📦 Customer ID:", customer?.id);
    console.log("📦 Customer Plan Category:", customer?.plan?.category);
    console.log("📦 Customer KYC Status:", customer?.kycStatus);
    console.log("📦 Customer Requires KYC:", customer?.requiresKyc);
    console.log("[App] ========================================");

    // Check if KYC required and not completed
    // For tenants: KYC is at user level (from acct.data.user)
    // For others: KYC is at customer level (from acct.data.customer)
    const user = acct.data?.user;
    const isTenant =
      user?.role?.toLowerCase() === "tenant" || finalType === "tenant";

    // Valid completed statuses: 'verified' (auto) or 'manually_verified' (admin)
    let needsKyc = false;

    if (isTenant) {
      // Tenant KYC check - at user level
      // For tenants, owner_approved is also a valid completed KYC status
      needsKyc =
        user?.requiresKyc &&
        user?.kycStatus !== "verified" &&
        user?.kycStatus !== "manually_verified" &&
        user?.kycStatus !== "owner_approved";

      console.log("[App] Tenant KYC Check:", {
        requiresKyc: user?.requiresKyc,
        kycStatus: user?.kycStatus,
        needsKyc: needsKyc,
      });
    } else {
      // Non-tenant KYC check - at customer level
      needsKyc =
        customer?.requiresKyc &&
        customer?.kycStatus !== "verified" &&
        customer?.kycStatus !== "manually_verified";

      console.log("[App] Customer KYC Check:", {
        requiresKyc: customer?.requiresKyc,
        kycStatus: customer?.kycStatus,
        needsKyc: needsKyc,
      });
    }

    if (needsKyc) {
      const kycStatus = isTenant ? user?.kycStatus : customer?.kycStatus;
      console.log(
        "[App] ✅ KYC required after login, showing verification page. Status:",
        kycStatus
      );
      setShowKYCVerification(true);
      setShowLanding(false);
      return; // Don't proceed to dashboard
    } else {
      console.log(
        "[App] ❌ KYC NOT required or already completed, proceeding to dashboard"
      );
    }
  };

  const handleLogout = () => {
    sessionManager.clearSessionManually();
    setCurrentUser(null);
    setUserType("");
    setCustomerData(null);
  };

  const handleBackToHome = () => {
    // Redirect to public landing page (contrezz.com)
    // If already on public domain, show landing page
    if (isPublicDomain) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentUser(null);
      setUserType("");
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
    } else {
      // If on app domain, redirect to public landing page
      window.location.href = getPublicUrl();
    }
  };

  const handleNavigateToLogin = () => {
    // If on public domain, handle based on environment
    if (isPublicDomain) {
      // In local dev, show login in place (same hostname, no redirect needed)
      // In production, redirect to app domain (different hostname)
      if (isLocalDev) {
        // Same hostname in local dev, just show login page without redirect
        window.scrollTo({ top: 0, behavior: "smooth" });
        setShowLanding(false);
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
        // Update URL to /login without full page reload
        window.history.pushState({}, "", "/login");
        return;
      } else {
        // Different hostnames in production, redirect to app domain
        window.location.href = `${getAppUrl()}/login`;
        return;
      }
    }

    // If already on app domain, just show login (no redirect needed)
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    // If on app domain, handle based on environment
    if (isAppDomain) {
      // In local dev, show contact page in place (same hostname, no redirect needed)
      // In production, redirect to public domain (different hostname)
      if (isLocalDev) {
        // Same hostname in local dev, just show contact page without redirect
        window.scrollTo({ top: 0, behavior: "smooth" });
        setShowLanding(false);
        setShowGetStarted(false);
        setShowAccountReview(false);
        setShowApplicationStatus(false);
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
        // Update URL to /contact?public=true without full page reload
        window.history.pushState({}, "", "/contact?public=true");
        // Note: We've already set showContact(true) above, so no need to call detectAndSetPageFromPathname()
        // The helper function is useful for direct navigation or browser back/forward
        return;
      } else {
        // Different hostnames in production, redirect to public domain
        window.location.href = getPublicUrl("/contact");
        return;
      }
    }
    // If on public domain, show contact page
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    const cleanup = setupActiveSessionValidation(
      // onInvalidSession callback
      (reason) => {
        toast.error(reason || "Your account has been deactivated");
        sessionManager.clearSessionManually();
        setCurrentUser(null);
        setUserType("");
      },
      // onRequiresKyc callback - redirect to KYC verification page
      () => {
        console.log("[App] KYC required - redirecting to verification page");
        toast.info("Identity verification required");
        setShowKYCVerification(true);
        setShowLanding(false);
      }
    );
    return cleanup;
  }, [currentUser]);

  // Periodic session validation to enforce KYC redirect without user interaction
  useEffect(() => {
    if (!currentUser) return;
    const intervalId = setInterval(() => {
      checkSessionValidity(
        (reason) => {
          toast.error(reason || "Your account has been deactivated");
          sessionManager.clearSessionManually();
          setCurrentUser(null);
          setUserType("");
        },
        () => {
          console.log(
            "[App] Periodic check: KYC required - redirecting to verification page"
          );
          setShowKYCVerification(true);
          setShowLanding(false);
        }
      );
    }, 60000); // every 60s
    return () => clearInterval(intervalId);
  }, [currentUser]);
  // Helpers to map assignments from API managers into a flat list the UI can use
  const rebuildAssignmentsFromManagers = (mgrs: any[]) => {
    const flat = [] as any[];
    for (const m of mgrs) {
      const assignments = Array.isArray(m.property_managers)
        ? m.property_managers
        : [];
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
      console.log("🔄 Loading managers...");
      const res = await apiGetManagers();
      console.log("📦 Managers response:", res);
      if (res.data) {
        console.log(`✅ Loaded ${res.data.length} managers`);
        setManagers(res.data);
        rebuildAssignmentsFromManagers(res.data);
      } else if (res.error) {
        console.error("❌ Error loading managers:", res.error);
      }
    } catch (error) {
      console.error("❌ Exception loading managers:", error);
    }
  };

  // Manager management functions (now backed by API)
  const addManager = async (managerData: any) => {
    const res = await apiCreateManager(managerData);
    if (res.error)
      throw new Error(res.error.error || "Failed to create manager");
    const created = res.data as any;
    // Preserve credentials shape expected by child component
    const username =
      managerData.credentials?.username ||
      managerData.email?.split("@")[0] ||
      "user";
    const tempPassword =
      managerData.credentials?.tempPassword || (created as any).tempPassword;
    const managerWithCreds = {
      ...created,
      credentials: { username, tempPassword },
    };
    await loadManagers();
    return managerWithCreds;
  };

  const assignManager = async (
    managerId: string,
    propertyId: string,
    permissions?: any
  ) => {
    const res = await apiAssignManagerToProperty(
      managerId,
      propertyId,
      permissions
    );
    if (res.error)
      throw new Error(res.error.error || "Failed to assign manager");
    await loadManagers();
  };

  const removeManager = async (managerId: string, propertyId: string) => {
    const res = await apiRemoveManagerFromProperty(managerId, propertyId);
    if (res.error)
      throw new Error(res.error.error || "Failed to remove manager");
    await loadManagers();
  };

  const updateManager = async (managerId: string, updates: any) => {
    const res = await apiUpdateManager(managerId, updates);
    if (res.error)
      throw new Error(res.error.error || "Failed to update manager");
    await loadManagers();
  };

  const deactivateManager = async (managerId: string) => {
    const res = await apiDeactivateManager(managerId);
    if (res.error)
      throw new Error(res.error.error || "Failed to deactivate manager");
    await loadManagers();
  };

  // Debug: Log current state
  console.log(
    "Current State - UserType:",
    userType,
    "CurrentUser:",
    currentUser
  );

  // Public Admin Interface (admin subdomain or /admin path) - Check before other routing
  if (shouldShowAdmin) {
    const pathname = window.location.pathname;

    // Show login if not authenticated
    if (!publicAdminAuthenticated && pathname !== "/admin/login") {
      return (
        <PublicAdminLogin
          onLoginSuccess={() => setPublicAdminAuthenticated(true)}
        />
      );
    }

    // Show admin interface if authenticated
    if (publicAdminAuthenticated) {
      return <PublicAdminLayout />;
    }

    // Show login page
    return (
      <PublicAdminLogin
        onLoginSuccess={() => setPublicAdminAuthenticated(true)}
      />
    );
  }

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

  // Show API Documentation if requested (public domain only)
  if (!currentUser && showAPIDocumentation && !isAppDomain) {
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

  // Show Integrations page if requested (public domain only)
  if (!currentUser && showIntegrations && !isAppDomain) {
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

  // Show About page if requested (public domain only)
  if (!currentUser && showAbout && !isAppDomain) {
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

  // Show Contact page if requested (public domain only)
  if (!currentUser && showContact && !isAppDomain) {
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

  // Show Schedule Demo page if requested (public domain only)
  if (!currentUser && showScheduleDemo && !isAppDomain) {
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

  // Show Blog page if requested (public domain only)
  if (!currentUser && showBlog && !isAppDomain) {
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

  // Show Careers page if requested (public domain only)
  if (!currentUser && showCareers && !isAppDomain) {
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

  // Show Help Center page if requested (public domain only)
  if (!currentUser && showHelpCenter && !isAppDomain) {
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

  // Show Community page if requested (public domain only)
  if (!currentUser && showCommunity && !isAppDomain) {
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

  // Show New Discussion page if requested (public domain only)
  if (!currentUser && showNewDiscussion && !isAppDomain) {
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

  // Show Status page if requested (public domain only)
  if (!currentUser && showStatus && !isAppDomain) {
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

  // Show Security page if requested (public domain only)
  if (!currentUser && showSecurity && !isAppDomain) {
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

  // On app domain, show login by default if not authenticated
  if (isAppDomain && !currentUser && !showGetStarted && !showAccountReview) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onBackToHome={handleBackToHome}
          onNavigateToScheduleDemo={handleNavigateToScheduleDemo}
          onNavigateToContact={handleNavigateToContact}
        />
        <Toaster />
      </>
    );
  }

  // Show landing page if no user and showLanding is true (public domain only)
  if (!currentUser && showLanding && !showGetStarted && !isAppDomain) {
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
          userRole={
            signupData.role as "property-owner" | "property-manager" | "tenant"
          }
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
        <ApplicationStatusPage onBackToHome={handleBackToHome} />
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

  // Show login if no user but landing is dismissed (public domain only)
  if (
    !isAppDomain &&
    !currentUser &&
    !showLanding &&
    !showGetStarted &&
    !showAccountReview &&
    !showAPIDocumentation &&
    !showIntegrations &&
    !showAbout &&
    !showContact &&
    !showScheduleDemo &&
    !showBlog &&
    !showCareers &&
    !showHelpCenter &&
    !showCommunity &&
    !showNewDiscussion &&
    !showStatus &&
    !showSecurity
  ) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onBackToHome={handleBackToHome}
          onNavigateToScheduleDemo={handleNavigateToScheduleDemo}
          onNavigateToContact={handleNavigateToContact}
        />
        <Toaster />
      </>
    );
  }

  // Show Storage Test page if requested
  if (showStorageTest) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 pt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setShowStorageTest(false)}
              className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              ← Back to Dashboard
            </button>
            <StorageTest />
          </div>
        </div>
        <Toaster />
      </>
    );
  }

  // Show Check Auth page if requested
  if (showCheckAuth) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 pt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setShowCheckAuth(false)}
              className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              ← Back to Dashboard
            </button>
            <CheckAuth />
          </div>
        </div>
        <Toaster />
      </>
    );
  }

  // IMPORTANT: Enforce KYC before rendering ANY customer dashboard
  // When showKYCVerification is true, we short-circuit and show ONLY the KYC page.
  // This must come BEFORE all dashboard conditions (owner, manager, tenant, developer).
  if (
    showKYCVerification &&
    currentUser &&
    !(userType === "admin" || userType === "super-admin")
  ) {
    return (
      <>
        <KYCVerificationPage
          onVerificationComplete={async () => {
            console.log(
              "[App] KYC verification complete, reloading account info..."
            );
            setShowKYCVerification(false);
            // Reload account info to get updated KYC status
            try {
              const acct = await getAccountInfo();
              setCustomerData(acct.data?.customer || null);
              toast.success(
                "Identity verification complete! Welcome to your dashboard."
              );
            } catch (error) {
              console.error("[App] Failed to reload account info:", error);
            }
          }}
        />
        <Toaster />
      </>
    );
  }

  // Show Owner Dashboard if property owner
  if (userType === "owner" || userType === "property-owner") {
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
  if (userType === "admin" || userType === "super-admin") {
    return (
      <>
        <SuperAdminDashboard user={currentUser} onLogout={handleLogout} />
        <Toaster />
      </>
    );
  }

  // Show Property Manager Dashboard if property manager
  if (userType === "manager" || userType === "property-manager") {
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
  if (userType === "tenant") {
    return (
      <>
        <TenantDashboard />
        <Toaster />
      </>
    );
  }

  // Show Developer Dashboard ONLY if user role is developer or property-developer
  // Property owners/managers with development plans should NOT be routed here
  if (userType === "developer" || userType === "property-developer") {
    return (
      <>
        <DeveloperDashboardRefactored
          user={currentUser}
          onLogout={handleLogout}
        />
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
    console.log("⚠️ deriveUserTypeFromUser: No user provided");
    return "";
  }

  const role = (user.role || "").toString().toLowerCase();
  const isInternal = !user.customerId; // internal users have no customerId

  console.log("🔍 deriveUserTypeFromUser:");
  console.log("   - Original role:", user.role);
  console.log("   - Normalized role:", role);
  console.log("   - customerId:", user.customerId);
  console.log("   - isInternal:", isInternal);

  if (isInternal) {
    console.log("   → Internal user detected");
    if (
      role === "super_admin" ||
      role === "super admin" ||
      role === "superadmin"
    )
      return "super-admin";
    if (role === "admin") return "admin";
    if (role === "billing" || role === "support" || role === "analyst")
      return "admin"; // internal dashboards
    return "admin";
  }

  console.log("   → Customer user (has customerId)");

  if (role === "owner" || role === "property owner") {
    console.log("   → Matched: owner");
    return "owner";
  }
  if (role === "manager" || role === "property manager") {
    console.log("   → Matched: property-manager");
    return "property-manager";
  }
  if (role === "tenant") {
    console.log("   → Matched: tenant");
    return "tenant";
  }
  if (
    role === "developer" ||
    role === "property-developer" ||
    role === "property developer"
  ) {
    console.log("   → Matched: developer");
    return "developer";
  }

  console.log("   → No match! Returning empty string");
  return "";
}
