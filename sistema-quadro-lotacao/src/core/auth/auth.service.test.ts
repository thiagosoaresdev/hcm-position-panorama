import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { AuthService } from './auth.service';
import { platformConfig } from '../config/environment';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock environment config
vi.mock('../config/environment', () => ({
  platformConfig: {
    auth: {
      url: 'https://api.senior.com.br/auth',
      clientId: 'QUADRO_VAGAS_APP',
      clientSecret: 'test-secret',
    },
    authorization: {
      url: 'https://api.senior.com.br/authorization',
    },
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock axios instance
    mockAxiosInstance = {
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };

    // Mock axios.create to return our mock instance
    mockedAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);

    // Create new AuthService instance
    authService = new AuthService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct OAuth authorization URL', () => {
      const redirectUri = 'http://localhost:3000/callback';
      const state = 'test-state';

      const url = authService.getAuthorizationUrl(redirectUri, state);

      expect(url).toContain('https://api.senior.com.br/auth/oauth/authorize');
      expect(url).toContain('client_id=QUADRO_VAGAS_APP');
      expect(url).toContain('response_type=code');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(url).toContain('scope=profile%20email%20openid');
      expect(url).toContain('state=test-state');
    });

    it('should generate URL without state parameter when not provided', () => {
      const redirectUri = 'http://localhost:3000/callback';

      const url = authService.getAuthorizationUrl(redirectUri);

      expect(url).toContain('https://api.senior.com.br/auth/oauth/authorize');
      expect(url).not.toContain('state=');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should successfully exchange authorization code for tokens', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };

      const mockUserResponse = {
        data: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read'],
          two_factor_enabled: false,
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockTokenResponse);
      mockAxiosInstance.get.mockResolvedValueOnce(mockUserResponse);

      const result = await authService.exchangeCodeForTokens('test-code', 'http://localhost:3000/callback');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/oauth/token', {
        grant_type: 'authorization_code',
        client_id: 'QUADRO_VAGAS_APP',
        client_secret: 'test-secret',
        code: 'test-code',
        redirect_uri: 'http://localhost:3000/callback',
      });

      expect(result.tokens.accessToken).toBe('test-access-token');
      expect(result.tokens.refreshToken).toBe('test-refresh-token');
      expect(result.user.id).toBe('user-123');
      expect(result.requiresTwoFactor).toBe(false);
    });

    it('should handle 2FA requirement', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          two_factor_verified: false,
        },
      };

      const mockUserResponse = {
        data: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read'],
          two_factor_enabled: true,
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockTokenResponse);
      mockAxiosInstance.get.mockResolvedValueOnce(mockUserResponse);

      const result = await authService.exchangeCodeForTokens('test-code', 'http://localhost:3000/callback');

      expect(result.requiresTwoFactor).toBe(true);
    });

    it('should throw error when token exchange fails', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Token exchange failed'));

      await expect(
        authService.exchangeCodeForTokens('invalid-code', 'http://localhost:3000/callback')
      ).rejects.toThrow('Failed to exchange authorization code for tokens');
    });
  });

  describe('login', () => {
    it('should successfully login with email and password', async () => {
      const mockResponse = {
        data: {
          user: {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            roles: ['user'],
            permissions: ['read'],
            two_factor_enabled: false,
          },
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          requires_two_factor: false,
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
        two_factor_code: undefined,
        client_id: 'QUADRO_VAGAS_APP',
        client_secret: 'test-secret',
      });

      expect(result.tokens.accessToken).toBe('test-access-token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.requiresTwoFactor).toBe(false);
    });

    it('should handle 2FA requirement during login', async () => {
      const mockResponse = {
        data: {
          user: {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            roles: ['user'],
            permissions: ['read'],
            two_factor_enabled: true,
          },
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          requires_two_factor: true,
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.requiresTwoFactor).toBe(true);
    });

    it('should throw error when login fails', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Login failed'));

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.refreshToken('old-refresh-token');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/oauth/token', {
        grant_type: 'refresh_token',
        refresh_token: 'old-refresh-token',
        client_id: 'QUADRO_VAGAS_APP',
        client_secret: 'test-secret',
      });

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should keep old refresh token if new one not provided', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.refreshToken('old-refresh-token');

      expect(result.refreshToken).toBe('old-refresh-token');
    });

    it('should throw error when refresh fails', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Refresh failed'));

      await expect(
        authService.refreshToken('invalid-refresh-token')
      ).rejects.toThrow('Failed to refresh token');
    });
  });

  describe('checkPermission', () => {
    it('should return true when user has permission', async () => {
      const mockResponse = {
        data: {
          allowed: true,
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.checkPermission(
        'quadro_vagas:read',
        { empresaId: 'emp-123' },
        'access-token'
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/authorization/check-permission',
        {
          resource: 'quadro_vagas:read',
          context: { empresaId: 'emp-123' },
        },
        {
          headers: {
            Authorization: 'Bearer access-token',
          },
        }
      );

      expect(result).toBe(true);
    });

    it('should return false when user lacks permission', async () => {
      const mockResponse = {
        data: {
          allowed: false,
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.checkPermission(
        'quadro_vagas:write',
        { empresaId: 'emp-123' },
        'access-token'
      );

      expect(result).toBe(false);
    });

    it('should return false when permission check fails', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Permission check failed'));

      const result = await authService.checkPermission(
        'quadro_vagas:read',
        { empresaId: 'emp-123' },
        'access-token'
      );

      expect(result).toBe(false);
    });
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      const mockResponse = {
        data: {
          valid: true,
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await authService.validateToken('valid-token');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/validate', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Invalid token'));

      const result = await authService.validateToken('invalid-token');

      expect(result).toBe(false);
    });
  });
});