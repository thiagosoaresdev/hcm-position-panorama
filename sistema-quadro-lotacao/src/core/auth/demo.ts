/**
 * Authentication System Demo
 * This file demonstrates the key features of the authentication system
 */

import { authService } from './auth.service';
import { tokenService } from './token.service';
import { httpClient } from './auth.interceptor';

// Demo: OAuth 2.0 Flow
export function demoOAuthFlow() {
  console.log('=== OAuth 2.0 Flow Demo ===');
  
  // Step 1: Generate authorization URL
  const redirectUri = 'http://localhost:3000/auth/callback';
  const authUrl = authService.getAuthorizationUrl(redirectUri, 'demo-state');
  
  console.log('1. Authorization URL:', authUrl);
  console.log('   - Contains client_id, response_type, redirect_uri, scope');
  console.log('   - User would be redirected to this URL');
  
  // Step 2: After user authorizes, exchange code for tokens
  console.log('2. After user authorizes, exchange code for tokens');
  console.log('   - authService.exchangeCodeForTokens(code, redirectUri)');
  console.log('   - Returns user profile and tokens');
}

// Demo: Token Management
export function demoTokenManagement() {
  console.log('\n=== Token Management Demo ===');
  
  // Mock tokens for demo
  const mockTokens = {
    accessToken: 'demo-access-token-' + Date.now(),
    refreshToken: 'demo-refresh-token-' + Date.now(),
    expiresIn: 3600,
    tokenType: 'Bearer'
  };
  
  console.log('1. Storing tokens:', mockTokens);
  tokenService.setTokens(mockTokens);
  
  console.log('2. Retrieved access token:', tokenService.getAccessToken());
  console.log('3. Authorization header:', tokenService.getAuthorizationHeader());
  console.log('4. Token expires in:', tokenService.getTimeUntilExpiry(), 'seconds');
  console.log('5. Is token expired?', tokenService.isTokenExpired());
  
  // Clean up
  tokenService.clearTokens();
  console.log('6. Tokens cleared. Has tokens?', tokenService.hasTokens());
}

// Demo: Permission Checking
export function demoPermissionSystem() {
  console.log('\n=== Permission System Demo ===');
  
  const mockUser = {
    id: 'demo-user-123',
    nome: 'Demo User',
    email: 'demo@example.com',
    roles: ['coordinator', 'user'],
    permissions: ['quadro_vagas:quadro:read', 'quadro_vagas:propostas:create'],
    twoFactorEnabled: false
  };
  
  console.log('1. Mock user:', mockUser);
  
  // Simulate permission checks (would normally use useAuth hook)
  const hasReadPermission = mockUser.permissions.includes('quadro_vagas:quadro:read');
  const hasWritePermission = mockUser.permissions.includes('quadro_vagas:quadro:write');
  const isCoordinator = mockUser.roles.includes('coordinator');
  const isAdmin = mockUser.roles.includes('admin');
  
  console.log('2. Permission checks:');
  console.log('   - Can read quadro:', hasReadPermission ? '✅' : '❌');
  console.log('   - Can write quadro:', hasWritePermission ? '✅' : '❌');
  console.log('   - Is coordinator:', isCoordinator ? '✅' : '❌');
  console.log('   - Is admin:', isAdmin ? '✅' : '❌');
}

// Demo: HTTP Client with Authentication
export function demoHttpClient() {
  console.log('\n=== HTTP Client Demo ===');
  
  console.log('1. HTTP client automatically includes auth tokens');
  console.log('2. Handles token refresh on 401 errors');
  console.log('3. Provides CSRF protection');
  console.log('4. Includes request tracing');
  
  // Example usage (would make real API calls in practice)
  console.log('\nExample usage:');
  console.log('  const response = await httpClient.get("/api/quadro");');
  console.log('  const created = await httpClient.post("/api/quadro", data);');
  console.log('  const updated = await httpClient.put("/api/quadro/123", data);');
}

// Demo: 2FA Flow
export function demo2FAFlow() {
  console.log('\n=== Two-Factor Authentication Demo ===');
  
  console.log('1. Setup 2FA:');
  console.log('   - authService.setupTwoFactor(accessToken)');
  console.log('   - Returns QR code and secret for authenticator app');
  
  console.log('2. Verify 2FA code:');
  console.log('   - authService.verifyTwoFactor({ code: "123456" }, accessToken)');
  console.log('   - Returns true/false for verification result');
  
  console.log('3. Enable 2FA:');
  console.log('   - authService.enableTwoFactor("123456", accessToken)');
  console.log('   - Returns backup codes for account recovery');
  
  console.log('4. Login with 2FA:');
  console.log('   - Include twoFactorCode in login request');
  console.log('   - System validates both password and 2FA code');
}

// Run all demos
export function runAllDemos() {
  console.log('🔐 Authentication System Demo\n');
  
  demoOAuthFlow();
  demoTokenManagement();
  demoPermissionSystem();
  demoHttpClient();
  demo2FAFlow();
  
  console.log('\n✅ Authentication system is ready for use!');
  console.log('\nNext steps:');
  console.log('1. Configure environment variables');
  console.log('2. Wrap your app with AuthProvider');
  console.log('3. Use AuthGuard to protect routes');
  console.log('4. Use useAuth hook in components');
  console.log('5. Test with Senior Platform APIs');
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).authDemo = {
    runAllDemos,
    demoOAuthFlow,
    demoTokenManagement,
    demoPermissionSystem,
    demoHttpClient,
    demo2FAFlow
  };
}