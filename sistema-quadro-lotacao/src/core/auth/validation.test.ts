/**
 * Simple validation test to ensure authentication components are working
 */

import { describe, it, expect } from 'vitest';

// Test imports
describe('Authentication Module Validation', () => {
  it('should import AuthService without errors', async () => {
    const { AuthService } = await import('./auth.service');
    expect(AuthService).toBeDefined();
    
    const service = new AuthService();
    expect(service).toBeInstanceOf(AuthService);
  });

  it('should import TokenService without errors', async () => {
    const { TokenService } = await import('./token.service');
    expect(TokenService).toBeDefined();
    
    const service = new TokenService();
    expect(service).toBeInstanceOf(TokenService);
  });

  it('should import AuthenticatedHttpClient without errors', async () => {
    const { AuthenticatedHttpClient } = await import('./auth.interceptor');
    expect(AuthenticatedHttpClient).toBeDefined();
    
    const client = new AuthenticatedHttpClient();
    expect(client).toBeInstanceOf(AuthenticatedHttpClient);
  });

  it('should generate OAuth URL correctly', async () => {
    const { AuthService } = await import('./auth.service');
    const service = new AuthService();
    
    const url = service.getAuthorizationUrl('http://localhost:3000/callback');
    
    expect(url).toContain('oauth/authorize');
    expect(url).toContain('client_id=QUADRO_VAGAS_APP');
    expect(url).toContain('response_type=code');
    expect(url).toContain('redirect_uri=');
  });

  it('should handle token operations', async () => {
    const { TokenService } = await import('./token.service');
    
    // Mock localStorage for testing
    const mockStorage: Record<string, string> = {};
    const originalGetItem = localStorage.getItem;
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    
    localStorage.getItem = (key: string) => mockStorage[key] || null;
    localStorage.setItem = (key: string, value: string) => {
      mockStorage[key] = value;
    };
    localStorage.removeItem = (key: string) => {
      delete mockStorage[key];
    };

    try {
      const service = new TokenService();
      
      // Test token storage
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer'
      };

      service.setTokens(tokens);
      
      expect(service.getAccessToken()).toBe('test-access-token');
      expect(service.getRefreshToken()).toBe('test-refresh-token');
      expect(service.getTokenType()).toBe('Bearer');
      expect(service.hasTokens()).toBe(true);
      
      // Test authorization header
      const authHeader = service.getAuthorizationHeader();
      expect(authHeader).toBe('Bearer test-access-token');
      
      // Test token clearing
      service.clearTokens();
      expect(service.hasTokens()).toBe(false);
      expect(service.getAccessToken()).toBeNull();
      
    } finally {
      // Restore original localStorage methods
      localStorage.getItem = originalGetItem;
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
    }
  });
});