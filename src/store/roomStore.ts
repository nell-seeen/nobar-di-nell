import { create } from 'zustand';

export interface RoomSettings {
  chatEnabled: boolean;
  reactionEnabled: boolean;
  viewerControl: boolean;
  playlistModification: boolean;
}

export interface RoomDocument {
  id: string;
  name: string;
  hostId: string;
  createdAt: any;
  updatedAt: any;
  locked: boolean;
  maxUsers: number;
  settings: RoomSettings;
  bannedUsers: string[];
  isPublic?: boolean;
}

interface RoomState {
  room: RoomDocument | null;
  loading: boolean;
  error: string | null;
  setRoom: (room: RoomDocument | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  loading: false,
  error: null,
  setRoom: (room) => set({ room }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
