/**
 * Permission Management Utility
 * Role-Based Access Control (RBAC)
 */

// Permission constants
export const PERMISSIONS = {
  // Customer & User Management
  CUSTOMER_MANAGEMENT: 'customer_management',
  CUSTOMER_CREATE: 'customer_create',
  CUSTOMER_EDIT: 'customer_edit',
  CUSTOMER_DELETE: 'customer_delete',
  CUSTOMER_VIEW: 'customer_view',
  
  // Internal User Management
  USER_MANAGEMENT: 'user_management',
  USER_CREATE: 'user_create',
  USER_EDIT: 'user_edit',
  USER_DELETE: 'user_delete',
  USER_VIEW: 'user_view',
  
  // Role Management
  ROLE_MANAGEMENT: 'role_management',
  ROLE_CREATE: 'role_create',
  ROLE_EDIT: 'role_edit',
  ROLE_DELETE: 'role_delete',
  
  // Billing & Plans
  BILLING_MANAGEMENT: 'billing_management',
  PLAN_MANAGEMENT: 'plan_management',
  INVOICE_MANAGEMENT: 'invoice_management',
  PAYMENT_VIEW: 'payment_view',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics_view',
  ANALYTICS_REPORTS: 'analytics_reports',
  ANALYTICS_EXPORT: 'analytics_export',
  
  // System & Platform
  SYSTEM_HEALTH: 'system_health',
  SYSTEM_SETTINGS: 'system_settings',
  PLATFORM_SETTINGS: 'platform_settings',
  SYSTEM_LOGS: 'system_logs',
  
  // Support
  SUPPORT_TICKETS: 'support_tickets',
  SUPPORT_VIEW: 'support_view',
  SUPPORT_RESPOND: 'support_respond',
  SUPPORT_CLOSE: 'support_close',
  
  // Activity & Audit
  ACTIVITY_LOGS: 'activity_logs',
  AUDIT_REPORTS: 'audit_reports',

  // Property Management (Owner/Manager)
  PROPERTY_MANAGEMENT: 'property_management',
  TENANT_MANAGEMENT: 'tenant_management',
  FINANCIAL_REPORTS: 'financial_reports',
  MAINTENANCE_MANAGEMENT: 'maintenance_management',
  ACCESS_CONTROL: 'access_control',

  // Tenant Permissions
  VIEW_LEASE: 'view_lease',
  SUBMIT_MAINTENANCE: 'submit_maintenance',
  MAKE_PAYMENTS: 'make_payments',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: string[], permission: Permission): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  return userPermissions.includes(permission);
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(userPermissions: string[], permissions: Permission[]): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  return permissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(userPermissions: string[], permissions: Permission[]): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  return permissions.every(permission => userPermissions.includes(permission));
}

/**
 * Get user permissions from user object
 */
export function getUserPermissions(user: any): string[] {
  // If user has direct permissions array (internal admin users)
  if (user?.permissions && Array.isArray(user.permissions)) {
    return user.permissions;
  }
  
  // If user has role with permissions
  if (user?.rolePermissions && Array.isArray(user.rolePermissions)) {
    return user.rolePermissions;
  }
  
  // Default permissions based on role name
  return getDefaultPermissionsForRole(user?.role);
}

/**
 * Get default permissions based on role name
 * (Fallback when permissions are not explicitly set)
 */
function getDefaultPermissionsForRole(roleName?: string): string[] {
  if (!roleName) return [];
  
  const role = roleName.toLowerCase();
  
  // Super Admin - all permissions
  if (role === 'super admin' || role === 'superadmin' || role === 'super_admin') {
    return Object.values(PERMISSIONS);
  }
  
  // Admin - most internal permissions (also gets all permissions)
  if (role === 'admin') {
    return Object.values(PERMISSIONS); // Give admin full access like super admin
  }
  
  // Support Staff
  if (role === 'support' || role.includes('support')) {
    return [
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.SUPPORT_TICKETS,
      PERMISSIONS.SUPPORT_VIEW,
      PERMISSIONS.SUPPORT_RESPOND,
      PERMISSIONS.SUPPORT_CLOSE,
    ];
  }
  
  // Property Owner - full property access
  if (role === 'owner' || role === 'property owner') {
    return [
      PERMISSIONS.PROPERTY_MANAGEMENT,
      PERMISSIONS.TENANT_MANAGEMENT,
      PERMISSIONS.FINANCIAL_REPORTS,
      PERMISSIONS.MAINTENANCE_MANAGEMENT,
      PERMISSIONS.ACCESS_CONTROL,
      PERMISSIONS.USER_MANAGEMENT, // Can manage their own users
    ];
  }
  
  // Property Manager - property operations
  if (role === 'manager' || role === 'property manager') {
    return [
      PERMISSIONS.PROPERTY_MANAGEMENT,
      PERMISSIONS.TENANT_MANAGEMENT,
      PERMISSIONS.MAINTENANCE_MANAGEMENT,
      PERMISSIONS.ACCESS_CONTROL,
    ];
  }
  
  // Tenant - limited access
  if (role === 'tenant') {
    return [
      PERMISSIONS.VIEW_LEASE,
      PERMISSIONS.SUBMIT_MAINTENANCE,
      PERMISSIONS.MAKE_PAYMENTS,
    ];
  }
  
  // Analyst
  if (role === 'analyst' || role.includes('analyst')) {
    return [
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.ANALYTICS_REPORTS,
      PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.CUSTOMER_VIEW,
    ];
  }
  
  // Finance
  if (role === 'finance' || role.includes('finance')) {
    return [
      PERMISSIONS.BILLING_MANAGEMENT,
      PERMISSIONS.INVOICE_MANAGEMENT,
      PERMISSIONS.PAYMENT_VIEW,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
    ];
  }
  
  // Default: no permissions
  return [];
}

/**
 * Filter menu items based on user permissions
 */
export function filterMenuByPermissions(
  menuItems: Array<{ permission?: Permission | Permission[]; [key: string]: any }>,
  userPermissions: string[]
): Array<{ [key: string]: any }> {
  return menuItems.filter(item => {
    if (!item.permission) {
      // No permission required, show item
      return true;
    }
    
    if (Array.isArray(item.permission)) {
      // Item requires ANY of the listed permissions
      return hasAnyPermission(userPermissions, item.permission);
    }
    
    // Item requires specific permission
    return hasPermission(userPermissions, item.permission);
  });
}

/**
 * Check if user is Super Admin (has all permissions)
 */
export function isSuperAdmin(user: any): boolean {
  const role = user?.role?.toLowerCase();
  return role === 'super admin' || 
         role === 'superadmin' ||
         role === 'super_admin' ||
         user?.isSuperAdmin === true;
}

/**
 * Check if user is Admin (internal admin, not super admin)
 */
export function isAdmin(user: any): boolean {
  const role = user?.role?.toLowerCase();
  return role === 'admin' || isSuperAdmin(user);
}

/**
 * Check if user is Property Owner
 */
export function isOwner(user: any): boolean {
  return user?.role?.toLowerCase() === 'owner' || 
         user?.role?.toLowerCase() === 'property owner';
}

/**
 * Check if user is Property Manager
 */
export function isManager(user: any): boolean {
  return user?.role?.toLowerCase() === 'manager' || 
         user?.role?.toLowerCase() === 'property manager';
}

/**
 * Check if user is Tenant
 */
export function isTenant(user: any): boolean {
  return user?.role?.toLowerCase() === 'tenant';
}

