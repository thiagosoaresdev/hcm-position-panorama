import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenService } from './token.service';
import { AuthTokens } from '../../types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid'),
  },
});

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenService = new TokenService();
    
    // Clear any existing timeouts
    if ((window as any).__tokenRefreshTimeout) {
      clearTimeout((window as any).__tokenRefreshTimeout);
      delete (window as any).__tokenRefreshTimeout;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setTokens', () => {
    it('should store tokens in localStorage', () => {
      const tokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const mockDate = new Date('2023-01-01T12:00:00Z');
      vi.setSystemTime(mockDate);

      tokenService.setTokens(tokens);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quadro_vagas_access_token',
        'test-access-token'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quadro_vagas_refresh_token',
        'test-refresh-token'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quadro_vagas_token_type',
        'Bearer'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quadro_vagas_token_expiry',
        (mockDate.getTime() + 3600 * 1000).toString()
      );
    });

    it('should handle storage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      const tokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      expect(() => tokenService.setTokens(tokens)).toThrow('Failed to store authentication tokens');
    });
  });

  describe('getAccessToken', () => {
    it('should return stored access token', () => {
      localStorageMock.getItem.mockReturnValue('stored-access-token');

      const result = tokenService.getAccessToken();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('quadro_vagas_access_token');
      expect(result).toBe('stored-access-token');
    });

    it('should return null when no token stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = tokenService.getAccessToken();

      expect(result).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const result = tokenService.getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return stored refresh token', () => {
      localStorageMock.getItem.mockReturnValue('stored-refresh-token');

      const result = tokenService.getRefreshToken();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('quadro_vagas_refresh_token');
      expect(result).toBe('stored-refresh-token');
    });

    it('should return null when no token stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = tokenService.getRefreshToken();

      expect(result).toBeNull();
    });
  });

  describe('getTokenType', () => {
    it('should return stored token type', () => {
      localStorageMock.getItem.mockReturnValue('Bearer');

      const result = tokenService.getTokenType();

      expect(result).toBe('Bearer');
    });

    it('should return default Bearer when no type stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = tokenService.getTokenType();

      expect(result).toBe('Bearer');
    });
  });

  describe('getTokens', () => {
    it('should return all stored tokens', () => {
      const mockExpiry = Date.now() + 3600 * 1000;
      
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'quadro_vagas_access_token':
            return 'access-token';
          case 'quadro_vagas_refresh_token':
            return 'refresh-token';
          case 'quadro_vagas_token_expiry':
            return mockExpiry.toString();
          case 'quadro_vagas_token_type':
            return 'Bearer';
          default:
            return null;
        }
      });

      const result = tokenService.getTokens();

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: expect.any(Number),
        tokenType: 'Bearer',
      });
      expect(result!.expiresIn).toBeGreaterThan(0);
    });

    it('should return null when tokens are incomplete', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'quadro_vagas_access_token':
            return 'access-token';
          case 'quadro_vagas_refresh_token':
            return null; // Missing refresh token
          default:
            return null;
        }
      });

      const result = tokenService.getTokens();

      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const futureTime = Date.now() + 3600 * 1000; // 1 hour from now
      localStorageMock.getItem.mockReturnValue(futureTime.toString());

      const result = tokenService.isTokenExpired();

      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastTime = Date.now() - 3600 * 1000; // 1 hour ago
      localStorageMock.getItem.mockReturnValue(pastTime.toString());

      const result = tokenService.isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return true when no expiry time stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = tokenService.isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return true for token expiring within buffer time', () => {
      const nearFutureTime = Date.now() + 2 * 60 * 1000; // 2 minutes from now (within 5 minute buffer)
      localStorageMock.getItem.mockReturnValue(nearFutureTime.toString());

      const result = tokenService.isTokenExpired();

      expect(result).toBe(true);
    });
  });

  describe('hasTokens', () => {
    it('should return true when both tokens exist', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'quadro_vagas_access_token') return 'access-token';
        if (key === 'quadro_vagas_refresh_token') return 'refresh-token';
        return null;
      });

      const result = tokenService.hasTokens();

      expect(result).toBe(true);
    });

    it('should return false when access token missing', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'quadro_vagas_access_token') return null;
        if (key === 'quadro_vagas_refresh_token') return 'refresh-token';
        return null;
      });

      const result = tokenService.hasTokens();

      expect(result).toBe(false);
    });

    it('should return false when refresh token missing', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'quadro_vagas_access_token') return 'access-token';
        if (key === 'quadro_vagas_refresh_token') return null;
        return null;
      });

      const result = tokenService.hasTokens();

      expect(result).toBe(false);
    });
  });

  describe('clearTokens', () => {
    it('should remove all stored tokens', () => {
      tokenService.clearTokens();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('quadro_vagas_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('quadro_vagas_refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('quadro_vagas_token_expiry');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('quadro_vagas_token_type');
    });

    it('should handle storage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(() => tokenService.clearTokens()).not.toThrow();
    });
  });

  describe('getAuthorizationHeader', () => {
    it('should return formatted authorization header', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'quadro_vagas_access_token') return 'access-token';
        if (key === 'quadro_vagas_token_type') return 'Bearer';
        return null;
      });

      const result = tokenService.getAuthorizationHeader();

      expect(result).toBe('Bearer access-token');
    });

    it('should return null when no access token', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'quadro_vagas_access_token') return null;
        return null;
      });

      const result = tokenService.getAuthorizationHeader();

      expect(result).toBeNull();
    });
  });

  describe('updateAccessToken', () => {
    it('should update access token and expiry', () => {
      const mockDate = new Date('2023-01-01T12:00:00Z');
      vi.setSystemTime(mockDate);

      tokenService.updateAccessToken('new-access-token', 3600);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quadro_vagas_access_token',
        'new-access-token'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quadro_vagas_token_expiry',
        (mockDate.getTime() + 3600 * 1000).toString()
      );
    });

    it('should handle storage errors', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(() => tokenService.updateAccessToken('new-token', 3600)).toThrow(
        'Failed to update access token'
      );
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return time until expiry in seconds', () => {
      const futureTime = Date.now() + 1800 * 1000; // 30 minutes from now
      localStorageMock.getItem.mockReturnValue(futureTime.toString());

      const result = tokenService.getTimeUntilExpiry();

      expect(result).toBeCloseTo(1800, -1); // Within 10 seconds
    });

    it('should return 0 for expired token', () => {
      const pastTime = Date.now() - 1800 * 1000; // 30 minutes ago
      localStorageMock.getItem.mockReturnValue(pastTime.toString());

      const result = tokenService.getTimeUntilExpiry();

      expect(result).toBe(0);
    });

    it('should return 0 when no expiry time stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = tokenService.getTimeUntilExpiry();

      expect(result).toBe(0);
    });
  });
});