import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRoomStore, RoomDocument } from '../store/roomStore';
import { useAuth } from './useAuth';

export function useRoom(roomId: string | undefined) {
  const { room, setRoom, setLoading, setError } = useRoomStore();
  const { user } = useAuth();
  const userId = user?.uid;

  useEffect(() => {
    if (!roomId || !userId) return;

    setLoading(true);
    const roomRef = doc(db, 'rooms', roomId);
    
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoom(docSnap.data() as RoomDocument);
        setError(null);
      } else {
        setRoom(null);
        setError('Room not found');
      }
      setLoading(false);
    }, (err) => {
      console.error("Room sync error:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, userId, setRoom, setLoading, setError]);

  const isHost = Boolean(user && room && room.hostId === user.uid);

  return { room, loading: useRoomStore(state => state.loading), error: useRoomStore(state => state.error), isHost };
}
