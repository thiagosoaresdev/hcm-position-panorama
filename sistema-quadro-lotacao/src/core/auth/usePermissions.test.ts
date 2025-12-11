import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePermissions, useQuadroPermissions } from './usePermissions';
import { useAuth } from './auth.context';
import { PERMISSIONS, ROLES } from './permissions';

// Mock the auth context
vi.mock('./auth.context', () => ({
  useAuth: vi.fn(),
}));

describe('usePermissions', () => {
  const mockUser = {
    id: 'user-123',
    nome: 'Test User',
    email: 'test@example.com',
    roles: ['rh_manager', 'coordinator'],
    permissions: ['quadro_vagas:quadro:read', 'quadro_vagas:propostas:create'],
    empresaId: 'emp-123',
    centroCustoId: 'cc-456',
    twoFactorEnabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        requiresTwoFactor: false,
        login: vi.fn(),
        loginWithCode: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setupTwoFactor: vi.fn(),
        verifyTwoFactor: vi.fn(),
        enableTwoFactor: vi.fn(),
        disableTwoFactor: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
        checkPermission: vi.fn(),
        getUserPermissions: vi.fn(),
        clearPermissionCache: vi.fn(),
        getAuthorizationHeader: vi.fn(),
        isTokenExpired: vi.fn(),
      });
    });

    it('should return effective permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.effectivePermissions).toContain('quadro_vagas:quadro:read');
      expect(result.current.effectivePermissions).toContain('quadro_vagas:propostas:create');
      // Should also include permissions from roles
      expect(result.current.effectivePermissions.length).toBeGreaterThan(2);
    });

    it('should check single permission correctly', () => {
      const { result } = renderHook(() => usePermissions());

      // User has this permission directly
      expect(result.current.checkPermission('quadro_vagas:quadro:read')).toBe(true);
      
      // User doesn't have this permission
      expect(result.current.checkPermission('quadro_vagas:users:delete')).toBe(false);
    });

    it('should check any permission correctly', () => {
      const { result } = renderHook(() => usePermissions());

      // User has at least one of these permissions
      expect(result.current.checkAnyPermission([
        'quadro_vagas:quadro:read',
        'quadro_vagas:users:delete'
      ])).toBe(true);

      // User has none of these permissions
      expect(result.current.checkAnyPermission([
        'quadro_vagas:users:delete',
        'quadro_vagas:config:update'
      ])).toBe(false);
    });

    it('should check all permissions correctly', () => {
      const { result } = renderHook(() => usePermissions());

      // User has both permissions (one direct, one from role)
      expect(result.current.checkAllPermissions([
        'quadro_vagas:quadro:read',
        'quadro_vagas:propostas:read' // This should come from role
      ])).toBe(true);

      // User doesn't have all permissions
      expect(result.current.checkAllPermissions([
        'quadro_vagas:quadro:read',
        'quadro_vagas:users:delete'
      ])).toBe(false);
    });

    it('should check role correctly', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.checkRole('rh_manager')).toBe(true);
      expect(result.current.checkRole('admin')).toBe(false);
    });

    it('should check any role correctly', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.checkAnyRole(['admin', 'rh_manager'])).toBe(true);
      expect(result.current.checkAnyRole(['admin', 'viewer'])).toBe(false);
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        requiresTwoFactor: false,
        login: vi.fn(),
        loginWithCode: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setupTwoFactor: vi.fn(),
        verifyTwoFactor: vi.fn(),
        enableTwoFactor: vi.fn(),
        disableTwoFactor: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
        checkPermission: vi.fn(),
        getUserPermissions: vi.fn(),
        clearPermissionCache: vi.fn(),
        getAuthorizationHeader: vi.fn(),
        isTokenExpired: vi.fn(),
      });
    });

    it('should return empty effective permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.effectivePermissions).toEqual([]);
    });

    it('should return false for all permission checks', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.checkPermission('quadro_vagas:quadro:read')).toBe(false);
      expect(result.current.checkAnyPermission(['quadro_vagas:quadro:read'])).toBe(false);
      expect(result.current.checkAllPermissions(['quadro_vagas:quadro:read'])).toBe(false);
      expect(result.current.checkRole('rh_manager')).toBe(false);
      expect(result.current.checkAnyRole(['rh_manager'])).toBe(false);
    });
  });
});

describe('useQuadroPermissions', () => {
  const mockUser = {
    id: 'user-123',
    nome: 'RH Manager',
    email: 'rh@example.com',
    roles: ['rh_manager'],
    permissions: [],
    empresaId: 'emp-123',
    centroCustoId: 'cc-456',
    twoFactorEnabled: false,
  };

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      requiresTwoFactor: false,
      login: vi.fn(),
      loginWithCode: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      setupTwoFactor: vi.fn(),
      verifyTwoFactor: vi.fn(),
      enableTwoFactor: vi.fn(),
      disableTwoFactor: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      checkPermission: vi.fn(),
      getUserPermissions: vi.fn(),
      clearPermissionCache: vi.fn(),
      getAuthorizationHeader: vi.fn(),
      isTokenExpired: vi.fn(),
    });
  });

  it('should provide quadro-specific permission checks', () => {
    const { result } = renderHook(() => useQuadroPermissions());

    // RH Manager should have most permissions
    expect(result.current.canViewDashboard).toBe(true);
    expect(result.current.canViewQuadro).toBe(true);
    expect(result.current.canCreateVaga).toBe(true);
    expect(result.current.canUpdateVaga).toBe(true);
    expect(result.current.canDeleteVaga).toBe(true);
    expect(result.current.canViewPropostas).toBe(true);
    expect(result.current.canCreateProposta).toBe(true);
    expect(result.current.canApproveRH).toBe(true);
    expect(result.current.canExecuteNormalizacao).toBe(true);
    expect(result.current.canViewAnalytics).toBe(true);
  });

  it('should identify role correctly', () => {
    const { result } = renderHook(() => useQuadroPermissions());

    expect(result.current.isRHManager).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isDirector).toBe(false);
  });

  it('should provide combined permission checks', () => {
    const { result } = renderHook(() => useQuadroPermissions());

    expect(result.current.canManageQuadro).toBe(true);
    expect(result.current.canApprovePropostas).toBe(true);
  });
});

describe('permission utilities', () => {
  it('should validate permission format', () => {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = require('./permissions');

    const userPermissions = ['quadro_vagas:quadro:read', 'quadro_vagas:propostas:create'];

    expect(hasPermission(userPermissions, 'quadro_vagas:quadro:read')).toBe(true);
    expect(hasPermission(userPermissions, 'quadro_vagas:quadro:delete')).toBe(false);

    expect(hasAnyPermission(userPermissions, [
      'quadro_vagas:quadro:read',
      'quadro_vagas:quadro:delete'
    ])).toBe(true);

    expect(hasAllPermissions(userPermissions, [
      'quadro_vagas:quadro:read',
      'quadro_vagas:propostas:create'
    ])).toBe(true);

    expect(hasAllPermissions(userPermissions, [
      'quadro_vagas:quadro:read',
      'quadro_vagas:quadro:delete'
    ])).toBe(false);
  });
});