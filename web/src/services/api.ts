import axios, { type AxiosInstance } from 'axios';

const API_BASE_URL = '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

