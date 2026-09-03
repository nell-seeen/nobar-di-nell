import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile } from '../store/authStore';
import { PresenceUser } from '../store/presenceStore';

export const joinPresence = (roomId: string, user: UserProfile) => {
  const presenceRef = doc(db, `rooms/${roomId}/presence/${user.uid}`);
  
  const updatePresence = () => {
    setDoc(presenceRef, {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      online: true,
      lastSeen: serverTimestamp()
    }, { merge: true }).catch(console.error);
  };
  
  // Initial update
  updatePresence();
  
  // Heartbeat every 15 seconds
  const interval = setInterval(updatePresence, 15000);
  
  const handleBeforeUnload = () => {
    setDoc(presenceRef, { online: false, lastSeen: serverTimestamp() }, { merge: true });
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    clearInterval(interval);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    setDoc(presenceRef, { online: false, lastSeen: serverTimestamp() }, { merge: true });
  };
};

export const listenToPresence = (roomId: string, callback: (users: Record<string, PresenceUser>) => void) => {
  const presenceCol = collection(db, `rooms/${roomId}/presence`);
  
  let latestData: Record<string, any> = {};

  const emit = () => {
    const users: Record<string, PresenceUser> = {};
    const now = Date.now();
    
    Object.values(latestData).forEach(data => {
      // If serverTimestamp is pending, it might lack toMillis()
      const lastSeen = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : now;
      const isOnline = data.online !== false && (now - lastSeen < 35000);
      
      users[data.uid] = {
        uid: data.uid,
        displayName: data.displayName,
        photoURL: data.photoURL,
        online: isOnline,
        joinedAt: data.joinedAt || lastSeen,
        lastSeen: lastSeen
      };
    });
    
    callback(users);
  };

  const unsubscribe = onSnapshot(presenceCol, (snapshot) => {
    latestData = {};
    snapshot.forEach(docSnap => {
      latestData[docSnap.id] = docSnap.data();
    });
    emit();
  });

  // Re-evaluate staleness every 10 seconds
  const interval = setInterval(emit, 10000);

  return () => {
    unsubscribe();
    clearInterval(interval);
  };
};
