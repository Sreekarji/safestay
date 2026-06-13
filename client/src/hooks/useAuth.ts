import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, token, isAuthenticated, loading, error, login, register, logout, checkAuth, clearError } = useAuthStore();
  return { user, token, isAuthenticated, loading, error, login, register, logout, checkAuth, clearError };
}
