import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { usePlaybackStore, PlaybackStateDoc } from '../store/playbackStore';
import { useAuth } from './useAuth';

export function usePlayback(roomId: string | undefined) {
  const { playbackState, setPlaybackState } = usePlaybackStore();
  const { user } = useAuth();
  const userId = user?.uid;

  useEffect(() => {
    if (!roomId || !userId) return;

    const playbackRef = doc(db, `rooms/${roomId}/playback`, 'state');
    
    const unsubscribe = onSnapshot(playbackRef, (docSnap) => {
      if (docSnap.exists()) {
        setPlaybackState(docSnap.data() as PlaybackStateDoc);
      }
    });

    return () => unsubscribe();
  }, [roomId, userId, setPlaybackState]);

  return { playbackState };
}
