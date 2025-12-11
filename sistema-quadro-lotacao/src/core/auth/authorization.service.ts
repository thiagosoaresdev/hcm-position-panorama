import axios, { type AxiosInstance } from 'axios';
import { platformConfig } from '../config/environment';
import { tokenService } from './token.service';
import type { PermissionContext, User } from '../../types';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface AuthorizationCheckRequest {
  resource: string;
  action: string;
  context?: PermissionContext;
}

export interface AuthorizationCheckResponse {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: string[];
}

export interface UserPermissionsResponse {
  roles: Role[];
  permissions: Permission[];
  effectivePermissions: string[];
}

/**
 * Authorization Service
 * Handles RBAC/ACL integration with Platform Authorization API
 */
export class AuthorizationService {
  private platformAuthzClient: AxiosInstance;
  private permissionCache = new Map<string, { result: boolean; expiry: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.platformAuthzClient = axios.create({
      baseURL: platformConfig.authorization.url,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Check if user has permission for a specific resource and action
   */
  async checkPermission(
    resource: string, 
    action: string, 
    context?: PermissionContext
  ): Promise<boolean> {
    try {
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        return false;
      }

      // Create cache key
      const cacheKey = this.createCacheKey(resource, action, context);
      
      // Check cache first
      const cached = this.permissionCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.result;
      }

      const response = await this.platformAuthzClient.post<AuthorizationCheckResponse>(
        '/authorization/check-permission',
        {
          resource,
          action,
          context: {
            ...context,
            timestamp: new Date().toISOString(),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = response.data.allowed || false;

      // Cache the result
      this.permissionCache.set(cacheKey, {
        result,
        expiry: Date.now() + this.CACHE_TTL,
      });

      return result;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false; // Fail closed - deny access on error
    }
  }

  /**
   * Check multiple permissions at once
   */
  async checkMultiplePermissions(
    checks: AuthorizationCheckRequest[]
  ): Promise<Record<string, boolean>> {
    try {
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        return checks.reduce((acc, check) => {
          acc[`${check.resource}:${check.action}`] = false;
          return acc;
        }, {} as Record<string, boolean>);
      }

      const response = await this.platformAuthzClient.post(
        '/authorization/check-permissions',
        {
          checks: checks.map(check => ({
            resource: check.resource,
            action: check.action,
            context: {
              ...check.context,
              timestamp: new Date().toISOString(),
            },
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const results = response.data.results || {};
      
      // Cache individual results
      checks.forEach((check, index) => {
        const key = `${check.resource}:${check.action}`;
        const result = results[key] || false;
        const cacheKey = this.createCacheKey(check.resource, check.action, check.context);
        
        this.permissionCache.set(cacheKey, {
          result,
          expiry: Date.now() + this.CACHE_TTL,
        });
      });

      return results;
    } catch (error) {
      console.error('Multiple permission check failed:', error);
      return checks.reduce((acc, check) => {
        acc[`${check.resource}:${check.action}`] = false;
        return acc;
      }, {} as Record<string, boolean>);
    }
  }

  /**
   * Get user's roles and permissions
   */
  async getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
    try {
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await this.platformAuthzClient.get<UserPermissionsResponse>(
        `/authorization/users/${userId}/permissions`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return {
        roles: [],
        permissions: [],
        effectivePermissions: [],
      };
    }
  }

  /**
   * Check if user has specific role
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        return false;
      }

      const response = await this.platformAuthzClient.get(
        `/authorization/users/${userId}/roles/${roleName}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.hasRole || false;
    } catch (error) {
      console.error('Role check failed:', error);
      return false;
    }
  }

  /**
   * Get available roles for the system
   */
  async getAvailableRoles(): Promise<Role[]> {
    try {
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        return [];
      }

      const response = await this.platformAuthzClient.get<{ roles: Role[] }>(
        '/authorization/roles',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.roles || [];
    } catch (error) {
      console.error('Failed to get available roles:', error);
      return [];
    }
  }

  /**
   * Get available permissions for the system
   */
  async getAvailablePermissions(): Promise<Permission[]> {
    try {
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        return [];
      }

      const response = await this.platformAuthzClient.get<{ permissions: Permission[] }>(
        '/authorization/permissions',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.permissions || [];
    } catch (error) {
      console.error('Failed to get available permissions:', error);
      return [];
    }
  }

  /**
   * Assign role to user (admin only)
   */
  async assignRole(userId: string, roleId: string): Promise<boolean> {
    try {
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        return false;
      }

      await this.platformAuthzClient.post(
        `/authorization/users/${userId}/roles`,
        { roleId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Clear permission cache for this user
      this.clearUserCache(userId);
      
      return true;
    } catch (error) {
      console.error('Failed to assign role:', error);
      return false;
    }
  }

  /**
   * Remove role from user (admin only)
   */
  async removeRole(userId: string, roleId: string): Promise<boolean> {
    try {
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        return false;
      }

      await this.platformAuthzClient.delete(
        `/authorization/users/${userId}/roles/${roleId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Clear permission cache for this user
      this.clearUserCache(userId);
      
      return true;
    } catch (error) {
      console.error('Failed to remove role:', error);
      return false;
    }
  }

  /**
   * Grant permission to user (admin only)
   */
  async grantPermission(userId: string, permissionId: string): Promise<boolean> {
    try {
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        return false;
      }

      await this.platformAuthzClient.post(
        `/authorization/users/${userId}/permissions`,
        { permissionId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Clear permission cache for this user
      this.clearUserCache(userId);
      
      return true;
    } catch (error) {
      console.error('Failed to grant permission:', error);
      return false;
    }
  }

  /**
   * Revoke permission from user (admin only)
   */
  async revokePermission(userId: string, permissionId: string): Promise<boolean> {
    try {
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        return false;
      }

      await this.platformAuthzClient.delete(
        `/authorization/users/${userId}/permissions/${permissionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Clear permission cache for this user
      this.clearUserCache(userId);
      
      return true;
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      return false;
    }
  }

  /**
   * Clear permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Clear permission cache for specific user
   */
  clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.permissionCache) {
      if (key.includes(`userId:${userId}`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.permissionCache.delete(key));
  }

  /**
   * Create cache key for permission check
   */
  private createCacheKey(resource: string, action: string, context?: PermissionContext): string {
    const contextStr = context ? JSON.stringify(context) : '';
    return `${resource}:${action}:${contextStr}`;
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.platformAuthzClient.interceptors.request.use(
      (config) => {
        // Add request ID for tracing
        config.headers['X-Request-ID'] = crypto.randomUUID();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.platformAuthzClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - emit event for token refresh
          window.dispatchEvent(new CustomEvent('auth:token-expired'));
        } else if (error.response?.status === 403) {
          // Permission denied - emit event for UI handling
          window.dispatchEvent(new CustomEvent('auth:permission-denied', {
            detail: {
              resource: error.config?.data?.resource,
              action: error.config?.data?.action,
            },
          }));
        }
        return Promise.reject(error);
      }
    );
  }
}

// Export singleton instance
export const authorizationService = new AuthorizationService();