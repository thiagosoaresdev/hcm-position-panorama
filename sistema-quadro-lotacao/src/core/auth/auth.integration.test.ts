import { describe, it, expect } from 'vitest';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

describe('Authentication Integration', () => {
  it('should create AuthService instance', () => {
    const authService = new AuthService();
    expect(authService).toBeDefined();
  });

  it('should create TokenService instance', () => {
    const tokenService = new TokenService();
    expect(tokenService).toBeDefined();
  });

  it('should generate OAuth authorization URL', () => {
    const authService = new AuthService();
    const url = authService.getAuthorizationUrl('http://localhost:3000/callback');
    
    expect(url).toContain('https://api.senior.com.br/auth/oauth/authorize');
    expect(url).toContain('client_id=QUADRO_VAGAS_APP');
    expect(url).toContain('response_type=code');
  });

  it('should handle token storage', () => {
    const tokenService = new TokenService();
    
    // Mock localStorage for this test
    const mockStorage: Record<string, string> = {};
    const originalGetItem = localStorage.getItem;
    const originalSetItem = localStorage.setItem;
    
    localStorage.getItem = (key: string) => mockStorage[key] || null;
    localStorage.setItem = (key: string, value: string) => {
      mockStorage[key] = value;
    };

    const tokens = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer'
    };

    tokenService.setTokens(tokens);
    
    expect(tokenService.getAccessToken()).toBe('test-access-token');
    expect(tokenService.getRefreshToken()).toBe('test-refresh-token');
    expect(tokenService.getTokenType()).toBe('Bearer');

    // Restore original localStorage methods
    localStorage.getItem = originalGetItem;
    localStorage.setItem = originalSetItem;
  });
});