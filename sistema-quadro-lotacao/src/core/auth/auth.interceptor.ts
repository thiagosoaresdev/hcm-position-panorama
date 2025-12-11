import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { tokenService } from './token.service';
import { authService } from './auth.service';

/**
 * HTTP Client with automatic token management
 */
export class AuthenticatedHttpClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => this.handleResponse(response),
      (error) => this.handleResponseError(error)
    );
  }

  /**
   * Handle outgoing requests
   */
  private handleRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    // Add request ID for tracing
    config.headers = config.headers || {};
    config.headers['X-Request-ID'] = crypto.randomUUID();

    // Add timestamp
    config.headers['X-Request-Time'] = new Date().toISOString();

    // Add auth token if available and not already present
    if (!config.headers['Authorization']) {
      const authHeader = tokenService.getAuthorizationHeader();
      if (authHeader) {
        config.headers['Authorization'] = authHeader;
      }
    }

    // Add CSRF token if available
    const csrfToken = this.getCSRFToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  }

  /**
   * Handle successful responses
   */
  private handleResponse(response: AxiosResponse): AxiosResponse {
    // Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }

    return response;
  }

  /**
   * Handle response errors
   */
  private async handleResponseError(error: AxiosError): Promise<any> {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - ${error.response?.status}`);
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (this.isRefreshing) {
        // If already refreshing, queue the request
        return new Promise((resolve, reject) => {
          this.failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return this.client(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      this.isRefreshing = true;

      try {
        const refreshToken = tokenService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt to refresh token
        const newTokens = await authService.refreshToken(refreshToken);
        tokenService.updateAccessToken(newTokens.accessToken, newTokens.expiresIn);

        // Process queued requests
        this.processQueue(newTokens.accessToken, null);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
        }

        return this.client(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        this.processQueue(null, refreshError);
        tokenService.clearTokens();
        
        // Emit event for auth context to handle
        window.dispatchEvent(new CustomEvent('auth:token-expired'));
        
        return Promise.reject(refreshError);
      } finally {
        this.isRefreshing = false;
      }
    }

    // Handle 403 Forbidden - insufficient permissions
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent('auth:access-denied', {
        detail: {
          url: originalRequest.url,
          method: originalRequest.method,
          message: error.response.data?.message || 'Access denied'
        }
      }));
    }

    // Handle 429 Too Many Requests - rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter && !originalRequest._retry) {
        originalRequest._retry = true;
        const delay = parseInt(retryAfter) * 1000;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.client(originalRequest);
      }
    }

    // Handle network errors
    if (!error.response) {
      window.dispatchEvent(new CustomEvent('network:error', {
        detail: {
          message: 'Network error - please check your connection',
          error: error.message
        }
      }));
    }

    return Promise.reject(error);
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(token: string | null, error: any): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * Get CSRF token from meta tag or cookie
   */
  private getCSRFToken(): string | null {
    // Try to get from meta tag first
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }

    // Try to get from cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }

    return null;
  }

  /**
   * Make GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  /**
   * Make POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  /**
   * Make PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  /**
   * Make PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  /**
   * Make DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  /**
   * Get the underlying axios instance
   */
  getInstance(): AxiosInstance {
    return this.client;
  }

  /**
   * Update base URL
   */
  setBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }

  /**
   * Set default timeout
   */
  setTimeout(timeout: number): void {
    this.client.defaults.timeout = timeout;
  }

  /**
   * Add custom header
   */
  setHeader(name: string, value: string): void {
    this.client.defaults.headers.common[name] = value;
  }

  /**
   * Remove custom header
   */
  removeHeader(name: string): void {
    delete this.client.defaults.headers.common[name];
  }
}

// Create and export default instance
export const httpClient = new AuthenticatedHttpClient();

// Export factory function for creating new instances
export function createHttpClient(baseURL?: string): AuthenticatedHttpClient {
  return new AuthenticatedHttpClient(baseURL);
}

/**
 * Utility function to setup axios defaults for the entire app
 */
export function setupAxiosDefaults(): void {
  // Set default base URL
  axios.defaults.baseURL = '/api';

  // Set default timeout
  axios.defaults.timeout = 30000;

  // Set default headers
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  axios.defaults.headers.common['Accept'] = 'application/json';

  // Add request interceptor to default axios instance
  axios.interceptors.request.use(
    (config) => {
      // Add auth token
      const authHeader = tokenService.getAuthorizationHeader();
      if (authHeader && !config.headers['Authorization']) {
        config.headers['Authorization'] = authHeader;
      }

      // Add request ID
      config.headers['X-Request-ID'] = crypto.randomUUID();

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to default axios instance
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:token-expired'));
      }
      return Promise.reject(error);
    }
  );
}