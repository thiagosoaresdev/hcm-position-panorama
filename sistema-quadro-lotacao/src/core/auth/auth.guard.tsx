import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth.context';
import { usePermissions, useAsyncPermissions } from './usePermissions';
import { authorizationService } from './authorization.service';
import type { PermissionContext } from '../../types';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  permissionContext?: PermissionContext;
  fallbackPath?: string;
  requireAllPermissions?: boolean;
  requireAllRoles?: boolean;
  asyncPermissionCheck?: boolean;
  loadingComponent?: React.ReactNode;
}

/**
 * Authentication Guard Component
 * Protects routes that require authentication and authorization
 */
export function AuthGuard({ 
  children, 
  requireAuth = true,
  requiredPermissions = [],
  requiredRoles = [],
  permissionContext,
  fallbackPath = '/login',
  requireAllPermissions = false,
  requireAllRoles = false,
  asyncPermissionCheck = false,
  loadingComponent = <div>Loading...</div>
}: AuthGuardProps): React.ReactElement {
  const { isAuthenticated, user } = useAuth();
  const { checkPermission, checkAnyPermission, checkAllPermissions, checkRole, checkAnyRole } = usePermissions();
  const { checkPermissionAsync, loading } = useAsyncPermissions();
  const location = useLocation();
  
  const [asyncPermissionResult, setAsyncPermissionResult] = useState<boolean | null>(null);
  const [asyncLoading, setAsyncLoading] = useState(false);

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    // Redirect to login with return URL
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check required roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requireAllRoles
      ? requiredRoles.every(role => checkRole(role))
      : checkAnyRole(requiredRoles);
      
    if (!hasRequiredRole) {
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ 
            message: `Access denied. Required roles: ${requiredRoles.join(', ')}`,
            from: location.pathname 
          }} 
          replace 
        />
      );
    }
  }

  // Check required permissions (sync)
  if (requiredPermissions.length > 0 && !asyncPermissionCheck) {
    const hasRequiredPermission = requireAllPermissions
      ? checkAllPermissions(requiredPermissions)
      : checkAnyPermission(requiredPermissions);
    
    if (!hasRequiredPermission) {
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ 
            message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
            from: location.pathname 
          }} 
          replace 
        />
      );
    }
  }

  // Check required permissions (async)
  useEffect(() => {
    if (requiredPermissions.length > 0 && asyncPermissionCheck) {
      setAsyncLoading(true);
      
      const checkAsyncPermissions = async () => {
        try {
          if (requireAllPermissions) {
            // Check all permissions individually
            const results = await Promise.all(
              requiredPermissions.map(permission => {
                const [resource, action] = permission.split(':').slice(1);
                return checkPermissionAsync(`quadro_vagas:${resource}`, action, permissionContext);
              })
            );
            setAsyncPermissionResult(results.every(result => result));
          } else {
            // Check if user has any of the required permissions
            const results = await Promise.all(
              requiredPermissions.map(permission => {
                const [resource, action] = permission.split(':').slice(1);
                return checkPermissionAsync(`quadro_vagas:${resource}`, action, permissionContext);
              })
            );
            setAsyncPermissionResult(results.some(result => result));
          }
        } catch (error) {
          console.error('Async permission check failed:', error);
          setAsyncPermissionResult(false);
        } finally {
          setAsyncLoading(false);
        }
      };

      checkAsyncPermissions();
    }
  }, [requiredPermissions, asyncPermissionCheck, requireAllPermissions, permissionContext, checkPermissionAsync]);

  // Show loading while checking async permissions
  if (asyncPermissionCheck && (asyncLoading || loading)) {
    return <>{loadingComponent}</>;
  }

  // Check async permission result
  if (asyncPermissionCheck && asyncPermissionResult === false) {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
          from: location.pathname 
        }} 
        replace 
      />
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Permission Guard Component
 * Conditionally renders content based on permissions
 */
interface PermissionGuardProps {
  children: React.ReactNode;
  permissions?: string[];
  roles?: string[];
  permissionContext?: PermissionContext;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL permissions/roles
  asyncCheck?: boolean;
  loadingComponent?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permissions = [],
  roles = [],
  permissionContext,
  fallback = null,
  requireAll = false,
  asyncCheck = false,
  loadingComponent = null
}: PermissionGuardProps): React.ReactElement {
  const { user } = useAuth();
  const { checkPermission, checkAnyPermission, checkAllPermissions, checkRole, checkAnyRole } = usePermissions();
  const { checkPermissionAsync, loading } = useAsyncPermissions();
  
  const [asyncResult, setAsyncResult] = useState<boolean | null>(null);
  const [asyncLoading, setAsyncLoading] = useState(false);

  if (!user) {
    return <>{fallback}</>;
  }

  // Async permission checking
  useEffect(() => {
    if (permissions.length > 0 && asyncCheck) {
      setAsyncLoading(true);
      
      const checkAsync = async () => {
        try {
          if (requireAll) {
            const results = await Promise.all(
              permissions.map(permission => {
                const [resource, action] = permission.split(':').slice(1);
                return checkPermissionAsync(`quadro_vagas:${resource}`, action, permissionContext);
              })
            );
            setAsyncResult(results.every(result => result));
          } else {
            const results = await Promise.all(
              permissions.map(permission => {
                const [resource, action] = permission.split(':').slice(1);
                return checkPermissionAsync(`quadro_vagas:${resource}`, action, permissionContext);
              })
            );
            setAsyncResult(results.some(result => result));
          }
        } catch (error) {
          console.error('Async permission check failed:', error);
          setAsyncResult(false);
        } finally {
          setAsyncLoading(false);
        }
      };

      checkAsync();
    }
  }, [permissions, asyncCheck, requireAll, permissionContext, checkPermissionAsync]);

  // Show loading during async check
  if (asyncCheck && (asyncLoading || loading)) {
    return <>{loadingComponent}</>;
  }

  // Check permissions (sync or async result)
  if (permissions.length > 0) {
    let permissionCheck: boolean;
    
    if (asyncCheck) {
      if (asyncResult === null) return <>{loadingComponent}</>;
      permissionCheck = asyncResult;
    } else {
      permissionCheck = requireAll
        ? checkAllPermissions(permissions)
        : checkAnyPermission(permissions);
    }

    if (!permissionCheck) {
      return <>{fallback}</>;
    }
  }

  // Check roles
  if (roles.length > 0) {
    const roleCheck = requireAll
      ? roles.every(role => checkRole(role))
      : checkAnyRole(roles);

    if (!roleCheck) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Resource-based Permission Guard
 * Checks permissions for specific resources and actions
 */
interface ResourceGuardProps {
  children: React.ReactNode;
  resource: string;
  action: string;
  context?: PermissionContext;
  fallback?: React.ReactNode;
  asyncCheck?: boolean;
  loadingComponent?: React.ReactNode;
}

export function ResourceGuard({
  children,
  resource,
  action,
  context,
  fallback = null,
  asyncCheck = true,
  loadingComponent = null
}: ResourceGuardProps): React.ReactElement {
  const { user } = useAuth();
  const { checkPermissionAsync, loading } = useAsyncPermissions();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setHasAccess(false);
      return;
    }

    if (asyncCheck) {
      checkPermissionAsync(resource, action, context)
        .then(setHasAccess)
        .catch(() => setHasAccess(false));
    }
  }, [user, resource, action, context, asyncCheck, checkPermissionAsync]);

  if (!user) {
    return <>{fallback}</>;
  }

  if (asyncCheck && (loading || hasAccess === null)) {
    return <>{loadingComponent}</>;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Role-based Guard Component
 * Simpler component for role-only checks
 */
interface RoleGuardProps {
  children: React.ReactNode;
  roles: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function RoleGuard({
  children,
  roles,
  requireAll = false,
  fallback = null
}: RoleGuardProps): React.ReactElement {
  const { checkRole, checkAnyRole } = usePermissions();
  
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  const hasRequiredRole = requireAll
    ? roleArray.every(role => checkRole(role))
    : checkAnyRole(roleArray);

  if (!hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook for programmatic navigation with auth checks
 */
export function useAuthNavigation() {
  const { isAuthenticated, hasPermission, hasRole } = useAuth();

  const navigateWithAuth = (
    path: string,
    options: {
      requireAuth?: boolean;
      requiredPermissions?: string[];
      requiredRoles?: string[];
      permissionContext?: PermissionContext;
    } = {}
  ): string | null => {
    const {
      requireAuth = true,
      requiredPermissions = [],
      requiredRoles = [],
      permissionContext
    } = options;

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      return `/login?returnUrl=${encodeURIComponent(path)}`;
    }

    // Check roles
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => hasRole(role));
      if (!hasRequiredRole) {
        return '/unauthorized';
      }
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some(permission => 
        hasPermission(permission, permissionContext)
      );
      
      if (!hasRequiredPermission) {
        return '/unauthorized';
      }
    }

    // All checks passed
    return path;
  };

  return { navigateWithAuth };
}

/**
 * Higher-Order Component for route protection
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardOptions: Omit<AuthGuardProps, 'children'> = {}
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...guardOptions}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Higher-Order Component for permission-based rendering
 */
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardOptions: Omit<PermissionGuardProps, 'children'> = {}
) {
  return function PermissionGuardedComponent(props: P) {
    return (
      <PermissionGuard {...guardOptions}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}