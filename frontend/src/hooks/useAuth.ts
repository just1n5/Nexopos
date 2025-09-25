import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { token, isAuthenticated, isLoading } = useAuthStore();

  const state = useMemo(() => ({
    token,
    isAuthenticated,
    isLoading,
  }), [token, isAuthenticated, isLoading]);

  return {
    ...state,
    refreshToken: () => {
      // El authStore persiste el token; aquí podríamos disparar un refresh real si fuera necesario
    },
  };
}
