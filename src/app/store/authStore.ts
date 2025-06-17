import { AuthState } from '@/index';
import { create } from 'zustand';

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  loading: false,
  authError: null,
  userData: null,
  setUser: user => set({ user }),
  setUserData: userData => set({ userData }),
  setLoading: loading => set({ loading }),
  setAuthError: authError => set({ authError }),
}));
