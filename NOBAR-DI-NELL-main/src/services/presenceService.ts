import { ref, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { UserProfile } from '../store/authStore';
import { PresenceUser } from '../store/presenceStore';

export const joinPresence = (roomId: string, user: UserProfile) => {
  const presenceRef = ref(rtdb, `presence/${roomId}/${user.uid}`);
  
  const connectedRef = ref(rtdb, '.info/connected');
  
  const unsubscribe = onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      const presenceData: PresenceUser = {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        online: true,
        joinedAt: Date.now(),
        lastSeen: Date.now()
      };
      
      // When disconnected, update online status and lastSeen
      onDisconnect(presenceRef).update({
        online: false,
        lastSeen: rtdbServerTimestamp()
      }).then(() => {
        // Set presence to true
        set(presenceRef, presenceData);
      });
    }
  });

  return () => {
    unsubscribe();
    set(presenceRef, {
      ...user,
      online: false,
      lastSeen: rtdbServerTimestamp()
    });
  };
};

export const listenToPresence = (roomId: string, callback: (users: Record<string, PresenceUser>) => void) => {
  const roomPresenceRef = ref(rtdb, `presence/${roomId}`);
  const unsubscribe = onValue(roomPresenceRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
  return unsubscribe;
};
