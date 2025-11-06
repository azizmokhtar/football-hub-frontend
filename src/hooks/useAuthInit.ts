import { useEffect, useState } from 'react';
import { useAuth, useAuthActions } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';

export const useAuthInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { accessToken } = useAuth();
  const { setUser, logout } = useAuthActions();

  useEffect(() => {
    const initializeAuth = async () => {
      if (accessToken) {
        try {
          // Token exists, validate it by fetching user profile
          const user = await authService.getProfile();
          setUser(user);
        } catch (error) {
          // Token is invalid or expired
          logout();
        }
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, [accessToken, setUser, logout]);

  return { isInitialized };
};