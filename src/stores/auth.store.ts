import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CustomUser } from '@/types';

interface AuthState {
  user: CustomUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthActions {
  login: (data: {
    user: CustomUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  logout: () => void;
  setUser: (user: CustomUser) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

export const useAuthStore = create<AuthState & { actions: AuthActions }>()(
  persist(
    (set) => ({
      ...initialState,
      actions: {
        login: ({ user, accessToken, refreshToken }) =>
          set({ user, accessToken, refreshToken }),
        logout: () => {
          // Note: We don't call the logout API endpoint here,
          // that should be done via a react-query mutation.
          // This store action just clears the client state.
          set(initialState);
        },
        setUser: (user) => set({ user }),
        setTokens: ({ accessToken, refreshToken }) =>
          set({ accessToken, refreshToken }),
      },
    }),
    {
      name: 'auth-storage', // Key in localStorage
      storage: createJSONStorage(() => localStorage),
      // Only persist tokens, not the user object
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// Convenience hooks
export const useAuth = () => useAuthStore((state) => state);
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthActions = () => useAuthStore((state) => state.actions);