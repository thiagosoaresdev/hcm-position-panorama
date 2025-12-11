# Authentication System Usage Guide

## Quick Setup

1. **Wrap your app with AuthProvider**:
```tsx
import { AuthProvider } from './core/auth';

function App() {
  return (
    <AuthProvider>
      <YourAppComponents />
    </AuthProvider>
  );
}
```

2. **Protect routes with AuthGuard**:
```tsx
import { AuthGuard } from './core/auth';

<AuthGuard requiredPermissions={['quadro_vagas:read']}>
  <ProtectedComponent />
</AuthGuard>
```

3. **Use authentication in components**:
```tsx
import { useAuth } from './core/auth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return <div>Welcome {user.nome}!</div>;
}
```

## Key Features

- OAuth 2.0 with Senior Platform
- JWT token management with auto-refresh
- Two-factor authentication support
- Permission-based access control
- HTTP interceptors for API calls
- Comprehensive error handling

## Environment Variables

```env
PLATFORM_AUTH_URL=https://api.senior.com.br/auth
PLATFORM_CLIENT_ID=QUADRO_VAGAS_APP
PLATFORM_CLIENT_SECRET=your_secret
JWT_SECRET=your_jwt_secret
```

## Components

- `AuthProvider`: Context provider for auth state
- `AuthGuard`: Route protection component
- `PermissionGuard`: Conditional rendering based on permissions
- `LoginForm`: Complete login form with OAuth and 2FA
- `TwoFactorSetup`: 2FA setup wizard

## Services

- `AuthService`: Main authentication service
- `TokenService`: Token storage and management
- `AuthenticatedHttpClient`: HTTP client with auto token injection

See README.md for complete documentation.