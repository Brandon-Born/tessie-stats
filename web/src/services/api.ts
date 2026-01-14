import axios, { type AxiosInstance } from 'axios';

const API_BASE_URL = '/api';
const TOKEN_KEY = 'tessie_auth_token';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses by redirecting to login (only for JWT auth failures)
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Only log out if it's a JWT authentication failure (from our backend)
      // Check if the response contains our JWT auth error messages
      const responseData = error.response.data as { message?: unknown };
      const errorMessage = responseData?.message;
      const isJwtAuthFailure =
        typeof errorMessage === 'string' &&
        (errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid token'));

      if (isJwtAuthFailure) {
        // Clear token and redirect to login
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
