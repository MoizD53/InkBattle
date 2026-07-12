import { create } from 'zustand';
import type { User } from '@scribble/shared';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginAsGuest: (username: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  loginAsGuest: async (username: string) => {
    const res = await fetch('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    
    if (!res.ok) throw new Error('Login failed');
    
    const { token, user } = await res.json();
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  }
}));