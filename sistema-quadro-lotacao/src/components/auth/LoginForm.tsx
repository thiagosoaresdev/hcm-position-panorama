import React, { useState } from 'react';
import { useAuth } from '../../core/auth';
import type { LoginRequest } from '../../types';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectUri?: string;
}

export function LoginForm({ onSuccess, onError, redirectUri }: LoginFormProps) {
  const { login, loginWithCode, isLoading, requiresTwoFactor } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    twoFactorCode: '',
  });
  const [error, setError] = useState<string>('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  // Check if we have an OAuth code in URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && redirectUri) {
      handleOAuthLogin(code);
    }
  }, [redirectUri]);

  const handleOAuthLogin = async (code: string) => {
    try {
      setError('');
      const response = await loginWithCode(code, redirectUri!);
      
      if (response.requiresTwoFactor) {
        setShowTwoFactor(true);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth login failed';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      const response = await login(formData);
      
      if (response.requiresTwoFactor) {
        setShowTwoFactor(true);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.twoFactorCode) {
      setError('Please enter your 2FA code');
      return;
    }

    try {
      setError('');
      const response = await login({
        ...formData,
        twoFactorCode: formData.twoFactorCode,
      });
      
      if (!response.requiresTwoFactor) {
        onSuccess?.();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '2FA verification failed';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getOAuthUrl = () => {
    if (!redirectUri) return '#';
    
    const params = new URLSearchParams({
      client_id: 'QUADRO_VAGAS_APP',
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'profile email openid',
      state: crypto.randomUUID(),
    });

    return `https://api.senior.com.br/auth/oauth/authorize?${params.toString()}`;
  };

  if (showTwoFactor || requiresTwoFactor) {
    return (
      <div className="login-form">
        <div className="login-header">
          <h2>Two-Factor Authentication</h2>
          <p>Please enter your 2FA code to complete login</p>
        </div>

        <form onSubmit={handleTwoFactorSubmit}>
          <div className="form-group">
            <label htmlFor="twoFactorCode">2FA Code</label>
            <input
              type="text"
              id="twoFactorCode"
              name="twoFactorCode"
              value={formData.twoFactorCode || ''}
              onChange={handleInputChange}
              placeholder="Enter 6-digit code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>

          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => {
              setShowTwoFactor(false);
              setFormData(prev => ({ ...prev, twoFactorCode: '' }));
              setError('');
            }}
          >
            Back to Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-form">
      <div className="login-header">
        <h2>Sistema de Gestão de Quadro de Lotação</h2>
        <p>Entre com suas credenciais para acessar o sistema</p>
      </div>

      {/* OAuth Login Button */}
      <div className="oauth-section">
        <a 
          href={getOAuthUrl()}
          className="btn btn-oauth"
          disabled={!redirectUri}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Login with Senior Platform
        </a>
      </div>

      <div className="divider">
        <span>ou</span>
      </div>

      {/* Email/Password Login Form */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="seu.email@empresa.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Digite sua senha"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="login-footer">
        <p>
          <a href="/forgot-password">Esqueceu sua senha?</a>
        </p>
        <p>
          Não tem uma conta? <a href="/register">Cadastre-se</a>
        </p>
      </div>
    </div>
  );
}