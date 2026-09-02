import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();
  
  // Since we load synchronously from localStorage, we don't need the observer anymore
  return { user, loading, setUser, setLoading };
}
