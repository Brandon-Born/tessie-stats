import { apiClient } from '@/services/api';

export interface AuthStatusResponse {
  isAuthenticated: boolean;
}

export const authService = {
  async getStatus(): Promise<AuthStatusResponse> {
    const response = await apiClient.get<AuthStatusResponse>('/auth/status');
    return response.data;
  },
};

