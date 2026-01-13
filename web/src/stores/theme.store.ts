import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'dark' | 'light';

export interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

function applyThemeToDom(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      setMode: (mode) => {
        applyThemeToDom(mode);
        set({ mode });
      },
      toggle: () => {
        const next: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
        applyThemeToDom(next);
        set({ mode: next });
      },
    }),
    {
      name: 'ts_theme',
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Ensure DOM reflects persisted mode
        if (state?.mode) applyThemeToDom(state.mode);
      },
    }
  )
);

