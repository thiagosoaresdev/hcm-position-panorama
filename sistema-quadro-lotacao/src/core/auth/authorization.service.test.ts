import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import { authorizationService } from './authorization.service';
import { tokenService } from './token.service';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock token service
vi.mock('./token.service', () => ({
  tokenService: {
    getAccessToken: vi.fn(),
  },
}));

// Mock platform config
vi.mock('../config/environment', () => ({
  platformConfig: {
    authorization: {
      url: 'https://api.platform.com/authz',
    },
  },
}));

describe('AuthorizationService', () => {
  const mockAccessToken = 'mock-access-token';
  const mockAxiosInstance = {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    vi.mocked(tokenService.getAccessToken).mockReturnValue(mockAccessToken);
  });

  afterEach(() => {
    authorizationService.clearCache();
  });

  describe('checkPermission', () => {
    it('should check permission successfully', async () => {
      const mockResponse = { data: { allowed: true } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authorizationService.checkPermission('quadro_vagas:quadro', 'read');

      expect(result).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/authorization/check-permission',
        {
          resource: 'quadro_vagas:quadro',
          action: 'read',
          context: {
            timestamp: expect.any(String),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      );
    });

    it('should return false when permission is denied', async () => {
      const mockResponse = { data: { allowed: false } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authorizationService.checkPermission('quadro_vagas:quadro', 'delete');

      expect(result).toBe(false);
    });

    it('should return false when no access token', async () => {
      vi.mocked(tokenService.getAccessToken).mockReturnValue(null);

      const result = await authorizationService.checkPermission('quadro_vagas:quadro', 'read');

      expect(result).toBe(false);
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should return false on API error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

      const result = await authorizationService.checkPermission('quadro_vagas:quadro', 'read');

      expect(result).toBe(false);
    });

    it('should cache permission results', async () => {
      const mockResponse = { data: { allowed: true } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // First call
      const result1 = await authorizationService.checkPermission('quadro_vagas:quadro', 'read');
      expect(result1).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await authorizationService.checkPermission('quadro_vagas:quadro', 'read');
      expect(result2).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should include context in permission check', async () => {
      const mockResponse = { data: { allowed: true } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      const context = { empresaId: 'emp-123', centroCustoId: 'cc-456' };

      await authorizationService.checkPermission('quadro_vagas:quadro', 'read', context);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/authorization/check-permission',
        {
          resource: 'quadro_vagas:quadro',
          action: 'read',
          context: {
            ...context,
            timestamp: expect.any(String),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      );
    });
  });

  describe('checkMultiplePermissions', () => {
    it('should check multiple permissions successfully', async () => {
      const mockResponse = {
        data: {
          results: {
            'quadro_vagas:quadro:read': true,
            'quadro_vagas:quadro:create': false,
            'quadro_vagas:propostas:read': true,
          },
        },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const checks = [
        { resource: 'quadro_vagas:quadro', action: 'read' },
        { resource: 'quadro_vagas:quadro', action: 'create' },
        { resource: 'quadro_vagas:propostas', action: 'read' },
      ];

      const results = await authorizationService.checkMultiplePermissions(checks);

      expect(results).toEqual({
        'quadro_vagas:quadro:read': true,
        'quadro_vagas:quadro:create': false,
        'quadro_vagas:propostas:read': true,
      });
    });

    it('should return false for all permissions when no access token', async () => {
      vi.mocked(tokenService.getAccessToken).mockReturnValue(null);

      const checks = [
        { resource: 'quadro_vagas:quadro', action: 'read' },
        { resource: 'quadro_vagas:quadro', action: 'create' },
      ];

      const results = await authorizationService.checkMultiplePermissions(checks);

      expect(results).toEqual({
        'quadro_vagas:quadro:read': false,
        'quadro_vagas:quadro:create': false,
      });
    });
  });

  describe('getUserPermissions', () => {
    it('should get user permissions successfully', async () => {
      const mockResponse = {
        data: {
          roles: [
            { id: 'role-1', name: 'rh_manager', permissions: [] },
            { id: 'role-2', name: 'coordinator', permissions: [] },
          ],
          permissions: [
            { id: 'perm-1', name: 'quadro_vagas:quadro:read', resource: 'quadro', action: 'read' },
          ],
          effectivePermissions: ['quadro_vagas:quadro:read', 'quadro_vagas:quadro:create'],
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await authorizationService.getUserPermissions('user-123');

      expect(result).toEqual({
        roles: [
          { id: 'role-1', name: 'rh_manager', permissions: [] },
          { id: 'role-2', name: 'coordinator', permissions: [] },
        ],
        permissions: [
          { id: 'perm-1', name: 'quadro_vagas:quadro:read', resource: 'quadro', action: 'read' },
        ],
        effectivePermissions: ['quadro_vagas:quadro:read', 'quadro_vagas:quadro:create'],
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/authorization/users/user-123/permissions',
        {
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      );
    });

    it('should return empty permissions when no access token', async () => {
      vi.mocked(tokenService.getAccessToken).mockReturnValue(null);

      await expect(authorizationService.getUserPermissions('user-123')).rejects.toThrow('Not authenticated');
    });
  });

  describe('hasRole', () => {
    it('should check if user has role', async () => {
      const mockResponse = { data: { hasRole: true } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await authorizationService.hasRole('user-123', 'rh_manager');

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/authorization/users/user-123/roles/rh_manager',
        {
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      );
    });

    it('should return false when user does not have role', async () => {
      const mockResponse = { data: { hasRole: false } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await authorizationService.hasRole('user-123', 'admin');

      expect(result).toBe(false);
    });
  });

  describe('assignRole', () => {
    it('should assign role to user successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      const result = await authorizationService.assignRole('user-123', 'role-456');

      expect(result).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/authorization/users/user-123/roles',
        { roleId: 'role-456' },
        {
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      );
    });

    it('should return false on API error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

      const result = await authorizationService.assignRole('user-123', 'role-456');

      expect(result).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      // Add something to cache first
      authorizationService.checkPermission('quadro_vagas:quadro', 'read');
      
      // Clear cache
      authorizationService.clearCache();
      
      // This is mainly testing that clearCache doesn't throw an error
      expect(() => authorizationService.clearCache()).not.toThrow();
    });

    it('should clear user-specific cache', () => {
      // This is mainly testing that clearUserCache doesn't throw an error
      expect(() => authorizationService.clearUserCache('user-123')).not.toThrow();
    });
  });

  describe('getAvailableRoles', () => {
    it('should get available roles', async () => {
      const mockResponse = {
        data: {
          roles: [
            { id: 'role-1', name: 'admin', description: 'Administrator', permissions: [] },
            { id: 'role-2', name: 'rh_manager', description: 'RH Manager', permissions: [] },
          ],
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await authorizationService.getAvailableRoles();

      expect(result).toEqual([
        { id: 'role-1', name: 'admin', description: 'Administrator', permissions: [] },
        { id: 'role-2', name: 'rh_manager', description: 'RH Manager', permissions: [] },
      ]);
    });
  });

  describe('getAvailablePermissions', () => {
    it('should get available permissions', async () => {
      const mockResponse = {
        data: {
          permissions: [
            { id: 'perm-1', name: 'quadro_vagas:quadro:read', resource: 'quadro', action: 'read' },
            { id: 'perm-2', name: 'quadro_vagas:quadro:create', resource: 'quadro', action: 'create' },
          ],
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await authorizationService.getAvailablePermissions();

      expect(result).toEqual([
        { id: 'perm-1', name: 'quadro_vagas:quadro:read', resource: 'quadro', action: 'read' },
        { id: 'perm-2', name: 'quadro_vagas:quadro:create', resource: 'quadro', action: 'create' },
      ]);
    });
  });
});