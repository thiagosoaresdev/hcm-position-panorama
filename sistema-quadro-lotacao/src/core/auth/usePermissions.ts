import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './auth.context';
import { authorizationService } from './authorization.service';
import { 
  PERMISSIONS, 
  ROLES, 
  getUserEffectivePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  createPermissionContext
} from './permissions';
import type { PermissionContext } from '../../types';

/**
 * Hook for checking permissions
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  // Get effective permissions (roles + direct permissions)
  const effectivePermissions = useMemo(() => {
    if (!user) return [];
    return getUserEffectivePermissions(user.roles, user.permissions);
  }, [user]);

  // Check if user has specific permission
  const checkPermission = useCallback((permission: string): boolean => {
    if (!isAuthenticated || !user) return false;
    return hasPermission(effectivePermissions, permission);
  }, [isAuthenticated, user, effectivePermissions]);

  // Check if user has any of the specified permissions
  const checkAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return hasAnyPermission(effectivePermissions, permissions);
  }, [isAuthenticated, user, effectivePermissions]);

  // Check if user has all specified permissions
  const checkAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return hasAllPermissions(effectivePermissions, permissions);
  }, [isAuthenticated, user, effectivePermissions]);

  // Check if user has specific role
  const checkRole = useCallback((role: string): boolean => {
    if (!isAuthenticated || !user) return false;
    return user.roles.includes(role);
  }, [isAuthenticated, user]);

  // Check if user has any of the specified roles
  const checkAnyRole = useCallback((roles: string[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return roles.some(role => user.roles.includes(role));
  }, [isAuthenticated, user]);

  return {
    effectivePermissions,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkRole,
    checkAnyRole,
    isAuthenticated,
    user,
  };
}

/**
 * Hook for async permission checking via API
 */
export function useAsyncPermissions() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState<Map<string, boolean>>(new Map());

  // Check permission via API
  const checkPermissionAsync = useCallback(async (
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    const cacheKey = `${resource}:${action}:${JSON.stringify(context || {})}`;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    setLoading(true);
    try {
      const result = await authorizationService.checkPermission(resource, action, context);
      
      // Update cache
      setCache(prev => new Map(prev).set(cacheKey, result));
      
      return result;
    } catch (error) {
      console.error('Async permission check failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, cache]);

  // Check multiple permissions
  const checkMultiplePermissionsAsync = useCallback(async (
    checks: Array<{ resource: string; action: string; context?: PermissionContext }>
  ): Promise<Record<string, boolean>> => {
    if (!isAuthenticated || !user) {
      return checks.reduce((acc, check) => {
        acc[`${check.resource}:${check.action}`] = false;
        return acc;
      }, {} as Record<string, boolean>);
    }

    setLoading(true);
    try {
      const results = await authorizationService.checkMultiplePermissions(checks);
      
      // Update cache
      setCache(prev => {
        const newCache = new Map(prev);
        Object.entries(results).forEach(([key, value]) => {
          newCache.set(key, value);
        });
        return newCache;
      });
      
      return results;
    } catch (error) {
      console.error('Multiple async permission check failed:', error);
      return checks.reduce((acc, check) => {
        acc[`${check.resource}:${check.action}`] = false;
        return acc;
      }, {} as Record<string, boolean>);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    checkPermissionAsync,
    checkMultiplePermissionsAsync,
    loading,
    clearCache,
  };
}

/**
 * Hook for specific quadro vagas permissions
 */
export function useQuadroPermissions() {
  const { checkPermission, checkAnyPermission, checkRole } = usePermissions();

  return {
    // Dashboard permissions
    canViewDashboard: checkPermission(PERMISSIONS.DASHBOARD.READ),
    canExportDashboard: checkPermission(PERMISSIONS.DASHBOARD.EXPORT),

    // Quadro permissions
    canViewQuadro: checkPermission(PERMISSIONS.QUADRO.READ),
    canCreateVaga: checkPermission(PERMISSIONS.QUADRO.CREATE),
    canUpdateVaga: checkPermission(PERMISSIONS.QUADRO.UPDATE),
    canDeleteVaga: checkPermission(PERMISSIONS.QUADRO.DELETE),
    canExportQuadro: checkPermission(PERMISSIONS.QUADRO.EXPORT),
    canViewQuadroHistory: checkPermission(PERMISSIONS.QUADRO.HISTORY),

    // Proposal permissions
    canViewPropostas: checkPermission(PERMISSIONS.PROPOSTAS.READ),
    canCreateProposta: checkPermission(PERMISSIONS.PROPOSTAS.CREATE),
    canUpdateProposta: checkPermission(PERMISSIONS.PROPOSTAS.UPDATE),
    canDeleteProposta: checkPermission(PERMISSIONS.PROPOSTAS.DELETE),
    canApproveNivel1: checkPermission(PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_1),
    canApproveNivel2: checkPermission(PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_2),
    canApproveNivel3: checkPermission(PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_3),
    canApproveRH: checkPermission(PERMISSIONS.PROPOSTAS.APPROVE_RH),
    canRejectProposta: checkPermission(PERMISSIONS.PROPOSTAS.REJECT),
    canViewPropostaHistory: checkPermission(PERMISSIONS.PROPOSTAS.HISTORY),

    // Normalization permissions
    canViewNormalizacao: checkPermission(PERMISSIONS.NORMALIZACAO.READ),
    canExecuteNormalizacao: checkPermission(PERMISSIONS.NORMALIZACAO.EXECUTE),
    canViewNormalizacaoHistory: checkPermission(PERMISSIONS.NORMALIZACAO.HISTORY),
    canCancelNormalizacao: checkPermission(PERMISSIONS.NORMALIZACAO.CANCEL),

    // Analytics permissions
    canViewAnalytics: checkPermission(PERMISSIONS.ANALYTICS.READ),
    canExportAnalytics: checkPermission(PERMISSIONS.ANALYTICS.EXPORT),
    canViewPcDCompliance: checkPermission(PERMISSIONS.ANALYTICS.PCD_COMPLIANCE),
    canViewComparative: checkPermission(PERMISSIONS.ANALYTICS.COMPARATIVE),

    // Role checks
    isAdmin: checkRole(ROLES.ADMIN),
    isRHManager: checkRole(ROLES.RH_MANAGER),
    isRHAnalyst: checkRole(ROLES.RH_ANALYST),
    isDirector: checkRole(ROLES.DIRECTOR),
    isManager: checkRole(ROLES.MANAGER),
    isCoordinator: checkRole(ROLES.COORDINATOR),
    isAnalyst: checkRole(ROLES.ANALYST),

    // Combined permission checks
    canManageQuadro: checkAnyPermission([
      PERMISSIONS.QUADRO.CREATE,
      PERMISSIONS.QUADRO.UPDATE,
      PERMISSIONS.QUADRO.DELETE,
    ]),

    canApprovePropostas: checkAnyPermission([
      PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_1,
      PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_2,
      PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_3,
      PERMISSIONS.PROPOSTAS.APPROVE_RH,
    ]),

    canManageSystem: checkAnyPermission([
      PERMISSIONS.USERS.ASSIGN_ROLES,
      PERMISSIONS.USERS.MANAGE_PERMISSIONS,
      PERMISSIONS.CONFIG.UPDATE,
    ]),
  };
}

/**
 * Hook for context-aware permissions
 */
export function useContextPermissions(context?: PermissionContext) {
  const { checkPermissionAsync } = useAsyncPermissions();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Check permission with context
  const checkWithContext = useCallback(async (
    resource: string,
    action: string,
    additionalContext?: PermissionContext
  ): Promise<boolean> => {
    const fullContext = { ...context, ...additionalContext };
    return checkPermissionAsync(resource, action, fullContext);
  }, [context, checkPermissionAsync]);

  // Preload common permissions for the context
  const preloadPermissions = useCallback(async (permissionList: string[]) => {
    setLoading(true);
    try {
      const checks = permissionList.map(permission => {
        const [resource, action] = permission.split(':').slice(1); // Remove module prefix
        return { resource: `quadro_vagas:${resource}`, action, context };
      });

      const results = await authorizationService.checkMultiplePermissions(checks);
      setPermissions(results);
    } catch (error) {
      console.error('Failed to preload permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [context]);

  return {
    checkWithContext,
    preloadPermissions,
    permissions,
    loading,
  };
}

/**
 * Hook for permission-based navigation
 */
export function usePermissionNavigation() {
  const { checkPermission } = usePermissions();

  const canNavigateTo = useCallback((route: string): boolean => {
    const routePermissions: Record<string, string> = {
      '/dashboard': PERMISSIONS.DASHBOARD.READ,
      '/quadro': PERMISSIONS.QUADRO.READ,
      '/propostas': PERMISSIONS.PROPOSTAS.READ,
      '/normalizacao': PERMISSIONS.NORMALIZACAO.READ,
      '/analytics': PERMISSIONS.ANALYTICS.READ,
      '/users': PERMISSIONS.USERS.READ,
      '/config': PERMISSIONS.CONFIG.READ,
      '/audit': PERMISSIONS.AUDIT.READ,
      '/integration': PERMISSIONS.INTEGRATION.READ,
    };

    const requiredPermission = routePermissions[route];
    return requiredPermission ? checkPermission(requiredPermission) : true;
  }, [checkPermission]);

  const getAccessibleRoutes = useCallback((): string[] => {
    const routes = [
      '/dashboard',
      '/quadro',
      '/propostas',
      '/normalizacao',
      '/analytics',
      '/users',
      '/config',
      '/audit',
      '/integration',
    ];

    return routes.filter(route => canNavigateTo(route));
  }, [canNavigateTo]);

  return {
    canNavigateTo,
    getAccessibleRoutes,
  };
}