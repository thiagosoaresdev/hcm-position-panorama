import type { AuthTokens } from '../../types';

export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'quadro_vagas_access_token';
  private readonly REFRESH_TOKEN_KEY = 'quadro_vagas_refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'quadro_vagas_token_expiry';
  private readonly TOKEN_TYPE_KEY = 'quadro_vagas_token_type';

  /**
   * Store authentication tokens securely
   */
  setTokens(tokens: AuthTokens): void {
    try {
      // Calculate expiry timestamp
      const expiryTime = Date.now() + (tokens.expiresIn * 1000);

      // Store in localStorage (consider httpOnly cookies for production)
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      localStorage.setItem(this.TOKEN_TYPE_KEY, tokens.tokenType);

      // Set up automatic token refresh
      this.scheduleTokenRefresh(tokens.expiresIn);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Get token type (usually 'Bearer')
   */
  getTokenType(): string {
    try {
      return localStorage.getItem(this.TOKEN_TYPE_KEY) || 'Bearer';
    } catch (error) {
      console.error('Failed to get token type:', error);
      return 'Bearer';
    }
  }

  /**
   * Get all stored tokens
   */
  getTokens(): AuthTokens | null {
    try {
      const accessToken = this.getAccessToken();
      const refreshToken = this.getRefreshToken();
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      const tokenType = this.getTokenType();

      if (!accessToken || !refreshToken || !expiryTime) {
        return null;
      }

      const expiresIn = Math.max(0, Math.floor((parseInt(expiryTime) - Date.now()) / 1000));

      return {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType,
      };
    } catch (error) {
      console.error('Failed to get tokens:', error);
      return null;
    }
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired(): boolean {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) {
        return true;
      }

      // Add 5 minute buffer to prevent edge cases
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      return Date.now() >= (parseInt(expiryTime) - bufferTime);
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  /**
   * Check if tokens exist
   */
  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      localStorage.removeItem(this.TOKEN_TYPE_KEY);

      // Clear any scheduled refresh
      this.clearTokenRefresh();
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Get authorization header value
   */
  getAuthorizationHeader(): string | null {
    const accessToken = this.getAccessToken();
    const tokenType = this.getTokenType();

    if (!accessToken) {
      return null;
    }

    return `${tokenType} ${accessToken}`;
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    // Clear any existing refresh timer
    this.clearTokenRefresh();

    // Schedule refresh 5 minutes before expiry
    const refreshTime = Math.max(0, (expiresIn - 300) * 1000); // 5 minutes before expiry

    const timeoutId = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('auth:token-refresh-needed'));
    }, refreshTime);

    // Store timeout ID for cleanup
    (window as any).__tokenRefreshTimeout = timeoutId;
  }

  /**
   * Clear scheduled token refresh
   */
  private clearTokenRefresh(): void {
    const timeoutId = (window as any).__tokenRefreshTimeout;
    if (timeoutId) {
      clearTimeout(timeoutId);
      delete (window as any).__tokenRefreshTimeout;
    }
  }

  /**
   * Update access token (after refresh)
   */
  updateAccessToken(accessToken: string, expiresIn: number): void {
    try {
      const expiryTime = Date.now() + (expiresIn * 1000);

      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

      // Schedule next refresh
      this.scheduleTokenRefresh(expiresIn);
    } catch (error) {
      console.error('Failed to update access token:', error);
      throw new Error('Failed to update access token');
    }
  }

  /**
   * Get time until token expires (in seconds)
   */
  getTimeUntilExpiry(): number {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) {
        return 0;
      }

      return Math.max(0, Math.floor((parseInt(expiryTime) - Date.now()) / 1000));
    } catch (error) {
      console.error('Failed to get time until expiry:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const tokenService = new TokenService();