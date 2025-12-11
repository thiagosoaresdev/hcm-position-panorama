import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from './auth.service';
import { tokenService } from './token.service';
import { authorizationService } from './authorization.service';
import type { 
  User, 
  LoginRequest, 
  AuthResponse, 
  PermissionContext,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest
} from '../../types';

interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresTwoFactor: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  loginWithCode: (code: string, redirectUri: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  
  // 2FA
  setupTwoFactor: () => Promise<TwoFactorSetupResponse>;
  verifyTwoFactor: (request: TwoFactorVerifyRequest) => Promise<boolean>;
  enableTwoFactor: (code: string) => Promise<{ backupCodes: string[] }>;
  disableTwoFactor: (password: string) => Promise<void>;

  // Permissions
  hasPermission: (permission: string, context?: PermissionContext) => boolean;
  hasRole: (role: string) => boolean;
  checkPermission: (resource: string, action: string, context?: PermissionContext) => Promise<boolean>;
  getUserPermissions: () => Promise<{ roles: string[], permissions: string[] }>;
  clearPermissionCache: () => void;

  // Utilities
  getAuthorizationHeader: () => string | null;
  isTokenExpired: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const isAuthenticated = !!user && tokenService.hasTokens() && !tokenService.isTokenExpired();

  /**
   * Initialize authentication state on app load
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if we have stored tokens
      const tokens = tokenService.getTokens();
      if (!tokens || tokenService.isTokenExpired()) {
        setUser(null);
        tokenService.clearTokens();
        return;
      }

      // Validate token and get user profile
      const isValid = await authService.validateToken(tokens.accessToken);
      if (!isValid) {
        // Try to refresh token
        const refreshed = await refreshToken();
        if (!refreshed) {
          setUser(null);
          tokenService.clearTokens();
          return;
        }
      }

      // Get user profile
      const userProfile = await authService.getUserProfile(tokens.accessToken);
      setUser(userProfile);
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setUser(null);
      tokenService.clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login with email/password
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);

      if (response.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        // Don't store tokens yet - wait for 2FA verification
        return response;
      }

      // Store tokens and set user
      tokenService.setTokens(response.tokens);
      setUser(response.user);
      setRequiresTwoFactor(false);

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login with OAuth authorization code
   */
  const loginWithCode = useCallback(async (code: string, redirectUri: string): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response = await authService.exchangeCodeForTokens(code, redirectUri);

      if (response.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        return response;
      }

      tokenService.setTokens(response.tokens);
      setUser(response.user);
      setRequiresTwoFactor(false);

      return response;
    } catch (error) {
      console.error('OAuth login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      const accessToken = tokenService.getAccessToken();
      if (accessToken) {
        await authService.logout(accessToken);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always clear local state
      tokenService.clearTokens();
      setUser(null);
      setRequiresTwoFactor(false);
    }
  }, []);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = tokenService.getRefreshToken();
      if (!refreshTokenValue) {
        return false;
      }

      const newTokens = await authService.refreshToken(refreshTokenValue);
      tokenService.updateAccessToken(newTokens.accessToken, newTokens.expiresIn);

      // Update refresh token if provided
      if (newTokens.refreshToken !== refreshTokenValue) {
        tokenService.setTokens(newTokens);
      }

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      tokenService.clearTokens();
      setUser(null);
      return false;
    }
  }, []);

  /**
   * Setup 2FA
   */
  const setupTwoFactor = useCallback(async (): Promise<TwoFactorSetupResponse> => {
    const accessToken = tokenService.getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    return authService.setupTwoFactor(accessToken);
  }, []);

  /**
   * Verify 2FA code
   */
  const verifyTwoFactor = useCallback(async (request: TwoFactorVerifyRequest): Promise<boolean> => {
    const accessToken = tokenService.getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const verified = await authService.verifyTwoFactor(request, accessToken);
    if (verified) {
      setRequiresTwoFactor(false);
    }

    return verified;
  }, []);

  /**
   * Enable 2FA
   */
  const enableTwoFactor = useCallback(async (code: string): Promise<{ backupCodes: string[] }> => {
    const accessToken = tokenService.getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const result = await authService.enableTwoFactor(code, accessToken);
    
    // Update user profile to reflect 2FA enabled
    if (user) {
      setUser({ ...user, twoFactorEnabled: true });
    }

    return result;
  }, [user]);

  /**
   * Disable 2FA
   */
  const disableTwoFactor = useCallback(async (password: string): Promise<void> => {
    const accessToken = tokenService.getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    await authService.disableTwoFactor(password, accessToken);
    
    // Update user profile to reflect 2FA disabled
    if (user) {
      setUser({ ...user, twoFactorEnabled: false });
    }
  }, [user]);

  /**
   * Check if user has permission (local check)
   */
  const hasPermission = useCallback((permission: string, context?: PermissionContext): boolean => {
    if (!user) return false;

    // Check if user has the permission directly
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Check role-based permissions (simplified - in real app, this would be more complex)
    const rolePermissions: Record<string, string[]> = {
      'admin': ['*'], // Admin has all permissions
      'rh_manager': [
        'quadro_vagas:quadro:read',
        'quadro_vagas:quadro:create',
        'quadro_vagas:quadro:update',
        'quadro_vagas:quadro:delete',
        'quadro_vagas:propostas:approve',
        'quadro_vagas:normalizacao:execute',
        'quadro_vagas:analytics:read'
      ],
      'coordinator': [
        'quadro_vagas:quadro:read',
        'quadro_vagas:propostas:create',
        'quadro_vagas:propostas:read',
        'quadro_vagas:analytics:read'
      ],
      'analyst': [
        'quadro_vagas:quadro:read',
        'quadro_vagas:analytics:read'
      ]
    };

    return user.roles.some(role => {
      const permissions = rolePermissions[role] || [];
      return permissions.includes('*') || permissions.includes(permission);
    });
  }, [user]);

  /**
   * Check if user has role
   */
  const hasRole = useCallback((role: string): boolean => {
    return user?.roles.includes(role) || false;
  }, [user]);

  /**
   * Check permission via API (for complex permissions)
   */
  const checkPermission = useCallback(async (resource: string, action: string, context?: PermissionContext): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      return false;
    }

    return authorizationService.checkPermission(resource, action, context);
  }, [isAuthenticated, user]);

  /**
   * Get user permissions from API
   */
  const getUserPermissions = useCallback(async (): Promise<{ roles: string[], permissions: string[] }> => {
    if (!user) {
      return { roles: [], permissions: [] };
    }

    try {
      const result = await authorizationService.getUserPermissions(user.id);
      return {
        roles: result.roles.map(role => role.name),
        permissions: result.effectivePermissions,
      };
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return { roles: [], permissions: [] };
    }
  }, [user]);

  /**
   * Clear permission cache
   */
  const clearPermissionCache = useCallback(() => {
    authorizationService.clearCache();
  }, []);

  /**
   * Get authorization header
   */
  const getAuthorizationHeader = useCallback((): string | null => {
    return tokenService.getAuthorizationHeader();
  }, []);

  /**
   * Check if token is expired
   */
  const isTokenExpired = useCallback((): boolean => {
    return tokenService.isTokenExpired();
  }, []);

  // Set up event listeners for token management
  useEffect(() => {
    const handleTokenExpired = () => {
      setUser(null);
      tokenService.clearTokens();
    };

    const handleTokenRefreshNeeded = async () => {
      await refreshToken();
    };

    window.addEventListener('auth:token-expired', handleTokenExpired);
    window.addEventListener('auth:token-refresh-needed', handleTokenRefreshNeeded);

    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
      window.removeEventListener('auth:token-refresh-needed', handleTokenRefreshNeeded);
    };
  }, [refreshToken]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const contextValue: AuthContextType = {
    // State
    user,
    isAuthenticated,
    isLoading,
    requiresTwoFactor,

    // Actions
    login,
    loginWithCode,
    logout,
    refreshToken,

    // 2FA
    setupTwoFactor,
    verifyTwoFactor,
    enableTwoFactor,
    disableTwoFactor,

    // Permissions
    hasPermission,
    hasRole,
    checkPermission,
    getUserPermissions,
    clearPermissionCache,

    // Utilities
    getAuthorizationHeader,
    isTokenExpired,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}