import { create } from 'zustand';

export interface PlaybackStateDoc {
  mediaUrl: string;
  mediaType: 'video' | 'audio' | 'hls' | 'youtube';
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  updatedAt: any;
  playbackVersion: number;
  commandId: string;
  command: 'PLAY' | 'PAUSE' | 'SEEK' | 'NEXT' | 'PREVIOUS' | 'CHANGE_MEDIA';
  updatedBy: string;
}

interface PlaybackStoreState {
  playbackState: PlaybackStateDoc | null;
  setPlaybackState: (state: PlaybackStateDoc | null) => void;
}

export const usePlaybackStore = create<PlaybackStoreState>((set) => ({
  playbackState: null,
  setPlaybackState: (state) => set({ playbackState: state }),
}));
