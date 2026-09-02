import { useEffect, useState } from 'react';
import { listenToPlaylist, PlaylistItem, addToPlaylist, removeFromPlaylist } from '../services/playlistService';
import { useAuth } from './useAuth';

export function usePlaylist(roomId: string | undefined) {
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const { user } = useAuth();
  const userId = user?.uid;

  useEffect(() => {
    if (!roomId || !userId) return;
    const unsubscribe = listenToPlaylist(roomId, setItems);
    return () => unsubscribe();
  }, [roomId, userId]);

  return { items, addToPlaylist, removeFromPlaylist };
}
