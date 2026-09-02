import { create } from 'zustand';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt: number;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

// Load initial state from local storage if available
const loadUser = (): UserProfile | null => {
  try {
    const saved = localStorage.getItem('nobar_anon_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  loading: false, // No longer needing async load
  setUser: (user) => {
    if (user) {
      localStorage.setItem('nobar_anon_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nobar_anon_user');
    }
    set({ user });
  },
  setLoading: (loading) => set({ loading }),
}));
