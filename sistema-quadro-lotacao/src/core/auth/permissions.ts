/**
 * Permission constants for Sistema de Gestão de Quadro de Lotação
 * Based on requirements 6.1 and 6.4
 */

// Permission structure: module:resource:action
export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD: {
    READ: 'quadro_vagas:dashboard:read',
    EXPORT: 'quadro_vagas:dashboard:export',
  },

  // Quadro de Lotação permissions
  QUADRO: {
    READ: 'quadro_vagas:quadro:read',
    CREATE: 'quadro_vagas:quadro:create',
    UPDATE: 'quadro_vagas:quadro:update',
    DELETE: 'quadro_vagas:quadro:delete',
    EXPORT: 'quadro_vagas:quadro:export',
    HISTORY: 'quadro_vagas:quadro:history',
  },

  // Propostas permissions
  PROPOSTAS: {
    READ: 'quadro_vagas:propostas:read',
    CREATE: 'quadro_vagas:propostas:create',
    UPDATE: 'quadro_vagas:propostas:update',
    DELETE: 'quadro_vagas:propostas:delete',
    APPROVE_NIVEL_1: 'quadro_vagas:propostas:approve_nivel_1',
    APPROVE_NIVEL_2: 'quadro_vagas:propostas:approve_nivel_2',
    APPROVE_NIVEL_3: 'quadro_vagas:propostas:approve_nivel_3',
    APPROVE_RH: 'quadro_vagas:propostas:approve_rh',
    REJECT: 'quadro_vagas:propostas:reject',
    HISTORY: 'quadro_vagas:propostas:history',
  },

  // Normalização permissions
  NORMALIZACAO: {
    READ: 'quadro_vagas:normalizacao:read',
    EXECUTE: 'quadro_vagas:normalizacao:execute',
    HISTORY: 'quadro_vagas:normalizacao:history',
    CANCEL: 'quadro_vagas:normalizacao:cancel',
  },

  // Analytics permissions
  ANALYTICS: {
    READ: 'quadro_vagas:analytics:read',
    EXPORT: 'quadro_vagas:analytics:export',
    PCD_COMPLIANCE: 'quadro_vagas:analytics:pcd_compliance',
    COMPARATIVE: 'quadro_vagas:analytics:comparative',
  },

  // User management permissions
  USERS: {
    READ: 'quadro_vagas:users:read',
    CREATE: 'quadro_vagas:users:create',
    UPDATE: 'quadro_vagas:users:update',
    DELETE: 'quadro_vagas:users:delete',
    ASSIGN_ROLES: 'quadro_vagas:users:assign_roles',
    MANAGE_PERMISSIONS: 'quadro_vagas:users:manage_permissions',
  },

  // Configuration permissions
  CONFIG: {
    READ: 'quadro_vagas:config:read',
    UPDATE: 'quadro_vagas:config:update',
    WORKFLOW: 'quadro_vagas:config:workflow',
    NOTIFICATIONS: 'quadro_vagas:config:notifications',
  },

  // Audit permissions
  AUDIT: {
    READ: 'quadro_vagas:audit:read',
    EXPORT: 'quadro_vagas:audit:export',
    SEARCH: 'quadro_vagas:audit:search',
  },

  // Integration permissions
  INTEGRATION: {
    READ: 'quadro_vagas:integration:read',
    CONFIGURE: 'quadro_vagas:integration:configure',
    MONITOR: 'quadro_vagas:integration:monitor',
    REPROCESS: 'quadro_vagas:integration:reprocess',
  },
} as const;

// Role definitions based on business requirements
export const ROLES = {
  ADMIN: 'admin',
  RH_MANAGER: 'rh_manager',
  RH_ANALYST: 'rh_analyst',
  COORDINATOR: 'coordinator',
  MANAGER: 'manager',
  DIRECTOR: 'director',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
} as const;

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS.DASHBOARD),
    ...Object.values(PERMISSIONS.QUADRO),
    ...Object.values(PERMISSIONS.PROPOSTAS),
    ...Object.values(PERMISSIONS.NORMALIZACAO),
    ...Object.values(PERMISSIONS.ANALYTICS),
    ...Object.values(PERMISSIONS.USERS),
    ...Object.values(PERMISSIONS.CONFIG),
    ...Object.values(PERMISSIONS.AUDIT),
    ...Object.values(PERMISSIONS.INTEGRATION),
  ],

  [ROLES.RH_MANAGER]: [
    // RH Manager - full access to HR functions
    ...Object.values(PERMISSIONS.DASHBOARD),
    ...Object.values(PERMISSIONS.QUADRO),
    ...Object.values(PERMISSIONS.PROPOSTAS),
    ...Object.values(PERMISSIONS.NORMALIZACAO),
    ...Object.values(PERMISSIONS.ANALYTICS),
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.CONFIG.READ,
    PERMISSIONS.CONFIG.WORKFLOW,
    PERMISSIONS.CONFIG.NOTIFICATIONS,
    ...Object.values(PERMISSIONS.AUDIT),
    PERMISSIONS.INTEGRATION.READ,
    PERMISSIONS.INTEGRATION.MONITOR,
    PERMISSIONS.INTEGRATION.REPROCESS,
  ],

  [ROLES.RH_ANALYST]: [
    // RH Analyst - operational HR functions
    PERMISSIONS.DASHBOARD.READ,
    ...Object.values(PERMISSIONS.QUADRO),
    PERMISSIONS.PROPOSTAS.READ,
    PERMISSIONS.PROPOSTAS.CREATE,
    PERMISSIONS.PROPOSTAS.UPDATE,
    PERMISSIONS.PROPOSTAS.APPROVE_RH,
    PERMISSIONS.PROPOSTAS.HISTORY,
    PERMISSIONS.NORMALIZACAO.READ,
    PERMISSIONS.NORMALIZACAO.EXECUTE,
    PERMISSIONS.NORMALIZACAO.HISTORY,
    ...Object.values(PERMISSIONS.ANALYTICS),
    PERMISSIONS.AUDIT.READ,
    PERMISSIONS.AUDIT.SEARCH,
    PERMISSIONS.INTEGRATION.READ,
    PERMISSIONS.INTEGRATION.MONITOR,
  ],

  [ROLES.DIRECTOR]: [
    // Director - strategic view and final approvals
    PERMISSIONS.DASHBOARD.READ,
    PERMISSIONS.DASHBOARD.EXPORT,
    PERMISSIONS.QUADRO.READ,
    PERMISSIONS.QUADRO.HISTORY,
    PERMISSIONS.PROPOSTAS.READ,
    PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_3,
    PERMISSIONS.PROPOSTAS.REJECT,
    PERMISSIONS.PROPOSTAS.HISTORY,
    ...Object.values(PERMISSIONS.ANALYTICS),
    PERMISSIONS.AUDIT.READ,
    PERMISSIONS.AUDIT.SEARCH,
  ],

  [ROLES.MANAGER]: [
    // Manager - departmental management
    PERMISSIONS.DASHBOARD.READ,
    PERMISSIONS.QUADRO.READ,
    PERMISSIONS.QUADRO.HISTORY,
    PERMISSIONS.PROPOSTAS.READ,
    PERMISSIONS.PROPOSTAS.CREATE,
    PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_2,
    PERMISSIONS.PROPOSTAS.REJECT,
    PERMISSIONS.PROPOSTAS.HISTORY,
    PERMISSIONS.ANALYTICS.READ,
    PERMISSIONS.ANALYTICS.COMPARATIVE,
    PERMISSIONS.AUDIT.READ,
  ],

  [ROLES.COORDINATOR]: [
    // Coordinator - team coordination
    PERMISSIONS.DASHBOARD.READ,
    PERMISSIONS.QUADRO.READ,
    PERMISSIONS.PROPOSTAS.READ,
    PERMISSIONS.PROPOSTAS.CREATE,
    PERMISSIONS.PROPOSTAS.UPDATE,
    PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_1,
    PERMISSIONS.PROPOSTAS.HISTORY,
    PERMISSIONS.ANALYTICS.READ,
    PERMISSIONS.AUDIT.READ,
  ],

  [ROLES.ANALYST]: [
    // Analyst - data analysis and reporting
    PERMISSIONS.DASHBOARD.READ,
    PERMISSIONS.QUADRO.READ,
    PERMISSIONS.PROPOSTAS.READ,
    ...Object.values(PERMISSIONS.ANALYTICS),
    PERMISSIONS.AUDIT.READ,
    PERMISSIONS.AUDIT.SEARCH,
  ],

  [ROLES.VIEWER]: [
    // Viewer - read-only access
    PERMISSIONS.DASHBOARD.READ,
    PERMISSIONS.QUADRO.READ,
    PERMISSIONS.PROPOSTAS.READ,
    PERMISSIONS.ANALYTICS.READ,
  ],
};

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  DASHBOARD_ACCESS: [
    PERMISSIONS.DASHBOARD.READ,
  ],

  QUADRO_MANAGEMENT: [
    PERMISSIONS.QUADRO.READ,
    PERMISSIONS.QUADRO.CREATE,
    PERMISSIONS.QUADRO.UPDATE,
    PERMISSIONS.QUADRO.DELETE,
  ],

  PROPOSAL_WORKFLOW: [
    PERMISSIONS.PROPOSTAS.READ,
    PERMISSIONS.PROPOSTAS.CREATE,
    PERMISSIONS.PROPOSTAS.UPDATE,
    PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_1,
    PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_2,
    PERMISSIONS.PROPOSTAS.APPROVE_NIVEL_3,
    PERMISSIONS.PROPOSTAS.APPROVE_RH,
  ],

  NORMALIZATION_CONTROL: [
    PERMISSIONS.NORMALIZACAO.READ,
    PERMISSIONS.NORMALIZACAO.EXECUTE,
    PERMISSIONS.NORMALIZACAO.CANCEL,
  ],

  ANALYTICS_ACCESS: [
    PERMISSIONS.ANALYTICS.READ,
    PERMISSIONS.ANALYTICS.EXPORT,
    PERMISSIONS.ANALYTICS.PCD_COMPLIANCE,
    PERMISSIONS.ANALYTICS.COMPARATIVE,
  ],

  SYSTEM_ADMIN: [
    PERMISSIONS.USERS.ASSIGN_ROLES,
    PERMISSIONS.USERS.MANAGE_PERMISSIONS,
    PERMISSIONS.CONFIG.UPDATE,
    PERMISSIONS.INTEGRATION.CONFIGURE,
  ],
} as const;

// Helper functions
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

export function getRolePermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function getUserEffectivePermissions(userRoles: string[], userPermissions: string[]): string[] {
  const rolePermissions = userRoles.flatMap(role => getRolePermissions(role));
  return [...new Set([...rolePermissions, ...userPermissions])];
}

// Permission validation helpers
export function validatePermissionFormat(permission: string): boolean {
  const parts = permission.split(':');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

export function parsePermission(permission: string): { module: string; resource: string; action: string } | null {
  if (!validatePermissionFormat(permission)) {
    return null;
  }

  const [module, resource, action] = permission.split(':');
  return { module, resource, action };
}

// Context-aware permission checking
export function createPermissionContext(
  empresaId?: string,
  centroCustoId?: string,
  userId?: string,
  additionalContext?: Record<string, any>
): PermissionContext {
  return {
    empresaId,
    centroCustoId,
    userId,
    ...additionalContext,
  };
}

export type PermissionKey = keyof typeof PERMISSIONS;
export type RoleKey = keyof typeof ROLES;