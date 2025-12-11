import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, AuthGuard } from './core/auth'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './modules/dashboard/Dashboard'
import { QuadroManagement } from './modules/quadro/QuadroManagement'
import { LoginForm } from './components/auth/LoginForm'
import './App.css'
import './components/auth/auth.css'

// Login page component
function LoginPage() {
  const handleLoginSuccess = () => {
    // Redirect to dashboard after successful login
    window.location.href = '/dashboard';
  };

  const handleLoginError = (error: string) => {
    console.error('Login error:', error);
  };

  return (
    <div className="login-page">
      <LoginForm 
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
        redirectUri={`${window.location.origin}/auth/callback`}
      />
    </div>
  );
}

// OAuth callback page
function AuthCallbackPage() {
  React.useEffect(() => {
    // The LoginForm component will handle the OAuth callback
    // This page just renders the form which will process the code
  }, []);

  return (
    <div className="auth-callback-page">
      <LoginForm 
        onSuccess={() => window.location.href = '/dashboard'}
        onError={(error) => {
          console.error('OAuth callback error:', error);
          window.location.href = '/login';
        }}
        redirectUri={`${window.location.origin}/auth/callback`}
      />
    </div>
  );
}

// Unauthorized page
function UnauthorizedPage() {
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-content">
        <h1>Access Denied</h1>
        <p>You don't have permission to access this resource.</p>
        <a href="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <AuthGuard>
                <Navigate to="/dashboard" replace />
              </AuthGuard>
            } />
            
            <Route path="/dashboard" element={
              <AuthGuard>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </AuthGuard>
            } />
            
            <Route path="/quadro" element={
              <AuthGuard requiredPermissions={['quadro_vagas:quadro:read']}>
                <AppShell>
                  <QuadroManagement />
                </AppShell>
              </AuthGuard>
            } />
            
            {/* Additional protected routes will be added as modules are implemented */}
            <Route path="*" element={
              <AuthGuard>
                <Navigate to="/dashboard" replace />
              </AuthGuard>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App