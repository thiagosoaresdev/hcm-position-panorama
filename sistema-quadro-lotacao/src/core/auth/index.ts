// Services
export { AuthService, authService } from './auth.service';
export { TokenService, tokenService } from './token.service';
export { AuthorizationService, authorizationService } from './authorization.service';

// HTTP Client
export { 
  AuthenticatedHttpClient, 
  httpClient, 
  createHttpClient, 
  setupAxiosDefaults 
} from './auth.interceptor';

// Authorization HTTP Client
export { 
  AuthorizationInterceptor,
  createAuthorizedAxiosInstance,
  makeAuthorizedRequest,
  authorizedApi,
  permissionAwareApi
} from './authorization.interceptor';

// React Components and Hooks
export { AuthProvider, useAuth } from './auth.context';
export { 
  AuthGuard, 
  PermissionGuard, 
  ResourceGuard,
  RoleGuard,
  useAuthNavigation, 
  withAuthGuard, 
  withPermissionGuard 
} from './auth.guard';

// Permission Hooks
export { 
  usePermissions, 
  useAsyncPermissions, 
  useQuadroPermissions,
  useContextPermissions,
  usePermissionNavigation
} from './usePermissions';

// Permission Constants and Utilities
export { 
  PERMISSIONS, 
  ROLES, 
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  getUserEffectivePermissions,
  createPermissionContext
} from './permissions';

// Types (re-export from types/index.ts for convenience)
export type {
  User,
  AuthTokens,
  LoginRequest,
  AuthResponse,
  TokenResponse,
  PermissionContext,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest
} from '../../types';