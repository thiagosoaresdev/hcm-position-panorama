import React, { useState } from 'react';
import { useAuth, PermissionGuard } from '../../core/auth';

/**
 * Example component demonstrating authentication system usage
 */
export function AuthExample() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout, 
    hasPermission, 
    hasRole,
    setupTwoFactor,
    enableTwoFactor
  } = useAuth();

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    twoFactorCode: ''
  });
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSetupTwoFactor = async () => {
    try {
      const setup = await setupTwoFactor();
      setQrCode(setup.qrCode);
      setShowTwoFactorSetup(true);
    } catch (error) {
      console.error('2FA setup failed:', error);
    }
  };

  const handleEnable2FA = async (code: string) => {
    try {
      await enableTwoFactor(code);
      setShowTwoFactorSetup(false);
      alert('2FA enabled successfully!');
    } catch (error) {
      console.error('2FA enable failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-example">
        <div className="loading">
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-example">
        <div className="login-section">
          <h2>Login Required</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="twoFactorCode">2FA Code (optional):</label>
              <input
                type="text"
                id="twoFactorCode"
                value={loginForm.twoFactorCode}
                onChange={(e) => setLoginForm(prev => ({ ...prev, twoFactorCode: e.target.value }))}
                placeholder="000000"
                maxLength={6}
              />
            </div>
            
            <button type="submit" className="btn btn-primary">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-example">
      <div className="user-info">
        <h2>Welcome, {user?.nome}!</h2>
        <p>Email: {user?.email}</p>
        <p>Roles: {user?.roles.join(', ')}</p>
        <p>2FA Enabled: {user?.twoFactorEnabled ? 'Yes' : 'No'}</p>
        
        <div className="actions">
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
          
          {!user?.twoFactorEnabled && (
            <button onClick={handleSetupTwoFactor} className="btn btn-primary">
              Setup 2FA
            </button>
          )}
        </div>
      </div>

      {showTwoFactorSetup && (
        <div className="two-factor-setup">
          <h3>Setup Two-Factor Authentication</h3>
          {qrCode && (
            <div className="qr-code">
              <img src={qrCode} alt="2FA QR Code" />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="verificationCode">Enter verification code:</label>
            <input
              type="text"
              id="verificationCode"
              placeholder="000000"
              maxLength={6}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const code = (e.target as HTMLInputElement).value;
                  if (code.length === 6) {
                    handleEnable2FA(code);
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="permissions-demo">
        <h3>Permission-Based Content</h3>
        
        <PermissionGuard 
          permissions={['quadro_vagas:quadro:read']}
          fallback={<p>You don't have permission to view quadro data.</p>}
        >
          <div className="permission-content">
            <p>✅ You can view quadro data!</p>
          </div>
        </PermissionGuard>

        <PermissionGuard 
          permissions={['quadro_vagas:quadro:create']}
          fallback={<p>You don't have permission to create vagas.</p>}
        >
          <div className="permission-content">
            <p>✅ You can create new vagas!</p>
            <button className="btn btn-primary">Create Vaga</button>
          </div>
        </PermissionGuard>

        <PermissionGuard 
          roles={['admin']}
          fallback={<p>Admin-only content is hidden.</p>}
        >
          <div className="permission-content">
            <p>✅ Admin content visible!</p>
            <button className="btn btn-danger">Admin Actions</button>
          </div>
        </PermissionGuard>
      </div>

      <div className="permission-checks">
        <h3>Permission Checks</h3>
        <ul>
          <li>Can read quadro: {hasPermission('quadro_vagas:quadro:read') ? '✅' : '❌'}</li>
          <li>Can create quadro: {hasPermission('quadro_vagas:quadro:create') ? '✅' : '❌'}</li>
          <li>Can update quadro: {hasPermission('quadro_vagas:quadro:update') ? '✅' : '❌'}</li>
          <li>Can delete quadro: {hasPermission('quadro_vagas:quadro:delete') ? '✅' : '❌'}</li>
          <li>Is Admin: {hasRole('admin') ? '✅' : '❌'}</li>
          <li>Is RH Manager: {hasRole('rh_manager') ? '✅' : '❌'}</li>
          <li>Is Coordinator: {hasRole('coordinator') ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  );
}