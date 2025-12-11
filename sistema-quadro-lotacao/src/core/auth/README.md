# Authentication System

This module provides a complete authentication system integrated with Senior Platform APIs, including OAuth 2.0, JWT token management, 2FA support, and permission-based access control.

## Features

- **OAuth 2.0 Integration**: Full OAuth 2.0 Authorization Code Flow with Senior Platform Authentication API
- **JWT Token Management**: Automatic token refresh, secure storage, and expiration handling
- **Two-Factor Authentication**: Complete 2FA setup, verification, and management
- **Permission-Based Access Control**: Role and permission checking with Platform Authorization API
- **React Integration**: Context provider, guards, and hooks for seamless React integration
- **HTTP Interceptors**: Automatic token injection and refresh for API calls
- **TypeScript Support**: Full type safety with comprehensive type definitions

## Quick Start

### 1. Environment Setup

Add the required environment variables to your `.env` file:

```env
# Senior Platform APIs
PLATFORM_AUTH_URL=https://api.senior.com.br/auth
PLATFORM_AUTHZ_URL=https://api.senior.com.br/authorization
PLATFORM_NOTIFICATIONS_URL=https://api.senior.com.br/notifications
PLATFORM_CLIENT_ID=QUADRO_VAGAS_APP
PLATFORM_CLIENT_SECRET=your_client_secret_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

### 2. App Setup

Wrap your app with the `AuthProvider`:

```tsx
import { AuthProvider } from './core/auth';
import { setupAxiosDefaults } from './core/auth';

// Setup axios defaults
setupAxiosDefaults();

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### 3. Route Protection

Use `AuthGuard` to protect routes:

```tsx
import { AuthGuard } from './core/auth';

function ProtectedRoute() {
  return (
    <AuthGuard
      requiredPermissions={['quadro_vagas:read']}
      requiredRoles={['user']}
    >
      <YourComponent />
    </AuthGuard>
  );
}
```

### 4. Using Authentication in Components

```tsx
import { useAuth } from './core/auth';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout, 
    hasPermission 
  } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div>
      <h1>Welcome, {user.nome}!</h1>
      {hasPermission('quadro_vagas:write') && (
        <button>Create New</button>
      )}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## API Reference

### AuthService

Main service for authentication operations:

```typescript
import { authService } from './core/auth';

// OAuth 2.0 Flow
const authUrl = authService.getAuthorizationUrl(redirectUri);
const response = await authService.exchangeCodeForTokens(code, redirectUri);

// Direct Login
const response = await authService.login({
  email: 'user@example.com',
  password: 'password',
  twoFactorCode: '123456' // optional
});

// Token Management
const newTokens = await authService.refreshToken(refreshToken);
const isValid = await authService.validateToken(accessToken);

// Permission Checking
const hasPermission = await authService.checkPermission(
  'quadro_vagas:read',
  { empresaId: 'emp-123' },
  accessToken
);

// 2FA Management
const setup = await authService.setupTwoFactor(accessToken);
const verified = await authService.verifyTwoFactor({ code: '123456' }, accessToken);
```

### TokenService

Service for token storage and management:

```typescript
import { tokenService } from './core/auth';

// Store tokens
tokenService.setTokens({
  accessToken: 'token',
  refreshToken: 'refresh',
  expiresIn: 3600,
  tokenType: 'Bearer'
});

// Get tokens
const accessToken = tokenService.getAccessToken();
const refreshToken = tokenService.getRefreshToken();
const authHeader = tokenService.getAuthorizationHeader();

// Check expiration
const isExpired = tokenService.isTokenExpired();
const timeLeft = tokenService.getTimeUntilExpiry();

// Clear tokens
tokenService.clearTokens();
```

### useAuth Hook

React hook for authentication state and actions:

```typescript
const {
  // State
  user,
  isAuthenticated,
  isLoading,
  requiresTwoFactor,

  // Actions
  login,
  loginWithCode,
  logout,
  refreshToken,

  // 2FA
  setupTwoFactor,
  verifyTwoFactor,
  enableTwoFactor,
  disableTwoFactor,

  // Permissions
  hasPermission,
  hasRole,
  checkPermission,

  // Utilities
  getAuthorizationHeader,
  isTokenExpired,
} = useAuth();
```

### AuthGuard Component

Component for route protection:

```tsx
<AuthGuard
  requireAuth={true}
  requiredPermissions={['quadro_vagas:read']}
  requiredRoles={['user']}
  permissionContext={{ empresaId: 'emp-123' }}
  fallbackPath="/login"
>
  <ProtectedComponent />
</AuthGuard>
```

### PermissionGuard Component

Component for conditional rendering based on permissions:

```tsx
<PermissionGuard
  permissions={['quadro_vagas:write']}
  roles={['admin']}
  requireAll={false}
  fallback={<div>Access denied</div>}
>
  <AdminOnlyComponent />
</PermissionGuard>
```

### HTTP Client

Authenticated HTTP client with automatic token management:

```typescript
import { httpClient } from './core/auth';

// All requests automatically include auth tokens
const response = await httpClient.get('/api/quadro');
const created = await httpClient.post('/api/quadro', data);
const updated = await httpClient.put('/api/quadro/123', data);
const deleted = await httpClient.delete('/api/quadro/123');
```

## Authentication Flow

### OAuth 2.0 Flow

1. **Authorization Request**: Redirect user to Platform Authentication
2. **Authorization Grant**: User authorizes and returns with code
3. **Token Exchange**: Exchange code for access/refresh tokens
4. **API Access**: Use access token for API calls
5. **Token Refresh**: Automatically refresh expired tokens

### Direct Login Flow

1. **Login Request**: Send credentials to Platform Authentication
2. **2FA Check**: Handle 2FA if required
3. **Token Storage**: Store tokens securely
4. **API Access**: Use tokens for authenticated requests

## Permission System

The system supports both role-based and permission-based access control:

### Roles

- `admin`: Full system access
- `rh_manager`: HR management permissions
- `coordinator`: Coordination permissions
- `analyst`: Read-only access

### Permissions

- `quadro_vagas:quadro:read`: View quadro data
- `quadro_vagas:quadro:create`: Create new vagas
- `quadro_vagas:quadro:update`: Update existing vagas
- `quadro_vagas:quadro:delete`: Delete vagas
- `quadro_vagas:propostas:create`: Create proposals
- `quadro_vagas:propostas:approve`: Approve proposals
- `quadro_vagas:normalizacao:execute`: Execute normalization
- `quadro_vagas:analytics:read`: View analytics

## Security Features

- **Secure Token Storage**: Tokens stored in localStorage with automatic cleanup
- **Automatic Token Refresh**: Seamless token refresh before expiration
- **CSRF Protection**: CSRF token handling for state-changing requests
- **Request Signing**: Request ID and timestamp for tracing
- **Error Handling**: Comprehensive error handling with fallback strategies
- **Rate Limiting**: Built-in rate limiting support
- **2FA Support**: Complete two-factor authentication implementation

## Error Handling

The system handles various error scenarios:

- **401 Unauthorized**: Automatic token refresh or redirect to login
- **403 Forbidden**: Permission denied handling
- **429 Too Many Requests**: Automatic retry with backoff
- **Network Errors**: Graceful degradation and user notification
- **Token Expiration**: Automatic refresh or re-authentication

## Testing

The authentication system includes comprehensive tests:

```bash
# Run authentication tests
npm test src/core/auth

# Run specific test files
npm test src/core/auth/auth.service.test.ts
npm test src/core/auth/token.service.test.ts
```

## Best Practices

1. **Always use AuthGuard** for protected routes
2. **Check permissions** before showing UI elements
3. **Handle loading states** during authentication
4. **Provide fallbacks** for unauthorized access
5. **Use the HTTP client** for API calls to ensure token management
6. **Test authentication flows** thoroughly
7. **Keep tokens secure** and never log them
8. **Handle 2FA gracefully** in the user experience

## Troubleshooting

### Common Issues

1. **Token not included in requests**: Ensure `setupAxiosDefaults()` is called
2. **Infinite redirect loops**: Check route protection configuration
3. **Permission checks failing**: Verify user roles and permissions
4. **2FA not working**: Check Platform Authentication API configuration
5. **Token refresh failing**: Verify refresh token validity and API endpoints

### Debug Mode

Enable debug logging in development:

```typescript
// In development, authentication events are logged to console
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('auth:token-expired', () => {
    console.log('Auth: Token expired');
  });
  
  window.addEventListener('auth:token-refresh-needed', () => {
    console.log('Auth: Token refresh needed');
  });
}
```

## Integration with Senior Platform

This authentication system is designed to work seamlessly with Senior Platform APIs:

- **Platform Authentication**: OAuth 2.0, JWT tokens, 2FA
- **Platform Authorization**: RBAC/ACL permission checking
- **Platform Notifications**: Multi-channel notifications for auth events

Ensure your Senior Platform configuration matches the client ID and secrets configured in your environment variables.