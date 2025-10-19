import React from 'react';
import { hasPermission, hasAnyPermission, getUserPermissions, type Permission } from '../lib/permissions';

interface ProtectedComponentProps {
  user: any;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires ALL permissions. If false (default), requires ANY
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Protected Component - Only renders children if user has required permission(s)
 * 
 * Usage:
 * <ProtectedComponent user={user} permission={PERMISSIONS.CUSTOMER_MANAGEMENT}>
 *   <CustomerManagement />
 * </ProtectedComponent>
 * 
 * Or with multiple permissions (ANY):
 * <ProtectedComponent user={user} permissions={[PERMISSIONS.USER_VIEW, PERMISSIONS.USER_MANAGEMENT]}>
 *   <UserList />
 * </ProtectedComponent>
 */
export function ProtectedComponent({ 
  user, 
  permission, 
  permissions, 
  requireAll = false,
  fallback = null, 
  children 
}: ProtectedComponentProps) {
  const userPermissions = getUserPermissions(user);
  
  // Check single permission
  if (permission) {
    const hasAccess = hasPermission(userPermissions, permission);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }
  
  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? permissions.every(p => hasPermission(userPermissions, p))
      : hasAnyPermission(userPermissions, permissions);
    
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }
  
  // No permission specified - always show (public component)
  return <>{children}</>;
}

interface ProtectedButtonProps {
  user: any;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  [key: string]: any; // Other button props
}

/**
 * Protected Button - Only renders button if user has required permission(s)
 * If no permission, renders nothing (not even disabled button)
 */
export function ProtectedButton({ 
  user, 
  permission, 
  permissions, 
  requireAll = false,
  disabled,
  children,
  ...buttonProps
}: ProtectedButtonProps) {
  const userPermissions = getUserPermissions(user);
  
  let hasAccess = true;
  
  if (permission) {
    hasAccess = hasPermission(userPermissions, permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? permissions.every(p => hasPermission(userPermissions, p))
      : hasAnyPermission(userPermissions, permissions);
  }
  
  if (!hasAccess) {
    return null; // Don't render button at all
  }
  
  return (
    <button disabled={disabled} {...buttonProps}>
      {children}
    </button>
  );
}

