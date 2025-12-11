# Authorization System Documentation

## Overview

The Authorization System provides comprehensive Role-Based Access Control (RBAC) and Access Control List (ACL) functionality for the Sistema de Gestão de Quadro de Lotação. It integrates with the Senior X Platform Authorization API to provide secure, scalable, and flexible permission management.

## Key Features

- **Platform Integration**: Seamless integration with Senior X Platform Authorization API
- **RBAC/ACL Support**: Role-based and permission-based access control
- **React Components**: Permission-aware UI components
- **Caching**: Intelligent permission caching for performance
- **Context-aware**: Support for contextual permissions (empresa, centro de custo, etc.)
- **TypeScript**: Full type safety and IntelliSense support

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                      │
│  PermissionGuard • ResourceGuard • PermissionButton        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    AUTHORIZATION HOOKS                     │
│  usePermissions • useQuadroPermissions • useAsyncPermissions│
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  AUTHORIZATION SERVICE                     │
│  Permission Checking • Role Management • Caching           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 PLATFORM AUTHORIZATION API                 │
│  Senior X Platform • RBAC/ACL • Permission Storage         │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Authorization Service (`authorization.service.ts`)

The main service that handles communication with the Platform Authorization API.

```typescript
import { authorizationService } from './core/auth';

// Check single permission
const canRead = await authorizationService.checkPermission('quadro_vagas:quadro', 'read');

// Check multiple permissions
const results = await authorizationService.checkMultiplePermissions([
  { resource: 'quadro_vagas:quadro', action: 'read' },
  { resource: 'quadro_vagas:quadro', action: 'create' }
]);

// Get user permissions
const userPerms = await authorizationService.getUserPermissions('user-123');
```

### 2. Permission Constants (`permissions.ts`)

Centralized permission and role definitions.

```typescript
import { PERMISSIONS, ROLES } from './core/auth/permissions';

// Use predefined permissions
const canViewDashboard = PERMISSIONS.DASHBOARD.READ;
const canCreateVaga = PERMISSIONS.QUADRO.CREATE;

// Use predefined roles
const isAdmin = user.roles.includes(ROLES.ADMIN);
const isRHManager = user.roles.includes(ROLES.RH_MANAGER);
```

### 3. Permission Hooks (`usePermissions.ts`)

React hooks for easy permission checking in components.

```typescript
import { usePermissions, useQuadroPermissions } from './core/auth/usePermissions';

function MyComponent() {
  const { checkPermission, checkRole } = usePermissions();
  const quadroPerms = useQuadroPermissions();

  const canCreate = checkPermission(PERMISSIONS.QUADRO.CREATE);
  const isManager = checkRole(ROLES.RH_MANAGER);

  return (
    <div>
      {quadroPerms.canViewDashboard && <Dashboard />}
      {quadroPerms.canCreateVaga && <CreateVagaButton />}
    </div>
  );
}
```

### 4. Authorization Guards (`auth.guard.tsx`)

Components for protecting routes and UI elements.

```typescript
import { AuthGuard, PermissionGuard, ResourceGuard, RoleGuard } from './core/auth';

// Route protection
<AuthGuard 
  requiredPermissions={[PERMISSIONS.DASHBOARD.READ]}
  fallbackPath="/unauthorized"
>
  <DashboardPage />
</AuthGuard>

// UI element protection
<PermissionGuard 
  permissions={[PERMISSIONS.QUADRO.CREATE]}
  fallback={<span>No permission</span>}
>
  <CreateButton />
</PermissionGuard>

// Resource-specific protection with context
<ResourceGuard
  resource="quadro_vagas:quadro"
  action="delete"
  context={{ empresaId: 'emp-123' }}
  asyncCheck={true}
>
  <DeleteButton />
</ResourceGuard>

// Role-based protection
<RoleGuard roles={[ROLES.ADMIN, ROLES.RH_MANAGER]}>
  <AdminPanel />
</RoleGuard>
```

### 5. Permission-aware UI Components (`PermissionButton.tsx`)

UI components that automatically handle permissions.

```typescript
import { PermissionButton, PermissionMenuItem, PermissionLink } from './components/auth';

// Button with permission check
<PermissionButton
  permission={PERMISSIONS.QUADRO.CREATE}
  variant="primary"
  onClick={handleCreate}
  fallback={<span>No permission</span>}
>
  Create Vaga
</PermissionButton>

// Menu item with permission check
<PermissionMenuItem
  permission={PERMISSIONS.PROPOSTAS.READ}
  icon={<ProposalIcon />}
  onClick={navigateToProposals}
>
  Proposals
</PermissionMenuItem>

// Link with permission check
<PermissionLink
  to="/admin"
  roles={[ROLES.ADMIN]}
  fallback={<span>Admin access required</span>}
>
  Admin Panel
</PermissionLink>
```

## Permission Structure

### Permission Format

Permissions follow the format: `module:resource:action`

- **Module**: `quadro_vagas` (system identifier)
- **Resource**: `quadro`, `propostas`, `dashboard`, etc.
- **Action**: `read`, `create`, `update`, `delete`, etc.

Examples:
- `quadro_vagas:dashboard:read`
- `quadro_vagas:quadro:create`
- `quadro_vagas:propostas:approve_rh`

### Available Permissions

```typescript
PERMISSIONS = {
  DASHBOARD: {
    READ: 'quadro_vagas:dashboard:read',
    EXPORT: 'quadro_vagas:dashboard:export',
  },
  QUADRO: {
    READ: 'quadro_vagas:quadro:read',
    CREATE: 'quadro_vagas:quadro:create',
    UPDATE: 'quadro_vagas:quadro:update',
    DELETE: 'quadro_vagas:quadro:delete',
    // ... more permissions
  },
  // ... more modules
}
```

### Available Roles

```typescript
ROLES = {
  ADMIN: 'admin',
  RH_MANAGER: 'rh_manager',
  RH_ANALYST: 'rh_analyst',
  COORDINATOR: 'coordinator',
  MANAGER: 'manager',
  DIRECTOR: 'director',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
}
```

## Context-aware Permissions

The system supports contextual permissions based on empresa, centro de custo, and other business contexts.

```typescript
import { createPermissionContext } from './core/auth/permissions';

// Create permission context
const context = createPermissionContext('emp-123', 'cc-456', 'user-789');

// Check permission with context
const canUpdate = await authorizationService.checkPermission(
  'quadro_vagas:quadro', 
  'update', 
  context
);

// Use context in components
<ResourceGuard
  resource="quadro_vagas:quadro"
  action="delete"
  context={{ empresaId: user.empresaId, centroCustoId: user.centroCustoId }}
>
  <DeleteButton />
</ResourceGuard>
```

## Caching

The authorization system includes intelligent caching to improve performance:

- **Automatic Caching**: Permission results are cached for 5 minutes
- **Cache Invalidation**: Cache is cleared when user permissions change
- **User-specific Cache**: Each user has their own cache namespace

```typescript
// Clear all cache
authorizationService.clearCache();

// Clear cache for specific user
authorizationService.clearUserCache('user-123');
```

## HTTP Integration

The system provides HTTP interceptors for automatic authorization:

```typescript
import { createAuthorizedAxiosInstance, permissionAwareApi } from './core/auth';

// Create axios instance with authorization
const api = createAuthorizedAxiosInstance('/api');

// Use permission-aware API helpers
const quadroData = await permissionAwareApi.getQuadro(filters, context);
const newVaga = await permissionAwareApi.createVaga(data, context);
```

## Error Handling

The system handles various authorization scenarios:

- **401 Unauthorized**: Automatic token refresh
- **403 Forbidden**: Permission denied events
- **Network Errors**: Graceful degradation
- **API Failures**: Fail-closed security model

```typescript
// Listen for authorization events
window.addEventListener('auth:permission-denied', (event) => {
  console.log('Permission denied:', event.detail);
  // Handle permission denied (show message, redirect, etc.)
});

window.addEventListener('auth:authentication-failed', (event) => {
  console.log('Authentication failed:', event.detail);
  // Handle auth failure (redirect to login, etc.)
});
```

## Testing

The system includes comprehensive tests:

```bash
# Run authorization tests
npm run test:unit -- authorization

# Run specific test file
npm run test:unit -- authorization.service.test.ts
```

Example test:

```typescript
import { authorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  it('should check permission successfully', async () => {
    const result = await authorizationService.checkPermission('quadro_vagas:quadro', 'read');
    expect(result).toBe(true);
  });
});
```

## Best Practices

### 1. Use Predefined Constants

```typescript
// ✅ Good
import { PERMISSIONS } from './core/auth/permissions';
const canRead = checkPermission(PERMISSIONS.QUADRO.READ);

// ❌ Bad
const canRead = checkPermission('quadro_vagas:quadro:read');
```

### 2. Prefer Declarative Components

```typescript
// ✅ Good
<PermissionGuard permissions={[PERMISSIONS.QUADRO.CREATE]}>
  <CreateButton />
</PermissionGuard>

// ❌ Bad
{checkPermission(PERMISSIONS.QUADRO.CREATE) && <CreateButton />}
```

### 3. Use Context for Business Logic

```typescript
// ✅ Good
<ResourceGuard
  resource="quadro_vagas:quadro"
  action="update"
  context={{ empresaId: user.empresaId }}
>
  <EditButton />
</ResourceGuard>

// ❌ Bad - missing context
<ResourceGuard resource="quadro_vagas:quadro" action="update">
  <EditButton />
</ResourceGuard>
```

### 4. Handle Loading States

```typescript
// ✅ Good
<ResourceGuard
  resource="quadro_vagas:quadro"
  action="read"
  loadingComponent={<Spinner />}
  fallback={<NoPermissionMessage />}
>
  <QuadroTable />
</ResourceGuard>
```

### 5. Use Appropriate Hooks

```typescript
// ✅ Good - for simple checks
const { canViewDashboard } = useQuadroPermissions();

// ✅ Good - for complex async checks
const { checkPermissionAsync } = useAsyncPermissions();
const canDelete = await checkPermissionAsync('quadro_vagas:quadro', 'delete', context);
```

## Migration Guide

If migrating from a previous authorization system:

1. **Replace permission strings** with constants from `permissions.ts`
2. **Update components** to use new permission guards
3. **Add context** to permission checks where needed
4. **Update API calls** to use authorized interceptors
5. **Test thoroughly** with different user roles

## Troubleshooting

### Common Issues

1. **Permission denied unexpectedly**
   - Check if user has required role
   - Verify permission constants are correct
   - Check if context is needed

2. **Slow permission checks**
   - Verify caching is working
   - Check network requests in dev tools
   - Consider using sync checks for simple permissions

3. **Components not rendering**
   - Check fallback props
   - Verify user is authenticated
   - Check browser console for errors

### Debug Mode

Enable debug logging:

```typescript
// In development
localStorage.setItem('auth:debug', 'true');

// Check permission cache
console.log(authorizationService.permissionCache);
```

## API Reference

### AuthorizationService

- `checkPermission(resource, action, context?)`: Check single permission
- `checkMultiplePermissions(checks)`: Check multiple permissions
- `getUserPermissions(userId)`: Get user's roles and permissions
- `hasRole(userId, roleName)`: Check if user has role
- `assignRole(userId, roleId)`: Assign role to user (admin only)
- `clearCache()`: Clear permission cache

### Hooks

- `usePermissions()`: Basic permission checking
- `useQuadroPermissions()`: Quadro-specific permissions
- `useAsyncPermissions()`: Async permission checking
- `useContextPermissions(context)`: Context-aware permissions

### Components

- `AuthGuard`: Route protection
- `PermissionGuard`: UI element protection
- `ResourceGuard`: Resource-specific protection
- `RoleGuard`: Role-based protection
- `PermissionButton`: Permission-aware button
- `PermissionMenuItem`: Permission-aware menu item
- `PermissionLink`: Permission-aware link

## Support

For questions or issues with the authorization system:

1. Check this documentation
2. Review the example components
3. Check the test files for usage examples
4. Contact the development team