import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { joinPresence, listenToPresence } from '../services/presenceService';
import { usePresenceStore } from '../store/presenceStore';

export function usePresence(roomId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.uid;
  const { users, setUsers } = usePresenceStore();

  useEffect(() => {
    if (!roomId || !userId || !user) return;

    // Join presence
    const cleanupPresence = joinPresence(roomId, user);

    // Listen to room presence
    const cleanupListen = listenToPresence(roomId, (presenceUsers) => {
      setUsers(presenceUsers);
    });

    return () => {
      cleanupPresence();
      cleanupListen();
    };
  }, [roomId, userId, setUsers]);

  return { users, onlineCount: Object.values(users).filter(u => u.online).length };
}
