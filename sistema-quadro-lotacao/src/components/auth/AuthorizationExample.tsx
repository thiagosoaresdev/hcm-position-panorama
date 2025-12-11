import React from 'react';
import { 
  PermissionGuard, 
  ResourceGuard, 
  RoleGuard,
  PermissionButton,
  PermissionIconButton,
  PermissionMenuItem,
  PermissionLink
} from '../../core/auth';
import { useQuadroPermissions } from '../../core/auth/usePermissions';
import { PERMISSIONS, ROLES } from '../../core/auth/permissions';

/**
 * Example component demonstrating authorization features
 */
export function AuthorizationExample(): React.ReactElement {
  const permissions = useQuadroPermissions();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Authorization System Examples</h1>

      {/* Permission-based rendering */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Permission-based Rendering</h2>
        
        <PermissionGuard 
          permissions={[PERMISSIONS.DASHBOARD.READ]}
          fallback={<p className="text-red-600">You don't have permission to view the dashboard.</p>}
        >
          <div className="p-4 bg-green-100 border border-green-300 rounded">
            <p className="text-green-800">✅ You can view the dashboard!</p>
          </div>
        </PermissionGuard>

        <PermissionGuard 
          permissions={[PERMISSIONS.QUADRO.CREATE, PERMISSIONS.QUADRO.UPDATE]}
          requireAll={false}
          fallback={<p className="text-red-600">You can't manage quadro de lotação.</p>}
        >
          <div className="p-4 bg-blue-100 border border-blue-300 rounded">
            <p className="text-blue-800">✅ You can manage quadro de lotação!</p>
          </div>
        </PermissionGuard>
      </section>

      {/* Role-based rendering */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Role-based Rendering</h2>
        
        <RoleGuard 
          roles={[ROLES.ADMIN, ROLES.RH_MANAGER]}
          fallback={<p className="text-red-600">Admin or RH Manager access required.</p>}
        >
          <div className="p-4 bg-purple-100 border border-purple-300 rounded">
            <p className="text-purple-800">✅ You have admin or RH manager access!</p>
          </div>
        </RoleGuard>
      </section>

      {/* Resource-based guard with async check */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Resource-based Guard (Async)</h2>
        
        <ResourceGuard
          resource="quadro_vagas:quadro"
          action="delete"
          context={{ empresaId: 'emp-123', centroCustoId: 'cc-456' }}
          loadingComponent={<p className="text-gray-600">Checking permissions...</p>}
          fallback={<p className="text-red-600">You can't delete vagas in this context.</p>}
        >
          <div className="p-4 bg-red-100 border border-red-300 rounded">
            <p className="text-red-800">⚠️ You can delete vagas (dangerous operation)!</p>
          </div>
        </ResourceGuard>
      </section>

      {/* Permission-aware buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Permission-aware Buttons</h2>
        
        <div className="flex space-x-4">
          <PermissionButton
            permission={PERMISSIONS.QUADRO.CREATE}
            variant="primary"
            onClick={() => alert('Creating new vaga...')}
          >
            Create Vaga
          </PermissionButton>

          <PermissionButton
            permission={PERMISSIONS.QUADRO.UPDATE}
            variant="secondary"
            onClick={() => alert('Updating vaga...')}
          >
            Update Vaga
          </PermissionButton>

          <PermissionButton
            permission={PERMISSIONS.QUADRO.DELETE}
            variant="danger"
            onClick={() => alert('Deleting vaga...')}
            fallback={<span className="text-gray-500">Delete (No Permission)</span>}
          >
            Delete Vaga
          </PermissionButton>
        </div>

        <div className="flex space-x-4">
          <PermissionIconButton
            permission={PERMISSIONS.PROPOSTAS.APPROVE_RH}
            icon={<span>✅</span>}
            tooltip="Approve Proposal"
            variant="success"
            onClick={() => alert('Approving proposal...')}
          />

          <PermissionIconButton
            permission={PERMISSIONS.PROPOSTAS.REJECT}
            icon={<span>❌</span>}
            tooltip="Reject Proposal"
            variant="danger"
            onClick={() => alert('Rejecting proposal...')}
          />
        </div>
      </section>

      {/* Permission-aware menu items */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Permission-aware Menu</h2>
        
        <div className="bg-white border border-gray-200 rounded-md shadow-sm">
          <PermissionMenuItem
            permission={PERMISSIONS.DASHBOARD.READ}
            icon={<span>📊</span>}
            onClick={() => alert('Navigating to dashboard...')}
          >
            Dashboard
          </PermissionMenuItem>

          <PermissionMenuItem
            permission={PERMISSIONS.QUADRO.READ}
            icon={<span>📋</span>}
            onClick={() => alert('Navigating to quadro...')}
          >
            Quadro de Lotação
          </PermissionMenuItem>

          <PermissionMenuItem
            permission={PERMISSIONS.PROPOSTAS.READ}
            icon={<span>📝</span>}
            onClick={() => alert('Navigating to propostas...')}
          >
            Propostas
          </PermissionMenuItem>

          <PermissionMenuItem
            permission={PERMISSIONS.NORMALIZACAO.EXECUTE}
            icon={<span>🔄</span>}
            onClick={() => alert('Navigating to normalization...')}
          >
            Normalização
          </PermissionMenuItem>

          <PermissionMenuItem
            permission={PERMISSIONS.ANALYTICS.READ}
            icon={<span>📈</span>}
            onClick={() => alert('Navigating to analytics...')}
          >
            Analytics
          </PermissionMenuItem>

          <PermissionMenuItem
            permission={PERMISSIONS.USERS.READ}
            icon={<span>👥</span>}
            onClick={() => alert('Navigating to users...')}
          >
            User Management
          </PermissionMenuItem>
        </div>
      </section>

      {/* Permission-aware links */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Permission-aware Links</h2>
        
        <div className="flex space-x-4">
          <PermissionLink
            to="/dashboard"
            permission={PERMISSIONS.DASHBOARD.READ}
            className="text-blue-600 hover:text-blue-800 underline"
            fallback={<span className="text-gray-400">Dashboard (No Access)</span>}
          >
            Dashboard
          </PermissionLink>

          <PermissionLink
            to="/quadro"
            permission={PERMISSIONS.QUADRO.READ}
            className="text-blue-600 hover:text-blue-800 underline"
            fallback={<span className="text-gray-400">Quadro (No Access)</span>}
          >
            Quadro de Lotação
          </PermissionLink>

          <PermissionLink
            to="/admin"
            roles={[ROLES.ADMIN]}
            className="text-blue-600 hover:text-blue-800 underline"
            fallback={<span className="text-gray-400">Admin (No Access)</span>}
          >
            Admin Panel
          </PermissionLink>
        </div>
      </section>

      {/* Hook-based permission checks */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Hook-based Permission Checks</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-medium text-gray-900 mb-2">Dashboard Permissions</h3>
            <ul className="text-sm space-y-1">
              <li className={permissions.canViewDashboard ? 'text-green-600' : 'text-red-600'}>
                {permissions.canViewDashboard ? '✅' : '❌'} View Dashboard
              </li>
              <li className={permissions.canExportDashboard ? 'text-green-600' : 'text-red-600'}>
                {permissions.canExportDashboard ? '✅' : '❌'} Export Dashboard
              </li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-medium text-gray-900 mb-2">Quadro Permissions</h3>
            <ul className="text-sm space-y-1">
              <li className={permissions.canViewQuadro ? 'text-green-600' : 'text-red-600'}>
                {permissions.canViewQuadro ? '✅' : '❌'} View Quadro
              </li>
              <li className={permissions.canCreateVaga ? 'text-green-600' : 'text-red-600'}>
                {permissions.canCreateVaga ? '✅' : '❌'} Create Vaga
              </li>
              <li className={permissions.canUpdateVaga ? 'text-green-600' : 'text-red-600'}>
                {permissions.canUpdateVaga ? '✅' : '❌'} Update Vaga
              </li>
              <li className={permissions.canDeleteVaga ? 'text-green-600' : 'text-red-600'}>
                {permissions.canDeleteVaga ? '✅' : '❌'} Delete Vaga
              </li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-medium text-gray-900 mb-2">Proposal Permissions</h3>
            <ul className="text-sm space-y-1">
              <li className={permissions.canViewPropostas ? 'text-green-600' : 'text-red-600'}>
                {permissions.canViewPropostas ? '✅' : '❌'} View Proposals
              </li>
              <li className={permissions.canCreateProposta ? 'text-green-600' : 'text-red-600'}>
                {permissions.canCreateProposta ? '✅' : '❌'} Create Proposal
              </li>
              <li className={permissions.canApprovePropostas ? 'text-green-600' : 'text-red-600'}>
                {permissions.canApprovePropostas ? '✅' : '❌'} Approve Proposals
              </li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-medium text-gray-900 mb-2">User Roles</h3>
            <ul className="text-sm space-y-1">
              <li className={permissions.isAdmin ? 'text-green-600' : 'text-red-600'}>
                {permissions.isAdmin ? '✅' : '❌'} Admin
              </li>
              <li className={permissions.isRHManager ? 'text-green-600' : 'text-red-600'}>
                {permissions.isRHManager ? '✅' : '❌'} RH Manager
              </li>
              <li className={permissions.isDirector ? 'text-green-600' : 'text-red-600'}>
                {permissions.isDirector ? '✅' : '❌'} Director
              </li>
              <li className={permissions.isManager ? 'text-green-600' : 'text-red-600'}>
                {permissions.isManager ? '✅' : '❌'} Manager
              </li>
              <li className={permissions.isCoordinator ? 'text-green-600' : 'text-red-600'}>
                {permissions.isCoordinator ? '✅' : '❌'} Coordinator
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Combined permissions */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Combined Permission Checks</h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded ${permissions.canManageQuadro ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
            <h3 className="font-medium mb-2">Can Manage Quadro</h3>
            <p className={`text-sm ${permissions.canManageQuadro ? 'text-green-800' : 'text-red-800'}`}>
              {permissions.canManageQuadro ? '✅ Yes' : '❌ No'}
            </p>
          </div>

          <div className={`p-4 rounded ${permissions.canApprovePropostas ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
            <h3 className="font-medium mb-2">Can Approve Proposals</h3>
            <p className={`text-sm ${permissions.canApprovePropostas ? 'text-green-800' : 'text-red-800'}`}>
              {permissions.canApprovePropostas ? '✅ Yes' : '❌ No'}
            </p>
          </div>

          <div className={`p-4 rounded ${permissions.canManageSystem ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
            <h3 className="font-medium mb-2">Can Manage System</h3>
            <p className={`text-sm ${permissions.canManageSystem ? 'text-green-800' : 'text-red-800'}`}>
              {permissions.canManageSystem ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}