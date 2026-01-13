import { create } from 'zustand';

export interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
}));

