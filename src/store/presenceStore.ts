import { create } from 'zustand';

export interface PresenceUser {
  uid: string;
  displayName: string;
  photoURL: string;
  online: boolean;
  joinedAt: number;
  lastSeen: number;
}

interface PresenceState {
  users: Record<string, PresenceUser>;
  setUsers: (users: Record<string, PresenceUser>) => void;
  updateUser: (uid: string, data: Partial<PresenceUser>) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  users: {},
  setUsers: (users) => set({ users }),
  updateUser: (uid, data) => set((state) => ({
    users: {
      ...state.users,
      [uid]: { ...state.users[uid], ...data }
    }
  })),
}));
