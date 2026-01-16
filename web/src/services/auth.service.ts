import { apiClient } from '@/services/api';

export interface AuthStatusResponse {
  authenticated: boolean;
  hasToken: boolean;
  message?: string;
}

export interface AuthUrlResponse {
  url: string;
}

export interface DeleteTokenResponse {
  success: boolean;
  message: string;
}

export interface LoginResponse {
  accessToken: string;
  message: string;
}

export interface AuthScopesResponse {
  scopes: string[] | null;
}

const TOKEN_KEY = 'tessie_auth_token';

export const authService = {
  /**
   * Login with password and store JWT
   */
  async login(password: string): Promise<void> {
    const response = await apiClient.post<LoginResponse>('/auth/login', { password });
    localStorage.setItem(TOKEN_KEY, response.data.accessToken);
  },

  /**
   * Logout and remove JWT
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  },

  /**
   * Get Tesla authentication status
   */
  async getStatus(): Promise<AuthStatusResponse> {
    const response = await apiClient.get<AuthStatusResponse>('/auth/status');
    return response.data;
  },

  /**
   * Get Tesla OAuth URL
   */
  async getAuthUrl(): Promise<AuthUrlResponse> {
    const response = await apiClient.get<AuthUrlResponse>('/auth/url');
    return response.data;
  },

  /**
   * Delete Tesla token
   */
  async deleteToken(): Promise<DeleteTokenResponse> {
    const response = await apiClient.delete<DeleteTokenResponse>('/auth/token');
    return response.data;
  },

  /**
   * Get Tesla OAuth scopes from access token
   */
  async getScopes(): Promise<AuthScopesResponse> {
    const response = await apiClient.get<AuthScopesResponse>('/auth/scopes');
    return response.data;
  },
};

