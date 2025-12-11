import React from 'react';
import { usePermissions } from '../../core/auth/usePermissions';
import type { PermissionContext } from '../../types';

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  roles?: string | string[];
  requireAll?: boolean;
  permissionContext?: PermissionContext;
  fallback?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

/**
 * Permission-aware Button Component
 * Only renders if user has required permissions/roles
 */
export function PermissionButton({
  children,
  permission,
  permissions = [],
  roles,
  requireAll = false,
  permissionContext,
  fallback = null,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: PermissionButtonProps): React.ReactElement {
  const { checkPermission, checkAnyPermission, checkAllPermissions, checkRole, checkAnyRole } = usePermissions();

  // Combine single permission with permissions array
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  const roleArray = typeof roles === 'string' ? [roles] : (roles || []);

  // Check permissions
  if (allPermissions.length > 0) {
    const hasPermission = requireAll
      ? checkAllPermissions(allPermissions)
      : checkAnyPermission(allPermissions);

    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  // Check roles
  if (roleArray.length > 0) {
    const hasRole = requireAll
      ? roleArray.every(role => checkRole(role))
      : checkAnyRole(roleArray);

    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Define CSS classes based on variant and size
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';
  const loadingClasses = 'opacity-75 cursor-wait';

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && disabledClasses,
    loading && loadingClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

/**
 * Icon Button with permissions
 */
interface PermissionIconButtonProps extends Omit<PermissionButtonProps, 'children'> {
  icon: React.ReactNode;
  tooltip?: string;
}

export function PermissionIconButton({
  icon,
  tooltip,
  className = '',
  size = 'md',
  ...props
}: PermissionIconButtonProps): React.ReactElement {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  return (
    <PermissionButton
      className={`${sizeClasses[size]} ${className}`}
      title={tooltip}
      {...props}
    >
      {icon}
    </PermissionButton>
  );
}

/**
 * Menu Item with permissions
 */
interface PermissionMenuItemProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  roles?: string | string[];
  requireAll?: boolean;
  permissionContext?: PermissionContext;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function PermissionMenuItem({
  children,
  permission,
  permissions = [],
  roles,
  requireAll = false,
  permissionContext,
  onClick,
  disabled = false,
  icon,
  className = '',
}: PermissionMenuItemProps): React.ReactElement | null {
  const { checkPermission, checkAnyPermission, checkAllPermissions, checkRole, checkAnyRole } = usePermissions();

  // Combine single permission with permissions array
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  const roleArray = typeof roles === 'string' ? [roles] : (roles || []);

  // Check permissions
  if (allPermissions.length > 0) {
    const hasPermission = requireAll
      ? checkAllPermissions(allPermissions)
      : checkAnyPermission(allPermissions);

    if (!hasPermission) {
      return null;
    }
  }

  // Check roles
  if (roleArray.length > 0) {
    const hasRole = requireAll
      ? roleArray.every(role => checkRole(role))
      : checkAnyRole(roleArray);

    if (!hasRole) {
      return null;
    }
  }

  const baseClasses = 'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer';
  const disabledClasses = 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-700';

  return (
    <div
      className={`${baseClasses} ${disabled ? disabledClasses : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </div>
  );
}

/**
 * Link with permissions
 */
interface PermissionLinkProps {
  children: React.ReactNode;
  to: string;
  permission?: string;
  permissions?: string[];
  roles?: string | string[];
  requireAll?: boolean;
  permissionContext?: PermissionContext;
  fallback?: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

export function PermissionLink({
  children,
  to,
  permission,
  permissions = [],
  roles,
  requireAll = false,
  permissionContext,
  fallback = null,
  className = '',
  activeClassName = '',
}: PermissionLinkProps): React.ReactElement {
  const { checkPermission, checkAnyPermission, checkAllPermissions, checkRole, checkAnyRole } = usePermissions();

  // Combine single permission with permissions array
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  const roleArray = typeof roles === 'string' ? [roles] : (roles || []);

  // Check permissions
  if (allPermissions.length > 0) {
    const hasPermission = requireAll
      ? checkAllPermissions(allPermissions)
      : checkAnyPermission(allPermissions);

    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  // Check roles
  if (roleArray.length > 0) {
    const hasRole = requireAll
      ? roleArray.every(role => checkRole(role))
      : checkAnyRole(roleArray);

    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Check if current path matches (simplified)
  const isActive = window.location.pathname === to;
  const linkClasses = `${className} ${isActive ? activeClassName : ''}`;

  return (
    <a href={to} className={linkClasses}>
      {children}
    </a>
  );
}