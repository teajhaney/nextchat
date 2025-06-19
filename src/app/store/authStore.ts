import { AuthState } from '@/index';
import { create } from 'zustand';

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  loading: true,
  googleLoading: false,
  authError: null,
  userData: null,
  otherUserData: [],
  setUser: user => set({ user, loading: false }),
  setUserData: userData => set({ userData }),
  setOtherUserData: otherUserData => set({ otherUserData }),
  setLoading: loading => set({ loading }),
  setGoogleLoading: googleLoading => set({ googleLoading }),
  setAuthError: authError => set({ authError }),
  clearAuth: () =>
    set({
      user: null,
      loading: false,
      authError: null,
      userData: null,
    }),
}));
