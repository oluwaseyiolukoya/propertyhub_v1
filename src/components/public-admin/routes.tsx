/**
 * Route configuration for public admin pages
 * Maps URL paths to page IDs and sub-page IDs
 */

export interface RouteConfig {
  path: string;
  pageId: string;
  subPageId?: string;
}

/**
 * Parse a URL path and return the corresponding page and sub-page IDs
 */
export function parseRoute(pathname: string): { pageId: string; subPageId?: string } {
  // Remove leading/trailing slashes and split
  const segments = pathname.replace(/^\/|\/$/g, "").split("/");

  // Remove 'admin' prefix if present
  const adminIndex = segments.indexOf("admin");
  const routeSegments =
    adminIndex >= 0 ? segments.slice(adminIndex + 1) : segments;

  // Handle empty path (dashboard)
  if (routeSegments.length === 0 || routeSegments[0] === "") {
    return { pageId: "dashboard" };
  }

  const pageId = routeSegments[0];
  const subPageId = routeSegments[1];

  return { pageId, subPageId };
}

/**
 * Generate a route path from page and sub-page IDs
 */
export function generateRoute(pageId: string, subPageId?: string): string {
  if (subPageId) {
    return `/admin/${pageId}/${subPageId}`;
  }
  return `/admin/${pageId}`;
}

/**
 * Route mappings for all admin pages
 */
export const ADMIN_ROUTES = {
  LOGIN: "/admin/login",
  DASHBOARD: "/admin/dashboard",
  LANDING_PAGES: "/admin/landing-pages",
  LANDING_PAGES_HOME: "/admin/landing-pages/home",
  CAREERS: "/admin/careers",
  FORMS: "/admin/forms",
  FORMS_CONTACT_US: "/admin/forms/contact-us",
  FORMS_SCHEDULE_DEMO: "/admin/forms/schedule-demo",
  ANALYTICS: "/admin/analytics",
  USERS: "/admin/users",
} as const;

/**
 * Check if a path matches a route pattern
 */
export function isRouteMatch(pathname: string, route: string): boolean {
  const normalizedPath = pathname.replace(/\/$/, "");
  const normalizedRoute = route.replace(/\/$/, "");
  return normalizedPath === normalizedRoute;
}

/**
 * Check if a path starts with a route prefix
 */
export function isRoutePrefix(pathname: string, route: string): boolean {
  const normalizedPath = pathname.replace(/\/$/, "");
  const normalizedRoute = route.replace(/\/$/, "");
  return normalizedPath.startsWith(normalizedRoute + "/") || normalizedPath === normalizedRoute;
}

