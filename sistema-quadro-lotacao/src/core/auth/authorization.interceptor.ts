import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { tokenService } from './token.service';
import { authorizationService } from './authorization.service';
import type { PermissionContext } from '../../types';

export interface AuthorizedRequestConfig extends AxiosRequestConfig {
  requiresPermission?: {
    resource: string;
    action: string;
    context?: PermissionContext;
  };
  skipAuthCheck?: boolean;
  retryOnPermissionDenied?: boolean;
}

/**
 * Authorization Interceptor
 * Automatically handles authorization for API requests
 */
export class AuthorizationInterceptor {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth headers and check permissions
    this.axiosInstance.interceptors.request.use(
      async (config: AuthorizedRequestConfig) => {
        // Skip auth check if explicitly disabled
        if (config.skipAuthCheck) {
          return config;
        }

        // Add authorization header
        const authHeader = tokenService.getAuthorizationHeader();
        if (authHeader) {
          config.headers = config.headers || {};
          config.headers.Authorization = authHeader;
        }

        // Add request ID for tracing
        config.headers = config.headers || {};
        config.headers['X-Request-ID'] = crypto.randomUUID();

        // Add user context if available
        const accessToken = tokenService.getAccessToken();
        if (accessToken) {
          try {
            // Decode token to get user info (simplified - in real app, use proper JWT library)
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            config.headers['X-User-ID'] = payload.sub || payload.user_id;
            config.headers['X-User-Email'] = payload.email;
          } catch (error) {
            // Ignore token decode errors
          }
        }

        // Check permissions if required
        if (config.requiresPermission) {
          const { resource, action, context } = config.requiresPermission;
          
          try {
            const hasPermission = await authorizationService.checkPermission(resource, action, context);
            
            if (!hasPermission) {
              const error = new Error('Insufficient permissions');
              (error as any).code = 'PERMISSION_DENIED';
              (error as any).resource = resource;
              (error as any).action = action;
              (error as any).context = context;
              throw error;
            }
          } catch (error) {
            if ((error as any).code === 'PERMISSION_DENIED') {
              throw error;
            }
            // Log permission check error but don't block request
            console.warn('Permission check failed, proceeding with request:', error);
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle auth errors
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config as AuthorizedRequestConfig;

        // Handle 401 Unauthorized - token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const refreshToken = tokenService.getRefreshToken();
            if (refreshToken) {
              const newTokens = await this.refreshToken(refreshToken);
              tokenService.updateAccessToken(newTokens.accessToken, newTokens.expiresIn);

              // Update authorization header and retry request
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - redirect to login
            this.handleAuthenticationFailure();
            return Promise.reject(refreshError);
          }
        }

        // Handle 403 Forbidden - permission denied
        if (error.response?.status === 403) {
          this.handlePermissionDenied(error, originalRequest);
        }

        // Handle network errors
        if (!error.response) {
          this.handleNetworkError(error);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh access token
   */
  private async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await axios.post('/oauth/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Handle authentication failure
   */
  private handleAuthenticationFailure(): void {
    // Clear tokens
    tokenService.clearTokens();

    // Emit event for app to handle
    window.dispatchEvent(new CustomEvent('auth:authentication-failed', {
      detail: {
        message: 'Authentication failed. Please log in again.',
        redirectTo: '/login',
      },
    }));
  }

  /**
   * Handle permission denied
   */
  private handlePermissionDenied(error: any, originalRequest: AuthorizedRequestConfig): void {
    const permissionInfo = originalRequest.requiresPermission || {
      resource: 'unknown',
      action: 'unknown',
    };

    // Emit event for app to handle
    window.dispatchEvent(new CustomEvent('auth:permission-denied', {
      detail: {
        message: 'You do not have permission to perform this action.',
        resource: permissionInfo.resource,
        action: permissionInfo.action,
        context: permissionInfo.context,
        error: error.response?.data,
      },
    }));

    // Log for debugging
    console.warn('Permission denied:', {
      url: originalRequest.url,
      method: originalRequest.method,
      resource: permissionInfo.resource,
      action: permissionInfo.action,
      response: error.response?.data,
    });
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(error: any): void {
    // Emit event for app to handle
    window.dispatchEvent(new CustomEvent('auth:network-error', {
      detail: {
        message: 'Network error occurred. Please check your connection.',
        error: error.message,
      },
    }));
  }
}

/**
 * Create axios instance with authorization interceptor
 */
export function createAuthorizedAxiosInstance(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Apply authorization interceptor
  new AuthorizationInterceptor(instance);

  return instance;
}

/**
 * Helper function to make authorized requests
 */
export async function makeAuthorizedRequest<T = any>(
  config: AuthorizedRequestConfig
): Promise<AxiosResponse<T>> {
  const instance = createAuthorizedAxiosInstance(config.baseURL || '');
  return instance.request<T>(config);
}

/**
 * Helper functions for common HTTP methods with authorization
 */
export const authorizedApi = {
  get: <T = any>(
    url: string,
    config?: AuthorizedRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return makeAuthorizedRequest<T>({ ...config, method: 'GET', url });
  },

  post: <T = any>(
    url: string,
    data?: any,
    config?: AuthorizedRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return makeAuthorizedRequest<T>({ ...config, method: 'POST', url, data });
  },

  put: <T = any>(
    url: string,
    data?: any,
    config?: AuthorizedRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return makeAuthorizedRequest<T>({ ...config, method: 'PUT', url, data });
  },

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AuthorizedRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return makeAuthorizedRequest<T>({ ...config, method: 'PATCH', url, data });
  },

  delete: <T = any>(
    url: string,
    config?: AuthorizedRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return makeAuthorizedRequest<T>({ ...config, method: 'DELETE', url });
  },
};

/**
 * Permission-aware API helpers
 */
export const permissionAwareApi = {
  // Quadro operations
  getQuadro: (filters?: any, context?: PermissionContext) =>
    authorizedApi.get('/api/quadro', {
      params: filters,
      requiresPermission: {
        resource: 'quadro_vagas:quadro',
        action: 'read',
        context,
      },
    }),

  createVaga: (data: any, context?: PermissionContext) =>
    authorizedApi.post('/api/quadro/vagas', data, {
      requiresPermission: {
        resource: 'quadro_vagas:quadro',
        action: 'create',
        context,
      },
    }),

  updateVaga: (id: string, data: any, context?: PermissionContext) =>
    authorizedApi.put(`/api/quadro/vagas/${id}`, data, {
      requiresPermission: {
        resource: 'quadro_vagas:quadro',
        action: 'update',
        context,
      },
    }),

  deleteVaga: (id: string, context?: PermissionContext) =>
    authorizedApi.delete(`/api/quadro/vagas/${id}`, {
      requiresPermission: {
        resource: 'quadro_vagas:quadro',
        action: 'delete',
        context,
      },
    }),

  // Proposal operations
  getPropostas: (filters?: any, context?: PermissionContext) =>
    authorizedApi.get('/api/propostas', {
      params: filters,
      requiresPermission: {
        resource: 'quadro_vagas:propostas',
        action: 'read',
        context,
      },
    }),

  createProposta: (data: any, context?: PermissionContext) =>
    authorizedApi.post('/api/propostas', data, {
      requiresPermission: {
        resource: 'quadro_vagas:propostas',
        action: 'create',
        context,
      },
    }),

  approveProposta: (id: string, data: any, context?: PermissionContext) =>
    authorizedApi.post(`/api/propostas/${id}/approve`, data, {
      requiresPermission: {
        resource: 'quadro_vagas:propostas',
        action: 'approve',
        context,
      },
    }),

  // Normalization operations
  executeNormalizacao: (data: any, context?: PermissionContext) =>
    authorizedApi.post('/api/normalizacao/execute', data, {
      requiresPermission: {
        resource: 'quadro_vagas:normalizacao',
        action: 'execute',
        context,
      },
    }),

  // Analytics operations
  getAnalytics: (filters?: any, context?: PermissionContext) =>
    authorizedApi.get('/api/analytics', {
      params: filters,
      requiresPermission: {
        resource: 'quadro_vagas:analytics',
        action: 'read',
        context,
      },
    }),
};