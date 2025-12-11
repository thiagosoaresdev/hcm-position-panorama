import axios, { type AxiosInstance } from 'axios';
import { platformConfig } from '../config/environment';
import type { 
  User, 
  AuthTokens, 
  LoginRequest, 
  AuthResponse, 
  TokenResponse, 
  PermissionContext,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest
} from '../../types';

export class AuthService {
  private platformAuthClient: AxiosInstance;
  private platformAuthzClient: AxiosInstance;

  constructor() {
    this.platformAuthClient = axios.create({
      baseURL: platformConfig.auth.url,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
   * OAuth 2.0 Authorization Code Flow - Step 1: Get authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: platformConfig.auth.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'profile email openid',
      ...(state && { state }),
    });

    return `${platformConfig.auth.url}/oauth/authorize?${params.toString()}`;
  }

  /**
   * OAuth 2.0 Authorization Code Flow - Step 2: Exchange code for tokens
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<AuthResponse> {
    try {
      const response = await this.platformAuthClient.post('/oauth/token', {
        grant_type: 'authorization_code',
        client_id: platformConfig.auth.clientId,
        client_secret: platformConfig.auth.clientSecret,
        code,
        redirect_uri: redirectUri,
      });

      const { access_token, refresh_token, expires_in, token_type } = response.data;

      // Get user profile with the access token
      const userProfile = await this.getUserProfile(access_token);

      const tokens: AuthTokens = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        tokenType: token_type || 'Bearer',
      };

      return {
        user: userProfile,
        tokens,
        requiresTwoFactor: userProfile.twoFactorEnabled && !response.data.two_factor_verified,
      };
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Direct login with email/password (fallback for development)
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.platformAuthClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
        two_factor_code: credentials.twoFactorCode,
        client_id: platformConfig.auth.clientId,
        client_secret: platformConfig.auth.clientSecret,
      });

      const { user, access_token, refresh_token, expires_in, requires_two_factor } = response.data;

      const tokens: AuthTokens = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        tokenType: 'Bearer',
      };

      return {
        user: {
          id: user.id,
          nome: user.name || user.nome,
          email: user.email,
          roles: user.roles || [],
          permissions: user.permissions || [],
          empresaId: user.empresa_id,
          centroCustoId: user.centro_custo_id,
          twoFactorEnabled: user.two_factor_enabled || false,
        },
        tokens,
        requiresTwoFactor: requires_two_factor || false,
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await this.platformAuthClient.post('/oauth/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: platformConfig.auth.clientId,
        client_secret: platformConfig.auth.clientSecret,
      });

      const { access_token, refresh_token, expires_in, token_type } = response.data;

      return {
        accessToken: access_token,
        refreshToken: refresh_token || refreshToken, // Keep old refresh token if new one not provided
        expiresIn: expires_in,
        tokenType: token_type || 'Bearer',
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Get user profile from Platform Authentication API
   */
  async getUserProfile(accessToken: string): Promise<User> {
    try {
      const response = await this.platformAuthClient.get('/auth/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const user = response.data;
      return {
        id: user.id,
        nome: user.name || user.nome,
        email: user.email,
        roles: user.roles || [],
        permissions: user.permissions || [],
        empresaId: user.empresa_id,
        centroCustoId: user.centro_custo_id,
        twoFactorEnabled: user.two_factor_enabled || false,
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Check user permission through Platform Authorization API
   */
  async checkPermission(resource: string, context: PermissionContext, accessToken: string): Promise<boolean> {
    try {
      const response = await this.platformAuthzClient.post('/authorization/check-permission', {
        resource,
        context,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data.allowed || false;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false; // Fail closed - deny access on error
    }
  }

  /**
   * Get user roles and permissions
   */
  async getUserPermissions(userId: string, accessToken: string): Promise<{ roles: string[], permissions: string[] }> {
    try {
      const response = await this.platformAuthzClient.get(`/authorization/users/${userId}/permissions`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        roles: response.data.roles || [],
        permissions: response.data.permissions || [],
      };
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return { roles: [], permissions: [] };
    }
  }

  /**
   * Setup 2FA for user
   */
  async setupTwoFactor(accessToken: string): Promise<TwoFactorSetupResponse> {
    try {
      const response = await this.platformAuthClient.post('/auth/2fa/setup', {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        qrCode: response.data.qr_code,
        secret: response.data.secret,
        backupCodes: response.data.backup_codes || [],
      };
    } catch (error) {
      console.error('2FA setup failed:', error);
      throw new Error('Failed to setup two-factor authentication');
    }
  }

  /**
   * Verify 2FA code
   */
  async verifyTwoFactor(request: TwoFactorVerifyRequest, accessToken: string): Promise<boolean> {
    try {
      const response = await this.platformAuthClient.post('/auth/2fa/verify', {
        code: request.code,
        secret: request.secret,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data.verified || false;
    } catch (error) {
      console.error('2FA verification failed:', error);
      return false;
    }
  }

  /**
   * Enable 2FA for user
   */
  async enableTwoFactor(code: string, accessToken: string): Promise<{ backupCodes: string[] }> {
    try {
      const response = await this.platformAuthClient.post('/auth/2fa/enable', {
        code,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        backupCodes: response.data.backup_codes || [],
      };
    } catch (error) {
      console.error('2FA enable failed:', error);
      throw new Error('Failed to enable two-factor authentication');
    }
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(password: string, accessToken: string): Promise<void> {
    try {
      await this.platformAuthClient.post('/auth/2fa/disable', {
        password,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('2FA disable failed:', error);
      throw new Error('Failed to disable two-factor authentication');
    }
  }

  /**
   * Logout user
   */
  async logout(accessToken: string): Promise<void> {
    try {
      await this.platformAuthClient.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Don't throw error on logout failure - still clear local tokens
    }
  }

  /**
   * Validate token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.platformAuthClient.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data.valid || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for authentication client
    this.platformAuthClient.interceptors.request.use(
      (config) => {
        // Add request ID for tracing
        config.headers['X-Request-ID'] = crypto.randomUUID();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for authentication client
    this.platformAuthClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - emit event for token refresh
          window.dispatchEvent(new CustomEvent('auth:token-expired'));
        }
        return Promise.reject(error);
      }
    );

    // Request interceptor for authorization client
    this.platformAuthzClient.interceptors.request.use(
      (config) => {
        config.headers['X-Request-ID'] = crypto.randomUUID();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for authorization client
    this.platformAuthzClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:token-expired'));
        }
        return Promise.reject(error);
      }
    );
  }
}

// Export singleton instance
export const authService = new AuthService();