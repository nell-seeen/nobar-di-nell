import { useEffect, useState } from 'react';
import { listenToPlaylist, PlaylistItem, addToPlaylist, removeFromPlaylist } from '../services/playlistService';

export function usePlaylist(roomId: string | undefined) {
  const [items, setItems] = useState<PlaylistItem[]>([]);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = listenToPlaylist(roomId, setItems);
    return () => unsubscribe();
  }, [roomId]);

  return { items, addToPlaylist, removeFromPlaylist };
}
