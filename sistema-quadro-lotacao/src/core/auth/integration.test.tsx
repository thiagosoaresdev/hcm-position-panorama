import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.context';
import { AuthGuard } from './auth.guard';

// Mock the auth service
vi.mock('./auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    validateToken: vi.fn(),
    getUserProfile: vi.fn(),
    refreshToken: vi.fn(),
  }
}));

// Test component that uses auth
function TestComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div>
        <p>Not authenticated</p>
        <button onClick={() => login({ email: 'test@test.com', password: 'password' })}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <p>Welcome {user?.nome}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Protected component for testing AuthGuard
function ProtectedComponent() {
  return <div>Protected content</div>;
}

describe('Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login state when not authenticated', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('should handle login flow', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      user: {
        id: '1',
        nome: 'Test User',
        email: 'test@test.com',
        roles: ['user'],
        permissions: ['read'],
        twoFactorEnabled: false
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer'
      },
      requiresTwoFactor: false
    });

    // Mock the auth service
    const { authService } = await import('./auth.service');
    authService.login = mockLogin;

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password'
      });
    });
  });

  it('should protect routes with AuthGuard', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthGuard>
            <ProtectedComponent />
          </AuthGuard>
        </AuthProvider>
      </BrowserRouter>
    );

    // Should redirect to login since not authenticated
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('should allow access to protected routes when authenticated', async () => {
    // Mock authenticated state
    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer'
    };

    const mockUser = {
      id: '1',
      nome: 'Test User',
      email: 'test@test.com',
      roles: ['user'],
      permissions: ['read'],
      twoFactorEnabled: false
    };

    // Mock localStorage to have tokens
    localStorage.setItem('quadro_vagas_access_token', mockTokens.accessToken);
    localStorage.setItem('quadro_vagas_refresh_token', mockTokens.refreshToken);
    localStorage.setItem('quadro_vagas_token_expiry', (Date.now() + 3600000).toString());
    localStorage.setItem('quadro_vagas_token_type', mockTokens.tokenType);

    // Mock auth service methods
    const { authService } = await import('./auth.service');
    authService.validateToken = vi.fn().mockResolvedValue(true);
    authService.getUserProfile = vi.fn().mockResolvedValue(mockUser);

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthGuard>
            <ProtectedComponent />
          </AuthGuard>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });
  });
});