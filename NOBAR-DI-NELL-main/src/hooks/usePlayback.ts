import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { usePlaybackStore, PlaybackStateDoc } from '../store/playbackStore';

export function usePlayback(roomId: string | undefined) {
  const { playbackState, setPlaybackState } = usePlaybackStore();

  useEffect(() => {
    if (!roomId) return;

    const playbackRef = doc(db, `rooms/${roomId}/playback`, 'state');
    
    const unsubscribe = onSnapshot(playbackRef, (docSnap) => {
      if (docSnap.exists()) {
        setPlaybackState(docSnap.data() as PlaybackStateDoc);
      }
    });

    return () => unsubscribe();
  }, [roomId, setPlaybackState]);

  return { playbackState };
}
