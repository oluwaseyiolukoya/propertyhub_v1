import { getAdminData, PublicAdmin } from "../../lib/api/publicAdminApi";

/**
 * Check if current user can edit content (admin or editor)
 */
export function canEditContent(): boolean {
  const admin = getAdminData();
  if (!admin) return false;

  // Admin and editor can edit, viewer cannot
  return admin.role === "admin" || admin.role === "editor";
}

/**
 * Check if current user is admin
 */
export function isAdmin(): boolean {
  const admin = getAdminData();
  return admin?.role === "admin" || false;
}

/**
 * Check if current user is editor or admin
 */
export function isEditorOrAdmin(): boolean {
  const admin = getAdminData();
  if (!admin) return false;
  return admin.role === "admin" || admin.role === "editor";
}

/**
 * Check if current user is viewer only
 */
export function isViewerOnly(): boolean {
  const admin = getAdminData();
  return admin?.role === "viewer" || false;
}

/**
 * Get current admin role
 */
export function getCurrentAdminRole(): "admin" | "editor" | "viewer" | null {
  const admin = getAdminData();
  return (admin?.role as "admin" | "editor" | "viewer") || null;
}

