import { create } from 'zustand';

type Theme = 'dark' | 'light' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>((set) => {
  const saved = localStorage.getItem('theme') as Theme | null;
  const initial = saved || 'system';
  
  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };
  
  applyTheme(initial);

  return {
    theme: initial,
    setTheme: (theme: Theme) => {
      localStorage.setItem('theme', theme);
      applyTheme(theme);
      set((state) => ({ ...state, theme }));
    }
  };
});